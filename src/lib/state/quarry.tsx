import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { getInitialState, type HunterState } from "@/lib/data/mock";
import { ARCHETYPES, rankProgress } from "@/lib/data/archetypes";
import { getSectors } from "@/lib/api/sectors";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import {
  fetchHunterStateFromSupabase,
  seedHunterStateToSupabase,
} from "@/lib/api/quarry-sync";
import { updateContract, toggleRoutineLog, createContract } from "@/lib/api/contracts";
import { updateProfile, createStat, createCompanion, createProfile, updateCompanion } from "@/lib/api/profile";
import {
  createAccount,
  createNetWorthPoint,
  upsertNetWorthPoint,
  createTransaction,
  updateAccountBalance,
  createBudget,
  createSavingsGoal,
  contributeToSavingsGoal,
} from "@/lib/api/wealth";
import {
  createBodyStat,
  createWorkout,
  createPersonalRecord,
  updatePersonalRecord,
  upsertCheckin,
} from "@/lib/api/body";
import {
  createEntry,
  updateEntry,
  deleteEntry,
} from "@/lib/api/journal";
import { createSession } from "@/lib/api/focus";
import type {
  Account,
  Achievement,
  Archetype,
  AttributeKey,
  AvatarConfig,
  BodyStat,
  BudgetEnvelope,
  Contract,
  DailyCheckin,
  JournalEntry,
  FocusSession,
  NetWorthPoint,
  PersonalRecord,
  SavingsGoal,
  Transaction,
  Workout,
} from "@/lib/data/types";
import { calculateStreakDays } from "@/lib/state/hunter-metrics";
import { unlockAchievement } from "@/lib/api/achievements";
import { checkAndUnlockAchievements } from "@/lib/state/achievements-engine";
import { DEFAULT_THEME } from "@/lib/state/themes";

const ATTR_BY_TYPE: Record<string, AttributeKey> = {
  mayor: "ingenio",
  menor: "disciplina",
  rutina: "resistencia",
};

async function syncCurrentMonthNetWorth(
  profileId: string,
  accounts: Account[],
  currentHistory: NetWorthPoint[]
): Promise<NetWorthPoint[]> {
  const currentNetWorth = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthKey = `${monthPrefix}-01`;

  const existingInHistory = currentHistory.find((p) => p.month.startsWith(monthPrefix));

  if (existingInHistory && existingInHistory.net_worth === currentNetWorth) {
    return currentHistory;
  }

  const syncedPoint = await upsertNetWorthPoint(profileId, monthKey, currentNetWorth);
  if (!syncedPoint) return currentHistory;

  if (existingInHistory) {
    return currentHistory.map((p) =>
      p.month.startsWith(monthPrefix) ? syncedPoint : p
    );
  } else {
    return [...currentHistory, syncedPoint].sort((a, b) => a.month.localeCompare(b.month));
  }
}

interface CreateHunterInput {
  username: string;
  archetype: Archetype;
  avatar_config: AvatarConfig;
  /** Nombre del droide compañero */
  droidName?: string;
  /** Tono / humor del droide */
  droidMood?: string;
  /** Moneda base elegida (ej. COP, USD, EUR, cr) */
  currency?: string;
  /** Créditos o saldo con el que arranca el cazador (va a la cuenta principal). */
  initialCredits?: number;
  /** Ingreso mensual estimado */
  monthlyIncome?: number;
  /** Nombre de la cuenta principal creada al onboardear (ej. "Billetera"). */
  accountName?: string;
  /** Peso inicial en kg, opcional. */
  initialWeight?: number;
}

interface QuarryContextValue {
  state: HunterState | null; // puede ser null mientras carga o si no hay usuario
  onboarded: boolean;
  dbConnected: boolean;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  completeContract: (id: string, amount?: number) => void;
  toggleRoutineDay: (contractId: string, date: string) => void;
  createHunter: (input: CreateHunterInput) => void;
  signOut: () => Promise<void>;
  addTransaction: (tx: Omit<Transaction, "id" | "profile_id">) => Promise<Transaction | null>;
  addAccount: (acc: Omit<Account, "id" | "profile_id">) => Promise<Account | null>;
  addBudget: (bg: Omit<BudgetEnvelope, "id" | "profile_id" | "spent">) => Promise<BudgetEnvelope | null>;
  addSavingsGoal: (goal: Omit<SavingsGoal, "id" | "profile_id" | "saved">) => Promise<SavingsGoal | null>;
  contributeToGoal: (goalId: string, amount: number, accountId?: string) => Promise<boolean>;
  addBodyStat: (stat: Omit<BodyStat, "id" | "profile_id">) => Promise<BodyStat | null>;
  addWorkout: (w: Omit<Workout, "id" | "profile_id">) => Promise<Workout | null>;
  addPersonalRecord: (pr: Omit<PersonalRecord, "id" | "profile_id">) => Promise<PersonalRecord | null>;
  updatePersonalRecordValue: (id: string, current: number) => Promise<void>;
  addContract: (c: Omit<Contract, "id" | "profile_id" | "status" | "streak_count" | "completed_at">) => Promise<Contract | null>;
  sendDroidOnExpedition: () => Promise<boolean>;
  claimDroidExpedition: () => Promise<{ xpGained: number; newLevel: number } | null>;
  submitDailyCheckin: (input: { energy_level: number; mood?: string | null; sleep_hours?: number | null; checkin_date?: string }) => Promise<DailyCheckin | null>;
  addJournalEntry: (entry: Omit<JournalEntry, "id" | "profile_id" | "created_at">) => Promise<JournalEntry | null>;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => Promise<JournalEntry | null>;
  deleteJournalEntry: (id: string) => Promise<boolean>;
  addFocusSession: (session: Omit<FocusSession, "id" | "profile_id" | "created_at">) => Promise<FocusSession | null>;
  theme: string;
  setTheme: (themeKey: string) => Promise<void>;
}

const QuarryContext = createContext<QuarryContextValue | null>(null);

/** Suma créditos ganados a la primera cuenta del cazador y deja registro
 * de la transacción. No lanza: si falla, solo queda en consola (la UI ya
 * se actualizó de forma optimista). */
async function persistCreditsEarned(
  profileId: string,
  accounts: Account[],
  amount: number,
  description: string,
) {
  if (amount <= 0) return;
  const primary = accounts[0];
  if (!primary) return;
  const newBalance = Number(primary.balance) + amount;
  try {
    await updateAccountBalance(primary.id, newBalance);
    await createTransaction({
      profile_id: profileId,
      account_id: primary.id,
      amount,
      type: "ingreso",
      category: "contrato financiero",
      description,
      date: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error persisting earned credits:", error);
  }
}

export function QuarryProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<HunterState | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [theme, setThemeState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("quarry_theme") || DEFAULT_THEME;
      document.documentElement.setAttribute("data-theme", saved);
      return saved;
    }
    return DEFAULT_THEME;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("quarry_theme") || DEFAULT_THEME;
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);
  const prevUserId = useRef<string | null>(null);

  // 1. Escuchar cambios de autenticación
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // 2. Cargar datos del usuario cuando cambie el usuario
  useEffect(() => {
    const userId = user?.id ?? null;
    if (userId === prevUserId.current && initialized) {
      return; // ya cargado para este usuario
    }
    prevUserId.current = userId;

    async function loadData() {
      if (!user) {
        // Mantener el estado anterior, no poner a null inmediatamente
        setDbConnected(false);
        setOnboarded(false);
        setInitialized(true);
        return;
      }

      setIsLoading(true);
      try {
        const sectors = await getSectors();
        if (sectors.length > 0) setDbConnected(true);

        const remoteState = await fetchHunterStateFromSupabase(user.id);

        if (remoteState && remoteState.profile) {
          const contracts = remoteState.contracts ?? [];
          const workouts = remoteState.workouts ?? [];
          const routineLog = remoteState.routine_log ?? {};
          const accounts = remoteState.accounts ?? [];
          const rawHistory = remoteState.net_worth_history ?? [];

          const liveStreak = calculateStreakDays(routineLog);
          const liveEnergy = remoteState.energy ?? 60;

          let liveHistory = rawHistory;
          try {
            liveHistory = await syncCurrentMonthNetWorth(user.id, accounts, rawHistory);
          } catch (e) {
            console.error("Error syncing monthly net worth point:", e);
          }

          const liveState: HunterState = {
            profile: remoteState.profile,
            stats: remoteState.stats ?? [],
            sectors,
            contracts,
            companion: remoteState.companion ?? {
              id: "cmp_fallback",
              profile_id: user.id,
              name: "Droide",
              mood: "Operativo",
              level: 1,
              xp: 0,
              expedition_status: "disponible",
              last_expedition_at: new Date().toISOString(),
            },
            achievements: remoteState.achievements ?? [],
            credits: remoteState.credits ?? 0,
            energy: liveEnergy,
            streak_days: liveStreak,
            routine_log: routineLog,
            accounts,
            transactions: remoteState.transactions ?? [],
            budgets: remoteState.budgets ?? [],
            savings_goals: remoteState.savings_goals ?? [],
            net_worth_history: liveHistory,
            body_stats: remoteState.body_stats ?? [],
            workouts,
            personal_records: remoteState.personal_records ?? [],
            today_checkin: remoteState.today_checkin ?? null,
            recent_checkins: remoteState.recent_checkins ?? [],
            journal_entries: remoteState.journal_entries ?? [],
            focus_sessions: remoteState.focus_sessions ?? [],
          };

          const remoteTheme = remoteState.profile.theme_preferences?.theme;
          if (remoteTheme && remoteTheme !== theme) {
            setThemeState(remoteTheme);
            if (typeof window !== "undefined") {
              localStorage.setItem("quarry_theme", remoteTheme);
              document.documentElement.setAttribute("data-theme", remoteTheme);
            }
          }

          setState(liveState);
          setOnboarded(true);

          checkAndUnlockAchievements(user.id, liveState, unlockAchievement, false)
            .then((syncedAchievements) => {
              setState((prev) => prev ? { ...prev, achievements: syncedAchievements } : prev);
            })
            .catch(() => { });
        } else {
          setState({
            ...getInitialState(),
            sectors,
            profile: {
              ...getInitialState().profile,
              id: user.id,
              username: "Nuevo cazador",
            },
          } as HunterState);
          setOnboarded(false);
        }
      } catch (error) {
        console.error("Error loading hunter data:", error);
        setState(null);
      } finally {
        setIsLoading(false);
        setInitialized(true);
      }
    }

    loadData();
  }, [user?.id]); // ← dependencia estable

  const refresh = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const sectors = await getSectors();
      const remoteState = await fetchHunterStateFromSupabase(user.id);
      if (remoteState && remoteState.profile) {
        const contracts = remoteState.contracts ?? [];
        const workouts = remoteState.workouts ?? [];
        const routineLog = remoteState.routine_log ?? {};
        const accounts = remoteState.accounts ?? [];
        const rawHistory = remoteState.net_worth_history ?? [];

        const liveStreak = calculateStreakDays(routineLog);
        const liveEnergy = remoteState.energy ?? 60;

        let liveHistory = rawHistory;
        try {
          liveHistory = await syncCurrentMonthNetWorth(user.id, accounts, rawHistory);
        } catch (e) {
          console.error("Error syncing monthly net worth point:", e);
        }

        const liveState: HunterState = {
          profile: remoteState.profile,
          stats: remoteState.stats ?? [],
          sectors,
          contracts,
          companion: remoteState.companion ?? {
            id: "cmp_fallback",
            profile_id: user.id,
            name: "Droide",
            mood: "Operativo",
            level: 1,
            xp: 0,
            expedition_status: "disponible",
            last_expedition_at: new Date().toISOString(),
          },
          achievements: remoteState.achievements ?? [],
          credits: remoteState.credits ?? 0,
          energy: liveEnergy,
          streak_days: liveStreak,
          routine_log: routineLog,
          accounts,
          transactions: remoteState.transactions ?? [],
          budgets: remoteState.budgets ?? [],
          savings_goals: remoteState.savings_goals ?? [],
          net_worth_history: liveHistory,
          body_stats: remoteState.body_stats ?? [],
          workouts,
          personal_records: remoteState.personal_records ?? [],
          today_checkin: remoteState.today_checkin ?? null,
          recent_checkins: remoteState.recent_checkins ?? [],
          journal_entries: remoteState.journal_entries ?? [],
          focus_sessions: remoteState.focus_sessions ?? [],
        };

        const remoteTheme = remoteState.profile.theme_preferences?.theme;
        if (remoteTheme && remoteTheme !== theme) {
          setThemeState(remoteTheme);
          if (typeof window !== "undefined") {
            localStorage.setItem("quarry_theme", remoteTheme);
            document.documentElement.setAttribute("data-theme", remoteTheme);
          }
        }

        setState(liveState);
        setOnboarded(true);

        checkAndUnlockAchievements(user.id, liveState, unlockAchievement, false)
          .then((syncedAchievements) => {
            setState((prev) => prev ? { ...prev, achievements: syncedAchievements } : prev);
          })
          .catch(() => { });
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  // 3. Funciones de mutación (completar contrato, etc.)
  const value = useMemo<QuarryContextValue>(() => {
    if (!state || !user) {
      // Si no hay estado o usuario, exponemos funciones vacías (o lanzamos error)
      return {
        state: null,
        onboarded: false,
        dbConnected: false,
        user,
        session,
        isLoading,
        completeContract: () => { },
        toggleRoutineDay: () => { },
        createHunter: () => { },
        signOut: async () => { },
        addTransaction: async () => null,
        addAccount: async () => null,
        addBudget: async () => null,
        addSavingsGoal: async () => null,
        contributeToGoal: async () => false,
        addBodyStat: async () => null,
        addWorkout: async () => null,
        addPersonalRecord: async () => null,
        updatePersonalRecordValue: async () => { },
        addContract: async () => null,
        sendDroidOnExpedition: async () => false,
        claimDroidExpedition: async () => null,
        submitDailyCheckin: async () => null,
        addJournalEntry: async () => null,
        updateJournalEntry: async () => null,
        deleteJournalEntry: async () => false,
        addFocusSession: async () => null,
        theme,
        setTheme: async (themeKey: string) => {
          setThemeState(themeKey);
          if (typeof window !== "undefined") {
            localStorage.setItem("quarry_theme", themeKey);
            document.documentElement.setAttribute("data-theme", themeKey);
          }
        },
      };
    }

    function awardXp(s: HunterState, xp: number, attr: AttributeKey) {
      const arch = ARCHETYPES.find((a) => a.key === s.profile.archetype);
      const isBoosted = arch?.boosts.includes(attr);
      const multiplier = isBoosted && arch?.multiplier ? arch.multiplier : 1;
      const actualXp = Math.round(xp * multiplier);

      const xp_total = s.profile.xp_total + actualXp;
      const { current } = rankProgress(xp_total);
      const nextState = {
        ...s,
        profile: {
          ...s.profile,
          xp_total,
          hunter_rank: current,
          level: Math.max(s.profile.level, Math.floor(xp_total / 500) + 1),
        },
        stats: s.stats.map((st) => {
          if (st.attribute_key !== attr) return st;
          let xp_current = st.xp_current + actualXp;
          let level = st.level;
          let xp_required = st.xp_required;
          let val = st.value;
          while (xp_current >= xp_required) {
            xp_current -= xp_required;
            level += 1;
            xp_required = Math.round(xp_required * 1.15);
            val = Math.min(100, val + 2);
          }
          return { ...st, xp_current, level, xp_required, value: val };
        }),
      };

      // Sincronizar en segundo plano con Supabase
      if (user) {
        updateProfile(user.id, {
          xp_total,
          hunter_rank: current,
          level: nextState.profile.level,
        }).catch(() => { });
      }

      return nextState;
    }

    return {
      state,
      onboarded,
      dbConnected,
      user,
      session,
      isLoading,
      completeContract: (id, amount) =>
        setState((s) => {
          if (!s) return s;
          const c = s.contracts.find((x) => x.id === id);
          if (!c || c.status === "completado") return s;
          const attr = ATTR_BY_TYPE[c.type];
          let next = awardXp(s, c.reward_xp, attr);
          const todayKey = new Date().toISOString().slice(0, 10);
          const completedAt = new Date().toISOString();

          updateContract(id, {
            status: "completado",
            completed_at: completedAt,
            streak_count: c.type === "rutina" ? c.streak_count + 1 : c.streak_count,
          }).catch((err) => {
            console.error("Error updating contract in Supabase:", err);
            toast.error("Error al sincronizar contrato con la terminal estelar");
          });

          if (c.type === "rutina" && user) {
            toggleRoutineLog(user.id, id, todayKey, true).catch((err) => {
              console.error("Error toggling routine log:", err);
              toast.error("Fallo al registrar bitácora de rutina en la terminal");
            });
          }

          if (c.is_financial && amount !== undefined && amount > 0 && user) {
            persistCreditsEarned(user.id, next.accounts, amount, c.title);
            next = {
              ...next,
              credits: next.credits + amount,
              accounts: next.accounts.map((a, i) =>
                i === 0 ? { ...a, balance: Number(a.balance) + amount } : a
              ),
            };
            syncCurrentMonthNetWorth(user.id, next.accounts, next.net_worth_history).then((nh) => {
              setState((prev) => prev ? { ...prev, net_worth_history: nh } : prev);
            }).catch(() => { });
          }

          const nextContracts = next.contracts.map((x) =>
            x.id === id
              ? {
                ...x,
                status: "completado" as const,
                completed_at: completedAt,
                streak_count:
                  x.type === "rutina" ? x.streak_count + 1 : x.streak_count,
              }
              : x,
          );

          const nextRoutineLog =
            c.type === "rutina"
              ? {
                ...next.routine_log,
                [id]: Array.from(
                  new Set([...(next.routine_log[id] ?? []), todayKey]),
                ),
              }
              : next.routine_log;

          const updatedState = {
            ...next,
            contracts: nextContracts,
            routine_log: nextRoutineLog,
            streak_days: calculateStreakDays(nextRoutineLog),
          };

          if (user) {
            checkAndUnlockAchievements(user.id, updatedState, unlockAchievement)
              .then((syncedAchievements) => {
                setState((prev) => prev ? { ...prev, achievements: syncedAchievements } : prev);
              })
              .catch(() => { });
          }

          return updatedState;
        }),
      toggleRoutineDay: (contractId, date) =>
        setState((s) => {
          if (!s) return s;
          const c = s.contracts.find((x) => x.id === contractId);
          if (!c) return s;
          const log = s.routine_log[contractId] ?? [];
          const has = log.includes(date);
          const todayKey = new Date().toISOString().slice(0, 10);
          const base = has
            ? s
            : awardXp(s, c.reward_xp, "resistencia");

          const newStreak = Math.max(0, c.streak_count + (has ? -1 : 1));
          const newStatus = date === todayKey ? (has ? "pendiente" : "completado") : c.status;

          if (user) {
            toggleRoutineLog(user.id, contractId, date, !has).catch((err) => {
              console.error("Error in toggleRoutineLog:", err);
              toast.error("Error al registrar día de rutina en la base de datos");
            });
          }
          updateContract(contractId, {
            streak_count: newStreak,
            status: newStatus as any,
          }).catch((err) => {
            console.error("Error in updateContract:", err);
            toast.error("Fallo al actualizar racha del contrato");
          });

          const nextRoutineLog = {
            ...base.routine_log,
            [contractId]: has ? log.filter((d) => d !== date) : [...log, date],
          };

          const nextContracts = base.contracts.map((x) =>
            x.id === contractId
              ? {
                ...x,
                streak_count: newStreak,
                status: newStatus as any,
                completed_at:
                  date === todayKey && !has ? new Date().toISOString() : x.completed_at,
              }
              : x,
          );

          const updatedState = {
            ...base,
            routine_log: nextRoutineLog,
            streak_days: calculateStreakDays(nextRoutineLog),
            contracts: nextContracts,
          };

          if (user) {
            checkAndUnlockAchievements(user.id, updatedState, unlockAchievement)
              .then((syncedAchievements) => {
                setState((prev) => prev ? { ...prev, achievements: syncedAchievements } : prev);
              })
              .catch(() => { });
          }

          return updatedState;
        }),
      createHunter: async ({
        username,
        archetype,
        avatar_config,
        droidName = "Droide",
        droidMood = "Operativo",
        currency = "COP",
        initialCredits = 0,
        monthlyIncome,
        accountName = "Billetera",
        initialWeight,
      }) => {
        if (!user) return;

        const themePreferences = {
          currency,
          monthly_income: monthlyIncome || null,
        };

        // 1. Crear perfil en Supabase
        const newProfile = {
          id: user.id,
          username,
          archetype,
          avatar_silhouette: avatar_config.silhouette,
          suit_palette: avatar_config.suit_palette,
          visor: avatar_config.visor,
          hunter_rank: "Novato",
          level: 1,
          xp_total: 0,
          theme_preferences: themePreferences,
          created_at: new Date().toISOString(),
        };

        try {
          await createProfile(newProfile as any);
        } catch (error) {
          console.error("Error creating profile:", error);
          return;
        }

        // 2. Cuenta principal con el saldo de arranque
        //    (no se pasa created_at: la tabla ya trae default en Supabase
        //    y el tipo Account del frontend no incluye esa columna)
        const account = await createAccount({
          profile_id: user.id,
          name: accountName,
          type: "billetera",
          balance: initialCredits,
        });

        // 3. Primer punto del historial de patrimonio neto
        const netWorthPoint = await createNetWorthPoint(
          user.id,
          new Date().toISOString().slice(0, 10),
          initialCredits,
        );

        // 4. Peso inicial, si lo dieron
        let bodyStat = null;
        if (initialWeight && initialWeight > 0) {
          bodyStat = await createBodyStat({
            profile_id: user.id,
            metric: "peso",
            label: "Peso corporal",
            value: initialWeight,
            unit: "kg",
            recorded_at: new Date().toISOString(),
          });
        }

        // 5. Crear stats reales (5 filas)
        const attributeKeys: AttributeKey[] = ["vigor", "ingenio", "disciplina", "reputacion", "resistencia"];
        const realStats = await Promise.all(
          attributeKeys.map((key) =>
            createStat({
              profile_id: user.id,
              attribute_key: key,
              value: 5,
              level: 1,
              xp_current: 0,
              xp_required: 100,
            })
          )
        );

        // 6. Crear un compañero real
        const realCompanion = await createCompanion({
          profile_id: user.id,
          name: droidName.trim() || "Droide",
          mood: droidMood.trim() || "Operativo",
          level: 1,
          xp: 0,
          expedition_status: "disponible",
          last_expedition_at: new Date().toISOString(),
        });

        // 7. Actualizar estado local para que la interfaz refleje todo
        //    de inmediato, sin esperar un refetch.
        setState((s) => {
          if (!s) return s;
          return {
            ...s,
            profile: {
              ...s.profile,
              username,
              archetype,
              avatar_config,
              currency,
              monthly_income: monthlyIncome,
              theme_preferences: themePreferences,
            },
            stats: realStats,
            companion: realCompanion,
            credits: initialCredits,
            accounts: account ? [{ ...account, currency }] : [],
            net_worth_history: netWorthPoint ? [netWorthPoint] : [],
            body_stats: bodyStat ? [bodyStat] : [],
            transactions: [],
            budgets: [],
            savings_goals: [],
            workouts: [],
            personal_records: [],
            achievements: [],
            contracts: [],
            routine_log: {},
            energy: 60,
            streak_days: 0,
            today_checkin: null,
            recent_checkins: [],
          };
        });
        setOnboarded(true);
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setState(null);
        setOnboarded(false);
        setUser(null);
        setSession(null);
      },
      addTransaction: async (txData) => {
        if (!user) {
          toast.error("Terminal no autenticada para registrar transacciones");
          return null;
        }
        const newTx = await createTransaction({
          ...txData,
          profile_id: user.id,
        });
        if (!newTx) {
          toast.error("Error al asentar transacción en el libro de cuentas");
          return null;
        }

        const currentAcc = state.accounts.find((a) => a.id === txData.account_id);
        const delta = txData.type === "ingreso" ? Number(txData.amount) : -Number(txData.amount);
        const newBalance = currentAcc ? Number(currentAcc.balance) + delta : delta;
        if (currentAcc) {
          await updateAccountBalance(currentAcc.id, newBalance);
        }

        const updatedAccounts = state.accounts.map((a) =>
          a.id === txData.account_id ? { ...a, balance: newBalance } : a
        );
        const newCredits = updatedAccounts.reduce((sum, a) => sum + Number(a.balance), 0);

        let updatedHistory = state.net_worth_history;
        try {
          updatedHistory = await syncCurrentMonthNetWorth(
            user.id,
            updatedAccounts,
            state.net_worth_history
          );
        } catch (err) {
          console.error("Error updating monthly net worth after transaction:", err);
        }

        const updatedState = {
          ...state,
          transactions: [newTx, ...state.transactions],
          accounts: updatedAccounts,
          credits: newCredits,
          net_worth_history: updatedHistory,
        };

        checkAndUnlockAchievements(user.id, updatedState, unlockAchievement)
          .then((syncedAchievements) => {
            setState((prev) => prev ? { ...prev, achievements: syncedAchievements } : prev);
          })
          .catch(() => { });

        setState((s) => {
          if (!s) return s;
          return {
            ...s,
            transactions: [newTx, ...s.transactions],
            accounts: updatedAccounts,
            credits: newCredits,
            net_worth_history: updatedHistory,
          };
        });
        return newTx;
      },
      addAccount: async (accData) => {
        if (!user) {
          toast.error("Terminal no autenticada para crear cuentas");
          return null;
        }
        const { currency, ...cleanAccData } = accData as any;
        const newAcc = await createAccount({
          ...cleanAccData,
          profile_id: user.id,
        });
        if (!newAcc) {
          toast.error("Error al registrar cuenta en el sector de riqueza");
          return null;
        }

        const updatedAccounts = [...state.accounts, newAcc];
        const newCredits = updatedAccounts.reduce((sum, a) => sum + Number(a.balance), 0);

        let updatedHistory = state.net_worth_history;
        try {
          updatedHistory = await syncCurrentMonthNetWorth(
            user.id,
            updatedAccounts,
            state.net_worth_history
          );
        } catch (err) {
          console.error("Error updating monthly net worth after new account:", err);
        }

        const updatedState = {
          ...state,
          accounts: updatedAccounts,
          credits: newCredits,
          net_worth_history: updatedHistory,
        };

        checkAndUnlockAchievements(user.id, updatedState, unlockAchievement)
          .then((syncedAchievements) => {
            setState((prev) => prev ? { ...prev, achievements: syncedAchievements } : prev);
          })
          .catch(() => { });

        setState((s) => {
          if (!s) return s;
          return {
            ...s,
            accounts: updatedAccounts,
            credits: newCredits,
            net_worth_history: updatedHistory,
          };
        });
        return newAcc;
      },
      addBudget: async (bgData) => {
        if (!user) {
          toast.error("Terminal no autenticada para asignar sobres");
          return null;
        }
        const newBg = await createBudget({
          ...bgData,
          profile_id: user.id,
          spent: 0,
        });
        if (!newBg) {
          toast.error("Fallo al registrar sobre de presupuesto en Supabase");
          return null;
        }

        setState((s) => {
          if (!s) return s;
          return {
            ...s,
            budgets: [...s.budgets, newBg],
          };
        });
        return newBg;
      },
      addSavingsGoal: async (goalData) => {
        if (!user) {
          toast.error("Terminal no autenticada para fijar metas");
          return null;
        }
        const newGoal = await createSavingsGoal({
          ...goalData,
          profile_id: user.id,
          saved: 0,
        });
        if (!newGoal) {
          toast.error("Fallo al registrar meta de ahorro en Supabase");
          return null;
        }

        setState((s) => {
          if (!s) return s;
          return {
            ...s,
            savings_goals: [...s.savings_goals, newGoal],
          };
        });
        return newGoal;
      },
      contributeToGoal: async (goalId: string, amount: number, accountId?: string) => {
        if (!user) {
          toast.error("Terminal no autenticada para aportar a metas");
          return false;
        }
        if (amount <= 0) {
          toast.error("El monto de aporte debe ser mayor a 0");
          return false;
        }

        const goal = state.savings_goals.find((g) => g.id === goalId);
        if (!goal) {
          toast.error("Meta de ahorro no encontrada");
          return false;
        }

        let updatedAccounts = state.accounts;
        let newTx: Transaction | null = null;
        let newCredits = state.credits;
        let updatedHistory = state.net_worth_history;

        // Si se proporciona accountId, descontar saldo y registrar transacción
        if (accountId) {
          const currentAcc = state.accounts.find((a) => a.id === accountId);
          if (!currentAcc) {
            toast.error("Cuenta no encontrada en los registros");
            return false;
          }
          if (Number(currentAcc.balance) < amount) {
            toast.error("Saldo insuficiente en la cuenta seleccionada");
            return false;
          }

          const newBalance = Number(currentAcc.balance) - amount;
          try {
            await updateAccountBalance(accountId, newBalance);
          } catch (err) {
            console.error("Error al actualizar saldo de cuenta:", err);
            toast.error("Error al descontar balance de la cuenta");
            return false;
          }

          newTx = await createTransaction({
            profile_id: user.id,
            account_id: accountId,
            type: "gasto",
            category: "Ahorro",
            description: `Aporte a meta: ${goal.title}`,
            amount,
            date: new Date().toISOString(),
          });

          updatedAccounts = state.accounts.map((a) =>
            a.id === accountId ? { ...a, balance: newBalance } : a
          );
          newCredits = updatedAccounts.reduce((sum, a) => sum + Number(a.balance), 0);

          try {
            updatedHistory = await syncCurrentMonthNetWorth(
              user.id,
              updatedAccounts,
              state.net_worth_history
            );
          } catch (err) {
            console.error("Error al sincronizar patrimonio tras aporte:", err);
          }
        }

        // Actualizar el monto acumulado en la meta en Supabase
        const updatedGoal = await contributeToSavingsGoal(goalId, amount);
        if (!updatedGoal) {
          toast.error("Error al asentar aporte a la meta en Supabase");
          return false;
        }

        const updatedSavingsGoals = state.savings_goals.map((g) =>
          g.id === goalId ? updatedGoal : g
        );

        const updatedState = {
          ...state,
          savings_goals: updatedSavingsGoals,
          accounts: updatedAccounts,
          transactions: newTx ? [newTx, ...state.transactions] : state.transactions,
          credits: newCredits,
          net_worth_history: updatedHistory,
        };

        checkAndUnlockAchievements(user.id, updatedState, unlockAchievement)
          .then((syncedAchievements) => {
            setState((prev) => (prev ? { ...prev, achievements: syncedAchievements } : prev));
          })
          .catch(() => {});

        setState((s) => {
          if (!s) return s;
          return {
            ...s,
            savings_goals: updatedSavingsGoals,
            accounts: updatedAccounts,
            transactions: newTx ? [newTx, ...s.transactions] : s.transactions,
            credits: newCredits,
            net_worth_history: updatedHistory,
          };
        });

        toast.success(`Aporte de ${amount.toLocaleString("es")} ${state.profile?.currency || "cr"} registrado en "${goal.title}"`);
        return true;
      },
      addBodyStat: async (statData) => {
        if (!user) {
          toast.error("Terminal no autenticada para registrar métrica física");
          return null;
        }
        const newStat = await createBodyStat({
          ...statData,
          profile_id: user.id,
        });
        if (!newStat) {
          toast.error("Error al persistir métrica corporal");
          return null;
        }

        setState((s) => {
          if (!s) return s;
          return {
            ...s,
            body_stats: [...s.body_stats, newStat],
          };
        });
        return newStat;
      },
      addWorkout: async (workoutData) => {
        if (!user) {
          toast.error("Terminal no autenticada para anotar entrenamientos");
          return null;
        }
        const newW = await createWorkout({
          ...workoutData,
          profile_id: user.id,
        });
        if (!newW) {
          toast.error("Fallo al asentar entrenamiento en la bitácora física");
          return null;
        }

        setState((s) => {
          if (!s) return s;
          const nextWorkouts = [newW, ...s.workouts];
          return {
            ...s,
            workouts: nextWorkouts,
          };
        });
        return newW;
      },
      addPersonalRecord: async (prData) => {
        if (!user) {
          toast.error("Terminal no autenticada para declarar récord");
          return null;
        }
        const newPr = await createPersonalRecord({
          ...prData,
          profile_id: user.id,
        });
        if (!newPr) {
          toast.error("Error al fijar récord personal en la base de datos");
          return null;
        }

        setState((s) => {
          if (!s) return s;
          return {
            ...s,
            personal_records: [...s.personal_records, newPr],
          };
        });
        return newPr;
      },
      updatePersonalRecordValue: async (id, current) => {
        if (!user) return;
        const updated = await updatePersonalRecord(id, {
          current,
          achieved_at: new Date().toISOString(),
        });
        if (!updated) {
          toast.error("Fallo al actualizar la marca del récord personal");
          return;
        }

        setState((s) => {
          if (!s) return s;
          return {
            ...s,
            personal_records: s.personal_records.map((pr) =>
              pr.id === id ? { ...pr, current, achieved_at: updated.achieved_at } : pr
            ),
          };
        });
      },
      addContract: async (cData) => {
        if (!user) {
          toast.error("Terminal no autenticada para asignar misiones");
          return null;
        }
        const newC = await createContract({
          ...cData,
          profile_id: user.id,
        });
        if (!newC) {
          toast.error("Fallo al registrar nuevo contrato en la terminal estelar");
          return null;
        }

        setState((s) => {
          if (!s) return s;
          return {
            ...s,
            contracts: [...s.contracts, newC],
          };
        });
        return newC;
      },
      sendDroidOnExpedition: async () => {
        if (!state?.companion) {
          toast.error("No se detecta un droide asignado al cazador");
          return false;
        }
        if (state.companion.expedition_status === "en_expedicion") {
          toast.error("El droide ya se encuentra en misión activa");
          return false;
        }

        const now = new Date().toISOString();
        const updated = await updateCompanion(state.companion.id, {
          expedition_status: "en_expedicion",
          last_expedition_at: now,
        });

        if (!updated) {
          toast.error("Fallo al transmitir coordenadas de expedición al droide");
          return false;
        }

        setState((s) => {
          if (!s || !s.companion) return s;
          return {
            ...s,
            companion: {
              ...s.companion,
              expedition_status: "en_expedicion",
              last_expedition_at: now,
            },
          };
        });

        toast.success(`🚀 ${state.companion.name} desplegado en misión de exploración`);
        return true;
      },
      claimDroidExpedition: async () => {
        if (!state?.companion) {
          toast.error("No se detecta un droide asignado");
          return null;
        }
        if (state.companion.expedition_status !== "en_expedicion") {
          toast.error("El droide no está en expedición activa");
          return null;
        }

        const xpGained = Math.floor(Math.random() * 101) + 150; // 150 a 250 XP
        const currentXp = Number(state.companion.xp || 0);
        const totalXp = currentXp + xpGained;
        const currentLevel = Number(state.companion.level || 1);
        const newLevel = Math.max(currentLevel, Math.floor(totalXp / 500) + 1);
        const leveledUp = newLevel > currentLevel;

        const updated = await updateCompanion(state.companion.id, {
          expedition_status: "disponible",
          xp: totalXp,
          level: newLevel,
        });

        if (!updated) {
          toast.error("Error al procesar el hallazgo de la expedición");
          return null;
        }

        const updatedCompanion = {
          ...state.companion,
          expedition_status: "disponible" as const,
          xp: totalXp,
          level: newLevel,
        };

        const nextState = {
          ...state,
          companion: updatedCompanion,
        };

        setState(nextState);

        if (user) {
          checkAndUnlockAchievements(user.id, nextState, unlockAchievement)
            .then((syncedAchievements) => {
              setState((prev) => prev ? { ...prev, achievements: syncedAchievements } : prev);
            })
            .catch(() => { });
        }

        toast.success(
          `📦 ${state.companion.name} regresó con chatarra · +${xpGained} XP droide${leveledUp ? ` · ¡Subió a nivel ${newLevel}!` : ""}`
        );

        return { xpGained, newLevel };
      },
      submitDailyCheckin: async (input) => {
        if (!user) {
          toast.error("Terminal no autenticada para registrar check-in");
          return null;
        }

        const res = await upsertCheckin(user.id, input);
        if (!res) {
          toast.error("Error al registrar el check-in diario en Supabase");
          return null;
        }

        const newEnergy = Number(res.energy_level) * 20;

        setState((s) => {
          if (!s) return s;
          const filteredRecent = (s.recent_checkins || []).filter(
            (c) => c.checkin_date !== res.checkin_date
          );
          return {
            ...s,
            energy: newEnergy,
            today_checkin: res,
            recent_checkins: [res, ...filteredRecent],
          };
        });

        toast.success(`Check-in diario sellado · Nivel de energía: ${newEnergy}%`);
        return res;
      },
      addJournalEntry: async (entryData) => {
        if (!user) {
          toast.error("Terminal no autenticada para escribir en la bitácora");
          return null;
        }

        const newEntry = await createEntry({
          ...entryData,
          profile_id: user.id,
        });
        if (!newEntry) {
          toast.error("Fallo al archivar entrada de bitácora en Supabase");
          return null;
        }

        // Sumar XP fija a disciplina e integrar la nueva entrada de forma reactiva
        setState((s) => {
          if (!s) return s;
          const withXp = awardXp(s, 30, "disciplina");
          return {
            ...withXp,
            journal_entries: [newEntry, ...(withXp.journal_entries || [])],
          };
        });

        toast.success("Entrada sellada en la bitácora · +30 XP Disciplina");
        return newEntry;
      },
      updateJournalEntry: async (id, updates) => {
        if (!user) {
          toast.error("Terminal no autenticada");
          return null;
        }
        const updated = await updateEntry(id, updates);
        if (updated) {
          setState((s) => {
            if (!s) return s;
            return {
              ...s,
              journal_entries: (s.journal_entries || []).map((e) =>
                e.id === id ? updated : e
              ),
            };
          });
          toast.success("Entrada de bitácora actualizada");
        }
        return updated;
      },
      deleteJournalEntry: async (id) => {
        if (!user) {
          toast.error("Terminal no autenticada");
          return false;
        }
        const ok = await deleteEntry(id);
        if (ok) {
          setState((s) => {
            if (!s) return s;
            return {
              ...s,
              journal_entries: (s.journal_entries || []).filter((e) => e.id !== id),
            };
          });
          toast.success("Entrada eliminada de la bitácora");
        }
        return ok;
      },
      addFocusSession: async (sessionData) => {
        if (!user) {
          toast.error("Terminal no autenticada para registrar foco");
          return null;
        }
        const newSession = await createSession({
          ...sessionData,
          profile_id: user.id,
        });
        if (!newSession) {
          toast.error("Fallo al archivar sesión de foco en Supabase");
          return null;
        }

        // Recompensa FIJA de 15 XP hacia "disciplina", sin importar la duración y sin tocar créditos
        setState((s) => {
          if (!s) return s;
          const withXp = awardXp(s, 15, "disciplina");
          return {
            ...withXp,
            focus_sessions: [newSession, ...(withXp.focus_sessions || [])],
          };
        });

        toast.success(`Sesión de foco sellada · +15 XP Disciplina · ${newSession.duration_minutes} min`);
        return newSession;
      },
      theme,
      setTheme: async (themeKey: string) => {
        setThemeState(themeKey);
        if (typeof window !== "undefined") {
          localStorage.setItem("quarry_theme", themeKey);
          document.documentElement.setAttribute("data-theme", themeKey);
        }
        if (user) {
          try {
            const currentPrefs = state?.profile?.theme_preferences || {};
            await updateProfile(user.id, {
              theme_preferences: {
                ...currentPrefs,
                theme: themeKey,
              },
            });
            setState((s) => {
              if (!s || !s.profile) return s;
              return {
                ...s,
                profile: {
                  ...s.profile,
                  theme_preferences: {
                    ...(s.profile.theme_preferences || {}),
                    theme: themeKey,
                  },
                },
              };
            });
          } catch (err) {
            console.error("Error saving theme to Supabase:", err);
          }
        }
      },
    };
  }, [state, onboarded, dbConnected, user, session, isLoading, theme]);

  return <QuarryContext.Provider value={value}>{children}</QuarryContext.Provider>;
}

export function useQuarry() {
  const ctx = useContext(QuarryContext);
  if (!ctx) throw new Error("useQuarry debe usarse dentro de QuarryProvider");
  return ctx;
}