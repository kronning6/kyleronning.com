import { PageFrame } from "~/components/page-frame";

export default function DevlogPage() {
  return (
    <PageFrame title="devlog">
      <div className="journal-copy">
        <p>
          This route is a good candidate for a Notion database later, with
          fields like title, slug, publishedAt, status, and summary.
        </p>
        <p>
          Right now it&apos;s a placeholder shell so the information
          architecture is in place before the Notion content layer lands.
        </p>
      </div>
    </PageFrame>
  );
}
