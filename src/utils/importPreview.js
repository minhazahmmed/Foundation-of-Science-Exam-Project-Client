import { EN_LETTERS, LETTERS, guessOptionStyle } from './format.js';

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

  const answerText = String(item?.answer || '').trim();
  let correctIndex = Number.isInteger(item?.correctIndex) ? item.correctIndex : LETTERS.indexOf(answerText);
  if (correctIndex < 0 && !Number.isInteger(item?.correctIndex)) correctIndex = EN_LETTERS.indexOf(answerText.toUpperCase());

  const text = item?.text ?? item?.question ?? '';
  const optionStyle = item?.optionStyle === 'en' || item?.optionStyle === 'bn' ? item.optionStyle : guessOptionStyle(text, options);
  const letters = optionStyle === 'en' ? EN_LETTERS : LETTERS;
  const problems = [];

  if (!text.trim() && !item?.image) problems.push('প্রশ্নের লেখা নেই');
  if (options.length !== 4) problems.push('অপশন ঠিক ৪টা হতে হবে');

  options.forEach((option, i) => {
    if (!option.text.trim() && !option.image) problems.push(`অপশন ${letters[i]} খালি`);
  });

  const seen = new Map();
  options.forEach((option, i) => {
    const key = option.text.replace(/\s+/g, '');
    if (!key) return;
    if (seen.has(key)) problems.push(`অপশন ${letters[seen.get(key)]} ও ${letters[i]} হুবহু এক`);
    else seen.set(key, i);
  });

  // ছবির কোনো অংশ AI পড়তে না পারলে [অস্পষ্ট] লিখে রাখে
  const hasBlurry = [text, item?.passage, ...options.map((o) => o.text)].some((t) => String(t || '').includes('[অস্পষ্ট]'));
  if (hasBlurry) problems.push('কিছু লেখা অস্পষ্ট ছিল, [অস্পষ্ট] লেখা জায়গাটা ঠিক করো');

  return {
    no: item?.no ?? index + 1,
    text,
    passage: item?.passage || '',
    board: item?.board || '',
    image: item?.image || '',
    passageImage: item?.passageImage || '',
    explanation: item?.explanation || '',
    explanationImage: item?.explanationImage || '',
    optionStyle,
    options,
    // ছবি থেকে আনা প্রশ্নে সঠিক উত্তর টিচার নিজে বাছে, তাই না থাকাটা সমস্যা নয়, বাকি কাজ
    correctIndex: correctIndex >= 0 && correctIndex <= 3 ? correctIndex : -1,
    needsImage: item?.needsImage || '',
    bookNo: item?.bookNo ?? null,
    problems,
  };
}
