import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiAlertCircle, FiImage, FiPlus } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import CopyButton from '../../components/common/CopyButton.jsx';
import Field from '../../components/common/Field.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import QuestionEditorCard from '../../components/question/QuestionEditorCard.jsx';
import QuestionView from '../../components/question/QuestionView.jsx';
import { DEMO_KEY as STORE_KEY } from '../../utils/demoStore.js';
import { toBn } from '../../utils/format.js';
import { normalizeForPreview } from '../../utils/importPreview.js';


let nextId = 1;
// রিফ্রেশের পর আগের জমা প্রশ্নের আইডির সাথে যেন না মেলে, তাই আইডিতে এলোমেলো অংশ থাকে
const newId = () => `demo-${Math.random().toString(36).slice(2, 8)}-${nextId++}`;
const emptyCard = () => ({
  id: newId(),
  passage: '',
  passageImage: '',
  text: '',
  image: '',
  options: [0, 1, 2, 3].map(() => ({ text: '', image: '' })),
  correctIndex: -1,
  explanation: '',
  explanationImage: '',
  optionStyle: 'bn',
});

const AI_PROMPT = `এই ছবির সব MCQ প্রশ্ন নিচের JSON আকারে দাও। শুধু JSON দেবে, অন্য কিছু লিখবে না।
- সমীকরণ ও ভেক্টর চিহ্ন LaTeX আকারে $...$ এর ভেতরে লেখো (যেমন $\\vec{A}\\times\\vec{B}$)।
- উদ্দীপক থাকলে "passage" এ দাও, বোর্ডের নাম থাকলে "board" এ দাও।

[
  { "question": "...", "options": ["...", "...", "...", "..."], "answer": "ক" }
]`;

function loadDraft() {
  try {
    const list = JSON.parse(sessionStorage.getItem(STORE_KEY) || '[]');
    return Array.isArray(list) && list.length > 0 ? list : null;
  } catch {
    return null;
  }
}

// শিক্ষকের সুবিধাগুলো স্টুডেন্ট এখানে ঘুরে দেখতে পারে। কিছুই ডেটাবেসে জমা হয় না।
// ছবি থেকে প্রশ্ন বের করা (Gemini) আর ছবি আপলোড এখানে বন্ধ, শুধু অনুমোদিত শিক্ষকদের জন্য।
export default function DemoTeacher() {
  const [cards, setCards] = useState(() => loadDraft() ?? [emptyCard()]);
  const [tab, setTab] = useState('build');
  const [json, setJson] = useState('');
  const [parseError, setParseError] = useState('');
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(cards));
    } catch {
      // জমা না থাকলেও চলবে
    }
  }, [cards]);

  const locked = () =>
    toast('ছবি থেকে প্রশ্ন বের করা আর ছবি যোগ করা শুধু শিক্ষকদের জন্য। ব্যবহার করতে শিক্ষক অনুমোদনের অনুরোধ পাঠাও।', { icon: '🔒', duration: 5000 });

  const update = (id, patch) => setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const remove = (id) => setCards((prev) => prev.filter((c) => c.id !== id));
  const duplicate = (id) =>
    setCards((prev) => {
      const i = prev.findIndex((c) => c.id === id);
      const copy = { ...prev[i], id: newId(), options: prev[i].options.map((o) => ({ ...o })) };
      return [...prev.slice(0, i + 1), copy, ...prev.slice(i + 1)];
    });

  function addFromJson() {
    try {
      const parsed = JSON.parse(json);
      const list = Array.isArray(parsed) ? parsed : parsed.questions;
      if (!Array.isArray(list) || list.length === 0) throw new Error('empty');
      const added = list.slice(0, 50).map((raw, i) => {
        const item = normalizeForPreview(raw, i);
        // ডেমোতে বাইরের ছবির লিংক নেওয়া হয় না
        return { ...emptyCard(), passage: item.passage, text: item.text, options: item.options.map((o) => ({ text: o.text, image: '' })), correctIndex: item.correctIndex, explanation: item.explanation, optionStyle: item.optionStyle };
      });
      setCards((prev) => [...(prev.length === 1 && !prev[0].text ? [] : prev), ...added]);
      setJson('');
      setParseError('');
      setTab('build');
      toast.success(`${toBn(added.length)}টি প্রশ্ন নিচে যোগ হয়েছে`);
    } catch {
      setParseError('JSON পড়া যাচ্ছে না। পুরোটা ঠিকমতো কপি করেছ কিনা দেখো। প্রশ্নগুলো [ ] এর ভেতরে থাকতে হবে।');
    }
  }

  const tabs = [
    { key: 'build', label: 'নিজে প্রশ্ন বানাও' },
    { key: 'json', label: 'JSON বসাও' },
    { key: 'image', label: 'ছবি থেকে প্রশ্ন 🔒' },
  ];
  const ready = cards.filter((c) => (c.text.trim() || c.image) && c.options.every((o) => o.text.trim()) && c.correctIndex >= 0);

  return (
    <>
      <PageHeader title="শিক্ষকের ডেমো" subtitle="শিক্ষকেরা প্রশ্ন কীভাবে বানান, নিজে করে দেখো" />

      <p className="mb-4 rounded-box border border-secondary bg-secondary/20 px-4 py-3 text-base">
        এটা শুধু ঘুরে দেখার জায়গা। এখানে যা করবে কোথাও সেভ হবে না, পেজ বন্ধ করলে মুছে যাবে। আসল প্রশ্ন ব্যাংক আর পরীক্ষা বানানো পেতে{' '}
        <Link to="/become-teacher" className="link font-semibold">
          শিক্ষক অনুমোদনের অনুরোধ
        </Link>{' '}
        পাঠাও।
      </p>

      <div role="tablist" className="tabs tabs-border mb-4 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={`tab shrink-0 ${tab === t.key ? 'tab-active font-semibold' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'json' && (
        <section className="mb-6 grid gap-3 rounded-box border border-base-300 p-4">
          <p className="text-base">Claude বা Gemini চ্যাটে ছবির সাথে নিচের নির্দেশটা দিলে যে JSON পাবে সেটা এখানে বসাও।</p>
          <pre dir="auto" className="max-h-48 overflow-auto whitespace-pre-wrap rounded-box bg-base-200 p-3 text-sm">{AI_PROMPT}</pre>
          <div>
            <CopyButton text={AI_PROMPT} label="নির্দেশটা কপি করো" done="নির্দেশ কপি হয়েছে" />
          </div>
          <Field label="প্রশ্নের JSON">
            <textarea className="textarea h-48 w-full font-mono text-sm" value={json} onChange={(e) => setJson(e.target.value)} spellCheck={false} placeholder='[ { "question": "...", "options": ["...", "...", "...", "..."], "answer": "ক" } ]' />
          </Field>
          {parseError && (
            <div role="alert" className="alert alert-error alert-soft">
              <FiAlertCircle aria-hidden="true" /> <span>{parseError}</span>
            </div>
          )}
          <div>
            <button type="button" className="btn btn-primary" onClick={addFromJson} disabled={!json.trim()}>
              প্রশ্নগুলো যোগ করো
            </button>
          </div>
        </section>
      )}

      {tab === 'image' && (
        <section className="mb-6 rounded-box border border-dashed border-base-300 p-6 text-center">
          <FiImage className="mx-auto text-primary" size={36} aria-hidden="true" />
          <h2 className="mt-2 text-lg font-bold">বইয়ের পাতার ছবি দিলেই প্রশ্ন বের হয়ে আসে</h2>
          <p className="mx-auto mt-1 max-w-md text-base">AI ছবি পড়ে প্রশ্ন আর অপশন নিজে টুকে দেয়, তুমি শুধু সঠিক উত্তর বেছে নাও। এই সুবিধা অনুমোদিত শিক্ষকদের জন্য।</p>
          <button type="button" className="btn btn-primary mt-4" onClick={locked}>
            🔒 ছবি বেছে নাও
          </button>
        </section>
      )}

      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">
          তোমার প্রশ্ন ({toBn(cards.length)}টি, তৈরি {toBn(ready.length)}টি)
        </h2>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setPreview((v) => !v)}>
          {preview ? 'সম্পাদনায় ফিরে যাও' : 'পরীক্ষার মতো দেখো'}
        </button>
      </div>

      {preview ? (
        <ul className="grid gap-4">
          {ready.length === 0 && <li className="rounded-box border border-dashed border-base-300 p-8 text-center">এখনো কোনো প্রশ্ন সম্পূর্ণ হয়নি। প্রশ্ন, চারটা অপশন আর সঠিক উত্তর দাও।</li>}
          {ready.map((c, i) => (
            <li key={c.id} className="rounded-box border border-base-300 p-4 sm:p-5">
              <QuestionView question={{ ...c, _id: c.id }} number={i + 1} mode="review" selectedIndex={c.correctIndex} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid gap-5">
          {cards.map((card, i) => (
            <QuestionEditorCard
              key={card.id}
              card={card}
              index={i}
              canRemove={cards.length > 1}
              imagesLocked
              onImageLocked={locked}
              onChange={(patch) => update(card.id, patch)}
              onDuplicate={() => duplicate(card.id)}
              onRemove={() => remove(card.id)}
            />
          ))}
        </div>
      )}

      <div className="sticky bottom-0 z-20 mt-6 flex items-center gap-2 border-t border-base-300 bg-base-100 py-3 sm:justify-between">
        <button type="button" className="btn flex-1 sm:flex-none" onClick={() => setCards((prev) => [...prev, emptyCard()])} disabled={cards.length >= 50}>
          <FiPlus aria-hidden="true" /> আরেকটা প্রশ্ন
        </button>
        <button type="button" className="btn btn-primary flex-1 sm:flex-none" onClick={() => toast('ডেমোতে সেভ হয় না। প্রশ্ন ব্যাংকে জমা রাখতে শিক্ষক অনুমোদনের অনুরোধ পাঠাও।', { icon: '💾', duration: 5000 })}>
          সবগুলো সেভ করো
        </button>
      </div>
    </>
  );
}
