const KEY = 'fos-print-selection-v1';

// প্রশ্নপত্রের জন্য বাছা প্রশ্নগুলো ব্রাউজারের এই ট্যাবে জমা থাকে (পেজ বদলালেও থাকে)
export function loadSelection() {
  try {
    const list = JSON.parse(sessionStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveSelection(list) {
  try {
    if (list.length === 0) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // জমা রাখা না গেলেও কাজ চলবে
  }
}

const SETTINGS_KEY = 'fos-paper-settings-v1'; // PrintPaper পেজের সেটিংসের একই চাবি

// তৈরি করা পরীক্ষার প্রশ্ন নিয়ে প্রশ্নপত্র বানানোর পেজ খোলার আগে এটা ডাকা হয়।
// প্রশ্নগুলো বাছা তালিকায় বসে, আর পরীক্ষার নাম, সময় ও পূর্ণমান সেটিংসে বসে। বাকি সেটিংস (প্রতিষ্ঠানের নাম ইত্যাদি) আগের মতোই থাকে।
export function startPaperFromExam(exam) {
  saveSelection(exam.questions);
  try {
    const old = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    const fullMarks = exam.questions.length * (Number(exam.marksPerQuestion) || 1);
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        ...old,
        examTitle: exam.title || '',
        time: exam.durationMinutes ? `${exam.durationMinutes} মিনিট` : old.time || '',
        fullMarks: String(fullMarks),
      })
    );
  } catch {
    // সেটিংস না বসলেও প্রশ্নগুলো ঠিকই যাবে
  }
}