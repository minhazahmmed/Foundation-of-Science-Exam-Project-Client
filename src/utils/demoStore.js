export const DEMO_KEY = 'fos-demo-teacher-v1';

// শিক্ষকের ডেমোতে বানানো প্রশ্নের খসড়া মুছে ফেলে। লগআউট ও লগইনের সময় ডাকা হয়, যাতে আগের কারও খসড়া না থাকে।
export function clearDemoDraft() {
  try {
    sessionStorage.removeItem(DEMO_KEY);
  } catch {
    // কিছু করার নেই
  }
}
