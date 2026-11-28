import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiFileText, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getErrorMessage } from '../../api/axios.js';
import { deleteExam, getExam, getExamAnalysis, getExamAttempts, regradeExam, updateExam } from '../../api/exams.api.js';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';
import CopyButton from '../../components/common/CopyButton.jsx';
import ErrorBox from '../../components/common/ErrorBox.jsx';
import Loader from '../../components/common/Loader.jsx';
import MathText from '../../components/math/MathText.jsx';
import useAuth from '../../hooks/useAuth.js';
import useFetch from '../../hooks/useFetch.js';
import { startPaperFromExam } from '../../utils/printSelection.js';
import { examLinkOf, lettersOf, formatDateTime, formatNumber, toBn } from '../../utils/format.js';

export default function ExamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();
  const examFetcher = useCallback(() => getExam(id), [id]);
  const attemptsFetcher = useCallback(() => getExamAttempts(id), [id]);
  const analysisFetcher = useCallback(() => getExamAnalysis(id), [id]);
  const exam = useFetch(examFetcher);
  const attempts = useFetch(attemptsFetcher);
  const analysis = useFetch(analysisFetcher);

  const [tab, setTab] = useState('students');
  const [busy, setBusy] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (exam.loading) return <Loader />;
  if (exam.error) return <ErrorBox message={exam.error} onRetry={exam.reload} />;

  const info = exam.data.exam;

  async function run(key, action, successText) {
    setBusy(key);
    try {
      const result = await action();
      toast.success(successText ?? result?.message ?? 'হয়ে গেছে');
      exam.reload();
      attempts.reload();
      analysis.reload();
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err));
      return false;
    } finally {
      setBusy('');
    }
  }

  const toggleActive = () =>
    run('active', () => updateExam(id, { isActive: !info.isActive }), info.isActive ? 'পরীক্ষা বন্ধ করা হয়েছে' : 'পরীক্ষা চালু করা হয়েছে');

  const toggleDemo = () =>
    run('demo', () => updateExam(id, { isDemo: !info.isDemo }), info.isDemo ? 'ডেমো থেকে বাদ দেওয়া হয়েছে' : 'এখন সব স্টুডেন্ট এটা ডেমো হিসেবে দিতে পারবে');

  const regrade = () => run('regrade', () => regradeExam(id));

  // এই পরীক্ষার প্রশ্ন নিয়ে ছাপার মতো প্রশ্নপত্র (PDF) বানানোর পেজে যায়
  function openPaper() {
    startPaperFromExam(info);
    navigate('/teacher/print');
  }

  async function handleDelete() {
    setBusy('delete');
    try {
      await deleteExam(id);
      toast.success('পরীক্ষা মুছে ফেলা হয়েছে');
      navigate('/teacher');
    } catch (err) {
      toast.error(getErrorMessage(err));
      setBusy('');
      setConfirmDelete(false);
    }
  }

  const summary = analysis.data?.summary;
  const stats = [
    { label: 'পরীক্ষা দিয়েছে', value: toBn(summary?.attemptCount ?? 0) },
    { label: 'গড় নম্বর', value: formatNumber(summary?.average ?? 0) },
    { label: 'সর্বোচ্চ', value: formatNumber(summary?.highest ?? 0) },
    { label: 'সর্বনিম্ন', value: formatNumber(summary?.lowest ?? 0) },
  ];

  return (
    <>
      <Link to="/teacher" className="btn btn-ghost btn-sm -ml-2 mb-2">
        <FiArrowLeft aria-hidden="true" /> সব পরীক্ষা
      </Link>

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold sm:text-3xl">{info.title}</h1>
            {info.isDemo && <span className="badge badge-secondary">ডেমো</span>}
            <span className={`badge ${info.isActive ? 'badge-success badge-soft' : 'badge-ghost'}`}>{info.isActive ? 'চালু' : 'বন্ধ'}</span>
          </div>
          <p className="mt-1 text-sm text-base-content/85">
            {toBn(info.questions.length)}টি প্রশ্ন · {toBn(info.durationMinutes)} মিনিট · প্রতি প্রশ্নে {formatNumber(info.marksPerQuestion)} নম্বর
            {info.negativeMark > 0 && ` · ভুলে −${formatNumber(info.negativeMark)}`}
          </p>
          <p className="mt-2 break-all rounded bg-base-200 px-3 py-2 text-sm">{examLinkOf(info.code)}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <CopyButton text={examLinkOf(info.code)} label="লিংক কপি করো" done="পরীক্ষার লিংক কপি হয়েছে" className="btn btn-primary btn-sm" />
          <button type="button" className="btn btn-outline btn-sm" onClick={openPaper}>
            <FiFileText aria-hidden="true" /> প্রশ্নপত্র PDF
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={toggleActive} disabled={busy === 'active'}>
            {info.isActive ? 'পরীক্ষা বন্ধ করো' : 'পরীক্ষা চালু করো'}
          </button>
          {user?.isOwner && (
            <button type="button" className="btn btn-outline btn-sm" onClick={toggleDemo} disabled={busy === 'demo'} title="ডেমো করলে সব স্টুডেন্ট এই পরীক্ষা অনুশীলনের মতো দিয়ে দেখতে পারে, ফল জমা হয় না">
              {info.isDemo ? 'ডেমো থেকে বাদ দাও' : 'ডেমো পরীক্ষা করো'}
            </button>
          )}
          <button type="button" className="btn btn-outline btn-sm" onClick={regrade} disabled={busy === 'regrade'} title="প্রশ্নের উত্তর ঠিক করার পর সবার নম্বর নতুন করে হিসাব করে">
            {busy === 'regrade' ? <span className="loading loading-spinner loading-xs" /> : <FiRefreshCw aria-hidden="true" />}
            ফলাফল আবার হিসাব করো
          </button>
          <button type="button" className="btn btn-ghost btn-sm text-error" onClick={() => setConfirmDelete(true)}>
            <FiTrash2 aria-hidden="true" /> মোছো
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-box border border-base-300 p-3 text-center">
            <p className="text-2xl font-bold text-primary">{s.value}</p>
            <p className="text-xs text-base-content/85 sm:text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      <div role="tablist" className="tabs tabs-border mb-4">
        <button type="button" role="tab" aria-selected={tab === 'students'} className={`tab ${tab === 'students' ? 'tab-active font-semibold' : ''}`} onClick={() => setTab('students')}>
          স্টুডেন্টদের ফলাফল
        </button>
        <button type="button" role="tab" aria-selected={tab === 'questions'} className={`tab ${tab === 'questions' ? 'tab-active font-semibold' : ''}`} onClick={() => setTab('questions')}>
          কোন প্রশ্নে কতজন ভুল করেছে
        </button>
      </div>

      {tab === 'students' && <StudentsTable attempts={attempts} />}
      {tab === 'questions' && <QuestionAnalysis analysis={analysis} />}

      <ConfirmModal
        open={confirmDelete}
        title="পরীক্ষাটা মুছে ফেলবে?"
        message="পরীক্ষার সাথে স্টুডেন্টদের সব উত্তর আর ফলাফলও মুছে যাবে। এটা ফেরত আনা যাবে না।"
        confirmText="হ্যাঁ, মুছে ফেলো"
        danger
        loading={busy === 'delete'}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

function StudentsTable({ attempts }) {
  if (attempts.loading) return <Loader />;
  if (attempts.error) return <ErrorBox message={attempts.error} onRetry={attempts.reload} />;

  const rows = attempts.data.attempts;
  if (rows.length === 0) {
    return <p className="rounded-box border border-dashed border-base-300 p-8 text-center text-base-content/85">এখনো কেউ এই পরীক্ষা শুরু করেনি। লিংকটা স্টুডেন্টদের পাঠিয়ে দাও।</p>;
  }

  return (
    <div className="overflow-x-auto rounded-box border border-base-300">
      <table className="table min-w-[34rem]">
        <thead>
          <tr>
            <th>স্টুডেন্ট</th>
            <th>নম্বর</th>
            <th>সঠিক</th>
            <th>ভুল</th>
            <th>বাদ</th>
            <th>সময়</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.attemptId}>
              <td>
                <p className="font-medium">{a.student?.name}</p>
                <p className="text-xs text-base-content/75">{a.student?.email}</p>
              </td>
              {a.status === 'submitted' ? (
                <>
                  <td className="font-semibold whitespace-nowrap">{formatNumber(a.score)} / {formatNumber(a.total)} <span className="font-normal text-base-content/75">({toBn(a.percent)}%)</span></td>
                  <td className="text-success">{toBn(a.correctCount)}</td>
                  <td className="text-error">{toBn(a.wrongCount)}</td>
                  <td>{toBn(a.skippedCount)}</td>
                  <td className="text-sm whitespace-nowrap">{formatDateTime(a.submittedAt)}</td>
                  <td className="whitespace-nowrap">
                    <Link to={`/result/${a.attemptId}`} className="btn btn-sm btn-primary whitespace-nowrap">কী কী ভুল</Link>
                  </td>
                </>
              ) : (
                <td colSpan={6} className="text-sm text-base-content/85">পরীক্ষা চলছে, এখনো জমা দেয়নি</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuestionAnalysis({ analysis }) {
  if (analysis.loading) return <Loader />;
  if (analysis.error) return <ErrorBox message={analysis.error} onRetry={analysis.reload} />;

  const { summary, questions } = analysis.data;
  if (summary.attemptCount === 0) {
    return <p className="rounded-box border border-dashed border-base-300 p-8 text-center text-base-content/85">কেউ পরীক্ষা জমা দিলে এখানে প্রশ্নভিত্তিক হিসাব দেখা যাবে।</p>;
  }

  const chartData = questions.map((q, i) => ({ name: toBn(i + 1), ভুল: q.wrongPercent }));
  const worst = questions
    .map((q, i) => ({ ...q, number: i + 1 }))
    .sort((a, b) => b.wrongPercent - a.wrongPercent);

  return (
    <div className="grid gap-6">
      <section className="rounded-box border border-base-300 p-3 sm:p-5">
        <h2 className="mb-1 font-semibold">প্রতিটা প্রশ্নে কত শতাংশ ভুল করেছে</h2>
        <p className="mb-3 text-sm text-base-content/85">যে প্রশ্নের স্তম্ভ যত উঁচু, সেই বিষয়টা আবার বুঝিয়ে দেওয়া দরকার।</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d9e4e4" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => toBn(v)} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`${toBn(value)}%`, 'ভুল']} labelFormatter={(label) => `প্রশ্ন ${label}`} />
              <Bar dataKey="ভুল" fill="#d92d20" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">সবচেয়ে বেশি ভুল হওয়া প্রশ্ন আগে</h2>
        <ul className="grid gap-3">
          {worst.map((q) => (
            <li key={q.questionId} className="rounded-box border border-base-300 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 text-sm sm:text-base">
                  <span className="mr-1 font-semibold text-primary">প্রশ্ন {toBn(q.number)}.</span>
                  <MathText text={q.text || '(ছবিসহ প্রশ্ন)'} />
                </p>
                <span className={`badge shrink-0 ${q.wrongPercent >= 50 ? 'badge-error' : 'badge-ghost'}`}>{toBn(q.wrongPercent)}% ভুল</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                {q.optionCounts.map((count, i) => (
                  <div key={i} className={`rounded border px-2 py-1 ${i === q.correctIndex ? 'border-success bg-success/10' : 'border-base-300'}`}>
                    {lettersOf(q.optionStyle)[i]}: {toBn(count)} জন{i === q.correctIndex && <span className="text-success"> (সঠিক)</span>}
                  </div>
                ))}
              </div>
              {q.skipped > 0 && <p className="mt-2 text-xs text-base-content/75">{toBn(q.skipped)} জন উত্তর দেয়নি</p>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
