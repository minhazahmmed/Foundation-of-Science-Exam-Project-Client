import { LETTERS } from './format.js';

// ইমপোর্টের আগে প্রশ্ন দেখানোর জন্য JSON-এর একটা আইটেম গুছিয়ে নেয় এবং সমস্যা থাকলে তালিকা করে।
// সার্ভারও একই নিয়মে যাচাই করে, এটা শুধু আগেভাগে চোখে দেখানোর জন্য।
export function normalizeForPreview(item, index) {
  const options = Array.isArray(item?.options)
    ? item.options.map((o) =>
        typeof o === 'string'
          ? { text: o, image: '' }
          : { text: o?.text || '', image: o?.image || '' }
      )
    : [];

  const correctIndex = Number.isInteger(item?.correctIndex)
    ? item.correctIndex
    : LETTERS.indexOf(String(item?.answer || '').trim());

  const text = item?.text ?? item?.question ?? '';
  const problems = [];

  if (!text.trim() && !item?.image) problems.push('প্রশ্নের লেখা নেই');
  if (options.length !== 4) problems.push('অপশন ঠিক ৪টা হতে হবে');

  const seen = new Map();
  options.forEach((option, i) => {
    const key = option.text.replace(/\s+/g, '');
    if (!key) return;
    if (seen.has(key)) problems.push(`অপশন ${LETTERS[seen.get(key)]} ও ${LETTERS[i]} হুবহু এক`);
    else seen.set(key, i);
  });

  if (correctIndex < 0 || correctIndex > 3) problems.push('সঠিক উত্তর ঠিক করা নেই');

  // ছবির কোনো অংশ AI পড়তে না পারলে [অস্পষ্ট] লিখে রাখে
  const hasBlurry = [text, item?.passage, ...options.map((o) => o.text)].some((t) => String(t || '').includes('[অস্পষ্ট]'));
  if (hasBlurry) problems.push('কিছু লেখা অস্পষ্ট ছিল, [অস্পষ্ট] লেখা জায়গাটা ঠিক করো');

  return {
    no: item?.no ?? index + 1,
    text,
    passage: item?.passage || '',
    board: item?.board || '',
    image: item?.image || '',
    options,
    correctIndex,
    needsImage: item?.needsImage || '',
    bookNo: item?.bookNo ?? null,
    guessed: Boolean(item?.answerGuessed),
    problems,
  };
}
