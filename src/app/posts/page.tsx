import { Effect } from "effect";
import { cacheLife } from "next/cache";
import { PageFrame } from "~/components/page-frame";
import { PostList } from "~/components/post-list";
import { RapidLog } from "~/components/rapid-log";
import {
  getPostEntries,
  InvalidNotionRequestError,
  MissingNotionTokenError,
  MissingNotionWebsitePageIdError,
} from "~/lib/notion";

export default async function PostsPage() {
  "use cache";
  cacheLife("notion");

  return Effect.runPromise(
    Effect.match(
      Effect.tryPromise({
        try: () => getPostEntries(),
        catch: (cause) => cause,
      }),
      {
        onSuccess: ({ entries }) => (
          <PageFrame title="posts">
            <PostList entries={entries} emptyMessage="No posts found." />
          </PageFrame>
        ),
        onFailure: (error) => (
          <PageFrame title="posts">
            <RapidLog>
              <p>
                {error instanceof InvalidNotionRequestError ||
                error instanceof MissingNotionTokenError ||
                error instanceof MissingNotionWebsitePageIdError
                  ? error.message
                  : error instanceof Error
                    ? error.message
                    : "Failed to load posts."}
              </p>
            </RapidLog>
          </PageFrame>
        ),
      },
    ),
  );
}
