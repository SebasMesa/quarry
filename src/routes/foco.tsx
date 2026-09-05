import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Orbit,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Clock,
  Flame,
  Plus,
  Compass,
  Calendar,
  Layers,
} from "lucide-react";
import { Shell } from "@/components/quarry/shell";
import { Panel, StatBar } from "@/components/quarry/panel";
import { useQuarry } from "@/lib/state/quarry";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { FocusSession } from "@/lib/data/types";

export const Route = createFileRoute("/foco")({
  head: () => ({
    meta: [
      { title: "Sector de Foco · QUARRY" },
      {
        name: "description",
        content:
          "Sesiones de trabajo y concentración del cazador con proyección en carta estelar en la terminal QUARRY.",
      },
    ],
  }),
  component: FocoPage,
});

const PRESETS = [
  { label: "Golpe Táctico", minutes: 25, desc: "25 min · Alta intensidad" },
  { label: "Inmersión", minutes: 50, desc: "50 min · Bloque profundo" },
  { label: "Ciclo Extendido", minutes: 90, desc: "90 min · Resistencia mental" },
  { label: "Libre", minutes: 0, desc: "Cronómetro abierto" },
] as const;

// Hash determinístico simple de cadena a entero positivo
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Algoritmo determinístico de racha para sesiones de foco
function calculateFocusStreakDays(sessions: FocusSession[]): number {
  if (!sessions || sessions.length === 0) return 0;

  const datesWithSession = new Set<string>();
  for (const s of sessions) {
    if (s.started_at) {
      datesWithSession.add(s.started_at.slice(0, 10));
    }
  }

  if (datesWithSession.size === 0) return 0;

  const nowMs = Date.now();
  const DAY_MS = 86400000;
  const todayStr = new Date(nowMs).toISOString().slice(0, 10);
  const yesterdayStr = new Date(nowMs - DAY_MS).toISOString().slice(0, 10);

  let streak = 0;
  let offsetDays = 0;

  if (datesWithSession.has(todayStr)) {
    streak = 1;
    offsetDays = 1;
  } else if (datesWithSession.has(yesterdayStr)) {
    streak = 1;
    offsetDays = 2;
  } else {
    return 0;
  }

  while (true) {
    const prevDateStr = new Date(nowMs - offsetDays * DAY_MS).toISOString().slice(0, 10);
    if (datesWithSession.has(prevDateStr)) {
      streak++;
      offsetDays++;
    } else {
      break;
    }
  }

  return streak;
}

function FocoPage() {
  const { state, isLoading, addFocusSession } = useQuarry();

  // Timer state
  const [selectedMinutes, setSelectedMinutes] = useState<number>(25);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [focusLabel, setFocusLabel] = useState("");
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);

  // Manual modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualMinutes, setManualMinutes] = useState("30");
  const [manualLabel, setManualLabel] = useState("");
  const [savingManual, setSavingManual] = useState(false);

  // Hovered star for star chart
  const [hoveredStar, setHoveredStar] = useState<FocusSession | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset or initialize timer when preset changes
  function handleSelectPreset(mins: number) {
    if (isTimerRunning) {
      if (!confirm("El temporizador está en curso. ¿Deseas reiniciar la sesión?")) return;
    }
    setIsTimerRunning(false);
    setSelectedMinutes(mins);
    if (mins === 0) {
      setSecondsRemaining(0);
      setSecondsElapsed(0);
    } else {
      setSecondsRemaining(mins * 60);
      setSecondsElapsed(0);
    }
  }

  // Timer tick
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
        if (selectedMinutes > 0) {
          setSecondsRemaining((prev) => {
            if (prev <= 1) {
              handleCompleteSession();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, selectedMinutes]);

  function handleStartTimer() {
    if (!sessionStartTime) {
      setSessionStartTime(new Date().toISOString());
    }
    setIsTimerRunning(true);
  }

  function handlePauseTimer() {
    setIsTimerRunning(false);
  }

  function handleResetTimer() {
    if (isTimerRunning && !confirm("¿Detener y descartar la sesión actual?")) return;
    setIsTimerRunning(false);
    setSessionStartTime(null);
    setSecondsElapsed(0);
    if (selectedMinutes > 0) {
      setSecondsRemaining(selectedMinutes * 60);
    } else {
      setSecondsRemaining(0);
    }
  }

  async function handleCompleteSession() {
    setIsTimerRunning(false);
    const durationMinutes = Math.max(1, Math.round(secondsElapsed / 60));
    const startedAt = sessionStartTime || new Date(Date.now() - durationMinutes * 60000).toISOString();

    try {
      const res = await addFocusSession({
        started_at: startedAt,
        duration_minutes: durationMinutes,
        label: focusLabel.trim() || null,
      });

      if (res) {
        toast.success(`¡Sesión de foco sellada! +15 XP en Disciplina · ${durationMinutes} min de atención`);
        setFocusLabel("");
        setSessionStartTime(null);
        setSecondsElapsed(0);
        if (selectedMinutes > 0) {
          setSecondsRemaining(selectedMinutes * 60);
        } else {
          setSecondsRemaining(0);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al archivar la sesión de foco");
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const mins = parseInt(manualMinutes, 10);
    if (isNaN(mins) || mins <= 0 || mins > 720) {
      toast.error("Ingresa una duración válida en minutos (1 a 720)");
      return;
    }

    setSavingManual(true);
    try {
      const startedAt = new Date(Date.now() - mins * 60000).toISOString();
      const res = await addFocusSession({
        started_at: startedAt,
        duration_minutes: mins,
        label: manualLabel.trim() || null,
      });

      if (res) {
        toast.success(`Sesión retroactiva registrada · +15 XP en Disciplina · ${mins} min`);
        setManualMinutes("30");
        setManualLabel("");
        setShowManualModal(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar sesión");
    } finally {
      setSavingManual(false);
    }
  }

  // Focus statistics
  const sessions = state?.focus_sessions || [];

  const totalMinutes = useMemo(() => {
    return sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  }, [sessions]);

  const totalHours = (totalMinutes / 60).toFixed(1);

  const streakDays = useMemo(() => {
    return calculateFocusStreakDays(sessions);
  }, [sessions]);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const todaySessions = useMemo(() => {
    return sessions.filter((s) => s.started_at && s.started_at.slice(0, 10) === todayKey);
  }, [sessions, todayKey]);

  const todayMinutes = useMemo(() => {
    return todaySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  }, [todaySessions]);

  // Star calculation
  const stars = useMemo(() => {
    return sessions.map((s) => {
      const h = hashString(s.id || s.started_at);
      // Keep coordinates deterministically distributed inside the viewBox
      const cx = 6 + (h % 88);
      const cy = 8 + ((h >> 4) % 84);
      const size = 2 + ((h >> 8) % 3);
      const palette = ["#f59e0b", "#10b981", "#38bdf8", "#fbbf24", "#e2e8f0", "#a78bfa"];
      const fill = palette[h % palette.length];
      return {
        session: s,
        cx,
        cy,
        size,
        fill,
      };
    });
  }, [sessions]);

  // Timer format display
  const displayTime = useMemo(() => {
    if (selectedMinutes === 0) {
      // Cronómetro ascendente
      const m = Math.floor(secondsElapsed / 60);
      const s = secondsElapsed % 60;
      return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    const m = Math.floor(secondsRemaining / 60);
    const s = secondsRemaining % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [selectedMinutes, secondsRemaining, secondsElapsed]);

  const progressPct = useMemo(() => {
    if (selectedMinutes === 0) return 100;
    const totalSecs = selectedMinutes * 60;
    return Math.min(100, Math.round((secondsElapsed / totalSecs) * 100));
  }, [selectedMinutes, secondsElapsed]);

  if (isLoading || !state || !state.profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="font-display text-2xl text-amber">QUARRY</p>
          <p className="label-mono mt-2">Sintonizando sector de foco...</p>
        </div>
      </div>
    );
  }

  return (
    <Shell
      title="Sector de Foco"
      subtitle={`Atención sostenida · ${totalHours} hrs acumuladas · ${streakDays} d de racha de foco`}
    >
      {/* ─── FILA SUPERIOR: TEMPORIZADOR Y CARTA ESTELAR ─── */}
      <div className="grid gap-4 lg:grid-cols-12 items-start mb-6">
        {/* TEMPORIZADOR DE CONCENTRACIÓN (5 cols) */}
        <div className="lg:col-span-5 border border-border bg-panel p-5 relative overflow-hidden flex flex-col justify-between shadow-lg">
          {/* Fondo tenue decorativo de retícula */}
          <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Orbit className="h-4 w-4 text-amber animate-spin-slow" />
                <span className="font-display text-base uppercase tracking-wider text-amber">
                  Cámara de Enfoque
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(true)}
                className="flex items-center gap-1 border border-border/80 bg-panel-deep px-2 py-1 font-mono text-[10px] text-muted-foreground hover:border-amber hover:text-amber transition-colors uppercase cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Manual
              </button>
            </div>

            {/* Selector de Presets */}
            <div className="grid grid-cols-4 gap-1.5 mt-4">
              {PRESETS.map((p) => {
                const isSel = selectedMinutes === p.minutes;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleSelectPreset(p.minutes)}
                    className={cn(
                      "py-1.5 px-1 text-center font-mono text-[11px] uppercase tracking-wider border transition-colors cursor-pointer",
                      isSel
                        ? "border-amber bg-amber/20 text-amber font-semibold shadow-sm"
                        : "border-border/60 bg-panel-deep/60 text-muted-foreground hover:border-border hover:text-foreground"
                    )}
                  >
                    {p.minutes > 0 ? `${p.minutes}m` : "Libre"}
                  </button>
                );
              })}
            </div>

            {/* Display Gigante del Timer */}
            <div className="py-8 text-center">
              <div className="font-display text-6xl sm:text-7xl font-bold tracking-tight text-foreground font-mono">
                {displayTime}
              </div>
              <p className="font-mono text-xs text-muted-foreground mt-2">
                {selectedMinutes > 0
                  ? `${Math.floor(secondsElapsed / 60)} min transcurridos de ${selectedMinutes} min`
                  : `${Math.floor(secondsElapsed / 60)} min de sesión libre acumulados`}
              </p>

              {/* Barra de progreso */}
              {selectedMinutes > 0 && (
                <div className="w-full bg-panel-deep h-1.5 border border-border/50 mt-4 overflow-hidden">
                  <div
                    className="bg-amber h-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              )}
            </div>

            {/* Input de Objetivo / Etiqueta */}
            <div className="mb-4">
              <label className="label-mono mb-1 block">Objetivo del bloque (opcional)</label>
              <input
                type="text"
                value={focusLabel}
                onChange={(e) => setFocusLabel(e.target.value)}
                placeholder="ej. Refactor de contratos, lectura táctica, diseño..."
                disabled={isTimerRunning}
                className="w-full border border-border bg-panel-deep/80 px-2.5 py-1.5 font-mono text-xs text-foreground outline-none focus:border-amber placeholder:text-muted-foreground/50 disabled:opacity-75"
              />
            </div>
          </div>

          {/* Botones de Control */}
          <div className="relative z-10 pt-3 border-t border-border flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleResetTimer}
              disabled={secondsElapsed === 0 && !isTimerRunning}
              className="flex items-center gap-1 border border-border px-3 py-2 font-mono text-xs text-muted-foreground hover:border-rust hover:text-rust transition-colors disabled:opacity-30 cursor-pointer"
              title="Reiniciar temporizador"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-center gap-2">
              {isTimerRunning ? (
                <button
                  type="button"
                  onClick={handlePauseTimer}
                  className="flex items-center gap-1.5 border border-amber bg-amber/15 px-4 py-2 font-mono text-xs uppercase tracking-wider text-amber hover:bg-amber/25 transition-colors cursor-pointer"
                >
                  <Pause className="h-3.5 w-3.5" /> Pausar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartTimer}
                  className="flex items-center gap-1.5 border border-patina bg-patina/20 px-5 py-2 font-mono text-xs uppercase tracking-wider text-patina hover:bg-patina/30 font-semibold transition-colors cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" /> Iniciar Foco
                </button>
              )}

              {secondsElapsed >= 60 && (
                <button
                  type="button"
                  onClick={handleCompleteSession}
                  className="flex items-center gap-1.5 border border-amber bg-amber/20 px-3 py-2 font-mono text-xs uppercase tracking-wider text-amber hover:bg-amber/30 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Sellar (+15 XP)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CARTA ESTELAR: LIENZO SVG Y MÉTRICAS (7 cols) */}
        <div className="lg:col-span-7 border border-border bg-[#080a0f] p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-border/80">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber" />
              <span className="font-display text-base uppercase tracking-wider text-foreground">
                Carta Estelar de Foco
              </span>
            </div>
            <span className="font-mono text-[11px] text-patina border border-patina/30 bg-patina/10 px-2 py-0.5 uppercase tracking-wider">
              {stars.length} estrellas encendidas
            </span>
          </div>

          {/* Lienzo Cósmico SVG */}
          <div className="relative my-3 w-full h-[300px] border border-[#1f293d] bg-gradient-to-b from-[#06080d] via-[#090d16] to-[#04060a] rounded overflow-hidden">
            {/* Retícula tenue tipo radar celeste */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
            >
              <line x1="0" y1="50" x2="100" y2="50" stroke="#38bdf8" strokeWidth="0.2" strokeDasharray="1 2" />
              <line x1="50" y1="0" x2="50" y2="100" stroke="#38bdf8" strokeWidth="0.2" strokeDasharray="1 2" />
              <circle cx="50" cy="50" r="25" fill="none" stroke="#38bdf8" strokeWidth="0.2" strokeDasharray="2 3" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="#38bdf8" strokeWidth="0.2" strokeDasharray="2 3" />
            </svg>

            {/* Estrellas generadas de forma determinística */}
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full"
            >
              <defs>
                <filter id="star-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {stars.map(({ session, cx, cy, size, fill }) => {
                const isHovered = hoveredStar?.id === session.id;
                return (
                  <g key={session.id}>
                    {/* Halo de resplandor */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? size * 2.5 : size * 1.5}
                      fill={fill}
                      opacity={isHovered ? "0.6" : "0.25"}
                      className="transition-all duration-300 pointer-events-none"
                    />
                    {/* Punto estelar interactivo */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? size * 1.4 : size}
                      fill={fill}
                      filter="url(#star-glow)"
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredStar(session)}
                      onMouseLeave={() => setHoveredStar(null)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Leyenda vacía si no hay sesiones aún */}
            {stars.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <Orbit className="h-8 w-8 text-muted-foreground/40 animate-pulse mb-2" />
                <p className="font-display text-sm uppercase tracking-wider text-muted-foreground">
                  El cuadrante celeste está a oscuras
                </p>
                <p className="font-mono text-[11px] text-muted-foreground/60 max-w-xs mt-1">
                  Completa tu primera sesión de foco para encender tu primera estrella en la carta.
                </p>
              </div>
            )}

            {/* Tooltip de estrella activa */}
            {hoveredStar && (
              <div className="absolute bottom-2 left-2 right-2 border border-amber/50 bg-[#0f141f]/95 p-2 rounded shadow-xl pointer-events-none flex items-center justify-between font-mono text-xs">
                <div>
                  <span className="text-amber font-semibold">
                    {hoveredStar.duration_minutes} min de foco
                  </span>
                  {hoveredStar.label && (
                    <span className="text-foreground ml-2">· {hoveredStar.label}</span>
                  )}
                </div>
                <span className="text-muted-foreground text-[10px]">
                  {hoveredStar.started_at.slice(0, 10)}
                </span>
              </div>
            )}
          </div>

          {/* Cuadro de Indicadores Reales */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60">
            <div className="border border-border/60 bg-panel-deep/60 p-2.5 text-center">
              <p className="label-mono">Horas acumuladas</p>
              <p className="font-display text-xl text-amber mt-0.5">{totalHours}h</p>
              <p className="font-mono text-[10px] text-muted-foreground">{totalMinutes} min totales</p>
            </div>

            <div className="border border-border/60 bg-panel-deep/60 p-2.5 text-center">
              <p className="label-mono">Racha de foco</p>
              <p className="font-display text-xl text-patina mt-0.5">{streakDays} d</p>
              <p className="font-mono text-[10px] text-muted-foreground">Días consecutivos</p>
            </div>

            <div className="border border-border/60 bg-panel-deep/60 p-2.5 text-center">
              <p className="label-mono">Sesiones hoy</p>
              <p className="font-display text-xl text-foreground mt-0.5">{todaySessions.length}</p>
              <p className="font-mono text-[10px] text-muted-foreground">{todayMinutes} min hoy</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── HISTORIAL CRONOLÓGICO DE SESIONES DE FOCO ─── */}
      <Panel
        riveted
        title="Registro de Sesiones de Foco"
        meta="Historial de atención sostenida archivado en la terminal"
      >
        {sessions.length === 0 ? (
          <div className="text-center py-10 font-mono text-xs text-muted-foreground">
            Aún no has registrado sesiones de foco. Inicia el temporizador arriba para comenzar.
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.slice(0, 12).map((s) => (
              <div
                key={s.id}
                className="border border-border/70 bg-panel-deep/60 p-3 hover:border-amber/50 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-amber font-semibold flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> {s.duration_minutes} min
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      {s.started_at ? s.started_at.slice(0, 10) : ""}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-foreground mt-2 truncate">
                    {s.label || "Sesión de foco general"}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                  <span>Recompensa</span>
                  <span className="text-patina">+15 XP Disciplina</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* ─── MODAL: REGISTRO RETROACTIVO MANUAL ─── */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm border border-border bg-panel p-5 shadow-2xl">
            <div className="flex items-center gap-2 text-amber font-display text-lg uppercase tracking-wider pb-2 border-b border-border">
              <Plus className="h-4 w-4" /> Registro Manual de Foco
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4 pt-4">
              <div>
                <label className="label-mono mb-1 block">Duración de la sesión (minutos)</label>
                <input
                  type="number"
                  min="1"
                  max="720"
                  value={manualMinutes}
                  onChange={(e) => setManualMinutes(e.target.value)}
                  className="w-full border border-border bg-panel-deep p-2 font-mono text-sm text-foreground outline-none focus:border-amber"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="label-mono mb-1 block">Objetivo / Actividad (opcional)</label>
                <input
                  type="text"
                  value={manualLabel}
                  onChange={(e) => setManualLabel(e.target.value)}
                  placeholder="ej. Escritura de informe, deep work..."
                  className="w-full border border-border bg-panel-deep p-2 font-mono text-xs text-foreground outline-none focus:border-amber placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="border border-patina/30 bg-patina/5 p-2 font-mono text-[10px] text-patina/90">
                Regla de economía Quarry: Toda sesión registrada otorga exactamente 15 XP fijos hacia Disciplina, sin créditos.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="border border-amber bg-amber/20 px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-amber hover:bg-amber/30 disabled:opacity-50 cursor-pointer"
                >
                  {savingManual ? "Guardando..." : "Archivar Sesión"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Shell>
  );
}
