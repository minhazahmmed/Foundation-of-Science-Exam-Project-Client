const MAX_SIDE = 2200; // লম্বা দিকটা এর চেয়ে বড় হলে ছোট করা হয়, তবু ছোট লেখা পড়া যায়

// ফোনের ৪-৫ MB ছবি ছোট করে পাঠালে মোবাইল ডাটায়ও দ্রুত আপলোড হয়।
// কোনো কারণে ছোট করা না গেলে আসল ছবিটাই ফেরত দেয়।
export async function compressImage(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
