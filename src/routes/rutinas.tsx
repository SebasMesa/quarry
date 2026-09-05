import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/quarry/shell";
import { Panel, StatBar } from "@/components/quarry/panel";
import { NewContractModal } from "@/components/quarry/contract-dialog";
import { useQuarry } from "@/lib/state/quarry";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rutinas")({
  head: () => ({
    meta: [
      { title: "Rutinas · QUARRY" },
      {
        name: "description",
        content:
          "Registro diario de rutinas con rejilla de 5 semanas, rachas por rutina y sellado de contratos recurrentes.",
      },
      { property: "og:title", content: "Rutinas · QUARRY" },
      {
        property: "og:description",
        content: "Sella tus rutinas diarias y mantén la racha en la terminal QUARRY.",
      },
    ],
  }),
  component: RutinasPage,
});

interface CalendarDay {
  date: Date;
  dateKey: string;
  dayNum: number;
  weekdayIndex: number;
  weekdayLabel: string;
  weekdayFull: string;
  monthLabel: string;
  isToday: boolean;
  isFuture: boolean;
}

interface CalendarWeek {
  weekNum: number;
  label: string;
  dateRange: string;
  days: CalendarDay[];
  hasToday: boolean;
}

function getRoutineCalendarWeeks(): CalendarWeek[] {
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);

  // Lunes de la semana actual
  const currentMonday = new Date(now);
  const dayOfWeek = (currentMonday.getDay() + 6) % 7; // 0 = Lunes, 6 = Domingo
  currentMonday.setDate(currentMonday.getDate() - dayOfWeek);
  currentMonday.setHours(0, 0, 0, 0);

  // 4 semanas antes (35 días total en 5 semanas exactas de Lunes a Domingo)
  const startMonday = new Date(currentMonday);
  startMonday.setDate(startMonday.getDate() - 28);

  const WEEKDAY_SHORT = ["L", "M", "X", "J", "V", "S", "D"];
  const weeks: CalendarWeek[] = [];

  for (let w = 0; w < 5; w++) {
    const days: CalendarDay[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startMonday);
      date.setDate(date.getDate() + (w * 7 + d));
      const dateKey = date.toISOString().slice(0, 10);
      const isToday = dateKey === todayKey;
      const isFuture = dateKey > todayKey;

      const weekdayFull = date.toLocaleDateString("es-ES", { weekday: "long" });
      const monthLabel = date.toLocaleDateString("es-ES", { month: "short" });

      days.push({
        date,
        dateKey,
        dayNum: date.getDate(),
        weekdayIndex: d,
        weekdayLabel: WEEKDAY_SHORT[d],
        weekdayFull: weekdayFull.charAt(0).toUpperCase() + weekdayFull.slice(1),
        monthLabel,
        isToday,
        isFuture,
      });
    }

    const first = days[0];
    const last = days[6];
    const isCurrentWeek = w === 4;

    weeks.push({
      weekNum: w + 1,
      label: isCurrentWeek ? "Sem 5 · HOY" : `Sem ${w + 1}`,
      dateRange: `${first.dayNum} ${first.monthLabel} - ${last.dayNum} ${last.monthLabel}`,
      days,
      hasToday: days.some((d) => d.isToday),
    });
  }

  return weeks;
}

function formatCellTooltip(day: CalendarDay, done: boolean) {
  const status = done ? "Sellado" : day.isFuture ? "Futuro" : "Pendiente";
  return `${day.weekdayFull} ${day.dayNum} de ${day.monthLabel} · ${status}`;
}

function RutinasPage() {
  const { state, isLoading, toggleRoutineDay } = useQuarry();

  if (isLoading || !state || !state.profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="font-display text-2xl text-amber">QUARRY</p>
          <p className="label-mono mt-2">Cargando expediente...</p>
        </div>
      </div>
    );
  }

  const [flash, setFlash] = useState<string | null>(null);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [viewMode, setViewMode] = useState<"semanas" | "matriz">("semanas");
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);

  const routines = state.contracts.filter((c) => c.type === "rutina");
  const weeks = useMemo(() => getRoutineCalendarWeeks(), []);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayColIndex = (new Date().getDay() + 6) % 7;

  const totalToday = routines.filter((r) =>
    (state.routine_log[r.id] ?? []).includes(todayKey),
  ).length;

  const activeRoutine = routines.find((r) => r.id === (selectedRoutineId || routines[0]?.id));
  const activeLog = activeRoutine ? (state.routine_log[activeRoutine.id] ?? []) : [];

  function onCell(id: string, key: string, title: string, xp: number) {
    const has = (state?.routine_log[id] ?? []).includes(key);
    toggleRoutineDay(id, key);
    setFlash(has ? `Registro anulado · ${title}` : `Sellado · ${title} · +${xp} xp`);
    setTimeout(() => setFlash(null), 2000);
  }

  return (
    <Shell
      title="Sector de rutinas"
      subtitle={`${totalToday} de ${routines.length} rutinas selladas hoy · ciclo de 35 días`}
    >
      {flash && (
        <div className="stamp-in mb-4 inline-block border border-amber px-3 py-1 font-mono text-[11px] tracking-[0.18em] text-amber uppercase">
          {flash}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
        <Panel
          riveted
          title="Rejilla de registro"
          meta="Cada celda es un día. Pulsa para sellar o anular."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center border border-border/80 p-0.5 bg-panel-deep">
                <button
                  onClick={() => setViewMode("semanas")}
                  className={cn(
                    "px-2 py-0.5 font-mono text-[10px] transition-colors",
                    viewMode === "semanas"
                      ? "bg-amber/20 text-amber font-bold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  5 Semanas
                </button>
                <button
                  onClick={() => setViewMode("matriz")}
                  className={cn(
                    "px-2 py-0.5 font-mono text-[10px] transition-colors",
                    viewMode === "matriz"
                      ? "bg-amber/20 text-amber font-bold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Matriz 7×5
                </button>
              </div>
              <button
                onClick={() => setShowMissionModal(true)}
                className="border border-border/80 bg-panel-deep px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:border-amber hover:text-amber transition-colors"
              >
                + Asignar Misión
              </button>
              <button
                onClick={() => setShowRoutineModal(true)}
                className="border border-amber/70 bg-amber/10 px-2 py-0.5 font-mono text-[10px] text-amber hover:bg-amber/20 transition-colors"
              >
                + Nueva Rutina
              </button>
            </div>
          }
        >
          {viewMode === "semanas" ? (
            /* Vista 1: Todas las rutinas agrupadas por 5 semanas */
            <div className="overflow-x-auto">
              <div className="min-w-[1020px] space-y-2">
                {/* Cabecera de semanas y días */}
                <div className="grid grid-cols-[minmax(190px,1fr)_auto] items-end gap-3 pb-2 border-b border-border/70">
                  <span className="label-mono">Rutina / Protocolo</span>
                  <div className="flex gap-2.5">
                    {weeks.map((week) => (
                      <div
                        key={week.weekNum}
                        className={cn(
                          "flex flex-col p-1.5 border relative",
                          week.hasToday ? "border-amber/60 bg-amber/[0.04]" : "border-border/60 bg-panel/30",
                        )}
                      >
                        {/* Remaches decorativos */}
                        <span className="absolute top-0.5 left-1 text-[7px] leading-none text-muted-foreground/30 select-none">·</span>
                        <span className="absolute top-0.5 right-1 text-[7px] leading-none text-muted-foreground/30 select-none">·</span>
                        
                        <div className="flex items-center justify-between px-0.5 mb-1 font-mono text-[9px]">
                          <span className={cn(week.hasToday ? "text-amber font-bold uppercase" : "text-muted-foreground")}>
                            {week.label}
                          </span>
                          <span className="text-[8px] text-muted-foreground/60">{week.dateRange}</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {week.days.map((d) => (
                            <div
                              key={d.dateKey}
                              className={cn(
                                "w-6 text-center font-mono py-0.5 transition-colors",
                                d.isToday
                                  ? "bg-amber/20 border-b-2 border-amber text-amber font-bold"
                                  : "text-muted-foreground/70",
                              )}
                            >
                              <div className="text-[8px] uppercase leading-tight">{d.weekdayLabel}</div>
                              <div className="text-[9px] font-bold leading-tight">{d.dayNum}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lista de rutinas */}
                <ul className="space-y-2">
                  {routines.map((r) => {
                    const log = state.routine_log[r.id] ?? [];
                    return (
                      <li
                        key={r.id}
                        className="grid grid-cols-[minmax(190px,1fr)_auto] items-center gap-3 border border-border/60 bg-panel-deep/40 p-2"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="truncate text-xs text-foreground font-medium">{r.title}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            racha <span className="text-amber">{r.streak_count}d</span> · +{r.reward_xp} xp
                            {r.reward_credits > 0 ? ` · +${r.reward_credits} ${state.profile.currency || "cr"}` : ""}
                          </p>
                        </div>
                        <div className="flex gap-2.5">
                          {weeks.map((week) => (
                            <div
                              key={week.weekNum}
                              className={cn(
                                "grid grid-cols-7 gap-1 p-1 border relative",
                                week.hasToday ? "border-amber/40 bg-amber/[0.02]" : "border-border/40 bg-panel-deep/20",
                              )}
                            >
                              <span className="absolute -top-0.5 -left-0.5 text-[8px] leading-none text-muted-foreground/30 select-none">·</span>
                              <span className="absolute -top-0.5 -right-0.5 text-[8px] leading-none text-muted-foreground/30 select-none">·</span>
                              {week.days.map((d) => {
                                const done = log.includes(d.dateKey);
                                return (
                                  <button
                                    key={d.dateKey}
                                    onClick={() => onCell(r.id, d.dateKey, r.title, r.reward_xp)}
                                    title={formatCellTooltip(d, done)}
                                    className={cn(
                                      "h-6 w-6 border text-[9px] font-mono flex items-center justify-center transition-all duration-150 relative",
                                      done
                                        ? "border-patina bg-patina text-panel-deep font-bold shadow-[0_0_8px_rgba(74,222,128,0.35)]"
                                        : d.isToday
                                          ? "border-2 border-amber bg-amber/15 text-amber ring-1 ring-amber/50 font-bold"
                                          : "border-border/70 bg-panel-deep text-muted-foreground/60 hover:border-amber/60 hover:text-foreground",
                                      d.isFuture && !done && "opacity-40",
                                    )}
                                  >
                                    {d.dayNum}
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </li>
                    );
                  })}
                  {routines.length === 0 && (
                    <li className="p-4 text-center font-mono text-xs text-muted-foreground border border-dashed border-border/60">
                      Sin rutinas registradas en el sector. Pulsa &quot;+ Nueva Rutina&quot; para programar una rutina diaria o semanal.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            /* Vista 2: Matriz 7 columnas (Lunes a Domingo) x 5 filas */
            <div className="space-y-4">
              {/* Selector de rutina */}
              <div className="flex flex-wrap gap-1.5 pb-2 border-b border-border/60">
                {routines.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoutineId(r.id)}
                    className={cn(
                      "px-2.5 py-1 font-mono text-xs border transition-colors",
                      (selectedRoutineId || routines[0]?.id) === r.id
                        ? "border-amber bg-amber/15 text-amber font-bold shadow-[0_0_6px_rgba(245,158,11,0.2)]"
                        : "border-border/70 text-muted-foreground hover:border-amber/50 hover:text-foreground",
                    )}
                  >
                    {r.title} ({r.streak_count}d)
                  </button>
                ))}
              </div>

              {activeRoutine ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-foreground font-semibold uppercase">{activeRoutine.title}</span>
                    <span className="text-muted-foreground">
                      Racha: <strong className="text-amber">{activeRoutine.streak_count} días</strong> · Recompensa: +{activeRoutine.reward_xp} xp
                    </span>
                  </div>

                  <div className="border border-border/80 bg-panel-deep/50 p-3 overflow-x-auto">
                    <div className="min-w-[620px]">
                      {/* 7 Columnas: Lunes a Domingo */}
                      <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                        {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((dayName, colIdx) => {
                          const isTodayCol = todayColIndex === colIdx;
                          return (
                            <div
                              key={dayName}
                              className={cn(
                                "py-1.5 px-1 font-mono text-xs border uppercase tracking-wider",
                                isTodayCol
                                  ? "border-amber bg-amber/20 text-amber font-bold shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                                  : "border-border/60 bg-panel text-muted-foreground",
                              )}
                            >
                              <span>{dayName}</span>
                              {isTodayCol && <span className="block text-[9px] text-amber">· HOY ·</span>}
                            </div>
                          );
                        })}
                      </div>

                      {/* 5 Filas de semanas */}
                      <div className="space-y-2">
                        {weeks.map((week) => (
                          <div key={week.weekNum} className="grid grid-cols-7 gap-2">
                            {week.days.map((d) => {
                              const done = activeLog.includes(d.dateKey);
                              const isTodayCol = todayColIndex === d.weekdayIndex;
                              return (
                                <button
                                  key={d.dateKey}
                                  onClick={() => onCell(activeRoutine.id, d.dateKey, activeRoutine.title, activeRoutine.reward_xp)}
                                  title={formatCellTooltip(d, done)}
                                  className={cn(
                                    "h-14 border p-1.5 flex flex-col justify-between text-left transition-all duration-150 relative",
                                    done
                                      ? "border-patina bg-patina/90 text-panel-deep font-bold shadow-[0_0_8px_rgba(74,222,128,0.25)]"
                                      : d.isToday
                                        ? "border-2 border-amber bg-amber/15 text-amber ring-1 ring-amber/50 font-bold"
                                        : isTodayCol
                                          ? "border-border/80 bg-amber/[0.03] hover:border-amber/60 text-muted-foreground"
                                          : "border-border/70 bg-panel-deep hover:border-amber/70 text-muted-foreground",
                                    d.isFuture && !done && "opacity-40",
                                  )}
                                >
                                  <span className="absolute top-0.5 right-0.5 text-[8px] leading-none opacity-40 select-none">·</span>
                                  <div className="flex items-center justify-between font-mono text-[11px]">
                                    <span className={cn(done ? "text-panel-deep font-bold" : d.isToday ? "text-amber font-bold" : "")}>
                                      {d.dayNum}
                                    </span>
                                    <span className="text-[9px] opacity-70">{d.monthLabel}</span>
                                  </div>
                                  <div className="font-mono text-[10px] tracking-tight uppercase truncate">
                                    {done ? "✓ Sellado" : d.isToday ? "⚡ Pendiente" : d.isFuture ? "Futuro" : "—"}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center font-mono text-xs text-muted-foreground border border-dashed border-border/60">
                  Sin rutinas para mostrar en matriz.
                </div>
              )}
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Rachas individuales" meta="Días consecutivos por rutina">
            <ul className="space-y-3">
              {routines.map((r) => (
                <li key={r.id}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-xs text-foreground">
                      {r.title}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-amber">
                      {r.streak_count} d
                    </span>
                  </div>
                  <StatBar
                    value={Math.min(100, (r.streak_count / 40) * 100)}
                    tone={r.streak_count >= 21 ? "patina" : "amber"}
                    className="mt-1.5"
                  />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Registro de hoy" meta={todayKey}>
            <ul className="space-y-2">
              {routines.map((r) => {
                const done = (state.routine_log[r.id] ?? []).includes(todayKey);
                return (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-3 border border-border/70 px-3 py-2"
                  >
                    <span className="min-w-0 truncate text-xs text-foreground">
                      {r.title}
                    </span>
                    <button
                      onClick={() => onCell(r.id, todayKey, r.title, r.reward_xp)}
                      className={cn(
                        "shrink-0 border px-2 py-1 font-mono text-[10px] tracking-[0.14em] uppercase",
                        done
                          ? "border-patina/70 text-patina"
                          : "border-brass/70 text-brass hover:border-amber hover:text-amber",
                      )}
                    >
                      {done ? "sellado" : "sellar"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>

      <NewContractModal
        isOpen={showRoutineModal}
        onClose={() => setShowRoutineModal(false)}
        defaultType="rutina"
        defaultSectorId={state.sectors.find((s) => s.key === "rutinas")?.id}
      />
      <NewContractModal
        isOpen={showMissionModal}
        onClose={() => setShowMissionModal(false)}
        defaultType="mayor"
        defaultSectorId={state.sectors.find((s) => s.key === "mando")?.id}
      />
    </Shell>
  );
}

