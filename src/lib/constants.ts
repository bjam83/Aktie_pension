export const SCHEME_TYPE_OPTIONS = [
  { value: "arbejdsmarkedspension", label: "Arbejdsmarkedspension" },
  { value: "ratepension", label: "Ratepension" },
  { value: "livrente", label: "Livrente" },
  { value: "aldersopsparing", label: "Aldersopsparing" },
  { value: "andet", label: "Andet" },
];

export const RETURN_BASIS_OPTIONS = [
  { value: "historical", label: "Historisk (manuelt)" },
  { value: "ytd", label: "Årets afkast" },
  { value: "blend", label: "Gennemsnit" },
];

export const ACCOUNT_KIND_OPTIONS = [
  { value: "frie_midler", label: "Depot (aktieindkomstskat, klassisk)" },
  { value: "aktiesparekonto", label: "Aktiesparekonto (flad ASK-skat)" },
  { value: "pensionsdepot", label: "Pensionsdepot (aktieindkomstskat)" },
];

export const INSTRUMENT_TYPE_OPTIONS = [
  { value: "aktie", label: "Aktie" },
  { value: "investeringsforening_aktiebaseret", label: "Investeringsforening (aktiebaseret)" },
  { value: "investeringsforening_obligationsbaseret", label: "Investeringsforening (obligationsbaseret)" },
  { value: "obligation", label: "Obligation" },
  { value: "kontant", label: "Kontant" },
];

export const ASSET_KIND_OPTIONS = [
  { value: "bolig", label: "Bolig" },
  { value: "bil", label: "Bil / køretøj" },
  { value: "bankindestaaende", label: "Bankindestående" },
  { value: "andet", label: "Andet" },
];

export const LIABILITY_KIND_OPTIONS = [
  { value: "realkredit", label: "Realkreditlån" },
  { value: "billaan", label: "Billån" },
  { value: "studielaan", label: "Studielån" },
  { value: "andet", label: "Andet" },
];

export const INCOME_KIND_OPTIONS = [
  { value: "løn", label: "Løn" },
  { value: "folkepension", label: "Folkepension" },
  { value: "atp", label: "ATP" },
  { value: "efterløn", label: "Efterløn" },
  { value: "andet", label: "Andet" },
];

export const INCOME_FREQUENCY_OPTIONS = [
  { value: "månedlig", label: "Månedlig" },
  { value: "årlig", label: "Årlig" },
];

export const BUDGET_FREQUENCY_OPTIONS = [
  { value: "månedlig", label: "Månedlig" },
  { value: "kvartalsvis", label: "Kvartalsvis" },
  { value: "halvårligt", label: "Halvårligt" },
  { value: "årlig", label: "Årlig" },
  { value: "engangs", label: "Engangs" },
];

export const BUDGET_DIRECTION_OPTIONS = [
  { value: "ud", label: "Udgift" },
  { value: "ind", label: "Indtægt" },
];

/** Deterministic chart color per person, so the same person keeps the same color across tabs. */
const PERSON_PALETTE = ["#1F7A6B", "#3E6E96", "#B25A38", "#C2922E"];
const PERSON_PALETTE_SOFT = ["#7FB9AC", "#9DBBD4", "#D79A7C", "#E2C788"];
export function personColor(index: number): string {
  return PERSON_PALETTE[index % PERSON_PALETTE.length];
}
export function personColorSoft(index: number): string {
  return PERSON_PALETTE_SOFT[index % PERSON_PALETTE_SOFT.length];
}

export function labelFor(options: { value: string; label: string }[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

/** Converts any budget/income frequency to a monthly amount. */
export function toMonthly(amount: number, frequency: string): number {
  switch (frequency) {
    case "årlig":
      return amount / 12;
    case "halvårligt":
      return amount / 6;
    case "kvartalsvis":
      return amount / 3;
    case "engangs":
      return 0;
    default:
      return amount;
  }
}
