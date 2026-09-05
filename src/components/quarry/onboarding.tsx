import { useState } from "react";
import { Bot, Coins, Wallet, Scale } from "lucide-react";
import { ARCHETYPES, ATTRIBUTE_LABELS } from "@/lib/data/archetypes";
import { useQuarry } from "@/lib/state/quarry";
import type { Archetype, AvatarConfig } from "@/lib/data/types";
import { Panel, Tag } from "./panel";
import { cn } from "@/lib/utils";

const SILHOUETTES: AvatarConfig["silhouette"][] = [
  "ligera",
  "pesada",
  "esbelta",
  "acorazada",
];
const PALETTES = [
  { name: "cobre quemado", value: "#C17F3E" },
  { name: "latón viejo", value: "#A8843F" },
  { name: "óxido", value: "#A13D2B" },
  { name: "verdín", value: "#5F8F7A" },
  { name: "hueso", value: "#E8E2D5" },
];

const DROID_MOODS = [
  {
    key: "Sarcástico",
    label: "Sarcástico",
    desc: "Comentarios mordaces pero precisión y fidelidad operativa absoluta.",
    sample: "Sarcástico pero operativo",
  },
  {
    key: "Disciplinado",
    label: "Disciplinado",
    desc: "Cálculos fríos, protocolo estricto y ejecución sin quejas.",
    sample: "Disciplinado y metódico",
  },
  {
    key: "Curioso",
    label: "Curioso",
    desc: "Escaneo constante de anomalías y fascinación por el entorno.",
    sample: "Curioso y analítico",
  },
  {
    key: "Leal",
    label: "Leal",
    desc: "Prioriza tu integridad física y la estabilidad de cada contrato.",
    sample: "Leal y protector",
  },
  {
    key: "Pragmático",
    label: "Pragmático",
    desc: "Enfocado en la optimización de recursos; ignora lo superfluo.",
    sample: "Pragmático y calculador",
  },
];

const CURRENCIES = [
  { code: "COP", label: "COP", name: "Peso colombiano" },
  { code: "USD", label: "USD", name: "Dólar estadounidense" },
  { code: "EUR", label: "EUR", name: "Euro" },
  { code: "MXN", label: "MXN", name: "Peso mexicano" },
  { code: "ARS", label: "ARS", name: "Peso argentino" },
  { code: "CLP", label: "CLP", name: "Peso chileno" },
  { code: "cr", label: "cr", name: "Créditos estándar" },
];

export function AvatarSigil({
  config,
  size = 96,
}: {
  config: AvatarConfig;
  size?: number;
}) {
  const w = { ligera: 26, esbelta: 20, pesada: 36, acorazada: 42 }[config?.silhouette];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect x="1" y="1" width="62" height="62" fill="none" stroke="var(--border)" />
      <circle cx="32" cy="20" r="9" fill={config?.suit_palette} opacity="0.9" />
      <rect x="26" y="17" width="12" height="5" fill={config?.visor} />
      <rect
        x={32 - w / 2}
        y="31"
        width={w}
        height="24"
        fill={config?.suit_palette}
        opacity="0.75"
      />
      <rect x={32 - w / 2} y="31" width={w} height="24" fill="none" stroke="var(--brass)" />
    </svg>
  );
}

export function Onboarding() {
  const { createHunter } = useQuarry();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Paso 1: identidad
  const [username, setUsername] = useState("");
  const [archetype, setArchetype] = useState<Archetype>("Mercenario");
  const [config, setConfig] = useState<AvatarConfig>({
    silhouette: "ligera",
    suit_palette: "#C17F3E",
    visor: "#5F8F7A",
  });

  // Paso 2: droide compañero
  const [droidName, setDroidName] = useState("TESSA-9");
  const [droidMood, setDroidMood] = useState("Sarcástico pero operativo");

  // Paso 3: finanzas e inventario inicial
  const [currency, setCurrency] = useState("COP");
  const [initialCredits, setInitialCredits] = useState("0");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [accountName, setAccountName] = useState("Billetera principal");
  const [initialWeight, setInitialWeight] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selected = ARCHETYPES.find((a) => a.key === archetype)!;

  // Paso 2: Droide de a bordo
  if (step === 2) {
    return (
      <div className="min-h-screen bg-background px-4 py-10">
        <div className="mx-auto max-w-xl">
          <div className="mb-6 text-center">
            <p className="font-display text-4xl tracking-[0.45em] text-amber">QUARRY</p>
            <p className="label-mono mt-2">
              Unidad de apoyo · configuración del droide autónomo
            </p>
          </div>

          <Panel
            riveted
            title="Asignación de Droide"
            meta="Tu compañero asiste en expediciones, exploración de sectores y bitácoras."
            className="flicker-in"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-4 border border-border bg-panel-deep p-3">
                <div className="grid h-16 w-16 shrink-0 place-items-center border border-amber/60 bg-background">
                  <Bot className="h-8 w-8 text-amber" />
                </div>
                <div>
                  <p className="font-display text-lg tracking-[0.14em] text-amber">
                    {droidName || "UNIDAD SIN NOMBRE"}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    Estado: <span className="text-patina">disponible</span> · Nivel 1
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-foreground/80">
                    &quot;{droidMood}&quot;
                  </p>
                </div>
              </div>

              <div>
                <label className="label-mono block" htmlFor="droid-name">
                  Identificador / Nombre del droide
                </label>
                <input
                  id="droid-name"
                  value={droidName}
                  onChange={(e) => setDroidName(e.target.value)}
                  placeholder="ej. TESSA-9, KAI-4, ECHO-1"
                  className="mt-2 w-full border border-input bg-panel-deep px-3 py-2 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-amber"
                />
              </div>

              <div>
                <p className="label-mono">Rasgo de personalidad / Tono operativo</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-1">
                  {DROID_MOODS.map((m) => {
                    const isSelected = droidMood === m.sample;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setDroidMood(m.sample)}
                        className={cn(
                          "border p-3 text-left transition-colors",
                          isSelected
                            ? "border-amber bg-amber/10"
                            : "border-border hover:border-brass/70 hover:bg-accent/40",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-display text-sm tracking-[0.12em] text-foreground">
                            {m.label}
                          </p>
                          {isSelected && (
                            <span className="font-mono text-[10px] text-amber">SELECCIONADO</span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{m.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="label-mono block" htmlFor="droid-custom-mood">
                  O ajusta el tono manualmente
                </label>
                <input
                  id="droid-custom-mood"
                  value={droidMood}
                  onChange={(e) => setDroidMood(e.target.value)}
                  placeholder="ej. Callado pero letal"
                  className="mt-2 w-full border border-input bg-panel-deep px-3 py-2 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-amber"
                />
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="border border-border px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground hover:border-brass"
                >
                  Volver
                </button>
                <button
                  type="button"
                  disabled={!droidName.trim()}
                  onClick={() => setStep(3)}
                  className="border border-amber bg-amber/15 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-amber transition-colors hover:bg-amber/25 disabled:cursor-not-allowed disabled:border-border disabled:bg-transparent disabled:text-muted-foreground"
                >
                  Continuar a Finanzas
                </button>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  // Paso 3: Finanzas e Inventario
  if (step === 3) {
    return (
      <div className="min-h-screen bg-background px-4 py-10">
        <div className="mx-auto max-w-xl">
          <div className="mb-6 text-center">
            <p className="font-display text-4xl tracking-[0.45em] text-amber">QUARRY</p>
            <p className="label-mono mt-2">
              Inventario de partida · datos reales de Riqueza y Cuerpo
            </p>
          </div>

          <Panel
            riveted
            title="Parámetros Iniciales"
            meta="Estos valores arrancan tus sectores sin datos ficticios. Se pueden modificar luego."
            className="flicker-in"
          >
            <div className="space-y-6">
              <div>
                <label className="label-mono block">Moneda base de operación</label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Se usará para balances, transacciones y contratos en toda la terminal.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setCurrency(c.code)}
                      className={cn(
                        "border p-2 text-center font-mono text-xs transition-colors",
                        currency === c.code
                          ? "border-amber bg-amber/15 text-amber font-bold"
                          : "border-border text-muted-foreground hover:border-brass hover:text-foreground",
                      )}
                    >
                      <div>{c.code}</div>
                      <div className="text-[10px] opacity-70">{c.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-mono block" htmlFor="credits">
                    Saldo inicial ({currency})
                  </label>
                  <input
                    id="credits"
                    type="number"
                    min={0}
                    value={initialCredits}
                    onChange={(e) => setInitialCredits(e.target.value)}
                    className="mt-2 w-full border border-input bg-panel-deep px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber"
                  />
                </div>

                <div>
                  <label className="label-mono block" htmlFor="account-name">
                    Nombre de la cuenta
                  </label>
                  <input
                    id="account-name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Billetera principal"
                    className="mt-2 w-full border border-input bg-panel-deep px-3 py-2 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-amber"
                  />
                </div>
              </div>

              <div>
                <label className="label-mono block" htmlFor="monthly-income">
                  Ingreso mensual estimado ({currency}) · opcional
                </label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Referencia base para que las métricas de tasa de ahorro y autonomía no nazcan en cero.
                </p>
                <input
                  id="monthly-income"
                  type="number"
                  min={0}
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="ej. 2500000"
                  className="mt-2 w-full border border-input bg-panel-deep px-3 py-2 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-amber"
                />
              </div>

              <div>
                <label className="label-mono block" htmlFor="weight">
                  Peso corporal inicial (kg) · opcional
                </label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Inicia tu registro histórico en el sector Cuerpo.
                </p>
                <input
                  id="weight"
                  type="number"
                  min={0}
                  step="0.1"
                  value={initialWeight}
                  onChange={(e) => setInitialWeight(e.target.value)}
                  placeholder="Déjalo vacío si no deseas registrarlo aún"
                  className="mt-2 w-full border border-input bg-panel-deep px-3 py-2 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-amber"
                />
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="border border-border px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground hover:border-brass"
                >
                  Volver
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setSubmitting(true);
                    createHunter({
                      username: username.trim(),
                      archetype,
                      avatar_config: config,
                      droidName: droidName.trim() || "Droide",
                      droidMood: droidMood.trim() || "Operativo",
                      currency: currency || "COP",
                      initialCredits: Number(initialCredits) || 0,
                      monthlyIncome: monthlyIncome ? Number(monthlyIncome) : undefined,
                      accountName: accountName.trim() || "Billetera principal",
                      initialWeight: initialWeight ? Number(initialWeight) : undefined,
                    });
                  }}
                  className="border border-amber bg-amber/15 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-amber transition-colors hover:bg-amber/25 disabled:cursor-not-allowed disabled:border-border disabled:bg-transparent disabled:text-muted-foreground"
                >
                  {submitting ? "Registrando cazador..." : "Entrar al sector"}
                </button>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <p className="font-display text-4xl tracking-[0.45em] text-amber">QUARRY</p>
          <p className="label-mono mt-2">
            Terminal superviviente · registro de cazadores · sector libre
          </p>
        </div>

        <Panel
          riveted
          title="Alta de cazador"
          meta="Rellena el expediente. La terminal no verifica nada, pero lo recuerda todo."
          className="flicker-in"
        >
          <div className="space-y-6">
            <div>
              <label className="label-mono block" htmlFor="username">
                Nombre de cazador
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Vex Corrall"
                className="mt-2 w-full border border-input bg-panel-deep px-3 py-2 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-amber"
              />
            </div>

            <div>
              <p className="label-mono">Arquetipo</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {ARCHETYPES.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => setArchetype(a.key)}
                    className={cn(
                      "border p-3 text-left transition-colors",
                      archetype === a.key
                        ? "border-amber bg-amber/10"
                        : "border-border hover:border-brass/70 hover:bg-accent/40",
                    )}
                  >
                    <p className="font-display text-base tracking-[0.14em] text-foreground">
                      {a.label}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {a.description}
                    </p>
                    <div className="mt-2 flex gap-1.5">
                      {a.boosts.map((b) => (
                        <Tag key={b} tone="amber">
                          +{ATTRIBUTE_LABELS[b]}
                        </Tag>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
              <div className="border border-border bg-panel-deep p-3">
                <AvatarSigil config={config} />
              </div>
              <div className="space-y-3">
                <div>
                  <p className="label-mono">Silueta</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SILHOUETTES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setConfig((c) => ({ ...c, silhouette: s }))}
                        className={cn(
                          "border px-2.5 py-1 font-mono text-[11px]",
                          config.silhouette === s
                            ? "border-amber text-amber"
                            : "border-border text-muted-foreground hover:border-brass",
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="label-mono">Paleta del traje</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {PALETTES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        aria-label={p.name}
                        onClick={() => setConfig((c) => ({ ...c, suit_palette: p.value }))}
                        className={cn(
                          "h-7 w-7 border",
                          config.suit_palette === p.value
                            ? "border-amber"
                            : "border-border",
                        )}
                        style={{ backgroundColor: p.value }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="label-mono">Visor</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {PALETTES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        aria-label={`visor ${p.name}`}
                        onClick={() => setConfig((c) => ({ ...c, visor: p.value }))}
                        className={cn(
                          "h-7 w-7 border",
                          config.visor === p.value ? "border-amber" : "border-border",
                        )}
                        style={{ backgroundColor: p.value }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <p className="font-mono text-[11px] text-muted-foreground">
                Arquetipo: {selected.label} · silueta {config.silhouette}
              </p>
              <button
                type="button"
                disabled={username.trim().length < 2}
                onClick={() => setStep(2)}
                className="border border-amber bg-amber/15 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-amber transition-colors hover:bg-amber/25 disabled:cursor-not-allowed disabled:border-border disabled:bg-transparent disabled:text-muted-foreground"
              >
                Continuar a Droide
              </button>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}