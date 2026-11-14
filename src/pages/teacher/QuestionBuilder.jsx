import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../api/axios.js';
import { bulkCreateQuestions, listChapters } from '../../api/questions.api.js';
import Field from '../../components/common/Field.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import QuestionEditorCard from '../../components/question/QuestionEditorCard.jsx';
import useFetch from '../../hooks/useFetch.js';
import { toBn } from '../../utils/format.js';
import { normalizeForPreview } from '../../utils/importPreview.js';

let nextId = 1;
const emptyCard = () => ({
  id: nextId++,
  passage: '',
  passageImage: '',
  text: '',
  image: '',
  options: [0, 1, 2, 3].map(() => ({ text: '', image: '' })),
  correctIndex: -1,
});

// কার্ড থেকে সেভ করার মতো প্রশ্ন বানায়, সাথে সমস্যাগুলোর তালিকা
function check(card) {
  const item = normalizeForPreview(card, 0);
  const errors = [...item.problems];
  if (item.correctIndex < 0) errors.push('সঠিক উত্তর কোনটা সেটা বেছে নাও');
  return errors;
}

// গুগল ফর্মের মতো করে একসাথে অনেক প্রশ্ন বানানোর পেজ
export default function QuestionBuilder() {
  const navigate = useNavigate();
  const [cards, setCards] = useState(() => [emptyCard()]);
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [tried, setTried] = useState(false); // সেভ করতে গিয়ে একবার আটকালে তারপর থেকে ভুলগুলো দেখায়
  const [saving, setSaving] = useState(false);

  const chaptersFetcher = useCallback(() => listChapters(), []);
  const chapters = useFetch(chaptersFetcher);

  const update = (id, patch) => setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const remove = (id) => setCards((prev) => prev.filter((c) => c.id !== id));
  const duplicate = (id) =>
    setCards((prev) => {
      const i = prev.findIndex((c) => c.id === id);
      const copy = { ...prev[i], id: nextId++, options: prev[i].options.map((o) => ({ ...o })) };
      return [...prev.slice(0, i + 1), copy, ...prev.slice(i + 1)];
    });

  async function handleSave() {
    const failing = cards.find((c) => check(c).length > 0);
    if (failing) {
      setTried(true);
      toast.error('কিছু প্রশ্নে ভুল আছে, লাল দাগ দেওয়া জায়গাগুলো ঠিক করো');
      document.getElementById(`card-${failing.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSaving(true);
    try {
      const questions = cards.map((c) => ({
        passage: c.passage,
        passageImage: c.passageImage,
        question: c.text,
        image: c.image,
        options: c.options,
        correctIndex: c.correctIndex,
      }));
      const result = await bulkCreateQuestions({ subject, chapter, questions });
      toast.success(`${toBn(result.created)}টি প্রশ্ন প্রশ্ন ব্যাংকে যোগ হয়েছে`);
      navigate('/teacher/questions');
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSaving(false);
    }
  }

  const readyCount = cards.filter((c) => check(c).length === 0).length;

  return (
    <>
      <PageHeader
        title="প্রশ্ন বানাও"
        subtitle="গুগল ফর্মের মতো একটার পর একটা প্রশ্ন লেখো, সঠিক উত্তরে টিক দাও, তারপর সবগুলো একসাথে সেভ করো"
        actions={<Link to="/teacher/import" className="btn btn-outline">ছবি থেকে প্রশ্ন নাও</Link>}
      />

      <section className="mb-5 grid gap-3 rounded-box border border-base-300 p-4 sm:grid-cols-2 sm:p-5">
        <Field label="বিষয়" hint="নিচের সব প্রশ্নে বসে যাবে (ঐচ্ছিক)">
          <input className="input w-full" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="যেমন: উচ্চতর গণিত" />
        </Field>
        <Field label="অধ্যায়" hint="নিচের সব প্রশ্নে বসে যাবে (ঐচ্ছিক)">
          <input className="input w-full" list="builder-chapters" value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="যেমন: ভেক্টর" />
          <datalist id="builder-chapters">
            {(chapters.data?.chapters || []).map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
      </section>

      <div className="grid gap-5">
        {cards.map((card, i) => (
          <QuestionEditorCard
            key={card.id}
            card={card}
            index={i}
            errors={tried ? check(card) : []}
            canRemove={cards.length > 1}
            onChange={(patch) => update(card.id, patch)}
            onDuplicate={() => duplicate(card.id)}
            onRemove={() => remove(card.id)}
          />
        ))}
      </div>

      <div className="sticky bottom-0 z-20 mt-6 flex flex-col gap-2 border-t border-base-300 bg-base-100 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-base font-medium">
          {toBn(cards.length)}টি প্রশ্নের মধ্যে {toBn(readyCount)}টি তৈরি
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn flex-1 sm:flex-none" onClick={() => setCards((prev) => [...prev, emptyCard()])}>
            <FiPlus aria-hidden="true" /> আরেকটা প্রশ্ন
          </button>
          <button type="button" className="btn btn-primary flex-1 sm:flex-none" onClick={handleSave} disabled={saving}>
            {saving && <span className="loading loading-spinner loading-sm" />}
            সবগুলো সেভ করো
          </button>
        </div>
      </div>
    </>
  );
}
