import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../api/axios.js';
import Field from '../../components/common/Field.jsx';
import useAuth from '../../hooks/useAuth.js';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={from} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
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
        <p className="mt-1 text-base-content/70">লগইন করে তোমার পরীক্ষা শুরু করো</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-box border border-base-300 p-5 sm:p-6">
        <Field label="ইমেইল">
          <input type="email" required autoComplete="email" className="input w-full" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="পাসওয়ার্ড">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              className="input w-full pr-10"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 z-10 flex items-center pr-3 text-base-content/60 hover:text-base-content"
              aria-label={showPassword ? 'পাসওয়ার্ড লুকাও' : 'পাসওয়ার্ড দেখো'}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
        </Field>
        <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
          {submitting && <span className="loading loading-spinner loading-sm" />}
          লগইন করো
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-base-content/70">
        এখনো অ্যাকাউন্ট নেই?{' '}
        <Link to="/register" state={location.state} className="link link-primary font-medium">
          নতুন অ্যাকাউন্ট খোলো
        </Link>
      </p>
    </div>
  );
}