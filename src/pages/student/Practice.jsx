import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getErrorMessage } from '../../api/axios.js';
import { startPractice, submitPractice } from '../../api/practice.api.js';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';
import ErrorBox from '../../components/common/ErrorBox.jsx';
import Loader from '../../components/common/Loader.jsx';
import QuestionPalette from '../../components/exam/QuestionPalette.jsx';
import QuestionView from '../../components/question/QuestionView.jsx';
import useFetch from '../../hooks/useFetch.js';
import { toBn } from '../../utils/format.js';

const clock = (s) => `${toBn(String(Math.floor(s / 60)).padStart(2, '0'))}:${toBn(String(s % 60).padStart(2, '0'))}`;

// অনুশীলন পরীক্ষা: একই প্রশ্ন, সময়ের চাপ নেই। ফল লিডারবোর্ডে যায় না, শুধু নিজের অগ্রগতিতে জমা হয়।
export default function Practice() {
  const { attemptId } = useParams();
  const fetcher = useCallback(() => startPractice(attemptId), [attemptId]);
  const { data, error, loading, reload } = useFetch(fetcher);

  if (loading) return <Loader text="অনুশীলনের প্রশ্ন আনা হচ্ছে..." />;
  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <ErrorBox message={error} onRetry={reload} />
        <Link to={`/result/${attemptId}`} className="btn btn-ghost mt-3">
          ফলাফলে ফিরে যাও
        </Link>
      </div>
    );
  }
  return <Runner data={data} />;
}

function Runner({ data }) {
  const { attemptId, exam, questions } = data;
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const doneRef = useRef(false);

  // কতক্ষণ ধরে করছে তার ঘড়ি (সময়সীমা নেই)
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const warn = (e) => {
      if (doneRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  function selectAnswer(questionId, index) {
    setAnswers((prev) => ({ ...prev, [questionId]: prev[questionId] === index ? null : index }));
  }

  async function submit() {
    setSubmitting(true);
    setConfirmOpen(false);
    const list = Object.entries(answers).map(([questionId, selectedIndex]) => ({ questionId, selectedIndex }));
    try {
      const { practiceId } = await submitPractice(attemptId, list, seconds);
      doneRef.current = true;
      navigate(`/practice/result/${practiceId}`, { replace: true });
    } catch (err) {
      setSubmitting(false);
      toast.error(getErrorMessage(err));
    }
  }

  const question = questions[current];
  const answeredCount = questions.filter((q) => Number.isInteger(answers[q._id])).length;
  const unanswered = questions.length - answeredCount;
  const isLast = current === questions.length - 1;

  return (
    <div className="min-h-screen bg-base-200">
      <header className="sticky top-0 z-30 border-b border-base-300 bg-base-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="min-w-0">
            <p className="inline-block rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-content">অনুশীলন</p>
            <h1 className="truncate font-bold leading-tight">{exam.title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-field bg-base-200 px-3 py-1.5 font-mono text-base font-semibold" aria-label="সময় লেগেছে">
              {clock(seconds)}
            </span>
            <button type="button" className="btn btn-ghost btn-sm btn-square" aria-label="অনুশীলন ছেড়ে দাও" onClick={() => setLeaveOpen(true)}>
              <FiX size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
        <progress className="progress progress-primary block h-1 w-full rounded-none" value={answeredCount} max={questions.length} aria-hidden="true" />
      </header>

      <main className="mx-auto max-w-3xl px-4 py-5">
        <p className="mb-3 rounded-box bg-base-100 px-4 py-2 text-sm">
          এটা অনুশীলন, তাই এই নম্বর লিডারবোর্ডে যাবে না। শুধু তোমার নিজের অগ্রগতিতে জমা হবে। উত্তর দিয়েছ {toBn(answeredCount)}/{toBn(questions.length)}।
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
              অনুশীলন জমা দাও
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
            অনুশীলন জমা দাও
          </button>
        </section>
      </main>

      <ConfirmModal
        open={confirmOpen}
        title="অনুশীলন জমা দেবে?"
        message={unanswered > 0 ? `তুমি এখনো ${toBn(unanswered)}টা প্রশ্নের উত্তর দাওনি।` : 'সবগুলো প্রশ্নের উত্তর দিয়েছ।'}
        confirmText="হ্যাঁ, জমা দাও"
        cancelText="আরেকবার দেখি"
        loading={submitting}
        onConfirm={submit}
        onCancel={() => setConfirmOpen(false)}
      />
      <ConfirmModal
        open={leaveOpen}
        title="অনুশীলন ছেড়ে দেবে?"
        message="এখানকার উত্তরগুলো জমা হবে না।"
        confirmText="হ্যাঁ, ছেড়ে দাও"
        cancelText="চালিয়ে যাই"
        onConfirm={() => {
          doneRef.current = true;
          navigate(`/result/${attemptId}`, { replace: true });
        }}
        onCancel={() => setLeaveOpen(false)}
      />
    </div>
  );
}
