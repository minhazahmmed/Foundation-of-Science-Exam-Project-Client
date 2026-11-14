import MathText from '../math/MathText.jsx';

// "|" মানে বসানোর পর কার্সর ওখানে থাকবে
const BUTTONS = [
  { label: '$\\frac{a}{b}$', name: 'ভগ্নাংশ', snippet: '$\\frac{|}{}$' },
  { label: '$x^2$', name: 'ঘাত', snippet: '$x^{|}$' },
  { label: '$x_1$', name: 'নিচে ছোট সংখ্যা', snippet: '$x_{|}$' },
  { label: '$\\sqrt{x}$', name: 'বর্গমূল', snippet: '$\\sqrt{|}$' },
  { label: '$\\vec{A}$', name: 'ভেক্টর', snippet: '$\\vec{|}$' },
  { label: '$\\hat{i}$', name: 'একক ভেক্টর', snippet: '$\\hat{|}$' },
  { label: '$\\theta$', name: 'থিটা', snippet: '$\\theta$' },
  { label: '$\\pi$', name: 'পাই', snippet: '$\\pi$' },
  { label: '$\\alpha$', name: 'আলফা', snippet: '$\\alpha$' },
  { label: '$\\times$', name: 'ক্রস গুণ', snippet: '$\\times$' },
  { label: '$\\cdot$', name: 'ডট গুণ', snippet: '$\\cdot$' },
  { label: '$\\pm$', name: 'যোগ-বিয়োগ', snippet: '$\\pm$' },
  { label: '$\\leq$', name: 'ছোট বা সমান', snippet: '$\\leq$' },
  { label: '$\\geq$', name: 'বড় বা সমান', snippet: '$\\geq$' },
  { label: '$\\neq$', name: 'সমান নয়', snippet: '$\\neq$' },
  { label: '$\\int$', name: 'যোগজ', snippet: '$\\int |\\,dx$' },
  { label: '$\\log$', name: 'লগ', snippet: '$\\log_{|}$' },
  { label: '$\\sin$', name: 'সাইন', snippet: '$\\sin |$' },
];

// ছোট বোতামে ক্লিক করলে সমীকরণের চিহ্ন বসে যায়, LaTeX শিখতে হয় না
export default function MathToolbar({ onInsert }) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium">সমীকরণের চিহ্ন (যে ঘরে লিখছ সেখানে বসবে)</p>
      <div className="flex flex-wrap gap-1.5">
        {BUTTONS.map((b) => (
          <button
            key={b.name}
            type="button"
            title={b.name}
            aria-label={b.name}
            // ক্লিকের সময় লেখার ঘর থেকে ফোকাস সরে গেলে কার্সরের জায়গা হারিয়ে যায়, তাই সেটা আটকানো হয়
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onInsert(b.snippet)}
            className="btn btn-sm btn-outline min-w-10 bg-base-100 px-2"
          >
            <MathText text={b.label} className="whitespace-nowrap" />
          </button>
        ))}
      </div>
    </div>
  );
}
