import * as Sentry from "@sentry/nextjs";

/** Next.js lädt diese Datei einmal beim Serverstart (siehe experimental.instrumentationHook in
 * next.config.js) - initialisiert Sentry serverseitig, getrennt nach Node-/Edge-Runtime, da
 * beide unterschiedliche SDKs brauchen (siehe sentry.server.config.ts / sentry.edge.config.ts).
 * Der Client (Browser) wird separat über sentry.client.config.ts initialisiert. Ohne gesetzten
 * SENTRY_DSN (z.B. lokal ohne .env-Eintrag) initialisieren die config-Dateien Sentry gar nicht
 * erst - dann ist auch dieser Hook wirkungslos, kein Setup-Zwang für die lokale Entwicklung. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
