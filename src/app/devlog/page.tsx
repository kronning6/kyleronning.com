import { DevlogList } from "~/components/devlog-list";
import { PageFrame } from "~/components/page-frame";
import { RapidLog } from "~/components/rapid-log";
import {
  getDevlogEntries,
  InvalidNotionRequestError,
  MissingNotionTokenError,
  MissingNotionWebsitePageIdError,
} from "~/lib/notion";

export default async function DevlogPage() {
  try {
    const { entries } = await getDevlogEntries();

    return (
      <PageFrame title="devlog">
        <DevlogList entries={entries} emptyMessage="No devlog entries found." />
      </PageFrame>
    );
  } catch (error) {
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
                : "Failed to load devlog entries."}
          </p>
        </RapidLog>
      </PageFrame>
    );
  }
}
