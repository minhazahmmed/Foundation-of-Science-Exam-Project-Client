import { FiClock } from 'react-icons/fi';
import { formatTimer } from '../../utils/format.js';

// ৫ মিনিটের কম থাকলে হলুদ, ১ মিনিটের কম থাকলে লাল
export default function ExamTimer({ secondsLeft }) {
  let color = 'border-base-300 bg-base-100 text-base-content';
  if (secondsLeft <= 60) color = 'border-error bg-error text-error-content';
  else if (secondsLeft <= 300) color = 'border-secondary bg-secondary text-secondary-content';

  return (
    <div
      className={`flex items-center gap-2 rounded-box border px-3 py-1.5 font-semibold tabular-nums ${color}`}
      role="timer"
      aria-label="বাকি সময়"
    >
      <FiClock aria-hidden="true" />
      <span className="text-lg leading-none">{formatTimer(secondsLeft)}</span>
    </div>
  );
}
