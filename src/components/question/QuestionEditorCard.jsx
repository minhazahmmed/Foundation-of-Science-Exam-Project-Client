import { useRef, useState } from 'react';
import { FiCopy, FiTrash2 } from 'react-icons/fi';
import { lettersOf, toBn } from '../../utils/format.js';
import { insertSnippet } from '../../utils/insertSnippet.js';
import MathText from '../math/MathText.jsx';
import MathToolbar from './MathToolbar.jsx';
import ImageInput from './ImageInput.jsx';
import QuestionView from './QuestionView.jsx';

// লেখার ঘরের ঠিক নিচে সমীকরণ কেমন দেখাবে সেটা সাথে সাথে দেখায় ($ থাকলেই)
function LivePreview({ text }) {
  if (!text || !text.includes('$')) return null;
  return (
    <div className="mt-1 rounded bg-base-200 px-3 py-2 text-lg" aria-label="সমীকরণ কেমন দেখাবে">
      <MathText text={text} />
    </div>
  );
}

// একটা প্রশ্ন ঠিক করার কার্ড (প্রশ্ন বানানো, প্রশ্ন ব্যাংকে ঠিক করা আর ছবি থেকে আনা প্রশ্ন ঠিক করা, তিন জায়গাতেই এটা)।
// card: { id, passage, passageImage, text, image, options: [{text, image} × ৪], correctIndex, explanation, explanationImage }
// pickAnswer=false হলে সঠিক উত্তর বাছার গোল ঘর থাকে না (যেখানে অন্যভাবে উত্তর বাছা হয়)
export default function QuestionEditorCard({
  card,
  index,
  title,
  errors = [],
  onChange,
  onDuplicate,
  onRemove,
  canRemove = false,
  pickAnswer = true,
  showPreview = true,
  imagesLocked = false,
  onImageLocked,
}) {
  const [showPassage, setShowPassage] = useState(Boolean(card.passage || card.passageImage));
  const [explanationOpen] = useState(Boolean(card.explanation || card.explanationImage));
  const focused = useRef({ key: 'text', el: null }); // কোন ঘরে সবশেষ ক্লিক করা হয়েছে

  const letters = lettersOf(card.optionStyle);
  const heading = title ?? (index != null ? `প্রশ্ন ${toBn(index + 1)}` : null);

  const valueOf = (key) => (key.startsWith('o') ? card.options[Number(key[1])].text : card[key] || '');
  const setValue = (key, value) =>
    key.startsWith('o') ? setOption(Number(key[1]), { text: value }) : onChange({ [key]: value });
  const setOption = (i, patch) =>
    onChange({ options: card.options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)) });

  const track = (key) => (e) => {
    focused.current = { key, el: e.target };
  };

  function insert(snippet) {
    const { key, el } = focused.current;
    const { next, position } = insertSnippet(el, valueOf(key), snippet);
    setValue(key, next);
    setTimeout(() => {
      el?.focus();
      el?.setSelectionRange(position, position);
    }, 0);
  }

  const hasMath = [card.text, card.passage, ...card.options.map((o) => o.text)].some((t) => t.includes('$'));

  return (
    <section id={`card-${card.id}`} className={`rounded-box border bg-base-100 p-4 sm:p-5 ${errors.length ? 'border-error' : 'border-base-300'}`}>
      {(heading || onDuplicate || (canRemove && onRemove)) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-primary">{heading}</h2>
          <div className="flex gap-1">
            {onDuplicate && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={onDuplicate}>
                <FiCopy aria-hidden="true" /> কপি করো
              </button>
            )}
            {canRemove && onRemove && (
              <button type="button" className="btn btn-ghost btn-sm text-error" onClick={onRemove}>
                <FiTrash2 aria-hidden="true" /> মোছো
              </button>
            )}
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <ul className="mb-3 list-disc pl-5 text-base font-medium text-error">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <div className="grid gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-base">
          <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={showPassage} onChange={(e) => setShowPassage(e.target.checked)} />
          এই প্রশ্নে উদ্দীপক আছে
        </label>

        {showPassage && (
          <div className="grid gap-3 rounded-box bg-base-200 p-3">
            <label>
              <span className="mb-1 block text-base font-medium">উদ্দীপক</span>
              <textarea className="textarea w-full text-base" rows={3} value={card.passage} onFocus={track('passage')} onChange={(e) => onChange({ passage: e.target.value })} />
              <LivePreview text={card.passage} />
            </label>
            <div>
              <span className="mb-1 block text-base font-medium">উদ্দীপকের চিত্র (থাকলে)</span>
              <ImageInput locked={imagesLocked} onLocked={onImageLocked} value={card.passageImage} onChange={(url) => onChange({ passageImage: url })} />
            </div>
          </div>
        )}

        <label>
          <span className="mb-1 block text-base font-medium">প্রশ্ন</span>
          <textarea className="textarea w-full text-base" rows={3} value={card.text} onFocus={track('text')} onChange={(e) => onChange({ text: e.target.value })} placeholder="প্রশ্নটা এখানে লেখো" />
          <LivePreview text={card.text} />
        </label>

        <div>
          <span className="mb-1 block text-base font-medium">প্রশ্নের ছবি (থাকলে)</span>
          <ImageInput locked={imagesLocked} onLocked={onImageLocked} value={card.image} onChange={(url) => onChange({ image: url })} />
        </div>

        <MathToolbar onInsert={insert} />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-base">
          <span className="font-medium">অপশনের চিহ্ন:</span>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="radio" name={`style-${card.id}`} className="radio radio-primary radio-sm" checked={card.optionStyle !== 'en'} onChange={() => onChange({ optionStyle: 'bn' })} />
            ক খ গ ঘ
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="radio" name={`style-${card.id}`} className="radio radio-primary radio-sm" checked={card.optionStyle === 'en'} onChange={() => onChange({ optionStyle: 'en' })} />
            A B C D
          </label>
        </div>

        <fieldset className="grid gap-2">
          <legend className="mb-1 text-base font-medium">{pickAnswer ? 'অপশন (সঠিকটার পাশের গোল ঘরে টিক দাও)' : 'অপশন'}</legend>
          {card.options.map((option, i) => (
            <div key={i} className={`rounded-box border p-2.5 ${pickAnswer && card.correctIndex === i ? 'border-success bg-success/10' : 'border-base-300'}`}>
              <div className="flex items-center gap-3">
                {pickAnswer && (
                  <input
                    type="radio"
                    name={`correct-${card.id}`}
                    className="radio radio-success"
                    checked={card.correctIndex === i}
                    onChange={() => onChange({ correctIndex: i })}
                    aria-label={`অপশন ${letters[i]} সঠিক উত্তর`}
                  />
                )}
                <span className="w-5 text-base font-semibold">{letters[i]}</span>
                <input className="input w-full text-base" value={option.text} onFocus={track(`o${i}`)} onChange={(e) => setOption(i, { text: e.target.value })} placeholder={`অপশন ${letters[i]}`} />
              </div>
              <div className="sm:pl-16">
                <LivePreview text={option.text} />
              </div>
              <div className="mt-2 sm:pl-16">
                <ImageInput locked={imagesLocked} onLocked={onImageLocked} compact value={option.image} onChange={(url) => setOption(i, { image: url })} />
              </div>
            </div>
          ))}
        </fieldset>

        <details className="rounded-box border border-base-300 p-3" open={explanationOpen}>
          <summary className="cursor-pointer text-base font-semibold text-primary">ব্যাখ্যা বা সমাধান যোগ করো (ঐচ্ছিক)</summary>
          <div className="mt-3 grid gap-3">
            <label>
              <span className="mb-1 block text-base font-medium">ব্যাখ্যা / সমাধান (লেখা)</span>
              <textarea className="textarea w-full text-base" rows={3} value={card.explanation || ''} onFocus={track('explanation')} onChange={(e) => onChange({ explanation: e.target.value })} />
              <LivePreview text={card.explanation} />
            </label>
            <div>
              <span className="mb-1 block text-base font-medium">সমাধানের ছবি</span>
              <ImageInput locked={imagesLocked} onLocked={onImageLocked} value={card.explanationImage || ''} onChange={(url) => onChange({ explanationImage: url })} />
              <p className="mt-1 text-sm">খাতায় সমাধান করে ছবি তুলে এখানে দিতে পারো। পরীক্ষার পর স্টুডেন্ট এটা দেখতে পাবে।</p>
            </div>
          </div>
        </details>
      </div>

      {showPreview && hasMath && (
        <div className="mt-4 rounded-box border border-dashed border-base-300 p-3">
          <p className="mb-2 text-base font-medium">প্রশ্নটা এভাবে দেখাবে</p>
          <QuestionView question={card} mode="bank" />
        </div>
      )}
    </section>
  );
}
