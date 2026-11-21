// একই seed দিলে সবসময় একই ক্রম আসে, তাই "সেট ক" আর "সেট খ" আলাদা করে ঠিক রাখা যায়
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled(list, seed) {
  const random = mulberry32(seed);
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// অপশন মেশালে সঠিক উত্তরের নতুন জায়গাও হিসাব করে দেয়
export function shuffleOptions(question, seed) {
  const order = shuffled(
    question.options.map((_, i) => i),
    seed
  );
  return {
    ...question,
    options: order.map((i) => question.options[i]),
    correctIndex: question.correctIndex >= 0 ? order.indexOf(question.correctIndex) : -1,
  };
}