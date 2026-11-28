import { useCallback } from 'react';
import { FiPlay } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { getDemos } from '../../api/demo.api.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorBox from '../../components/common/ErrorBox.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import useFetch from '../../hooks/useFetch.js';
import { toBn } from '../../utils/format.js';

// সব স্টুডেন্টের জন্য ডেমো পরীক্ষা। নম্বর কোথাও জমা হয় না, লিডারবোর্ডেও যায় না।
export default function DemoHome() {
  const fetcher = useCallback(() => getDemos(), []);
  const { data, error, loading, reload } = useFetch(fetcher);

  return (
    <>
      <PageHeader title="ডেমো পরীক্ষা" subtitle="পরীক্ষা কীভাবে চলে নিজে দিয়ে দেখে নাও" />

      <p className="mb-5 rounded-box border border-secondary bg-secondary/20 px-4 py-3 text-base">
        সময় আসল পরীক্ষার মতোই চলবে, আর জমা দিলে সাথে সাথে নম্বর ও সমাধান দেখতে পাবে। তবে নম্বর কোথাও জমা হবে না, লিডারবোর্ডেও যাবে না। যতবার খুশি দিতে পারবে।
      </p>

      {loading && <Loader />}
      {error && <ErrorBox message={error} onRetry={reload} />}

      {data && data.exams.length === 0 && (
        <EmptyState title="এখনো কোনো ডেমো পরীক্ষা নেই" text="শিক্ষক ডেমো পরীক্ষা চালু করলে এখানে দেখতে পাবে। শিক্ষকের কাছ থেকে পরীক্ষার লিংক পেলে সেটা খুললেই আসল পরীক্ষা শুরু করতে পারবে।" />
      )}

      {data && data.exams.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {data.exams.map((e) => (
            <li key={e._id} className="flex min-w-0 flex-col gap-3 rounded-box border border-base-300 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold leading-snug break-words">{e.title}</h2>
                <p className="text-sm text-base-content/85">
                  {toBn(e.questionCount)}টি প্রশ্ন · {toBn(e.durationMinutes)} মিনিট
                </p>
              </div>
              <Link to={`/demo/${e._id}`} className="btn btn-primary w-full shrink-0 sm:w-auto">
                <FiPlay aria-hidden="true" /> শুরু করো
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
