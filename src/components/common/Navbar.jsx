import { useEffect } from 'react';
import { FiLogOut, FiMenu, FiUser, FiLogIn, FiUserPlus } from 'react-icons/fi';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';

const teacherLinks = [
  { to: '/teacher', label: 'আমার পরীক্ষা', end: true },
  { to: '/teacher/questions', label: 'প্রশ্ন ব্যাংক', end: true },
  { to: '/teacher/questions/new', label: 'প্রশ্ন বানাও' },
  { to: '/teacher/import', label: 'ছবি থেকে প্রশ্ন' },
  { to: '/teacher/exams/new', label: 'নতুন পরীক্ষা' },
];

const studentLinks = [{ to: '/my-results', label: 'আমার ফলাফল' }];

// সক্রিয় লিংকে শুধু সবুজ আন্ডারলাইন, কোনো ব্যাকগ্রাউন্ড নেই।
// daisyUI-র "menu" ক্লাস সক্রিয় লিংকে কালো ব্যাকগ্রাউন্ড বসায়, তাই লিংকের তালিকায় ওই ক্লাস ব্যবহার করা হয়নি।
const linkClass = ({ isActive }) =>
  isActive
    ? 'inline-block py-2 text-base font-bold text-primary underline decoration-primary decoration-4 underline-offset-8'
    : 'inline-block py-2 text-base font-medium transition-colors hover:text-primary';

// মোবাইলের ড্রপডাউন লিংকে ক্লিক করার পর বন্ধ করে দেয়
const closeDropdown = () => document.activeElement?.blur();

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === 'teacher' ? teacherLinks : user ? studentLinks : [];

  // স্ক্রিন ৬ পিক্সেল বা তার বেশি স্ক্রোল করলেই ড্রপডাউন মেনু অটো হাইড করার ইফেক্ট
  useEffect(() => {
    let lastScrollY = window.scrollY;

    function handleScroll() {
      if (Math.abs(window.scrollY - lastScrollY) > 6) {
        closeDropdown();
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleLogout() {
    closeDropdown();
    logout();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-30 border-b border-base-300 bg-base-100">
      <div className="navbar mx-auto max-w-6xl px-3 py-3">
        <div className="navbar-start gap-1">
          {/* ইউজার লগইন করা থাকলে অথবা গেস্ট হলে মোবাইলের জন্য ড্রপডাউন মেনু */}
          {(links.length > 0 || !user) && (
            <div className="dropdown lg:hidden">
              <button type="button" tabIndex={0} className="btn btn-ghost btn-square" aria-label="মেনু খোলো">
                <FiMenu size={24} />
              </button>
              <ul
                tabIndex={0}
                className="dropdown-content z-40 mt-3 flex w-60 flex-col gap-1 rounded-box border border-base-300 bg-base-100 p-3 text-base shadow-lg"
              >
                {links.length > 0 ? (
                  links.map((link) => (
                    <li key={link.to}>
                      <NavLink to={link.to} end={link.end} onClick={closeDropdown} className={linkClass}>
                        {link.label}
                      </NavLink>
                    </li>
                  ))
                ) : (
                  <>
                    <li>
                      <Link
                        to="/login"
                        onClick={closeDropdown}
                        className="flex items-center gap-2 py-2.5 font-medium transition-colors hover:text-primary"
                      >
                        <FiLogIn size={18} /> লগইন
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/register"
                        onClick={closeDropdown}
                        className="flex items-center gap-2 py-2.5 font-medium text-primary"
                      >
                        <FiUserPlus size={18} /> নতুন অ্যাকাউন্ট
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          )}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="h-9 w-9 sm:h-10 sm:w-10" />
            <span className="text-lg sm:text-xl font-extrabold leading-none">
              FOS <span className="text-primary">Exam</span>
            </span>
          </Link>
        </div>

        <nav className="navbar-center hidden lg:flex" aria-label="প্রধান মেনু">
          <ul className="flex items-center gap-8 px-1">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} end={link.end} className={linkClass}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="navbar-end gap-2">
          {user ? (
            <div className="dropdown dropdown-end">
              <button type="button" tabIndex={0} className="btn btn-ghost max-w-48 gap-2 px-3 text-base">
                <FiUser size={18} aria-hidden="true" />
                <span className="truncate font-semibold">{user.name}</span>
              </button>
              <ul tabIndex={0} className="menu dropdown-content z-40 mt-3 w-64 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg text-base">
                <li className="menu-title normal-case text-sm">
                  {user.role === 'teacher' ? 'শিক্ষক' : 'শিক্ষার্থী'} · {user.email}
                </li>
                <li>
                  <button type="button" onClick={handleLogout} className="py-2.5 font-medium">
                    <FiLogOut size={18} aria-hidden="true" /> লগআউট
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            /* ল্যাপটপ বা বড় স্ক্রিনের জন্য সরাসরি বাটন দেখাবে, মোবাইলে হিডেন থাকবে */
            <div className="hidden lg:flex items-center gap-2">
              <Link to="/login" className="btn btn-ghost text-base font-semibold px-4">
                লগইন
              </Link>
              <Link to="/register" className="btn btn-primary text-base font-semibold px-4">
                নতুন অ্যাকাউন্ট
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}