import { useEffect, useMemo, useRef, useState } from 'react';
import { FiArrowLeft, FiPrinter, FiRefreshCw, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState.jsx';
import MathText from '../../components/math/MathText.jsx';
import { lettersOf, toBn } from '../../utils/format.js';
import { loadSelection, saveSelection } from '../../utils/printSelection.js';
import { shuffleOptions, shuffled } from '../../utils/shuffle.js';

const SETTINGS_KEY = 'fos-paper-settings-v1';
const PAPER_PX = 794; // A4 এর প্রস্থ (২১০ মিমি) পর্দায়

const DEFAULTS = {
  institution: 'Foundation of Science',
  examTitle: '',
  fullMarks: '',
  className: '',
  subject: '',
  chapter: '',
  time: '',
  setCode: 'ক',
  instruction: 'প্রশ্নপত্রে কোনো প্রকার দাগ/চিহ্ন দেয়া যাবে না।',
  columns: 2,
  fontSize: 13,
  shuffleQuestions: false,
  shuffleOptions: false,
  includeKey: true,
  includeExplanations: false,
};

function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

const pad = (n) => toBn(String(n).padStart(2, '0'));

// অপশন ছোট হলে এক সারিতে ৪টা বা ২টা করে বসে, বড় হলে এক এক সারিতে একটা
function optionColumns(options, narrow) {
  const longest = Math.max(...options.map((o) => (o.text || '').length + (o.image ? 30 : 0)));
  if (!narrow && longest <= 14) return 4;
  if (longest <= (narrow ? 22 : 44)) return 2;
  return 1;
}

export default function PrintPaper() {
  const [selected, setSelected] = useState(loadSelection);
  const [settings, setSettings] = useState(loadSettings);
  const [seed, setSeed] = useState(1);
  const [scale, setScale] = useState(1);
  const wrapRef = useRef(null);

  const set = (patch) => setSettings((prev) => ({ ...prev, ...patch }));

  // বাছা প্রশ্নগুলোর বিষয় বা অধ্যায় একটাই হলে ঘর ফাঁকা থাকলে সেটাই দেখানো হয়
  const only = (field) => {
    const values = [...new Set(selected.map((q) => q[field]).filter(Boolean))];
    return values.length === 1 ? values[0] : '';
  };
  const subject = settings.subject || only('subject');
  const chapter = settings.chapter || only('chapter');

  // সেটিংস মনে রাখা হয়, পরের বার আবার লিখতে হয় না
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // জমা না হলেও সমস্যা নেই
    }
  }, [settings]);

  // মোবাইলে কাগজের পুরো প্রস্থ পর্দায় ঢোকাতে ছোট করে দেখানো হয়। প্রিন্টে এটা কাজ করে না।
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const update = () => setScale(Math.min(1, el.clientWidth / PAPER_PX));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [selected.length]);

  const questions = useMemo(() => {
    let list = settings.shuffleQuestions ? shuffled(selected, seed) : selected;
    if (settings.shuffleOptions) list = list.map((q, i) => shuffleOptions(q, seed * 1000 + i + 1));
    return list;
  }, [selected, settings.shuffleQuestions, settings.shuffleOptions, seed]);

  function remove(id) {
    const next = selected.filter((q) => q._id !== id);
    setSelected(next);
    saveSelection(next);
  }

  if (selected.length === 0) {
    return (
      <EmptyState
        title="কোনো প্রশ্ন বাছা হয়নি"
        text="প্রশ্ন ব্যাংক থেকে যে প্রশ্নগুলো দিয়ে প্রশ্নপত্র বানাবে সেগুলোর পাশের ঘরে টিক দাও, তারপর এখানে আসো।"
        action={<Link to="/teacher/questions" className="btn btn-primary">প্রশ্ন ব্যাংকে যাও</Link>}
      />
    );
  }

  const narrow = settings.columns === 2;
  const total = questions.length;

  return (
    <>
      {/* প্রিন্টের সময় মেনু, ফুটার আর সেটিংস লুকিয়ে শুধু কাগজ দেখানো হয় */}
      <style>{`
        @page { size: A4; margin: 10mm 10mm 15mm 10mm; @bottom-center { content: "Powered by Foundation of Science"; font-size: 10px; color: #000; } }
        @media print {
          header, footer, .no-print { display: none !important; }
          html, body { background: #fff !important; }
          .paper-zoom { zoom: 1 !important; width: auto !important; max-width: none !important; box-shadow: none !important; }
          .paper-credit-screen { display: none !important; }
          main, .paper-outer { padding: 0 !important; margin: 0 !important; max-width: none !important; }
        }
      `}</style>

      <div className="no-print">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">প্রশ্নপত্র বানাও</h1>
            <p className="mt-1 text-base-content/85">{toBn(total)}টি প্রশ্ন বাছা হয়েছে। নিচে সেটিংস ঠিক করো, তারপর PDF করো।</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/teacher/questions" className="btn btn-outline">
              <FiArrowLeft aria-hidden="true" /> প্রশ্ন ব্যাংক
            </Link>
            <button type="button" className="btn btn-primary" onClick={() => window.print()}>
              <FiPrinter aria-hidden="true" /> PDF করো / প্রিন্ট
            </button>
          </div>
        </div>

        <p className="mb-4 rounded-box bg-base-200 p-3 text-base">
          PDF হিসেবে সেভ করতে উপরের বাটন চাপো, তারপর খোলা জানালায় প্রিন্টারের জায়গায় <b>"PDF হিসেবে সেভ করুন"</b> (Save as PDF) বেছে নাও। কাগজ A4, মার্জিন "ডিফল্ট" রাখো।
        </p>

        <section className="mb-5 grid gap-4 rounded-box border border-base-300 p-4 sm:p-5 lg:grid-cols-2">
          <TextField label="প্রতিষ্ঠানের নাম" value={settings.institution} onChange={(v) => set({ institution: v })} />
          <TextField label="পরীক্ষার নাম" value={settings.examTitle} onChange={(v) => set({ examTitle: v })} placeholder="যেমন: মডেল টেস্ট ০১" />
          <TextField label="পূর্ণমান" value={settings.fullMarks} onChange={(v) => set({ fullMarks: v })} placeholder="ফাঁকা রাখলে প্রশ্নের সংখ্যা বসবে" />
          <TextField label="শ্রেণি" value={settings.className} onChange={(v) => set({ className: v })} placeholder="যেমন: নবম/দশম" />
          <TextField label="বিষয়" value={subject} onChange={(v) => set({ subject: v })} placeholder="যেমন: গণিত" />
          <TextField label="অধ্যায়" value={chapter} onChange={(v) => set({ chapter: v })} placeholder="যেমন: বাস্তব সংখ্যা" />
          <TextField label="সময়" value={settings.time} onChange={(v) => set({ time: v })} placeholder="যেমন: ১৫ মিনিট" />
          <TextField label="সেট কোড" value={settings.setCode} onChange={(v) => set({ setCode: v })} placeholder="ক" />
          <div className="lg:col-span-2">
            <TextField label="নির্দেশনা" value={settings.instruction} onChange={(v) => set({ instruction: v })} />
          </div>

          <div className="grid gap-2">
            <span className="font-medium">কলাম</span>
            <div className="join">
              {[1, 2].map((c) => (
                <button key={c} type="button" className={`btn join-item ${settings.columns === c ? 'btn-primary' : 'btn-outline'}`} onClick={() => set({ columns: c })}>
                  {toBn(c)} কলাম
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
                <button key={size} type="button" className={`btn join-item ${settings.fontSize === size ? 'btn-primary' : 'btn-outline'}`} onClick={() => set({ fontSize: size })}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2 lg:col-span-2">
            <span className="font-medium">একাধিক সেট বানাতে (ক, খ ...)</span>
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" className="checkbox checkbox-primary" checked={settings.shuffleQuestions} onChange={(e) => set({ shuffleQuestions: e.target.checked })} />
              প্রশ্নের ক্রম এলোমেলো করো
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" className="checkbox checkbox-primary" checked={settings.shuffleOptions} onChange={(e) => set({ shuffleOptions: e.target.checked })} />
              অপশনের ক্রম এলোমেলো করো (উত্তরমালা নিজে থেকে মিলে যাবে)
            </label>
            {(settings.shuffleQuestions || settings.shuffleOptions) && (
              <div>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setSeed((s) => s + 1)}>
                  <FiRefreshCw aria-hidden="true" /> নতুন করে মেশাও
                </button>
                <span className="ml-3 text-sm text-base-content/85">মেশানোর পর সেট কোড বদলাতে ভুলো না (যেমন ক থেকে খ)।</span>
              </div>
            )}
          </div>

          <div className="grid gap-2 lg:col-span-2">
            <span className="font-medium">উত্তরমালা</span>
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" className="checkbox checkbox-primary" checked={settings.includeKey} onChange={(e) => set({ includeKey: e.target.checked })} />
              শেষে আলাদা পাতায় উত্তরমালা দাও
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" className="checkbox checkbox-primary" checked={settings.includeExplanations} onChange={(e) => set({ includeExplanations: e.target.checked })} disabled={!settings.includeKey} />
              উত্তরমালার সাথে ব্যাখ্যা / সমাধানও দাও
            </label>
          </div>
        </section>

        <h2 className="mb-2 text-lg font-semibold">কাগজের প্রিভিউ</h2>
      </div>

      <div ref={wrapRef} className="paper-outer overflow-hidden rounded-box border border-base-300 bg-base-200 p-2 sm:p-4 print:border-0 print:bg-white print:p-0">
        <div
          className="paper-zoom mx-auto bg-white text-black shadow"
          style={{ width: `${PAPER_PX}px`, zoom: scale, fontSize: `${settings.fontSize}px`, lineHeight: 1.55 }}
        >
          <div className="paper-sheet p-[12mm] print:p-0">
            <PaperHeader settings={{ ...settings, subject, chapter }} total={total} />

            <div
              style={settings.columns === 2 ? { columnCount: 2, columnGap: '8mm', columnRule: '1px solid #000' } : undefined}
            >
              {questions.map((q, i) => (
                <PaperQuestion key={q._id} q={q} number={i + 1} narrow={narrow} onRemove={() => remove(q._id)} />
              ))}
            </div>

            {settings.includeKey && (
              <div style={{ breakBefore: 'page' }} className="pt-6 print:pt-0">
                <h2 className="mb-1 text-center font-bold" style={{ fontSize: '1.3em' }}>
                  {settings.institution} · উত্তরমালা
                </h2>
                <p className="mb-3 text-center">
                  {[subject, chapter].filter(Boolean).join(' · ')} {settings.setCode && `· সেট ${settings.setCode}`}
                </p>
                <KeyTable questions={questions} />
                {settings.includeExplanations && <Explanations questions={questions} />}
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

function TextField({ label, value, onChange, placeholder }) {
  return (
    <label className="grid gap-1">
      <span className="font-medium">{label}</span>
      <input className="input w-full" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

function PaperHeader({ settings, total }) {
  return (
    <div className="mb-3 border-b-2 border-black pb-2">
      <div className="relative text-center">
        {settings.setCode && (
          <span className="absolute top-0 right-0 flex items-center gap-1 text-sm">
            সেট কোড: <span className="inline-block min-w-7 border border-black px-1.5 text-center font-bold">{settings.setCode}</span>
          </span>
        )}
        <h1 className="font-bold" style={{ fontSize: '1.5em' }}>{settings.institution}</h1>
        {settings.examTitle && <p className="font-semibold">{settings.examTitle}</p>}
        {settings.className && <p>{settings.className}</p>}
        {settings.subject && <p>{settings.subject}</p>}
        {settings.chapter && <p>অধ্যায়: {settings.chapter}</p>}
      </div>
      <div className="mt-2 flex justify-between font-medium">
        <span>{settings.time && `সময়: ${settings.time}`}</span>
        <span>পূর্ণমান– {toBn(settings.fullMarks || total)}</span>
      </div>
      {settings.instruction && <p className="mt-2 text-center font-semibold">{settings.instruction}</p>}
    </div>
  );
}

function PaperQuestion({ q, number, narrow, onRemove }) {
  const letters = lettersOf(q.optionStyle);
  const cols = optionColumns(q.options, narrow);

  return (
    <div className="group relative mb-2.5" style={{ breakInside: 'avoid' }}>
      <button
        type="button"
        onClick={onRemove}
        className="no-print absolute -top-1 -right-1 hidden h-6 w-6 place-items-center rounded-full bg-red-600 text-white group-hover:grid"
        aria-label={`প্রশ্ন ${number} বাদ দাও`}
        title="এই প্রশ্ন বাদ দাও"
      >
        <FiX size={14} aria-hidden="true" />
      </button>

      {(q.passage || q.passageImage) && (
        <div className="mb-1">
          {q.passage && <MathText text={q.passage} />}
          {q.passageImage && <img src={q.passageImage} alt="" className="my-1 max-h-48 max-w-full object-contain" />}
        </div>
      )}

      <p className="font-medium">
        {pad(number)}। <MathText text={q.text} />
        {q.board && <span className="ml-1 text-[0.85em] font-normal">[{q.board}]</span>}
      </p>
      {q.image && <img src={q.image} alt="" className="my-1 max-h-48 max-w-full object-contain" />}

      <div className="mt-0.5 grid gap-x-3 gap-y-0.5 pl-5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {q.options.map((o, i) => (
          <div key={i} className="flex gap-1">
            <span className="shrink-0">({letters[i]})</span>
            <span className="min-w-0">
              {o.text && <MathText text={o.text} />}
              {o.image && <img src={o.image} alt="" className="max-h-20 max-w-full object-contain" />}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KeyTable({ questions }) {
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
      {questions.map((q, i) => (
        <div key={q._id} className="border border-black px-2 py-1 text-center">
          {pad(i + 1)}। <b>{q.correctIndex >= 0 ? lettersOf(q.optionStyle)[q.correctIndex] : '-'}</b>
        </div>
      ))}
    </div>
  );
}

function Explanations({ questions }) {
  const withExplanation = questions.map((q, i) => ({ q, i })).filter(({ q }) => q.explanation || q.explanationImage);
  if (withExplanation.length === 0) return null;

  return (
    <div className="mt-5">
      <h3 className="mb-2 font-bold" style={{ fontSize: '1.15em' }}>ব্যাখ্যা / সমাধান</h3>
      {withExplanation.map(({ q, i }) => (
        <div key={q._id} className="mb-2" style={{ breakInside: 'avoid' }}>
          <p>
            <b>{pad(i + 1)}।</b> {q.explanation && <MathText text={q.explanation} />}
          </p>
          {q.explanationImage && <img src={q.explanationImage} alt="" className="my-1 max-h-48 max-w-full object-contain" />}
        </div>
      ))}
    </div>
  );
}