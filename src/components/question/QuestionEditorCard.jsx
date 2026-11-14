import { useRef, useState } from 'react';
import { FiCopy, FiTrash2 } from 'react-icons/fi';
import { LETTERS, toBn } from '../../utils/format.js';
import { insertSnippet } from '../../utils/insertSnippet.js';
import MathToolbar from './MathToolbar.jsx';
import ImageInput from './ImageInput.jsx';
import QuestionView from './QuestionView.jsx';

// গুগল ফর্মের মতো একটা প্রশ্নের কার্ড। প্রশ্ন, অপশন আর সঠিক উত্তর এখানেই ঠিক হয়।
// card: { id, passage, passageImage, text, image, options: [{text, image} × ৪], correctIndex }
export default function QuestionEditorCard({ card, index, errors = [], onChange, onDuplicate, onRemove, canRemove }) {
  const [showPassage, setShowPassage] = useState(Boolean(card.passage || card.passageImage));
  const focused = useRef({ key: 'text', el: null }); // কোন ঘরে সবশেষ ক্লিক করা হয়েছে

  const valueOf = (key) => (key.startsWith('o') ? card.options[Number(key[1])].text : card[key]);
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
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-primary">প্রশ্ন {toBn(index + 1)}</h2>
        <div className="flex gap-1">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onDuplicate}>
            <FiCopy aria-hidden="true" /> কপি করো
          </button>
          {canRemove && (
            <button type="button" className="btn btn-ghost btn-sm text-error" onClick={onRemove}>
              <FiTrash2 aria-hidden="true" /> মোছো
            </button>
          )}
        </div>
      </div>

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
              <span className="mb-1 block text-sm font-medium">উদ্দীপক</span>
              <textarea className="textarea w-full" rows={3} value={card.passage} onFocus={track('passage')} onChange={(e) => onChange({ passage: e.target.value })} />
            </label>
            <div>
              <span className="mb-1 block text-sm font-medium">উদ্দীপকের চিত্র (থাকলে)</span>
              <ImageInput value={card.passageImage} onChange={(url) => onChange({ passageImage: url })} />
            </div>
          </div>
        )}

        <label>
          <span className="mb-1 block text-sm font-medium">প্রশ্ন</span>
          <textarea className="textarea w-full text-base" rows={3} value={card.text} onFocus={track('text')} onChange={(e) => onChange({ text: e.target.value })} placeholder="প্রশ্নটা এখানে লেখো" />
        </label>

        <div>
          <span className="mb-1 block text-sm font-medium">প্রশ্নের ছবি (থাকলে)</span>
          <ImageInput value={card.image} onChange={(url) => onChange({ image: url })} />
        </div>

        <MathToolbar onInsert={insert} />

        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium">অপশন (সঠিকটার পাশের গোল ঘরে টিক দাও)</legend>
          {card.options.map((option, i) => (
            <div key={i} className={`rounded-box border p-2.5 ${card.correctIndex === i ? 'border-success bg-success/10' : 'border-base-300'}`}>
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name={`correct-${card.id}`}
                  className="radio radio-success"
                  checked={card.correctIndex === i}
                  onChange={() => onChange({ correctIndex: i })}
                  aria-label={`অপশন ${LETTERS[i]} সঠিক উত্তর`}
                />
                <span className="w-5 font-semibold">{LETTERS[i]}</span>
                <input className="input w-full" value={option.text} onFocus={track(`o${i}`)} onChange={(e) => setOption(i, { text: e.target.value })} placeholder={`অপশন ${LETTERS[i]}`} />
              </div>
              <div className="mt-2 sm:pl-16">
                <ImageInput compact value={option.image} onChange={(url) => setOption(i, { image: url })} />
              </div>
            </div>
          ))}
        </fieldset>
      </div>

      {hasMath && (
        <div className="mt-4 rounded-box border border-dashed border-base-300 p-3">
          <p className="mb-2 text-sm font-medium text-base-content/85">প্রশ্নটা এভাবে দেখাবে</p>
          <QuestionView question={card} mode="bank" />
        </div>
      )}
    </section>
  );
}
