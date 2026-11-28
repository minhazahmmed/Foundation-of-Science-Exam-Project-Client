import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getErrorMessage } from '../../api/axios.js';
import { startDemo, submitDemo } from '../../api/demo.api.js';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';
import ErrorBox from '../../components/common/ErrorBox.jsx';
import Loader from '../../components/common/Loader.jsx';
import ExamTimer from '../../components/exam/ExamTimer.jsx';
import QuestionPalette from '../../components/exam/QuestionPalette.jsx';
import QuestionView from '../../components/question/QuestionView.jsx';
import useCountdown from '../../hooks/useCountdown.js';
import useFetch from '../../hooks/useFetch.js';
import { toBn } from '../../utils/format.js';

// ডেমো পরীক্ষা: আসল পরীক্ষার মতো সময় চলে, কিন্তু কিছুই সেভ হয় না
export default function DemoExam() {
  const { examId } = useParams();
  const fetcher = useCallback(() => startDemo(examId), [examId]);
  const { data, error, loading, reload } = useFetch(fetcher);

  if (loading) return <Loader text="ডেমো পরীক্ষা তৈরি হচ্ছে..." />;
  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <ErrorBox message={error} onRetry={reload} />
        <Link to="/demo" className="btn btn-ghost mt-3">
          ফিরে যাও
        </Link>
      </div>
    );
  }
  return <Runner data={data} />;
}

function Runner({ data }) {
  const { exam, questions, expiresAt, serverNow } = data;
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const doneRef = useRef(false);
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  });

  const submit = useCallback(
    async (auto = false) => {
      if (doneRef.current) return;
      doneRef.current = true;
      setSubmitting(true);
      setConfirmOpen(false);
      const list = Object.entries(answersRef.current).map(([questionId, selectedIndex]) => ({ questionId, selectedIndex }));
      try {
        const result = await submitDemo(exam._id, list);
        if (auto) toast('সময় শেষ, ডেমো জমা হয়ে গেছে', { icon: '⏰' });
        navigate('/demo-result', { replace: true, state: { result } });
      } catch (err) {
        doneRef.current = false;
        setSubmitting(false);
        toast.error(getErrorMessage(err));
      }
    },
    [exam._id, navigate]
  );

  const secondsLeft = useCountdown({ expiresAt, serverNow, onExpire: () => submit(true) });

  useEffect(() => {
    const warn = (e) => {
      if (doneRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const selectAnswer = (id, index) => setAnswers((prev) => ({ ...prev, [id]: prev[id] === index ? null : index }));

  const question = questions[current];
  const answeredCount = questions.filter((q) => Number.isInteger(answers[q._id])).length;
  const unanswered = questions.length - answeredCount;
  const isLast = current === questions.length - 1;

  return (
    <div className="min-h-screen bg-base-200">
      <header className="sticky top-0 z-30 border-b border-base-300 bg-base-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="min-w-0">
            <p className="inline-block rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-content">ডেমো</p>
            <h1 className="truncate font-bold leading-tight">{exam.title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ExamTimer secondsLeft={secondsLeft} />
            <button type="button" className="btn btn-ghost btn-sm btn-square" aria-label="ডেমো ছেড়ে দাও" onClick={() => setLeaveOpen(true)}>
              <FiX size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
        <progress className="progress progress-primary block h-1 w-full rounded-none" value={answeredCount} max={questions.length} aria-hidden="true" />
      </header>

      <main className="mx-auto max-w-3xl px-4 py-5">
        <p className="mb-3 rounded-box bg-base-100 px-4 py-2 text-sm">
          এটা ডেমো পরীক্ষা, নম্বর কোথাও জমা হবে না। উত্তর দিয়েছ {toBn(answeredCount)}/{toBn(questions.length)}।
        </p>

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
              ডেমো জমা দাও
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
            ডেমো জমা দাও
          </button>
        </section>
      </main>

      <ConfirmModal
        open={confirmOpen}
        title="ডেমো জমা দেবে?"
        message={unanswered > 0 ? `তুমি এখনো ${toBn(unanswered)}টা প্রশ্নের উত্তর দাওনি।` : 'সবগুলো প্রশ্নের উত্তর দিয়েছ।'}
        confirmText="হ্যাঁ, জমা দাও"
        cancelText="আরেকবার দেখি"
        loading={submitting}
        onConfirm={() => submit(false)}
        onCancel={() => setConfirmOpen(false)}
      />
      <ConfirmModal
        open={leaveOpen}
        title="ডেমো ছেড়ে দেবে?"
        message="এখানকার উত্তরগুলো থাকবে না।"
        confirmText="হ্যাঁ, ছেড়ে দাও"
        cancelText="চালিয়ে যাই"
        onConfirm={() => {
          doneRef.current = true;
          navigate('/demo', { replace: true });
        }}
        onCancel={() => setLeaveOpen(false)}
      />
    </div>
  );
}
