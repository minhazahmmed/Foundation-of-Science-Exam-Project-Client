const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// .env এ দুটো মানই থাকলে ছবি আপলোডের বোতাম দেখানো হয়
export const canUploadImages = Boolean(cloudName && uploadPreset);

const MAX_SIZE = 5 * 1024 * 1024;

// ছবি সরাসরি Cloudinary-তে যায়, আমাদের সার্ভারে না। ফেরত আসে ছবির লিংক।
export async function uploadImage(file) {
  if (file.size > MAX_SIZE) throw new Error('ছবির সাইজ ৫ MB এর বেশি হতে পারবে না');

  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error('ছবি আপলোড হয়নি, আবার চেষ্টা করো');

  const data = await res.json();
  return data.secure_url;
}
