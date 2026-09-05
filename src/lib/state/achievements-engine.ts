import type { HunterState } from "@/lib/data/mock";
import type { Achievement } from "@/lib/data/types";
import { toast } from "sonner";

export interface AchievementDefinition {
  key: string;
  title: string;
  description: string;
  requirement: string;
  icon?: string;
  check: (state: HunterState) => boolean;
}

export const ACHIEVEMENTS_CATALOG: AchievementDefinition[] = [
  {
    key: "primera_marca",
    title: "Primera marca",
    description: "Cerraste tu primer contrato registrado.",
    requirement: "Completar al menos 1 contrato.",
    check: (state) =>
      state.contracts.some((c) => c.status === "completado"),
  },
  {
    key: "racha_7",
    title: "Siete amaneceres",
    description: "Siete días consecutivos de registro sin fallar.",
    requirement: "Alcanzar 7 días de racha activa.",
    check: (state) => state.streak_days >= 7,
  },
  {
    key: "racha_30",
    title: "Un ciclo entero",
    description: "Treinta días consecutivos de registro sin fallar.",
    requirement: "Alcanzar 30 días de racha activa.",
    check: (state) => state.streak_days >= 30,
  },
  {
    key: "racha_100",
    title: "Cien polvaredas",
    description: "Cien días consecutivos de registro.",
    requirement: "Alcanzar 100 días de racha activa.",
    check: (state) => state.streak_days >= 100,
  },
  {
    key: "mayor_x10",
    title: "Peso pesado",
    description: "Diez contratos mayores completados.",
    requirement: "Completar 10 contratos de tipo mayor.",
    check: (state) =>
      state.contracts.filter(
        (c) => c.type === "mayor" && c.status === "completado"
      ).length >= 10,
  },
  {
    key: "droide_leal",
    title: "Chatarra leal",
    description: "Tu droide alcanzó el nivel 5.",
    requirement: "Subir al compañero droide a nivel 5.",
    check: (state) => (state.companion?.level ?? 1) >= 5,
  },
  {
    key: "rango_elite",
    title: "Sello de élite",
    description: "Alcanzar el rango Élite o superior.",
    requirement: "Acumular 14 000 XP o alcanzar rango Élite.",
    check: (state) =>
      state.profile.xp_total >= 14000 ||
      state.profile.hunter_rank === "Elite" ||
      state.profile.hunter_rank === "Leyenda",
  },
  {
    key: "cofre_lleno",
    title: "Bodega llena",
    description: "Acumular 10 000 créditos o más en saldo consolidado.",
    requirement: "Tener 10 000 créditos o más en balance.",
    check: (state) => state.credits >= 10000,
  },
  {
    key: "sin_vencidos",
    title: "Ninguno se escapa",
    description: "Tener al menos 5 contratos completados y 0 contratos vencidos.",
    requirement: "5 contratos completados sin ningún contrato vencido.",
    check: (state) => {
      const completed = state.contracts.filter((c) => c.status === "completado").length;
      const overdue = state.contracts.filter((c) => c.status === "vencido").length;
      return completed >= 5 && overdue === 0;
    },
  },
];

/**
 * Evalúa el estado del cazador contra el catálogo de logros.
 * Retorna las definiciones de las insignias que califican para desbloquearse
 * pero que aún NO figuran como desbloqueadas en state.achievements.
 */
export function evaluateAchievements(state: HunterState): AchievementDefinition[] {
  const unlockedKeys = new Set(
    (state.achievements || [])
      .filter((a) => Boolean(a.unlocked_at))
      .map((a) => a.key)
  );

  return ACHIEVEMENTS_CATALOG.filter((item) => {
    // Si ya está desbloqueada, no evaluar
    if (unlockedKeys.has(item.key)) return false;

    // Comprobar si cumple la condición
    try {
      return item.check(state);
    } catch (e) {
      console.error(`Error evaluando logro ${item.key}:`, e);
      return false;
    }
  });
}

/**
 * Evalúa los logros pendientes para el estado actual, dispara la persistencia en Supabase,
 * emite la notificación toast correspondiente y retorna la lista actualizada de logros.
 */
export async function checkAndUnlockAchievements(
  userId: string,
  state: HunterState,
  unlockFn: (
    profileId: string,
    key: string,
    meta: { title: string; description: string }
  ) => Promise<any>,
  notifyToast = true
): Promise<Achievement[]> {
  const pending = evaluateAchievements(state);
  if (pending.length === 0) return state.achievements || [];

  const now = new Date().toISOString();
  const newlyUnlocked: Achievement[] = [];

  for (const def of pending) {
    if (notifyToast) {
      toast.success(`🏆 INSIGNIA DESBLOQUEADA: ${def.title}`, {
        description: def.description,
      });
    }

    try {
      const saved = await unlockFn(userId, def.key, {
        title: def.title,
        description: def.description,
      });

      newlyUnlocked.push(
        saved || {
          id: `ach_${def.key}`,
          profile_id: userId,
          key: def.key,
          title: def.title,
          description: def.description,
          unlocked_at: now,
        }
      );
    } catch (err) {
      console.error(`Error al persistir logro ${def.key}:`, err);
      newlyUnlocked.push({
        id: `ach_${def.key}`,
        profile_id: userId,
        key: def.key,
        title: def.title,
        description: def.description,
        unlocked_at: now,
      });
    }
  }

  const existingMap = new Map((state.achievements || []).map((a) => [a.key, a]));
  for (const item of newlyUnlocked) {
    existingMap.set(item.key, item);
  }

  return Array.from(existingMap.values());
}

