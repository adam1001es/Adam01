import * as Sentry from "@sentry/nextjs";

// NEXT_PUBLIC_-Präfix, weil derselbe DSN auch im Browser-Bundle landet (sentry.client.config.ts)
// - der DSN ist bewusst kein Geheimnis (nur ein Schreib-Endpunkt für Fehlerberichte), daher
// unproblematisch. Ohne gesetzten Wert (z.B. lokale Entwicklung ohne .env-Eintrag) bewusst NICHT
// initialisieren - Sentry.init() mit leerem/fehlendem DSN würde nur eine Warnung in die Konsole
// schreiben und nichts senden, aber unnötig Rauschen erzeugen.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    // Bewusst niedrig: bei diesem Nutzungsumfang (wenige Dutzend Lehrkräfte) reicht ein
    // kleiner Anteil an Performance-Traces völlig, um Auffälligkeiten zu erkennen - volle
    // 100% würden unnötig Kontingent im kostenlosen Sentry-Tarif verbrauchen. Fehler werden
    // davon unabhängig IMMER erfasst (tracesSampleRate betrifft nur Performance-Traces).
    tracesSampleRate: 0.1,
  });
}
