/**
 * Dezentes islamisches Ornament: eine Arabeske (Islimi-Rankenmotiv) - ein wellenförmiger
 * Rankenstamm mit kleinen Blattakzenten, wie man es von Manuskript-/Buchrändern kennt.
 * Rein florale Ornamentik, keine Schrift, keine religiösen Symbole oder Namen - bewusst
 * rein rechnerisch (Bezierkurven) erzeugt, kein Bild-Asset nötig.
 */

export interface ArabeskeBlatt {
  d: string;
}

export interface ArabeskeRanke {
  stammPfad: string;
  blaetter: ArabeskeBlatt[];
}

/** Rundes, geschlossenes Blatt (Mandelform) mit Basis bei (cx,baseY), Spitze bei (cx,tipY). */
function rundesBlatt(cx: number, baseY: number, tipY: number, breite: number): string {
  const laenge = tipY - baseY; // negativ = nach oben, positiv = nach unten
  const schulterY = baseY + laenge * 0.55;
  const f = (n: number) => n.toFixed(2);
  return (
    `M ${f(cx - breite)},${f(baseY)} ` +
    `C ${f(cx - breite)},${f(schulterY)} ${f(cx - breite * 0.35)},${f(tipY)} ${f(cx)},${f(tipY)} ` +
    `C ${f(cx + breite * 0.35)},${f(tipY)} ${f(cx + breite)},${f(schulterY)} ${f(cx + breite)},${f(baseY)} Z`
  );
}

/** Erzeugt einen sanft wellenförmigen Rankenpfad mit runden Blattakzenten an den Wellenbergen. */
export function arabeskeRanke(breite: number, hoehe: number, wellen = 4): ArabeskeRanke {
  const cy = hoehe / 2;
  const amplitude = hoehe * 0.28;
  const periode = breite / wellen;
  const halbPeriode = periode / 2;
  const blattBreite = halbPeriode * 0.16;
  const blattLaenge = amplitude * 0.6;

  let stammPfad = `M 0,${cy.toFixed(2)}`;
  const blaetter: ArabeskeBlatt[] = [];

  for (let i = 0; i < wellen; i++) {
    const x0 = i * periode;

    // Bergsegment (nach oben)
    const bergSpitzeX = x0 + halbPeriode / 2;
    const bergSpitzeY = cy - amplitude;
    stammPfad += ` C ${(x0 + halbPeriode * 0.25).toFixed(2)},${(cy - amplitude * 1.25).toFixed(2)} ${(x0 + halbPeriode * 0.75).toFixed(2)},${(cy - amplitude * 1.25).toFixed(2)} ${(x0 + halbPeriode).toFixed(2)},${cy.toFixed(2)}`;
    blaetter.push({ d: rundesBlatt(bergSpitzeX, bergSpitzeY, bergSpitzeY - blattLaenge, blattBreite) });

    // Talsegment (nach unten)
    const talSpitzeX = x0 + halbPeriode + halbPeriode / 2;
    const talSpitzeY = cy + amplitude;
    stammPfad += ` C ${(x0 + halbPeriode + halbPeriode * 0.25).toFixed(2)},${(cy + amplitude * 1.25).toFixed(2)} ${(x0 + halbPeriode + halbPeriode * 0.75).toFixed(2)},${(cy + amplitude * 1.25).toFixed(2)} ${(x0 + periode).toFixed(2)},${cy.toFixed(2)}`;
    blaetter.push({ d: rundesBlatt(talSpitzeX, talSpitzeY, talSpitzeY + blattLaenge, blattBreite) });
  }

  return { stammPfad, blaetter };
}
