import * as Sentry from "@sentry/nextjs";

// Siehe Begründung (NEXT_PUBLIC_-Präfix, kein Geheimnis) in sentry.server.config.ts.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    // Session Replay bewusst deaktiviert (kein replayIntegration) - würde Bildschirmaufnahmen
    // von Lehrkräften-Sessions anlegen, unnötig für reine Fehlerdiagnose bei diesem Umfang.
  });
}
