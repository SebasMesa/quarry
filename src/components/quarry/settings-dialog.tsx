import { useQuarry } from "@/lib/state/quarry";
import { THEMES_CATALOG } from "@/lib/state/themes";
import { cn } from "@/lib/utils";
import { Check, Palette, Sparkles, X } from "lucide-react";

export function SettingsDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { theme, setTheme } = useQuarry();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl border border-border bg-panel p-6 shadow-2xl scanlines relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header de la ventana militar */}
        <div className="flex items-start justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center border border-amber/70 bg-amber/10 text-amber">
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-xl text-foreground uppercase tracking-wider">
                Ajustes de Terminal
              </h2>
              <p className="label-mono mt-0.5 text-muted-foreground">
                Configuración visual del HUD · Protocolo de personalización
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center border border-border text-muted-foreground hover:border-amber hover:text-amber transition-colors"
            aria-label="Cerrar ventana"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="mt-5 space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="label-mono text-xs text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber" />
                Paleta del HUD (Esquema de Colores)
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Selecciona el espectro cromático de tu terminal de cazador. El cambio se aplica inmediatamente sobre paneles, scanlines y métricas.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {THEMES_CATALOG.map((t) => {
                const isActive = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    type="button"
                    className={cn(
                      "group relative flex flex-col text-left p-3.5 border transition-all",
                      isActive
                        ? "border-amber bg-amber/10 shadow-md ring-1 ring-amber/50"
                        : "border-border/70 bg-panel-deep/50 hover:border-border hover:bg-panel-deep/80"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* <span className="text-xl">{t.emoji}</span> */}
                        <div>
                          <p
                            className={cn(
                              "text-sm font-bold tracking-wide transition-colors",
                              isActive ? "text-amber" : "text-foreground group-hover:text-foreground"
                            )}
                          >
                            {t.name}
                          </p>
                          <p className="font-mono text-[10px] text-muted-foreground truncate">
                            {t.tagline}
                          </p>
                        </div>
                      </div>

                      {isActive ? (
                        <span className="shrink-0 flex items-center gap-1 border border-amber bg-amber/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-amber">
                          <Check className="h-2.5 w-2.5" />
                          Activo
                        </span>
                      ) : (
                        <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-muted-foreground group-hover:text-amber">
                          Activar
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                      {t.description}
                    </p>

                    {/* Muestrario de colores */}
                    <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-border/40">
                      <span className="font-mono text-[9px] text-muted-foreground mr-1">Muestra:</span>
                      <div
                        className="h-3 w-3 rounded-full border border-black/40 shadow-sm"
                        style={{ backgroundColor: t.colors.bg }}
                        title="Fondo"
                      />
                      <div
                        className="h-3 w-3 rounded-full border border-black/40 shadow-sm"
                        style={{ backgroundColor: t.colors.primary }}
                        title="Primario / Resaltado"
                      />
                      <div
                        className="h-3 w-3 rounded-full border border-black/40 shadow-sm"
                        style={{ backgroundColor: t.colors.secondary }}
                        title="Secundario / HUD"
                      />
                      <div
                        className="h-3 w-3 rounded-full border border-black/40 shadow-sm"
                        style={{ backgroundColor: t.colors.accent }}
                        title="Sellado / Éxito"
                      />
                      <div
                        className="h-3 w-3 rounded-full border border-black/40 shadow-sm"
                        style={{ backgroundColor: t.colors.warning }}
                        title="Alertas / Vencidos"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end border-t border-border/80 pt-4">
          <button
            onClick={onClose}
            className="border border-border/80 bg-background px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:border-amber hover:text-amber transition-colors"
          >
            Cerrar Terminal
          </button>
        </div>
      </div>
    </div>
  );
}
