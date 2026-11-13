import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../api/axios.js';
import { createExam } from '../../api/exams.api.js';
import { listChapters, listQuestions } from '../../api/questions.api.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import Field from '../../components/common/Field.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import MathText from '../../components/math/MathText.jsx';
import useFetch from '../../hooks/useFetch.js';
import { toBn } from '../../utils/format.js';

export default function CreateExam() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(20);
  const [marks, setMarks] = useState(1);
  const [negative, setNegative] = useState(0);

  const [how, setHow] = useState('manual'); // 'manual' বা 'random'
  const [chapter, setChapter] = useState('');
  const [randomCount, setRandomCount] = useState(10);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  const questionsFetcher = useCallback(() => listQuestions({ chapter, limit: 100 }), [chapter]);
  const chaptersFetcher = useCallback(() => listChapters(), []);
  const questions = useFetch(questionsFetcher);
  const chapters = useFetch(chaptersFetcher);

  const list = questions.data?.questions || [];
  const chapterList = chapters.data?.chapters || [];

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const allShownSelected = list.length > 0 && list.every((q) => selected.includes(q._id));
  const toggleAllShown = () =>
    setSelected((prev) =>
      allShownSelected
        ? prev.filter((id) => !list.some((q) => q._id === id))
        : [...new Set([...prev, ...list.map((q) => q._id)])]
    );

  async function handleSubmit(event) {
    event.preventDefault();
    if (how === 'manual' && selected.length === 0) {
      toast.error('কমপক্ষে একটা প্রশ্ন বেছে নাও');
      return;
    }

    const body = {
      title,
      durationMinutes: Number(duration),
      marksPerQuestion: Number(marks),
      negativeMark: Number(negative),
      ...(how === 'manual'
        ? { questionIds: selected }
        : { random: { count: Number(randomCount), chapter: chapter || undefined } }),
    };

    setSaving(true);
    try {
      const { exam } = await createExam(body);
      toast.success('পরীক্ষা তৈরি হয়েছে। এবার লিংকটা কপি করে স্টুডেন্টদের পাঠাও।');
      navigate(`/teacher/exams/${exam._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSaving(false);
    }
  }

  if (questions.loading && !questions.data && chapters.loading) return <Loader />;

  return (
    <>
      <PageHeader title="নতুন পরীক্ষা বানাও" subtitle="প্রশ্ন ব্যাংক থেকে প্রশ্ন বেছে নাও, অথবা র‍্যান্ডম প্রশ্ন দিয়ে বানাও" />

      <form onSubmit={handleSubmit} className="grid gap-6">
        <section className="grid gap-4 rounded-box border border-base-300 p-4 sm:p-5">
          <Field label="পরীক্ষার নাম">
            <input required className="input w-full" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="যেমন: ভেক্টর অধ্যায় পরীক্ষা" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="সময় (মিনিট)">
              <input type="number" required min={1} max={300} className="input w-full" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </Field>
            <Field label="প্রতি প্রশ্নের নম্বর">
              <input type="number" required min={0.1} step="any" className="input w-full" value={marks} onChange={(e) => setMarks(e.target.value)} />
            </Field>
            <Field label="ভুল উত্তরে কাটা নম্বর" hint="কাটতে না চাইলে ০ রাখো">
              <input type="number" required min={0} step="any" className="input w-full" value={negative} onChange={(e) => setNegative(e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="rounded-box border border-base-300 p-4 sm:p-5">
          <h2 className="mb-3 text-lg font-semibold">প্রশ্ন কীভাবে বাছবে?</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-box border border-base-300 p-3 has-checked:border-primary has-checked:bg-primary/5">
              <input type="radio" name="how" className="radio radio-primary radio-sm" checked={how === 'manual'} onChange={() => setHow('manual')} />
              নিজে বেছে নেব
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-box border border-base-300 p-3 has-checked:border-primary has-checked:bg-primary/5">
              <input type="radio" name="how" className="radio radio-primary radio-sm" checked={how === 'random'} onChange={() => setHow('random')} />
              র‍্যান্ডম প্রশ্ন
            </label>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="অধ্যায় (ফিল্টার)">
              <select className="select w-full" value={chapter} onChange={(e) => setChapter(e.target.value)}>
                <option value="">সব অধ্যায়</option>
                {chapterList.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            {how === 'random' && (
              <Field label="কয়টা প্রশ্ন?" hint={`ব্যাংকে ${toBn(questions.data?.total ?? 0)}টা প্রশ্ন আছে`}>
                <input type="number" required min={1} max={200} className="input w-full" value={randomCount} onChange={(e) => setRandomCount(e.target.value)} />
              </Field>
            )}
          </div>

          {how === 'manual' && (
            <div className="mt-4">
              {questions.loading && <Loader />}
              {questions.data && list.length === 0 && (
                <EmptyState
                  title="এখানে কোনো প্রশ্ন নেই"
                  text="আগে প্রশ্ন ব্যাংকে প্রশ্ন যোগ করো।"
                  action={<Link to="/teacher/import" className="btn btn-primary btn-sm">ছবি থেকে প্রশ্ন যোগ করো</Link>}
                />
              )}
              {list.length > 0 && (
                <>
                  <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={allShownSelected} onChange={toggleAllShown} />
                      এখানকার সবগুলো বাছো
                    </label>
                    <span className="font-medium text-primary">{toBn(selected.length)}টি বাছা হয়েছে</span>
                  </div>
                  <ul className="max-h-[28rem] divide-y divide-base-300 overflow-y-auto rounded-box border border-base-300">
                    {list.map((q, i) => (
                      <li key={q._id}>
                        <label className="flex cursor-pointer items-start gap-3 p-3 hover:bg-base-200">
                          <input type="checkbox" className="checkbox checkbox-sm checkbox-primary mt-1.5" checked={selected.includes(q._id)} onChange={() => toggle(q._id)} />
                          <span className="min-w-0 flex-1 text-sm sm:text-base">
                            <span className="mr-1 font-semibold text-primary">{toBn(i + 1)}.</span>
                            <MathText text={q.text || '(ছবিসহ প্রশ্ন)'} />
                            {q.chapter && <span className="badge badge-ghost badge-sm ml-2">{q.chapter}</span>}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  {questions.data.total > list.length && (
                    <p className="mt-2 text-xs text-base-content/60">এখানে প্রথম ১০০টা দেখানো হচ্ছে। অধ্যায় বেছে নিলে ছোট তালিকা পাবে।</p>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link to="/teacher" className="btn btn-ghost">বাতিল</Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving && <span className="loading loading-spinner loading-sm" />}
            পরীক্ষা তৈরি করো
          </button>
        </div>
      </form>
    </>
  );
}
