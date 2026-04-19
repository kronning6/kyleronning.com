import type {
  BlockObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";
import type { ReactNode } from "react";
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

function renderNestedChildren(children: NotionBlockNode[]) {
  if (children.length === 0) {
    return null;
  }

  return <div className="mt-3">{renderBlockNodes(children)}</div>;
}

function renderListItem(node: ListItemNode) {
  const richText =
    node.block.type === "bulleted_list_item"
      ? node.block.bulleted_list_item.rich_text
      : node.block.numbered_list_item.rich_text;

  return (
    <li key={node.block.id} className="ml-5 pl-1">
      <div className="whitespace-pre-wrap">
        <NotionRichText richText={richText} />
      </div>
      {renderNestedChildren(node.children)}
    </li>
  );
}

function renderSimpleBlock(
  node: NotionBlockNode,
  className: string,
  richText: RichTextItemResponse[],
) {
  return (
    <div key={node.block.id} className={className}>
      <NotionRichText richText={richText} />
      {renderNestedChildren(node.children)}
    </div>
  );
}

function renderBlockNode(node: NotionBlockNode): ReactNode {
  const block = node.block;

  switch (block.type) {
    case "paragraph":
      return renderSimpleBlock(
        node,
        "m-0 whitespace-pre-wrap leading-7",
        block.paragraph.rich_text,
      );

    case "heading_1":
      return renderSimpleBlock(
        node,
        "m-0 text-3xl leading-tight font-normal",
        block.heading_1.rich_text,
      );

    case "heading_2":
      return renderSimpleBlock(
        node,
        "m-0 text-2xl leading-tight font-normal",
        block.heading_2.rich_text,
      );

    case "heading_3":
      return renderSimpleBlock(
        node,
        "m-0 text-xl leading-tight font-normal",
        block.heading_3.rich_text,
      );

    case "quote":
      return (
        <blockquote
          key={block.id}
          className="m-0 border-l border-current/30 pl-4 italic"
        >
          <div className="whitespace-pre-wrap">
            <NotionRichText richText={block.quote.rich_text} />
          </div>
          {renderNestedChildren(node.children)}
        </blockquote>
      );

    case "callout":
      return (
        <div
          key={block.id}
          className="rounded border border-current/20 px-4 py-3"
        >
          <div className="whitespace-pre-wrap">
            <NotionRichText richText={block.callout.rich_text} />
          </div>
          {renderNestedChildren(node.children)}
        </div>
      );

    case "to_do":
      return (
        <div key={block.id} className="flex items-start gap-3">
          <span aria-hidden="true" className="pt-0.5">
            {block.to_do.checked ? "[x]" : "[ ]"}
          </span>
          <div className="min-w-0 whitespace-pre-wrap">
            <NotionRichText richText={block.to_do.rich_text} />
            {renderNestedChildren(node.children)}
          </div>
        </div>
      );

    case "toggle":
      return (
        <details key={block.id} className="grid gap-3">
          <summary className="cursor-pointer whitespace-pre-wrap">
            <NotionRichText richText={block.toggle.rich_text} />
          </summary>
          {renderNestedChildren(node.children)}
        </details>
      );

    case "code":
      return (
        <pre
          key={block.id}
          className="m-0 overflow-x-auto rounded border border-current/20 bg-black/5 p-4 text-sm leading-6 dark:bg-white/5"
        >
          <code>
            <NotionRichText richText={block.code.rich_text} />
          </code>
        </pre>
      );

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
          <img src={source} alt="" className="h-auto max-w-full rounded" />
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
      return null;
  }
}

function renderBlockNodes(nodes: NotionBlockNode[]) {
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
          <ul key={node.block.id} className="m-0 grid gap-2 pl-5 list-disc">
            {listItems.map((item) => renderListItem(item as ListItemNode))}
          </ul>
        ) : (
          <ol key={node.block.id} className="m-0 grid gap-2 pl-5 list-decimal">
            {listItems.map((item) => renderListItem(item as ListItemNode))}
          </ol>
        ),
      );

      continue;
    }

    elements.push(renderBlockNode(node));
  }

  return <div className="grid gap-4">{elements}</div>;
}

type NotionBlocksProps = {
  blocks: NotionBlockNode[];
};

export function NotionBlocks({ blocks }: NotionBlocksProps) {
  return renderBlockNodes(blocks);
}
