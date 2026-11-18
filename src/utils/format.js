const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

export const LETTERS = ['ক', 'খ', 'গ', 'ঘ'];
export const EN_LETTERS = ['A', 'B', 'C', 'D'];

// প্রশ্নের অপশনের চিহ্ন: 'bn' হলে ক খ গ ঘ, 'en' হলে A B C D (ইংরেজি বিষয়ের জন্য)
export const lettersOf = (style) => (style === 'en' ? EN_LETTERS : LETTERS);

// অপশন আর প্রশ্নে একটাও বাংলা অক্ষর না থাকলে ইংরেজি প্রশ্ন ধরে নেয়
export function guessOptionStyle(text, options = []) {
  const all = [text, ...options.map((o) => (typeof o === 'string' ? o : o?.text))].join(' ');
  const hasLatin = /[A-Za-z]{2,}/.test(all);
  const hasBangla = /[\u0980-\u09FF]/.test(all);
  return hasLatin && !hasBangla ? 'en' : 'bn';
}

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
