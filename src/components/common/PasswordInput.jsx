import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

// পাসওয়ার্ডের ঘর, ডানে চোখের বোতাম চাপলে পাসওয়ার্ড দেখা যায়/লুকানো যায়
export default function PasswordInput({ value, onChange, autoComplete, minLength, required = true }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        className="input w-full pr-12"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'পাসওয়ার্ড লুকাও' : 'পাসওয়ার্ড দেখাও'}
        aria-pressed={visible}
        className="btn btn-ghost btn-sm btn-square absolute top-1/2 right-1 -translate-y-1/2"
      >
        {visible ? <FiEyeOff size={18} /> : <FiEye size={18} />}
      </button>
    </div>
  );
}
