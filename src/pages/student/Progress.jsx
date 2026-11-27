import { useCallback } from 'react';
import { FiArrowLeft, FiRepeat } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import { getProgress } from '../../api/practice.api.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorBox from '../../components/common/ErrorBox.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import useFetch from '../../hooks/useFetch.js';
import { formatDateTime, formatNumber, percentOf, toBn } from '../../utils/format.js';

function Stat({ label, value }) {
  return (
    <div className="rounded-box border border-base-300 p-3 text-center">
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-sm text-base-content/85">{label}</p>
    </div>
  );
}

// একটা পরীক্ষার মূল নম্বরের পর থেকে প্রতিটা অনুশীলনে নম্বর কেমন বাড়ল তার ছবি
export default function Progress() {
  const { attemptId } = useParams();
  const fetcher = useCallback(() => getProgress(attemptId), [attemptId]);
  const { data, error, loading, reload } = useFetch(fetcher);

  if (loading) return <Loader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const rows = [
    { key: 'official', label: 'মূল পরীক্ষা', score: data.official.score, total: data.official.total, at: data.official.submittedAt, official: true },
    ...data.practices.map((p, i) => ({ key: p.practiceId, label: `অনুশীলন ${toBn(i + 1)}`, score: p.score, total: p.total, at: p.submittedAt, id: p.practiceId })),
  ];
  const percents = data.practices.map((p) => percentOf(p.score, p.total));
  const officialPercent = percentOf(data.official.score, data.official.total);
  const best = percents.length ? Math.max(...percents) : null;
  const latest = percents.length ? percents[percents.length - 1] : null;
  const diff = latest === null ? null : latest - officialPercent;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to={`/result/${data.attemptId}`} className="btn btn-ghost btn-sm -ml-2 mb-2">
        <FiArrowLeft aria-hidden="true" /> মূল ফলাফলে ফিরে যাও
      </Link>
      <PageHeader title="আমার অগ্রগতি" subtitle={data.exam.title} />

      {data.practices.length === 0 ? (
        <EmptyState title="এখনো কোনো অনুশীলন করোনি" text="অনুশীলনের নম্বর লিডারবোর্ডে যাবে না। যতবার খুশি দিয়ে নিজের উন্নতি দেখতে পারবে।" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="মূল পরীক্ষা" value={`${toBn(officialPercent)}%`} />
            <Stat label="সর্বোচ্চ" value={`${toBn(best)}%`} />
            <Stat label="সর্বশেষ" value={`${toBn(latest)}%`} />
            <Stat label="মোট অনুশীলন" value={toBn(data.practices.length)} />
          </div>
          {diff !== null && (
            <p className="mt-3 rounded-box bg-secondary/25 px-4 py-2 text-base font-medium">
              {diff > 0 ? `মূল পরীক্ষার চেয়ে ${toBn(diff)}% বেড়েছে। দারুণ!` : diff === 0 ? 'মূল পরীক্ষার সমান আছে। আবার চেষ্টা করলে আরও বাড়বে।' : `মূল পরীক্ষার চেয়ে ${toBn(-diff)}% কম। ভুলগুলো দেখে আবার চেষ্টা করো।`}
            </p>
          )}
        </>
      )}

      <ul className="mt-5 grid gap-2">
        {rows.map((r) => {
          const pct = percentOf(r.score, r.total);
          const body = (
            <>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{r.label}</span>
                <span className="text-sm">
                  <b>{formatNumber(r.score)}</b>/{formatNumber(r.total)} · {toBn(pct)}%
                </span>
              </div>
              <progress className={`progress mt-1.5 h-3 w-full ${r.official ? 'progress-secondary' : 'progress-primary'}`} value={pct} max="100" aria-label={`${r.label} ${toBn(pct)} শতাংশ`} />
              <p className="mt-1 text-xs text-base-content/80">{formatDateTime(r.at)}</p>
            </>
          );
          return (
            <li key={r.key}>
              {r.id ? (
                <Link to={`/practice/result/${r.id}`} className="block rounded-box border border-base-300 p-3 hover:bg-base-200">
                  {body}
                </Link>
              ) : (
                <div className="rounded-box border border-base-300 bg-base-200/60 p-3">{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      <Link to={`/practice/${data.attemptId}`} className="btn btn-primary mt-5 w-full sm:w-auto">
        <FiRepeat aria-hidden="true" /> আবার অনুশীলন করো
      </Link>
    </div>
  );
}
