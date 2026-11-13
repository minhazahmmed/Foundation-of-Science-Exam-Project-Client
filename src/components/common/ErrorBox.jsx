export default function ErrorBox({ message, onRetry }) {
  return (
    <div role="alert" className="alert alert-error alert-soft my-6 flex-col items-start sm:flex-row sm:items-center">
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button type="button" className="btn btn-sm btn-error" onClick={onRetry}>
          আবার চেষ্টা করো
        </button>
      )}
    </div>
  );
}
