import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "~/env/server";

const DEPLOY_TRIGGER_EVENT_TYPES = new Set([
  "page.properties_updated",
  "page.content_updated",
]);

type NotionWebhookVerificationPayload = {
  verification_token: string;
};

type NotionWebhookEvent = {
  id: string;
  type: string;
  entity: {
    id: string;
    type: string;
  };
};

function normalizeNotionId(id: string) {
  return id.replaceAll("-", "").toLowerCase();
}

function isVerificationPayload(
  payload: unknown,
): payload is NotionWebhookVerificationPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "verification_token" in payload &&
    typeof payload.verification_token === "string"
  );
}

function isNotionWebhookEvent(payload: unknown): payload is NotionWebhookEvent {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "id" in payload &&
    typeof payload.id === "string" &&
    "type" in payload &&
    typeof payload.type === "string" &&
    "entity" in payload &&
    typeof payload.entity === "object" &&
    payload.entity !== null &&
    "id" in payload.entity &&
    typeof payload.entity.id === "string" &&
    "type" in payload.entity &&
    typeof payload.entity.type === "string"
  );
}

function isTrustedNotionRequest(body: string, signature: string | null) {
  if (!env.NOTION_WEBHOOK_VERIFICATION_TOKEN || !signature) {
    return false;
  }

  const expectedSignature = `sha256=${createHmac(
    "sha256",
    env.NOTION_WEBHOOK_VERIFICATION_TOKEN,
  )
    .update(body)
    .digest("hex")}`;

  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(signature);

  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

async function triggerVercelDeployHook() {
  if (!env.VERCEL_DEPLOY_HOOK_URL) {
    return {
      ok: false,
      status: 500,
      message: "Set VERCEL_DEPLOY_HOOK_URL to trigger redeploys.",
    };
  }

  const response = await fetch(env.VERCEL_DEPLOY_HOOK_URL, {
    method: "POST",
  });

  return {
    ok: response.ok,
    status: response.status,
    message: response.ok
      ? "Deploy hook triggered."
      : "Vercel deploy hook request failed.",
  };
}

export async function POST(request: Request) {
  const body = await request.text();

  let payload: unknown;

  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  if (isVerificationPayload(payload)) {
    console.info("Notion webhook verification token received.");

    return NextResponse.json({ message: "Verification token received." });
  }

  if (
    !isTrustedNotionRequest(body, request.headers.get("x-notion-signature"))
  ) {
    return NextResponse.json(
      { message: "Invalid Notion signature." },
      { status: 401 },
    );
  }

  if (!isNotionWebhookEvent(payload)) {
    return NextResponse.json(
      { message: "Unsupported Notion payload." },
      { status: 400 },
    );
  }

  if (!env.NOTION_DEPLOY_TRIGGER_PAGE_ID) {
    return NextResponse.json(
      { message: "Set NOTION_DEPLOY_TRIGGER_PAGE_ID to trigger redeploys." },
      { status: 500 },
    );
  }

  const isDeployTriggerPage =
    payload.entity.type === "page" &&
    normalizeNotionId(payload.entity.id) ===
      normalizeNotionId(env.NOTION_DEPLOY_TRIGGER_PAGE_ID);

  if (!isDeployTriggerPage || !DEPLOY_TRIGGER_EVENT_TYPES.has(payload.type)) {
    return NextResponse.json({ message: "Notion event ignored." });
  }

  const deployHookResult = await triggerVercelDeployHook();

  if (deployHookResult.ok) {
    console.info("Vercel deploy hook triggered from Notion webhook.", {
      eventId: payload.id,
      eventType: payload.type,
    });
  } else {
    console.error("Vercel deploy hook request failed.", {
      eventId: payload.id,
      eventType: payload.type,
      status: deployHookResult.status,
    });
  }

  return NextResponse.json(
    {
      message: deployHookResult.message,
      eventId: payload.id,
      eventType: payload.type,
    },
    { status: deployHookResult.ok ? 202 : deployHookResult.status },
  );
}
