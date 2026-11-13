import { useCallback } from 'react';
import { FiPlus, FiUsers } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { listExams } from '../../api/exams.api.js';
import CopyButton from '../../components/common/CopyButton.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorBox from '../../components/common/ErrorBox.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import useFetch from '../../hooks/useFetch.js';
import { formatDateTime, formatNumber, toBn } from '../../utils/format.js';

export default function Dashboard() {
  const fetcher = useCallback(() => listExams(), []);
  const { data, error, loading, reload } = useFetch(fetcher);

  return (
    <>
      <PageHeader
        title="আমার পরীক্ষাগুলো"
        subtitle="লিংক কপি করে স্টুডেন্টদের পাঠিয়ে দাও"
        actions={
          <Link to="/teacher/exams/new" className="btn btn-primary">
            <FiPlus aria-hidden="true" /> নতুন পরীক্ষা
          </Link>
        }
      />

      {loading && <Loader />}
      {error && <ErrorBox message={error} onRetry={reload} />}

      {data && data.exams.length === 0 && (
        <EmptyState
          title="এখনো কোনো পরীক্ষা বানাওনি"
          text="প্রথমে প্রশ্ন ব্যাংকে প্রশ্ন যোগ করো, তারপর সেখান থেকে পরীক্ষা বানাও।"
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/teacher/import" className="btn btn-outline">প্রশ্ন ইমপোর্ট করো</Link>
              <Link to="/teacher/exams/new" className="btn btn-primary">নতুন পরীক্ষা বানাও</Link>
            </div>
          }
        />
      )}

      {data && data.exams.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2">
          {data.exams.map((exam) => (
            <li key={exam._id} className="flex flex-col gap-3 rounded-box border border-base-300 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="min-w-0 text-lg font-semibold leading-snug">{exam.title}</h2>
                <span className={`badge shrink-0 ${exam.isActive ? 'badge-success badge-soft' : 'badge-ghost'}`}>
                  {exam.isActive ? 'চালু' : 'বন্ধ'}
                </span>
              </div>

              <p className="text-sm text-base-content/70">
                {toBn(exam.questionCount)}টি প্রশ্ন · {toBn(exam.durationMinutes)} মিনিট · {formatDateTime(exam.createdAt)}
              </p>

              <div className="flex items-center gap-4 rounded-box bg-base-200 px-3 py-2 text-sm">
                <span className="flex items-center gap-1.5">
                  <FiUsers aria-hidden="true" className="text-primary" />
                  {toBn(exam.submittedCount)} জন দিয়েছে
                </span>
                {exam.submittedCount > 0 && <span>গড় নম্বর: {formatNumber(exam.averageScore)}</span>}
              </div>

              <div className="mt-auto flex flex-wrap gap-2">
                <CopyButton text={exam.link} label="লিংক কপি করো" done="পরীক্ষার লিংক কপি হয়েছে" />
                <Link to={`/teacher/exams/${exam._id}`} className="btn btn-sm btn-primary">
                  ফলাফল ও বিস্তারিত
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
