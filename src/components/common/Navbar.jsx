import { FiLogOut, FiMenu, FiUser } from 'react-icons/fi';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';

const teacherLinks = [
  { to: '/teacher', label: 'আমার পরীক্ষা', end: true },
  { to: '/teacher/questions', label: 'প্রশ্ন ব্যাংক' },
  { to: '/teacher/import', label: 'প্রশ্ন ইমপোর্ট' },
  { to: '/teacher/exams/new', label: 'নতুন পরীক্ষা' },
];

const studentLinks = [{ to: '/my-results', label: 'আমার ফলাফল' }];

const linkClass = ({ isActive }) =>
  isActive
    ? '!bg-transparent font-semibold text-primary underline decoration-primary decoration-4 underline-offset-8'
    : '!bg-transparent hover:text-primary transition-colors';

// মোবাইলের ড্রপডাউন লিংকে ক্লিক করার পর বন্ধ করে দেয়
const closeDropdown = () => document.activeElement?.blur();

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === 'teacher' ? teacherLinks : user ? studentLinks : [];

  function handleLogout() {
    closeDropdown();
    logout();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-30 border-b border-base-300 bg-base-100">
      <div className="navbar mx-auto max-w-6xl px-3">
        <div className="navbar-start gap-1">
          {links.length > 0 && (
            <div className="dropdown lg:hidden">
              <button type="button" tabIndex={0} className="btn btn-ghost btn-square" aria-label="মেনু খোলো">
                <FiMenu size={22} />
              </button>
              <ul tabIndex={0} className="menu dropdown-content z-40 mt-3 w-56 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg">
                {links.map((link) => (
                  <li key={link.to}>
                    <NavLink to={link.to} end={link.end} onClick={closeDropdown}>
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="h-9 w-9" />
            <span className="text-lg font-bold leading-none">
              FOS <span className="text-primary">Exam</span>
            </span>
          </Link>
        </div>

        <nav className="navbar-center hidden lg:flex" aria-label="প্রধান মেনু">
          <ul className="menu menu-horizontal gap-1 px-1">
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
              <button type="button" tabIndex={0} className="btn btn-ghost max-w-44 gap-2 px-2">
                <FiUser aria-hidden="true" />
                <span className="truncate">{user.name}</span>
              </button>
              <ul tabIndex={0} className="menu dropdown-content z-40 mt-3 w-60 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg">
                <li className="menu-title normal-case">
                  {user.role === 'teacher' ? 'শিক্ষক' : 'শিক্ষার্থী'} · {user.email}
                </li>
                <li>
                  <button type="button" onClick={handleLogout}>
                    <FiLogOut aria-hidden="true" /> লগআউট
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                লগইন
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                নতুন অ্যাকাউন্ট
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
