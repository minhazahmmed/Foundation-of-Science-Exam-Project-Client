import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../api/axios.js';
import Field from '../../components/common/Field.jsx';
import PasswordInput from '../../components/common/PasswordInput.jsx';
import useAuth from '../../hooks/useAuth.js';
import { roleHome } from '../../utils/roleHome.js';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname; // কোনো লিংক থেকে এলে লগইনের পর সেখানেই ফেরে

  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={from ?? roleHome(user)} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const loggedIn = await login(form.email, form.password);
      navigate(from ?? roleHome(loggedIn), { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-4 sm:py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <img src="/logo.png" alt="Foundation of Science" className="mb-3 h-16 w-16" />
        <h1 className="text-2xl font-bold">আবার স্বাগতম</h1>
        <p className="mt-1 text-base-content/85">লগইন করে তোমার পরীক্ষা শুরু করো</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-box border border-base-300 p-5 sm:p-6">
        <Field label="ইমেইল">
          <input type="email" required autoComplete="email" className="input w-full" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="পাসওয়ার্ড">
          <PasswordInput autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
          {submitting && <span className="loading loading-spinner loading-sm" />}
          লগইন করো
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-base-content/85">
        এখনো অ্যাকাউন্ট নেই?{' '}
        <Link to="/register" state={location.state} className="link link-primary font-medium">
          নতুন অ্যাকাউন্ট খোলো
        </Link>
      </p>
    </div>
  );
}
