import { supabase } from "../supabase";
import type { HunterState } from "../data/mock";
import type { Profile, Contract, Stat, Companion, Achievement } from "../data/types";
import {
  getAccounts,
  getTransactions,
  getBudgets,
  getSavingsGoals,
  getNetWorthHistory,
} from "./wealth";
import {
  getBodyStats,
  getWorkouts,
  getPersonalRecords,
  getTodayCheckin,
  getRecentCheckins,
} from "./body";
import { getEntries } from "./journal";
import { getSessions } from "./focus";

export async function fetchHunterStateFromSupabase(
  userId: string,
): Promise<Partial<HunterState> | null> {
  try {
    // 1. Perfil
    const { data: profileRow, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileErr || !profileRow) {
      console.log("No profile found for user:", userId);
      return null;
    }

    // La BD guarda avatar_silhouette/suit_palette/visor como columnas
    // planas; el frontend espera un objeto avatar_config anidado.
    const profile: Profile = {
      id: profileRow.id,
      username: profileRow.username,
      hunter_rank: profileRow.hunter_rank,
      level: profileRow.level,
      xp_total: profileRow.xp_total,
      archetype: profileRow.archetype,
      avatar_config: {
        silhouette: profileRow.avatar_silhouette,
        suit_palette: profileRow.suit_palette,
        visor: profileRow.visor,
      },
      currency: profileRow.theme_preferences?.currency || "cr",
      monthly_income: profileRow.theme_preferences?.monthly_income,
      theme_preferences: profileRow.theme_preferences,
      created_at: profileRow.created_at,
    };

    // 2. Contratos
    const { data: contracts } = await supabase
      .from("contracts")
      .select("*")
      .eq("profile_id", userId);

    // 3. Stats
    const { data: stats } = await supabase
      .from("stats")
      .select("*")
      .eq("profile_id", userId);

    // 4. Companion
    const { data: companion } = await supabase
      .from("companions")
      .select("*")
      .eq("profile_id", userId)
      .maybeSingle();

    // 5. Achievements
    const { data: achievements } = await supabase
      .from("achievements")
      .select("*")
      .eq("profile_id", userId);

    // 6. Routine Logs — columnas reales: log_date, completed (bool)
    const { data: routineLogs } = await supabase
      .from("routine_logs")
      .select("*")
      .eq("profile_id", userId);

    const routine_log: Record<string, string[]> = {};
    if (routineLogs) {
      for (const log of routineLogs) {
        if (!log.completed) continue;
        if (!routine_log[log.contract_id]) routine_log[log.contract_id] = [];
        routine_log[log.contract_id].push(log.log_date);
      }
    }

    // 7. Riqueza
    const [accounts, transactions, budgets, savings_goals, net_worth_history] =
      await Promise.all([
        getAccounts(userId),
        getTransactions(userId),
        getBudgets(userId),
        getSavingsGoals(userId),
        getNetWorthHistory(userId),
      ]);

    // 8. Cuerpo y Check-ins, 9. Bitácora de campo, y 10. Foco
    const [
      body_stats,
      workouts,
      personal_records,
      today_checkin,
      recent_checkins,
      journal_entries,
      focus_sessions,
    ] = await Promise.all([
      getBodyStats(userId),
      getWorkouts(userId),
      getPersonalRecords(userId),
      getTodayCheckin(userId),
      getRecentCheckins(userId, 14),
      getEntries(userId),
      getSessions(userId),
    ]);

    // No existe columna "credits": es la suma de los saldos de las cuentas.
    const credits = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

    // Energía real reportada en el check-in (escala 1-5 mapeada a 20-100%)
    const energy = today_checkin
      ? today_checkin.energy_level * 20
      : (recent_checkins[0] ? recent_checkins[0].energy_level * 20 : 60);

    return {
      profile,
      contracts: (contracts || []) as Contract[],
      stats: (stats || []) as Stat[],
      companion: (companion as Companion) || undefined,
      achievements: (achievements || []) as Achievement[],
      routine_log,
      accounts,
      transactions,
      budgets,
      savings_goals,
      net_worth_history,
      body_stats,
      workouts,
      personal_records,
      credits,
      energy,
      streak_days: 0, // Se calcula reactivamente en el estado con calculateStreakDays
      today_checkin,
      recent_checkins,
      journal_entries: journal_entries || [],
      focus_sessions: focus_sessions || [],
    };
  } catch (error) {
    console.error("Error fetching state from Supabase:", error);
    return null;
  }
}

// seedHunterStateToSupabase ya no es necesaria: el sembrado inicial
// ocurre ahora en createHunter (state/quarry.tsx) usando los datos
// que el jugador da en el onboarding.
export async function seedHunterStateToSupabase(initialState: HunterState): Promise<boolean> {
  return true;
}