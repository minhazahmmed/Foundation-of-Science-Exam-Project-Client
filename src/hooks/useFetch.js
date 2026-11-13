import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../api/axios.js';

// ব্যবহার:
//   const fetcher = useCallback(() => getExams(), []);
//   const { data, error, loading, reload } = useFetch(fetcher);
export default function useFetch(fetcher) {
  const [state, setState] = useState({ fetcher: null, data: null, error: '' });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let ignore = false;

    fetcher()
      .then((data) => {
        if (!ignore) setState({ fetcher, data, error: '' });
      })
      .catch((err) => {
        if (!ignore) setState({ fetcher, data: null, error: getErrorMessage(err) });
      });

    return () => {
      ignore = true;
    };
  }, [fetcher, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  // fetcher বদলে গেলে (যেমন ফিল্টার বদলালে) নতুন ডেটা না আসা পর্যন্ত loading
  const loading = state.fetcher !== fetcher;

  return { data: loading ? null : state.data, error: loading ? '' : state.error, loading, reload };
}
