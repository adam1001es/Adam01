import nodemailer from "nodemailer";

/**
 * Mailversand über ein privates Gmail-Konto (SMTP) - kostenlos, kein eigener Domain-Zugriff
 * nötig. Erfordert ein Gmail-Konto mit 2FA + einem "App-Passwort" (nicht das normale
 * Gmail-Passwort, siehe README): GMAIL_USER (die Gmail-Adresse) und GMAIL_APP_PASSWORT
 * (16-stelliges App-Passwort ohne Leerzeichen) als Umgebungsvariablen.
 */
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORT) {
      throw new Error(
        "GMAIL_USER und/oder GMAIL_APP_PASSWORT sind nicht gesetzt - E-Mail-Versand ist nicht konfiguriert.",
      );
    }
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORT },
    });
  }
  return transporter;
}

export async function sendeVerifizierungsMail(
  empfaenger: string,
  verifizierungsUrl: string,
): Promise<void> {
  const t = getTransporter();
  await t.sendMail({
    from: `"Arbeitsblatt-Generator" <${process.env.GMAIL_USER}>`,
    to: empfaenger,
    subject: "Bitte bestätige deine E-Mail-Adresse",
    text: `Willkommen beim Arbeitsblatt-Generator!\n\nBitte bestätige deine E-Mail-Adresse über diesen Link (24 Stunden gültig):\n${verifizierungsUrl}\n\nFalls du dich nicht registriert hast, kannst du diese Mail ignorieren.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#12704c;">Willkommen beim Arbeitsblatt-Generator!</h2>
        <p>Bitte bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren:</p>
        <p>
          <a href="${verifizierungsUrl}" style="display:inline-block;background:#12704c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
            E-Mail-Adresse bestätigen
          </a>
        </p>
        <p style="color:#64748b;font-size:13px;">Der Link ist 24 Stunden gültig. Falls du dich nicht registriert hast, kannst du diese Mail ignorieren.</p>
      </div>
    `,
  });
}
