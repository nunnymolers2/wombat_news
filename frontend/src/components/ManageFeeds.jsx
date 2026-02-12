import { useState } from "react";
import { Button } from "./ui/Button";
import { ErrorMessage } from "./ui/ErrorMessage";

export function ManageFeeds({ feeds, onAdd, onRemove, onBack }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(null);

  function handleAdd() {
    const url = input.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      setError("Invalid URL — make sure it starts with https://");
      return;
    }
    const added = onAdd(url);
    if (added) setInput("");
  }

  return (
    <div class="font-mono text-gray-400 m-3">
      <h1 class="text-2xl mt-5 mb-3">Manage Feeds</h1>

      <div class="flex gap-2 my-3">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Paste a feed or site URL"
          class="flex-1 bg-gray-800 rounded-md focus:ring-brand focus:border-brand p-3"
        />
        <Button onClick={handleAdd}>
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
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </Button>
      </div>

      <ErrorMessage message={error} />

      <ul class="gap-y-5 mb-5">
        {feeds.map((url) => (
          <li
            key={url}
            class="flex items-center justify-between gap-4 py-2 border-b border-gray-800"
          >
            {/* The text container */}
            <span class="truncate font-mono text-sm min-w-0" title={url}>
              {url}
            </span>

            {/* The action button */}
            <Button onClick={() => onRemove(url)} class="shrink-0 text-xs">
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
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </Button>
          </li>
        ))}
      </ul>
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
