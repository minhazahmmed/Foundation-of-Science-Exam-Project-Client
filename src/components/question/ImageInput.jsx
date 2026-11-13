import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiTrash2 } from 'react-icons/fi';
import { canUploadImages, uploadImage } from '../../utils/cloudinary.js';

// ছবি আপলোড করার ঘর। Cloudinary ঠিক করা থাকলে ফাইল বেছে নেওয়া যায়,
// না থাকলে ছবির লিংক বসানোর ঘর দেখায়।
export default function ImageInput({ value, onChange, compact = false }) {
  const [uploading, setUploading] = useState(false);
  const [link, setLink] = useState('');

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    try {
      onChange(await uploadImage(file));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  if (value) {
    return (
      <div className="flex items-center gap-3">
        <img src={value} alt="আপলোড করা ছবি" className={`${compact ? 'h-12' : 'h-20'} w-auto rounded border border-base-300 object-contain`} />
        <button type="button" className="btn btn-ghost btn-sm text-error" onClick={() => onChange('')}>
          <FiTrash2 aria-hidden="true" /> সরাও
        </button>
      </div>
    );
  }

  if (canUploadImages) {
    return (
      <div className="flex items-center gap-2">
        <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="file-input file-input-sm w-full" aria-label="ছবি বেছে নাও" />
        {uploading && <span className="loading loading-spinner loading-sm text-primary" />}
      </div>
    );
  }

  // লিংক পুরোটা লেখা শেষ হলে "যোগ করো" চাপতে হয়, নাহলে প্রথম অক্ষর লিখতেই ছবির ঘর বদলে যেত
  function addLink() {
    if (!link.trim()) return;
    onChange(link.trim());
    setLink('');
  }

  return (
    <div className="flex gap-2">
      <input
        type="url"
        className="input input-sm w-full"
        placeholder="ছবির লিংক বসাও (ঐচ্ছিক)"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addLink();
          }
        }}
      />
      <button type="button" className="btn btn-sm btn-outline" onClick={addLink}>
        যোগ করো
      </button>
    </div>
  );
}
