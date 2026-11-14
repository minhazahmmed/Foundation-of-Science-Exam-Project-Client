import { useState } from 'react';
import toast from 'react-hot-toast';
import { createQuestion, updateQuestion } from '../../api/questions.api.js';
import { getErrorMessage } from '../../api/axios.js';
import { LETTERS } from '../../utils/format.js';
import Field from '../common/Field.jsx';
import MathText from '../math/MathText.jsx';
import ImageInput from './ImageInput.jsx';

const emptyForm = {
  subject: '',
  chapter: '',
  board: '',
  passage: '',
  passageImage: '',
  text: '',
  image: '',
  options: [0, 1, 2, 3].map(() => ({ text: '', image: '' })),
  correctIndex: null,
  explanation: '',
};

const fromQuestion = (q) => ({
  subject: q.subject || '',
  chapter: q.chapter || '',
  board: q.board || '',
  passage: q.passage || '',
  passageImage: q.passageImage || '',
  text: q.text || '',
  image: q.image || '',
  options: q.options.map((o) => ({ text: o.text || '', image: o.image || '' })),
  correctIndex: q.correctIndex,
  explanation: q.explanation || '',
});

// question না দিলে নতুন প্রশ্ন, দিলে সেই প্রশ্ন ঠিক করা
export default function QuestionForm({ question, chapters = [], onSaved, onClose }) {
  const [form, setForm] = useState(() => (question ? fromQuestion(question) : emptyForm));
  const [saving, setSaving] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setOption = (i, key, value) =>
    setForm((f) => ({
      ...f,
      options: f.options.map((o, idx) => (idx === i ? { ...o, [key]: value } : o)),
    }));

  async function handleSubmit(event) {
    event.preventDefault();
    if (form.correctIndex === null) {
      toast.error('কোনটা সঠিক উত্তর সেটা বেছে নাও');
      return;
    }

    setSaving(true);
    try {
      const result = question
        ? await updateQuestion(question._id, form)
        : await createQuestion(form);
      toast.success(question ? 'প্রশ্ন ঠিক করা হয়েছে' : 'প্রশ্ন যোগ হয়েছে');
      onSaved(result);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal modal-open items-start overflow-y-auto sm:items-center" role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit} className="modal-box my-4 max-h-none w-full max-w-2xl">
        <h3 className="text-xl font-bold">{question ? 'প্রশ্ন ঠিক করো' : 'নতুন প্রশ্ন যোগ করো'}</h3>
        <p className="mt-1 text-sm text-base-content/85">
          সমীকরণ লিখতে <code className="rounded bg-base-200 px-1">$</code> চিহ্নের ভেতরে লেখো, যেমন{' '}
          <code className="rounded bg-base-200 px-1">{'$\\frac{x^2}{2}$'}</code>
        </p>

        <div className="mt-4 grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="বিষয়">
              <input className="input w-full" value={form.subject} onChange={(e) => set('subject', e.target.value)} placeholder="যেমন: উচ্চতর গণিত" />
            </Field>
            <Field label="অধ্যায়">
              <input className="input w-full" list="chapter-list" value={form.chapter} onChange={(e) => set('chapter', e.target.value)} placeholder="যেমন: ভেক্টর" />
              <datalist id="chapter-list">
                {chapters.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="বোর্ড (ঐচ্ছিক)">
              <input className="input w-full" value={form.board} onChange={(e) => set('board', e.target.value)} placeholder="যেমন: ঢা. বো. ২০১৯" />
            </Field>
          </div>

          <Field label="উদ্দীপক (থাকলে)">
            <textarea className="textarea w-full" rows={2} value={form.passage} onChange={(e) => set('passage', e.target.value)} />
          </Field>

          <Field label="উদ্দীপকের চিত্র (থাকলে)">
            <ImageInput value={form.passageImage} onChange={(url) => set('passageImage', url)} />
          </Field>

          <Field label="প্রশ্ন">
            <textarea className="textarea w-full" rows={3} value={form.text} onChange={(e) => set('text', e.target.value)} />
          </Field>
          {form.text.includes('$') && (
            <div className="rounded-box border border-dashed border-base-300 p-3 text-sm">
              <span className="mb-1 block text-xs text-base-content/75">প্রশ্নটা এভাবে দেখাবে</span>
              <MathText text={form.text} />
            </div>
          )}

          <Field label="প্রশ্নের ছবি (চিত্র থাকলে)">
            <ImageInput value={form.image} onChange={(url) => set('image', url)} />
          </Field>

          <fieldset className="grid gap-3">
            <legend className="mb-1 text-sm font-medium">অপশন (সঠিকটার পাশের গোল ঘরে টিক দাও)</legend>
            {form.options.map((option, i) => (
              <div key={i} className="rounded-box border border-base-300 p-3">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correct"
                    className="radio radio-primary"
                    checked={form.correctIndex === i}
                    onChange={() => set('correctIndex', i)}
                    aria-label={`অপশন ${LETTERS[i]} সঠিক`}
                  />
                  <span className="w-5 font-semibold">{LETTERS[i]}</span>
                  <input className="input w-full" value={option.text} onChange={(e) => setOption(i, 'text', e.target.value)} placeholder={`অপশন ${LETTERS[i]}`} />
                </div>
                <div className="mt-2 pl-0 sm:pl-14">
                  <ImageInput compact value={option.image} onChange={(url) => setOption(i, 'image', url)} />
                </div>
              </div>
            ))}
          </fieldset>

          <Field label="ব্যাখ্যা (ঐচ্ছিক)" hint="পরীক্ষার পর স্টুডেন্ট এটা দেখতে পাবে">
            <textarea className="textarea w-full" rows={2} value={form.explanation} onChange={(e) => set('explanation', e.target.value)} />
          </Field>
        </div>

        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            বাতিল
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving && <span className="loading loading-spinner loading-sm" />}
            {question ? 'ঠিক করে সেভ করো' : 'প্রশ্ন সেভ করো'}
          </button>
        </div>
      </form>
      <div className="modal-backdrop bg-black/40" onClick={saving ? undefined : onClose} />
    </div>
  );
}
