import { Navigate, useLocation } from 'react-router-dom';
import Loader from '../components/common/Loader.jsx';
import useAuth from '../hooks/useAuth.js';

// role দিলে শুধু ওই ভূমিকার মানুষ ঢুকতে পারে ('teacher' বা 'student')
// owner দিলে শুধু মূল শিক্ষক ঢুকতে পারেন
export default function PrivateRoute({ role, owner = false, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  if (owner && !user.isOwner) return <Navigate to="/" replace />;

  return children;
}
