# Landingpage für die Hauptdomain (islamlernen.at)

Schlanke Teaser-Seite für die Hauptdomain **ohne** das "ki."-Subdomain-Präfix (also
`islamlernen.at`, nicht `ki.islamlernen.at`) - stellt Lernwerk kurz vor und verlinkt zum
eigentlichen Werkzeug unter `https://ki.islamlernen.at`.

Bewusst **kein** Next.js/React, kein Build-Schritt: reines HTML/CSS in einer einzigen
`index.php`-Datei, damit sie direkt auf einem normalen PHP-fähigen Webspace läuft. Das einzige
tatsächliche PHP ist die automatisch aktuelle Jahreszahl im Footer (`date("Y")`) sowie die
Basis-URL zum eigentlichen Tool (`$appUrl`).

## Deployment

Diese Dateien sind **nicht** Teil des Next.js-Deployments dieses Repos (das läuft unter
`ki.islamlernen.at`) - die Hauptdomain wird separat gehostet. Zum Veröffentlichen:

1. `index.php` und den Ordner `assets/` per FTP/SFTP oder über das Hosting-Panel in das
   Wurzelverzeichnis (document root) der Hauptdomain hochladen.
2. Fertig - kein Datenbank-Zugriff, keine Abhängigkeiten, kein Build nötig.

Falls sich die App-URL einmal ändert, genügt es, `$appUrl` oben in `index.php` anzupassen.
