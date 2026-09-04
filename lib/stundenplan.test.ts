import { describe, it, expect } from "vitest";
import {
  StundenplanEintragEingabeSchema,
  nachWochentagGruppiert,
  wochentagLabel,
  type StundenplanEintragZeile,
} from "./stundenplan";

describe("wochentagLabel", () => {
  it("liefert das deutsche Label", () => {
    expect(wochentagLabel(1)).toBe("Montag");
    expect(wochentagLabel(6)).toBe("Samstag");
  });
});

describe("StundenplanEintragEingabeSchema", () => {
  const basis = { wochentag: 1, beginn: "07:50", ende: "08:40", schule: "VS Musterstraße", klasse: "3b" };

  it("akzeptiert eine gültige Unterrichtseinheit", () => {
    expect(StundenplanEintragEingabeSchema.safeParse(basis).success).toBe(true);
  });

  it("lehnt Ende vor Beginn ab", () => {
    const result = StundenplanEintragEingabeSchema.safeParse({ ...basis, beginn: "09:00", ende: "08:00" });
    expect(result.success).toBe(false);
  });

  it("lehnt ungültiges Uhrzeitformat ab", () => {
    const result = StundenplanEintragEingabeSchema.safeParse({ ...basis, beginn: "7:50" });
    expect(result.success).toBe(false);
  });

  it("verlangt Schule/Klasse, außer bei istPause", () => {
    expect(
      StundenplanEintragEingabeSchema.safeParse({
        wochentag: 1,
        beginn: "08:40",
        ende: "09:00",
        schule: "",
        klasse: "",
      }).success,
    ).toBe(false);

    expect(
      StundenplanEintragEingabeSchema.safeParse({
        wochentag: 1,
        beginn: "08:40",
        ende: "09:00",
        schule: "",
        klasse: "",
        istPause: true,
      }).success,
    ).toBe(true);
  });
});

describe("nachWochentagGruppiert", () => {
  const eintraege: StundenplanEintragZeile[] = [
    {
      id: "a",
      wochentag: 2,
      beginn: "09:00",
      ende: "09:50",
      schule: "Schule B",
      klasse: "5a",
      schuelerangabe: null,
      istPause: false,
    },
    {
      id: "b",
      wochentag: 1,
      beginn: "08:00",
      ende: "08:50",
      schule: "Schule A",
      klasse: "3b",
      schuelerangabe: null,
      istPause: false,
    },
    {
      id: "c",
      wochentag: 1,
      beginn: "07:00",
      ende: "07:50",
      schule: "Schule A",
      klasse: "2a",
      schuelerangabe: null,
      istPause: false,
    },
  ];

  it("gruppiert nach Wochentag und sortiert innerhalb nach Beginnzeit", () => {
    const gruppen = nachWochentagGruppiert(eintraege);
    expect(gruppen.get(1)?.map((e) => e.id)).toEqual(["c", "b"]);
    expect(gruppen.get(2)?.map((e) => e.id)).toEqual(["a"]);
    expect(gruppen.has(3)).toBe(false);
  });
});
