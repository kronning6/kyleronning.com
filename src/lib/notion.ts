import "server-only";

import {
  Client,
  collectPaginatedAPI,
  isFullBlock,
  isFullDataSource,
  isFullPage,
} from "@notionhq/client";
import type {
  BlockObjectResponse,
  DataSourceObjectResponse,
  PageObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { Data } from "effect";
import { cacheLife } from "next/cache";
import { env } from "~/env/server";

const NOTION_DATE_PROPERTY = "Date";
const NOTION_STATUS_PROPERTY = "Status";

let notionClient: Client | null = null;

function getNotionClient() {
  if (!env.NOTION_TOKEN) {
    throw new MissingNotionTokenError({
      message: "Set NOTION_TOKEN to load Notion content.",
    });
  }

  notionClient ??= new Client({
    auth: env.NOTION_TOKEN,
  });

  return notionClient;
}

export class InvalidNotionRequestError extends Data.TaggedError(
  "InvalidNotionRequestError",
)<{
  message: string;
}> {}

export class MissingNotionTokenError extends Data.TaggedError(
  "MissingNotionTokenError",
)<{
  message: string;
}> {}

export class MissingNotionWebsitePageIdError extends Data.TaggedError(
  "MissingNotionWebsitePageIdError",
)<{
  message: string;
}> {}

export type NotionBlockNode = {
  block: BlockObjectResponse;
  children: NotionBlockNode[];
};

export type NotionEntry = {
  id: string;
  title: string;
  slug: string;
  date: string | null;
};

export type NotionEntryWithBlocks = NotionEntry & {
  blocks: NotionBlockNode[];
};

function getPlainText(richText: RichTextItemResponse[]) {
  return richText
    .map((item) => item.plain_text)
    .join("")
    .trim();
}

function getPageTitle(page: PageObjectResponse) {
  const titleProperty = Object.values(page.properties).find(
    (property) => property.type === "title",
  );

  return titleProperty ? getPlainText(titleProperty.title) : "Untitled";
}

function getPageDate(page: PageObjectResponse) {
  const property = page.properties[NOTION_DATE_PROPERTY];

  return property?.type === "date" ? (property.date?.start ?? null) : null;
}

function toKebabCase(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeEntry(page: PageObjectResponse): NotionEntry {
  const title = getPageTitle(page);

  return {
    id: page.id,
    title,
    slug: toKebabCase(title),
    date: getPageDate(page),
  };
}

function ensureUniqueSlugs(entries: NotionEntry[], collectionName: string) {
  const entriesBySlug = new Map<string, NotionEntry[]>();

  for (const entry of entries) {
    entriesBySlug.set(entry.slug, [
      ...(entriesBySlug.get(entry.slug) ?? []),
      entry,
    ]);
  }

  const duplicates = [...entriesBySlug.entries()].filter(
    ([, matchingEntries]) => matchingEntries.length > 1,
  );

  if (duplicates.length === 0) {
    return;
  }

  const duplicateSummary = duplicates
    .map(
      ([slug, matchingEntries]) =>
        `${slug}: ${matchingEntries.map((entry) => entry.title).join(", ")}`,
    )
    .join("; ");

  throw new Error(
    `Duplicate ${collectionName} slugs found. Update the Notion titles to produce unique URLs. ${duplicateSummary}`,
  );
}

function hasPageParent(
  value: { parent: PageObjectResponse["parent"] },
  pageId: string,
) {
  return value.parent.type === "page_id" && value.parent.page_id === pageId;
}

function hasDataSourcePageParent(
  value: Pick<DataSourceObjectResponse, "database_parent">,
  pageId: string,
) {
  return (
    value.database_parent.type === "page_id" &&
    value.database_parent.page_id === pageId
  );
}

async function findChildPageByTitle(parentPageId: string, title: string) {
  const response = await getNotionClient().search({
    query: title,
    filter: { property: "object", value: "page" },
  });

  return (
    response.results.find(
      (result): result is PageObjectResponse =>
        isFullPage(result) &&
        hasPageParent(result, parentPageId) &&
        getPageTitle(result) === title,
    ) ?? null
  );
}

async function findChildDataSourceByTitle(parentPageId: string, title: string) {
  const response = await getNotionClient().search({
    query: title,
    filter: { property: "object", value: "data_source" },
  });

  return (
    response.results.find(
      (result): result is DataSourceObjectResponse =>
        isFullDataSource(result) &&
        hasDataSourcePageParent(result, parentPageId) &&
        getPlainText(result.title) === title,
    ) ?? null
  );
}

async function getWebsiteRootPage() {
  "use cache";
  cacheLife("notion");

  if (!env.NOTION_WEBSITE_PAGE_ID) {
    throw new MissingNotionWebsitePageIdError({
      message:
        "Set NOTION_WEBSITE_PAGE_ID to load website content from Notion.",
    });
  }

  const rootPageResponse = await getNotionClient().pages.retrieve({
    page_id: env.NOTION_WEBSITE_PAGE_ID,
  });

  if (!isFullPage(rootPageResponse)) {
    throw new InvalidNotionRequestError({
      message: "Couldn't load the configured Notion website root page.",
    });
  }

  return rootPageResponse;
}

async function getAboutPage() {
  "use cache";
  cacheLife("notion");

  const rootPage = await getWebsiteRootPage();
  const aboutPage = await findChildPageByTitle(rootPage.id, "About");

  if (!aboutPage) {
    throw new InvalidNotionRequestError({
      message: 'Couldn\'t find the child page "About" in Notion.',
    });
  }

  return aboutPage;
}

async function getDevlogDataSource() {
  "use cache";
  cacheLife("notion");

  const rootPage = await getWebsiteRootPage();
  const devlogDataSource = await findChildDataSourceByTitle(
    rootPage.id,
    "Devlog",
  );

  if (!devlogDataSource) {
    throw new InvalidNotionRequestError({
      message: 'Couldn\'t find the child data source "Devlog" in Notion.',
    });
  }

  return devlogDataSource;
}

async function getPostsDataSource() {
  "use cache";
  cacheLife("notion");

  const rootPage = await getWebsiteRootPage();
  const postsDataSource = await findChildDataSourceByTitle(
    rootPage.id,
    "Posts",
  );

  if (!postsDataSource) {
    throw new InvalidNotionRequestError({
      message: 'Couldn\'t find the child data source "Posts" in Notion.',
    });
  }

  return postsDataSource;
}

async function getBlockChildren(blockId: string): Promise<NotionBlockNode[]> {
  const results = await collectPaginatedAPI(
    getNotionClient().blocks.children.list,
    {
      block_id: blockId,
    },
  );

  const blocks = results.filter(isFullBlock);

  return Promise.all(
    blocks.map(async (block) => ({
      block,
      children: block.has_children ? await getBlockChildren(block.id) : [],
    })),
  );
}

async function getPageBlocks(pageId: string) {
  "use cache";
  cacheLife("notion");

  return getBlockChildren(pageId);
}

export async function getAboutContent() {
  "use cache";
  cacheLife("notion");

  const aboutPage = await getAboutPage();

  return {
    blocks: await getBlockChildren(aboutPage.id),
  };
}

async function queryAllDataSourceEntries(dataSourceId: string) {
  "use cache";
  cacheLife("notion");

  const results = await collectPaginatedAPI(
    getNotionClient().dataSources.query,
    {
      data_source_id: dataSourceId,
      filter: {
        property: NOTION_STATUS_PROPERTY,
        status: {
          equals: "Published",
        },
      },
      sorts: [
        {
          property: NOTION_DATE_PROPERTY,
          direction: "descending",
        },
      ],
    },
  );

  return results
    .filter(isFullPage)
    .filter((page) => getPageDate(page) !== null);
}

export async function getDevlogEntries() {
  "use cache";
  cacheLife("notion");

  const devlogDataSource = await getDevlogDataSource();
  const entries = await queryAllDataSourceEntries(devlogDataSource.id);
  const normalizedEntries = entries.map(normalizeEntry);

  ensureUniqueSlugs(normalizedEntries, "devlog");

  return {
    entries: normalizedEntries,
  };
}

export async function getDevlogBySlug(slug: string) {
  "use cache";
  cacheLife("notion");

  const devlogDataSource = await getDevlogDataSource();
  const entries = await queryAllDataSourceEntries(devlogDataSource.id);
  const entry = entries.find(
    (candidate) => normalizeEntry(candidate).slug === slug,
  );

  if (!entry) {
    return null;
  }

  return {
    ...normalizeEntry(entry),
    blocks: await getPageBlocks(entry.id),
  } satisfies NotionEntryWithBlocks;
}

export async function getPostEntries() {
  "use cache";
  cacheLife("notion");

  const postsDataSource = await getPostsDataSource();
  const entries = await queryAllDataSourceEntries(postsDataSource.id);
  const normalizedEntries = entries.map(normalizeEntry);

  ensureUniqueSlugs(normalizedEntries, "post");

  return {
    entries: normalizedEntries,
  };
}

export async function getPostBySlug(slug: string) {
  "use cache";
  cacheLife("notion");

  const postsDataSource = await getPostsDataSource();
  const entries = await queryAllDataSourceEntries(postsDataSource.id);
  const entry = entries.find(
    (candidate) => normalizeEntry(candidate).slug === slug,
  );

  if (!entry) {
    return null;
  }

  return {
    ...normalizeEntry(entry),
    blocks: await getPageBlocks(entry.id),
  } satisfies NotionEntryWithBlocks;
}
