import "server-only";

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NOTION_TOKEN: z.string().min(1).optional(),
    NOTION_WEBSITE_PAGE_ID: z.string().min(1).optional(),
  },
  client: {},
  runtimeEnv: {
    NOTION_TOKEN: process.env.NOTION_TOKEN,
    NOTION_WEBSITE_PAGE_ID: process.env.NOTION_WEBSITE_PAGE_ID,
  },
});
