import { useState, useEffect } from "react";

export function useFeeds() {
  const [feeds, setFeeds] = useState(() => {
    return JSON.parse(localStorage.getItem("feeds") || "[]");
  });

  useEffect(() => {
    localStorage.setItem("feeds", JSON.stringify(feeds));
  }, [feeds]);

  function addFeed(url) {
    if (!url || feeds.includes(url)) return false;
    setFeeds([...feeds, url]);
    return true;
  }

  function removeFeed(url) {
    setFeeds(feeds.filter((f) => f !== url));
  }

  return { feeds, addFeed, removeFeed };
}
