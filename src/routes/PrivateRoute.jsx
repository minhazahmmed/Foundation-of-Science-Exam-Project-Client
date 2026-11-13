import { Navigate, useLocation } from 'react-router-dom';
import Loader from '../components/common/Loader.jsx';
import useAuth from '../hooks/useAuth.js';

// role দিলে শুধু ওই ভূমিকার মানুষ ঢুকতে পারে ('teacher' বা 'student')
export default function PrivateRoute({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return children;
}
