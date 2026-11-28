import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiClock, FiSend } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../api/axios.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import useAuth from '../../hooks/useAuth.js';

const perks = ['নিজের প্রশ্ন ব্যাংক বানানো, শ্রেণি আর অধ্যায় ধরে সাজানো', 'ছবি থেকে AI দিয়ে প্রশ্ন বের করা', 'লিংক শেয়ার করা সময়বাঁধা পরীক্ষা নেওয়া', 'স্টুডেন্টদের ফলাফল আর কোন প্রশ্নে বেশি ভুল হচ্ছে তার বিশ্লেষণ', 'প্রশ্নপত্র PDF করে অফলাইন পরীক্ষা নেওয়া'];

// শিক্ষক হওয়ার অনুরোধ পাঠানো আর তার অবস্থা দেখার পেজ
export default function BecomeTeacher() {
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

  const pending = user.teacherRequest === 'pending';

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="শিক্ষক হও" subtitle="শিক্ষকের সব সুবিধা পেতে চাইলে এখানে ক্লিক করে অনুরোধ পাঠাও" />

      <section className={`rounded-box border p-5 sm:p-8 ${pending ? 'border-secondary bg-secondary/20' : 'border-base-300'}`}>
        {pending ? (
          <>
            <p className="flex items-center gap-2 text-xl font-bold">
              <FiClock className="text-primary" aria-hidden="true" /> তোমার অনুরোধ অনুমোদনের অপেক্ষায় আছে
            </p>
            <p className="mt-2 text-base">মূল শিক্ষক দেখে অনুমোদন দিলে তুমি প্রশ্ন আর পরীক্ষা বানাতে পারবে। অনুমোদন হয়েছে কিনা নিচের বোতামে দেখে নাও।</p>
            <button type="button" className="btn btn-primary mt-4" disabled={busy} onClick={() => run(refreshUser)}>
              {busy && <span className="loading loading-spinner loading-sm" />}
              অনুমোদন হয়েছে কিনা দেখো
            </button>
          </>
        ) : (
          <>
            {user.teacherRequest === 'rejected' && <p className="mb-3 rounded-box bg-error/10 px-4 py-2 font-semibold">আগের অনুরোধটা অনুমোদন হয়নি। চাইলে আবার পাঠাতে পারো।</p>}
            <h2 className="text-xl font-bold sm:text-2xl">শিক্ষক হিসেবে যা যা করতে পারবে</h2>
            <ul className="mt-3 grid gap-2">
              {perks.map((p) => (
                <li key={p} className="flex items-start gap-2 text-base">
                  <FiCheckCircle className="mt-1 shrink-0 text-primary" aria-hidden="true" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-base">অনুরোধ পাঠালে মূল শিক্ষক দেখে অনুমোদন দেবেন। তার আগে ঘুরে দেখতে চাইলে <Link to="/demo-teacher" className="link font-semibold">শিক্ষকের ডেমো</Link> চেষ্টা করো।</p>
            <button type="button" className="btn btn-primary mt-5" disabled={busy} onClick={() => run(requestTeacher, 'অনুরোধ পাঠানো হয়েছে')}>
              {busy ? <span className="loading loading-spinner loading-sm" /> : <FiSend aria-hidden="true" />}
              শিক্ষক হওয়ার অনুরোধ পাঠাও
            </button>
          </>
        )}
      </section>
    </div>
  );
}