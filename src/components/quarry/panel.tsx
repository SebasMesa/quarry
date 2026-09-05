import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Panel({
  title,
  meta,
  children,
  className,
  riveted,
  actions,
}: {
  title?: string;
  meta?: string;
  children: ReactNode;
  className?: string;
  riveted?: boolean;
  actions?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "panel-base scanlines vignette rounded-sm",
        riveted && "riveted",
        className,
      )}
    >
      {(title || actions) && (
        <header className="relative z-2 flex items-center justify-between gap-3 border-b border-border/70 bg-panel-deep/60 px-4 py-2.5">
          <div className="min-w-0">
            {title && (
              <h2 className="truncate text-sm text-foreground uppercase">{title}</h2>
            )}
            {meta && <p className="label-mono mt-0.5 truncate">{meta}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}
      <div className="relative z-2 p-4">{children}</div>
    </section>
  );
}

export function StatBar({
  value,
  max = 100,
  tone = "amber",
  className,
}: {
  value: number;
  max?: number;
  tone?: "amber" | "patina" | "rust" | "brass";
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const bg = {
    amber: "bg-amber",
    patina: "bg-patina",
    rust: "bg-rust",
    brass: "bg-brass",
  }[tone];
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden border border-border bg-panel-deep",
        className,
      )}
    >
      <div
        className={cn("h-full transition-[width] duration-500", bg)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Tag({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "amber" | "patina" | "rust" | "muted";
}) {
  const map = {
    amber: "border-amber/60 text-amber",
    patina: "border-patina/60 text-patina",
    rust: "border-rust/70 text-rust",
    muted: "border-border text-muted-foreground",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center border px-1.5 py-0.5 font-mono text-[10px] tracking-[0.14em] uppercase",
        map[tone],
      )}
    >
      {children}
    </span>
  );
}
