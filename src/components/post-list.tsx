import Link from "next/link";
import type { NotionEntry } from "~/lib/notion";

type PostListProps = {
  entries: NotionEntry[];
  emptyMessage: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function PostList({ entries, emptyMessage }: PostListProps) {
  if (entries.length === 0) {
    return <p className="m-0 leading-7">{emptyMessage}</p>;
  }

  return (
    <div className="grid gap-6">
      {entries.map((entry) => (
        <article key={entry.id} className="grid gap-1">
          <Link
            href={`/posts/${entry.slug}`}
            className="w-fit text-xl leading-tight font-normal no-underline"
          >
            {entry.title}
          </Link>
          {entry.date ? (
            <p className="m-0 text-sm opacity-70">{formatDate(entry.date)}</p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
