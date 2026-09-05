
/**
 * Calcula los días de racha consecutiva activa del cazador basándose en los logs de rutinas.
 *
 * Reglas:
 * 1. Un día cuenta como cumplido si al menos 1 rutina fue completada en esa fecha (formato YYYY-MM-DD).
 * 2. Si hoy ya se completó alguna rutina, se cuenta hoy y se cuentan hacia atrás los días consecutivos.
 * 3. Si hoy aún no se ha sellado ninguna rutina pero ayer sí, la racha se conserva activa
 *    (partiendo desde ayer) para no romper la racha a primera hora de la mañana.
 * 4. Si ayer tampoco se selló nada, la racha es 0.
 */
export function calculateStreakDays(routineLog: Record<string, string[]>): number {
  const completedDates = new Set<string>();

  for (const dates of Object.values(routineLog)) {
    if (Array.isArray(dates)) {
      for (const d of dates) {
        if (typeof d === "string" && d.length >= 10) {
          completedDates.add(d.slice(0, 10));
        }
      }
    }
  }

  if (completedDates.size === 0) return 0;

  const nowMs = Date.now();
  const DAY_MS = 86400000;

  const todayStr = new Date(nowMs).toISOString().slice(0, 10);
  const yesterdayStr = new Date(nowMs - DAY_MS).toISOString().slice(0, 10);

  let streak = 0;
  let offsetDays = 0;

  if (completedDates.has(todayStr)) {
    streak = 1;
    offsetDays = 1;
  } else if (completedDates.has(yesterdayStr)) {
    streak = 1;
    offsetDays = 2;
  } else {
    return 0;
  }

  while (true) {
    const prevDateStr = new Date(nowMs - offsetDays * DAY_MS).toISOString().slice(0, 10);
    if (completedDates.has(prevDateStr)) {
      streak++;
      offsetDays++;
    } else {
      break;
    }
  }

  return streak;
}


/**
 * Retorna el tono y humor del droide compañero según la constancia / racha del cazador.
 */
export function getDroidMood(streakDays: number, baseMood?: string): string {
  if (streakDays === 0) {
    return "Sistemas en espera · Se detecta inactividad del cazador.";
  } else if (streakDays >= 30) {
    return "Vínculo de combate reforzado · Registro legendario.";
  } else if (streakDays >= 7) {
    return "Eficiencia óptima · Todos los subsistemas calibrados.";
  } else {
    return baseMood || "Operativo · Racha en curso, manteniendo calibración.";
  }
}

