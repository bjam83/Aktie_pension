/**
 * Forventet restlevetid — bruges til at beregne udbetalingslængden på en livsvarig livrente.
 *
 * Pensionsselskaberne slår ikke den nuværende gennemsnitslevealder op, men en *fremadrettet*
 * (kohorte-baseret) levetidsforudsætning på unisex-grundlag, der indregner forventede fremtidige
 * forbedringer i dødeligheden — det er derfor tallene ligger højere end fx Danmarks Statistiks
 * aktuelle middellevetid. Et typisk eksempel herfra: en 67-årig forventes i gennemsnit at blive
 * 86½ år, dvs. en restlevetid på 19½ år.
 *
 * Tabellen nedenfor er en forenklet tilnærmelse til den slags levetidsbenchmarks (fx Finanstilsynets),
 * kalibreret til at ramme det eksempel. Totallevealderen ligger nogenlunde fladt omkring 86-87 år i
 * 50-70-årsalderen og stiger derefter langsomt — det skyldes "overlevelsesbias": jo længere man
 * allerede har levet, jo mindre er den resterende risiko for at dø tidligt, så den forventede
 * levealder for dem der stadig er i live ved høj alder er højere end for befolkningen som helhed.
 */
const LIFE_EXPECTANCY_TABLE: [age: number, totalLifeExpectancy: number][] = [
  [50, 87.0],
  [55, 87.0],
  [60, 86.8],
  [65, 86.6],
  [67, 86.5],
  [70, 86.6],
  [75, 87.2],
  [80, 88.2],
  [85, 89.8],
  [90, 92.0],
];

function totalLifeExpectancy(age: number): number {
  const table = LIFE_EXPECTANCY_TABLE;
  if (age <= table[0][0]) return table[0][1];
  const last = table[table.length - 1];
  if (age >= last[0]) return last[1];
  for (let i = 0; i < table.length - 1; i++) {
    const [a0, e0] = table[i];
    const [a1, e1] = table[i + 1];
    if (age >= a0 && age <= a1) {
      const t = (age - a0) / (a1 - a0);
      return e0 + t * (e1 - e0);
    }
  }
  return last[1];
}

/** Forventet restlevetid (år, kan have decimaler) ved en given alder — unisex, fremadrettet skøn. */
export function remainingLifeExpectancy(age: number): number {
  return Math.max(1, totalLifeExpectancy(age) - age);
}
