import { NotionBlocks } from "~/components/notion-blocks";
import type { NotionEntryWithBlocks } from "~/lib/notion";

type DevlogListProps = {
  entries: NotionEntryWithBlocks[];
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

export function DevlogList({ entries, emptyMessage }: DevlogListProps) {
  if (entries.length === 0) {
    return <p className="m-0 leading-7">{emptyMessage}</p>;
  }

  return (
    <div className="grid gap-8">
      {entries.map((entry) => (
        <article key={entry.id} className="grid gap-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="m-0 text-xl leading-tight font-normal">
              {entry.title}
            </h2>
            {entry.date ? (
              <p className="m-0 text-sm opacity-70">{formatDate(entry.date)}</p>
            ) : null}
          </div>
          <NotionBlocks blocks={entry.blocks} />
        </article>
      ))}
    </div>
  );
}
