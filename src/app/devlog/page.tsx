import { Effect } from "effect";
import { Suspense } from "react";
import { DevlogList } from "~/components/devlog-list";
import { PageFrame } from "~/components/page-frame";
import { PaginationNav } from "~/components/pagination-nav";
import { RapidLog } from "~/components/rapid-log";
import {
  getDevlogEntries,
  InvalidNotionRequestError,
  MissingNotionTokenError,
  MissingNotionWebsitePageIdError,
} from "~/lib/notion";

function parsePageNumber(value: string | string[] | undefined) {
  const page = Number(Array.isArray(value) ? value[0] : (value ?? "1"));

  return Number.isInteger(page) && page > 0 ? page : 1;
}

async function DevlogPageContent({
  searchParams,
}: {
  searchParams: PageProps<"/devlog">["searchParams"];
}) {
  const resolvedSearchParams = await searchParams;

  return Effect.runPromise(
    Effect.match(
      Effect.tryPromise({
        try: () => getDevlogEntries(parsePageNumber(resolvedSearchParams.page)),
        catch: (cause) => cause,
      }),
      {
        onSuccess: ({ entries, currentPage, totalPages }) => (
          <>
            <DevlogList
              entries={entries}
              emptyMessage="No devlog entries found."
            />
            <PaginationNav
              basePath="/devlog"
              currentPage={currentPage}
              totalPages={totalPages}
            />
          </>
        ),
        onFailure: (error) => (
          <RapidLog>
            <p>
              {error instanceof InvalidNotionRequestError ||
              error instanceof MissingNotionTokenError ||
              error instanceof MissingNotionWebsitePageIdError
                ? error.message
                : error instanceof Error
                  ? error.message
                  : "Failed to load devlog entries."}
            </p>
          </RapidLog>
        ),
      },
    ),
  );
}

export default function DevlogPage(props: PageProps<"/devlog">) {
  return (
    <PageFrame title="devlog">
      <Suspense
        fallback={
          <RapidLog>
            <p>Loading devlog...</p>
          </RapidLog>
        }
      >
        <DevlogPageContent searchParams={props.searchParams} />
      </Suspense>
    </PageFrame>
  );
}
