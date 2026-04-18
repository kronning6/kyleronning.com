import { PageFrame } from "~/components/page-frame";

export default function PostsPage() {
  return (
    <PageFrame title="posts">
      <div className="journal-copy">
        <p>
          This route is set up as the future landing page for Notion-backed
          posts.
        </p>
        <p>
          Once you define the database schema, this page can list published
          posts from Notion with ISR-style caching.
        </p>
      </div>
    </PageFrame>
  );
}
