import { useState, useRef } from "react";

const BACKEND = "";

export function useArticle() {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const currentRequest = useRef(null);

  async function loadArticle(url) {
    if (currentRequest.current) currentRequest.current.abort();
    const controller = new AbortController();
    currentRequest.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${BACKEND}/extract?url=${encodeURIComponent(url)}`,
        {
          signal: controller.signal,
        },
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setArticle({ url, ...data });
    } catch (e) {
      if (e.name === "AbortError") return;
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function clearArticle() {
    setArticle(null);
    setError(null);
  }

  return { article, loading, error, loadArticle, clearArticle };
}
