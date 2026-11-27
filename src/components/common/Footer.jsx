import { FaFacebookF, FaLinkedinIn, FaWhatsapp, FaYoutube } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { CHANNEL_URL } from '../../utils/constants.js';

const YEAR = new Date().getFullYear();

const FACEBOOK_URL = 'https://facebook.com/minhaz.ahmmed.98';

const socials = [
  { label: 'WhatsApp', href: 'https://wa.me/8801878438206', icon: FaWhatsapp },
  { label: 'Facebook', href: FACEBOOK_URL, icon: FaFacebookF },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/minhaz-ahmmed', icon: FaLinkedinIn },
  { label: 'YouTube', href: CHANNEL_URL, icon: FaYoutube },
];

export default function Footer() {
  return (
    <footer className="border-t border-base-300 bg-base-200">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-2 md:gap-12">
        {/* বাঁ দিক: ব্র্যান্ড */}
        <div>
          <Link to="/" className="inline-flex items-center gap-2">
            <img src="/logo.png" alt="" className="h-10 w-10" />
            <span className="text-2xl font-bold text-base-content">
              FOS <span className="text-primary">Exam</span>
            </span>
          </Link>
          <p className="mt-3 max-w-md text-base leading-relaxed text-base-content/90">
            A free online MCQ exam platform for HSC students. Take timed exams, get instant results, and learn from your mistakes with step-by-step solutions.
          </p>
        </div>

        {/* ডান দিক: ডেভেলপারের পরিচয় */}
        <div className="md:justify-self-end md:text-right">
          <p className="text-sm text-base-content/85">Developed By</p>
          <p className="text-xl font-semibold text-base-content">Minhaz Ahmmed</p>
          <p className="mt-1 text-sm text-base-content/85">Founder &amp; Director, Foundation of Science</p>
          <ul className="mt-4 flex flex-wrap items-center gap-3 md:justify-end">
            {socials.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  title={label}
                  className="btn btn-circle btn-outline border-base-content/30 text-base-content hover:border-primary hover:bg-primary hover:text-primary-content"
                >
                  <Icon size={20} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-base-300 px-4 py-4 text-center text-sm text-base-content/85">
        <p className="flex items-center justify-center gap-2 font-medium text-base-content">
          <img src="/logo.png" alt="" className="h-6 w-6" />
          <span>Foundation of Science Exam Platform</span>
        </p>
        <p>© {YEAR} All rights reserved.</p>
      </div>
    </footer>
  );
}