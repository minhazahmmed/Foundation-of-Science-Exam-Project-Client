import { Navigate } from 'react-router-dom';
import Loader from '../components/common/Loader.jsx';
import useAuth from '../hooks/useAuth.js';

// লগইনের পর কে কোথায় যাবে সেটা এখানে ঠিক হয়
export default function Home() {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'teacher' ? '/teacher' : '/my-results'} replace />;
}
