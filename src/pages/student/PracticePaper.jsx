import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiArrowLeft, FiPrinter } from 'react-icons/fi';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getResult } from '../../api/attempts.api.js';
import ErrorBox from '../../components/common/ErrorBox.jsx';
import Loader from '../../components/common/Loader.jsx';
import useFetch from '../../hooks/useFetch.js';
import { Explanations, KeyTable, PaperHeader, PaperQuestion, PrintStyle } from '../../components/paper/PaperParts.jsx';

const PAPER_PX = 794; // A4 এর প্রস্থ (২১০ মিমি) পর্দায়

// স্টুডেন্ট পরীক্ষা দেওয়ার পর ওই পরীক্ষার প্রশ্ন আর সমাধান ছাপার মতো PDF বানায়, অফলাইনে আবার অনুশীলনের জন্য
export default function PracticePaper() {
  const { id } = useParams();
  const fetcher = useCallback(() => getResult(id), [id]);
  const { data, error, loading, reload } = useFetch(fetcher);

  const [columns, setColumns] = useState(2);
  const [fontSize, setFontSize] = useState(13);
  const [includeKey, setIncludeKey] = useState(true);
  const [includeExplanations, setIncludeExplanations] = useState(true);
  const [scale, setScale] = useState(1);
  const wrapRef = useRef(null);

  // মোবাইলে কাগজের পুরো প্রস্থ পর্দায় ঢোকাতে ছোট করে দেখানো হয়। প্রিন্টে এটা কাজ করে না।
  const ready = Boolean(data);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const update = () => setScale(Math.min(1, el.clientWidth / PAPER_PX));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ready]);

  const settings = useMemo(() => {
    if (!data) return null;
    const only = (field) => {
      const values = [...new Set(data.questions.map((q) => q[field]).filter(Boolean))];
      return values.length === 1 ? values[0] : '';
    };
    return {
      institution: 'Foundation of Science',
      examTitle: data.exam.title,
      className: '',
      subject: only('subject'),
      chapter: only('chapter'),
      time: data.exam.durationMinutes ? `${data.exam.durationMinutes} মিনিট` : '',
      setCode: '',
      instruction: '',
      fullMarks: String(data.total),
    };
  }, [data]);

  // অন্য কারও ফলাফলের লিংক (৪০৩/৪০৪) হলে সোজা হোম পেজে
  if (error && /নয়|অনুমতি|পাওয়া যায়নি|not found|forbidden/i.test(String(error))) return <Navigate to="/" replace />;
  if (loading) return <Loader text="প্রশ্নপত্র তৈরি হচ্ছে..." />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const questions = data.questions;

  return (
    <>
      <PrintStyle />

      <div className="no-print">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">প্রশ্নপত্র ও সমাধান</h1>
            <p className="mt-1 text-base-content/85">{data.exam.title}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/result/${id}`} className="btn btn-outline">
              <FiArrowLeft aria-hidden="true" /> ফলাফলে ফিরে যাও
            </Link>
            <button type="button" className="btn btn-primary" onClick={() => window.print()}>
              <FiPrinter aria-hidden="true" /> PDF করো / প্রিন্ট
            </button>
          </div>
        </div>

        <p className="mb-4 rounded-box bg-base-200 p-3 text-base">
          PDF হিসেবে সেভ করতে উপরের বাটন চাপো, তারপর খোলা জানালায় প্রিন্টারের জায়গায় <b>"PDF হিসেবে সেভ করুন"</b> (Save as PDF) বেছে নাও। কাগজের মাপ <b>A4</b> বেছো।
          প্রশ্নগুলো আগে ফাঁকা থাকবে, যাতে নিজে নিজে আবার অনুশীলন করতে পারো। উত্তর আর সমাধান শেষে আলাদা পাতায় থাকবে।
        </p>

        <section className="mb-5 grid gap-4 rounded-box border border-base-300 p-4 sm:grid-cols-2 sm:p-5">
          <div className="grid gap-2">
            <span className="font-medium">কলাম</span>
            <div className="join">
              {[1, 2].map((c) => (
                <button key={c} type="button" className={`btn join-item ${columns === c ? 'btn-primary' : 'btn-outline'}`} onClick={() => setColumns(c)}>
                  {c === 1 ? '১' : '২'} কলাম
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <span className="font-medium">লেখার মাপ</span>
            <div className="join">
              {[
                [12, 'ছোট'],
                [13, 'মাঝারি'],
                [15, 'বড়'],
              ].map(([size, label]) => (
                <button key={size} type="button" className={`btn join-item ${fontSize === size ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFontSize(size)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" className="checkbox checkbox-primary" checked={includeKey} onChange={(e) => setIncludeKey(e.target.checked)} />
              শেষে আলাদা পাতায় উত্তরমালা দাও
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" className="checkbox checkbox-primary" checked={includeExplanations} onChange={(e) => setIncludeExplanations(e.target.checked)} disabled={!includeKey} />
              উত্তরমালার সাথে ব্যাখ্যা / সমাধানও দাও
            </label>
          </div>
        </section>

        <h2 className="mb-2 text-lg font-semibold">কাগজের প্রিভিউ</h2>
      </div>

      <div ref={wrapRef} className="paper-outer overflow-hidden rounded-box border border-base-300 bg-base-200 p-2 sm:p-4 print:border-0 print:bg-white print:p-0">
        <div className="paper-zoom mx-auto bg-white text-black shadow" style={{ width: `${PAPER_PX}px`, zoom: scale, fontSize: `${fontSize}px`, lineHeight: 1.55 }}>
          <div className="paper-sheet p-[12mm] print:p-0">
            <PaperHeader settings={settings} total={questions.length} />

            <div style={columns === 2 ? { columnCount: 2, columnGap: '8mm', columnRule: '1px solid #000' } : undefined}>
              {questions.map((q, i) => (
                <PaperQuestion key={q._id} q={q} number={i + 1} narrow={columns === 2} />
              ))}
            </div>

            {includeKey && (
              <div style={{ breakBefore: 'page' }} className="pt-6 print:pt-0">
                <h2 className="mb-1 text-center font-bold" style={{ fontSize: '1.3em' }}>
                  {settings.institution} · উত্তরমালা
                </h2>
                <p className="mb-3 text-center">{[settings.subject, settings.chapter].filter(Boolean).join(' · ')}</p>
                <KeyTable questions={questions} />
                {includeExplanations && <Explanations questions={questions} />}
              </div>
            )}

            <p className="paper-credit-screen mt-4 border-t border-black pt-1 text-center" style={{ fontSize: '0.85em' }}>
              Powered by Foundation of Science
            </p>
          </div>
        </div>
      </div>
    </>
  );
}