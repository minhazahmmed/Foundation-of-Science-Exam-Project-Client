import { toBn } from '../../utils/format.js';

// প্রশ্নের নম্বরের ছোট ছোট বোতাম। উত্তর দেওয়া হলে রঙিন, এখন যেটায় আছো সেটায় হলুদ বর্ডার।
export default function QuestionPalette({ questions, answers, current, onJump }) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
      {questions.map((q, i) => {
        const answered = Number.isInteger(answers[q._id]);
        const isCurrent = i === current;
        return (
          <button
            key={q._id}
            type="button"
            onClick={() => onJump(i)}
            aria-label={`প্রশ্ন ${toBn(i + 1)}${answered ? ', উত্তর দেওয়া হয়েছে' : ''}`}
            aria-current={isCurrent ? 'true' : undefined}
            className={`h-10 rounded-field border text-sm font-semibold ${
              answered ? 'border-primary bg-primary text-primary-content' : 'border-base-300 bg-base-100'
            } ${isCurrent ? 'outline-3 outline-offset-1 outline-secondary' : ''}`}
          >
            {toBn(i + 1)}
          </button>
        );
      })}
    </div>
  );
}
