import { useState } from "react";
import { X, Dumbbell, Activity, Trophy, Timer } from "lucide-react";
import { useQuarry } from "@/lib/state/quarry";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PersonalRecord } from "@/lib/data/types";
import { ModalBackdrop } from "./wealth-dialogs";

export function NewWorkoutModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { addWorkout } = useQuarry();
  const [type, setType] = useState("Fuerza · Empuje");
  const [duration, setDuration] = useState("45");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const WORKOUT_TYPES = [
    "Fuerza · Empuje",
    "Fuerza · Tracción",
    "Fuerza · Pierna",
    "Carrera continua",
    "HIIT / Intervalos",
    "Movilidad y flexibilidad",
    "Ciclismo / Rower",
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const mins = Number(duration);
    if (!mins || mins <= 0) {
      toast.error("Indica una duración válida en minutos");
      return;
    }

    setLoading(true);
    try {
      const res = await addWorkout({
        type: type.trim(),
        duration_minutes: mins,
        notes: notes.trim() || "Sesión completada",
        date: new Date(date).toISOString(),
      });

      if (res) {
        toast.success(`Entrenamiento "${type}" (${mins} min) registrado en la bitácora`);
        onClose();
      } else {
        toast.error("Error al persistir la sesión");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar entrenamiento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalBackdrop
      title="Anotar Entrenamiento"
      subtitle="Bitácora física · Registro del volumen de esfuerzo"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-mono block text-xs">Tipo de sesión</label>
          <input
            required
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {WORKOUT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "border px-2 py-0.5 font-mono text-[10px] transition-colors",
                  type === t
                    ? "border-patina bg-patina/15 text-patina font-bold"
                    : "border-border text-muted-foreground hover:border-brass"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label-mono block text-xs">Duración (minutos)</label>
            <input
              type="number"
              min="1"
              required
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
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

        <div>
          <label className="label-mono block text-xs">Notas operativas</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ej. RPE 8, series efectivas en banca plana y fondos."
            className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-amber"
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
            className="border border-patina bg-patina/15 px-5 py-2 font-mono text-xs uppercase tracking-wider text-patina hover:bg-patina/25 disabled:opacity-50"
          >
            {loading ? "Asentando..." : "Asentar Sesión"}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}

export function NewPersonalRecordModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { addPersonalRecord } = useQuarry();
  const [lift, setLift] = useState("");
  const [current, setCurrent] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("kg");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const COMMON_LIFTS = ["Sentadilla", "Peso muerto", "Press banca", "Press militar", "Dominadas lastradas"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const currVal = Number(current);
    const targetVal = Number(target);
    if (!lift.trim()) {
      toast.error("Indica el nombre del ejercicio o levantamiento");
      return;
    }
    if (currVal < 0 || targetVal <= 0) {
      toast.error("Las marcas deben ser valores positivos");
      return;
    }

    setLoading(true);
    try {
      const res = await addPersonalRecord({
        lift: lift.trim(),
        current: currVal,
        target: targetVal,
        unit: unit.trim() || "kg",
        achieved_at: new Date().toISOString(),
      });

      if (res) {
        toast.success(`Récord personal de "${lift}" fijado`);
        onClose();
      } else {
        toast.error("Error al registrar récord personal");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al persistir récord");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalBackdrop
      title="Nuevo Récord Personal"
      subtitle="Marca declarada y objetivo de fuerza en el sector Cuerpo"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-mono block text-xs">Ejercicio / Marca</label>
          <input
            required
            autoFocus
            value={lift}
            onChange={(e) => setLift(e.target.value)}
            placeholder="ej. Sentadilla trasera, Press banca"
            className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {COMMON_LIFTS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLift(l)}
                className="border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:border-brass hover:text-foreground"
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label-mono block text-xs">Marca actual</label>
            <input
              type="number"
              step="any"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="0"
              className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber"
            />
          </div>

          <div>
            <label className="label-mono block text-xs">Objetivo</label>
            <input
              type="number"
              step="any"
              required
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="100"
              className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber"
            />
          </div>

          <div>
            <label className="label-mono block text-xs">Unidad</label>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="kg"
              className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber"
            />
          </div>
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
            {loading ? "Declarando..." : "Declarar Récord"}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}

export function UpdatePersonalRecordModal({
  record,
  onClose,
}: {
  record: PersonalRecord | null;
  onClose: () => void;
}) {
  const { updatePersonalRecordValue } = useQuarry();
  const [current, setCurrent] = useState(record ? String(record.current) : "");
  const [loading, setLoading] = useState(false);

  if (!record) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!record) return;
    const val = Number(current);
    if (isNaN(val) || val < 0) {
      toast.error("Ingresa una marca válida");
      return;
    }

    setLoading(true);
    try {
      await updatePersonalRecordValue(record.id, val);
      toast.success(`Marca de "${record.lift}" actualizada a ${val} ${record.unit}`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar marca");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalBackdrop
      title="Actualizar Marca"
      subtitle={`${record.lift} · Objetivo: ${record.target} ${record.unit}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-mono block text-xs">Nueva marca alcanzada ({record.unit})</label>
          <input
            type="number"
            step="any"
            required
            autoFocus
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="mt-1.5 w-full border border-input bg-background/70 px-3 py-2 font-mono text-base text-foreground outline-none focus:border-amber"
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
            className="border border-patina bg-patina/15 px-5 py-2 font-mono text-xs uppercase tracking-wider text-patina hover:bg-patina/25 disabled:opacity-50"
          >
            {loading ? "Actualizando..." : "Sellar Nueva Marca"}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}
