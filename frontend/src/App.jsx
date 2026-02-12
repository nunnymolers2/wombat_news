import { useState } from "react";
import { useFeeds } from "./hooks/useFeeds";
import { useTimeline } from "./hooks/useTimeline";
import { useArticle } from "./hooks/useArticle";
import { Timeline } from "./components/Timeline";
import { Article } from "./components/Article";
import { ManageFeeds } from "./components/ManageFeeds";

export default function App() {
  const [view, setView] = useState("timeline"); // "timeline" | "article" | "manage"
  const { feeds, addFeed, removeFeed } = useFeeds();
  const {
    timeline,
    loading: timelineLoading,
    error: timelineError,
    loadTimeline,
  } = useTimeline(feeds);
  const {
    article,
    loading: articleLoading,
    error: articleError,
    loadArticle,
    clearArticle,
  } = useArticle();

  function handleSelectArticle(url) {
    loadArticle(url);
    setView("article");
  }

  function handleBack() {
    clearArticle();
    setView("timeline");
  }

  if (view === "article") {
    return (
      <Article
        article={article}
        loading={articleLoading}
        error={articleError}
        onBack={handleBack}
      />
    );
  }

  if (view === "manage") {
    return (
      <ManageFeeds
        feeds={feeds}
        onAdd={addFeed}
        onRemove={removeFeed}
        onBack={() => setView("timeline")}
      />
    );
  }

  return (
    <Timeline
      timeline={timeline}
      loading={timelineLoading}
      error={timelineError}
      onSelectArticle={handleSelectArticle}
      onRefresh={loadTimeline}
      onManageFeeds={() => setView("manage")}
      hasFeeds={feeds.length > 0}
    />
  );
}
