const INDEX = { ক: 0, খ: 1, গ: 2, ঘ: 3, a: 0, b: 1, c: 2, d: 3 };

// "খ ক গ ঘ" বা "১-খ, ২-ক, ৩-গ" থেকে [1, 0, 2, 3] বের করে।
// শুধু আলাদা করে লেখা ক/খ/গ/ঘ (বা a/b/c/d) ধরা হয়, কোনো শব্দের ভেতরের অক্ষর না।
export function parseAnswerKey(text) {
  const letters = String(text || '').match(/(?<![\p{L}\p{M}])[কখগঘabcdABCD](?![\p{L}\p{M}])/gu) || [];
  return letters.map((l) => INDEX[l.toLowerCase()]);
}
