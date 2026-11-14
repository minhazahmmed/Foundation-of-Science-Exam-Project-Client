// লেবেল + ইনপুটের জোড়া। hint দিলে নিচে ছোট করে সাহায্যের লেখা দেখায়।
export default function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-base-content/75">{hint}</span>}
    </label>
  );
}
