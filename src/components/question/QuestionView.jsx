import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { LETTERS, toBn } from '../../utils/format.js';
import MathText from '../math/MathText.jsx';

// mode:
//   'exam'   → স্টুডেন্ট অপশনে ক্লিক করে উত্তর দেয় (onSelect লাগে)
//   'review' → পরীক্ষার পরে: সঠিক সবুজ, ভুল লাল
//   'bank'   → প্রশ্ন ব্যাংকে: শুধু সঠিক উত্তর সবুজ
//   'pick'   → টিচার অপশনে ক্লিক করে সঠিক উত্তর ঠিক করে (selectedIndex = সঠিক অপশন, onSelect লাগে)
export default function QuestionView({ question, number, mode = 'bank', selectedIndex = null, onSelect }) {
  const { text, image, passage, passageImage, board, options, correctIndex, explanation } = question;

  return (
    <article className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {number != null && <span className="font-semibold text-primary">প্রশ্ন {toBn(number)}</span>}
        {board && <span className="badge badge-ghost">{board}</span>}
      </div>

      {(passage || passageImage) && (
        <div className="grid gap-2 rounded-box bg-base-200 p-3 text-base sm:text-lg">
          {passage && <MathText text={passage} />}
          {passageImage && <img src={passageImage} alt="উদ্দীপকের চিত্র" className="max-h-80 w-auto max-w-full rounded-box bg-base-100 object-contain" />}
        </div>
      )}

      {text && (
        <p className="text-base font-medium leading-8 sm:text-lg">
          <MathText text={text} />
        </p>
      )}

      {image && <img src={image} alt="প্রশ্নের ছবি" className="max-h-80 w-auto max-w-full rounded-box border border-base-300 object-contain" />}

      <div className="grid gap-2">
        {options.map((option, i) => (
          <Option
            key={i}
            option={option}
            index={i}
            mode={mode}
            isSelected={selectedIndex === i}
            isCorrect={correctIndex === i}
            onSelect={onSelect}
          />
        ))}
      </div>

      {mode === 'review' && explanation && (
        <div className="rounded-box border border-info/40 bg-info/5 p-3 text-sm">
          <span className="font-semibold">ব্যাখ্যা: </span>
          <MathText text={explanation} />
        </div>
      )}
    </article>
  );
}

function Option({ option, index, mode, isSelected, isCorrect, onSelect }) {
  let box = 'border-base-300';
  let badge = 'border-base-content/40 text-base-content/85';
  let note = null;

  if (mode === 'exam' && isSelected) {
    box = 'border-primary bg-primary/10';
    badge = 'border-primary bg-primary text-primary-content';
  } else if (mode === 'review') {
    if (isCorrect) {
      box = 'border-success bg-success/10';
      badge = 'border-success bg-success text-success-content';
      note = (
        <span className="flex items-center gap-1 text-xs font-semibold text-success sm:text-sm">
          <FiCheckCircle aria-hidden="true" /> {isSelected ? 'তোমার সঠিক উত্তর' : 'সঠিক উত্তর'}
        </span>
      );
    } else if (isSelected) {
      box = 'border-error bg-error/10';
      badge = 'border-error bg-error text-error-content';
      note = (
        <span className="flex items-center gap-1 text-xs font-semibold text-error sm:text-sm">
          <FiXCircle aria-hidden="true" /> তোমার উত্তর
        </span>
      );
    }
  } else if (mode === 'pick' && isSelected) {
    box = 'border-success bg-success/10';
    badge = 'border-success bg-success text-success-content';
    note = (
      <span className="flex items-center gap-1 text-xs font-semibold text-success sm:text-sm">
        <FiCheckCircle aria-hidden="true" /> সঠিক উত্তর
      </span>
    );
  } else if (mode === 'bank' && isCorrect) {
    box = 'border-success bg-success/10';
    badge = 'border-success bg-success text-success-content';
    note = (
      <span className="flex items-center gap-1 text-xs font-semibold text-success sm:text-sm">
        <FiCheckCircle aria-hidden="true" /> সঠিক
      </span>
    );
  }

  const content = (
    <>
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm font-semibold ${badge}`}>
        {LETTERS[index]}
      </span>
      <span className="min-w-0 flex-1 overflow-x-auto py-0.5 text-left">
        {option.text && <MathText text={option.text} />}
        {option.image && <img src={option.image} alt={`অপশন ${LETTERS[index]}`} className="mt-1 max-h-40 max-w-full object-contain" />}
      </span>
      {note}
    </>
  );

  const shared = `flex w-full items-center gap-3 rounded-box border px-3 py-2 ${box}`;

  if (mode === 'exam' || mode === 'pick') {
    return (
      <button
        type="button"
        onClick={() => onSelect?.(index)}
        aria-pressed={isSelected}
        className={`${shared} cursor-pointer transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
      >
        {content}
      </button>
    );
  }
  return <div className={shared}>{content}</div>;
}
