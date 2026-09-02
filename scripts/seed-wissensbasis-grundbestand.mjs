// Einmaliges Seed-Skript: legt einen recherchierten Grundbestand an Zitat-Entwürfen für die
// Admin-Wissensbasis an (siehe lib/wissensbasis.ts, app/admin/wissensbasis). Jedes Zitat wurde
// per Websuche gegen unabhängige Quellen (quran.com, sunnah.com, corpus.quran.com u.a.)
// verifiziert - die Fundstellen stehen jeweils in "rechercheNotiz". ALLE Einträge landen
// bewusst mit Status "entwurf" (Ausnahme: der eine bewusst "abgelehnte" Fehlzitat-Kandidat) -
// die inhaltliche Freigabe bleibt ein manueller Schritt im Admin-Bereich.
//
// Ausführen (einmalig, auch gegen die Produktions-DB möglich):
//   DATABASE_URL="<produktions-url>" npx tsx scripts/seed-wissensbasis-grundbestand.mjs
// Ist idempotent: bereits vorhandene Bezeichnungen werden übersprungen, ein erneuter Lauf legt
// also keine Duplikate an.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalisiereBezeichnung(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const EINTRAEGE = [
  {
    typ: "zitat",
    themenbereich: "glaubensbasis",
    inhalt: {
      bezeichnung: "Sure 2 (Al-Baqara), Vers 255 - Ayat al-Kursi (Der Thronvers)",
      text: "Allah - es gibt keinen Gott außer Ihm, dem Lebendigen, dem Beständigen. Weder Schlummer noch Schlaf befällt Ihn. Ihm gehört, was in den Himmeln und was auf der Erde ist. Sein Kursi umfasst die Himmel und die Erde, und es fällt Ihm nicht schwer, sie zu bewahren. Und Er ist der Erhabene, der Allgewaltige.",
      kontext:
        "Zentraler Vers zur Einzigartigkeit und Allmacht Allahs (Tauhid) - gilt als der bedeutendste Vers des Korans, häufig im Unterricht zu Glaubensgrundlagen verwendet.",
    },
    rechercheNotiz:
      "Per Websuche gegen mehrere unabhängige Quellen verifiziert (u.a. quran.com, corpus.quran.com, myislam.org) - Wortlaut/Übersetzung stimmen überein. Unumstrittener, sunnitischer Standardvers.",
  },
  {
    typ: "zitat",
    themenbereich: "glaubensbasis",
    inhalt: {
      bezeichnung: "Sure 112 (Al-Ikhlas), Verse 1-4",
      text: "Sag: Er ist Allah, ein Einziger. Allah, der Absolute (As-Samad). Er hat nicht gezeugt und ist nicht gezeugt worden. Und Ihm ist niemand gleich.",
      kontext:
        "Kurze, für alle Schulstufen geeignete Sure zur Einzigkeit Allahs (Tauhid) - gilt laut Hadith als 'ein Drittel des Korans' an Bedeutung.",
    },
    rechercheNotiz:
      "Per Websuche verifiziert (quran.com, Wikipedia 'Al-Ikhlas') - kurze, textlich unumstrittene Sure, in jeder Übersetzung nahezu identisch.",
  },
  {
    typ: "zitat",
    themenbereich: "ibada",
    inhalt: {
      bezeichnung: "Hadith von Gabriel (Sahih Muslim 8 / Sahih al-Bukhari 50)",
      text: "Der Islam besteht aus: dem Bezeugen, dass es keinen Gott außer Allah gibt und dass Muhammad Sein Gesandter ist, der Verrichtung des Gebets, der Entrichtung der Zakat, dem Fasten im Ramadan und der Pilgerfahrt (Hadsch), sofern man dazu in der Lage ist.",
      kontext:
        "Der berühmte 'Hadith Jibril' - fasst die fünf Säulen des Islam (praktisches Handeln), die sechs Glaubensgrundsätze (Iman) und Ihsan in einem einzigen, sahih überlieferten Hadith zusammen. Sehr breit im Unterricht einsetzbar (Ibada UND Glaubensbasis).",
    },
    rechercheNotiz:
      "Per Websuche verifiziert gegen sunnah.com (Sahih al-Bukhari 50) sowie Sahih Muslim - in beiden Sammlungen als sahih verzeichnet, unumstritten. Eines der am häufigsten zitierten Hadithe überhaupt im Grundlagenunterricht.",
  },
  {
    typ: "zitat",
    themenbereich: "ibada",
    inhalt: {
      bezeichnung: "Sure 2 (Al-Baqara), Vers 183",
      text: "O ihr, die ihr glaubt! Vorgeschrieben ist euch das Fasten, so wie es denen vorgeschrieben war, die vor euch waren, auf dass ihr gottesfürchtig werdet.",
      kontext:
        "Die zentrale Koranstelle zur Fastenpflicht im Ramadan - Begründung des Fastens (Taqwa/Gottesbewusstsein), nicht nur die bloße Vorschrift.",
    },
    rechercheNotiz:
      "Per Websuche verifiziert (quran.com, mehrere Standardübersetzungen stimmen im Kern überein) - unumstrittener, häufig zitierter Vers.",
  },
  {
    typ: "zitat",
    themenbereich: "schoepfung",
    inhalt: {
      bezeichnung: "Sure 6 (Al-An'am), Vers 165",
      text: "Und Er ist es, Der euch zu Nachfolgern (Khala'if) auf der Erde gemacht und die einen von euch über die anderen im Rang erhöht hat, um euch durch das zu prüfen, was Er euch gegeben hat.",
      kontext:
        "Grundlage für das Konzept der Statthalterschaft/Verantwortung des Menschen für die Schöpfung (Khalifa/Amanah) - zentral für den Themenbereich 'Schöpfung - Verantwortung'.",
    },
    rechercheNotiz:
      "Per Websuche verifiziert (alim.org Übersetzungsvergleich, Ibn-Kathir-Tafsir via surahquran.com) - Kernbegriff 'Khala'if/Khalifa' in allen Standardübersetzungen konsistent wiedergegeben.",
  },
  {
    typ: "zitat",
    themenbereich: "muamalat",
    inhalt: {
      bezeichnung: "40 Hadith an-Nawawi, Nr. 13 (Sahih al-Bukhari 13 / Sahih Muslim 45)",
      text: "Keiner von euch glaubt [wirklich], bis er für seinen Bruder liebt, was er für sich selbst liebt.",
      kontext:
        "Grundlegendes Hadith zur zwischenmenschlichen Ethik (Mu'amalat) - von beiden führenden Hadith-Sammlungen bestätigt (muttafaqun alayhi), eines der am häufigsten im Ethikunterricht zitierten Hadithe.",
    },
    rechercheNotiz:
      "Per Websuche verifiziert (sunnah.com nawawi40:13, hadeethenc.com) - 'muttafaqun alayhi' (von Bukhari UND Muslim bestätigt), höchste Authentizitätsstufe.",
  },
  {
    typ: "zitat",
    themenbereich: "pluralitaet",
    inhalt: {
      bezeichnung: "Sure 49 (Al-Hujurat), Vers 13",
      text: "O ihr Menschen! Wir haben euch aus einem Mann und einer Frau erschaffen und euch zu Völkern und Stämmen gemacht, damit ihr einander kennenlernt. Der Angesehenste von euch bei Allah ist der Gottesfürchtigste.",
      kontext:
        "Zentraler Vers zu Vielfalt/Pluralität - Unterschiedlichkeit als von Allah gewollt, Maßstab für Ansehen ist Gottesfürchtigkeit, nicht Herkunft.",
    },
    rechercheNotiz:
      "Per Websuche verifiziert (quran.com, corpus.quran.com, mehrere Standardübersetzungen stimmen inhaltlich überein) - unumstrittener Standardvers zum Thema Vielfalt/Pluralismus.",
  },
  {
    typ: "zitat",
    themenbereich: "pluralitaet",
    inhalt: {
      bezeichnung: "Sure 2 (Al-Baqara), Vers 256 (Ausschnitt)",
      text: "Es gibt keinen Zwang im Glauben. Der rechte Weg ist klar erkennbar geworden gegenüber dem Irrtum.",
      kontext:
        "Grundlegender Vers zur Religionsfreiheit/Toleranz - wichtig für den Themenbereich Pluralitätsfähigkeit/Sozialer Zusammenhalt, insbesondere im interreligiösen Kontext.",
    },
    rechercheNotiz:
      "Per Websuche verifiziert (quran.com, corpus.quran.com) - Kernaussage 'kein Zwang im Glauben' in allen gängigen Übersetzungen konsistent; Anmerkung: die genaue Reichweite des Verses (nur 'Din' im engeren Sinn oder weiter gefasst) ist unter Gelehrten diskutiert - für den Schulkontext ist die Kernaussage aber unstrittig.",
  },
  {
    typ: "zitat",
    themenbereich: "quellentexte",
    inhalt: {
      bezeichnung: "Sure 3 (Al-Imran), Vers 7 (Ausschnitt)",
      text: "Er ist es, Der das Buch auf dich herabgesandt hat; darin sind eindeutige Verse (Muhkamat) - sie sind die Grundlage des Buches - und andere, mehrdeutige (Mutaschabihat).",
      kontext:
        "Grundlage für den methodischen Umgang mit Quellentexten - Unterscheidung zwischen eindeutigen und auslegungsbedürftigen Versen, wichtig für einen reflektierten (nicht wörtlich-unkritischen) Umgang mit dem Koran.",
    },
    rechercheNotiz:
      "Per Websuche verifiziert (quran.com Tafsir Ma'arif al-Qur'an, Wikipedia 'Muhkam and Mutashabih') - Kernbegriffe und Grundaussage in Standardquellen konsistent, exakte Auslegungsgrenzen unter Gelehrten diskutiert (für Schulkontext nicht relevant).",
  },
  {
    typ: "zitat",
    themenbereich: "selbsterkenntnis",
    inhalt: {
      bezeichnung: "Sure 13 (Ar-Ra'd), Vers 11 (Ausschnitt)",
      text: "Gewiss, Allah ändert nicht, was mit einem Volk ist, bis sie ändern, was in ihnen selbst ist.",
      kontext:
        "Zentraler Vers zu Selbstverantwortung/innerer Veränderung als Voraussetzung äußerer Veränderung - gut geeignet für den Themenbereich Selbsterkenntnis.",
    },
    rechercheNotiz:
      "Per Websuche verifiziert (corpus.quran.com, mehrere Standardübersetzungen) - unumstrittener, häufig zitierter Vers. HINWEIS: das populäre, oft als Hadith zitierte 'Man arafa nafsahu faqad arafa rabbahu' ('Wer sich selbst erkennt, erkennt seinen Herrn') ist NACH Recherche KEIN authentisches Hadith (Ibn Taimiyya: fabriziert; an-Nawawi: ohne belastbare Grundlage; laut az-Zarkaschi eher ein Ausspruch des Sufi-Gelehrten Yahya ibn Mu'adh ar-Razi) - deshalb bewusst NICHT als Zitat aufgenommen, siehe separaten abgelehnten Eintrag.",
  },
  {
    typ: "zitat",
    themenbereich: "selbsterkenntnis",
    status: "abgelehnt",
    inhalt: {
      bezeichnung: '"Man arafa nafsahu faqad arafa rabbahu" (populäres Sprichwort, KEIN echtes Hadith)',
      text: "Wer sich selbst erkennt, erkennt seinen Herrn.",
      kontext:
        "Wird im Alltag/in Predigten oft als Hadith des Propheten zitiert, ist aber nach Gelehrtenmeinung KEIN authentisches Hadith.",
    },
    rechercheNotiz:
      "Bewusst mit Status 'abgelehnt' angelegt (nicht einfach weggelassen), damit dieser populäre Fehlzitat-Kandidat nicht versehentlich über das Mining erneut als vermeintlich echtes Zitat auftaucht. Ibn Taimiyya stufte den Ausspruch als fabriziert (hadith maudhu') ein, an-Nawawi sah keine belastbare Grundlage als Prophetenwort, laut az-Zarkaschi stammt er eher vom Sufi-Gelehrten Yahya ibn Mu'adh ar-Razi. Als Sure 13:11 (siehe anderer Eintrag) gibt es eine inhaltlich verwandte, aber echte und verifizierte Koranstelle.",
  },
];

async function main() {
  const bestehende = await prisma.wissensEintrag.findMany({
    where: { typ: "zitat" },
    select: { inhalt: true },
  });
  const bestehendeBezeichnungen = new Set(
    bestehende
      .map((e) => {
        try {
          return normalisiereBezeichnung(JSON.parse(e.inhalt).bezeichnung ?? "");
        } catch {
          return "";
        }
      })
      .filter(Boolean),
  );

  let angelegt = 0;
  let uebersprungen = 0;
  for (const e of EINTRAEGE) {
    const key = normalisiereBezeichnung(e.inhalt.bezeichnung);
    if (bestehendeBezeichnungen.has(key)) {
      uebersprungen++;
      continue;
    }
    await prisma.wissensEintrag.create({
      data: {
        typ: e.typ,
        themenbereich: e.themenbereich,
        inhalt: JSON.stringify(e.inhalt),
        rechercheNotiz: e.rechercheNotiz,
        status: e.status ?? "entwurf",
        ...(e.status === "abgelehnt" ? { geprueftAm: new Date() } : {}),
      },
    });
    angelegt++;
  }
  console.log(`${angelegt} neue Einträge angelegt, ${uebersprungen} bereits vorhanden übersprungen.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
