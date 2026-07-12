// elsewhr — Sentry: what breaks on the server
// Create this file at: sentry.server.config.ts (repo root)

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === "production",
  sendDefaultPii: false,
});
