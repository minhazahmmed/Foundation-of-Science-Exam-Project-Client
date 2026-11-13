import toast from 'react-hot-toast';
import { FiCopy } from 'react-icons/fi';
import { copyText } from '../../utils/clipboard.js';

export default function CopyButton({ text, label = 'কপি করো', done = 'কপি হয়েছে', className = 'btn btn-sm btn-outline' }) {
  async function handleCopy() {
    const ok = await copyText(text);
    if (ok) toast.success(done);
    else toast.error('কপি করা যায়নি, হাত দিয়ে কপি করো');
  }

  return (
    <button type="button" className={className} onClick={handleCopy}>
      <FiCopy aria-hidden="true" />
      {label}
    </button>
  );
}
