import "server-only";

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NOTION_TOKEN: z.string().min(1).optional(),
    NOTION_WEBSITE_PAGE_ID: z.string().min(1).optional(),
    NOTION_WEBHOOK_VERIFICATION_TOKEN: z.string().min(1).optional(),
    NOTION_DEPLOY_TRIGGER_PAGE_ID: z.string().min(1).optional(),
    VERCEL_DEPLOY_HOOK_URL: z.string().url().optional(),
  },
  client: {},
  runtimeEnv: {
    NOTION_TOKEN: process.env.NOTION_TOKEN,
    NOTION_WEBSITE_PAGE_ID: process.env.NOTION_WEBSITE_PAGE_ID,
    NOTION_WEBHOOK_VERIFICATION_TOKEN:
      process.env.NOTION_WEBHOOK_VERIFICATION_TOKEN,
    NOTION_DEPLOY_TRIGGER_PAGE_ID: process.env.NOTION_DEPLOY_TRIGGER_PAGE_ID,
    VERCEL_DEPLOY_HOOK_URL: process.env.VERCEL_DEPLOY_HOOK_URL,
  },
});
