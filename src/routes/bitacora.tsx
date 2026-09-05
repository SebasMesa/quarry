import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  BookOpen,
  Sun,
  Moon,
  Feather,
  Archive,
  Lock,
  Unlock,
  KeyRound,
  Trash2,
  Calendar,
  Sparkles,
  ChevronRight,
  Plus,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { Shell } from "@/components/quarry/shell";
import { useQuarry } from "@/lib/state/quarry";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { JournalEntry, JournalPromptType } from "@/lib/data/types";

export const Route = createFileRoute("/bitacora")({
  head: () => ({
    meta: [
      { title: "Bitácora de Campo · QUARRY" },
      {
        name: "description",
        content:
          "Cuaderno de notas, reflexiones de jornada y páginas selladas del cazador en la terminal QUARRY.",
      },
    ],
  }),
  component: BitacoraPage,
});

const MOODS = [
  { key: "combativo", label: "Combativo" },
  { key: "enfocado", label: "Enfocado" },
  { key: "neutro", label: "Neutro" },
  { key: "fatigado", label: "Fatigado" },
  { key: "sobrecargado", label: "Sobrecargado" },
] as const;

type ActiveTab = "hoy" | "manana_noche" | "libre" | "archivo";

const LOCAL_PIN_KEY = "quarry_journal_pin";

function BitacoraPage() {
  const { state, isLoading, addJournalEntry, deleteJournalEntry } = useQuarry();
  const [activeTab, setActiveTab] = useState<ActiveTab>("hoy");
  const [pageKey, setPageKey] = useState(0); // Trigger for page-turn animation

  // Entry writing state
  const [writingPromptType, setWritingPromptType] = useState<JournalPromptType>("libre");
  const [contentInput, setContentInput] = useState("");
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [isSealedToggle, setIsSealedToggle] = useState(false);
  const [savingEntry, setSavingEntry] = useState(false);

  // Local PIN lock state
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [enteredPin, setEnteredPin] = useState("");
  const [unlockedForSession, setUnlockedForSession] = useState(false);
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [newPinInput, setNewPinInput] = useState("");
  const [selectedArchivedEntry, setSelectedArchivedEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    try {
      const pin = localStorage.getItem(LOCAL_PIN_KEY);
      if (pin) setStoredPin(pin);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const todayStr = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  // Filter entries for today and archive
  const journalEntries: JournalEntry[] = state?.journal_entries || [];

  const todayEntries = useMemo(() => {
    return journalEntries.filter((e: JournalEntry) => e.entry_date === todayStr);
  }, [journalEntries, todayStr]);

  const hasMorningToday = todayEntries.some((e: JournalEntry) => e.prompt_type === "manana");
  const hasEveningToday = todayEntries.some((e: JournalEntry) => e.prompt_type === "noche");

  function handleTabChange(tab: ActiveTab) {
    setActiveTab(tab);
    setPageKey((prev) => prev + 1);
  }

  function handleOpenWriter(promptType: JournalPromptType) {
    setWritingPromptType(promptType);
    setContentInput("");
    setSelectedMood("");
    setIsSealedToggle(false);
    if (promptType === "libre") {
      setActiveTab("libre");
    } else {
      setActiveTab("manana_noche");
    }
    setPageKey((prev) => prev + 1);
  }

  async function handleSaveEntry(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!contentInput.trim()) {
      toast.error("La página está vacía. Escribe unas líneas antes de sellarla.");
      return;
    }

    if (isSealedToggle && !storedPin) {
      setShowPinSetupModal(true);
      return;
    }

    setSavingEntry(true);
    try {
      const created = await addJournalEntry({
        entry_date: todayStr,
        prompt_type: writingPromptType,
        mood: selectedMood || null,
        content: contentInput.trim(),
        is_sealed: isSealedToggle,
      });

      if (created) {
        toast.success("Entrada sellada en la bitácora · +30 XP en Disciplina");
        setContentInput("");
        setSelectedMood("");
        setIsSealedToggle(false);
        setActiveTab("hoy");
        setPageKey((prev) => prev + 1);
      } else {
        toast.error("Error al persistir la entrada en la bitácora");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error inesperado al guardar la entrada");
    } finally {
      setSavingEntry(false);
    }
  }

  function handleSetPin(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPinInput)) {
      toast.error("El PIN debe ser exactamente de 4 dígitos numéricos");
      return;
    }
    try {
      localStorage.setItem(LOCAL_PIN_KEY, newPinInput);
      setStoredPin(newPinInput);
      setUnlockedForSession(true);
      setShowPinSetupModal(false);
      toast.success("PIN local configurado en este dispositivo");
    } catch (err) {
      console.error(err);
      toast.error("No se pudo guardar el PIN en localStorage");
    }
  }

  function handleUnlockWithPin(e: React.FormEvent) {
    e.preventDefault();
    if (enteredPin === storedPin) {
      setUnlockedForSession(true);
      setEnteredPin("");
      toast.success("Entradas selladas desbloqueadas");
    } else {
      toast.error("PIN incorrecto");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Deseas rasgar y destruir esta hoja de la bitácora?")) return;
    try {
      const ok = await deleteJournalEntry(id);
      if (ok) {
        toast.success("Página arrancada de la bitácora");
        if (selectedArchivedEntry?.id === id) {
          setSelectedArchivedEntry(null);
        }
      } else {
        toast.error("Error al eliminar página");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar página");
    }
  }

  if (isLoading || !state || !state.profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="font-display text-2xl text-amber">QUARRY</p>
          <p className="label-mono mt-2">Abriendo cuaderno de campo...</p>
        </div>
      </div>
    );
  }

  return (
    <Shell
      title="Bitácora de Campo"
      subtitle="Cuaderno manuscrito del cazador · Reflexión, intenciones y páginas reservadas"
    >
      {/* ─── CONTENEDOR DEL CUADERNO FÍSICO ─── */}
      <div className="relative mx-auto my-2 max-w-5xl">
        {/* Pestañas / Separadores físicos superiores/laterales */}
        <div className="flex flex-wrap items-center gap-1.5 pl-6 sm:pl-10">
          <button
            type="button"
            onClick={() => handleTabChange("hoy")}
            className={cn(
              "px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider rounded-t border-t border-x transition-all cursor-pointer",
              activeTab === "hoy"
                ? "bg-[#1f1b16] border-amber/60 text-amber font-semibold shadow-md -mb-px z-10 translate-y-px"
                : "bg-panel-deep/50 border-border/50 text-muted-foreground hover:text-foreground hover:bg-panel-deep"
            )}
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> Hoy ({todayEntries.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setWritingPromptType(hasMorningToday ? "noche" : "manana");
              handleTabChange("manana_noche");
            }}
            className={cn(
              "px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider rounded-t border-t border-x transition-all cursor-pointer",
              activeTab === "manana_noche"
                ? "bg-[#1f1b16] border-amber/60 text-amber font-semibold shadow-md -mb-px z-10 translate-y-px"
                : "bg-panel-deep/50 border-border/50 text-muted-foreground hover:text-foreground hover:bg-panel-deep"
            )}
          >
            <span className="flex items-center gap-1.5">
              <Sun className="h-3.5 w-3.5 text-amber" /> Mañana / Noche
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setWritingPromptType("libre");
              handleTabChange("libre");
            }}
            className={cn(
              "px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider rounded-t border-t border-x transition-all cursor-pointer",
              activeTab === "libre"
                ? "bg-[#1f1b16] border-amber/60 text-amber font-semibold shadow-md -mb-px z-10 translate-y-px"
                : "bg-panel-deep/50 border-border/50 text-muted-foreground hover:text-foreground hover:bg-panel-deep"
            )}
          >
            <span className="flex items-center gap-1.5">
              <Feather className="h-3.5 w-3.5 text-patina" /> Página Libre
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("archivo")}
            className={cn(
              "px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider rounded-t border-t border-x transition-all cursor-pointer ml-auto",
              activeTab === "archivo"
                ? "bg-[#1f1b16] border-amber/60 text-amber font-semibold shadow-md -mb-px z-10 translate-y-px"
                : "bg-panel-deep/50 border-border/50 text-muted-foreground hover:text-foreground hover:bg-panel-deep"
            )}
          >
            <span className="flex items-center gap-1.5">
              <Archive className="h-3.5 w-3.5" /> Archivo ({journalEntries.length})
            </span>
          </button>
        </div>

        {/* CUERPO DEL CUADERNO (Hoja física con lomo y renglones) */}
        <div
          key={pageKey}
          className="page-turn relative flex min-h-[580px] border border-[#383126] bg-[#1a1713] shadow-2xl overflow-hidden rounded-sm"
        >
          {/* Lomo cosido lateral / Espiral encuadernado */}
          <div className="relative w-9 sm:w-12 bg-gradient-to-r from-[#12100d] via-[#211d17] to-[#15120e] border-r border-[#3a3227] shrink-0 flex flex-col items-center justify-between py-6 select-none">
            <div className="flex flex-col gap-5 sm:gap-7">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="relative flex items-center justify-center">
                  <div className="h-3.5 w-3.5 rounded-full bg-[#0d0b09] border border-[#4d4233] shadow-inner" />
                  <div className="absolute -right-2 h-1 w-4 bg-[#7d6c54] rounded-sm opacity-60" />
                </div>
              ))}
            </div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-[#7d6c54]/50 rotate-90 whitespace-nowrap mt-4">
              BITÁCORA // 2049
            </div>
          </div>

          {/* Área de la página / Renglones */}
          <div className="flex-1 p-5 sm:p-8 flex flex-col relative bg-[radial-gradient(#241f19_1px,transparent_1px)] [background-size:16px_16px]">
            {/* Margen vertical rojo tenue característico de cuaderno */}
            <div className="absolute left-6 sm:left-10 top-0 bottom-0 w-px bg-[#a84332]/30 pointer-events-none" />

            {/* Encabezado de la página */}
            <div className="pl-5 sm:pl-8 pb-4 border-b border-[#352d22] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs text-amber uppercase tracking-widest">
                  {new Date().toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground/70">
                  · Cuaderno de supervivencia
                </span>
              </div>

              <div className="flex items-center gap-2">
                {storedPin ? (
                  <button
                    type="button"
                    onClick={() => setUnlockedForSession(!unlockedForSession)}
                    className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-amber border border-border/60 bg-panel-deep/50 px-2 py-0.5 rounded cursor-pointer"
                  >
                    {unlockedForSession ? (
                      <>
                        <Unlock className="h-3 w-3 text-patina" /> Desbloqueado
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3 text-amber" /> PIN Activo
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPinSetupModal(true)}
                    className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-brass border border-dashed border-border/60 px-2 py-0.5 rounded cursor-pointer"
                  >
                    <KeyRound className="h-3 w-3" /> Configurar PIN de sellado
                  </button>
                )}
              </div>
            </div>

            {/* CONTENIDO SEGÚN LA PESTAÑA ACTIVA */}
            <div className="pl-5 sm:pl-8 pt-5 flex-1 flex flex-col">
              {/* ─── PESTAÑA: HOY ─── */}
              {activeTab === "hoy" && (
                <div className="space-y-6">
                  {/* Si ya hay entradas hoy */}
                  {todayEntries.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-xs uppercase tracking-widest text-[#a89679]">
                          Entradas de la jornada presente:
                        </p>
                        <div className="flex gap-2">
                          {!hasMorningToday && (
                            <button
                              type="button"
                              onClick={() => handleOpenWriter("manana")}
                              className="font-mono text-[11px] text-amber hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Sun className="h-3 w-3" /> Añadir matutina
                            </button>
                          )}
                          {!hasEveningToday && (
                            <button
                              type="button"
                              onClick={() => handleOpenWriter("noche")}
                              className="font-mono text-[11px] text-patina hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Moon className="h-3 w-3" /> Añadir nocturna
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenWriter("libre")}
                            className="font-mono text-[11px] text-muted-foreground hover:text-foreground hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Feather className="h-3 w-3" /> Nueva nota libre
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {todayEntries.map((entry) => (
                          <JournalCard
                            key={entry.id}
                            entry={entry}
                            isUnlocked={unlockedForSession}
                            onUnlockRequest={() => setShowPinSetupModal(true)}
                            onDelete={() => handleDelete(entry.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Si no hay entradas hoy, guiar al usuario con prompts opcionales */}
                  {todayEntries.length === 0 && (
                    <div className="py-4 space-y-6">
                      <div className="text-center max-w-md mx-auto py-2">
                        <p className="font-display text-xl uppercase tracking-wider text-amber">
                          Página en Blanco · Jornada sin registrar
                        </p>
                        <p className="font-mono text-xs text-muted-foreground mt-1">
                          Un cazador sin registro mental repite los mismos errores. Elige un punto de partida para anotar hoy:
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Prompt Matutino */}
                        <div
                          onClick={() => handleOpenWriter("manana")}
                          className="group border border-[#42392c] bg-[#1e1a15]/80 hover:bg-[#252019] hover:border-amber p-4 cursor-pointer transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[11px] uppercase tracking-widest text-amber flex items-center gap-1.5">
                                <Sun className="h-3.5 w-3.5 text-amber" /> Mañana
                              </span>
                              <span className="font-mono text-[10px] text-patina border border-patina/30 bg-patina/10 px-1.5 py-0.2">
                                +30 XP Disciplina
                              </span>
                            </div>
                            <p className="font-display text-lg text-foreground mt-2 group-hover:text-amber transition-colors">
                              ¿Qué esperas del día de hoy, cazador?
                            </p>
                            <p className="font-handwriting text-xl text-[#d4c6a9] mt-2 leading-relaxed">
                              "Declara tu intención de combate antes de que empiece el desgaste de la jornada..."
                            </p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-[#352d22] flex items-center justify-between text-muted-foreground group-hover:text-amber font-mono text-xs">
                            <span>Escribir reflexión matutina</span>
                            <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>

                        {/* Prompt Nocturno */}
                        <div
                          onClick={() => handleOpenWriter("noche")}
                          className="group border border-[#42392c] bg-[#1e1a15]/80 hover:bg-[#252019] hover:border-patina p-4 cursor-pointer transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[11px] uppercase tracking-widest text-patina flex items-center gap-1.5">
                                <Moon className="h-3.5 w-3.5 text-patina" /> Noche
                              </span>
                              <span className="font-mono text-[10px] text-patina border border-patina/30 bg-patina/10 px-1.5 py-0.2">
                                +30 XP Disciplina
                              </span>
                            </div>
                            <p className="font-display text-lg text-foreground mt-2 group-hover:text-patina transition-colors">
                              ¿Qué contrato personal cerraste hoy?
                            </p>
                            <p className="font-handwriting text-xl text-[#d4c6a9] mt-2 leading-relaxed">
                              "Aunque no esté en el sistema, registra qué victoria o lección te llevas al campamento..."
                            </p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-[#352d22] flex items-center justify-between text-muted-foreground group-hover:text-patina font-mono text-xs">
                            <span>Escribir cierre nocturno</span>
                            <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>

                      {/* Botón para página libre */}
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => handleOpenWriter("libre")}
                          className="inline-flex items-center gap-2 border border-dashed border-[#4d4233] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#d4c6a9] hover:border-amber hover:text-amber transition-colors cursor-pointer"
                        >
                          <Feather className="h-3.5 w-3.5" /> O abre una página libre sin preguntas
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─── PESTAÑA: ESCRITOR (MAÑANA / NOCHE O LIBRE) ─── */}
              {(activeTab === "manana_noche" || activeTab === "libre") && (
                <form onSubmit={handleSaveEntry} className="flex flex-col flex-1 space-y-4">
                  {/* Selector o indicador de Prompt */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#352d22]">
                    <div className="flex items-center gap-2">
                      {writingPromptType === "manana" && (
                        <>
                          <Sun className="h-4 w-4 text-amber" />
                          <span className="font-mono text-xs uppercase tracking-wider text-amber font-semibold">
                            Reflexión Matutina: ¿Qué esperas del día de hoy, cazador?
                          </span>
                        </>
                      )}
                      {writingPromptType === "noche" && (
                        <>
                          <Moon className="h-4 w-4 text-patina" />
                          <span className="font-mono text-xs uppercase tracking-wider text-patina font-semibold">
                            Cierre Nocturno: ¿Qué contrato personal cerraste hoy?
                          </span>
                        </>
                      )}
                      {writingPromptType === "libre" && (
                        <>
                          <Feather className="h-4 w-4 text-[#d4c6a9]" />
                          <span className="font-mono text-xs uppercase tracking-wider text-[#d4c6a9] font-semibold">
                            Página Libre · Pensamiento Abierto
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setWritingPromptType("manana")}
                        className={cn(
                          "px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider border cursor-pointer",
                          writingPromptType === "manana"
                            ? "border-amber bg-amber/20 text-amber font-semibold"
                            : "border-border/50 text-muted-foreground"
                        )}
                      >
                        Mañana
                      </button>
                      <button
                        type="button"
                        onClick={() => setWritingPromptType("noche")}
                        className={cn(
                          "px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider border cursor-pointer",
                          writingPromptType === "noche"
                            ? "border-patina bg-patina/20 text-patina font-semibold"
                            : "border-border/50 text-muted-foreground"
                        )}
                      >
                        Noche
                      </button>
                      <button
                        type="button"
                        onClick={() => setWritingPromptType("libre")}
                        className={cn(
                          "px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider border cursor-pointer",
                          writingPromptType === "libre"
                            ? "border-[#d4c6a9] bg-[#d4c6a9]/20 text-[#d4c6a9] font-semibold"
                            : "border-border/50 text-muted-foreground"
                        )}
                      >
                        Libre
                      </button>
                    </div>
                  </div>

                  {/* Área de texto manuscrita con renglones simulados */}
                  <div className="relative flex-1 min-h-[260px] notebook-ruled">
                    <textarea
                      value={contentInput}
                      onChange={(e) => setContentInput(e.target.value)}
                      placeholder={
                        writingPromptType === "manana"
                          ? "Escribe tus intenciones, enfoque o advertencias para la jornada..."
                          : writingPromptType === "noche"
                            ? "Anota lo que aprendiste, qué venciste hoy o qué dejas ir..."
                            : "Escribe libremente lo que tengas en mente..."
                      }
                      className="w-full h-full min-h-[260px] bg-transparent border-0 outline-none resize-none font-handwriting text-2xl sm:text-3xl text-[#f3eedd] leading-[32px] placeholder:text-[#6e6350]/60 placeholder:font-handwriting placeholder:text-2xl"
                      autoFocus
                    />
                  </div>

                  {/* Barra de opciones al pie de la página */}
                  <div className="pt-3 border-t border-[#352d22] flex flex-wrap items-center justify-between gap-3">
                    {/* Ánimo (mismo vocabulario que Cuerpo) */}
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        Ánimo:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {MOODS.map((m) => {
                          const isSel = selectedMood === m.key;
                          return (
                            <button
                              key={m.key}
                              type="button"
                              onClick={() => setSelectedMood(isSel ? "" : m.key)}
                              className={cn(
                                "border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer",
                                isSel
                                  ? "border-amber bg-amber/20 text-amber font-semibold"
                                  : "border-border/60 bg-panel-deep/50 text-muted-foreground hover:border-border hover:text-foreground"
                              )}
                            >
                              {m.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Toggle de Página Sellada y botón Guardar */}
                    <div className="flex items-center gap-3 ml-auto">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isSealedToggle}
                          onChange={(e) => {
                            if (e.target.checked && !storedPin) {
                              setShowPinSetupModal(true);
                            }
                            setIsSealedToggle(e.target.checked);
                          }}
                          className="accent-amber"
                        />
                        <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                          <Lock className="h-3 w-3 text-amber" />
                          Sellar página (ocultar con PIN)
                        </span>
                      </label>

                      <button
                        type="submit"
                        disabled={savingEntry || !contentInput.trim()}
                        className="flex items-center gap-1.5 border border-amber bg-amber/20 px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-amber hover:bg-amber/30 disabled:opacity-40 transition-colors cursor-pointer shadow-sm"
                      >
                        <Feather className="h-3.5 w-3.5" />
                        {savingEntry ? "Sellando..." : "Sellar en Bitácora (+30 XP)"}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* ─── PESTAÑA: ARCHIVO DE PÁGINAS ─── */}
              {activeTab === "archivo" && (
                <div className="space-y-4 flex-1">
                  <div className="flex items-center justify-between pb-2 border-b border-[#352d22]">
                    <p className="font-mono text-xs uppercase tracking-widest text-[#a89679]">
                      Hojas archivadas del expediente ({journalEntries.length})
                    </p>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      Cronología completa
                    </span>
                  </div>

                  {journalEntries.length === 0 ? (
                    <div className="text-center py-16">
                      <p className="font-display text-lg text-muted-foreground uppercase">
                        El archivo está vacío
                      </p>
                      <p className="font-mono text-xs text-muted-foreground/60 mt-1">
                        Las páginas que redactes y selles quedarán resguardadas aquí.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenWriter("manana")}
                        className="mt-4 border border-amber/50 bg-amber/10 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-amber hover:bg-amber/20 cursor-pointer"
                      >
                        Escribir primera página
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {journalEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="border border-[#3d3428] bg-[#1d1914] p-3 hover:border-amber/60 transition-colors flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-amber" />
                                {entry.entry_date}
                              </span>
                              <span className="capitalize text-patina">
                                {entry.prompt_type}
                              </span>
                            </div>

                            {entry.is_sealed && !unlockedForSession ? (
                              <div className="my-3 py-2 px-3 border border-dashed border-amber/30 bg-amber/5 text-center">
                                <Lock className="h-4 w-4 text-amber mx-auto mb-1" />
                                <p className="font-mono text-[11px] text-amber uppercase">
                                  Página sellada
                                </p>
                                <p className="font-mono text-[9px] text-muted-foreground mt-0.5">
                                  Requiere desbloqueo local
                                </p>
                              </div>
                            ) : (
                              <p className="font-handwriting text-xl text-[#f3eedd] my-2 line-clamp-3 leading-snug">
                                "{entry.content}"
                              </p>
                            )}

                            {entry.mood && (
                              <p className="font-mono text-[10px] text-[#b3a186] mt-1">
                                Ánimo: <span className="capitalize font-semibold">{entry.mood}</span>
                              </p>
                            )}
                          </div>

                          <div className="pt-2 mt-2 border-t border-[#312a20] flex items-center justify-between font-mono text-[10px]">
                            {entry.is_sealed && (
                              <span className="text-amber flex items-center gap-1">
                                <Lock className="h-2.5 w-2.5" /> Sellada
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(entry.id)}
                              className="text-rust/80 hover:text-rust flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" /> Arrancar hoja
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL: CONFIGURAR / DESBLOQUEAR PIN LOCAL ─── */}
      {showPinSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm border border-amber/60 bg-[#191612] p-5 shadow-2xl">
            <div className="flex items-center gap-2 text-amber font-display text-lg uppercase tracking-wider pb-2 border-b border-border/60">
              <Lock className="h-5 w-5" />
              {storedPin ? "Desbloquear Páginas Selladas" : "Configurar PIN de Sellado"}
            </div>

            {storedPin ? (
              /* Desbloquear con PIN existente */
              <form onSubmit={handleUnlockWithPin} className="space-y-4 pt-4">
                <p className="font-mono text-xs text-muted-foreground">
                  Ingresa tu PIN de 4 dígitos para revelar las páginas selladas en este dispositivo.
                </p>
                <div>
                  <input
                    type="password"
                    maxLength={4}
                    value={enteredPin}
                    onChange={(e) => setEnteredPin(e.target.value)}
                    placeholder="****"
                    className="w-full border border-border bg-panel-deep p-2 text-center font-mono text-xl tracking-[0.4em] text-amber outline-none focus:border-amber"
                    autoFocus
                  />
                </div>

                <div className="border border-amber/30 bg-amber/5 p-2 rounded text-[10px] font-mono text-amber/80 flex items-start gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    Oculta en este dispositivo. No es cifrado de grado militar; tus datos están protegidos por tu cuenta y RLS en Supabase.
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPinSetupModal(false)}
                    className="border border-border px-3 py-1 font-mono text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="border border-amber bg-amber/20 px-3 py-1 font-mono text-xs text-amber hover:bg-amber/30 uppercase cursor-pointer"
                  >
                    Desbloquear
                  </button>
                </div>
              </form>
            ) : (
              /* Crear nuevo PIN */
              <form onSubmit={handleSetPin} className="space-y-4 pt-4">
                <p className="font-mono text-xs text-muted-foreground">
                  Crea un PIN numérico de 4 dígitos. Se guardará únicamente en este dispositivo en localStorage para ocultar tus notas reservadas.
                </p>
                <div>
                  <input
                    type="password"
                    maxLength={4}
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="ej. 1234"
                    className="w-full border border-border bg-panel-deep p-2 text-center font-mono text-xl tracking-[0.4em] text-amber outline-none focus:border-amber"
                    autoFocus
                  />
                </div>

                <div className="border border-amber/30 bg-amber/5 p-2 rounded text-[10px] font-mono text-amber/80 flex items-start gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    Honestidad de terminal: Esta función oculta la pantalla frente a miradas indiscretas en este navegador, no es cifrado criptográfico.
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPinSetupModal(false)}
                    className="border border-border px-3 py-1 font-mono text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="border border-amber bg-amber/20 px-3 py-1 font-mono text-xs text-amber hover:bg-amber/30 uppercase cursor-pointer"
                  >
                    Establecer PIN
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}

// Subcomponente de Tarjeta de Entrada
function JournalCard({
  entry,
  isUnlocked,
  onUnlockRequest,
  onDelete,
}: {
  entry: JournalEntry;
  isUnlocked: boolean;
  onUnlockRequest: () => void;
  onDelete: () => void;
}) {
  const isLocked = entry.is_sealed && !isUnlocked;

  return (
    <div className="border border-[#383025] bg-[#1d1914]/90 p-4 relative shadow-sm hover:border-[#4d4233] transition-colors">
      {/* Cabecera de la entrada */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#31291e]">
        <div className="flex items-center gap-2">
          {entry.prompt_type === "manana" && <Sun className="h-3.5 w-3.5 text-amber" />}
          {entry.prompt_type === "noche" && <Moon className="h-3.5 w-3.5 text-patina" />}
          {entry.prompt_type === "libre" && <Feather className="h-3.5 w-3.5 text-[#d4c6a9]" />}
          <span className="font-mono text-xs uppercase tracking-wider text-[#b8a68b] font-semibold">
            {entry.prompt_type === "manana"
              ? "Reflexión Matutina"
              : entry.prompt_type === "noche"
                ? "Cierre Nocturno"
                : "Nota Libre"}
          </span>
          {entry.mood && (
            <span className="font-mono text-[10px] text-brass/80 border border-brass/30 bg-brass/10 px-1.5 py-0.2 capitalize">
              {entry.mood}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {entry.is_sealed && (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-amber border border-amber/40 bg-amber/10 px-1.5 py-0.2 uppercase">
              <Lock className="h-2.5 w-2.5" /> Sellada
            </span>
          )}
          <button
            type="button"
            onClick={onDelete}
            title="Arrancar hoja"
            className="text-muted-foreground/60 hover:text-rust transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="pt-3 pb-1">
        {isLocked ? (
          <div className="py-6 px-4 text-center border border-dashed border-amber/30 bg-amber/5 rounded">
            <Lock className="h-6 w-6 text-amber mx-auto mb-2" />
            <p className="font-display text-base text-amber uppercase tracking-wider">
              Página sellada
            </p>
            <p className="font-mono text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Contenido oculto en este dispositivo. No es una entrada cifrada.
            </p>
            <button
              type="button"
              onClick={onUnlockRequest}
              className="mt-3 inline-flex items-center gap-1.5 border border-amber/60 bg-amber/15 px-3 py-1 font-mono text-xs text-amber uppercase hover:bg-amber/25 cursor-pointer"
            >
              <KeyRound className="h-3 w-3" /> Ingresar PIN para ver
            </button>
          </div>
        ) : (
          <p className="font-handwriting text-2xl sm:text-3xl text-[#f3eedd] leading-relaxed whitespace-pre-wrap">
            {entry.content}
          </p>
        )}
      </div>
    </div>
  );
}
