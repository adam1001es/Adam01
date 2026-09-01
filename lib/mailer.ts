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
    from: `"Lernwerk" <${process.env.GMAIL_USER}>`,
    to: empfaenger,
    subject: "Bitte bestätige deine E-Mail-Adresse",
    text: `Willkommen beim Lernwerk!\n\nBitte bestätige deine E-Mail-Adresse über diesen Link (24 Stunden gültig):\n${verifizierungsUrl}\n\nFalls du dich nicht registriert hast, kannst du diese Mail ignorieren.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#12704c;">Willkommen beim Lernwerk!</h2>
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

/** Bestätigungsmail für eine ÄNDERUNG der E-Mail-Adresse eines bestehenden Kontos (siehe
 * app/api/account/email) - geht an die NEUE Adresse, damit sichergestellt ist, dass sie
 * tatsächlich erreichbar/im eigenen Besitz ist, bevor sie zur aktiven Anmelde-Adresse wird. */
export async function sendeEmailAenderungsMail(
  empfaenger: string,
  bestaetigungsUrl: string,
): Promise<void> {
  const t = getTransporter();
  await t.sendMail({
    from: `"Lernwerk" <${process.env.GMAIL_USER}>`,
    to: empfaenger,
    subject: "Bitte bestätige deine neue E-Mail-Adresse",
    text: `Für dein Konto beim Lernwerk wurde diese Adresse als neue E-Mail-Adresse hinterlegt.\n\nBitte bestätige sie über diesen Link (24 Stunden gültig):\n${bestaetigungsUrl}\n\nErst danach wird sie zu deiner neuen Anmelde-Adresse - bis dahin bleibt deine bisherige E-Mail-Adresse aktiv. Falls du das nicht warst, kannst du diese Mail einfach ignorieren.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#12704c;">Neue E-Mail-Adresse bestätigen</h2>
        <p>Für dein Konto beim Lernwerk wurde diese Adresse als neue E-Mail-Adresse hinterlegt.</p>
        <p>
          <a href="${bestaetigungsUrl}" style="display:inline-block;background:#12704c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
            E-Mail-Adresse bestätigen
          </a>
        </p>
        <p style="color:#64748b;font-size:13px;">Erst nach Bestätigung wird sie zu deiner neuen Anmelde-Adresse - bis dahin bleibt deine bisherige E-Mail-Adresse aktiv. Der Link ist 24 Stunden gültig. Falls du das nicht warst, kannst du diese Mail einfach ignorieren.</p>
      </div>
    `,
  });
}

/** Mail zum Zurücksetzen eines vergessenen Passworts (siehe app/api/auth/passwort-vergessen) -
 * bewusst kürzer gültig (1 Stunde) als die anderen Bestätigungsmails, da ein gültiger Link
 * hier direkt vollen Kontozugriff verschafft. */
export async function sendePasswortResetMail(
  empfaenger: string,
  resetUrl: string,
): Promise<void> {
  const t = getTransporter();
  await t.sendMail({
    from: `"Lernwerk" <${process.env.GMAIL_USER}>`,
    to: empfaenger,
    subject: "Passwort zurücksetzen",
    text: `Für dein Konto beim Lernwerk wurde ein neues Passwort angefordert.\n\nÜber diesen Link (1 Stunde gültig) kannst du ein neues Passwort vergeben:\n${resetUrl}\n\nFalls du das nicht warst, kannst du diese Mail einfach ignorieren - dein Passwort bleibt dann unverändert.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#12704c;">Passwort zurücksetzen</h2>
        <p>Für dein Konto beim Lernwerk wurde ein neues Passwort angefordert.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;background:#12704c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
            Neues Passwort vergeben
          </a>
        </p>
        <p style="color:#64748b;font-size:13px;">Der Link ist 1 Stunde gültig. Falls du das nicht warst, kannst du diese Mail einfach ignorieren - dein Passwort bleibt dann unverändert.</p>
      </div>
    `,
  });
}
