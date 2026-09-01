"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/** Next.js' letzte Auffangebene: greift, wenn selbst app/layout.tsx beim Rendern abstürzt (ein
 * gewöhnliches app/error.tsx würde dabei NICHT greifen, weil auch das Layout drumherum betroffen
 * ist) - muss deshalb sein eigenes <html>/<body> mitbringen. Bewusst mit reinen Inline-Styles
 * statt Tailwind-Klassen, damit die Seite auch dann noch lesbar bleibt, wenn im selben Absturz
 * das CSS nicht mehr zuverlässig geladen wurde. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="de">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fbfaf7" }}>
        <main
          style={{
            maxWidth: 480,
            margin: "80px auto",
            padding: 32,
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 22, color: "#1e293b", marginBottom: 8 }}>
            Etwas ist schiefgelaufen
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
            Der Fehler wurde automatisch gemeldet. Bitte versuche es erneut - falls es weiterhin
            nicht funktioniert, kontaktiere die Person, die den Zugang verwaltet.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#0f766e",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Erneut versuchen
          </button>
        </main>
      </body>
    </html>
  );
}
