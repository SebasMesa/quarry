import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, Radar, Grid3x3, Coins, Activity, IdCard, Lock, Settings, BookOpen, Orbit, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuarry } from "@/lib/state/quarry";
import { rankProgress, RANK_LABELS } from "@/lib/data/archetypes";
import { StatBar } from "./panel";
import { SettingsDialog } from "./settings-dialog";

const NAV = [
  { to: "/", key: "mando", name: "Panel de mando", icon: Radar, enabled: true },
  { to: "/rutinas", key: "rutinas", name: "Rutinas", icon: Grid3x3, enabled: true },
  { to: "/foco", key: "foco", name: "Foco", icon: Orbit, enabled: true },
  { to: "/riqueza", key: "riqueza", name: "Riqueza", icon: Coins, enabled: true },
  { to: "/cuerpo", key: "cuerpo", name: "Cuerpo", icon: Activity, enabled: true },
  { to: "/bitacora", key: "bitacora", name: "Bitácora", icon: BookOpen, enabled: true },
  { to: "/hoja", key: "hoja", name: "Hoja de cazador", icon: IdCard, enabled: true },
] as const;

export function Shell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
}) {
  // ✅ Ahora todo está dentro del componente
  const { state, dbConnected, signOut } = useQuarry();
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  if (!state || !state.profile) {
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

  const nav = (
    <nav className="flex flex-col gap-1">
      <p className="label-mono px-2 pb-2">Carta estelar</p>
      {NAV.map((item) => {
        const active = pathname === item.to;
        const Icon = item.icon;
        if (!item.enabled) {
          return (
            <div
              key={item.key}
              className="flex items-center gap-2.5 border border-dashed border-border/60 px-2.5 py-2 opacity-55"
              title="Sector no explorado"
            >
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                {item.name}
              </span>
              <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
            </div>
          );
        }
        return (
          <Link
            key={item.key}
            to={item.to}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2.5 border px-2.5 py-2 text-sm transition-colors",
              active
                ? "border-amber/70 bg-amber/12 text-amber"
                : "border-transparent text-foreground/85 hover:border-border hover:bg-accent/50",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{item.name}</span>
            {active && <span className="font-mono text-[10px]">◂</span>}
          </Link>
        );
      })}
      <p className="mt-3 px-2 text-[10px] text-muted-foreground">
        Sectores no explorados quedan visibles en la carta. Sin acceso todavía.
      </p>
    </nav>
  );

  const sidebarInner = (
    <div className="flex h-full flex-col gap-5 p-4">
      <div>
        <p className="font-display text-2xl leading-none tracking-[0.35em] text-amber">
          QUARRY
        </p>
        <p className="label-mono mt-1">Terminal de contratos · v1.0</p>
      </div>
      {nav}
      <div className="mt-auto border-t border-border pt-3">
        <div className="flex items-center justify-between gap-1.5">
          <p className="truncate text-sm text-foreground">{state.profile.username}</p>
          {state.today_checkin && (
            <span
              className="inline-flex items-center gap-1 border border-amber/40 bg-amber/10 px-1.5 py-0.5 font-mono text-[10px] text-amber shrink-0"
              title={`Check-in hoy: ${state.today_checkin.energy_level * 20}% energía${state.today_checkin.mood ? ` · ${state.today_checkin.mood}` : ""}`}
            >
              <Zap className="h-2.5 w-2.5" />
              <span>{state.today_checkin.energy_level * 20}%</span>
              {state.today_checkin.mood && (
                <span className="capitalize text-muted-foreground hidden sm:inline">· {state.today_checkin.mood}</span>
              )}
            </span>
          )}
        </div>
        <p className="label-mono mt-0.5">
          {RANK_LABELS[rank.current]} · nv {state.profile.level}
        </p>
        <StatBar value={rank.pct} className="mt-2" />
        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
          {state.profile.xp_total.toLocaleString("es")} xp ·{" "}
          {state.credits.toLocaleString("es")} {state.profile.currency || "cr"}
        </p>
      </div>
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => setShowSettings(true)}
          className="flex flex-1 items-center justify-center gap-1.5 border border-border/80 bg-panel-deep px-2 py-1.5 font-mono text-[10px] tracking-[0.14em] text-muted-foreground hover:border-amber hover:text-amber transition-colors uppercase"
          title="Personalizar terminal"
        >
          <Settings className="h-3.5 w-3.5" />
          <span>Ajustes</span>
        </button>
        <button
          onClick={() => signOut()}
          className="border border-rust/50 px-2.5 py-1.5 font-mono text-[10px] tracking-[0.14em] text-rust hover:bg-rust/10 transition-colors uppercase"
          title="Cerrar sesión"
        >
          Salir
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="panel-base scanlines hidden w-64 shrink-0 border-y-0 border-l-0 lg:block">
        <div className="relative z-2 h-full">{sidebarInner}</div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-background/80"
            onClick={() => setOpen(false)}
          />
          <aside className="panel-base scanlines relative z-10 w-64 max-w-[80vw]">
            <div className="relative z-2 h-full">{sidebarInner}</div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-panel-deep/70 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="shrink-0 border border-border p-1.5 text-muted-foreground lg:hidden"
              aria-label="Abrir carta estelar"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg text-foreground sm:text-xl">{title}</h1>
              <p className="label-mono truncate">{subtitle}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 font-mono text-xs">
            <span className={cn(
              "inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] tracking-wider uppercase",
              dbConnected
                ? "border-patina/40 text-patina bg-patina/10"
                : "border-border text-muted-foreground"
            )}>
              <span className={cn("h-1.5 w-1.5 rounded-full", dbConnected ? "bg-patina animate-pulse" : "bg-muted-foreground")} />
              {dbConnected ? "BD NUBE" : "LOCAL"}
            </span>
            {state.today_checkin && (
              <span
                className="hidden md:inline-flex items-center gap-1 border border-amber/40 bg-amber/10 px-2 py-0.5 text-[10px] text-amber tracking-wider uppercase"
                title={`Check-in hoy: ${state.today_checkin.energy_level * 20}% energía${state.today_checkin.mood ? ` · ${state.today_checkin.mood}` : ""}`}
              >
                <Zap className="h-3 w-3" />
                <span>{state.today_checkin.energy_level * 20}%</span>
                {state.today_checkin.mood && (
                  <span className="capitalize text-foreground/80">({state.today_checkin.mood})</span>
                )}
              </span>
            )}
            <span className="hidden text-muted-foreground sm:inline">créditos</span>
            <span className="text-amber">{state.credits.toLocaleString("es")}</span>
            <span className="hidden text-muted-foreground sm:inline">racha</span>
            <span className="text-patina">{state.streak_days} d</span>
            <button
              onClick={() => setShowSettings(true)}
              className="border border-border/80 p-1 text-muted-foreground hover:border-amber hover:text-amber transition-colors"
              title="Ajustes de terminal"
              aria-label="Ajustes de terminal"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>

      <SettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}