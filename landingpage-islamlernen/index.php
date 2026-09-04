<?php
// Teaser-Landingpage für die Hauptdomain (islamlernen.at, ohne "ki."-Subdomain) - reine
// Weiterleitungs-/Vorstellungsseite zum eigentlichen Werkzeug unter APP_URL. Bewusst schlicht
// gehalten (kein Framework, kein Build-Schritt): plain HTML/CSS, damit die Datei direkt auf
// jedem PHP-fähigen Standard-Webspace als index.php funktioniert. Das einzige echte PHP ist der
// automatisch aktuelle Copyright-Jahrgang unten im Footer.
$appUrl = "https://ki.islamlernen.at";
$jahr = date("Y");
?>
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Lernwerk – Digitales Werkzeug für den Islamischen Religionsunterricht</title>
<meta name="description" content="Lernwerk: KI-geprüfte, lehrplanorientierte Arbeitsblätter für den Islamischen Religionsunterricht an österreichischen Schulen – plus Klassen-Tracking, Community und Prüfungsgenerierung.">
<meta property="og:title" content="Lernwerk – Digitales Werkzeug für den Islamischen Religionsunterricht">
<meta property="og:description" content="KI-geprüfte, lehrplanorientierte Arbeitsblätter in ca. 3 Minuten – plus Klassen-Tracking, Community-Materialien und Prüfungsgenerierung.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://islamlernen.at">
<link rel="icon" href="data:image/svg+xml,<?php echo rawurlencode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="%230f766e"/><path d="M12 4a7 7 0 0 0 8 8 8 8 0 1 1-8-8Z" fill="%23f4ead1"/></svg>'); ?>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --brand-50: #f0fdfa;
    --brand-100: #ccfbf1;
    --brand-500: #14b8a6;
    --brand-600: #0d9488;
    --brand-700: #0f766e;
    --brand-800: #115e59;
    --brand-900: #134e4a;
    --gold-100: #f4ead1;
    --gold-400: #c9a04a;
    --gold-700: #6f4f1e;
    --slate-50: #f8fafc;
    --slate-200: #e2e8f0;
    --slate-400: #94a3b8;
    --slate-500: #64748b;
    --slate-600: #475569;
    --slate-700: #334155;
    --slate-800: #1e293b;
    --canvas: #faf8f3;
    --surface: #ffffff;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: var(--canvas);
    color: var(--slate-800);
    font-family: "Inter", system-ui, sans-serif;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  h1, h2, h3 {
    font-family: "Newsreader", Georgia, serif;
    margin: 0;
    font-weight: 600;
    color: var(--slate-800);
  }

  a { color: inherit; }

  .wrap {
    max-width: 1080px;
    margin: 0 auto;
    padding: 0 20px;
  }

  /* HEADER */
  header {
    padding: 20px 0;
  }
  .header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .brand-mark {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--brand-700) 0%, var(--brand-900) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .brand-name {
    font-family: "Newsreader", Georgia, serif;
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--brand-800);
  }
  .brand-tagline {
    font-size: 0.75rem;
    color: var(--slate-500);
    margin-top: 1px;
  }
  .header-actions {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 16px;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 600;
    text-decoration: none;
    color: var(--brand-700);
    border: 1px solid var(--slate-200);
    background: var(--surface);
    transition: border-color 0.15s ease;
  }
  .btn-ghost:hover { border-color: var(--brand-500); }

  /* HERO */
  .hero {
    position: relative;
    overflow: hidden;
    border-radius: 28px;
    background: linear-gradient(135deg, var(--brand-700) 0%, var(--brand-900) 100%);
    color: #fff;
    padding: 56px 28px 40px;
    text-align: center;
  }
  .hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 14px;
    border-radius: 999px;
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.3);
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }
  .hero h1 {
    color: #fff;
    font-size: 2rem;
    line-height: 1.25;
    max-width: 720px;
    margin: 18px auto 0;
  }
  .hero p {
    max-width: 560px;
    margin: 16px auto 0;
    font-size: 0.95rem;
    color: var(--brand-50, #f0fdfa);
  }
  .hero-ctas {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-top: 30px;
  }
  .btn-solid {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 13px 26px;
    border-radius: 999px;
    background: var(--surface);
    color: var(--brand-700);
    font-weight: 700;
    font-size: 0.9rem;
    text-decoration: none;
    box-shadow: 0 8px 20px -8px rgba(0,0,0,0.35);
  }
  .btn-outline {
    display: inline-flex;
    align-items: center;
    padding: 13px 26px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.45);
    color: #fff;
    font-weight: 600;
    font-size: 0.9rem;
    text-decoration: none;
  }
  .hero-note {
    margin-top: 14px;
    font-size: 0.75rem;
    color: rgba(240,253,250,0.8);
  }
  .hero-strip {
    display: block;
    width: 100%;
    height: 20px;
    margin-top: 36px;
    background-image: url("assets/leiste-sterne.png");
    background-repeat: repeat-x;
    background-size: auto 100%;
    opacity: 0.5;
  }

  /* PILLARS */
  .pillars {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-top: 56px;
  }
  @media (min-width: 720px) {
    .pillars { grid-template-columns: repeat(4, 1fr); }
  }
  .pillar {
    background: var(--surface);
    border: 1px solid var(--slate-200);
    border-radius: 18px;
    padding: 20px;
    text-decoration: none;
    display: block;
  }
  .pillar-icon {
    width: 34px;
    height: 34px;
    border-radius: 9px;
    background: var(--brand-50);
    color: var(--brand-600);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
  }
  .pillar h3 {
    font-size: 0.9rem;
    margin-top: 12px;
  }
  .pillar p {
    font-size: 0.78rem;
    color: var(--slate-500);
    margin: 5px 0 0;
  }

  /* HIGHLIGHTS */
  .section {
    margin-top: 72px;
  }
  .section-heading {
    text-align: center;
    max-width: 560px;
    margin: 0 auto;
  }
  .section-heading h2 {
    font-size: 1.6rem;
  }
  .section-heading p {
    margin: 10px 0 0;
    color: var(--slate-500);
    font-size: 0.9rem;
  }
  .highlights {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
    margin-top: 32px;
  }
  @media (min-width: 720px) {
    .highlights { grid-template-columns: repeat(3, 1fr); }
  }
  .highlight {
    background: var(--surface);
    border: 1px solid var(--slate-200);
    border-radius: 16px;
    padding: 20px;
  }
  .highlight h3 {
    font-size: 0.95rem;
  }
  .highlight p {
    font-size: 0.82rem;
    color: var(--slate-500);
    margin: 6px 0 0;
  }

  /* FINAL CTA */
  .final-cta {
    position: relative;
    overflow: hidden;
    margin-top: 72px;
    border-radius: 28px;
    background: linear-gradient(135deg, var(--brand-700) 0%, var(--brand-900) 100%);
    color: #fff;
    text-align: center;
    padding: 48px 24px;
  }
  .final-cta h2 { color: #fff; font-size: 1.6rem; }
  .final-cta p { color: var(--brand-100); margin: 10px auto 0; max-width: 460px; font-size: 0.9rem; }
  .final-cta .btn-solid { margin-top: 24px; }

  /* FOOTER */
  footer {
    margin-top: 72px;
    padding: 28px 0 40px;
    text-align: center;
  }
  .footer-strip {
    display: block;
    width: 100%;
    max-width: 320px;
    height: 14px;
    margin: 0 auto 18px;
    background-image: url("assets/leiste-sterne.png");
    background-repeat: repeat-x;
    background-size: auto 100%;
    opacity: 0.35;
  }
  footer p {
    font-size: 0.78rem;
    color: var(--slate-400);
    margin: 0;
  }
  footer a {
    color: var(--slate-500);
    text-decoration: none;
  }
  footer a:hover { text-decoration: underline; }
  .footer-links {
    margin-top: 6px;
  }
  .footer-links a + a::before {
    content: "·";
    margin: 0 8px;
    color: var(--slate-400);
  }
</style>
</head>
<body>

<div class="wrap">
  <header>
    <div class="header-inner">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="#f4ead1"/></svg>
        </span>
        <div>
          <div class="brand-name">Lernwerk</div>
          <div class="brand-tagline">Islamischer Religionsunterricht · Österreich</div>
        </div>
      </div>
      <div class="header-actions">
        <a class="btn-ghost" href="<?php echo $appUrl; ?>/login">Anmelden</a>
      </div>
    </div>
  </header>

  <section class="hero">
    <span class="hero-eyebrow">Für Lehrkräfte des Islamischen Religionsunterrichts</span>
    <h1>Dein komplettes digitales Werkzeug für den Islamischen Religionsunterricht</h1>
    <p>KI-geprüfte, lehrplanorientierte Arbeitsblätter in ca. 3 Minuten – plus Klassen-Tracking, geteilte Community-Materialien und Prüfungsgenerierung.</p>
    <div class="hero-ctas">
      <a class="btn-solid" href="<?php echo $appUrl; ?>/register">Kostenlos ausprobieren</a>
      <a class="btn-outline" href="<?php echo $appUrl; ?>/login">Anmelden</a>
    </div>
    <p class="hero-note">Nur E-Mail + Passwort – in wenigen Minuten startklar.</p>
    <span class="hero-strip" aria-hidden="true"></span>
  </section>

  <div class="pillars">
    <a class="pillar" href="<?php echo $appUrl; ?>/#arbeitsblaetter">
      <span class="pillar-icon">📝</span>
      <h3>Arbeitsblätter</h3>
      <p>In ca. 3 Minuten fertig, zweifach geprüft, direkt druckbereit.</p>
    </a>
    <a class="pillar" href="<?php echo $appUrl; ?>/#klassen">
      <span class="pillar-icon">🎓</span>
      <h3>Klassen &amp; Prüfungen</h3>
      <p>Wissensstand pro Klasse und Schüler:in auf einen Blick.</p>
    </a>
    <a class="pillar" href="<?php echo $appUrl; ?>/#community">
      <span class="pillar-icon">👥</span>
      <h3>Community</h3>
      <p>Bewährte Arbeitsblätter von Kolleg:innen entdecken.</p>
    </a>
    <a class="pillar" href="<?php echo $appUrl; ?>/#koran">
      <span class="pillar-icon">📖</span>
      <h3>Direkt aus dem Koran</h3>
      <p>Vers/Sure live abgerufen – garantiert korrekt zitiert.</p>
    </a>
  </div>

  <section class="section">
    <div class="section-heading">
      <h2>Warum Lernwerk?</h2>
      <p>Kein Fließtext zum Selbst-Formatieren – fertig geprüft und druckbereit.</p>
    </div>
    <div class="highlights">
      <div class="highlight">
        <h3>Zweite, unabhängige Prüfung</h3>
        <p>Ein separater KI-Durchlauf prüft jedes Arbeitsblatt gezielt gegen Quellenangaben, Vollständigkeit und Altersgerechtigkeit.</p>
      </div>
      <div class="highlight">
        <h3>Für den österreichischen IGGÖ-Lehrplan</h3>
        <p>Orientiert an der Grobstruktur des aktuellen Lehrplans für Islamischen Religionsunterricht der IGGÖ.</p>
      </div>
      <div class="highlight">
        <h3>Direkt druckfertig</h3>
        <p>Fertiges, layoutetes PDF oder Word-Dokument, wahlweise mit islamischem Datum und Ornament-Musterstreifen.</p>
      </div>
    </div>
  </section>

  <section class="final-cta">
    <h2>Das nächste Arbeitsblatt in ca. 3 Minuten statt 15</h2>
    <p>Kostenlos ausprobieren, keine Zahlungsdaten nötig – startklar in wenigen Minuten.</p>
    <a class="btn-solid" href="<?php echo $appUrl; ?>/register">Jetzt kostenlos starten</a>
  </section>

  <footer>
    <span class="footer-strip" aria-hidden="true"></span>
    <p>&copy; <?php echo $jahr; ?> Lernwerk</p>
    <p class="footer-links">
      <a href="<?php echo $appUrl; ?>/impressum">Impressum</a>
      <a href="<?php echo $appUrl; ?>/datenschutz">Datenschutz</a>
    </p>
  </footer>
</div>

</body>
</html>
