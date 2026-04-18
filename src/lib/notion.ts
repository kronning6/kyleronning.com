import "server-only";

import { Client } from "@notionhq/client";
import { Data, Effect } from "effect";
import { env } from "~/env/server";

export const notion = new Client({
  auth: env.NOTION_TOKEN,
});

export class InvalidNotionRequestError extends Data.TaggedError(
  "InvalidNotionRequestError",
)<{
  message: string;
}> {}

export class NotionRequestError extends Data.TaggedError("NotionRequestError")<{
  message: string;
  cause: unknown;
}> {}

function toMessage(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback;
}

export function getNotionPage(pageId: string) {
  return Effect.tryPromise({
    try: () => notion.pages.retrieve({ page_id: pageId }),
    catch: (cause) =>
      new NotionRequestError({
        message: toMessage(cause, "Failed to retrieve Notion page."),
        cause,
      }),
  });
}

export function queryNotionDataSource(dataSourceId: string) {
  return Effect.tryPromise({
    try: () =>
      notion.dataSources.query({
        data_source_id: dataSourceId,
      }),
    catch: (cause) =>
      new NotionRequestError({
        message: toMessage(cause, "Failed to query Notion data source."),
        cause,
      }),
  });
}
