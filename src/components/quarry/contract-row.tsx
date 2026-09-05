import { Check, CircleAlert, Clock } from "lucide-react";
import type { Contract } from "@/lib/data/types";
import { Tag } from "./panel";
import { cn } from "@/lib/utils";
import { useState } from "react";

const TYPE_LABEL: Record<Contract["type"], string> = {
  mayor: "Contrato mayor",
  menor: "Contrato menor",
  rutina: "Rutina",
};

export function ContractRow({
  contract,
  onComplete,
}: {
  contract: Contract;
  onComplete: (id: string, amount?: number) => void;
}) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showConfirmMajor, setShowConfirmMajor] = useState(false);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const done = contract.status === "completado";
  const overdue = contract.status === "vencido";
  const isMajorOrHard = contract.type === "mayor" || contract.difficulty >= 4;

  const handleCompleteClick = () => {
    if (isSubmitting || done) return;
    if (contract.is_financial) {
      setShowPrompt(true);
    } else if (isMajorOrHard) {
      setShowConfirmMajor(true);
    } else {
      executeComplete();
    }
  };

  const executeComplete = (receivedAmount?: number) => {
    setIsSubmitting(true);
    onComplete(contract.id, receivedAmount);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowConfirmMajor(false);
      setShowPrompt(false);
    }, 600);
  };

  const handleConfirm = () => {
    const parsedAmount = Number(amount);
    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      executeComplete(parsedAmount);
    }
  };

  return (
    <li
      className={cn(
        "group flex items-start gap-3 border border-border/70 bg-panel-deep/40 p-3 transition-colors",
        done && "border-patina/40 opacity-75",
        overdue && "border-rust/50",
      )}
    >
      <button
        onClick={handleCompleteClick}
        disabled={done || showPrompt || showConfirmMajor || isSubmitting}
        aria-label={done ? "Contrato completado" : "Marcar como completado"}
        className={cn(
          "mt-0.5 grid h-6 w-6 shrink-0 place-items-center border transition-colors",
          done
            ? "border-patina bg-patina/20 text-patina"
            : "border-brass/70 text-transparent hover:border-amber hover:bg-amber/15 hover:text-amber",
          isSubmitting && "opacity-50 cursor-not-allowed",
        )}
      >
        <Check className="h-3.5 w-3.5" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone={contract.type === "mayor" ? "amber" : "muted"}>
            {TYPE_LABEL[contract.type]}
          </Tag>
          <Tag tone={done ? "patina" : overdue ? "rust" : "amber"}>
            {contract.status}
          </Tag>
          <span className="font-mono text-[10px] text-muted-foreground">
            dif {"▮".repeat(contract.difficulty)}
            <span className="opacity-30">{"▮".repeat(5 - contract.difficulty)}</span>
          </span>
        </div>
        <p
          className={cn(
            "mt-1.5 text-sm leading-snug text-foreground",
            done && "line-through decoration-patina/60",
          )}
        >
          {contract.title}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {contract.description}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px]">
          <span className="text-amber">+{contract.reward_xp} xp</span>
          {contract.streak_count > 0 && (
            <span className="text-patina">racha {contract.streak_count} d</span>
          )}
          <span
            className={cn(
              "inline-flex items-center gap-1",
              overdue ? "text-rust" : "text-muted-foreground",
            )}
          >
            {overdue ? (
              <CircleAlert className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {new Date(contract.due_date).toLocaleString("es", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        
        {showConfirmMajor && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
            <span className="font-mono text-xs text-amber">
              ¿Confirmar sellado de contrato mayor?
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => executeComplete()}
                disabled={isSubmitting}
                className="h-7 border border-amber/70 bg-amber/20 px-3 font-mono text-xs text-amber hover:bg-amber/30 transition-colors"
              >
                {isSubmitting ? "Sellando..." : "Confirmar"}
              </button>
              <button
                onClick={() => setShowConfirmMajor(false)}
                className="h-7 px-2 font-mono text-xs text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {showPrompt && (
          <div className="mt-3 flex items-center gap-2 border-t border-border/40 pt-3">
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Monto recibido"
              className="h-7 w-32 border border-brass/50 bg-background/50 px-2 font-mono text-xs text-foreground focus:border-amber focus:outline-none"
            />
            <button
              onClick={handleConfirm}
              className="h-7 border border-patina/50 bg-patina/20 px-3 font-mono text-xs text-patina hover:bg-patina/30"
            >
              Confirmar cobro
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="h-7 px-2 font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
