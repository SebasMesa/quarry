export interface ThemeDefinition {
  id: string;
  name: string;
  // emoji: string;
  tagline: string;
  description: string;
  colors: {
    bg: string;
    primary: string;
    secondary: string;
    accent: string;
    warning: string;
  };
}

export const THEMES_CATALOG: ThemeDefinition[] = [
  {
    id: "cobre",
    name: "Cobre Original",
    // emoji: "🪨",
    tagline: "Terminal ámbar superviviente",
    description: "La paleta nativa de Quarry: ámbar cobrizo, carbón y latón.",
    colors: {
      bg: "#26201a",
      primary: "#d97706",
      secondary: "#ca8a04",
      accent: "#10b981",
      warning: "#ef4444",
    },
  },
  {
    id: "mora",
    name: "🫐",
    // emoji: "🫐",
    tagline: "Synth morado y fucsia eléctrico",
    description: "Berenjena noche con fucsia neón, cyan eléctrico y violeta.",
    colors: {
      bg: "#120b18",
      primary: "#f368e0",
      secondary: "#0abde3",
      accent: "#a55eea",
      warning: "#feca57",
    },
  },
  {
    id: "fosforo",
    name: "Terminal Fósforo",
    // emoji: "🟢",
    tagline: "Matrix retro monocromo P1",
    description: "Verde fósforo clásico de alta persistencia sobre negro puro.",
    colors: {
      bg: "#080d09",
      primary: "#00ff66",
      secondary: "#2ecc71",
      accent: "#00f0ff",
      warning: "#ff9f1c",
    },
  },
  {
    id: "hielo",
    name: "Ciber Hielo",
    // emoji: "❄️",
    tagline: "Ártico polar operativo",
    description: "Azul cielo eléctrico y zafiro glacial sobre abismo marino.",
    colors: {
      bg: "#090f17",
      primary: "#38bdf8",
      secondary: "#60a5fa",
      accent: "#2dd4bf",
      warning: "#f87171",
    },
  },
  {
    id: "monocromo",
    name: "Monocromo Táctico",
    // emoji: "⚙️",
    tagline: "Minimalismo militar puro",
    description: "Escala de titanio, plata ceniza y blanco tiza de alto contraste.",
    colors: {
      bg: "#101010",
      primary: "#ffffff",
      secondary: "#d4d4d4",
      accent: "#a3a3a3",
      warning: "#fb7185",
    },
  },
];

export const DEFAULT_THEME = "cobre";
