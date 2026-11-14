export default function EmptyState({ title, text, action }) {
  return (
    <div className="rounded-box border border-dashed border-base-300 px-4 py-12 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      {text && <p className="mx-auto mt-1 max-w-md text-base-content/85">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
