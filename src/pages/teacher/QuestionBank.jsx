import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { getErrorMessage } from '../../api/axios.js';
import { deleteQuestion, listChapters, listQuestions } from '../../api/questions.api.js';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorBox from '../../components/common/ErrorBox.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import QuestionForm from '../../components/question/QuestionForm.jsx';
import QuestionView from '../../components/question/QuestionView.jsx';
import useFetch from '../../hooks/useFetch.js';
import { toBn } from '../../utils/format.js';

export default function QuestionBank() {
  const [chapter, setChapter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState(null); // null = বন্ধ, {} = নতুন, প্রশ্ন = ঠিক করা
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const questionsFetcher = useCallback(
    () => listQuestions({ chapter, search, page, limit: 10 }),
    [chapter, search, page]
  );
  const chaptersFetcher = useCallback(() => listChapters(), []);

  const questions = useFetch(questionsFetcher);
  const chapters = useFetch(chaptersFetcher);
  const chapterList = chapters.data?.chapters || [];

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleSaved(result) {
    setEditing(null);
    questions.reload();
    chapters.reload();
    if (result.usedInExams > 0) {
      toast(
        `এই প্রশ্ন ${toBn(result.usedInExams)}টা পরীক্ষায় আছে। যাদের ফলাফল আগেই হয়ে গেছে তাদের নম্বর ঠিক করতে ওই পরীক্ষার পেজে "ফলাফল আবার হিসাব করো" চাপো।`,
        { duration: 9000, icon: 'ℹ️' }
      );
    }
  }

  async function handleDelete() {
    setDeleteBusy(true);
    try {
      await deleteQuestion(deleting._id);
      toast.success('প্রশ্ন মুছে ফেলা হয়েছে');
      setDeleting(null);
      questions.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  const data = questions.data;

  return (
    <>
      <PageHeader
        title="প্রশ্ন ব্যাংক"
        subtitle="একবার যোগ করা প্রশ্ন যেকোনো পরীক্ষায় বারবার ব্যবহার করা যাবে"
        actions={
          <>
            <Link to="/teacher/import" className="btn btn-outline">ছবি থেকে নাও</Link>
            <Link to="/teacher/questions/new" className="btn btn-primary">
              <FiPlus aria-hidden="true" /> নতুন প্রশ্ন
            </Link>
          </>
        }
      />

      <div className="mb-5 grid gap-2 sm:grid-cols-[1fr_14rem]">
        <form onSubmit={handleSearch} className="join w-full">
          <input className="input join-item w-full" placeholder="প্রশ্নের লেখা দিয়ে খোঁজো" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} aria-label="প্রশ্ন খোঁজো" />
          <button type="submit" className="btn btn-primary join-item" aria-label="খোঁজো">
            <FiSearch aria-hidden="true" />
          </button>
        </form>
        <select className="select w-full" value={chapter} onChange={(e) => { setChapter(e.target.value); setPage(1); }} aria-label="অধ্যায় বেছে নাও">
          <option value="">সব অধ্যায়</option>
          {chapterList.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {questions.loading && <Loader />}
      {questions.error && <ErrorBox message={questions.error} onRetry={questions.reload} />}

      {data && data.questions.length === 0 && (
        <EmptyState
          title={search || chapter ? 'কোনো প্রশ্ন পাওয়া যায়নি' : 'প্রশ্ন ব্যাংক এখনো খালি'}
          text={search || chapter ? 'অন্য কিছু লিখে বা অন্য অধ্যায় বেছে খুঁজে দেখো।' : 'নতুন প্রশ্ন একটা একটা করে যোগ করতে পারো, অথবা JSON থেকে একসাথে অনেক প্রশ্ন ইমপোর্ট করতে পারো।'}
        />
      )}

      {data && data.questions.length > 0 && (
        <>
          <p className="mb-3 text-sm text-base-content/85">মোট {toBn(data.total)}টি প্রশ্ন</p>
          <ul className="grid gap-4">
            {data.questions.map((q, i) => (
              <li key={q._id} className="rounded-box border border-base-300 p-4 sm:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2 text-xs">
                    {q.subject && <span className="badge badge-primary badge-soft">{q.subject}</span>}
                   {q.chapter && <span className="badge border-secondary bg-secondary/40 font-semibold text-base-content">{q.chapter}</span>}
                  </div>
                  <div className="flex gap-1">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(q)}>
                      <FiEdit2 aria-hidden="true" /> ঠিক করো
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm text-error" onClick={() => setDeleting(q)}>
                      <FiTrash2 aria-hidden="true" /> মোছো
                    </button>
                  </div>
                </div>
                <QuestionView question={q} number={(data.page - 1) * 10 + i + 1} mode="bank" />
              </li>
            ))}
          </ul>

          {data.pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button type="button" className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>আগের পাতা</button>
              <span className="text-sm">পাতা {toBn(data.page)} / {toBn(data.pages)}</span>
              <button type="button" className="btn btn-sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>পরের পাতা</button>
            </div>
          )}
        </>
      )}

      {editing && (
        <QuestionForm
          question={editing._id ? editing : null}
          chapters={chapterList}
          onSaved={handleSaved}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmModal
        open={Boolean(deleting)}
        title="প্রশ্নটা মুছে ফেলবে?"
        message="মুছে ফেললে আর ফেরত আনা যাবে না। কোনো পরীক্ষায় এই প্রশ্ন থাকলে মোছা যাবে না।"
        confirmText="হ্যাঁ, মুছে ফেলো"
        danger
        loading={deleteBusy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
