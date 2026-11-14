import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../api/axios.js';
import Field from '../../components/common/Field.jsx';
import PasswordInput from '../../components/common/PasswordInput.jsx';
import useAuth from '../../hooks/useAuth.js';
import { roleHome } from '../../utils/roleHome.js';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [form, setForm] = useState({ name: '', email: '', password: '', teacherCode: '' });
  const [isTeacher, setIsTeacher] = useState(false);
  const [showTeacherCode, setShowTeacherCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={from ?? roleHome(user)} replace />;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const created = await register({ ...form, teacherCode: isTeacher ? form.teacherCode : undefined });
      toast.success('অ্যাকাউন্ট খোলা হয়ে গেছে');
      navigate(from ?? roleHome(created), { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-4 sm:py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <img src="/logo.png" alt="Foundation of Science" className="mb-3 h-16 w-16" />
        <h1 className="text-2xl font-bold">নতুন অ্যাকাউন্ট খোলো</h1>
        <p className="mt-1 text-base text-base-content/85">এক মিনিটেই হয়ে যাবে</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-box border border-base-300 p-5 sm:p-6">
        <Field label={<span className="text-sm font-semibold">তোমার নাম</span>}>
          <input required autoComplete="name" className="input w-full text-base" value={form.name} onChange={set('name')} />
        </Field>
        <Field label={<span className="text-sm font-semibold">ইমেইল</span>}>
          <input type="email" required autoComplete="email" className="input w-full text-base" value={form.email} onChange={set('email')} />
        </Field>
        <Field label={<span className="text-sm font-semibold">পাসওয়ার্ড</span>} hint={<span className="text-xs">কমপক্ষে ৬ অক্ষর</span>}>
          <PasswordInput minLength={6} autoComplete="new-password" className="text-base" value={form.password} onChange={set('password')} />
        </Field>

        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={isTeacher} onChange={(e) => setIsTeacher(e.target.checked)} />
          আমি শিক্ষক
        </label>
        {isTeacher && (
          <Field label={<span className="text-sm font-semibold">শিক্ষকের গোপন কোড</span>}>
            <div className="relative">
              <input
                type={showTeacherCode ? 'text' : 'password'}
                required
                className="input w-full pr-10 text-base"
                value={form.teacherCode}
                onChange={set('teacherCode')}
              />
              <button
                type="button"
                onClick={() => setShowTeacherCode(!showTeacherCode)}
                className="absolute inset-y-0 right-0 z-10 flex items-center pr-3 text-base-content/60 hover:text-base-content"
                aria-label={showTeacherCode ? 'কোড লুকাও' : 'কোড দেখো'}
              >
                {showTeacherCode ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </Field>
        )}

        <button type="submit" className="btn btn-primary w-full text-base font-semibold" disabled={submitting}>
          {submitting && <span className="loading loading-spinner loading-sm" />}
          অ্যাকাউন্ট খোলো
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-base-content/85">
        আগে থেকেই অ্যাকাউন্ট আছে?{' '}
        <Link to="/login" state={location.state} className="link link-primary font-medium">
          লগইন করো
        </Link>
      </p>
    </div>
  );
}