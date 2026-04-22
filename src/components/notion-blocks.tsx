/* biome-ignore-all lint/security/noDangerouslySetInnerHtml: Shiki generates highlighted HTML server-side from code text. */
import type {
  BlockObjectResponse,
  PageIconResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";
import type { ReactNode } from "react";
import { highlightCodeBlock } from "~/lib/code-highlighting";
import type { NotionBlockNode } from "~/lib/notion";

type ListItemBlock = Extract<
  BlockObjectResponse,
  {
    type: "bulleted_list_item" | "numbered_list_item";
  }
>;

type ListItemNode = Omit<NotionBlockNode, "block"> & {
  block: ListItemBlock;
};

type ToDoBlock = Extract<
  BlockObjectResponse,
  {
    type: "to_do";
  }
>;

type HeadingBlock = Extract<
  BlockObjectResponse,
  {
    type: "heading_1" | "heading_2" | "heading_3" | "heading_4";
  }
>;

type NotionRichTextProps = {
  richText: RichTextItemResponse[];
};

function NotionRichText({ richText }: NotionRichTextProps) {
  return richText.map((item, index) => {
    const className = [
      item.annotations.bold ? "font-semibold" : null,
      item.annotations.italic ? "italic" : null,
      item.annotations.strikethrough ? "line-through" : null,
      item.annotations.underline ? "underline" : null,
      item.annotations.code
        ? "rounded bg-black/5 px-1 py-0.5 font-mono text-[0.9em] dark:bg-white/10"
        : null,
    ]
      .filter(Boolean)
      .join(" ");

    const content = item.href ? (
      <a href={item.href} className="underline underline-offset-2">
        {item.plain_text}
      </a>
    ) : (
      item.plain_text
    );

    return (
      <span key={`${item.plain_text}-${index}`} className={className}>
        {content}
      </span>
    );
  });
}

async function renderNestedChildren(children: NotionBlockNode[]) {
  if (children.length === 0) {
    return null;
  }

  return <div className="mt-3">{await renderBlockNodes(children)}</div>;
}

function renderAlignedMarker(content: ReactNode, className = "") {
  return (
    <span
      aria-hidden="true"
      className={`relative mt-[0.78em] inline-flex h-0 w-5 shrink-0 -translate-y-1/2 items-center justify-center ${className}`}
    >
      {content}
    </span>
  );
}

function getPlainText(richText: RichTextItemResponse[]) {
  return richText.map((item) => item.plain_text).join("");
}

function renderCalloutIcon(icon: PageIconResponse | null) {
  if (!icon) {
    return null;
  }

  if (icon.type === "emoji") {
    return icon.emoji;
  }

  if (icon.type === "custom_emoji") {
    return (
      // biome-ignore lint/performance/noImgElement: Notion custom emoji icons are tiny remote assets.
      <img
        src={icon.custom_emoji.url}
        alt={icon.custom_emoji.name}
        className="size-5"
      />
    );
  }

  return null;
}

function renderToDoMarker(block: ToDoBlock) {
  return renderAlignedMarker(
    <>
      <span className="size-1 rounded-full bg-current/75" />
      {block.to_do.checked ? (
        <>
          <span className="absolute h-px w-3 rotate-45 bg-current" />
          <span className="absolute h-px w-3 -rotate-45 bg-current" />
        </>
      ) : null}
    </>,
  );
}

async function renderListItem(node: ListItemNode, index: number) {
  const richText =
    node.block.type === "bulleted_list_item"
      ? node.block.bulleted_list_item.rich_text
      : node.block.numbered_list_item.rich_text;

  if (node.block.type === "bulleted_list_item") {
    return (
      <li
        key={node.block.id}
        className="grid grid-cols-[auto_1fr] items-start gap-3"
      >
        {renderAlignedMarker(<span className="h-px w-2 bg-current/75" />)}
        <div>
          <div className="whitespace-pre-wrap">
            <NotionRichText richText={richText} />
          </div>
          {await renderNestedChildren(node.children)}
        </div>
      </li>
    );
  }

  return (
    <li
      key={node.block.id}
      className="grid grid-cols-[auto_1fr] items-start gap-2"
    >
      {renderAlignedMarker(
        <span className="w-5 text-right font-mono tabular-nums opacity-80">
          {index + 1}.
        </span>,
        "w-6 justify-end",
      )}
      <div className="whitespace-pre-wrap">
        <NotionRichText richText={richText} />
        {await renderNestedChildren(node.children)}
      </div>
    </li>
  );
}

async function renderSimpleBlock(
  node: NotionBlockNode,
  className: string,
  richText: RichTextItemResponse[],
) {
  return (
    <div key={node.block.id} className={className}>
      <NotionRichText richText={richText} />
      {await renderNestedChildren(node.children)}
    </div>
  );
}

function getHeadingContent(block: HeadingBlock) {
  switch (block.type) {
    case "heading_1":
      return block.heading_1;
    case "heading_2":
      return block.heading_2;
    case "heading_3":
      return block.heading_3;
    case "heading_4":
      return block.heading_4;
  }
}

type ToggleSummaryProps = {
  className?: string;
  children: ReactNode;
};

function ToggleSummary({ className = "", children }: ToggleSummaryProps) {
  return (
    <summary
      className={[
        "flex cursor-pointer list-none items-baseline gap-2.5 [&::-webkit-details-marker]:hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        aria-hidden="true"
        className="mt-[0.18em] inline-block h-2 w-2 shrink-0 rotate-[-45deg] border-r-[1.5px] border-b-[1.5px] border-current transition-transform group-open:rotate-[45deg]"
      />
      <span>{children}</span>
    </summary>
  );
}

async function renderHeadingBlock(node: NotionBlockNode, block: HeadingBlock) {
  const heading = getHeadingContent(block);
  const className =
    block.type === "heading_1"
      ? "m-0 text-3xl leading-tight font-normal"
      : block.type === "heading_2"
        ? "m-0 text-2xl leading-tight font-normal"
        : block.type === "heading_3"
          ? "m-0 text-xl leading-tight font-normal"
          : "m-0 text-lg leading-tight font-normal";

  if (!heading.is_toggleable) {
    return renderSimpleBlock(node, className, heading.rich_text);
  }

  return (
    <details key={block.id} className="group grid gap-3">
      <ToggleSummary className={className}>
        <NotionRichText richText={heading.rich_text} />
      </ToggleSummary>
      {node.children.length > 0 ? (
        <div className="pl-5">{await renderBlockNodes(node.children)}</div>
      ) : null}
    </details>
  );
}

function getBlockDebugSummary(block: BlockObjectResponse) {
  switch (block.type) {
    case "paragraph":
      return {
        text: getPlainText(block.paragraph.rich_text),
      };
    case "heading_1":
    case "heading_2":
    case "heading_3":
    case "heading_4": {
      const heading = getHeadingContent(block);

      return {
        text: getPlainText(heading.rich_text),
        isToggleable: heading.is_toggleable,
      };
    }
    case "toggle":
      return {
        text: getPlainText(block.toggle.rich_text),
      };
    case "to_do":
      return {
        text: getPlainText(block.to_do.rich_text),
        checked: block.to_do.checked,
      };
    case "bulleted_list_item":
      return {
        text: getPlainText(block.bulleted_list_item.rich_text),
      };
    case "numbered_list_item":
      return {
        text: getPlainText(block.numbered_list_item.rich_text),
      };
    case "quote":
      return {
        text: getPlainText(block.quote.rich_text),
      };
    case "callout":
      return {
        text: getPlainText(block.callout.rich_text),
        icon: block.callout.icon?.type ?? null,
      };
    case "bookmark":
      return { url: block.bookmark.url };
    case "image":
      return {
        url:
          block.image.type === "external"
            ? block.image.external.url
            : block.image.file.url,
        caption: getPlainText(block.image.caption),
      };
    default:
      return null;
  }
}

async function renderUnsupportedBlock(node: NotionBlockNode) {
  const summary = getBlockDebugSummary(node.block);

  return (
    <details
      key={node.block.id}
      className="rounded border border-current/20 bg-black/5 p-3 text-sm dark:bg-white/5"
    >
      <summary className="cursor-pointer font-medium">
        Unsupported Notion block: {node.block.type}
      </summary>
      <div className="mt-3 grid gap-2">
        <div className="grid gap-1 text-xs leading-5 opacity-80">
          <div>
            <span className="font-medium">id:</span> {node.block.id}
          </div>
          <div>
            <span className="font-medium">has children:</span>{" "}
            {node.children.length > 0 ? "yes" : "no"}
          </div>
          {summary ? (
            <pre className="m-0 overflow-x-auto whitespace-pre-wrap break-words rounded border border-current/15 p-2 text-xs leading-5">
              {JSON.stringify(summary, null, 2)}
            </pre>
          ) : null}
        </div>
        <pre className="m-0 overflow-x-auto whitespace-pre-wrap break-words rounded border border-current/15 p-2 text-xs leading-5">
          {JSON.stringify(node.block, null, 2)}
        </pre>
        {await renderNestedChildren(node.children)}
      </div>
    </details>
  );
}

async function renderBlockNode(node: NotionBlockNode): Promise<ReactNode> {
  const block = node.block;

  switch (block.type) {
    case "paragraph":
      return renderSimpleBlock(
        node,
        "m-0 whitespace-pre-wrap leading-7",
        block.paragraph.rich_text,
      );

    case "heading_1":
      return renderHeadingBlock(node, block);

    case "heading_2":
      return renderHeadingBlock(node, block);

    case "heading_3":
      return renderHeadingBlock(node, block);

    case "heading_4":
      return renderHeadingBlock(node, block);

    case "quote":
      return (
        <blockquote
          key={block.id}
          className="m-0 border-l-2 border-black pl-4 italic"
        >
          <div className="whitespace-pre-wrap">
            <NotionRichText richText={block.quote.rich_text} />
          </div>
          {await renderNestedChildren(node.children)}
        </blockquote>
      );

    case "callout":
      return (
        <div
          key={block.id}
          className="grid grid-cols-[auto_1fr] items-start gap-3 rounded border border-current/5 bg-current/5 px-4 py-3"
        >
          <span className="pt-0.5 text-lg leading-none">
            {renderCalloutIcon(block.callout.icon)}
          </span>
          <div className="whitespace-pre-wrap">
            <NotionRichText richText={block.callout.rich_text} />
            {await renderNestedChildren(node.children)}
          </div>
        </div>
      );

    case "to_do": {
      return (
        <div key={block.id} className="flex items-start gap-3">
          {renderToDoMarker(block)}
          <div className="min-w-0 whitespace-pre-wrap">
            <NotionRichText richText={block.to_do.rich_text} />
            {await renderNestedChildren(node.children)}
          </div>
        </div>
      );
    }

    case "toggle":
      return (
        <details key={block.id} className="group grid gap-3">
          <ToggleSummary className="whitespace-pre-wrap">
            <NotionRichText richText={block.toggle.rich_text} />
          </ToggleSummary>
          {node.children.length > 0 ? (
            <div className="pl-5">{await renderBlockNodes(node.children)}</div>
          ) : null}
        </details>
      );

    case "code": {
      const highlightedCode = await highlightCodeBlock(
        getPlainText(block.code.rich_text),
        block.code.language,
      );

      return (
        <figure key={block.id} className="m-0 grid gap-2">
          <div
            className="[&_code]:grid [&_pre]:m-0 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:border [&_pre]:border-current/20 [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:leading-6 [&_.line]:block"
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
          <style>{`
            .shiki .line:empty::before {
              content: "\u200B";
            }

            @media (prefers-color-scheme: dark) {
              .shiki.shiki-themes,
              .shiki.shiki-themes span {
                color: var(--shiki-dark) !important;
                background-color: var(--shiki-dark-bg) !important;
              }
            }
          `}</style>
          {block.code.caption.length > 0 ? (
            <figcaption className="text-sm opacity-70">
              <NotionRichText richText={block.code.caption} />
            </figcaption>
          ) : null}
        </figure>
      );
    }

    case "divider":
      return <hr key={block.id} className="border-current/20" />;

    case "image": {
      const source =
        block.image.type === "external"
          ? block.image.external.url
          : block.image.file.url;

      return (
        <figure key={block.id} className="grid gap-2">
          {/* biome-ignore lint/performance/noImgElement: Notion block images are remote and size is not known ahead of time. */}
          <img
            src={source}
            alt=""
            className="h-auto max-h-[300px] w-auto max-w-full rounded"
          />
          {block.image.caption.length > 0 ? (
            <figcaption className="text-sm opacity-70">
              <NotionRichText richText={block.image.caption} />
            </figcaption>
          ) : null}
        </figure>
      );
    }

    case "bookmark":
      return (
        <a
          key={block.id}
          href={block.bookmark.url}
          className="underline underline-offset-2"
        >
          {block.bookmark.url}
        </a>
      );

    case "link_to_page": {
      const label =
        block.link_to_page.type === "page_id"
          ? `Linked page: ${block.link_to_page.page_id}`
          : block.link_to_page.type === "database_id"
            ? `Linked database: ${block.link_to_page.database_id}`
            : `Linked comment: ${block.link_to_page.comment_id}`;

      return <div key={block.id}>{label}</div>;
    }

    default:
      return await renderUnsupportedBlock(node);
  }
}

async function renderBlockNodes(nodes: NotionBlockNode[]) {
  const elements: ReactNode[] = [];

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];

    if (
      node.block.type === "bulleted_list_item" ||
      node.block.type === "numbered_list_item"
    ) {
      const listType = node.block.type;
      const listItems: NotionBlockNode[] = [node];

      while (
        index + 1 < nodes.length &&
        nodes[index + 1]?.block.type === listType
      ) {
        index += 1;

        const nextNode = nodes[index];

        if (nextNode) {
          listItems.push(nextNode);
        }
      }

      elements.push(
        listType === "bulleted_list_item" ? (
          <ul key={node.block.id} className="m-0 grid gap-2 list-none pl-0">
            {
              await Promise.all(
                listItems.map((item, itemIndex) =>
                  renderListItem(item as ListItemNode, itemIndex),
                ),
              )
            }
          </ul>
        ) : (
          <ol key={node.block.id} className="m-0 grid gap-2 list-none pl-0">
            {
              await Promise.all(
                listItems.map((item, itemIndex) =>
                  renderListItem(item as ListItemNode, itemIndex),
                ),
              )
            }
          </ol>
        ),
      );

      continue;
    }

    elements.push(await renderBlockNode(node));
  }

  return <div className="grid gap-4">{elements}</div>;
}

type NotionBlocksProps = {
  blocks: NotionBlockNode[];
};

export async function NotionBlocks({ blocks }: NotionBlocksProps) {
  return renderBlockNodes(blocks);
}
