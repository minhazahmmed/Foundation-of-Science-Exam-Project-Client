import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../api/axios.js';
import { approveTeacher, listTeachers, rejectTeacher, removeTeacher } from '../../api/teachers.api.js';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorBox from '../../components/common/ErrorBox.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import useFetch from '../../hooks/useFetch.js';
import { formatDateTime, toBn } from '../../utils/format.js';

// মূল শিক্ষকের পেজ: কে শিক্ষক হতে চেয়েছে সেটা দেখে অনুমোদন বা বাতিল করা যায়
export default function TeacherRequests() {
  const fetcher = useCallback(() => listTeachers(), []);
  const { data, error, loading, reload } = useFetch(fetcher);
  const [busyId, setBusyId] = useState(null);
  const [removing, setRemoving] = useState(null);

  async function run(id, action, successText) {
    setBusyId(id);
    try {
      await action(id);
      toast.success(successText);
      setRemoving(null);
      reload();
      // মেনুর পাশের অপেক্ষার সংখ্যাও নতুন করে গোনার জন্য জানিয়ে দেওয়া হয়
      window.dispatchEvent(new Event('fos:teachers-changed'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader title="শিক্ষক অনুরোধ" subtitle="যাঁরা শিক্ষক হতে চেয়েছেন, নাম আর ইমেইল দেখে চিনে নিয়ে অনুমোদন দাও" />

      {loading && <Loader />}
      {error && <ErrorBox message={error} onRetry={reload} />}

      {data && (
        <div className="grid gap-8">
          <section>
            <h2 className="mb-3 text-xl font-bold">অনুমোদনের অপেক্ষায় ({toBn(data.pending.length)})</h2>
            {data.pending.length === 0 ? (
              <EmptyState title="এখন কোনো অনুরোধ নেই" text="কেউ শিক্ষক হতে চাইলে এখানে দেখা যাবে।" />
            ) : (
              <ul className="grid gap-3">
                {data.pending.map((p) => (
                  <li key={p.id} className="flex flex-col gap-3 rounded-box border border-base-300 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-lg font-semibold">{p.name}</p>
                      <p className="break-all text-base">{p.email}</p>
                      <p className="text-sm">অনুরোধ: {formatDateTime(p.createdAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="btn btn-primary" disabled={busyId === p.id} onClick={() => run(p.id, approveTeacher, `${p.name} এখন শিক্ষক`)}>
                        অনুমোদন করো
                      </button>
                      <button type="button" className="btn btn-outline" disabled={busyId === p.id} onClick={() => run(p.id, rejectTeacher, 'অনুরোধ বাতিল করা হয়েছে')}>
                        বাতিল
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold">বর্তমান শিক্ষক ({toBn(data.teachers.length)})</h2>
            <ul className="grid gap-3">
              {data.teachers.map((t) => (
                <li key={t.id} className="flex flex-col gap-3 rounded-box border border-base-300 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-lg font-semibold">
                      {t.name}
                      {t.isOwner && <span className="badge badge-secondary ml-2 align-middle">মূল শিক্ষক</span>}
                    </p>
                    <p className="break-all text-base">{t.email}</p>
                  </div>
                  {!t.isOwner && (
                    <button type="button" className="btn btn-ghost text-error" onClick={() => setRemoving(t)}>
                      শিক্ষক থেকে সরাও
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <ConfirmModal
        open={Boolean(removing)}
        title="শিক্ষকের অনুমতি তুলে নেবে?"
        message={removing && `${removing.name} আবার সাধারণ স্টুডেন্ট হয়ে যাবেন। তাঁর বানানো প্রশ্ন আর পরীক্ষা ডাটাবেসে থেকে যাবে, তবে তিনি আর সেগুলো দেখতে পারবেন না।`}
        confirmText="হ্যাঁ, সরিয়ে দাও"
        danger
        loading={busyId === removing?.id}
        onConfirm={() => run(removing.id, removeTeacher, `${removing.name} আর শিক্ষক নন`)}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
}
