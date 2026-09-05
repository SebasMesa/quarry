import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bot, Flame, Zap, Coins } from "lucide-react";
import { Shell } from "@/components/quarry/shell";
import { Panel, StatBar, Tag } from "@/components/quarry/panel";
import { StatRadar } from "@/components/quarry/stat-radar";
import { ContractRow } from "@/components/quarry/contract-row";
import { Onboarding } from "@/components/quarry/onboarding";
import { NewContractModal } from "@/components/quarry/contract-dialog";
import { useQuarry } from "@/lib/state/quarry";
import { RANK_LABELS, rankProgress } from "@/lib/data/archetypes";
import { getDroidMood } from "@/lib/state/hunter-metrics";
import { cn } from "@/lib/utils";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QUARRY · Panel de mando del cazador" },
      {
        name: "description",
        content:
          "Terminal de contratos post-colapso: rango, créditos, atributos y contratos del día en un HUD ámbar sobre negro.",
      },
      { property: "og:title", content: "QUARRY · Panel de mando del cazador" },
      {
        property: "og:description",
        content:
          "Gestiona tu vida real como contratos de cazarrecompensas desde una terminal superviviente.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { state, onboarded, isLoading } = useQuarry();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  }

  // Verificar que state y profile existan
  if (!state || !state.profile) {
    return <Navigate to="/login" />;
  }

  if (!onboarded) return <Onboarding />;
  return <Mando />;
}
function Mando() {
  const { state, completeContract, sendDroidOnExpedition, claimDroidExpedition } = useQuarry();

  // 🔒 Verificación robusta
  if (!state || !state.profile) {
    return <Navigate to="/login" />;
  }

  const [flash, setFlash] = useState<string | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [contractFilter, setContractFilter] = useState<"todos" | "pendientes" | "completados" | "vencidos">("todos");
  const [expeditionLoading, setExpeditionLoading] = useState(false);

  const rank = rankProgress(state.profile.xp_total);
  const daily = state.contracts.filter((c) => c.type !== "rutina");
  const routines = state.contracts.filter((c) => c.type === "rutina");

  const filteredDaily = daily.filter((c) => {
    if (contractFilter === "todos") return true;
    if (contractFilter === "pendientes") return c.status === "pendiente";
    if (contractFilter === "completados") return c.status === "completado";
    if (contractFilter === "vencidos") return c.status === "vencido";
    return true;
  });

  const todayKey = new Date().toISOString().slice(0, 10);
  const contractsClosedToday = state.contracts.filter(
    (c) => c.status === "completado" && c.type !== "rutina" && c.completed_at?.slice(0, 10) === todayKey
  ).length;
  const workoutsToday = state.workouts.filter(
    (w) => w.date?.slice(0, 10) === todayKey
  ).length;
  const pending = state.contracts.filter((c) => c.status === "pendiente").length;
  const overdue = state.contracts.filter((c) => c.status === "vencido").length;

  const currency = state.profile.currency || "cr";

  function handleComplete(id: string, amount?: number) {
    const c = state?.contracts.find((x) => x.id === id);
    completeContract(id, amount);
    if (c) {
      if (c.is_financial && amount) {
        setFlash(`Registro sellado · +${c.reward_xp} xp · +${amount.toLocaleString("es")} ${currency}`);
      } else if (c.reward_credits > 0) {
        setFlash(`Registro sellado · +${c.reward_xp} xp · +${c.reward_credits} ${currency}`);
      } else {
        setFlash(`Registro sellado · +${c.reward_xp} xp`);
      }
    }
    setTimeout(() => setFlash(null), 2200);
  }

  return (
    <Shell
      title="Panel de mando"
      subtitle={`Sector operativo · ${pending} pendientes · ${overdue} vencidos`}
    >
      {flash && (
        <div className="stamp-in mb-4 inline-block border border-patina px-3 py-1 font-mono text-[11px] tracking-[0.18em] text-patina uppercase">
          {flash}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          riveted
          title="Estado del cazador"
          meta={`${state.profile.username} · ${state.profile.archetype}`}
          className="xl:col-span-2"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="label-mono">Rango de cazador</p>
              <p className="font-display mt-1 text-3xl tracking-[0.2em] text-amber">
                {RANK_LABELS[rank.current]}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                nivel {state.profile.level} ·{" "}
                {state.profile.xp_total.toLocaleString("es")} xp acumulados
              </p>
              <div className="mt-3">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-muted-foreground">
                    hacia {rank.next ? RANK_LABELS[rank.next] : "cima"}
                  </span>
                  <span className="text-amber">{rank.pct}%</span>
                </div>
                <StatBar value={rank.pct} className="mt-1.5" />
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {(rank.ceil - state.profile.xp_total).toLocaleString("es")} xp
                  restantes
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Metric
                icon={<Coins className="h-3.5 w-3.5" />}
                label={`Balance (${currency})`}
                value={state.credits.toLocaleString("es")}
                tone="text-amber"
              />
              <Metric
                icon={<Flame className="h-3.5 w-3.5" />}
                label="Racha activa"
                value={`${state.streak_days} días`}
                tone="text-patina"
              />
              <div className="col-span-2 border border-border bg-panel-deep/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="label-mono inline-flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" /> Resistencia
                  </span>
                  <span className="font-mono text-xs text-amber">{state.energy}%</span>
                </div>
                <StatBar
                  value={state.energy}
                  tone={state.energy < 30 ? "rust" : "amber"}
                  className="mt-2"
                />
                <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
                  {contractsClosedToday > 0 || workoutsToday > 0
                    ? `Consumo activo (${contractsClosedToday} contratos, ${workoutsToday} sesiones hoy) · Se repone al amanecer.`
                    : "Reservas intactas · Cada contrato o sesión física cerrada hoy consumirá resistencia."}
                </p>
              </div>
            </div>
          </div>
        </Panel>

        <Panel riveted title="Atributos" meta="Lectura del núcleo · 5 ejes">
          <StatRadar stats={state.stats} height={230} />
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px]">
            {state.stats.map((s) => (
              <li key={s.id} className="flex justify-between">
                <span className="text-muted-foreground">{s.attribute_key}</span>
                <span className="text-foreground">{s.value}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Contratos del día"
          meta={`${filteredDaily.length} de ${daily.length} misiones`}
          className="xl:col-span-2"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1">
                {(["todos", "pendientes", "completados", "vencidos"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setContractFilter(f)}
                    className={cn(
                      "border px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] uppercase transition-colors",
                      contractFilter === f
                        ? "border-amber text-amber font-bold"
                        : "border-border text-muted-foreground hover:border-brass hover:text-brass",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowContractModal(true)}
                className="border border-amber/70 bg-amber/10 px-2 py-0.5 font-mono text-[10px] text-amber hover:bg-amber/20 transition-colors"
              >
                + Asignar Misión
              </button>
            </div>
          }
        >
          <ul className="space-y-2">
            {filteredDaily.map((c) => (
              <ContractRow key={c.id} contract={c} onComplete={handleComplete} />
            ))}
            {filteredDaily.length === 0 && (
              <li className="border border-dashed border-border/60 p-4 text-center font-mono text-xs text-muted-foreground">
                {daily.length === 0
                  ? 'Sin contratos activos para este ciclo. Pulsa "+ Asignar Misión" para cargar tu primer objetivo.'
                  : `No hay contratos con el filtro "${contractFilter}".`}
              </li>
            )}
          </ul>
        </Panel>

        <div className="space-y-4">
          <Panel title="Droide de a bordo" meta={state.companion?.name}>
            <div className="flex items-start gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center border border-brass/70 bg-panel-deep">
                <Bot className="h-7 w-7 text-amber" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <Tag
                    tone={
                      state.companion?.expedition_status === "en_expedicion"
                        ? "amber"
                        : state.companion?.expedition_status === "reparacion"
                          ? "rust"
                          : "patina"
                    }
                  >
                    {state.companion?.expedition_status === "en_expedicion"
                      ? "En expedición"
                      : state.companion?.expedition_status === "reparacion"
                        ? "En reparación"
                        : "Disponible"}
                  </Tag>
                  <Tag>nv {state.companion?.level}</Tag>
                </div>
                <p className="mt-2 text-xs italic text-foreground leading-relaxed">
                  &quot;{getDroidMood(state.streak_days, state.companion?.mood)}&quot;
                </p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  última expedición{" "}
                  {new Date(state.companion?.last_expedition_at).toLocaleDateString("es", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <div className="mt-2">
                  <div className="flex justify-between font-mono text-[10px] text-muted-foreground mb-1">
                    <span>Progreso de chatarra</span>
                    <span>{(state.companion?.xp || 0) % 500} / 500 xp</span>
                  </div>
                  <StatBar value={((state.companion?.xp || 0) % 500) / 5} tone="brass" />
                </div>

                {state.companion?.expedition_status === "disponible" && (
                  <button
                    onClick={async () => {
                      setExpeditionLoading(true);
                      await sendDroidOnExpedition();
                      setExpeditionLoading(false);
                    }}
                    disabled={expeditionLoading}
                    className="mt-3 w-full border border-amber/70 bg-amber/15 py-1.5 font-mono text-xs uppercase tracking-wider text-amber hover:bg-amber/25 disabled:opacity-50 transition-colors"
                  >
                    {expeditionLoading ? "Desplegando..." : "🚀 Enviar a expedición"}
                  </button>
                )}

                {state.companion?.expedition_status === "en_expedicion" && (
                  <div className="mt-3 space-y-2">
                    <p className="font-mono text-[10px] text-amber">
                      📡 Explorando sector en busca de núcleos y chatarra...
                    </p>
                    <button
                      onClick={async () => {
                        setExpeditionLoading(true);
                        await claimDroidExpedition();
                        setExpeditionLoading(false);
                      }}
                      disabled={expeditionLoading}
                      className="w-full border border-patina/70 bg-patina/20 py-1.5 font-mono text-xs uppercase tracking-wider text-patina hover:bg-patina/30 disabled:opacity-50 transition-colors animate-pulse"
                    >
                      {expeditionLoading ? "Extrayendo..." : "📦 Reclamar hallazgo"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Panel>

          <Panel title="Rutinas del ciclo" meta="Registro rápido">
            <ul className="space-y-2">
              {routines.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 border border-border/70 bg-panel-deep/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs text-foreground">{r.title}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      racha {r.streak_count} d · +{r.reward_xp} xp
                    </p>
                  </div>
                  <button
                    onClick={() => handleComplete(r.id)}
                    disabled={r.status === "completado"}
                    className={
                      r.status === "completado"
                        ? "shrink-0 border border-patina/60 px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-patina uppercase"
                        : "shrink-0 border border-brass/70 px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-brass uppercase hover:border-amber hover:text-amber"
                    }
                  >
                    {r.status === "completado" ? "sellado" : "sellar"}
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <NewContractModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        defaultSectorId={state.sectors.find((s) => s.key === "mando")?.id}
      />
    </Shell>
  );
}

function Metric({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="border border-border bg-panel-deep/50 p-3">
      <span className="label-mono inline-flex items-center gap-1.5">
        {icon} {label}
      </span>
      <p className={`mt-1.5 font-mono text-xl ${tone}`}>{value}</p>
    </div>
  );
}
