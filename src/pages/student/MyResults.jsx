import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../api/axios.js';
import { getMyAttempts } from '../../api/attempts.api.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorBox from '../../components/common/ErrorBox.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import useAuth from '../../hooks/useAuth.js';
import useFetch from '../../hooks/useFetch.js';
import { formatDateTime, formatNumber, percentOf, toBn } from '../../utils/format.js';

// শিক্ষক হওয়ার অনুরোধের অবস্থা, ফলাফলের ওপরে দেখায়
function TeacherRequestBox() {
  const { user, refreshUser, requestTeacher } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function run(action, successText) {
    setBusy(true);
    try {
      const updated = await action();
      if (updated.role === 'teacher') {
        toast.success('তোমাকে শিক্ষক হিসেবে অনুমোদন দেওয়া হয়েছে');
        navigate('/teacher', { replace: true });
      } else if (successText) {
        toast.success(successText);
      } else {
        toast('এখনো অনুমোদন হয়নি, একটু পরে আবার দেখো', { icon: 'ℹ️' });
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (user.teacherRequest === 'pending') {
    return (
      <div className="mb-6 rounded-box border border-secondary bg-secondary/20 p-4 text-base">
        <p className="font-semibold">শিক্ষক হওয়ার অনুরোধ অনুমোদনের অপেক্ষায় আছে।</p>
        <p className="mt-1">মূল শিক্ষক অনুমোদন দিলে তুমি প্রশ্ন আর পরীক্ষা বানাতে পারবে।</p>
        <button type="button" className="btn btn-primary btn-sm mt-3" disabled={busy} onClick={() => run(refreshUser)}>
          অনুমোদন হয়েছে কিনা দেখো
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-box border border-base-300 p-4 text-base">
      {user.teacherRequest === 'rejected' && <p className="mb-2 font-semibold">আগের অনুরোধটা অনুমোদন হয়নি।</p>}
      <p>তুমি কি শিক্ষক? অনুরোধ পাঠালে মূল শিক্ষক দেখে অনুমোদন দেবেন।</p>
      <button type="button" className="btn btn-outline btn-sm mt-3" disabled={busy} onClick={() => run(requestTeacher, 'অনুরোধ পাঠানো হয়েছে')}>
        শিক্ষক হওয়ার অনুরোধ পাঠাও
      </button>
    </div>
  );
}

export default function MyResults() {
  const fetcher = useCallback(() => getMyAttempts(), []);
  const { data, error, loading, reload } = useFetch(fetcher);

  return (
    <>
      <PageHeader title="আমার ফলাফল" subtitle="এখন পর্যন্ত যতগুলো পরীক্ষা দিয়েছ সবগুলো এখানে আছে" />

      <TeacherRequestBox />

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
