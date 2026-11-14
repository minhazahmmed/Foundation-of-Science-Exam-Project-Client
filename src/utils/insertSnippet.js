// snippet এর "|" চিহ্নটা মানে কার্সর এখানে থাকবে। কার্সরের জায়গায় (বা বাছাই করা লেখার জায়গায়) snippet বসায়।
export function insertSnippet(el, value, snippet) {
  const caret = snippet.indexOf('|');
  const clean = snippet.replace('|', '');
  const start = el?.selectionStart ?? value.length;
  const end = el?.selectionEnd ?? value.length;

  return {
    next: value.slice(0, start) + clean + value.slice(end),
    position: start + (caret >= 0 ? caret : clean.length),
  };
}
