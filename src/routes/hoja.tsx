import { createFileRoute } from "@tanstack/react-router";
import { Lock, Trophy } from "lucide-react";
import { Shell } from "@/components/quarry/shell";
import { Panel, StatBar, Tag } from "@/components/quarry/panel";
import { StatRadar } from "@/components/quarry/stat-radar";
import { AvatarSigil } from "@/components/quarry/onboarding";
import { useQuarry } from "@/lib/state/quarry";
import { ACHIEVEMENTS_CATALOG } from "@/lib/state/achievements-engine";
import {
  ARCHETYPES,
  ATTRIBUTE_LABELS,
  RANK_LABELS,
  rankProgress,
} from "@/lib/data/archetypes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hoja")({
  head: () => ({
    meta: [
      { title: "Hoja de cazador · QUARRY" },
      {
        name: "description",
        content:
          "Expediente completo del cazador: atributos por nivel, arquetipo, insignias desbloqueadas e historial de racha.",
      },
      { property: "og:title", content: "Hoja de cazador · QUARRY" },
      {
        property: "og:description",
        content: "Atributos, arquetipo e insignias de tu cazador en la terminal QUARRY.",
      },
    ],
  }),
  component: HojaPage,
});

function HojaPage() {
  const { state, isLoading } = useQuarry();

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

  const rank = rankProgress(state.profile.xp_total);
  const arch = ARCHETYPES.find((a) => a.key === state.profile.archetype);

  const unlockedMap = new Map(
    (state.achievements || [])
      .filter((a) => Boolean(a.unlocked_at))
      .map((a) => [a.key, a])
  );

  const catalogWithStatus = ACHIEVEMENTS_CATALOG.map((cat) => {
    const unlockedRecord = unlockedMap.get(cat.key);
    return {
      ...cat,
      isUnlocked: Boolean(unlockedRecord?.unlocked_at),
      unlockedAt: unlockedRecord?.unlocked_at ?? null,
    };
  });

  const unlockedCount = catalogWithStatus.filter((c) => c.isUnlocked).length;
  const lockedCount = catalogWithStatus.length - unlockedCount;
  const completed = state.contracts.filter((c) => c.status === "completado");



  return (
    <Shell
      title="Hoja de cazador"
      subtitle={`Expediente ${state.profile.id} · abierto el ${new Date(state.profile.created_at).toLocaleDateString("es")}`}
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel riveted title="Expediente" meta={state.profile.username}>
          <div className="flex items-start gap-4">
            <div className="border border-border bg-panel-deep p-2">
              <AvatarSigil config={state.profile.avatar_config} size={84} />
            </div>
            <div className="min-w-0">
              <p className="font-display text-2xl tracking-[0.18em] text-amber">
                {RANK_LABELS[rank.current]}
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                nivel {state.profile.level} ·{" "}
                {state.profile.xp_total.toLocaleString("es")} xp
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Tag tone="amber">{state.profile.archetype}</Tag>
                <Tag tone="patina">{state.streak_days} d de racha</Tag>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            {arch?.description}
          </p>
          <div className="mt-4">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-muted-foreground">
                progreso a {rank.next ? RANK_LABELS[rank.next] : "cima"}
              </span>
              <span className="text-amber">{rank.pct}%</span>
            </div>
            <StatBar value={rank.pct} className="mt-1.5" />
          </div>
        </Panel>

        <Panel
          riveted
          title="Lectura de atributos"
          meta="Cinco ejes · progreso individual"
          className="xl:col-span-2"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <StatRadar stats={state.stats} height={300} />
            <ul className="space-y-3">
              {state.stats.map((s) => (
                <li key={s.id} className="border border-border/60 bg-panel-deep/40 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground">
                      {ATTRIBUTE_LABELS[s.attribute_key]}
                    </span>
                    <span className="font-mono text-[11px] text-amber">
                      nv {s.level} · {s.value}
                    </span>
                  </div>
                  <StatBar value={(s.xp_current / s.xp_required) * 100} className="mt-2" />
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {s.xp_current} / {s.xp_required} xp
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel
          title="Insignias"
          meta={`${unlockedCount} de ${ACHIEVEMENTS_CATALOG.length} desbloqueadas · ${lockedCount} en silueta`}
          className="xl:col-span-2"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {catalogWithStatus.map((item) => {
              const isLocked = !item.isUnlocked;
              return (
                <div
                  key={item.key}
                  className={cn(
                    "border p-3 transition-colors",
                    isLocked
                      ? "border-border/50 bg-panel-deep/30 opacity-45"
                      : "border-amber/60 bg-panel-deep/70 shadow-sm",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {isLocked ? (
                        <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <Trophy className="h-3.5 w-3.5 shrink-0 text-amber" />
                      )}
                      <p
                        className={cn(
                          "truncate text-sm font-bold tracking-wide",
                          isLocked ? "text-muted-foreground" : "text-amber",
                        )}
                      >
                        {item.title}
                      </p>
                    </div>
                    {!isLocked && (
                      <span className="shrink-0 border border-amber/50 bg-amber/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-amber">
                        Sellada
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                  <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                    {item.unlockedAt
                      ? `sellada el ${new Date(item.unlockedAt).toLocaleDateString("es")}`
                      : `Bloqueada · ${item.requirement}`}
                  </p>
                </div>
              );
            })}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Historial de racha" meta="Últimos ciclos registrados">
            <ul className="space-y-2 font-mono text-[11px]">
              <li className="flex justify-between border-b border-border/50 pb-1.5">
                <span className="text-muted-foreground">racha actual</span>
                <span className="text-foreground">{state.streak_days} días</span>
              </li>
            </ul>
            <p className="mt-3 text-[11px] text-muted-foreground/70 italic">
              Aún no hay suficiente historial registrado para proyectar mejores rachas o ciclos perfectos.
            </p>
          </Panel>

          <Panel title="Contratos completados" meta={`${completed.length} en el ciclo`}>
            <ul className="space-y-2">
              {completed.map((c) => (
                <li key={c.id} className="border border-patina/30 bg-panel-deep/40 p-2">
                  <p className="truncate text-xs text-foreground">{c.title}</p>
                  <p className="font-mono text-[10px] text-patina">
                    +{c.reward_xp} xp{c.reward_credits > 0 ? ` · +${c.reward_credits} ${state.profile.currency || "cr"}` : ""}
                  </p>
                </li>
              ))}
              {completed.length === 0 && (
                <li className="font-mono text-[11px] text-muted-foreground">
                  Sin cierres en este ciclo.
                </li>
              )}
            </ul>
          </Panel>
        </div>
      </div>
    </Shell>
  );
}
