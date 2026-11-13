import { toBn } from '../../utils/format.js';

const CHANNEL_URL = 'https://www.youtube.com/@foundationofscience9952';
const YEAR = toBn(new Date().getFullYear());

export default function Footer() {
  return (
    <footer className="border-t border-base-300 bg-base-200">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 text-center text-sm text-base-content/70 sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="" className="h-7 w-7" />
          <span className="font-medium text-base-content">Foundation of Science Exam Platform</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className="link link-hover">
            ইউটিউব চ্যানেল
          </a>
          <span>© {YEAR} Foundation of Science</span>
        </div>
      </div>
    </footer>
  );
}
