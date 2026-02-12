import { Button } from "./ui/Button";
import { Spinner } from "./ui/Spinner";
import { ErrorMessage } from "./ui/ErrorMessage";

export function Article({ article, loading, error, onBack }) {
  return (
    <div class="font-mono m-2">
      {loading && <Spinner />}
      <ErrorMessage message={error} />

      {article && (
        <>
          <h1 class="text-gray-400 p-2 text-xl">{article.title}</h1>
          {article.byline && (
            <p class="text-gray-400 px-2 text-sm italic">{article.byline}</p>
          )}
          <div
            class="prose p-2 text-gray-400 prose-headings:text-gray-400 prose-a:text-blue-300 prose-blockquote:text-gray-400 prose-blockquote:bg-gray-900 prose-figure:bg-gray-900"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </>
      )}

      <Button onClick={onBack}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
          />
        </svg>
      </Button>
    </div>
  );
}
