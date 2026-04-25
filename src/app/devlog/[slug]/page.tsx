import { notFound, unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { NotionBlocks } from "~/components/notion-blocks";
import { PageFrame } from "~/components/page-frame";
import { RapidLog } from "~/components/rapid-log";
import {
  getDevlogBySlug,
  getDevlogEntries,
  InvalidNotionRequestError,
  MissingNotionTokenError,
  MissingNotionWebsitePageIdError,
} from "~/lib/notion";
import { formatDate } from "~/lib/utils";

export async function generateStaticParams() {
  try {
    const { entries } = await getDevlogEntries();

    return entries.map((entry) => ({
      slug: entry.slug,
    }));
  } catch (error) {
    if (
      error instanceof InvalidNotionRequestError ||
      error instanceof MissingNotionTokenError ||
      error instanceof MissingNotionWebsitePageIdError
    ) {
      return [];
    }

    throw error;
  }
}

async function DevlogEntryPageContent({
  params,
}: {
  params: PageProps<"/devlog/[slug]">["params"];
}) {
  const { slug } = await params;

  try {
    const entry = await getDevlogBySlug(slug);

    if (!entry) {
      notFound();
    }

    return (
      <PageFrame title={entry.title}>
        {entry.date ? (
          <p className="m-0 text-sm opacity-70">{formatDate(entry.date)}</p>
        ) : null}
        <NotionBlocks blocks={entry.blocks} />
      </PageFrame>
    );
  } catch (error) {
    unstable_rethrow(error);

    return (
      <PageFrame title="devlog">
        <RapidLog>
          <p>
            {error instanceof InvalidNotionRequestError ||
            error instanceof MissingNotionTokenError ||
            error instanceof MissingNotionWebsitePageIdError
              ? error.message
              : error instanceof Error
                ? error.message
                : "Failed to load the devlog entry."}
          </p>
        </RapidLog>
      </PageFrame>
    );
  }
}

export default function DevlogEntryPage(props: PageProps<"/devlog/[slug]">) {
  return (
    <Suspense
      fallback={
        <PageFrame title="devlog">
          <RapidLog>
            <p>Loading devlog entry...</p>
          </RapidLog>
        </PageFrame>
      }
    >
      <DevlogEntryPageContent params={props.params} />
    </Suspense>
  );
}
