const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

export const LETTERS = ['ক', 'খ', 'গ', 'ঘ'];

// 12 -> ১২
export const toBn = (value) => String(value).replace(/\d/g, (d) => BN_DIGITS[d]);

// 1.75 -> ১.৭৫, 2 -> ২ (শেষের অপ্রয়োজনীয় শূন্য বাদ যায়)
export const formatNumber = (n) => toBn(Number(Number(n).toFixed(2)));

export function formatDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('bn-BD', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  );
}

// 125 সেকেন্ড -> ০২:০৫
export function formatTimer(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const minutes = String(Math.floor(s / 60)).padStart(2, '0');
  const seconds = String(s % 60).padStart(2, '0');
  return toBn(`${minutes}:${seconds}`);
}

export const percentOf = (score, total) => (total ? Math.round((score / total) * 100) : 0);
