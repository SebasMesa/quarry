import type { Archetype, AttributeKey, HunterRank } from "./types";

export const ARCHETYPES: {
  key: Archetype;
  label: string;
  boosts: AttributeKey[];
  multiplier: number;
  description: string;
}[] = [
  {
    key: "Mercenario",
    label: "Mercenario",
    boosts: ["vigor", "resistencia"],
    multiplier: 1.25,
    description:
      "Cobra en sudor. Potencia vigor y resistencia: contratos de fuerza bruta y jornadas largas.",
  },
  {
    key: "Tecnico",
    label: "Técnico",
    boosts: ["ingenio", "disciplina"],
    multiplier: 1.25,
    description:
      "Repara lo que otros abandonan. Potencia ingenio y disciplina: trabajo fino y sostenido.",
  },
  {
    key: "Comerciante",
    label: "Comerciante",
    boosts: ["reputacion", "ingenio"],
    multiplier: 1.25,
    description:
      "Todo tiene precio. Potencia reputación e ingenio: tratos, redes y créditos.",
  },
  {
    key: "Enviado",
    label: "Enviado",
    boosts: ["disciplina", "reputacion"],
    multiplier: 1.25,
    description:
      "Habla por otros. Potencia disciplina y reputación: rutas largas y palabra que se cumple.",
  },
];

export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  vigor: "Vigor",
  ingenio: "Ingenio",
  disciplina: "Disciplina",
  reputacion: "Reputación",
  resistencia: "Resistencia",
};

export const RANKS: HunterRank[] = [
  "Novato",
  "Cazador",
  "Veterano",
  "Elite",
  "Leyenda",
];

export const RANK_LABELS: Record<HunterRank, string> = {
  Novato: "Novato",
  Cazador: "Cazador",
  Veterano: "Veterano",
  Elite: "Élite",
  Leyenda: "Leyenda",
};

export const RANK_THRESHOLDS: Record<HunterRank, number> = {
  Novato: 0,
  Cazador: 2000,
  Veterano: 6000,
  Elite: 14000,
  Leyenda: 30000,
};

export function rankProgress(xpTotal: number) {
  let current: HunterRank = "Novato";
  for (const r of RANKS) {
    if (xpTotal >= RANK_THRESHOLDS[r]) current = r;
  }
  const idx = RANKS.indexOf(current);
  const next = idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
  const floor = RANK_THRESHOLDS[current];
  const ceil = next ? RANK_THRESHOLDS[next] : floor + 1;
  const pct = next
    ? Math.min(100, Math.round(((xpTotal - floor) / (ceil - floor)) * 100))
    : 100;
  return { current, next, floor, ceil, pct };
}
