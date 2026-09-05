import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  PiggyBank,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Shell } from "@/components/quarry/shell";
import { Panel, StatBar, Tag } from "@/components/quarry/panel";
import { ContractRow } from "@/components/quarry/contract-row";
import {
  NewTransactionModal,
  NewAccountModal,
  NewBudgetModal,
  NewSavingsGoalModal,
  ContributeGoalModal,
} from "@/components/quarry/wealth-dialogs";
import { Plus } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useQuarry } from "@/lib/state/quarry";
import { cn } from "@/lib/utils";
import type { AccountType, SavingsGoal, Transaction, TransactionType } from "@/lib/data/types";

export const Route = createFileRoute("/riqueza")({
  head: () => ({
    meta: [
      { title: "Sector de Riqueza · QUARRY" },
      {
        name: "description",
        content:
          "Patrimonio neto, cuentas, sobres de presupuesto, metas de ahorro y contratos financieros del cazador en la terminal QUARRY.",
      },
      { property: "og:title", content: "Sector de Riqueza · QUARRY" },
      {
        property: "og:description",
        content:
          "Créditos, flujos y deudas gestionados como contratos desde una terminal superviviente.",
      },
    ],
  }),
  component: RiquezaPage,
});

const ACCOUNT_ICON: Record<AccountType, typeof Wallet> = {
  billetera: Wallet,
  banco: Landmark,
  inversion: TrendingUp,
};

const ACCOUNT_LABEL: Record<AccountType, string> = {
  billetera: "Billetera",
  banco: "Banco",
  inversion: "Inversión",
};

const chartConfig = {
  net_worth: { label: "Patrimonio neto", color: "var(--amber)" },
} satisfies ChartConfig;

function RiquezaPage() {

  const { state, isLoading, completeContract } = useQuarry();

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

  const [filter, setFilter] = useState<"todos" | TransactionType>("todos");
  const [flash, setFlash] = useState<string | null>(null);

  const [showTxModal, setShowTxModal] = useState(false);
  const [showAccModal, setShowAccModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<SavingsGoal | null>(null);

  const netWorth = state.accounts.reduce((a, x) => a + x.balance, 0);
  const history = state.net_worth_history;
  const prev = history.length > 1 ? history[history.length - 2].net_worth : netWorth;
  const last = history[history.length - 1].net_worth;
  const delta = last - prev;
  const deltaPct = prev ? (delta / prev) * 100 : 0;

  const monthStart = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const currency = state.profile.currency || "cr";
  const cr = (n: number) => `${Math.round(n).toLocaleString("es")} ${currency}`;

  const monthTx = state.transactions.filter((t) => new Date(t.date) >= monthStart);
  const income = monthTx
    .filter((t) => t.type === "ingreso")
    .reduce((a, t) => a + t.amount, 0);
  const expense = monthTx
    .filter((t) => t.type === "gasto")
    .reduce((a, t) => a + t.amount, 0);
  const baseIncome = income > 0 ? income : (state.profile.monthly_income ?? 0);

  const hasCycleData = baseIncome > 0 || expense > 0;
  const isZeroExpenseWithIncome = baseIncome > 0 && expense === 0;
  const isDeficitWithoutIncome = baseIncome === 0 && expense > 0;
  const savingsRate = hasCycleData && baseIncome > 0
    ? Math.max(0, ((baseIncome - expense) / baseIncome) * 100)
    : 0;

  const liquid = state.accounts
    .filter((a) => a.type !== "inversion")
    .reduce((a, x) => a + x.balance, 0);

  // Consumo histórico medio mensual si no hay gastos en este mes
  const allExpenseTx = state.transactions.filter((t) => t.type === "gasto");
  const historicalBurn = useMemo(() => {
    if (allExpenseTx.length === 0) return 0;
    const monthsSet = new Set(allExpenseTx.map((t) => t.date.slice(0, 7)));
    const totalExp = allExpenseTx.reduce((sum, t) => sum + t.amount, 0);
    return totalExp / Math.max(1, monthsSet.size);
  }, [allExpenseTx]);

  const effectiveBurn = expense > 0 ? expense : historicalBurn;
  const hasConsumption = effectiveBurn > 0;
  const runwayMonths = hasConsumption ? liquid / effectiveBurn : 0;

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    monthTx
      .filter((t) => t.type === "gasto")
      .forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
    return [...map.entries()]
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [monthTx]);
  const maxCategory = byCategory[0]?.total || 1;

  const visibleTx = state.transactions
    .filter((t) => (filter === "todos" ? true : t.type === filter))
    .slice()
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  const sectorContracts = state.contracts.filter((c) => c.sector_id === "sec_riqueza");

  function handleComplete(id: string, amount?: number) {
    const c = state?.contracts.find((x) => x.id === id);
    completeContract(id, amount);
    if (c) {
      if (c.is_financial && amount) {
        setFlash(`Contrato financiero sellado · +${c.reward_xp} xp · +${amount.toLocaleString("es")} ${currency}`);
      } else {
        setFlash(`Contrato financiero sellado · +${c.reward_xp} xp`);
      }
    }
    setTimeout(() => setFlash(null), 2200);
  }

  const formatMonthLabel = (m: string) => {
    if (m.includes("-")) {
      const parts = m.split("-");
      const year = parts[0]?.slice(2);
      const monthIdx = Number(parts[1]) - 1;
      const labels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      return `${labels[monthIdx] ?? parts[1]} '${year}`;
    }
    return m;
  };

  const chartData = history.map((h) => ({ month: formatMonthLabel(h.month), net_worth: h.net_worth }));

  return (
    <Shell
      title="Sector de Riqueza"
      subtitle={`Patrimonio neto ${cr(netWorth)} · ${hasConsumption ? `autonomía ${runwayMonths.toFixed(1)} ciclos` : "sin consumo registrado"}`}
    >
      {flash && (
        <div className="stamp-in mb-4 inline-block border border-patina px-3 py-1 font-mono text-[11px] tracking-[0.18em] text-patina uppercase">
          {flash}
        </div>
      )}

      {/* Barra de acciones de comando financiero */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowTxModal(true)}
          className="flex items-center gap-1.5 border border-amber bg-amber/15 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-amber hover:bg-amber/25 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Registrar Movimiento
        </button>
        <button
          onClick={() => setShowAccModal(true)}
          className="flex items-center gap-1.5 border border-border bg-panel-deep/60 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:border-brass hover:text-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Nueva Cuenta
        </button>
        <button
          onClick={() => setShowBudgetModal(true)}
          className="flex items-center gap-1.5 border border-border bg-panel-deep/60 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:border-brass hover:text-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Nuevo Sobre
        </button>
        <button
          onClick={() => setShowGoalModal(true)}
          className="flex items-center gap-1.5 border border-border bg-panel-deep/60 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:border-brass hover:text-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Nueva Meta
        </button>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-3">
        <Panel
          riveted
          title="Balance general"
          meta="Suma consolidada de todas las cuentas registradas"
          className="flicker-in xl:col-span-2"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="label-mono">Patrimonio neto</p>
              <p className="font-display mt-1 text-4xl tracking-[0.12em] text-amber">
                {netWorth.toLocaleString("es")}
                <span className="ml-2 font-mono text-sm tracking-normal text-muted-foreground">
                  {currency}
                </span>
              </p>
              <p
                className={cn(
                  "mt-1.5 inline-flex items-center gap-1 font-mono text-xs",
                  delta >= 0 ? "text-patina" : "text-rust",
                )}
              >
                {delta >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {delta >= 0 ? "+" : ""}
                {Math.round(delta).toLocaleString("es")} {currency} ({deltaPct.toFixed(1)}%) en el
                último cierre
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric label="Ingresos del ciclo" value={cr(income)} tone="text-patina" />
                <Metric label="Gastos del ciclo" value={cr(expense)} tone="text-rust" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="border border-border bg-panel-deep/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="label-mono">Tasa de ahorro</span>
                  <span className="font-mono text-xs text-amber">
                    {!hasCycleData
                      ? "—"
                      : isZeroExpenseWithIncome
                        ? "100%"
                        : isDeficitWithoutIncome
                          ? "Déficit"
                          : `${savingsRate.toFixed(0)}%`}
                  </span>
                </div>
                <StatBar
                  value={!hasCycleData ? 0 : isZeroExpenseWithIncome ? 100 : isDeficitWithoutIncome ? 0 : Math.max(0, savingsRate)}
                  tone={isDeficitWithoutIncome || (hasCycleData && savingsRate < 10) ? "rust" : "patina"}
                  className="mt-2"
                />
                <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
                  {!hasCycleData
                    ? "Sin datos de ingresos ni gastos en el ciclo actual."
                    : isZeroExpenseWithIncome
                      ? "Sin gastos asentados en este ciclo · 100% de retención."
                      : isDeficitWithoutIncome
                        ? `Consumo de ${cr(expense)} sin ingresos registrados en el ciclo.`
                        : "Créditos retenidos frente a créditos entrados este ciclo."}
                </p>
              </div>
              <div className="border border-border bg-panel-deep/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="label-mono">Autonomía sin contratos</span>
                  <span className="font-mono text-xs text-amber">
                    {hasConsumption ? `${runwayMonths.toFixed(1)} ciclos` : "—"}
                  </span>
                </div>
                <StatBar
                  value={hasConsumption ? Math.min(100, (runwayMonths / 12) * 100) : 0}
                  tone={!hasConsumption ? "brass" : runwayMonths < 3 ? "rust" : "brass"}
                  className="mt-2"
                />
                <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
                  {hasConsumption
                    ? expense > 0
                      ? `Liquidez ${cr(liquid)} sobre un consumo de ${cr(expense)} este ciclo.`
                      : `Liquidez ${cr(liquid)} sobre un consumo medio histórico de ${cr(historicalBurn)} por ciclo.`
                    : `Liquidez ${cr(liquid)} · Sin consumo registrado para proyectar autonomía.`}
                </p>
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          title="Cuentas"
          meta={`${state.accounts.length} registros activos`}
          actions={
            <button
              onClick={() => setShowAccModal(true)}
              className="border border-border/80 px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:border-amber hover:text-amber transition-colors"
            >
              + Cuenta
            </button>
          }
        >
          <ul className="space-y-2">
            {state.accounts.map((acc) => {
              const Icon = ACCOUNT_ICON[acc.type];
              const share = netWorth ? (acc.balance / netWorth) * 100 : 0;
              return (
                <li
                  key={acc.id}
                  className="border border-border/70 bg-panel-deep/40 px-3 py-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brass" />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-foreground">{acc.name}</p>
                        <p className="label-mono mt-0.5">{ACCOUNT_LABEL[acc.type]}</p>
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-sm text-amber">
                      {acc.balance.toLocaleString("es")}
                    </span>
                  </div>
                  <StatBar value={share} tone="brass" className="mt-2 h-1.5" />
                </li>
              );
            })}
            {state.accounts.length === 0 && (
              <li className="p-3 text-center font-mono text-xs text-muted-foreground border border-dashed border-border/60">
                Sin cuentas registradas. Añade tu primera cuenta para asentar balances.
              </li>
            )}
          </ul>
        </Panel>

        <Panel
          title="Evolución del patrimonio"
          meta="Cierres mensuales de los últimos 12 ciclos"
          className="xl:col-span-2"
        >
          {chartData.length >= 2 ? (
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <AreaChart data={chartData} margin={{ left: 4, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="nwFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--amber)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--amber)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="2 4"
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                />
                <YAxis
                  width={48}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="net_worth"
                  stroke="var(--amber)"
                  strokeWidth={1.5}
                  fill="url(#nwFill)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[240px] w-full items-center justify-center border border-dashed border-border/60 p-4 text-center font-mono text-xs text-muted-foreground">
              Sin histórico suficiente de cierres mensuales para proyectar la evolución del patrimonio.
            </div>
          )}
        </Panel>

        <Panel title="Gasto por categoría" meta="Ciclo en curso">
          <ul className="space-y-2.5">
            {byCategory.map((c) => (
              <li key={c.category}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-xs text-foreground">{c.category}</span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {cr(c.total)}
                  </span>
                </div>
                <StatBar
                  value={(c.total / maxCategory) * 100}
                  tone="rust"
                  className="mt-1.5 h-1.5"
                />
              </li>
            ))}
            {byCategory.length === 0 && (
              <li className="font-mono text-[11px] text-muted-foreground">
                Sin gastos registrados en el ciclo.
              </li>
            )}
          </ul>
        </Panel>

        <Panel
          title="Sobres de presupuesto"
          meta="Créditos asignados por categoría antes de gastarlos"
          actions={
            <button
              onClick={() => setShowBudgetModal(true)}
              className="border border-border/80 px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:border-amber hover:text-amber transition-colors"
            >
              + Sobre
            </button>
          }
        >
          <ul className="space-y-3">
            {state.budgets.map((b) => {
              const pct = (b.spent / b.assigned) * 100;
              const over = b.spent > b.assigned;
              return (
                <li key={b.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-xs text-foreground">{b.category}</span>
                    <span
                      className={cn(
                        "shrink-0 font-mono text-[11px]",
                        over ? "text-rust" : "text-muted-foreground",
                      )}
                    >
                      {b.spent.toLocaleString("es")} / {b.assigned.toLocaleString("es")}
                    </span>
                  </div>
                  <StatBar
                    value={Math.min(100, pct)}
                    tone={over ? "rust" : pct > 85 ? "amber" : "patina"}
                    className="mt-1.5"
                  />
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {over
                      ? `desbordado en ${cr(b.spent - b.assigned)}`
                      : `quedan ${cr(b.assigned - b.spent)}`}
                  </p>
                </li>
              );
            })}
            {state.budgets.length === 0 && (
              <li className="p-3 text-center font-mono text-xs text-muted-foreground border border-dashed border-border/60">
                Sin sobres asignados. Define techos de gasto por categoría.
              </li>
            )}
          </ul>
        </Panel>

        <Panel
          riveted
          title="Metas de ahorro"
          meta="Contratos de largo alcance con progreso verificado"
          actions={
            <button
              onClick={() => setShowGoalModal(true)}
              className="border border-border/80 px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:border-amber hover:text-amber transition-colors"
            >
              + Meta
            </button>
          }
        >
          <ul className="space-y-4">
            {state.savings_goals.map((g) => {
              const pct = (g.saved / g.target) * 100;
              const missing = Math.max(0, g.target - g.saved);
              const cycles = Math.ceil(missing / Math.max(1, g.monthly_contribution));
              return (
                <li key={g.id} className="border border-border/70 bg-panel-deep/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Tag tone="amber">Contrato de ahorro</Tag>
                      <Tag>{pct.toFixed(0)}%</Tag>
                    </div>
                    <button
                      onClick={() => setContributeGoal(g)}
                      className="border border-amber/70 bg-amber/10 px-2 py-0.5 font-mono text-[10px] text-amber hover:bg-amber/20 transition-colors"
                    >
                      + Aportar capital
                    </button>
                  </div>
                  <p className="mt-2 text-sm leading-snug text-foreground">{g.title}</p>
                  <StatBar value={pct} className="mt-2" />
                  <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
                    {g.saved.toLocaleString("es")} de {g.target.toLocaleString("es")} {currency} ·
                    faltan {cycles} ciclos a {cr(g.monthly_contribution)} por ciclo
                  </p>
                </li>
              );
            })}
            {state.savings_goals.length === 0 && (
              <li className="p-3 text-center font-mono text-xs text-muted-foreground border border-dashed border-border/60">
                Sin metas declaradas. Fija tu primer contrato de acumulación.
              </li>
            )}
          </ul>
        </Panel>

        <Panel
          title="Movimientos recientes"
          meta="Registro del libro de a bordo"
          className="xl:col-span-2"
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTxModal(true)}
                className="border border-amber/70 bg-amber/10 px-2 py-0.5 font-mono text-[10px] text-amber hover:bg-amber/20 transition-colors"
              >
                + Registrar
              </button>
              <div className="flex gap-1">
                {(["todos", "ingreso", "gasto"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "border px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] uppercase transition-colors",
                      filter === f
                        ? "border-amber text-amber font-bold"
                        : "border-border text-muted-foreground hover:border-brass hover:text-brass",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          }
        >
          <ul className="space-y-1.5">
            {visibleTx.map((t) => (
              <TransactionRow
                key={t.id}
                tx={t}
                account={state.accounts.find((a) => a.id === t.account_id)?.name ?? "—"}
              />
            ))}
            {visibleTx.length === 0 && (
              <li className="p-4 text-center font-mono text-xs text-muted-foreground border border-dashed border-border/60">
                Sin movimientos registrados. Pulsa &quot;Registrar Movimiento&quot; para asentar el primero.
              </li>
            )}
          </ul>
        </Panel>

        <Panel title="Contratos del sector" meta="Riqueza · asignados al cazador">
          <ul className="space-y-2">
            {sectorContracts.map((c) => (
              <ContractRow key={c.id} contract={c} onComplete={handleComplete} />
            ))}
          </ul>
        </Panel>
      </div>

      <NewTransactionModal
        isOpen={showTxModal}
        onClose={() => setShowTxModal(false)}
      />
      <NewAccountModal
        isOpen={showAccModal}
        onClose={() => setShowAccModal(false)}
      />
      <NewBudgetModal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
      />
      <NewSavingsGoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
      />
      <ContributeGoalModal
        isOpen={!!contributeGoal}
        goal={contributeGoal}
        onClose={() => setContributeGoal(null)}
      />
    </Shell>
  );
}

function TransactionRow({ tx, account }: { tx: Transaction; account: string }) {
  const income = tx.type === "ingreso";
  return (
    <li className="flex items-start gap-3 border border-border/70 bg-panel-deep/40 px-3 py-2">
      <div
        className={cn(
          "mt-0.5 grid h-6 w-6 shrink-0 place-items-center border",
          income ? "border-patina/70 text-patina" : "border-rust/70 text-rust",
        )}
      >
        {income ? (
          <ArrowUpRight className="h-3.5 w-3.5" />
        ) : (
          <ArrowDownRight className="h-3.5 w-3.5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">{tx.description}</p>
        <p className="label-mono mt-0.5 truncate">
          {tx.category} · {account} ·{" "}
          {new Date(tx.date).toLocaleDateString("es", { day: "2-digit", month: "short" })}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 font-mono text-sm",
          income ? "text-patina" : "text-foreground",
        )}
      >
        {income ? "+" : "−"}
        {tx.amount.toLocaleString("es")}
      </span>
    </li>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="border border-border bg-panel-deep/50 p-3">
      <span className="label-mono inline-flex items-center gap-1.5">
        <PiggyBank className="h-3.5 w-3.5" /> {label}
      </span>
      <p className={`mt-1.5 font-mono text-lg ${tone}`}>{value}</p>
    </div>
  );
}
