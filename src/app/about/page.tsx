import { Effect } from "effect";
import { cacheLife } from "next/cache";
import { NotionBlocks } from "~/components/notion-blocks";
import { PageFrame } from "~/components/page-frame";
import { RapidLog } from "~/components/rapid-log";
import {
  getAboutContent,
  InvalidNotionRequestError,
  MissingNotionTokenError,
  MissingNotionWebsitePageIdError,
} from "~/lib/notion";

function getErrorMessage(
  error:
    | InvalidNotionRequestError
    | MissingNotionTokenError
    | MissingNotionWebsitePageIdError,
) {
  return error.message;
}

export default async function AboutPage() {
  "use cache";
  cacheLife("notion");

  return Effect.runPromise(
    Effect.match(
      Effect.tryPromise({
        try: () => getAboutContent(),
        catch: (cause) => cause,
      }),
      {
        onSuccess: ({ blocks }) => (
          <PageFrame title="about">
            <NotionBlocks blocks={blocks} />
          </PageFrame>
        ),
        onFailure: (error) => {
          if (
            error instanceof InvalidNotionRequestError ||
            error instanceof MissingNotionTokenError ||
            error instanceof MissingNotionWebsitePageIdError
          ) {
            return (
              <PageFrame title="about">
                <RapidLog>
                  <p>{getErrorMessage(error)}</p>
                </RapidLog>
              </PageFrame>
            );
          }

          return (
            <PageFrame title="about">
              <RapidLog>
                <p>
                  {error instanceof Error
                    ? error.message
                    : "Failed to load about content."}
                </p>
              </RapidLog>
            </PageFrame>
          );
        },
      },
    ),
  );
}
