# Hinweise für Claude Code (projektübergreifend, sitzungsübergreifend gültig)

## Testing mit echter Claude-Generierung

In der Sandbox-Umgebung ist standardmäßig kein `ANTHROPIC_API_KEY` gesetzt. Der Betreiber hat
angeboten, künftig einen separaten API-Key mit niedrigem Ausgabenlimit für Testzwecke
bereitzustellen (nicht den produktiven Key). Falls ein solcher Key übergeben wird:

- Nur als Umgebungsvariable für die jeweilige Sitzung verwenden, NIE in Code, Commits, Dateien
  oder Logs schreiben.
- Damit lassen sich echte End-to-End-Generierungen testen (tatsächliches Modellverhalten, echte
  Token-Kosten, echtes Timing) statt nur synthetischer, händisch erzeugter Testdaten.
- Bis ein Key vorliegt: Funktionstests weiterhin über direkt in die DB eingefügte, realistische
  `contentJson`-Testdaten fahren (siehe bisheriges Vorgehen in der Session-Historie: Test-User +
  Session + Worksheet per `npx tsx`-Skript seeden, Server lokal starten, PDF/Word/Web abrufen und
  prüfen, danach wieder aufräumen).

## Branding

Der Produktname ist **„Lernwerk"** (umbenannt von „Arbeitsblatt-Generator", das dem Betreiber zu
generisch/wenig vertrauenswürdig wirkte - Entscheidung: deutscher Name, bewusst OHNE "IRU"-Zusatz
im Markennamen selbst, da "IRU" als Abkürzung nicht genutzt werden soll). Der Name steht in
`components/SiteHeader.tsx` (Header-Logo), `app/layout.tsx` (Seitentitel/OG/Twitter-Meta),
`app/opengraph-image.tsx`/`app/twitter-image.tsx` (Alt-Text), `lib/ogImageLayout.tsx`
(Social-Share-Bild), `lib/mailer.ts` (E-Mail-Absender/-Texte), `README.md`, `package.json`. Bei
künftigen neuen Textstellen (Landingpage, Formulare, etc.) diesen Namen verwenden, nicht wieder
"Arbeitsblatt-Generator".

Der Name „Claude" taucht auf sichtbaren Nutzer-Oberflächen bewusst nicht mehr auf (zuletzt
entfernt aus `app/new/page.tsx`) - bei Rückfrage darf weiterhin gesagt werden, dass Claude für die
Generierung verwendet wird, es soll nur nicht von sich aus in der UI stehen. Auch "IRU" als
Abkürzung für "Islamischer Religionsunterricht" wird in sichtbaren Texten bewusst vermieden -
immer ausgeschrieben.
