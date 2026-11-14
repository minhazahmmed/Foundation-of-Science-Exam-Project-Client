import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { getErrorMessage } from '../../api/axios.js';
import { saveAnswer, startAttempt, submitAttempt } from '../../api/attempts.api.js';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';
import ErrorBox from '../../components/common/ErrorBox.jsx';
import Loader from '../../components/common/Loader.jsx';
import ExamTimer from '../../components/exam/ExamTimer.jsx';
import QuestionPalette from '../../components/exam/QuestionPalette.jsx';
import QuestionView from '../../components/question/QuestionView.jsx';
import useCountdown from '../../hooks/useCountdown.js';
import useFetch from '../../hooks/useFetch.js';
import { toBn } from '../../utils/format.js';

// প্রথমে সার্ভার থেকে পরীক্ষা শুরু করে নেয় (আগে শুরু করা থাকলে সেটাই চালিয়ে যায়)
export default function TakeExam() {
  const { code } = useParams();
  const fetcher = useCallback(() => startAttempt(code), [code]);
  const { data, error, loading, reload } = useFetch(fetcher);

  if (loading) return <Loader text="পরীক্ষা তৈরি হচ্ছে..." />;
  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <ErrorBox message={error} onRetry={reload} />
      </div>
    );
  }
  if (data.alreadySubmitted) return <Navigate to={`/result/${data.attemptId}`} replace />;

  return <ExamRunner data={data} />;
}

function ExamRunner({ data }) {
  const { attemptId, exam, questions, expiresAt, serverNow, savedAnswers } = data;
  const navigate = useNavigate();

  // { প্রশ্নের আইডি: অপশন নম্বর }
  const [answers, setAnswers] = useState(() =>
    Object.fromEntries(savedAnswers.map((a) => [a.question, a.selectedIndex]))
  );
  const [current, setCurrent] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const submittedRef = useRef(false);

  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  });

  const submit = useCallback(
    async (auto = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      setConfirmOpen(false);

      // শেষবারের মতো সব উত্তর একসাথে পাঠানো হয়, যাতে কোনোটা সেভ না হয়ে থাকলেও হারায় না
      const list = Object.entries(answersRef.current).map(([questionId, selectedIndex]) => ({
        questionId,
        selectedIndex,
      }));

      try {
        await submitAttempt(attemptId, list);
        if (auto) toast('সময় শেষ, পরীক্ষা জমা হয়ে গেছে', { icon: '⏰' });
        navigate(`/result/${attemptId}`, { replace: true });
      } catch (err) {
        // সার্ভার যদি বলে পরীক্ষা আগেই জমা হয়ে গেছে, তাহলে ফলাফলই দেখাই
        if (err.response?.status === 409) {
          navigate(`/result/${attemptId}`, { replace: true });
          return;
        }
        submittedRef.current = false;
        setSubmitting(false);
        toast.error(getErrorMessage(err));
      }
    },
    [attemptId, navigate]
  );

  const secondsLeft = useCountdown({ expiresAt, serverNow, onExpire: () => submit(true) });

  // ভুল করে পেজ বন্ধ করতে গেলে সাবধান করে
  useEffect(() => {
    const warn = (e) => {
      if (submittedRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  function selectAnswer(questionId, index) {
    // একই অপশনে আবার চাপলে উত্তর মুছে যায়
    const next = answers[questionId] === index ? null : index;
    setAnswers((prev) => ({ ...prev, [questionId]: next }));

    saveAnswer(attemptId, { questionId, selectedIndex: next })
      .then(() => setSaveFailed(false))
      .catch(() => setSaveFailed(true));
  }

  const question = questions[current];
  const answeredCount = questions.filter((q) => Number.isInteger(answers[q._id])).length;
  const unanswered = questions.length - answeredCount;
  const isLast = current === questions.length - 1;

  return (
    <div className="min-h-screen bg-base-200">
      <header className="sticky top-0 z-30 border-b border-base-300 bg-base-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <img src="/logo.png" alt="" className="h-8 w-8 shrink-0" />
            <div className="min-w-0">
              <h1 className="truncate font-bold leading-tight">{exam.title}</h1>
              <p className="text-xs text-base-content/85">
                উত্তর দিয়েছ {toBn(answeredCount)}/{toBn(questions.length)}
              </p>
            </div>
          </div>
          <ExamTimer secondsLeft={secondsLeft} />
        </div>
        <progress className="progress progress-primary block h-1 w-full rounded-none" value={answeredCount} max={questions.length} aria-hidden="true" />
      </header>

      <main className="mx-auto max-w-3xl px-4 py-5">
        {saveFailed && (
          <div role="alert" className="alert alert-warning alert-soft mb-4 text-sm">
            <FiAlertTriangle aria-hidden="true" />
            <span>উত্তর সার্ভারে সেভ হয়নি, নেট চেক করো। জমা দেওয়ার সময় আবার পাঠানো হবে।</span>
          </div>
        )}

        <section className="rounded-box border border-base-300 bg-base-100 p-4 sm:p-6">
          <QuestionView
            key={question._id}
            question={question}
            number={current + 1}
            mode="exam"
            selectedIndex={Number.isInteger(answers[question._id]) ? answers[question._id] : null}
            onSelect={(index) => selectAnswer(question._id, index)}
          />
        </section>

        <div className="mt-4 flex gap-2">
          <button type="button" className="btn flex-1" onClick={() => setCurrent((c) => c - 1)} disabled={current === 0}>
            <FiChevronLeft aria-hidden="true" /> আগের প্রশ্ন
          </button>
          {isLast ? (
            <button type="button" className="btn btn-primary flex-1" onClick={() => setConfirmOpen(true)} disabled={submitting}>
              পরীক্ষা জমা দাও
            </button>
          ) : (
            <button type="button" className="btn btn-primary flex-1" onClick={() => setCurrent((c) => c + 1)}>
              পরের প্রশ্ন <FiChevronRight aria-hidden="true" />
            </button>
          )}
        </div>

        <section className="mt-6 rounded-box border border-base-300 bg-base-100 p-4">
          <h2 className="mb-3 text-sm font-semibold">সব প্রশ্ন একনজরে</h2>
          <QuestionPalette questions={questions} answers={answers} current={current} onJump={setCurrent} />
          <button type="button" className="btn btn-outline btn-primary mt-4 w-full" onClick={() => setConfirmOpen(true)} disabled={submitting}>
            পরীক্ষা জমা দাও
          </button>
        </section>
      </main>

      <ConfirmModal
        open={confirmOpen}
        title="পরীক্ষা জমা দেবে?"
        message={
          unanswered > 0
            ? `তুমি এখনো ${toBn(unanswered)}টা প্রশ্নের উত্তর দাওনি। জমা দিলে আর বদলানো যাবে না।`
            : 'সবগুলো প্রশ্নের উত্তর দিয়েছ। জমা দিলে আর বদলানো যাবে না।'
        }
        confirmText="হ্যাঁ, জমা দাও"
        cancelText="আরেকবার দেখি"
        loading={submitting}
        onConfirm={() => submit(false)}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
