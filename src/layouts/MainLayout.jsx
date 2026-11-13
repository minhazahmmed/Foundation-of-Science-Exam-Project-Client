import { Outlet } from 'react-router-dom';
import Footer from '../components/common/Footer.jsx';
import Navbar from '../components/common/Navbar.jsx';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-base-100">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
