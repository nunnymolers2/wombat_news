import { Button } from "./ui/Button";
import { Spinner } from "./ui/Spinner";
import { ErrorMessage } from "./ui/ErrorMessage";
import { Card } from "./ui/Card";

export function Timeline({
  timeline,
  loading,
  error,
  onSelectArticle,
  onRefresh,
  onManageFeeds,
  hasFeeds,
}) {
  return (
    <div class="font-mono grid align-center">
      <div class="flex justify-between mx-3 mt-3">
        <Button onClick={onManageFeeds}>Manage Feeds</Button>
        <Button onClick={onRefresh} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
      <ErrorMessage message={error} />
      {!hasFeeds && (
        <p>
          No feeds yet. <Button onClick={onManageFeeds}>Add one</Button>
        </p>
      )}

      {loading && <Spinner />}

      {timeline.map((article, i) => (
        <Card key={i} onClick={() => onSelectArticle(article.url)}>
          <small>
            {article.source} ·{" "}
            {article.date ? new Date(article.date).toLocaleDateString() : ""}
          </small>
          <p>
            <strong>{article.title}</strong>
          </p>
          {article.excerpt && <p>{article.excerpt}</p>}
        </Card>
      ))}
    </div>
  );
}


