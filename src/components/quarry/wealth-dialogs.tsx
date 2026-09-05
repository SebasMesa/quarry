import { useState } from "react";
import { Plus, X, ArrowDownRight, ArrowUpRight, Wallet, Landmark, TrendingUp } from "lucide-react";
import { useQuarry } from "@/lib/state/quarry";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AccountType, TransactionType, SavingsGoal } from "@/lib/data/types";

export function ModalBackdrop({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-lg border border-amber/60 bg-panel-deep p-5 shadow-2xl">
        <div className="flex items-start justify-between border-b border-border pb-3">
          <div>
            <p className="font-display text-lg tracking-[0.18em] text-amber uppercase">{title}</p>
            {subtitle && <p className="label-mono mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-amber transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function NewTransactionModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { state, addTransaction } = useQuarry();
  const [type, setType] = useState<TransactionType>("gasto");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Suministros");
  const [accountId, setAccountId] = useState(state?.accounts[0]?.id || "");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  if (!isOpen || !state) return null;

  const currency = state.profile?.currency || "cr";

  const COMMON_CATEGORIES =
    type === "gasto"
      ? ["Suministros", "Hangar", "Combustible", "Mantenimiento", "Alimentación", "Droide", "Salud", "Otro"]
      : ["Contratos", "Liquidación", "Venta", "Servicios", "Inversión", "Ahorro", "Otro"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }
    if (!accountId) {
      toast.error("Selecciona una cuenta de origen o destino");
      return;
    }

    setLoading(true);
    try {
      const res = await addTransaction({
        account_id: accountId,
        amount: val,
        type,
        category: category.trim() || "Varios",
        description: description.trim() || (type === "ingreso" ? "Ingreso asentado" : "Gasto asentado"),
        date: new Date(date).toISOString(),
      });

      if (res) {
        toast.success(
          type === "ingreso"
            ? `Ingreso de ${val.toLocaleString("es")} ${currency} asentado`
            : `Gasto de ${val.toLocaleString("es")} ${currency} asentado`
        );
        onClose();
      } else {
        toast.error("Error al persistir la transacción en el libro de a bordo");
      }
    } catch (err) {
      console.error(err);
      toast.error("Fallo de comunicación con Supabase");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalBackdrop
      title="Registrar Movimiento"
      subtitle="Libro de a bordo · Asienta un ingreso o gasto real"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Toggle tipo */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType("gasto")}
            className={cn(
              "flex items-center justify-center gap-2 border p-2.5 font-mono text-xs uppercase tracking-wider transition-colors",
              type === "gasto"
                ? "border-rust bg-rust/20 text-rust font-bold"
                : "border-border text-muted-foreground hover:border-rust/60"
            )}
          >
            <ArrowDownRight className="h-4 w-4" /> Gasto
          </button>
          <button
            type="button"
            onClick={() => setType("ingreso")}
            className={cn(
              "flex items-center justify-center gap-2 border p-2.5 font-mono text-xs uppercase tracking-wider transition-colors",
              type === "ingreso"
                ? "border-patina bg-patina/20 text-patina font-bold"
                : "border-border text-muted-foreground hover:border-patina/60"
            )}
          >
            <ArrowUpRight className="h-4 w-4" /> Ingreso
          </button>
        </div>

        {/* Monto y Cuenta */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label-mono block text-xs">Monto ({currency})</label>
            <input
              type="number"
              min="0.01"
              step="any"
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber"
            />
          </div>

          <div>
            <label className="label-mono block text-xs">Cuenta</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber"
            >
              {state.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.balance.toLocaleString("es")} {currency})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Categoría */}
        <div>
          <label className="label-mono block text-xs">Categoría</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Escribe o elige abajo"
            className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {COMMON_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  "border px-2 py-0.5 font-mono text-[10px] transition-colors",
                  category === cat
                    ? "border-amber bg-amber/15 text-amber"
                    : "border-border text-muted-foreground hover:border-brass"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Descripción y Fecha */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label-mono block text-xs">Detalle / Concepto</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ej. Raciones, combustible, pago"
              className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber"
            />
          </div>

          <div>
            <label className="label-mono block text-xs">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="border border-border px-4 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:border-brass"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="border border-amber bg-amber/15 px-5 py-2 font-mono text-xs uppercase tracking-wider text-amber hover:bg-amber/25 disabled:opacity-50"
          >
            {loading ? "Sellando..." : "Sellar Movimiento"}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}

export function NewAccountModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { state, addAccount } = useQuarry();
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("banco");
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !state) return null;
  const currency = state.profile?.currency || "cr";

  const ACCOUNT_TYPES: { type: AccountType; label: string; icon: typeof Wallet }[] = [
    { type: "billetera", label: "Billetera / Efectivo", icon: Wallet },
    { type: "banco", label: "Depósito / Banco", icon: Landmark },
    { type: "inversion", label: "Fondo / Inversión", icon: TrendingUp },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Asigna un nombre a la cuenta");
      return;
    }

    setLoading(true);
    try {
      const res = await addAccount({
        name: name.trim(),
        type,
        balance: Number(balance) || 0,
        currency,
      });

      if (res) {
        toast.success(`Cuenta "${name}" registrada en el sector`);
        onClose();
      } else {
        toast.error("No se pudo crear la cuenta en Supabase");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalBackdrop
      title="Nueva Cuenta"
      subtitle="Alta de depósito o reserva para el patrimonio neto"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-mono block text-xs">Nombre de la cuenta</label>
          <input
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ej. Depósito Portuario, Reserva Fría"
            className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber"
          />
        </div>

        <div>
          <label className="label-mono block text-xs">Naturaleza de la cuenta</label>
          <div className="mt-1.5 grid gap-2">
            {ACCOUNT_TYPES.map((t) => {
              const Icon = t.icon;
              const active = type === t.type;
              return (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => setType(t.type)}
                  className={cn(
                    "flex items-center gap-3 border p-2.5 text-left transition-colors",
                    active
                      ? "border-amber bg-amber/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-brass"
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-amber" : "text-muted-foreground")} />
                  <span className="font-mono text-xs">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="label-mono block text-xs">Saldo inicial ({currency})</label>
          <input
            type="number"
            min="0"
            step="any"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0"
            className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="border border-border px-4 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:border-brass"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="border border-amber bg-amber/15 px-5 py-2 font-mono text-xs uppercase tracking-wider text-amber hover:bg-amber/25 disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear Cuenta"}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}

export function NewBudgetModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { state, addBudget } = useQuarry();
  const [category, setCategory] = useState("");
  const [assigned, setAssigned] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !state) return null;
  const currency = state.profile?.currency || "cr";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = Number(assigned);
    if (!category.trim()) {
      toast.error("Indica la categoría del sobre");
      return;
    }
    if (!val || val <= 0) {
      toast.error("El monto asignado debe ser mayor a 0");
      return;
    }

    setLoading(true);
    try {
      const res = await addBudget({
        category: category.trim(),
        assigned: val,
      });

      if (res) {
        toast.success(`Sobre "${category}" asignado con ${val.toLocaleString("es")} ${currency}`);
        onClose();
      } else {
        toast.error("Error al crear el sobre de presupuesto");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar sobre");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalBackdrop
      title="Nuevo Sobre de Presupuesto"
      subtitle="Asignación previa de recursos por categoría (patrón envelope)"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-mono block text-xs">Categoría</label>
          <input
            required
            autoFocus
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="ej. Suministros, Combustible, Hangar, Ocio"
            className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber"
          />
        </div>

        <div>
          <label className="label-mono block text-xs">Créditos asignados para el ciclo ({currency})</label>
          <input
            type="number"
            min="1"
            required
            value={assigned}
            onChange={(e) => setAssigned(e.target.value)}
            placeholder="0"
            className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="border border-border px-4 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:border-brass"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="border border-amber bg-amber/15 px-5 py-2 font-mono text-xs uppercase tracking-wider text-amber hover:bg-amber/25 disabled:opacity-50"
          >
            {loading ? "Asignando..." : "Asignar Sobre"}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}

export function NewSavingsGoalModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { state, addSavingsGoal } = useQuarry();
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !state) return null;
  const currency = state.profile?.currency || "cr";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const targetVal = Number(target);
    const contributionVal = Number(monthlyContribution);
    if (!title.trim()) {
      toast.error("Indica el título de la meta");
      return;
    }
    if (!targetVal || targetVal <= 0) {
      toast.error("El objetivo debe ser mayor a 0");
      return;
    }

    setLoading(true);
    try {
      const res = await addSavingsGoal({
        title: title.trim(),
        target: targetVal,
        monthly_contribution: contributionVal || Math.round(targetVal / 12),
        deadline: deadline ? new Date(deadline).toISOString() : new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      });

      if (res) {
        toast.success(`Meta "${title}" fijada como contrato de largo alcance`);
        onClose();
      } else {
        toast.error("Error al persistir la meta de ahorro");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar meta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalBackdrop
      title="Nueva Meta de Ahorro"
      subtitle="Contrato de largo alcance para acumulación de capital"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-mono block text-xs">Objetivo / Título</label>
          <input
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ej. Reserva de 6 ciclos, Adquisición de nave"
            className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label-mono block text-xs">Monto objetivo ({currency})</label>
            <input
              type="number"
              min="1"
              required
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="ej. 15000000"
              className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber"
            />
          </div>

          <div>
            <label className="label-mono block text-xs">Aporte mensual proyectado</label>
            <input
              type="number"
              min="0"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(e.target.value)}
              placeholder="ej. 600000"
              className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber"
            />
          </div>
        </div>

        <div>
          <label className="label-mono block text-xs">Fecha límite estimada</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="border border-border px-4 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:border-brass"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="border border-amber bg-amber/15 px-5 py-2 font-mono text-xs uppercase tracking-wider text-amber hover:bg-amber/25 disabled:opacity-50"
          >
            {loading ? "Fijando..." : "Fijar Meta"}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}

export function ContributeGoalModal({
  isOpen,
  goal,
  onClose,
}: {
  isOpen: boolean;
  goal: SavingsGoal | null;
  onClose: () => void;
}) {
  const { state, contributeToGoal } = useQuarry();
  const [amount, setAmount] = useState("");
  const [deductFromAccount, setDeductFromAccount] = useState(false);
  const [accountId, setAccountId] = useState(state?.accounts[0]?.id || "");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !goal || !state) return null;

  const currency = state.profile?.currency || "cr";
  const PRESETS = [10000, 50000, 100000];

  const handleQuickAdd = (preset: number) => {
    const current = Number(amount) || 0;
    setAmount(String(current + preset));
  };

  const selectedAccount = state.accounts.find((a) => a.id === accountId);
  const numAmount = Number(amount) || 0;
  const newProjectedSaved = Math.min(goal.target, goal.saved + numAmount);
  const projectedPct = Math.min(100, (newProjectedSaved / goal.target) * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      toast.error("Ingresa un monto válido para aportar");
      return;
    }

    if (deductFromAccount && selectedAccount && Number(selectedAccount.balance) < numAmount) {
      toast.error("Saldo insuficiente en la cuenta seleccionada");
      return;
    }

    setLoading(true);
    try {
      const ok = await contributeToGoal(
        goal.id,
        numAmount,
        deductFromAccount ? accountId : undefined,
      );
      if (ok) {
        setAmount("");
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBackdrop
      title="Aportar a Meta de Ahorro"
      subtitle={`Inyección de capital para contrato: ${goal.title}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Resumen de la meta */}
        <div className="border border-border/70 bg-panel/40 p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-foreground font-semibold uppercase tracking-wider">{goal.title}</span>
            <span className="font-mono text-xs text-amber">{((goal.saved / goal.target) * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
            <span>Acumulado: {goal.saved.toLocaleString("es")} {currency}</span>
            <span>Objetivo: {goal.target.toLocaleString("es")} {currency}</span>
          </div>
          {numAmount > 0 && (
            <div className="mt-2 border-t border-border/40 pt-1.5 flex justify-between font-mono text-[11px] text-patina">
              <span>Proyectado tras aporte:</span>
              <span>{newProjectedSaved.toLocaleString("es")} {currency} ({projectedPct.toFixed(0)}%)</span>
            </div>
          )}
        </div>

        {/* Input de monto */}
        <div>
          <label className="label-mono block text-xs">Monto a aportar ({currency})</label>
          <input
            type="number"
            min="1"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="ej. 50000"
            required
            className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber"
          />
        </div>

        {/* Botones de atajo rápido */}
        <div>
          <span className="label-mono block text-[10px] text-muted-foreground/80 mb-1.5 uppercase">Atajos rápidos</span>
          <div className="flex gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleQuickAdd(p)}
                className="flex-1 border border-border/80 bg-panel px-2 py-1.5 font-mono text-xs text-muted-foreground hover:border-amber hover:text-amber transition-colors"
              >
                +{(p / 1000).toLocaleString("es")}k {currency}
              </button>
            ))}
          </div>
        </div>

        {/* Descontar de cuenta real */}
        <div className="border border-border/60 bg-panel/30 p-3 space-y-2">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={deductFromAccount}
              onChange={(e) => {
                setDeductFromAccount(e.target.checked);
                if (e.target.checked && !accountId && state.accounts[0]) {
                  setAccountId(state.accounts[0].id);
                }
              }}
              className="h-4 w-4 rounded-none border-border bg-panel-deep accent-amber focus:ring-0 focus:ring-offset-0"
            />
            <span className="font-mono text-xs text-foreground">
              ¿Descontar de una cuenta real?
            </span>
          </label>

          {deductFromAccount && (
            <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-150">
              <label className="label-mono block text-xs mb-1">Cuenta de débito</label>
              {state.accounts.length > 0 ? (
                <>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full border border-input bg-panel-deep px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber"
                  >
                    {state.accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type}) — Saldo: {acc.balance.toLocaleString("es")} {currency}
                      </option>
                    ))}
                  </select>
                  {selectedAccount && Number(selectedAccount.balance) < numAmount && (
                    <p className="mt-1.5 font-mono text-[10px] text-rust">
                      Aviso: El saldo en {selectedAccount.name} ({selectedAccount.balance.toLocaleString("es")} {currency}) es menor que el aporte ({numAmount.toLocaleString("es")} {currency}).
                    </p>
                  )}
                </>
              ) : (
                <p className="font-mono text-xs text-rust">
                  No tienes cuentas registradas para debitar el capital.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="border border-border px-4 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:border-brass"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || (deductFromAccount && (!selectedAccount || Number(selectedAccount.balance) < numAmount))}
            className="border border-amber bg-amber/15 px-5 py-2 font-mono text-xs uppercase tracking-wider text-amber hover:bg-amber/25 disabled:opacity-50"
          >
            {loading ? "Registrando..." : "Sellar Aporte"}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}
