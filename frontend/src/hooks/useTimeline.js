import { useState, useEffect } from "react";

const BACKEND = "http://localhost:3001";

export function useTimeline(feeds) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function loadTimeline() {
    if (feeds.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled(
        feeds.map((url) =>
          fetch(`${BACKEND}/feed?url=${encodeURIComponent(url)}`).then((r) =>
            r.json(),
          ),
        ),
      );

      const allArticles = results.flatMap((result, i) => {
        if (result.status === "rejected" || result.value.error) return [];
        return result.value.articles.map((article) => ({
          ...article,
          source: result.value.title,
          feedUrl: feeds[i],
        }));
      });

      allArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTimeline(allArticles);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Load on mount
  useEffect(() => {
    if (feeds.length > 0) loadTimeline();
  }, []);

  // Reload when feeds are added or removed
  useEffect(() => {
    if (feeds.length > 0) loadTimeline();
  }, [feeds.length]);

  return { timeline, loading, error, loadTimeline };
}
