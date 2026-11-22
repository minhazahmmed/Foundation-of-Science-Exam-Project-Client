const KEY = 'fos-print-selection-v1';

// বাছা প্রশ্নগুলো এই ট্যাবে (sessionStorage) জমা থাকে, আর একটা কপি localStorage এও থাকে।
// তাই লিংক কপি করে নতুন ট্যাবে খুললেও শেষবারের বাছা প্রশ্নগুলো পাওয়া যায়।
function readList(storage) {
  try {
    const list = JSON.parse(storage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function loadSelection() {
  const own = readList(sessionStorage);
  return own.length > 0 ? own : readList(localStorage);
}

export function saveSelection(list) {
  for (const storage of [sessionStorage, localStorage]) {
    try {
      if (list.length === 0) storage.removeItem(KEY);
      else storage.setItem(KEY, JSON.stringify(list));
    } catch {
      // জমা রাখা না গেলেও কাজ চলবে
    }
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