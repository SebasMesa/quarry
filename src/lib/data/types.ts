export type AttributeKey =
  | "vigor"
  | "ingenio"
  | "disciplina"
  | "reputacion"
  | "resistencia";

export type ContractType = "mayor" | "menor" | "rutina";
export type ContractStatus = "pendiente" | "completado" | "vencido";
export type Archetype = "Mercenario" | "Tecnico" | "Comerciante" | "Enviado";
export type HunterRank = "Novato" | "Cazador" | "Veterano" | "Elite" | "Leyenda";

export interface AvatarConfig {
  silhouette: "ligera" | "pesada" | "esbelta" | "acorazada";
  suit_palette: string;
  visor: string;
}

export interface Profile {
  id: string;
  username: string;
  hunter_rank: HunterRank;
  level: number;
  xp_total: number;
  archetype: Archetype;
  avatar_config: AvatarConfig;
  currency?: string;
  monthly_income?: number;
  theme_preferences?: Record<string, any>;
  created_at: string;
}

export interface Stat {
  id: string;
  profile_id: string;
  attribute_key: AttributeKey;
  value: number;
  level: number;
  xp_current: number;
  xp_required: number;
}

export interface Sector {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  color_role: "primary" | "secondary" | "muted" | "danger" | "success";
}

export interface Contract {
  id: string;
  profile_id: string;
  sector_id: string;
  type: ContractType;
  title: string;
  description: string;
  difficulty: number;
  reward_xp: number;
  reward_credits: number;
  status: ContractStatus;
  recurrence: string | null;
  streak_count: number;
  due_date: string;
  completed_at: string | null;
  is_financial: boolean;
}

export interface Companion {
  id: string;
  profile_id: string;
  name: string;
  mood: string;
  level: number;
  xp: number;
  expedition_status: "disponible" | "en_expedicion" | "reparacion";
  last_expedition_at: string;
}

export interface Achievement {
  id: string;
  profile_id: string;
  key: string;
  title: string;
  description: string;
  unlocked_at: string | null;
}

/* ── Sector de Riqueza ────────────────────────────────────────────── */

export type AccountType = "billetera" | "banco" | "inversion";

export interface Account {
  id: string;
  profile_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency?: string;
}

export type TransactionType = "ingreso" | "gasto";

export interface Transaction {
  id: string;
  profile_id: string;
  account_id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
}

/** Sobre de presupuesto mensual por categoría (patrón envelope tipo YNAB). */
export interface BudgetEnvelope {
  id: string;
  profile_id: string;
  category: string;
  assigned: number;
  spent: number;
}

/** Meta de ahorro tratada como contrato de largo alcance. */
export interface SavingsGoal {
  id: string;
  profile_id: string;
  title: string;
  target: number;
  saved: number;
  monthly_contribution: number;
  deadline: string;
}

/** Punto histórico de patrimonio neto (cierre mensual). */
export interface NetWorthPoint {
  id: string;
  profile_id: string;
  month: string;
  net_worth: number;
}

/* ── Sector del Cuerpo ────────────────────────────────────────────── */

export type BodyMetric = "peso" | "medida" | "record_personal";

export interface BodyStat {
  id: string;
  profile_id: string;
  metric: BodyMetric;
  label: string;
  value: number;
  unit: string;
  recorded_at: string;
}

export interface Workout {
  id: string;
  profile_id: string;
  type: string;
  duration_minutes: number;
  notes: string;
  date: string;
}

/** Récord personal con objetivo declarado, para barras de progreso. */
export interface PersonalRecord {
  id: string;
  profile_id: string;
  lift: string;
  current: number;
  target: number;
  unit: string;
  achieved_at: string;
}

/** Check-in diario de energía y disposición física. */
export interface DailyCheckin {
  id: string;
  profile_id: string;
  checkin_date: string; // YYYY-MM-DD
  energy_level: number; // 1 a 5
  mood?: string | null;
  sleep_hours?: number | null;
  created_at?: string;
}

/* ── Sector de Bitácora / Diario ─────────────────────────────────── */

export type JournalPromptType = "manana" | "noche" | "libre";

export interface JournalEntry {
  id: string;
  profile_id: string;
  entry_date: string; // YYYY-MM-DD
  prompt_type: JournalPromptType;
  mood?: string | null;
  content: string;
  is_sealed: boolean;
  created_at?: string;
}

export interface FocusSession {
  id: string;
  profile_id: string;
  started_at: string;
  duration_minutes: number;
  label?: string | null;
  created_at?: string;
}

