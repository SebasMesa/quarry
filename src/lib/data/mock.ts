import type {
  Account,
  Achievement,
  BodyStat,
  BudgetEnvelope,
  Companion,
  Contract,
  NetWorthPoint,
  PersonalRecord,
  Profile,
  SavingsGoal,
  Sector,
  Stat,
  Transaction,
  Workout,
  DailyCheckin,
  JournalEntry,
  FocusSession,
} from "./types";

const PROFILE_ID = "prf_0001";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function today(hour = 23, min = 59) {
  const d = new Date();
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

const profile: Profile = {
  id: PROFILE_ID,
  username: "Vex Corrall",
  hunter_rank: "Veterano",
  level: 17,
  xp_total: 8420,
  archetype: "Tecnico",
  avatar_config: {
    silhouette: "ligera",
    suit_palette: "#C17F3E",
    visor: "#5F8F7A",
  },
  created_at: daysAgo(214),
};

const stats: Stat[] = [
  {
    id: "st_1",
    profile_id: PROFILE_ID,
    attribute_key: "vigor",
    value: 62,
    level: 12,
    xp_current: 340,
    xp_required: 600,
  },
  {
    id: "st_2",
    profile_id: PROFILE_ID,
    attribute_key: "ingenio",
    value: 84,
    level: 19,
    xp_current: 510,
    xp_required: 900,
  },
  {
    id: "st_3",
    profile_id: PROFILE_ID,
    attribute_key: "disciplina",
    value: 71,
    level: 15,
    xp_current: 220,
    xp_required: 750,
  },
  {
    id: "st_4",
    profile_id: PROFILE_ID,
    attribute_key: "reputacion",
    value: 48,
    level: 9,
    xp_current: 130,
    xp_required: 450,
  },
  {
    id: "st_5",
    profile_id: PROFILE_ID,
    attribute_key: "resistencia",
    value: 57,
    level: 11,
    xp_current: 405,
    xp_required: 550,
  },
];

const sectors: Sector[] = [
  {
    id: "sec_mando",
    key: "mando",
    name: "Panel de mando",
    description: "Estado general del cazador y contratos del día.",
    icon: "radar",
    color_role: "primary",
  },
  {
    id: "sec_rutinas",
    key: "rutinas",
    name: "Rutinas",
    description: "Registro diario de rutinas y rachas.",
    icon: "grid",
    color_role: "secondary",
  },
  {
    id: "sec_riqueza",
    key: "riqueza",
    name: "Riqueza",
    description: "Créditos, cuentas, presupuesto y metas de ahorro.",
    icon: "coins",
    color_role: "muted",
  },
  {
    id: "sec_cuerpo",
    key: "cuerpo",
    name: "Cuerpo",
    description: "Estado físico, entrenamientos y récords personales.",
    icon: "activity",
    color_role: "muted",
  },
  {
    id: "sec_hoja",
    key: "hoja",
    name: "Hoja de cazador",
    description: "Atributos, arquetipo e insignias.",
    icon: "id",
    color_role: "primary",
  },
];

const contracts: Contract[] = [
  {
    id: "ct_01",
    profile_id: PROFILE_ID,
    sector_id: "sec_mando",
    type: "mayor",
    title: "Cerrar el módulo de facturación del cliente Kessler",
    description:
      "Tres semanas de trabajo pendiente. Entrega parcial aceptada, cierre completo exigido.",
    difficulty: 5,
    reward_xp: 480,
    reward_credits: 0,
    status: "pendiente",
    recurrence: null,
    streak_count: 0,
    due_date: today(20, 0),
    completed_at: null,
    is_financial: false,
  },
  {
    id: "ct_02",
    profile_id: PROFILE_ID,
    sector_id: "sec_mando",
    type: "mayor",
    title: "Preparar defensa del presupuesto trimestral",
    description: "Reunión con el consejo. Requiere cifras verificadas.",
    difficulty: 4,
    reward_xp: 300,
    reward_credits: 0,
    status: "vencido",
    recurrence: null,
    streak_count: 0,
    due_date: daysAgo(2),
    completed_at: null,
    is_financial: false,
  },
  {
    id: "ct_03",
    profile_id: PROFILE_ID,
    sector_id: "sec_mando",
    type: "menor",
    title: "Responder el correo de la agencia portuaria",
    description: "Pendiente desde ayer. Diez minutos de trabajo real.",
    difficulty: 1,
    reward_xp: 40,
    reward_credits: 0,
    status: "pendiente",
    recurrence: null,
    streak_count: 0,
    due_date: today(18, 0),
    completed_at: null,
    is_financial: false,
  },
  {
    id: "ct_04",
    profile_id: PROFILE_ID,
    sector_id: "sec_mando",
    type: "menor",
    title: "Reponer suministros de la despensa",
    description: "Lista corta: agua, proteína, filtros.",
    difficulty: 2,
    reward_xp: 60,
    reward_credits: 0,
    status: "completado",
    recurrence: null,
    streak_count: 0,
    due_date: today(12, 0),
    completed_at: daysAgo(0),
    is_financial: false,
  },
  {
    id: "ct_05",
    profile_id: PROFILE_ID,
    sector_id: "sec_mando",
    type: "menor",
    title: "Revisar el contrato de arrendamiento del hangar",
    description: "Cláusula 7 sospechosa. Leer con calma.",
    difficulty: 3,
    reward_xp: 90,
    reward_credits: 0,
    status: "pendiente",
    recurrence: null,
    streak_count: 0,
    due_date: today(22, 0),
    completed_at: null,
    is_financial: false,
  },
  {
    id: "ct_06",
    profile_id: PROFILE_ID,
    sector_id: "sec_rutinas",
    type: "rutina",
    title: "Marcha de 5 km al amanecer",
    description: "Antes de que el polvo se levante.",
    difficulty: 2,
    reward_xp: 70,
    reward_credits: 0,
    status: "completado",
    recurrence: "diaria",
    streak_count: 18,
    due_date: today(8, 0),
    completed_at: daysAgo(0),
    is_financial: false,
  },
  {
    id: "ct_07",
    profile_id: PROFILE_ID,
    sector_id: "sec_rutinas",
    type: "rutina",
    title: "Registrar bitácora del día",
    description: "Tres líneas mínimo, sin adornos.",
    difficulty: 1,
    reward_xp: 45,
    reward_credits: 0,
    status: "pendiente",
    recurrence: "diaria",
    streak_count: 31,
    due_date: today(23, 0),
    completed_at: null,
    is_financial: false,
  },
  {
    id: "ct_08",
    profile_id: PROFILE_ID,
    sector_id: "sec_rutinas",
    type: "rutina",
    title: "Cuarenta minutos de estudio técnico",
    description: "Manual de sistemas hidráulicos, capítulo abierto.",
    difficulty: 3,
    reward_xp: 85,
    reward_credits: 0,
    status: "pendiente",
    recurrence: "diaria",
    streak_count: 12,
    due_date: today(21, 30),
    completed_at: null,
    is_financial: false,
  },
  {
    id: "ct_09",
    profile_id: PROFILE_ID,
    sector_id: "sec_rutinas",
    type: "rutina",
    title: "Mantenimiento del taller",
    description: "Herramienta usada, herramienta guardada.",
    difficulty: 1,
    reward_xp: 35,
    reward_credits: 0,
    status: "completado",
    recurrence: "diaria",
    streak_count: 7,
    due_date: today(19, 0),
    completed_at: daysAgo(0),
    is_financial: false,
  },
  {
    id: "ct_10",
    profile_id: PROFILE_ID,
    sector_id: "sec_rutinas",
    type: "rutina",
    title: "Ración de agua completa",
    description: "Tres litros. Sin excusas de clima.",
    difficulty: 1,
    reward_xp: 30,
    reward_credits: 0,
    status: "pendiente",
    recurrence: "diaria",
    streak_count: 24,
    due_date: today(23, 59),
    completed_at: null,
    is_financial: false,
  },
];

const companion: Companion = {
  id: "cmp_01",
  profile_id: PROFILE_ID,
  name: "TESSA-9",
  mood: "Sarcástica pero operativa",
  level: 6,
  xp: 1240,
  expedition_status: "en_expedicion",
  last_expedition_at: daysAgo(1),
};

const achievements: Achievement[] = [
  {
    id: "ach_01",
    profile_id: PROFILE_ID,
    key: "primera_marca",
    title: "Primera marca",
    description: "Cerraste tu primer contrato registrado.",
    unlocked_at: daysAgo(213),
  },
  {
    id: "ach_02",
    profile_id: PROFILE_ID,
    key: "racha_7",
    title: "Siete amaneceres",
    description: "Siete días consecutivos con todas las rutinas cerradas.",
    unlocked_at: daysAgo(96),
  },
  {
    id: "ach_03",
    profile_id: PROFILE_ID,
    key: "racha_30",
    title: "Un ciclo entero",
    description: "Treinta días consecutivos de registro sin fallar.",
    unlocked_at: daysAgo(11),
  },
  {
    id: "ach_04",
    profile_id: PROFILE_ID,
    key: "mayor_x10",
    title: "Peso pesado",
    description: "Diez contratos mayores completados.",
    unlocked_at: daysAgo(42),
  },
  {
    id: "ach_05",
    profile_id: PROFILE_ID,
    key: "droide_leal",
    title: "Chatarra leal",
    description: "Tu droide alcanzó el nivel 5 en expediciones.",
    unlocked_at: daysAgo(29),
  },
  {
    id: "ach_06",
    profile_id: PROFILE_ID,
    key: "rango_elite",
    title: "Sello de élite",
    description: "Alcanza el rango Élite.",
    unlocked_at: null,
  },
  {
    id: "ach_07",
    profile_id: PROFILE_ID,
    key: "racha_100",
    title: "Cien polvaredas",
    description: "Cien días consecutivos de registro.",
    unlocked_at: null,
  },
  {
    id: "ach_08",
    profile_id: PROFILE_ID,
    key: "cofre_lleno",
    title: "Bodega llena",
    description: "Acumula 10 000 créditos sin gastarlos.",
    unlocked_at: null,
  },
  {
    id: "ach_09",
    profile_id: PROFILE_ID,
    key: "sin_vencidos",
    title: "Ninguno se escapa",
    description: "Un mes completo sin contratos vencidos.",
    unlocked_at: null,
  },
];

export interface HunterState {
  profile: Profile;
  stats: Stat[];
  sectors: Sector[];
  contracts: Contract[];
  companion: Companion;
  achievements: Achievement[];
  credits: number;
  energy: number;
  streak_days: number;
  routine_log: Record<string, string[]>; // contract_id -> ISO dates (yyyy-mm-dd)
  accounts: Account[];
  transactions: Transaction[];
  budgets: BudgetEnvelope[];
  savings_goals: SavingsGoal[];
  net_worth_history: NetWorthPoint[];
  body_stats: BodyStat[];
  workouts: Workout[];
  personal_records: PersonalRecord[];
  today_checkin?: DailyCheckin | null;
  recent_checkins?: DailyCheckin[];
  journal_entries?: JournalEntry[];
  focus_sessions?: FocusSession[];
}

function buildRoutineLog(): Record<string, string[]> {
  const log: Record<string, string[]> = {};
  const routines = contracts.filter((c) => c.type === "rutina");
  routines.forEach((r, i) => {
    const dates: string[] = [];
    for (let d = 0; d < 35; d++) {
      const seed = (d * 7 + i * 13) % 10;
      if (seed > 2 || d < r.streak_count / 2) {
        const day = new Date();
        day.setDate(day.getDate() - d);
        dates.push(day.toISOString().slice(0, 10));
      }
    }
    if (r.status !== "completado") {
      const t = new Date().toISOString().slice(0, 10);
      log[r.id] = dates.filter((x) => x !== t);
    } else {
      log[r.id] = dates;
    }
  });
  return log;
}

/** Capa de acceso a datos. Reemplazar por llamadas reales más adelante. */
export function getProfile(): Profile {
  return { ...profile };
}
export function getStats(): Stat[] {
  return stats.map((s) => ({ ...s }));
}
export function getSectors(): Sector[] {
  return sectors.map((s) => ({ ...s }));
}
export function getContracts(): Contract[] {
  return contracts.map((c) => ({ ...c }));
}
export function getCompanion(): Companion {
  return { ...companion };
}
export function getAchievements(): Achievement[] {
  return achievements.map((a) => ({ ...a }));
}
export function getInitialState(): HunterState {
  return {
    profile: getProfile(),
    stats: getStats(),
    sectors: getSectors(),
    contracts: getContracts(),
    companion: getCompanion(),
    achievements: getAchievements(),
    credits: 4820,
    energy: 68,
    streak_days: 31,
    routine_log: buildRoutineLog(),
    accounts: getAccounts(),
    transactions: getTransactions(),
    budgets: getBudgets(),
    savings_goals: getSavingsGoals(),
    net_worth_history: getNetWorthHistory(),
    body_stats: getBodyStats(),
    workouts: getWorkouts(),
    personal_records: getPersonalRecords(),
    journal_entries: [],
    focus_sessions: [],
  };
}

/* ══════════════════════════════════════════════════════════════════
   SECTOR DE RIQUEZA · datos de ejemplo
   ══════════════════════════════════════════════════════════════════ */

const accounts: Account[] = [
  {
    id: "acc_01",
    profile_id: PROFILE_ID,
    name: "Billetera de a bordo",
    type: "billetera",
    balance: 4820,
  },
  {
    id: "acc_02",
    profile_id: PROFILE_ID,
    name: "Depósito Portuario Kessler",
    type: "banco",
    balance: 18640,
  },
  {
    id: "acc_03",
    profile_id: PROFILE_ID,
    name: "Reserva de emergencia",
    type: "banco",
    balance: 9200,
  },
  {
    id: "acc_04",
    profile_id: PROFILE_ID,
    name: "Fondo de chatarra rara",
    type: "inversion",
    balance: 27310,
  },
  {
    id: "acc_05",
    profile_id: PROFILE_ID,
    name: "Participación en el hangar 7",
    type: "inversion",
    balance: 12450,
  },
];

function dateAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const transactions: Transaction[] = [
  {
    id: "tx_01",
    profile_id: PROFILE_ID,
    account_id: "acc_02",
    amount: 3200,
    type: "ingreso",
    category: "Contratos",
    description: "Liquidación parcial · módulo Kessler",
    date: dateAgo(1),
  },
  {
    id: "tx_02",
    profile_id: PROFILE_ID,
    account_id: "acc_01",
    amount: 214,
    type: "gasto",
    category: "Suministros",
    description: "Agua filtrada, proteína, filtros de repuesto",
    date: dateAgo(1),
  },
  {
    id: "tx_03",
    profile_id: PROFILE_ID,
    account_id: "acc_02",
    amount: 890,
    type: "gasto",
    category: "Hangar",
    description: "Arrendamiento mensual del hangar 7",
    date: dateAgo(3),
  },
  {
    id: "tx_04",
    profile_id: PROFILE_ID,
    account_id: "acc_01",
    amount: 68,
    type: "gasto",
    category: "Combustible",
    description: "Recarga de celdas · estación orbital baja",
    date: dateAgo(4),
  },
  {
    id: "tx_05",
    profile_id: PROFILE_ID,
    account_id: "acc_04",
    amount: 1450,
    type: "ingreso",
    category: "Inversión",
    description: "Venta de núcleo de navegación recuperado",
    date: dateAgo(6),
  },
  {
    id: "tx_06",
    profile_id: PROFILE_ID,
    account_id: "acc_01",
    amount: 132,
    type: "gasto",
    category: "Mantenimiento",
    description: "Sellado de junta del traje ligero",
    date: dateAgo(7),
  },
  {
    id: "tx_07",
    profile_id: PROFILE_ID,
    account_id: "acc_02",
    amount: 410,
    type: "gasto",
    category: "Suministros",
    description: "Raciones de ciclo largo",
    date: dateAgo(9),
  },
  {
    id: "tx_08",
    profile_id: PROFILE_ID,
    account_id: "acc_03",
    amount: 600,
    type: "ingreso",
    category: "Ahorro",
    description: "Traspaso automático a reserva",
    date: dateAgo(10),
  },
  {
    id: "tx_09",
    profile_id: PROFILE_ID,
    account_id: "acc_01",
    amount: 95,
    type: "gasto",
    category: "Droide",
    description: "Piezas de repuesto para VX-9",
    date: dateAgo(12),
  },
  {
    id: "tx_10",
    profile_id: PROFILE_ID,
    account_id: "acc_02",
    amount: 1800,
    type: "ingreso",
    category: "Contratos",
    description: "Contrato menor · auditoría portuaria",
    date: dateAgo(14),
  },
  {
    id: "tx_11",
    profile_id: PROFILE_ID,
    account_id: "acc_01",
    amount: 240,
    type: "gasto",
    category: "Combustible",
    description: "Salto corto al cinturón interior",
    date: dateAgo(17),
  },
  {
    id: "tx_12",
    profile_id: PROFILE_ID,
    account_id: "acc_02",
    amount: 320,
    type: "gasto",
    category: "Hangar",
    description: "Cuota de amarre y vigilancia",
    date: dateAgo(21),
  },
];

const budgets: BudgetEnvelope[] = [
  {
    id: "bg_01",
    profile_id: PROFILE_ID,
    category: "Suministros",
    assigned: 700,
    spent: 624,
  },
  { id: "bg_02", profile_id: PROFILE_ID, category: "Hangar", assigned: 1250, spent: 1210 },
  {
    id: "bg_03",
    profile_id: PROFILE_ID,
    category: "Combustible",
    assigned: 450,
    spent: 308,
  },
  {
    id: "bg_04",
    profile_id: PROFILE_ID,
    category: "Mantenimiento",
    assigned: 300,
    spent: 132,
  },
  { id: "bg_05", profile_id: PROFILE_ID, category: "Droide", assigned: 150, spent: 95 },
];

const savingsGoals: SavingsGoal[] = [
  {
    id: "sg_01",
    profile_id: PROFILE_ID,
    title: "Reserva de seis ciclos sin contratos",
    target: 14000,
    saved: 9200,
    monthly_contribution: 600,
    deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 8, 1).toISOString(),
  },
  {
    id: "sg_02",
    profile_id: PROFILE_ID,
    title: "Reemplazo del núcleo de salto",
    target: 22000,
    saved: 7450,
    monthly_contribution: 950,
    deadline: new Date(new Date().getFullYear() + 1, 4, 1).toISOString(),
  },
];

const MONTH_LABELS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const NET_WORTH_SERIES = [
  58900, 59750, 58120, 60480, 62300, 61840, 64120, 66980, 68210, 67540, 70180, 72420,
];

const netWorthHistory: NetWorthPoint[] = NET_WORTH_SERIES.map((v, i) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - (NET_WORTH_SERIES.length - 1 - i));
  return {
    id: `nw_${i + 1}`,
    profile_id: PROFILE_ID,
    month: `${MONTH_LABELS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
    net_worth: v,
  };
});

/* ══════════════════════════════════════════════════════════════════
   SECTOR DEL CUERPO · datos de ejemplo
   ══════════════════════════════════════════════════════════════════ */

const WEIGHT_SERIES = [
  84.2, 83.9, 83.4, 83.6, 82.8, 82.5, 82.1, 81.9, 81.4, 81.6, 80.9, 80.4,
];

const bodyStats: BodyStat[] = [
  ...WEIGHT_SERIES.map((v, i) => ({
    id: `bs_w${i + 1}`,
    profile_id: PROFILE_ID,
    metric: "peso" as const,
    label: "Masa corporal",
    value: v,
    unit: "kg",
    recorded_at: dateAgo((WEIGHT_SERIES.length - 1 - i) * 7),
  })),
  {
    id: "bs_m1",
    profile_id: PROFILE_ID,
    metric: "medida",
    label: "Cintura",
    value: 84,
    unit: "cm",
    recorded_at: dateAgo(3),
  },
  {
    id: "bs_m2",
    profile_id: PROFILE_ID,
    metric: "medida",
    label: "Pecho",
    value: 103,
    unit: "cm",
    recorded_at: dateAgo(3),
  },
  {
    id: "bs_m3",
    profile_id: PROFILE_ID,
    metric: "medida",
    label: "Brazo",
    value: 37.5,
    unit: "cm",
    recorded_at: dateAgo(3),
  },
  {
    id: "bs_m4",
    profile_id: PROFILE_ID,
    metric: "medida",
    label: "Muslo",
    value: 58,
    unit: "cm",
    recorded_at: dateAgo(3),
  },
  {
    id: "bs_pr1",
    profile_id: PROFILE_ID,
    metric: "record_personal",
    label: "Sentadilla · 1RM",
    value: 132,
    unit: "kg",
    recorded_at: dateAgo(11),
  },
  {
    id: "bs_pr2",
    profile_id: PROFILE_ID,
    metric: "record_personal",
    label: "Peso muerto · 1RM",
    value: 165,
    unit: "kg",
    recorded_at: dateAgo(18),
  },
  {
    id: "bs_pr3",
    profile_id: PROFILE_ID,
    metric: "record_personal",
    label: "Press banca · 1RM",
    value: 92,
    unit: "kg",
    recorded_at: dateAgo(25),
  },
  {
    id: "bs_pr4",
    profile_id: PROFILE_ID,
    metric: "record_personal",
    label: "5 km en carrera",
    value: 24.4,
    unit: "min",
    recorded_at: dateAgo(6),
  },
];

const personalRecords: PersonalRecord[] = [
  {
    id: "pr_01",
    profile_id: PROFILE_ID,
    lift: "Sentadilla · 1RM",
    current: 132,
    target: 150,
    unit: "kg",
    achieved_at: dateAgo(11),
  },
  {
    id: "pr_02",
    profile_id: PROFILE_ID,
    lift: "Peso muerto · 1RM",
    current: 165,
    target: 180,
    unit: "kg",
    achieved_at: dateAgo(18),
  },
  {
    id: "pr_03",
    profile_id: PROFILE_ID,
    lift: "Press banca · 1RM",
    current: 92,
    target: 100,
    unit: "kg",
    achieved_at: dateAgo(25),
  },
  {
    id: "pr_04",
    profile_id: PROFILE_ID,
    lift: "Dominadas lastradas",
    current: 22,
    target: 30,
    unit: "kg",
    achieved_at: dateAgo(9),
  },
];

const WORKOUT_SEED: Array<[number, string, number, string]> = [
  [0, "Fuerza · tren inferior", 68, "Sentadilla 5x5 a 108 kg. Última serie limpia."],
  [1, "Movilidad", 22, "Cadera y tobillo. Sesión corta antes del turno."],
  [2, "Carrera continua", 41, "7,2 km a ritmo cómodo. Pulso estable."],
  [4, "Fuerza · empuje", 63, "Press banca 4x6 a 78 kg. Hombro derecho tenso."],
  [5, "Intervalos", 32, "8 series de 400 m. Reservas al límite."],
  [7, "Fuerza · tirón", 71, "Peso muerto 4x4 a 145 kg. Buen agarre."],
  [8, "Carrera continua", 38, "6,5 km. Aire seco en el sector bajo."],
  [10, "Fuerza · tren inferior", 66, "Zancadas y prensa. Volumen moderado."],
  [11, "Natación", 45, "1500 m suaves. Recuperación activa."],
  [13, "Fuerza · empuje", 58, "Press militar 5x5 a 52 kg."],
  [15, "Carrera larga", 74, "12 km. Ritmo de contrato de resistencia."],
  [17, "Movilidad", 25, "Columna torácica y cadera."],
  [19, "Fuerza · tirón", 69, "Remo pesado y dominadas lastradas."],
  [22, "Intervalos", 30, "Cuestas cortas. Piernas cargadas."],
  [25, "Fuerza · tren inferior", 64, "Sentadilla frontal técnica."],
];

const workouts: Workout[] = WORKOUT_SEED.map(([d, type, mins, notes], i) => ({
  id: `wk_${String(i + 1).padStart(2, "0")}`,
  profile_id: PROFILE_ID,
  type,
  duration_minutes: mins,
  notes,
  date: dateAgo(d),
}));

/* ══════════════════════════════════════════════════════════════════
   CONTRATOS DE LOS NUEVOS SECTORES
   ══════════════════════════════════════════════════════════════════ */

const sectorContracts: Contract[] = [
  {
    id: "ct_r1",
    profile_id: PROFILE_ID,
    sector_id: "sec_riqueza",
    type: "mayor",
    title: "Elevar la reserva de emergencia a 14 000 créditos",
    description:
      "Seis ciclos de autonomía sin depender de contratos nuevos. Traspaso automático de 600 cr al mes.",
    difficulty: 4,
    reward_xp: 420,
    reward_credits: 0,
    status: "pendiente",
    recurrence: null,
    streak_count: 0,
    due_date: today(21, 0),
    completed_at: null,
    is_financial: false,
  },
  {
    id: "ct_r2",
    profile_id: PROFILE_ID,
    sector_id: "sec_riqueza",
    type: "menor",
    title: "Renegociar la cuota de amarre del hangar 7",
    description: "El sobre de Hangar lleva tres ciclos desbordado. Buscar contrato anual.",
    difficulty: 3,
    reward_xp: 120,
    reward_credits: 0,
    status: "pendiente",
    recurrence: null,
    streak_count: 0,
    due_date: today(19, 0),
    completed_at: null,
    is_financial: false,
  },
  {
    id: "ct_r3",
    profile_id: PROFILE_ID,
    sector_id: "sec_riqueza",
    type: "rutina",
    title: "Conciliar movimientos de la semana",
    description: "Diez minutos de revisión: categorías, duplicados, gastos fantasma.",
    difficulty: 2,
    reward_xp: 55,
    reward_credits: 0,
    status: "pendiente",
    recurrence: "semanal",
    streak_count: 9,
    due_date: today(21, 30),
    completed_at: null,
    is_financial: false,
  },
  {
    id: "ct_c1",
    profile_id: PROFILE_ID,
    sector_id: "sec_cuerpo",
    type: "mayor",
    title: "Sentadilla de 150 kg antes del cierre del ciclo",
    description: "18 kg por encima del récord actual. Progresión de 2,5 kg por semana.",
    difficulty: 5,
    reward_xp: 500,
    reward_credits: 0,
    status: "pendiente",
    recurrence: null,
    streak_count: 0,
    due_date: today(20, 0),
    completed_at: null,
    is_financial: false,
  },
  {
    id: "ct_c2",
    profile_id: PROFILE_ID,
    sector_id: "sec_cuerpo",
    type: "rutina",
    title: "Cuatro sesiones de entrenamiento por semana",
    description: "Dos de fuerza, dos de resistencia. El volumen se registra en la bitácora.",
    difficulty: 3,
    reward_xp: 110,
    reward_credits: 0,
    status: "pendiente",
    recurrence: "semanal",
    streak_count: 14,
    due_date: today(22, 0),
    completed_at: null,
    is_financial: false,
  },
  {
    id: "ct_c3",
    profile_id: PROFILE_ID,
    sector_id: "sec_cuerpo",
    type: "menor",
    title: "Registrar medidas y masa corporal del ciclo",
    description: "Cintura, pecho, brazo y muslo. Misma hora, mismo estado.",
    difficulty: 1,
    reward_xp: 45,
    reward_credits: 0,
    status: "completado",
    recurrence: null,
    streak_count: 0,
    due_date: today(9, 0),
    completed_at: dateAgo(0),
    is_financial: false,
  },
];

contracts.push(...sectorContracts);

/* Capa de acceso · sectores Riqueza y Cuerpo */
export function getAccounts(): Account[] {
  return accounts.map((a) => ({ ...a }));
}
export function getTransactions(): Transaction[] {
  return transactions.map((t) => ({ ...t }));
}
export function getBudgets(): BudgetEnvelope[] {
  return budgets.map((b) => ({ ...b }));
}
export function getSavingsGoals(): SavingsGoal[] {
  return savingsGoals.map((g) => ({ ...g }));
}
export function getNetWorthHistory(): NetWorthPoint[] {
  return netWorthHistory.map((n) => ({ ...n }));
}
export function getBodyStats(): BodyStat[] {
  return bodyStats.map((b) => ({ ...b }));
}
export function getWorkouts(): Workout[] {
  return workouts.map((w) => ({ ...w }));
}
export function getPersonalRecords(): PersonalRecord[] {
  return personalRecords.map((p) => ({ ...p }));
}
