import { useCallback } from 'react';
import { FiAlertCircle, FiClock, FiHelpCircle, FiAward } from 'react-icons/fi';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getPublicExam } from '../../api/exams.api.js';
import ErrorBox from '../../components/common/ErrorBox.jsx';
import Loader from '../../components/common/Loader.jsx';
import useAuth from '../../hooks/useAuth.js';
import useFetch from '../../hooks/useFetch.js';
import { formatNumber, toBn } from '../../utils/format.js';

// পরীক্ষার লিংক খুললে প্রথমে এই পেজ দেখায়
export default function ExamIntro() {
  const { code } = useParams();
  const location = useLocation();
  const { user } = useAuth();

  const fetcher = useCallback(() => getPublicExam(code), [code]);
  const { data: exam, error, loading, reload } = useFetch(fetcher);

  if (loading) return <Loader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const facts = [
    { icon: FiHelpCircle, label: 'প্রশ্ন', value: `${toBn(exam.questionCount)}টি` },
    { icon: FiClock, label: 'সময়', value: `${toBn(exam.durationMinutes)} মিনিট` },
    { icon: FiAward, label: 'মোট নম্বর', value: formatNumber(exam.totalMarks) },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium text-primary">পরীক্ষা</p>
      <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{exam.title}</h1>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {facts.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-box border border-base-300 p-3 text-center sm:p-4">
            <Icon className="mx-auto mb-1 text-primary" size={22} aria-hidden="true" />
            <p className="text-xs text-base-content/85 sm:text-sm">{label}</p>
            <p className="text-base font-bold sm:text-lg">{value}</p>
          </div>
        ))}
      </div>

      <section className="mt-6 rounded-box bg-base-200 p-4 sm:p-5">
        <h2 className="mb-2 font-semibold">শুরু করার আগে জেনে নাও</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm sm:text-base">
          <li>"পরীক্ষা শুরু করো" চাপলেই সময় চলতে শুরু করবে, আর থামানো যাবে না।</li>
          <li>পেজ রিফ্রেশ করলে বা নেট চলে গেলেও তোমার উত্তরগুলো সেভ থাকবে, কিন্তু সময় চলতে থাকবে।</li>
          <li>সময় শেষ হলে পরীক্ষা নিজে থেকেই জমা হয়ে যাবে।</li>
          <li>একটা পরীক্ষা একবারই দেওয়া যায়।</li>
          {exam.negativeMark > 0 && (
            <li className="font-medium text-error">
              প্রতিটা ভুল উত্তরের জন্য {formatNumber(exam.negativeMark)} নম্বর কাটা যাবে।
            </li>
          )}
        </ul>
      </section>

      <div className="mt-6">
        {!exam.isActive ? (
          <div role="alert" className="alert alert-warning alert-soft">
            <FiAlertCircle aria-hidden="true" />
            <span>এই পরীক্ষা এখন বন্ধ আছে। শিক্ষকের সাথে কথা বলো।</span>
          </div>
        ) : !user ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <Link to="/login" state={{ from: location }} className="btn btn-primary">
              লগইন করে শুরু করো
            </Link>
            <Link to="/register" state={{ from: location }} className="btn btn-outline">
              নতুন অ্যাকাউন্ট খোলো
            </Link>
          </div>
        ) : user.role === 'teacher' ? (
          <div role="alert" className="alert alert-info alert-soft">
            <span>শিক্ষকের অ্যাকাউন্ট দিয়ে পরীক্ষা দেওয়া যায় না। স্টুডেন্টের অ্যাকাউন্ট দিয়ে লগইন করো।</span>
          </div>
        ) : (
          <Link to={`/exam/${code}/take`} className="btn btn-primary btn-lg w-full">
            পরীক্ষা শুরু করো
          </Link>
        )}
      </div>
    </div>
  );
}
