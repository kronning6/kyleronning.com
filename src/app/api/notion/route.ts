import { Effect, pipe } from "effect";
import { NextResponse } from "next/server";
import {
  getNotionPage,
  InvalidNotionRequestError,
  type NotionRequestError,
  queryNotionDataSource,
} from "~/lib/notion";

export const revalidate = 300;

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get("pageId");
  const dataSourceId =
    searchParams.get("dataSourceId") ?? searchParams.get("databaseId");

  const responseEffect: Effect.Effect<
    Response,
    InvalidNotionRequestError | NotionRequestError
  > = pageId
    ? pipe(
        getNotionPage(pageId),
        Effect.map((data) =>
          NextResponse.json({
            object: "page",
            data,
          }),
        ),
      )
    : dataSourceId
      ? pipe(
          queryNotionDataSource(dataSourceId),
          Effect.map((data) =>
            NextResponse.json({
              object: "data_source",
              data,
            }),
          ),
        )
      : Effect.fail(
          new InvalidNotionRequestError({
            message: "Provide either pageId or dataSourceId.",
          }),
        );

  const response: Response = await Effect.runPromise(
    Effect.match(responseEffect, {
      onSuccess: (response) => response,
      onFailure: (error) =>
        NextResponse.json(
          { error: error.message },
          {
            status: error._tag === "InvalidNotionRequestError" ? 400 : 500,
          },
        ),
    }),
  );

  return response;
}
