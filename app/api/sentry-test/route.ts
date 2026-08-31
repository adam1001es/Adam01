// Temporäre Diagnose-Route, um die Sentry-Anbindung in Produktion zu prüfen - wird direkt nach
// erfolgreicher Prüfung wieder entfernt.
export const dynamic = "force-dynamic";

export async function GET() {
  throw new Error("Absichtlicher Testfehler zur Sentry-Verifikation in Produktion");
}
