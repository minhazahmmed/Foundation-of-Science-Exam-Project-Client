import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiAlertCircle, FiCheckCircle, FiImage, FiRotateCcw, FiTrash2, FiX } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../api/axios.js';
import { extractFromImages } from '../../api/import.api.js';
import { bulkCreateQuestions } from '../../api/questions.api.js';
import CopyButton from '../../components/common/CopyButton.jsx';
import Field from '../../components/common/Field.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import QuestionEditorCard from '../../components/question/QuestionEditorCard.jsx';
import QuestionView from '../../components/question/QuestionView.jsx';
import { parseAnswerKey } from '../../utils/answerKey.js';
import { compressImage } from '../../utils/compressImage.js';
import { toBn } from '../../utils/format.js';
import { normalizeForPreview } from '../../utils/importPreview.js';

const MAX_IMAGES = 5;
const DRAFT_KEY = 'fos-import-draft-v1';

// ছবি ছাড়া নিজে JSON বানাতে চাইলে Claude বা Gemini চ্যাটে এই নির্দেশ দেওয়া যায়
const AI_PROMPT = `এই ছবির সব MCQ প্রশ্ন নিচের JSON আকারে দাও। শুধু JSON দেবে, অন্য কিছু লিখবে না।
- সমীকরণ ও ভেক্টর চিহ্ন LaTeX আকারে $...$ এর ভেতরে লেখো (যেমন $\\vec{A}\\times\\vec{B}$)।
- সঠিক উত্তর বের করার দরকার নেই, "answer" ফাঁকা রাখো। অপশনের পাশের টিক বা দাগ উপেক্ষা করো।
- ছবি বা চিত্র লাগলে "needsImage" এ লিখে দাও কী ছবি।
- উদ্দীপক থাকলে "passage" এ দাও, বোর্ডের নাম থাকলে "board" এ দাও।

[
  { "no": 1, "board": "", "passage": "", "question": "...", "options": ["...", "...", "...", "..."], "answer": "" }
]`;

// ---- অটোসেভ: প্রিভিউয়ের কাজ ব্রাউজারে জমা থাকে, রিফ্রেশ দিলেও ফিরে আসে ----
function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    return Array.isArray(draft?.items) && draft.items.length > 0 ? draft : null;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // জমা মোছা না গেলেও সমস্যা নেই
  }
}

// সেভ করার মতো তৈরি: কোনো সমস্যা নেই আর সঠিক উত্তর বাছা আছে
const isReady = (item) => item.problems.length === 0 && item.correctIndex >= 0;

export default function BulkImport() {
  const navigate = useNavigate();
  const fileInput = useRef(null);
  const [draft] = useState(loadDraft); // পেজ খোলার সময় একবারই পড়া হয়

  // ছবি থেকে বের করার অংশ
  const [images, setImages] = useState([]); // [{ file, url }]
  const [mode, setMode] = useState('all'); // 'all' বা 'selected'
  const [numbers, setNumbers] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [missing, setMissing] = useState(draft?.missing ?? []);

  // প্রশ্নের তালিকা (পর্দায় যা দেখছ, সেভও হবে ঠিক তাই)
  const [json, setJson] = useState(draft?.json ?? '');
  const [classLevel, setClassLevel] = useState(draft?.classLevel ?? '');
  const [chapter, setChapter] = useState(draft?.chapter ?? '');
  const [subject, setSubject] = useState(draft?.subject ?? '');
  const [items, setItems] = useState(draft?.items ?? null);
  const [answerKey, setAnswerKey] = useState(draft?.answerKey ?? '');
  const [parseError, setParseError] = useState('');
  const [serverErrors, setServerErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [restored, setRestored] = useState(Boolean(draft));

  // প্রতিবার কিছু বদলালে আপনা-আপনি জমা হয়
  useEffect(() => {
    try {
      if (items && items.length > 0) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ items, json, classLevel, chapter, subject, answerKey, missing }));
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      // জায়গা ভরে গেলে অটোসেভ বন্ধ থাকবে, বাকি সব ঠিকই চলবে
    }
  }, [items, json, classLevel, chapter, subject, answerKey, missing]);

  function startOver() {
    if (!window.confirm('এখনকার সব প্রশ্ন মুছে নতুন করে শুরু করবে?')) return;
    clearDraft();
    setItems(null);
    setJson('');
    setClassLevel('');
    setChapter('');
    setSubject('');
    setAnswerKey('');
    setMissing([]);
    setParseError('');
    setServerErrors([]);
    setRestored(false);
  }

  function addFiles(event) {
    const picked = Array.from(event.target.files || []);
    event.target.value = '';
    const room = MAX_IMAGES - images.length;
    if (picked.length > room) toast.error(`একবারে সর্বোচ্চ ${toBn(MAX_IMAGES)}টা ছবি দেওয়া যায়`);

    setImages((prev) => [
      ...prev,
      ...picked.slice(0, room).map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);
  }

  function removeImage(index) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleExtract() {
    if (mode === 'selected' && !numbers.trim()) {
      toast.error('কোন কোন নম্বরের প্রশ্ন লাগবে সেটা লেখো');
      return;
    }

    setExtracting(true);
    setServerErrors([]);
    try {
      const form = new FormData();
      let totalSize = 0;
      for (const { file } of images) {
        const small = await compressImage(file);
        totalSize += small.size;
        form.append('images', small);
      }
      // Vercel এ একটা অনুরোধ ৪.৫ MB এর বেশি হতে পারে না
      if (totalSize > 4 * 1024 * 1024) {
        toast.error('ছবিগুলো মিলিয়ে অনেক বড় হয়ে গেছে। কম ছবি দিয়ে আলাদা আলাদা বার চেষ্টা করো।');
        return;
      }
      form.append('mode', mode);
      form.append('numbers', numbers);

      const result = await extractFromImages(form);
      setJson(JSON.stringify(result.questions, null, 2));
      setItems(result.questions.map(normalizeForPreview));
      setMissing(result.missing);
      setParseError('');
      setRestored(false);
      toast.success(`${toBn(result.questions.length)}টি প্রশ্ন বের হয়েছে। এবার প্রতিটার সঠিক উত্তর বেছে দাও।`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExtracting(false);
    }
  }

  function handlePreview() {
    setServerErrors([]);
    setMissing([]);
    try {
      const parsed = JSON.parse(json);
      const list = Array.isArray(parsed) ? parsed : parsed.questions;
      if (!Array.isArray(list) || list.length === 0) throw new Error('empty');
      setItems(list.map(normalizeForPreview));
      setParseError('');
      setRestored(false);
    } catch {
      setItems(null);
      setParseError('JSON পড়া যাচ্ছে না। পুরোটা ঠিকমতো কপি করেছ কিনা দেখো। প্রশ্নগুলো [ ] এর ভেতরে থাকতে হবে।');
    }
  }

  const updateItem = (index, patch) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  // প্রশ্ন, উদ্দীপক বা অপশনের লেখা হাতে ঠিক করলে সমস্যার তালিকাও নতুন করে হিসাব হয়
  const editItem = (index, patch) =>
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, ...patch };
        return { ...next, problems: normalizeForPreview(next, 0).problems };
      })
    );

  // সমস্যাওয়ালা বা দরকার নেই এমন প্রশ্ন তালিকা থেকে বাদ দেওয়া
  const removeItem = (index) =>
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : null;
    });

  // উদ্দীপকের ছবি দিলে একই উদ্দীপকওয়ালা সব প্রশ্নে বসে যায়
  // (যেমন একটা উদ্দীপক থেকে ৭৬ ও ৭৭ নম্বর প্রশ্ন হলে দুটোতেই একবারে বসবে)।
  function setItemImage(index, field, url) {
    setItems((prev) => {
      const passage = prev[index].passage.trim();
      return prev.map((item, i) => {
        const sharesPassage = field === 'passageImage' && passage && item.passage.trim() === passage;
        return i === index || sharesPassage ? { ...item, [field]: url } : item;
      });
    });
  }

  // ঠিক করার কার্ড থেকে আসা বদল। উদ্দীপকের ছবি হলে একই উদ্দীপকওয়ালা সব প্রশ্নে বসে যায়
  function handleCardChange(index, patch) {
    const { passageImage, ...rest } = patch;
    if (passageImage !== undefined) setItemImage(index, 'passageImage', passageImage);
    if (Object.keys(rest).length > 0) editItem(index, rest);
  }

  // সবগুলো প্রশ্নের অপশনের চিহ্ন একবারে বদলানো (ইংরেজি বিষয়ে A B C D)
  const setAllOptionStyle = (style) => setItems((prev) => prev.map((item) => ({ ...item, optionStyle: style })));

  // বইয়ের শেষের উত্তরমালা থাকলে "খ ক গ ঘ ..." লিখে সবগুলো একবারে বসানো যায়
  function applyAnswerKey() {
    const key = parseAnswerKey(answerKey);
    if (key.length === 0) {
      toast.error('উত্তরমালায় ক, খ, গ, ঘ অক্ষর খুঁজে পাইনি');
      return;
    }
    setItems((prev) => prev.map((item, i) => (i < key.length ? { ...item, correctIndex: key[i] } : item)));

    if (key.length === items.length) toast.success('সবগুলো প্রশ্নের উত্তর বসেছে');
    else toast(`উত্তরমালায় ${toBn(key.length)}টা উত্তর, প্রশ্ন আছে ${toBn(items.length)}টা। মিলিয়ে দেখো।`, { icon: 'ℹ️', duration: 7000 });
  }

  // তৈরি প্রশ্নগুলো সেভ হয়। সমস্যাওয়ালাগুলো তালিকায় থেকে যায়, পরে ঠিক করে আবার সেভ করা যায়।
  async function handleSave() {
    const ready = items.filter(isReady);
    if (ready.length === 0) return;

    setSaving(true);
    setServerErrors([]);
    try {
      const questions = ready.map((item) => ({
        no: item.no,
        board: item.board,
        passage: item.passage,
        passageImage: item.passageImage,
        question: item.text,
        image: item.image,
        options: item.options,
        correctIndex: item.correctIndex,
        explanation: item.explanation,
        explanationImage: item.explanationImage,
        optionStyle: item.optionStyle,
      }));
      const result = await bulkCreateQuestions({ classLevel, chapter, subject, questions });

      if (ready.length === items.length) {
        clearDraft();
        toast.success(`${toBn(result.created)}টি প্রশ্ন প্রশ্ন ব্যাংকে যোগ হয়েছে`);
        navigate('/teacher/questions');
        return;
      }

      const rest = items.filter((item) => !isReady(item));
      setItems(rest);
      setSaving(false);
      toast.success(`${toBn(result.created)}টি প্রশ্ন সেভ হয়েছে। বাকি ${toBn(rest.length)}টা ঠিক করে আবার সেভ করো।`, { duration: 6000 });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setServerErrors(err.response?.data?.details || []);
      setSaving(false);
    }
  }

  const readyCount = items ? items.filter(isReady).length : 0;
  const problemCount = items ? items.filter((i) => i.problems.length).length : 0;
  const unansweredCount = items ? items.filter((i) => i.correctIndex < 0).length : 0;
  const allReady = items && readyCount === items.length;

  return (
    <>
      <PageHeader
        title="ছবি থেকে প্রশ্ন যোগ করো"
        subtitle="বইয়ের পাতার ছবি দাও, প্রশ্ন আর অপশন নিজে থেকে বের হয়ে আসবে। সঠিক উত্তর তুমি নিজে বেছে দেবে, তারপর সেভ করলেই প্রশ্ন ব্যাংকে চলে যাবে।"
        actions={<Link to="/teacher/questions/new" className="btn btn-outline">নিজে লিখে প্রশ্ন বানাও</Link>}
      />

      {/* আগের অসমাপ্ত কাজ ফিরে এলে জানানো হয় */}
      {restored && items && (
        <div role="alert" className="alert alert-info alert-soft mb-4 flex-col items-start gap-2 text-base sm:flex-row sm:items-center">
          <FiRotateCcw className="shrink-0" aria-hidden="true" />
          <span className="flex-1">আগের অসমাপ্ত কাজ ফিরিয়ে আনা হয়েছে ({toBn(items.length)}টি প্রশ্ন)। সেখান থেকেই চালিয়ে যেতে পারো।</span>
          <button type="button" className="btn btn-sm btn-ghost" onClick={startOver}>
            মুছে নতুন করে শুরু করো
          </button>
        </div>
      )}

      {/* ধাপ ১: ছবি */}
      <section className="rounded-box border border-base-300 p-4 sm:p-5">
        <h2 className="mb-3 text-lg font-semibold">১. বইয়ের পাতার ছবি দাও</h2>

        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={addFiles} />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {images.map((img, i) => (
            <div key={img.url} className="relative aspect-3/4 overflow-hidden rounded-box border border-base-300 bg-base-200">
              <img src={img.url} alt={`পাতা ${toBn(i + 1)}`} className="h-full w-full object-cover" />
              <button type="button" onClick={() => removeImage(i)} className="btn btn-circle btn-xs btn-neutral absolute top-1 right-1" aria-label={`পাতা ${toBn(i + 1)} সরাও`} disabled={extracting}>
                <FiX aria-hidden="true" />
              </button>
              <span className="absolute bottom-1 left-1 rounded bg-neutral px-1.5 text-xs text-neutral-content">পাতা {toBn(i + 1)}</span>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <button type="button" onClick={() => fileInput.current.click()} disabled={extracting} className="flex aspect-3/4 flex-col items-center justify-center gap-1 rounded-box border border-dashed border-primary text-primary hover:bg-primary/5">
              <FiImage size={24} aria-hidden="true" />
              <span className="px-2 text-center text-sm">{images.length ? 'আরও ছবি' : 'ছবি বাছো'}</span>
            </button>
          )}
        </div>
        <p className="mt-2 text-sm text-base-content/85">একবারে সর্বোচ্চ ৫টা ছবি। সোজা করে, ভালো আলোয় পুরো পাতা তুললে সবচেয়ে ভালো ফল পাবে।</p>

        {/* ধাপ ২: কোন প্রশ্ন */}
        <h2 className="mt-6 mb-3 text-lg font-semibold">২. কোন প্রশ্নগুলো লাগবে?</h2>
        <div className="grid gap-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-box border border-base-300 p-3 has-checked:border-primary has-checked:bg-primary/5">
            <input type="radio" name="mode" className="radio radio-primary radio-sm" checked={mode === 'all'} onChange={() => setMode('all')} />
            <span>ছবির সবগুলো প্রশ্ন (পাতার ক্রমে)</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-box border border-base-300 p-3 has-checked:border-primary has-checked:bg-primary/5">
            <input type="radio" name="mode" className="radio radio-primary radio-sm mt-1" checked={mode === 'selected'} onChange={() => setMode('selected')} />
            <span className="grid flex-1 gap-2">
              <span>শুধু বাছাই করা নম্বরের প্রশ্ন</span>
              {mode === 'selected' && (
                <>
                  <input
                    className="input w-full"
                    value={numbers}
                    onChange={(e) => setNumbers(e.target.value)}
                    placeholder="যেমন: ৩৪, ৩৫, ৪০-৪৫"
                    aria-label="প্রশ্নের নম্বর"
                    autoFocus
                  />
                  <span className="text-sm text-base-content/85">
                    কমা দিয়ে নম্বর লেখো, বাংলা বা ইংরেজি যেকোনো অঙ্কে। একটানা নম্বর হলে ৪০-৪৫ লিখলেই হবে। যে ক্রমে লিখবে, প্রশ্নগুলো সেই ক্রমে সাজবে এবং ১ থেকে নতুন করে নম্বর পাবে। যেমন ৩৪ আগে লিখলে ৩৪ নম্বর প্রশ্নটা হবে ১ নম্বর।
                  </span>
                </>
              )}
            </span>
          </label>
        </div>

        <p className="mt-4 rounded-box bg-base-200 p-3 text-base">
          বইয়ে দাগ দেওয়া উত্তর AI পড়বে না। প্রশ্ন আর অপশন বের হওয়ার পর সঠিক উত্তরটা তুমি নিজে বেছে দেবে।
        </p>

        <button type="button" className="btn btn-primary mt-5 w-full sm:w-auto" onClick={handleExtract} disabled={images.length === 0 || extracting}>
          {extracting && <span className="loading loading-spinner loading-sm" />}
          {extracting ? 'প্রশ্ন বের হচ্ছে...' : 'প্রশ্ন বের করো'}
        </button>
        {extracting && <p className="mt-2 text-base text-base-content/85">ছবি পড়তে ১০ থেকে ৩০ সেকেন্ড লাগতে পারে। পেজ বন্ধ কোরো না।</p>}
      </section>

      {/* নিজে JSON বসানোর বিকল্প */}
      <details className="mt-4 rounded-box border border-base-300 p-4">
        <summary className="cursor-pointer font-semibold">নিজে JSON পেস্ট করতে চাও? (প্রযুক্তি জানা শিক্ষকদের জন্য)</summary>
        <div className="mt-3 grid gap-3">
          <p className="text-base">Claude বা Gemini চ্যাটে ছবির সাথে নিচের নির্দেশটা দিলে যে JSON পাবে সেটা এখানে পেস্ট করতে পারো।</p>
          <pre dir="auto" className="max-h-48 overflow-auto whitespace-pre-wrap rounded-box bg-base-200 p-3 text-sm">{AI_PROMPT}</pre>
          <div>
            <CopyButton text={AI_PROMPT} label="নির্দেশটা কপি করো" done="নির্দেশ কপি হয়েছে" />
          </div>
          <Field label="প্রশ্নের JSON">
            <textarea
              className="textarea h-48 w-full font-mono text-sm"
              value={json}
              onChange={(e) => {
                setJson(e.target.value);
                setItems(null);
              }}
              spellCheck={false}
              placeholder='[ { "question": "...", "options": ["...", "...", "...", "..."], "answer": "ক" } ]'
            />
          </Field>
          {parseError && (
            <div role="alert" className="alert alert-error alert-soft">
              <FiAlertCircle aria-hidden="true" /> <span>{parseError}</span>
            </div>
          )}
          <div>
            <button type="button" className="btn btn-outline btn-primary" onClick={handlePreview} disabled={!json.trim()}>
              আগে দেখে নিই
            </button>
          </div>
        </div>
      </details>

      {/* ধাপ ৩: উত্তর বাছা, মিলিয়ে দেখা ও সেভ */}
      {items && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">৩. সঠিক উত্তর বেছে দাও, তারপর সেভ করো</h2>

          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <Field label="শ্রেণি" hint="সবগুলো প্রশ্নে বসে যাবে (ঐচ্ছিক)">
              <input className="input w-full" value={classLevel} onChange={(e) => setClassLevel(e.target.value)} placeholder="যেমন: সপ্তম বা একাদশ" />
            </Field>
            <Field label="বিষয়" hint="সবগুলো প্রশ্নে বসে যাবে (ঐচ্ছিক)">
              <input className="input w-full" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="যেমন: উচ্চতর গণিত" />
            </Field>
            <Field label="অধ্যায়" hint="সবগুলো প্রশ্নে বসে যাবে (ঐচ্ছিক)">
              <input className="input w-full" value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="যেমন: ভেক্টর" />
            </Field>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-box border border-base-300 p-3 text-base sm:p-4">
            <span className="font-medium">সব প্রশ্নের অপশনের চিহ্ন:</span>
            <button type="button" className={`btn btn-sm ${items.every((i) => i.optionStyle !== 'en') ? 'btn-primary' : 'btn-outline'}`} onClick={() => setAllOptionStyle('bn')}>
              ক খ গ ঘ
            </button>
            <button type="button" className={`btn btn-sm ${items.every((i) => i.optionStyle === 'en') ? 'btn-primary' : 'btn-outline'}`} onClick={() => setAllOptionStyle('en')}>
              A B C D
            </button>
            <span className="text-sm text-base-content/85">ইংরেজি প্রশ্ন হলে নিজে থেকেই A B C D ধরা হয়। দরকার হলে এখান থেকে বদলাও।</span>
          </div>

          <div className="mb-4 rounded-box border border-base-300 p-3 sm:p-4">
            <Field label="বইয়ের শেষে উত্তরমালা থাকলে এখানে লিখে একবারে বসাও (ঐচ্ছিক)" hint="প্রশ্নগুলো নিচে যে ক্রমে দেখাচ্ছে সেই ক্রমে ক, খ, গ, ঘ (বা A, B, C, D) লেখো। যেমন: খ ক গ ঘ খ">
              <span className="flex gap-2">
                <input className="input w-full" value={answerKey} onChange={(e) => setAnswerKey(e.target.value)} placeholder="খ ক গ ঘ খ ..." />
                <button type="button" className="btn btn-outline btn-primary shrink-0" onClick={applyAnswerKey} disabled={!answerKey.trim()}>
                  উত্তর বসাও
                </button>
              </span>
            </Field>
          </div>

          {missing.length > 0 && (
            <div role="alert" className="alert alert-warning alert-soft mb-4 text-base">
              <FiAlertCircle aria-hidden="true" />
              <span>এই নম্বরের প্রশ্ন ছবিতে পাওয়া যায়নি: {missing.map(toBn).join(', ')}। ছবিতে নম্বরটা আছে কিনা দেখে নাও।</span>
            </div>
          )}

          <div className="sticky top-16 z-20 mb-4 flex flex-col gap-2 rounded-box border border-base-300 bg-base-100 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 font-medium">
              {allReady ? (
                <>
                  <FiCheckCircle className="shrink-0 text-success" aria-hidden="true" />
                  <span>{toBn(items.length)}টি প্রশ্নেরই উত্তর বাছা হয়েছে। সেভ করতে পারো।</span>
                </>
              ) : (
                <>
                  <FiAlertCircle className="shrink-0 text-warning" aria-hidden="true" />
                  <span>
                    {readyCount > 0 && `${toBn(readyCount)}টি সেভের জন্য তৈরি। `}
                    {unansweredCount > 0 && `${toBn(unansweredCount)}টার সঠিক উত্তর বাছা বাকি। `}
                    {problemCount > 0 && `${toBn(problemCount)}টায় সমস্যা আছে। `}
                    {readyCount > 0 && 'চাইলে তৈরিগুলো এখনই সেভ করতে পারো।'}
                  </span>
                </>
              )}
            </p>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={readyCount === 0 || saving}>
              {saving && <span className="loading loading-spinner loading-sm" />}
              {allReady ? 'সবগুলো সেভ করো' : `তৈরি ${toBn(readyCount)}টি সেভ করো`}
            </button>
          </div>

          {serverErrors.length > 0 && (
            <ul className="alert alert-error alert-soft mb-4 block list-disc pl-8 text-base">
              {serverErrors.map((e) => (
                <li key={e.no}>প্রশ্ন {toBn(e.no)}: {e.message}</li>
              ))}
            </ul>
          )}

          <ul className="grid gap-4">
            {items.map((item, index) => (
              <li key={item.no} className={`rounded-box border p-4 sm:p-5 ${item.problems.length ? 'border-error' : 'border-base-300'}`}>
                <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
                  {item.bookNo != null && <span className="badge badge-ghost">বইয়ের {toBn(item.bookNo)} নম্বর</span>}
                  <span className={`badge ${item.correctIndex < 0 ? 'badge-warning badge-soft' : 'badge-success badge-soft'}`}>
                    {item.correctIndex < 0 ? 'সঠিক উত্তর বাছা বাকি' : 'উত্তর বাছা হয়েছে'}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs ml-auto text-error"
                    onClick={() => removeItem(index)}
                    disabled={saving}
                  >
                    <FiTrash2 aria-hidden="true" /> এই প্রশ্ন বাদ দাও
                  </button>
                </div>
                {item.problems.length > 0 && (
                  <ul className="mb-3 list-disc pl-5 text-base font-medium text-error">
                    {item.problems.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                )}
                {item.needsImage && (
                  <p className="mb-3 rounded bg-secondary/30 px-3 py-2 text-base">
                    এই প্রশ্নে ছবি লাগবে ({item.needsImage})। নিচের "লেখা ঠিক করো, ছবি ও ব্যাখ্যা যোগ করো" অংশ থেকে ছবি দাও।
                  </p>
                )}
                {item.options.length === 4 ? (
                  <QuestionView
                    question={item}
                    number={item.no}
                    mode="edit"
                    onSelect={(i) => updateItem(index, { correctIndex: i })}
                  />
                ) : (
                  <p>{item.text}</p>
                )}

                <details className="mt-4 rounded-box border border-base-300 p-3" open={item.problems.length > 0 || Boolean(item.needsImage)}>
                  <summary className="cursor-pointer text-base font-semibold text-primary">সঠিক উত্তর বাছো, লেখা ঠিক করো, ছবি ও ব্যাখ্যা যোগ করো</summary>
                  <div className="mt-3">
                    <QuestionEditorCard
                      card={{ ...item, id: `import-${index}` }}
                      showPreview={false}
                      onChange={(patch) => handleCardChange(index, patch)}
                    />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}