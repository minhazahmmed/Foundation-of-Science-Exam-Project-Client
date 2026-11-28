// প্রশ্নপত্র বানানোর জন্য বাছা প্রশ্ন আর সেটিংস ব্রাউজারে জমা থাকে (পেজ রিফ্রেশ দিলেও হারায় না)
const SELECTION_KEY = 'fos-paper-selection-v1';
const SETTINGS_KEY = 'fos-paper-settings-v1';

function read(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // জায়গা না থাকলে জমা হবে না, কিন্তু বাকি সব ঠিকই চলবে
  }
}

// বাছা প্রশ্নের তালিকা: ট্যাবে (sessionStorage) আর নতুন ট্যাবের জন্য localStorage এ কপি
export const loadSelection = () => {
  const own = read(sessionStorage, SELECTION_KEY, []);
  const list = Array.isArray(own) && own.length > 0 ? own : read(localStorage, SELECTION_KEY, []);
  return Array.isArray(list) ? list : [];
};
export const saveSelection = (list) => {
  if (list.length === 0) {
    clearSelection();
    return;
  }
  write(sessionStorage, SELECTION_KEY, list);
  write(localStorage, SELECTION_KEY, list);
};
export const clearSelection = () => {
  for (const storage of [sessionStorage, localStorage]) {
    try {
      storage.removeItem(SELECTION_KEY);
    } catch {
      // কিছু করার নেই
    }
  }
};

export const loadPaperSettings = () => read(localStorage, SETTINGS_KEY, {});
export const savePaperSettings = (settings) => write(localStorage, SETTINGS_KEY, settings);
