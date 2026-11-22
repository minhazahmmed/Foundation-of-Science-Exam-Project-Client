import { FiX } from 'react-icons/fi';
import MathText from '../math/MathText.jsx';
import { lettersOf, toBn } from '../../utils/format.js';

// প্রশ্নপত্রের কাগজের অংশগুলো (শিক্ষক আর স্টুডেন্ট দুই পেজেই ব্যবহার হয়)
const pad = (n) => toBn(String(n).padStart(2, '0'));

// অপশন ছোট হলে এক সারিতে ৪টা বা ২টা করে বসে, বড় হলে এক এক সারিতে একটা
function optionColumns(options, narrow) {
  const longest = Math.max(...options.map((o) => (o.text || '').length + (o.image ? 30 : 0)));
  if (!narrow && longest <= 14) return 4;
  if (longest <= (narrow ? 22 : 44)) return 2;
  return 1;
}

// প্রিন্টের সময় মেনু, ফুটার আর সেটিংস লুকিয়ে শুধু কাগজ দেখানো হয়
export function PrintStyle() {
  return (
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
  );
}

export function PaperHeader({ settings, total }) {
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

export function PaperQuestion({ q, number, narrow, onRemove }) {
  const letters = lettersOf(q.optionStyle);
  const cols = optionColumns(q.options, narrow);

  return (
    <div className="group relative mb-2.5" style={{ breakInside: 'avoid' }}>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="no-print absolute -top-1 -right-1 hidden h-6 w-6 place-items-center rounded-full bg-red-600 text-white group-hover:grid"
          aria-label={`প্রশ্ন ${number} বাদ দাও`}
          title="এই প্রশ্ন বাদ দাও"
        >
          <FiX size={14} aria-hidden="true" />
        </button>
      )}

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

export function KeyTable({ questions }) {
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

export function Explanations({ questions }) {
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