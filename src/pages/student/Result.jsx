import { useCallback, useState } from "react";
import { FiArrowLeft, FiBarChart2, FiFileText, FiRepeat } from 'react-icons/fi';
import { Link, useNavigate, useParams } from "react-router-dom";
import { getResult } from "../../api/attempts.api.js";
import ErrorBox from "../../components/common/ErrorBox.jsx";
import Loader from "../../components/common/Loader.jsx";
import QuestionView from "../../components/question/QuestionView.jsx";
import useFetch from "../../hooks/useFetch.js";
import {
  formatDateTime,
  formatNumber,
  percentOf,
  toBn,
} from "../../utils/format.js";

const tabs = [
  { key: "all", label: "সব" },
  { key: "wrong", label: "ভুল" },
  { key: "skipped", label: "বাদ পড়া" },
  { key: "correct", label: "সঠিক" },
];

function cheerUp(percent) {
  if (percent >= 80) return "দারুণ করেছ! এভাবেই চালিয়ে যাও।";
  if (percent >= 50)
    return "ভালো হয়েছে। ভুলগুলো একবার দেখে নিলে পরেরবার আরও ভালো হবে।";
  return "চিন্তা কোরো না। ভুলগুলো ভালো করে দেখো, পরেরবার নিশ্চয়ই আরও ভালো হবে।";
}

// স্টুডেন্ট নিজের ফলাফল দেখে, শিক্ষক দেখেন স্টুডেন্টের ফলাফল। একই পেজ।
export default function Result() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fetcher = useCallback(() => getResult(id), [id]);
  const { data, error, loading, reload } = useFetch(fetcher);
  const [tab, setTab] = useState("all");

  if (loading) return <Loader text="ফলাফল তৈরি হচ্ছে..." />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const forTeacher = Boolean(data.student);
  const percent = percentOf(data.score, data.total);

  const counts = {
    all: data.questions.length,
    wrong: data.wrongCount,
    skipped: data.skippedCount,
    correct: data.correctCount,
  };
  const visible = data.questions
    .map((q, i) => ({ q, number: i + 1 }))
    .filter(({ q }) => tab === "all" || q.status === tab);

  const stats = [
    { label: "সঠিক", value: data.correctCount, color: "text-success" },
    { label: "ভুল", value: data.wrongCount, color: "text-error" },
    {
      label: "উত্তর দাওনি",
      value: data.skippedCount,
      color: "text-base-content/85",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      {forTeacher ? (
        <button
          type="button"
          className="btn btn-ghost btn-sm -ml-2 mb-2"
          onClick={() => navigate(-1)}
        >
          <FiArrowLeft aria-hidden="true" /> ফিরে যাও
        </button>
      ) : (
        <Link to="/my-results" className="btn btn-ghost btn-sm -ml-2 mb-2">
          <FiArrowLeft aria-hidden="true" /> আমার সব ফলাফল
        </Link>
      )}

      <section className="rounded-box border border-base-300 p-5 text-center sm:p-8">
        <p className="text-sm text-base-content/85">
          {forTeacher ? `${data.student.name} · ` : ""}
          {data.exam.title}
        </p>
        <p className="mt-3 text-5xl font-semibold text-primary sm:text-6xl">
          {formatNumber(data.score)}
          <span className="text-2xl font-medium text-base-content/75 sm:text-3xl">
            {" "}
            / {formatNumber(data.total)}
          </span>
        </p>
        <p className="mt-1 font-medium">{toBn(percent)}%</p>
        {!forTeacher && (
          <p className="mx-auto mt-3 max-w-md text-base-content/90">
            {cheerUp(percent)}
          </p>
        )}
        <p className="mt-3 text-xs text-base-content/75">
          জমা দেওয়ার সময়: {formatDateTime(data.submittedAt)}
        </p>

{!forTeacher && (
  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
    <Link to={`/practice/${id}`} className="btn btn-primary">
      <FiRepeat aria-hidden="true" /> আবার অনুশীলন করো
    </Link>
    <Link to={`/progress/${id}`} className="btn btn-outline btn-primary">
      <FiBarChart2 aria-hidden="true" /> আমার অগ্রগতি
    </Link>
    <Link to={`/result/${id}/print`} className="btn btn-outline btn-primary">
      <FiFileText aria-hidden="true" /> প্রশ্ন ও সমাধান PDF করো
    </Link>
  </div>
)}
        
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-base-300 pt-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p className={`text-2xl font-bold ${s.color}`}>{toBn(s.value)}</p>
              <p className="text-xs text-base-content/85 sm:text-sm">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <h2 className="mt-8 mb-3 text-xl font-bold">প্রশ্ন ধরে ধরে দেখো</h2>

      <div role="tablist" className="tabs tabs-border mb-4 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`tab shrink-0 ${tab === t.key ? "tab-active font-semibold" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label} ({toBn(counts[t.key])})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-box border border-dashed border-base-300 p-8 text-center text-base-content/85">
          এই ভাগে কোনো প্রশ্ন নেই।
        </p>
      ) : (
        <ul className="grid gap-4">
          {visible.map(({ q, number }) => (
            <li
              key={q._id}
              className="rounded-box border border-base-300 p-4 sm:p-5"
            >
              <QuestionView
                question={q}
                number={number}
                mode="review"
                selectedIndex={q.selectedIndex}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
