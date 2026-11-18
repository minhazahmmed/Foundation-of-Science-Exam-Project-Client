import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

// পেজ বদলালেই একদম উপর থেকে শুরু হবে, আগের পেজের স্ক্রলের জায়গা আর থাকবে না
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
