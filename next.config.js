const { withSentryConfig } = require("@sentry/nextjs/config");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
    // pdfkit (von @react-pdf/renderer intern genutzt) lädt seine Standard-Schriftarten über
    // Node's "imports"-Feld (`#standard-fonts/Helvetica` in pdfkit/package.json). Vercels
    // Datei-Tracing (Node File Trace) löst dieses "imports"-Feld nicht zuverlässig auf und
    // ließ die Schriftart-Dateien beim Deployment weg - die PDF-Route stürzte dadurch in
    // Produktion mit "Cannot find module .../pdfkit/js/standard-fonts/Helvetica.cjs" ab
    // (lokal unsichtbar, da dort das Dateisystem direkt zugänglich ist, unabhängig vom
    // Tracing-Ergebnis). Erzwingt den Einschluss dieser Dateien unabhängig vom Tracing-Ergebnis.
    outputFileTracingIncludes: {
      "**/pdf/**": ["./node_modules/pdfkit/js/**/*"],
    },
    // Nötig, damit Next.js instrumentation.ts überhaupt lädt (siehe dort) - in Next.js 14 noch
    // hinter diesem Flag, ab 15 standardmäßig aktiv.
    instrumentationHook: true,
  },
};

// Bewusst OHNE org/project/authToken: kein Source-Map-Upload eingerichtet, da das ein
// zusätzliches Sentry-Auth-Token als Secret bräuchte - Fehler werden trotzdem vollständig
// erfasst, nur die Stacktraces in der Sentry-Oberfläche zeigen minifizierten statt
// Original-Code. Kann bei Bedarf später nachgerüstet werden.
module.exports = withSentryConfig(nextConfig, {
  silent: true,
  telemetry: false,
});
