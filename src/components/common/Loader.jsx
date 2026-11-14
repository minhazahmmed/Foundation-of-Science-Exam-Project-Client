export default function Loader({ text = 'একটু অপেক্ষা করো...' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-base-content/85">
      <span className="loading loading-spinner loading-lg text-primary" />
      <p>{text}</p>
    </div>
  );
}
