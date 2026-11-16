import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { createQuestion, updateQuestion } from '../../api/questions.api.js';
import { getErrorMessage } from '../../api/axios.js';
import Field from '../common/Field.jsx';
import QuestionEditorCard from './QuestionEditorCard.jsx';

const emptyCard = () => ({
  id: 'form',
  passage: '',
  passageImage: '',
  text: '',
  image: '',
  options: [0, 1, 2, 3].map(() => ({ text: '', image: '' })),
  correctIndex: -1,
  explanation: '',
  explanationImage: '',
});

const cardFrom = (q) => ({
  id: 'form',
  passage: q.passage || '',
  passageImage: q.passageImage || '',
  text: q.text || '',
  image: q.image || '',
  options: q.options.map((o) => ({ text: o.text || '', image: o.image || '' })),
  correctIndex: q.correctIndex,
  explanation: q.explanation || '',
  explanationImage: q.explanationImage || '',
});

// question না দিলে নতুন প্রশ্ন, দিলে সেই প্রশ্ন ঠিক করা
export default function QuestionForm({ question, chapters = [], onSaved, onClose }) {
  const [meta, setMeta] = useState({ subject: question?.subject || '', chapter: question?.chapter || '', board: question?.board || '' });
  const [card, setCard] = useState(() => (question ? cardFrom(question) : emptyCard()));
  const [saving, setSaving] = useState(false);

  // ফর্ম খোলা থাকলে পেছনের পেজ স্ক্রোল হবে না, শুধু ফর্মটা স্ক্রোল হবে
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const setMetaValue = (key) => (e) => setMeta((m) => ({ ...m, [key]: e.target.value }));
  const updateCard = (patch) => setCard((c) => ({ ...c, ...patch }));

  async function handleSubmit(event) {
    event.preventDefault();
    if (card.correctIndex < 0) {
      toast.error('কোনটা সঠিক উত্তর সেটা বেছে নাও');
      return;
    }

    setSaving(true);
    try {
      const body = { ...meta, ...card };
      const result = question ? await updateQuestion(question._id, body) : await createQuestion(body);
      toast.success(question ? 'প্রশ্ন ঠিক করা হয়েছে' : 'প্রশ্ন যোগ হয়েছে');
      onSaved(result);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    // পুরো পর্দা জুড়ে এই বাইরের অংশটাই স্ক্রোল হয়, তাই ফর্ম যত লম্বাই হোক ওপর-নিচ করা যায়
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/40"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="mx-auto my-4 w-full max-w-4xl px-3 sm:my-8">
        <form onSubmit={handleSubmit} className="rounded-box bg-base-100 shadow-xl">
          <div className="p-4 sm:p-6">
            <h3 className="text-2xl font-bold">{question ? 'প্রশ্ন ঠিক করো' : 'নতুন প্রশ্ন যোগ করো'}</h3>
            <p className="mt-1 text-base">
              সমীকরণ লিখতে নিচের চিহ্নের বোতাম চাপো, অথবা <code className="rounded bg-base-200 px-1">$</code> চিহ্নের ভেতরে লেখো। লেখার ঘরের নিচেই দেখতে পাবে সমীকরণ কেমন দেখাবে।
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Field label="বিষয়">
                <input className="input w-full text-base" value={meta.subject} onChange={setMetaValue('subject')} placeholder="যেমন: উচ্চতর গণিত" />
              </Field>
              <Field label="অধ্যায়">
                <input className="input w-full text-base" list="chapter-list" value={meta.chapter} onChange={setMetaValue('chapter')} placeholder="যেমন: ভেক্টর" />
                <datalist id="chapter-list">
                  {chapters.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
              <Field label="বোর্ড (ঐচ্ছিক)">
                <input className="input w-full text-base" value={meta.board} onChange={setMetaValue('board')} placeholder="যেমন: ঢা. বো. ২০১৯" />
              </Field>
            </div>

            <div className="mt-4">
              <QuestionEditorCard card={card} onChange={updateCard} showPreview={false} />
            </div>
          </div>

          {/* নিচের বোতাম দুটো স্ক্রোল করলেও নিচে আটকে থাকে */}
          <div className="sticky bottom-0 flex justify-end gap-2 rounded-b-box border-t border-base-300 bg-base-100 p-3 sm:px-6">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              বাতিল
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving && <span className="loading loading-spinner loading-sm" />}
              {question ? 'ঠিক করে সেভ করো' : 'প্রশ্ন সেভ করো'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
