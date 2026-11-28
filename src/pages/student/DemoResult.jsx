import { useState } from 'react';
import { FiRepeat } from 'react-icons/fi';
import { Link, Navigate, useLocation } from 'react-router-dom';
import QuestionView from '../../components/question/QuestionView.jsx';
import { formatNumber, percentOf, toBn } from '../../utils/format.js';

const tabs = [
  { key: 'all', label: 'সব' },
  { key: 'wrong', label: 'ভুল' },
  { key: 'skipped', label: 'বাদ পড়া' },
  { key: 'correct', label: 'সঠিক' },
];

// ডেমোর ফল পেজের মেমরিতেই থাকে (সার্ভারে জমা নেই), তাই রিফ্রেশ দিলে আর দেখা যায় না
export default function DemoResult() {
  const { state } = useLocation();
  const [tab, setTab] = useState('all');
  const data = state?.result;
  if (!data) return <Navigate to="/demo" replace />;

  const percent = percentOf(data.score, data.total);
  const counts = { all: data.questions.length, wrong: data.wrongCount, skipped: data.skippedCount, correct: data.correctCount };
  const visible = data.questions.map((q, i) => ({ q, number: i + 1 })).filter(({ q }) => tab === 'all' || q.status === tab);

  return (
    <div className="mx-auto max-w-3xl">
      <section className="rounded-box border border-base-300 p-5 text-center sm:p-8">
        <p className="inline-block rounded-full bg-secondary px-3 py-0.5 text-sm font-bold text-secondary-content">ডেমো পরীক্ষা</p>
        <p className="mt-2 text-sm text-base-content/85">{data.exam.title}</p>
        <p className="mt-3 text-5xl font-bold text-primary sm:text-6xl">
          {formatNumber(data.score)}
          <span className="text-2xl font-medium text-base-content/75 sm:text-3xl"> / {formatNumber(data.total)}</span>
        </p>
        <p className="mt-1 font-medium">{toBn(percent)}%</p>
        <p className="mx-auto mt-3 max-w-md text-base-content/90">এই ফল কোথাও জমা হয়নি। আসল পরীক্ষায়ও এভাবেই সাথে সাথে ফল আর সমাধান দেখতে পাবে।</p>

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-base-300 pt-4">
          {[
            { label: 'সঠিক', value: data.correctCount, color: 'text-success' },
            { label: 'ভুল', value: data.wrongCount, color: 'text-error' },
            { label: 'উত্তর দাওনি', value: data.skippedCount, color: 'text-base-content/85' },
          ].map((s) => (
            <div key={s.label}>
              <p className={`text-2xl font-bold ${s.color}`}>{toBn(s.value)}</p>
              <p className="text-xs text-base-content/85 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to={`/demo/${data.exam._id}`} className="btn btn-primary">
            <FiRepeat aria-hidden="true" /> আবার দিয়ে দেখো
          </Link>
          <Link to="/demo" className="btn btn-outline btn-primary">
            ফিরে যাও
          </Link>
        </div>
      </section>

      <h2 className="mt-8 mb-3 text-xl font-bold">প্রশ্ন ধরে ধরে দেখো</h2>
      <div role="tablist" className="tabs tabs-border mb-4 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={`tab shrink-0 ${tab === t.key ? 'tab-active font-semibold' : ''}`} onClick={() => setTab(t.key)}>
            {t.label} ({toBn(counts[t.key])})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-box border border-dashed border-base-300 p-8 text-center text-base-content/85">এই ভাগে কোনো প্রশ্ন নেই।</p>
      ) : (
        <ul className="grid gap-4">
          {visible.map(({ q, number }) => (
            <li key={q._id} className="rounded-box border border-base-300 p-4 sm:p-5">
              <QuestionView question={q} number={number} mode="review" selectedIndex={q.selectedIndex} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
