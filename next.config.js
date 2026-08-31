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
  },
};

module.exports = nextConfig;
