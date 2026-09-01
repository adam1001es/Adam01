// Bewusst ohne IPA-Sonderzeichen (Makren, Spiritus-Zeichen) transliteriert - diese werden von
// den PDF-Standardschriften (WinAnsi-Kodierung) nicht unterstützt und würden falsch dargestellt.
const HIJRI_MONATE = [
  "Muharram",
  "Safar",
  "Rabi al-Awwal",
  "Rabi ath-Thani",
  "Dschumada al-Ula",
  "Dschumada al-Achira",
  "Radschab",
  "Schaaban",
  "Ramadan",
  "Schawwal",
  "Dhul-Qaida",
  "Dhul-Hiddscha",
];

// Tabellarischer ("ziviler") islamischer Kalender via ICU (Intl) - eine weit verbreitete
// rechnerische Näherung. Das tatsächliche, in der Praxis verwendete Datum kann je nach
// Mondsichtung um einen Tag abweichen.
const HIJRI_FORMATTER = new Intl.DateTimeFormat("en-u-ca-islamic-civil", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

export interface HijriDatum {
  tag: number;
  monat: number;
  jahr: number;
  label: string;
}

export function toHijri(date: Date): HijriDatum {
  const parts = HIJRI_FORMATTER.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  const tag = get("day");
  const monat = get("month");
  const jahr = get("year");
  return {
    tag,
    monat,
    jahr,
    label: `${tag}. ${HIJRI_MONATE[monat - 1]} ${jahr} n. H.`,
  };
}

export function formatDoppelDatum(date: Date): string {
  const gregorianisch = date.toLocaleDateString("de-AT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const hijri = toHijri(date);
  return `${gregorianisch} · ${hijri.label}`;
}
