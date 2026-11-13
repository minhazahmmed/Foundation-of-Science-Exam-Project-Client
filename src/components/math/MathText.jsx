import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const escapeHtml = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// "$...$" এর ভেতরের অংশ সমীকরণ হয়ে যায়, বাকিটা সাধারণ লেখা
function toHtml(text) {
  const pattern = /\$([^$]+)\$/g;
  let html = '';
  let last = 0;
  let match;

  while ((match = pattern.exec(text))) {
    html += escapeHtml(text.slice(last, match.index));
    html += katex.renderToString(match[1], { throwOnError: false });
    last = pattern.lastIndex;
  }
  return html + escapeHtml(text.slice(last));
}

export default function MathText({ text = '', className = '' }) {
  const html = useMemo(() => toHtml(String(text ?? '')), [text]);
  return <span className={`whitespace-pre-line ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
