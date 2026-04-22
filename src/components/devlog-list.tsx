import Link from "next/link";
import type { NotionEntry } from "~/lib/notion";
import { formatDate } from "~/lib/utils";

type DevlogListProps = {
  entries: NotionEntry[];
  emptyMessage: string;
};

export function DevlogList({ entries, emptyMessage }: DevlogListProps) {
  if (entries.length === 0) {
    return <p className="m-0 leading-7">{emptyMessage}</p>;
  }

  return (
    <div className="grid gap-6">
      {entries.map((entry) => (
        <article key={entry.id} className="grid gap-1">
          <Link
            href={`/devlog/${entry.slug}`}
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
