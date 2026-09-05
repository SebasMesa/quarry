import { useState, useEffect } from "react";
import { useQuarry } from "@/lib/state/quarry";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ContractType } from "@/lib/data/types";
import { ModalBackdrop } from "./wealth-dialogs";

export function NewContractModal({
  isOpen,
  onClose,
  defaultType = "mayor",
  defaultSectorId,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: ContractType;
  defaultSectorId?: string;
}) {
  const { state, addContract } = useQuarry();

  // Helper para resolver UUID real del sector soportando UUID directo o slug ("mando", "sec_rutinas", etc.)
  const resolveSectorId = (rawId?: string) => {
    if (!state?.sectors?.length) return "";
    if (!rawId) return state.sectors[0]?.id || "";
    const cleanKey = rawId.replace(/^sec_/, "");
    const match = state.sectors.find(
      (s) => s.id === rawId || s.key === rawId || s.key === cleanKey
    );
    return match?.id || state.sectors[0]?.id || "";
  };

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ContractType>(defaultType);
  const [sectorId, setSectorId] = useState<string>(() => resolveSectorId(defaultSectorId));
  const [difficulty, setDifficulty] = useState<number>(3);
  const [rewardXp, setRewardXp] = useState<string>("150");
  const [isFinancial, setIsFinancial] = useState(false);
  const [recurrence, setRecurrence] = useState("diaria");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  // Sincronizar estado cuando se abre el modal o cambian los sectores disponibles
  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      const resolved = resolveSectorId(defaultSectorId);
      setSectorId(resolved);
      setTitle("");
      setDescription("");
      setIsFinancial(false);
      setRecurrence("diaria");
      setDueDate(new Date().toISOString().slice(0, 10));
    }
  }, [isOpen, defaultType, defaultSectorId, state?.sectors]);

  // Recalcular XP sugerida al cambiar dificultad o tipo
  useEffect(() => {
    const baseMultiplier = type === "mayor" ? 100 : type === "menor" ? 40 : 30;
    setRewardXp(String(difficulty * baseMultiplier));
  }, [difficulty, type]);

  if (!isOpen || !state) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("El contrato debe tener un título");
      return;
    }

    const finalSectorId = sectorId || resolveSectorId(defaultSectorId);
    if (!finalSectorId) {
      toast.error("No se ha seleccionado un sector válido");
      return;
    }

    setLoading(true);
    try {
      const res = await addContract({
        title: title.trim(),
        description: description.trim(),
        type,
        sector_id: finalSectorId,
        difficulty,
        reward_xp: Number(rewardXp) || 50,
        reward_credits: 0,
        is_financial: isFinancial,
        recurrence: type === "rutina" ? recurrence : null,
        due_date: new Date(`${dueDate}T23:59:59`).toISOString(),
      });

      if (res) {
        toast.success(`Misión "${title}" asignada a la terminal operativa`);
        onClose();
      } else {
        toast.error("Error al registrar contrato en Supabase");
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
      title="Asignar Misión / Contrato"
      subtitle="Terminal de mando · Emite una nueva directiva de acción"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-mono block text-xs">Título del contrato</label>
          <input
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ej. Reparar compuerta presurizada, Auditoría de balances"
            className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber"
          />
        </div>

        <div>
          <label className="label-mono block text-xs">Instrucciones / Descripción operativa</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalles sobre las condiciones de cumplimiento..."
            className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-amber"
          />
        </div>

        {/* Tipo de contrato */}
        <div>
          <label className="label-mono block text-xs">Tipo de misión</label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {(["mayor", "menor", "rutina"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "border p-2 text-center font-mono text-xs uppercase tracking-wider transition-colors",
                  type === t
                    ? "border-amber bg-amber/15 text-amber font-bold"
                    : "border-border text-muted-foreground hover:border-brass"
                )}
              >
                {t === "mayor" ? "Mayor" : t === "menor" ? "Menor" : "Rutina"}
              </button>
            ))}
          </div>
        </div>

        {/* Sector y Dificultad */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label-mono block text-xs">Sector de asignación</label>
            <select
              value={sectorId}
              onChange={(e) => setSectorId(e.target.value)}
              disabled={!state.sectors.length}
              className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-amber disabled:opacity-50"
            >
              {state.sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-mono block text-xs">Dificultad (1 a 5)</label>
            <div className="mt-1.5 flex gap-1">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDifficulty(lvl)}
                  className={cn(
                    "flex-1 border py-1.5 font-mono text-xs transition-colors",
                    difficulty >= lvl
                      ? "border-amber bg-amber/20 text-amber font-bold"
                      : "border-border text-muted-foreground hover:border-brass"
                  )}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recompensa XP y Opción Financiera */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label-mono block text-xs">Recompensa (XP)</label>
            <input
              type="number"
              min="10"
              required
              value={rewardXp}
              onChange={(e) => setRewardXp(e.target.value)}
              className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-sm text-amber outline-none focus:border-amber"
            />
          </div>

          <div>
            <label className="label-mono block text-xs">
              {type === "rutina" ? "Periodicidad" : "Fecha límite"}
            </label>
            {type === "rutina" ? (
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-amber"
              >
                <option value="diaria">Diaria</option>
                <option value="semanal">Semanal</option>
              </select>
            ) : (
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber"
              />
            )}
          </div>
        </div>

        {/* Checkbox Contrato Financiero */}
        <label className="flex items-start gap-3 border border-border/80 bg-background/40 p-3 cursor-pointer hover:border-amber/60 transition-colors">
          <input
            type="checkbox"
            checked={isFinancial}
            onChange={(e) => setIsFinancial(e.target.checked)}
            className="mt-0.5 accent-amber"
          />
          <div>
            <p className="font-mono text-xs font-bold text-foreground">
              Contrato financiero (genera dinero real)
            </p>
            <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
              Al marcarse como completado, la terminal pedirá el importe cobrado y lo sumará a tu cuenta en Riqueza.
            </p>
          </div>
        </label>

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
            disabled={loading || !state.sectors.length || !sectorId}
            className="border border-amber bg-amber/15 px-5 py-2 font-mono text-xs uppercase tracking-wider text-amber hover:bg-amber/25 disabled:opacity-50"
          >
            {loading ? "Registrando..." : "Asignar Misión"}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}
