import { useEffect, useState } from "react";

export function useFetchData(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [controller, setController] = useState(null);

  const fetchNow = async () => {
    if (controller) controller.abort();
    const c = new AbortController();
    setController(c);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(url, { signal: c.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || String(err));
        setData(null);
      }
    } finally {
      setLoading(false);
      setController(null);
    }
  };

  useEffect(() => {
    fetchNow();
    return () => controller?.abort();
  }, [url]);

  return { data, loading, error, refetch: fetchNow };
}
