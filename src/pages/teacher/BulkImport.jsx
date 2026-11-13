import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiAlertCircle, FiCheckCircle, FiImage, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../api/axios.js';
import { extractFromImages } from '../../api/import.api.js';
import { bulkCreateQuestions } from '../../api/questions.api.js';
import CopyButton from '../../components/common/CopyButton.jsx';
import Field from '../../components/common/Field.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import QuestionView from '../../components/question/QuestionView.jsx';
import { compressImage } from '../../utils/compressImage.js';
import { toBn } from '../../utils/format.js';
import { normalizeForPreview } from '../../utils/importPreview.js';

const MAX_IMAGES = 5;

// ছবি ছাড়া নিজে JSON বানাতে চাইলে Claude বা Gemini চ্যাটে এই নির্দেশ দেওয়া যায়
const AI_PROMPT = `এই ছবির সব MCQ প্রশ্ন নিচের JSON আকারে দাও। শুধু JSON দেবে, অন্য কিছু লিখবে না।
- সমীকরণ ও ভেক্টর চিহ্ন LaTeX আকারে $...$ এর ভেতরে লেখো (যেমন $\\vec{A}\\times\\vec{B}$)।
- বইয়ে যে অপশনে দাগ দেওয়া আছে সেটাই "answer" এ ক/খ/গ/ঘ অক্ষরে দাও।
- ছবি বা চিত্র লাগলে "needsImage" এ লিখে দাও কী ছবি।
- উদ্দীপক থাকলে "passage" এ দাও, বোর্ডের নাম থাকলে "board" এ দাও।

[
  { "no": 1, "board": "", "passage": "", "question": "...", "options": ["...", "...", "...", "..."], "answer": "খ" }
]`;

export default function BulkImport() {
  const navigate = useNavigate();
  const fileInput = useRef(null);

  // ছবি থেকে বের করার অংশ
  const [images, setImages] = useState([]); // [{ file, url }]
  const [mode, setMode] = useState('all'); // 'all' বা 'selected'
  const [numbers, setNumbers] = useState('');
  const [solveIfUnmarked, setSolveIfUnmarked] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [missing, setMissing] = useState([]);

  // JSON ও প্রিভিউ
  const [json, setJson] = useState('');
  const [chapter, setChapter] = useState('');
  const [subject, setSubject] = useState('');
  const [items, setItems] = useState(null);
  const [parseError, setParseError] = useState('');
  const [serverErrors, setServerErrors] = useState([]);
  const [saving, setSaving] = useState(false);

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
      for (const { file } of images) form.append('images', await compressImage(file));
      form.append('mode', mode);
      form.append('numbers', numbers);
      form.append('solveIfUnmarked', String(solveIfUnmarked));

      const result = await extractFromImages(form);
      setJson(JSON.stringify(result.questions, null, 2));
      setItems(result.questions.map(normalizeForPreview));
      setMissing(result.missing);
      setParseError('');
      toast.success(`${toBn(result.questions.length)}টি প্রশ্ন বের হয়েছে, নিচে মিলিয়ে নাও`);
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
    } catch {
      setItems(null);
      setParseError('JSON পড়া যাচ্ছে না। পুরোটা ঠিকমতো কপি করেছ কিনা দেখো। প্রশ্নগুলো [ ] এর ভেতরে থাকতে হবে।');
    }
  }

  async function handleSave() {
    setSaving(true);
    setServerErrors([]);
    try {
      const parsed = JSON.parse(json);
      const questions = Array.isArray(parsed) ? parsed : parsed.questions;
      const result = await bulkCreateQuestions({ chapter, subject, questions });
      toast.success(`${toBn(result.created)}টি প্রশ্ন প্রশ্ন ব্যাংকে যোগ হয়েছে`);
      navigate('/teacher/questions');
    } catch (err) {
      toast.error(getErrorMessage(err));
      setServerErrors(err.response?.data?.details || []);
      setSaving(false);
    }
  }

  const problemCount = items ? items.filter((i) => i.problems.length).length : 0;
  const guessedCount = items ? items.filter((i) => i.guessed).length : 0;

  return (
    <>
      <PageHeader
        title="ছবি থেকে প্রশ্ন যোগ করো"
        subtitle="বইয়ের পাতার ছবি দাও, প্রশ্ন নিজে থেকে বের হয়ে আসবে। দেখে মিলিয়ে নিয়ে সেভ করলেই প্রশ্ন ব্যাংকে চলে যাবে।"
      />

      {/* ধাপ ১: ছবি */}
      <section className="rounded-box border border-base-300 p-4 sm:p-5">
        <h2 className="mb-3 text-lg font-semibold">১. বইয়ের পাতার ছবি দাও</h2>

        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={addFiles} />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {images.map((img, i) => (
            <div key={img.url} className="relative aspect-[3/4] overflow-hidden rounded-box border border-base-300 bg-base-200">
              <img src={img.url} alt={`পাতা ${toBn(i + 1)}`} className="h-full w-full object-cover" />
              <button type="button" onClick={() => removeImage(i)} className="btn btn-circle btn-xs btn-neutral absolute top-1 right-1" aria-label={`পাতা ${toBn(i + 1)} সরাও`} disabled={extracting}>
                <FiX aria-hidden="true" />
              </button>
              <span className="absolute bottom-1 left-1 rounded bg-neutral px-1.5 text-xs text-neutral-content">পাতা {toBn(i + 1)}</span>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <button type="button" onClick={() => fileInput.current.click()} disabled={extracting} className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-box border border-dashed border-primary text-primary hover:bg-primary/5">
              <FiImage size={24} aria-hidden="true" />
              <span className="px-2 text-center text-sm">{images.length ? 'আরও ছবি' : 'ছবি বাছো'}</span>
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-base-content/60">একবারে সর্বোচ্চ ৫টা ছবি। সোজা করে, ভালো আলোয় পুরো পাতা তুললে সবচেয়ে ভালো ফল পাবে।</p>

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
                  <span className="text-xs text-base-content/60">
                    কমা দিয়ে নম্বর লেখো, বাংলা বা ইংরেজি যেকোনো অঙ্কে। একটানা নম্বর হলে ৪০-৪৫ লিখলেই হবে। যে ক্রমে লিখবে, প্রশ্নগুলো সেই ক্রমে সাজবে এবং ১ থেকে নতুন করে নম্বর পাবে। যেমন ৩৪ আগে লিখলে ৩৪ নম্বর প্রশ্নটা হবে ১ নম্বর।
                  </span>
                </>
              )}
            </span>
          </label>
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm">
          <input type="checkbox" className="checkbox checkbox-sm checkbox-primary mt-1" checked={solveIfUnmarked} onChange={(e) => setSolveIfUnmarked(e.target.checked)} />
          <span>
            বইয়ে দাগ না থাকলে AI নিজে উত্তর বের করুক
            <span className="block text-xs text-base-content/60">এই উত্তর ভুল হতে পারে, তাই এগুলো আলাদা চিহ্ন দিয়ে দেখানো হবে। না টিক দিলে দাগ না থাকা প্রশ্নের উত্তর ফাঁকা থাকবে।</span>
          </span>
        </label>

        <button type="button" className="btn btn-primary mt-5 w-full sm:w-auto" onClick={handleExtract} disabled={images.length === 0 || extracting}>
          {extracting && <span className="loading loading-spinner loading-sm" />}
          {extracting ? 'প্রশ্ন বের হচ্ছে...' : 'প্রশ্ন বের করো'}
        </button>
        {extracting && <p className="mt-2 text-sm text-base-content/70">ছবি পড়তে ১০ থেকে ৩০ সেকেন্ড লাগতে পারে। পেজ বন্ধ কোরো না।</p>}
      </section>

      {/* নিজে JSON বসানোর বিকল্প */}
      <details className="mt-4 rounded-box border border-base-300 p-4">
        <summary className="cursor-pointer font-semibold">নিজে JSON পেস্ট করতে চাও?</summary>
        <div className="mt-3 grid gap-3">
          <p className="text-sm">Claude বা Gemini চ্যাটে ছবির সাথে নিচের নির্দেশটা দিলে যে JSON পাবে সেটা এখানে পেস্ট করতে পারো।</p>
          <pre dir="auto" className="max-h-48 overflow-auto whitespace-pre-wrap rounded-box bg-base-200 p-3 text-xs sm:text-sm">{AI_PROMPT}</pre>
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

      {/* ধাপ ৩: মিলিয়ে দেখা ও সেভ */}
      {items && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">৩. মিলিয়ে দেখো, তারপর সেভ করো</h2>

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <Field label="বিষয়" hint="সবগুলো প্রশ্নে বসে যাবে (ঐচ্ছিক)">
              <input className="input w-full" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="যেমন: উচ্চতর গণিত" />
            </Field>
            <Field label="অধ্যায়" hint="সবগুলো প্রশ্নে বসে যাবে (ঐচ্ছিক)">
              <input className="input w-full" value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="যেমন: ভেক্টর" />
            </Field>
          </div>

          {missing.length > 0 && (
            <div role="alert" className="alert alert-warning alert-soft mb-4 text-sm">
              <FiAlertCircle aria-hidden="true" />
              <span>এই নম্বরের প্রশ্ন ছবিতে পাওয়া যায়নি: {missing.map(toBn).join(', ')}। ছবিতে নম্বরটা আছে কিনা দেখে নাও।</span>
            </div>
          )}

          <div className="sticky top-16 z-20 mb-4 flex flex-col gap-2 rounded-box border border-base-300 bg-base-100 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 font-medium">
              {problemCount === 0 ? (
                <>
                  <FiCheckCircle className="shrink-0 text-success" aria-hidden="true" />
                  <span>
                    {toBn(items.length)}টি প্রশ্ন ঠিক আছে।
                    {guessedCount > 0 ? ` তবে ${toBn(guessedCount)}টার উত্তর AI অনুমান করেছে, ওগুলো যাচাই করো।` : ' সঠিক উত্তরগুলো একবার মিলিয়ে নাও।'}
                  </span>
                </>
              ) : (
                <>
                  <FiAlertCircle className="shrink-0 text-error" aria-hidden="true" />
                  <span>{toBn(problemCount)}টা প্রশ্নে সমস্যা আছে। নিচের JSON ঠিক করে আবার "আগে দেখে নিই" চাপো।</span>
                </>
              )}
            </p>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={problemCount > 0 || saving}>
              {saving && <span className="loading loading-spinner loading-sm" />}
              সবগুলো সেভ করো
            </button>
          </div>

          {serverErrors.length > 0 && (
            <ul className="alert alert-error alert-soft mb-4 block list-disc pl-8 text-sm">
              {serverErrors.map((e) => (
                <li key={e.no}>প্রশ্ন {toBn(e.no)}: {e.message}</li>
              ))}
            </ul>
          )}

          <ul className="grid gap-4">
            {items.map((item) => (
              <li key={item.no} className={`rounded-box border p-4 sm:p-5 ${item.problems.length ? 'border-error' : 'border-base-300'}`}>
                <div className="mb-3 flex flex-wrap gap-2 text-xs">
                  {item.bookNo != null && <span className="badge badge-ghost">বইয়ের {toBn(item.bookNo)} নম্বর</span>}
                  {item.guessed && <span className="badge badge-warning badge-soft">AI উত্তর অনুমান করেছে, যাচাই করো</span>}
                </div>
                {item.problems.length > 0 && (
                  <ul className="mb-3 list-disc pl-5 text-sm font-medium text-error">
                    {item.problems.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                )}
                {item.needsImage && (
                  <p className="mb-3 rounded bg-secondary/30 px-3 py-2 text-sm">
                    এই প্রশ্নে ছবি লাগবে ({item.needsImage})। সেভ করার পর প্রশ্ন ব্যাংক থেকে "ঠিক করো" চেপে ছবি যোগ করো।
                  </p>
                )}
                {item.options.length === 4 ? (
                  <QuestionView question={item} number={item.no} mode="bank" />
                ) : (
                  <p>{item.text}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
