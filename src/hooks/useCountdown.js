import { useEffect, useRef, useState } from 'react';

const secondsLeft = (expiresAt, offset) =>
  Math.max(0, Math.round((new Date(expiresAt).getTime() - (Date.now() + offset)) / 1000));

// সার্ভারের ঘড়ি ধরে উল্টো গণনা। স্টুডেন্টের ফোনের ঘড়ি ভুল থাকলেও সময় ঠিক থাকে।
// সময় শেষ হলে onExpire একবার ডাকা হয়।
export default function useCountdown({ expiresAt, serverNow, onExpire }) {
  const [offset] = useState(() => new Date(serverNow).getTime() - Date.now());
  const [left, setLeft] = useState(() => secondsLeft(expiresAt, offset));

  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const next = secondsLeft(expiresAt, offset);
      setLeft(next);
      if (next === 0) {
        clearInterval(timer);
        onExpireRef.current?.();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, offset]);

  return left;
}
