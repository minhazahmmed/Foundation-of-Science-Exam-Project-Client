import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyAttempts } from '../../api/attempts.api.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorBox from '../../components/common/ErrorBox.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import useFetch from '../../hooks/useFetch.js';
import { formatDateTime, formatNumber, percentOf, toBn } from '../../utils/format.js';

export default function MyResults() {
  const fetcher = useCallback(() => getMyAttempts(), []);
  const { data, error, loading, reload } = useFetch(fetcher);

  return (
    <>
      <PageHeader title="আমার ফলাফল" subtitle="এখন পর্যন্ত যতগুলো পরীক্ষা দিয়েছ সবগুলো এখানে আছে" />

      {loading && <Loader />}
      {error && <ErrorBox message={error} onRetry={reload} />}

      {data && data.attempts.length === 0 && (
        <EmptyState
          title="এখনো কোনো পরীক্ষা দাওনি"
          text="শিক্ষক যে পরীক্ষার লিংক পাঠাবেন সেটা ব্রাউজারে খুললেই পরীক্ষা শুরু করতে পারবে। পরীক্ষা শেষ হলে ফলাফল এখানে জমা হবে।"
        />
      )}

      {data && data.attempts.length > 0 && (
        <ul className="grid grid-cols-1 gap-3">
          {data.attempts.map((a) => (
            <li key={a.attemptId} className="flex min-w-0 flex-col gap-3 rounded-box border border-base-300 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold leading-snug break-words">{a.exam?.title}</h2>
                <p className="text-sm text-base-content/85">{formatDateTime(a.submittedAt)}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:justify-end">
                <p className="text-right">
                  <span className="text-2xl font-bold text-primary">{formatNumber(a.score)}</span>
                  <span className="text-base-content/85"> / {formatNumber(a.total)}</span>
                  <span className="ml-2 text-sm text-base-content/85">({toBn(percentOf(a.score, a.total))}%)</span>
                </p>
                <Link to={`/result/${a.attemptId}`} className="btn btn-primary btn-sm">
                  বিস্তারিত দেখো
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
