import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Shell } from "@/components/quarry/shell";
import { Panel, StatBar, Tag } from "@/components/quarry/panel";
import { ContractRow } from "@/components/quarry/contract-row";
import {
  NewWorkoutModal,
  NewPersonalRecordModal,
  UpdatePersonalRecordModal,
} from "@/components/quarry/body-dialogs";
import {
  Activity,
  Dumbbell,
  Ruler,
  Timer,
  Trophy,
  Plus,
  Scale,
  BatteryWarning,
  BatteryLow,
  BatteryMedium,
  Battery,
  BatteryCharging,
  Moon,
  Edit3,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useQuarry } from "@/lib/state/quarry";
import { cn } from "@/lib/utils";
import type { PersonalRecord } from "@/lib/data/types";

const ENERGY_OPTIONS = [
  { level: 1, label: "Agotado", pct: 20, icon: BatteryWarning, color: "text-rust border-rust/40 hover:border-rust" },
  { level: 2, label: "Desgastado", pct: 40, icon: BatteryLow, color: "text-amber/70 border-amber/30 hover:border-amber" },
  { level: 3, label: "Estable", pct: 60, icon: BatteryMedium, color: "text-amber border-amber/40 hover:border-amber" },
  { level: 4, label: "Firme", pct: 80, icon: Battery, color: "text-patina/80 border-patina/40 hover:border-patina" },
  { level: 5, label: "A tope", pct: 100, icon: BatteryCharging, color: "text-patina border-patina hover:border-patina" },
];

const MOOD_OPTIONS = [
  "combativo",
  "enfocado",
  "neutro",
  "fatigado",
  "sobrecargado",
];

export const Route = createFileRoute("/cuerpo")({
  head: () => ({
    meta: [
      { title: "Sector del Cuerpo · QUARRY" },
      {
        name: "description",
        content:
          "Masa corporal, medidas, récords personales, volumen de entrenamiento y contratos físicos del cazador en la terminal QUARRY.",
      },
      { property: "og:title", content: "Sector del Cuerpo · QUARRY" },
      {
        property: "og:description",
        content:
          "Bitácora de entrenamientos y mantenimiento del chasis biológico del cazador.",
      },
    ],
  }),
  component: CuerpoPage,
});

const weightConfig = {
  peso: { label: "Masa corporal", color: "var(--amber)" },
} satisfies ChartConfig;

const volumeConfig = {
  minutos: { label: "Minutos", color: "var(--patina)" },
} satisfies ChartConfig;

function weekKey(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

function CuerpoPage() {
  const { state, completeContract, isLoading, addBodyStat, submitDailyCheckin } = useQuarry();
  const [flash, setFlash] = useState<string | null>(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedRecordToUpdate, setSelectedRecordToUpdate] = useState<PersonalRecord | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [savingWeight, setSavingWeight] = useState(false);

  // Check-in diario de energía y disposición
  const [isEditingCheckin, setIsEditingCheckin] = useState(false);
  const [selectedEnergy, setSelectedEnergy] = useState<number>(3);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [sleepHoursInput, setSleepHoursInput] = useState<string>("");
  const [savingCheckin, setSavingCheckin] = useState(false);

  function handleStartEditingCheckin() {
    if (state?.today_checkin) {
      setSelectedEnergy(state.today_checkin.energy_level);
      setSelectedMood(state.today_checkin.mood || "");
      setSleepHoursInput(state.today_checkin.sleep_hours != null ? String(state.today_checkin.sleep_hours) : "");
    }
    setIsEditingCheckin(true);
  }

  async function handleSaveCheckin() {
    setSavingCheckin(true);
    try {
      const res = await submitDailyCheckin({
        energy_level: selectedEnergy,
        mood: selectedMood || null,
        sleep_hours: sleepHoursInput ? parseFloat(sleepHoursInput) : null,
      });
      if (res) {
        toast.success(`Check-in diario registrado · Energía al ${selectedEnergy * 20}%`);
        setIsEditingCheckin(false);
      } else {
        toast.error("Error al registrar check-in");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar check-in");
    } finally {
      setSavingCheckin(false);
    }
  }


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

  const weights = state.body_stats
    .filter((b) => b.metric === "peso")
    .slice()
    .sort((a, b) => +new Date(a.recorded_at) - +new Date(b.recorded_at));
  const measures = state.body_stats.filter((b) => b.metric === "medida");
  const records = state.body_stats.filter((b) => b.metric === "record_personal");

  const currentWeight = weights[weights.length - 1]?.value ?? 0;
  const firstWeight = weights[0]?.value ?? currentWeight;
  const weightDelta = currentWeight - firstWeight;

  const weightData = weights.map((w) => ({
    label: new Date(w.recorded_at).toLocaleDateString("es", {
      day: "2-digit",
      month: "short",
    }),
    peso: w.value,
  }));

  const weeks = useMemo(() => {
    const out: { key: number; label: string; minutos: number; sesiones: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = weekKey(new Date());
      start.setDate(start.getDate() - i * 7);
      out.push({
        key: +start,
        label: start.toLocaleDateString("es", { day: "2-digit", month: "short" }),
        minutos: 0,
        sesiones: 0,
      });
    }
    state.workouts.forEach((w) => {
      const k = +weekKey(new Date(w.date));
      const bucket = out.find((b) => b.key === k);
      if (bucket) {
        bucket.minutos += w.duration_minutes;
        bucket.sesiones += 1;
      }
    });
    return out;
  }, [state.workouts]);

  const thisWeek = weeks[weeks.length - 1];
  const lastWeek = weeks[weeks.length - 2];
  const avgMinutes = Math.round(weeks.reduce((a, w) => a + w.minutos, 0) / weeks.length);
  const volumeDelta = thisWeek.minutos - (lastWeek?.minutos ?? 0);

  // Tendencia semanal honesta de energía reportada (compara últimos 7 vs anteriores 7)
  const energyTrend = useMemo(() => {
    const checkins = state?.recent_checkins || [];
    if (checkins.length < 4) {
      return {
        status: "gathering",
        label: "Aún reuniendo datos",
        arrow: "·",
        color: "text-muted-foreground border-border/60 bg-panel-deep/50",
      };
    }
    const last7 = checkins.slice(0, 7);
    const prev7 = checkins.slice(7, 14);

    const avgLast7 = last7.reduce((sum, c) => sum + c.energy_level, 0) / last7.length;

    let diff = 0;
    if (prev7.length >= 2) {
      const avgPrev7 = prev7.reduce((sum, c) => sum + c.energy_level, 0) / prev7.length;
      diff = avgLast7 - avgPrev7;
    } else {
      const half = Math.floor(checkins.length / 2);
      const recentHalf = checkins.slice(0, half);
      const olderHalf = checkins.slice(half);
      const avgRecent = recentHalf.reduce((sum, c) => sum + c.energy_level, 0) / recentHalf.length;
      const avgOlder = olderHalf.reduce((sum, c) => sum + c.energy_level, 0) / olderHalf.length;
      diff = avgRecent - avgOlder;
    }

    if (diff > 0.25) {
      return {
        status: "up",
        label: "Energía al alza",
        arrow: "↑",
        color: "text-patina border-patina/40 bg-patina/10",
      };
    } else if (diff < -0.25) {
      return {
        status: "down",
        label: "Energía a la baja",
        arrow: "↓",
        color: "text-rust border-rust/40 bg-rust/10",
      };
    } else {
      return {
        status: "stable",
        label: "Energía estable",
        arrow: "→",
        color: "text-amber border-amber/40 bg-amber/10",
      };
    }
  }, [state?.recent_checkins]);

  const recent = state.workouts
    .slice()
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 8);

  const cuerpoSector = state.sectors.find(
    (s) => s.key === "cuerpo" || s.name.toLowerCase().includes("cuerpo"),
  );
  const sectorContracts = state.contracts.filter(
    (c) => c.sector_id === "sec_cuerpo" || (cuerpoSector && c.sector_id === cuerpoSector.id),
  );

  function handleComplete(id: string) {
    const c = state?.contracts.find((x) => x.id === id);
    completeContract(id);
    if (c) setFlash(`Contrato físico sellado · +${c.reward_xp} xp`);
    setTimeout(() => setFlash(null), 2200);
  }

  async function handleRegisterWeight(e: React.FormEvent) {
    e.preventDefault();
    const val = Number(weightInput);
    if (!val || val <= 0) {
      toast.error("Ingresa un peso válido");
      return;
    }
    setSavingWeight(true);
    try {
      const res = await addBodyStat({
        metric: "peso",
        label: "Masa corporal",
        value: val,
        unit: "kg",
        recorded_at: new Date().toISOString(),
      });
      if (res) {
        toast.success(`Peso de ${val.toFixed(1)} kg registrado en el expediente`);
        setWeightInput("");
      } else {
        toast.error("Error al persistir el peso");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar peso");
    } finally {
      setSavingWeight(false);
    }
  }

  return (
    <Shell
      title="Sector del Cuerpo"
      subtitle={`${currentWeight.toFixed(1)} kg · ${thisWeek.sesiones} sesiones esta semana · ${thisWeek.minutos} min acumulados`}
    >
      {flash && (
        <div className="stamp-in mb-4 inline-block border border-patina px-3 py-1 font-mono text-[11px] tracking-[0.18em] text-patina uppercase">
          {flash}
        </div>
      )}

      {/* ─── PARTE A: CHECK-IN DIARIO DE ENERGÍA Y ESTADO REAL ─── */}
      <div className="mb-4 border border-border bg-panel/75 p-3.5 transition-all">
        {state.today_checkin && !isEditingCheckin ? (
          /* Modo Lectura */
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {(() => {
                const opt =
                  ENERGY_OPTIONS.find((o) => o.level === state.today_checkin?.energy_level) ||
                  ENERGY_OPTIONS[2];
                const Icon = opt.icon;
                return (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-border bg-panel-deep">
                    <Icon className={cn("h-6 w-6", opt.color.split(" ")[0])} />
                  </div>
                );
              })()}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display text-base tracking-wide text-foreground">
                    Check-in Diario Registrado
                  </span>
                  <span className="inline-flex items-center gap-1 border border-patina/40 bg-patina/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-patina">
                    <CheckCircle2 className="h-3 w-3" /> Hoy
                  </span>
                  <span className={cn("inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider", energyTrend.color)}>
                    <span>{energyTrend.arrow}</span>
                    <span>{energyTrend.label}</span>
                  </span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
                  <span>
                    Energía:{" "}
                    <strong className="text-amber">
                      {state.today_checkin.energy_level * 20}%
                    </strong>{" "}
                    ({ENERGY_OPTIONS.find((o) => o.level === state.today_checkin?.energy_level)?.label})
                  </span>
                  {state.today_checkin.sleep_hours != null && (
                    <span>
                      · Sueño:{" "}
                      <strong className="text-foreground">
                        {state.today_checkin.sleep_hours} hrs
                      </strong>
                    </span>
                  )}
                  {state.today_checkin.mood && (
                    <span>
                      · Ánimo:{" "}
                      <strong className="text-brass capitalize">
                        {state.today_checkin.mood}
                      </strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartEditingCheckin}
              className="self-start sm:self-center flex items-center gap-1.5 border border-border bg-panel-deep/80 px-2.5 py-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:border-amber hover:text-amber transition-colors"
            >
              <Edit3 className="h-3 w-3" /> Editar
            </button>
          </div>
        ) : (
          /* Modo Formulario / Selector rápido */
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display text-base tracking-wider text-amber uppercase">
                    {isEditingCheckin ? "Actualizar Check-in Diario" : "Check-in Diario · Estado del Cazador"}
                  </p>
                  <span className={cn("inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider", energyTrend.color)}>
                    <span>{energyTrend.arrow}</span>
                    <span>{energyTrend.label}</span>
                  </span>
                </div>
                <p className="font-mono text-xs text-muted-foreground mt-0.5">
                  Indica cómo llegó tu chasis biológico hoy para llevar un registro real de cómo te sientes cada día.
                </p>
              </div>
              {isEditingCheckin && (
                <button
                  type="button"
                  onClick={() => setIsEditingCheckin(false)}
                  className="font-mono text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                >
                  Cancelar
                </button>
              )}
            </div>

            {/* Selector de 5 niveles de energía */}
            <div>
              <p className="label-mono mb-1.5">Nivel de energía operativa (1 a 5)</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {ENERGY_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedEnergy === opt.level;
                  return (
                    <button
                      key={opt.level}
                      type="button"
                      onClick={() => setSelectedEnergy(opt.level)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 border p-2.5 text-center transition-all cursor-pointer",
                        isSelected
                          ? "border-amber bg-amber/15 shadow-[0_0_12px_rgba(217,119,6,0.2)]"
                          : "border-border bg-panel-deep/60 hover:border-border/80 hover:bg-panel-deep"
                      )}
                    >
                      <Icon className={cn("h-5 w-5", isSelected ? "text-amber" : "text-muted-foreground")} />
                      <span className={cn("font-display text-sm uppercase tracking-wide", isSelected ? "text-amber font-semibold" : "text-foreground")}>
                        {opt.label}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {opt.pct}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fila secundaria: Sueño y Ánimo */}
            <div className="grid gap-3 sm:grid-cols-2 pt-1 border-t border-border/50">
              <div>
                <label className="label-mono flex items-center gap-1.5 mb-1">
                  <Moon className="h-3 w-3 text-patina" /> Horas de sueño (opcional)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  placeholder="ej. 7.5"
                  value={sleepHoursInput}
                  onChange={(e) => setSleepHoursInput(e.target.value)}
                  className="w-full border border-border bg-panel-deep/80 px-2.5 py-1 font-mono text-xs text-foreground outline-none focus:border-amber placeholder:text-muted-foreground/50"
                />
              </div>

              <div>
                <label className="label-mono mb-1 block">Estado anímico (opcional)</label>
                <div className="flex flex-wrap gap-1.5">
                  {MOOD_OPTIONS.map((m) => {
                    const isMoodSelected = selectedMood === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSelectedMood(isMoodSelected ? "" : m)}
                        className={cn(
                          "border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer",
                          isMoodSelected
                            ? "border-amber bg-amber/20 text-amber font-semibold"
                            : "border-border/70 bg-panel-deep/60 text-muted-foreground hover:border-border hover:text-foreground"
                        )}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Botón de guardado rápido */}
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveCheckin()}
                disabled={savingCheckin}
                className="flex items-center gap-1.5 border border-amber bg-amber/20 px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-amber hover:bg-amber/30 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5" />
                {savingCheckin ? "Guardando lectura..." : isEditingCheckin ? "Actualizar Check-in" : "Registrar Check-in de Hoy"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Barra de acciones rápidas */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form onSubmit={handleRegisterWeight} className="flex items-center gap-1.5 border border-border bg-panel-deep/80 p-1">
          <Scale className="ml-1.5 h-3.5 w-3.5 text-amber" />
          <input
            type="number"
            step="0.1"
            min="20"
            max="300"
            placeholder="Peso hoy (kg)"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="w-28 bg-transparent px-1.5 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/60"
          />
          <button
            type="submit"
            disabled={savingWeight || !weightInput}
            className="border border-amber bg-amber/15 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-amber hover:bg-amber/25 disabled:opacity-50 transition-colors"
          >
            {savingWeight ? "..." : "Sellar Peso"}
          </button>
        </form>

        <button
          onClick={() => setShowWorkoutModal(true)}
          className="flex items-center gap-1.5 border border-patina bg-patina/15 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-patina hover:bg-patina/25 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Anotar Entrenamiento
        </button>

        <button
          onClick={() => setShowRecordModal(true)}
          className="flex items-center gap-1.5 border border-border bg-panel-deep/60 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:border-brass hover:text-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Declarar Récord
        </button>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-3">
        <Panel
          riveted
          title="Ficha de estado físico"
          meta="Chasis biológico · lectura del último registro"
          className="flicker-in xl:col-span-2"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="label-mono">Masa corporal</p>
              <p className="font-display mt-1 text-4xl tracking-[0.12em] text-amber">
                {currentWeight.toFixed(1)}
                <span className="ml-2 font-mono text-sm tracking-normal text-muted-foreground">
                  kg
                </span>
              </p>
              <p
                className={cn(
                  "mt-1.5 font-mono text-xs",
                  weightDelta <= 0 ? "text-patina" : "text-rust",
                )}
              >
                {weightDelta >= 0 ? "+" : ""}
                {weightDelta.toFixed(1)} kg en {weights.length} registros semanales
              </p>
              <div className="mt-4">
                {weightData.length >= 2 ? (
                  <ChartContainer config={weightConfig} className="h-[150px] w-full">
                    <LineChart data={weightData} margin={{ left: 0, right: 8, top: 8 }}>
                      <CartesianGrid
                        vertical={false}
                        stroke="var(--border)"
                        strokeDasharray="2 4"
                      />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                      />
                      <YAxis
                        width={34}
                        domain={["dataMin - 1", "dataMax + 1"]}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="peso"
                        stroke="var(--amber)"
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <div className="flex h-[150px] w-full items-center justify-center border border-dashed border-border/50 p-4 text-center font-mono text-xs text-muted-foreground">
                    {weightData.length === 1
                      ? `Un solo registro (${weightData[0].peso} kg). Se requieren al menos 2 marcas para trazar la curva.`
                      : "Sin registros de masa corporal. Registra tu peso para ver la tendencia."}
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="label-mono inline-flex items-center gap-1.5">
                <Ruler className="h-3.5 w-3.5" /> Medidas clave
              </p>
              <ul className="mt-2 grid grid-cols-2 gap-2">
                {measures.map((m) => (
                  <li key={m.id} className="border border-border bg-panel-deep/50 p-3">
                    <p className="label-mono truncate">{m.label}</p>
                    <p className="mt-1 font-mono text-lg text-foreground">
                      {m.value}
                      <span className="ml-1 text-[11px] text-muted-foreground">
                        {m.unit}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>

        <Panel title="Volumen semanal" meta="Minutos entrenados · últimas 6 semanas">
          <ChartContainer config={volumeConfig} className="h-[180px] w-full">
            <BarChart data={weeks} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="2 4"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              />
              <YAxis
                width={30}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="minutos"
                fill="var(--patina)"
                radius={0}
                isAnimationActive={false}
              />
            </BarChart>
          </ChartContainer>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Mini label="Esta semana" value={`${thisWeek.minutos} min`} />
            <Mini label="Media 6 sem" value={`${avgMinutes} min`} />
            <Mini
              label="Variación"
              value={`${volumeDelta >= 0 ? "+" : ""}${volumeDelta} min`}
              tone={volumeDelta >= 0 ? "text-patina" : "text-rust"}
            />
          </div>
        </Panel>

        <Panel
          title="Récords personales"
          meta="Progreso hacia la marca declarada"
          className="xl:col-span-2"
          actions={
            <button
              onClick={() => setShowRecordModal(true)}
              className="border border-border/80 px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:border-amber hover:text-amber transition-colors"
            >
              + Récord
            </button>
          }
        >
          <ul className="grid gap-3 sm:grid-cols-2">
            {state.personal_records.map((r) => {
              const pct = Math.min(100, (r.current / r.target) * 100);
              return (
                <li key={r.id} className="border border-border/70 bg-panel-deep/40 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <Trophy className="h-3.5 w-3.5 shrink-0 text-brass" />
                      <span className="truncate text-sm text-foreground">{r.lift}</span>
                    </span>
                    <span className="shrink-0 font-mono text-sm text-amber">
                      {r.current}
                      <span className="text-[11px] text-muted-foreground"> {r.unit}</span>
                    </span>
                  </div>
                  <StatBar value={pct} tone="brass" className="mt-2" />
                  <div className="mt-2 flex items-center justify-between">
                    <p className="font-mono text-[10px] text-muted-foreground">
                      objetivo {r.target} {r.unit} · faltan{" "}
                      {Math.max(0, r.target - r.current).toFixed(1)} {r.unit}
                    </p>
                    <button
                      onClick={() => setSelectedRecordToUpdate(r)}
                      className="border border-border/70 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:border-amber hover:text-amber transition-colors"
                    >
                      Actualizar
                    </button>
                  </div>
                </li>
              );
            })}
            {state.personal_records.length === 0 && (
              <li className="p-4 text-center font-mono text-xs text-muted-foreground border border-dashed border-border/60 sm:col-span-2">
                Sin récords personales declarados. Pulsa &quot;Declarar Récord&quot; para fijar un objetivo de fuerza.
              </li>
            )}
          </ul>
          {records.length > 0 && (
            <p className="label-mono mt-3">
              {records.length} marcas verificadas en la hoja de cazador.
            </p>
          )}
        </Panel>

        <Panel title="Contratos del sector" meta="Cuerpo · asignados al cazador">
          <ul className="space-y-2">
            {sectorContracts.map((c) => (
              <ContractRow key={c.id} contract={c} onComplete={handleComplete} />
            ))}
          </ul>
        </Panel>

        <Panel
          title="Bitácora de entrenamientos"
          meta="Registro cronológico de las últimas sesiones"
          className="xl:col-span-3"
          actions={
            <button
              onClick={() => setShowWorkoutModal(true)}
              className="border border-patina/70 bg-patina/10 px-2 py-0.5 font-mono text-[10px] text-patina hover:bg-patina/20 transition-colors"
            >
              + Anotar Sesión
            </button>
          }
        >
          <ul className="space-y-2">
            {recent.map((w) => (
              <li
                key={w.id}
                className="flex items-start gap-3 border border-border/70 bg-panel-deep/40 p-3"
              >
                <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center border border-brass/70 text-brass">
                  {w.type.startsWith("Fuerza") ? (
                    <Dumbbell className="h-3.5 w-3.5" />
                  ) : (
                    <Activity className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag tone={w.type.startsWith("Fuerza") ? "amber" : "patina"}>
                      {w.type}
                    </Tag>
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                      <Timer className="h-3 w-3" />
                      {w.duration_minutes} min
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {new Date(w.date).toLocaleDateString("es", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {w.notes}
                  </p>
                </div>
              </li>
            ))}
            {recent.length === 0 && (
              <li className="p-4 text-center font-mono text-xs text-muted-foreground border border-dashed border-border/60">
                Sin entrenamientos registrados en la bitácora. Pulsa &quot;Anotar Entrenamiento&quot; para registrar el primero.
              </li>
            )}
          </ul>
        </Panel>
      </div>

      <NewWorkoutModal
        isOpen={showWorkoutModal}
        onClose={() => setShowWorkoutModal(false)}
      />
      <NewPersonalRecordModal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
      />
      <UpdatePersonalRecordModal
        record={selectedRecordToUpdate}
        onClose={() => setSelectedRecordToUpdate(null)}
      />
    </Shell>
  );
}

function Mini({
  label,
  value,
  tone = "text-foreground",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="border border-border bg-panel-deep/50 p-2">
      <p className="label-mono leading-tight">{label}</p>
      <p className={`mt-1 font-mono text-xs ${tone}`}>{value}</p>
    </div>
  );
}
