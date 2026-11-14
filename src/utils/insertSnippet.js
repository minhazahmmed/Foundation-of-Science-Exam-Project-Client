// snippet এর "|" চিহ্নটা মানে কার্সর এখানে থাকবে। কার্সরের জায়গায় (বা বাছাই করা লেখার জায়গায়) snippet বসায়।
// কার্সর যদি আগে থেকেই কোনো $...$ এর ভেতরে থাকে, তাহলে snippet এর $ বাদ দিয়ে বসায়, নইলে $ এর ভেতরে $ ঢুকে সমীকরণ ভেঙে যায়।
export function insertSnippet(el, value, snippet) {
  const start = el?.selectionStart ?? value.length;
  const end = el?.selectionEnd ?? value.length;

  const dollarsBefore = (value.slice(0, start).match(/\$/g) || []).length;
  const insideMath = dollarsBefore % 2 === 1;
  const text = insideMath ? snippet.replace(/\$/g, '') : snippet;

  const caret = text.indexOf('|');
  const clean = text.replace('|', '');

  return {
    next: value.slice(0, start) + clean + value.slice(end),
    position: start + (caret >= 0 ? caret : clean.length),
  };
}
