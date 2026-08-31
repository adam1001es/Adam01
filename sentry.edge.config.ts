import * as Sentry from "@sentry/nextjs";

// Betrifft aktuell nur die beiden Edge-Routen (app/opengraph-image.tsx, app/twitter-image.tsx) -
// siehe dieselbe Begründung (NEXT_PUBLIC_-Präfix, kein Geheimnis) wie in sentry.server.config.ts.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
}
