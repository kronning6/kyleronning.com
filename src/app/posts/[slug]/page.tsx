import { Effect } from "effect";
import { notFound, unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { NotionBlocks } from "~/components/notion-blocks";
import { PageFrame } from "~/components/page-frame";
import { RapidLog } from "~/components/rapid-log";
import {
  getPostBySlug,
  InvalidNotionRequestError,
  MissingNotionTokenError,
  MissingNotionWebsitePageIdError,
} from "~/lib/notion";
import { formatDate } from "~/lib/utils";

async function PostPageContent({
  params,
}: {
  params: PageProps<"/posts/[slug]">["params"];
}) {
  const { slug } = await params;

  return Effect.runPromise(
    Effect.match(
      Effect.tryPromise({
        try: async () => {
          const post = await getPostBySlug(slug);

          if (!post) {
            notFound();
          }

          return post;
        },
        catch: (cause) => cause,
      }),
      {
        onSuccess: (post) => (
          <PageFrame title={post.title}>
            {post.date ? (
              <p className="m-0 text-sm opacity-70">{formatDate(post.date)}</p>
            ) : null}
            <NotionBlocks blocks={post.blocks} />
          </PageFrame>
        ),
        onFailure: (error) => {
          unstable_rethrow(error);

          return (
            <PageFrame title="posts">
              <RapidLog>
                <p>
                  {error instanceof InvalidNotionRequestError ||
                  error instanceof MissingNotionTokenError ||
                  error instanceof MissingNotionWebsitePageIdError
                    ? error.message
                    : error instanceof Error
                      ? error.message
                      : "Failed to load the post."}
                </p>
              </RapidLog>
            </PageFrame>
          );
        },
      },
    ),
  );
}

export default function PostPage(props: PageProps<"/posts/[slug]">) {
  return (
    <Suspense
      fallback={
        <PageFrame title="posts">
          <RapidLog>
            <p>Loading post...</p>
          </RapidLog>
        </PageFrame>
      }
    >
      <PostPageContent params={props.params} />
    </Suspense>
  );
}
