"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Cake,
  CheckCircle2,
  Gift,
  Heart,
  Loader2,
  MapPin,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { guardarDatosFidelizacionAction } from "@/server/aula/fidelizacion";
import { toast } from "sonner";

interface ModalOnboardingFidelizacionProps {
  mostrarModal: boolean;
  nombreAlumno?: string;
  ciudadInicial?: string | null;
}

const MESES = [
  { valor: "01", nombre: "Enero" },
  { valor: "02", nombre: "Febrero" },
  { valor: "03", nombre: "Marzo" },
  { valor: "04", nombre: "Abril" },
  { valor: "05", nombre: "Mayo" },
  { valor: "06", nombre: "Junio" },
  { valor: "07", nombre: "Julio" },
  { valor: "08", nombre: "Agosto" },
  { valor: "09", nombre: "Septiembre" },
  { valor: "10", nombre: "Octubre" },
  { valor: "11", nombre: "Noviembre" },
  { valor: "12", nombre: "Diciembre" },
];

const DIAS = Array.from({ length: 31 }, (_, i) => {
  const d = i + 1;
  return d < 10 ? `0${d}` : `${d}`;
});

const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = Array.from({ length: 80 }, (_, i) => `${ANIO_ACTUAL - 10 - i}`);

const STORAGE_KEY = "amorelo_fidelizacion_recordar_tarde";

export function ModalOnboardingFidelizacion({
  mostrarModal,
  nombreAlumno,
  ciudadInicial,
}: ModalOnboardingFidelizacionProps) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [dia, setDia] = useState("");
  const [mes, setMes] = useState("");
  const [anio, setAnio] = useState("");
  const [ciudad, setCiudad] = useState(ciudadInicial || "");
  const [genero, setGenero] = useState("Femenino");
  const [aceptaMarketing, setAceptaMarketing] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ciudadInicial && !ciudad) {
      setCiudad(ciudadInicial);
    }
  }, [ciudadInicial]);

  useEffect(() => {
    if (!mostrarModal) {
      setAbierto(false);
      return;
    }

    // Verificar si el alumno ya eligió "recordar más tarde" en esta sesión de navegador
    try {
      const omitido = sessionStorage.getItem(STORAGE_KEY);
      if (!omitido) {
        setAbierto(true);
      }
    } catch {
      setAbierto(true);
    }
  }, [mostrarModal]);

  const handleRecordarTarde = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignorar si el navegador bloquea storage
    }
    setAbierto(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!dia || !mes || !anio) {
      setError("Por favor completa el día, mes y año de tu nacimiento.");
      return;
    }

    const fechaNacimiento = `${anio}-${mes}-${dia}`;
    const ciudadLimpia = ciudad.trim();

    if (!ciudadLimpia) {
      setError("Por favor escribe tu ciudad de residencia.");
      return;
    }

    setCargando(true);
    try {
      const res = await guardarDatosFidelizacionAction({
        fechaNacimiento,
        ciudad: ciudadLimpia,
        genero,
        aceptaMarketing,
      });

      if (!res.ok) {
        setError(res.error);
        setCargando(false);
        return;
      }

      toast.success("¡Beneficios de cumpleaños activados!", {
        description: "Gracias por completar tus datos. ¡Te consentiremos en tu fecha especial!",
      });

      setAbierto(false);
      router.refresh();
    } catch {
      setError("Ocurrió un error inesperado al guardar. Inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  if (!abierto) return null;

  const primerNombre = (nombreAlumno || "alumna").split(" ")[0];

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100vw-3rem)] max-w-[calc(100vw-3rem)] sm:w-full sm:max-w-xl md:max-w-2xl lg:max-w-[720px] max-h-[92vh] overflow-y-auto rounded-3xl sm:rounded-4xl border border-slate-200/90 bg-white p-6 sm:p-8 md:p-9 shadow-2xl dark:border-blue-400/25 dark:bg-gradient-to-b dark:from-[#0d1a4f] dark:to-[#070e2c] dark:shadow-[0_20px_60px_-15px_rgba(3,7,28,0.9),0_0_50px_rgba(37,99,235,0.2)] transition-all"
      >
        {/* Botón de cierre elegante */}
        <DialogClose
          render={
            <button
              type="button"
              aria-label="Cerrar modal"
              className="absolute top-4 right-4 sm:top-5 sm:right-5 flex size-8 sm:size-9 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-blue-200/70 dark:hover:text-white dark:bg-blue-950/40 dark:hover:bg-blue-900/60 border border-transparent dark:border-blue-400/20 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          }
        >
          <X className="size-4" />
          <span className="sr-only">Cerrar</span>
        </DialogClose>

        <div className="text-center sm:text-center pt-1 sm:pt-0">
          {/* Badge festivo con resplandor */}
          <div className="mx-auto flex size-14 sm:size-16 items-center justify-center rounded-2xl sm:rounded-3xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300 mb-3 sm:mb-4 border border-amber-500/20 dark:border-amber-400/30 shadow-md shadow-amber-500/10">
            <Cake className="size-7 sm:size-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2.5 border border-blue-200/60 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-400/30">
            <Sparkles className="size-3 text-blue-600 dark:text-blue-300" />
            <span>Beneficio Exclusivo Amorelo</span>
          </div>

          <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight dark:text-white">
            ¡Queremos celebrar tu cumpleaños! 🎉
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-slate-500 mt-2 max-w-lg mx-auto leading-relaxed dark:text-blue-100/75">
            Hola <strong className="text-slate-900 dark:text-white font-bold">{primerNombre}</strong>, en Amorelo nos encanta premiar tu esfuerzo.
            Cuéntanos cuándo cumples años para prepararte regalos sorpresa, cupones exclusivos y beneficios en tu fecha especial.
          </DialogDescription>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs sm:text-sm font-medium text-destructive dark:bg-red-500/15 dark:text-red-300 border border-destructive/20">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 sm:mt-6 flex flex-col gap-4 sm:gap-5">
          {/* Selector de Fecha de Nacimiento (3 columnas rápidas para celular) */}
          <div>
            <Label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-blue-200/90 uppercase tracking-wider text-[11px]">
              <Cake className="size-3.5 text-blue-600 dark:text-blue-400" />
              <span>Fecha de Nacimiento *</span>
            </Label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* Día */}
              <Select value={dia} onValueChange={(v) => setDia(v || "")}>
                <SelectTrigger className="h-11 text-xs sm:text-sm rounded-xl bg-slate-50/80 text-slate-900 border-slate-200 transition-colors dark:bg-[#070f30] dark:border-blue-400/25 dark:text-white dark:hover:border-blue-400/40">
                  <SelectValue placeholder="Día" />
                </SelectTrigger>
                <SelectContent className="max-h-56 z-50 bg-white border-slate-200 dark:bg-[#0c1642] dark:border-blue-400/30">
                  {DIAS.map((d) => (
                    <SelectItem key={d} value={d} className="text-xs dark:text-white dark:focus:bg-blue-600/30 cursor-pointer">
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Mes */}
              <Select value={mes} onValueChange={(v) => setMes(v || "")}>
                <SelectTrigger className="h-11 text-xs sm:text-sm rounded-xl bg-slate-50/80 text-slate-900 border-slate-200 transition-colors dark:bg-[#070f30] dark:border-blue-400/25 dark:text-white dark:hover:border-blue-400/40">
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent className="max-h-56 z-50 bg-white border-slate-200 dark:bg-[#0c1642] dark:border-blue-400/30">
                  {MESES.map((m) => (
                    <SelectItem key={m.valor} value={m.valor} className="text-xs dark:text-white dark:focus:bg-blue-600/30 cursor-pointer">
                      {m.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Año */}
              <Select value={anio} onValueChange={(v) => setAnio(v || "")}>
                <SelectTrigger className="h-11 text-xs sm:text-sm rounded-xl bg-slate-50/80 text-slate-900 border-slate-200 transition-colors dark:bg-[#070f30] dark:border-blue-400/25 dark:text-white dark:hover:border-blue-400/40">
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent className="max-h-56 z-50 bg-white border-slate-200 dark:bg-[#0c1642] dark:border-blue-400/30">
                  {ANIOS.map((a) => (
                    <SelectItem key={a} value={a} className="text-xs dark:text-white dark:focus:bg-blue-600/30 cursor-pointer">
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ciudad y Género */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {/* Ciudad */}
            <div>
              <Label htmlFor="onboarding-ciudad" className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-blue-200/90 uppercase tracking-wider text-[11px]">
                <MapPin className="size-3.5 text-blue-600 dark:text-blue-400" />
                <span>Ciudad donde vives *</span>
              </Label>
              <Input
                id="onboarding-ciudad"
                type="text"
                required
                placeholder="Ej. Trujillo, Lima, etc."
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                className="h-11 text-xs sm:text-sm rounded-xl bg-slate-50/80 text-slate-900 border-slate-200 transition-colors dark:bg-[#070f30] dark:border-blue-400/25 dark:text-white dark:placeholder:text-blue-200/40 dark:hover:border-blue-400/40"
              />
            </div>

            {/* Género */}
            <div>
              <Label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-blue-200/90 uppercase tracking-wider text-[11px]">
                <Users className="size-3.5 text-blue-600 dark:text-blue-400" />
                <span>Género</span>
              </Label>
              <Select value={genero} onValueChange={(v) => setGenero(v || "Femenino")}>
                <SelectTrigger className="h-11 text-xs sm:text-sm rounded-xl bg-slate-50/80 text-slate-900 border-slate-200 transition-colors dark:bg-[#070f30] dark:border-blue-400/25 dark:text-white dark:hover:border-blue-400/40">
                  <SelectValue placeholder="Selecciona género" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white border-slate-200 dark:bg-[#0c1642] dark:border-blue-400/30">
                  <SelectItem value="Femenino" className="text-xs dark:text-white dark:focus:bg-blue-600/30 cursor-pointer">
                    Femenino
                  </SelectItem>
                  <SelectItem value="Masculino" className="text-xs dark:text-white dark:focus:bg-blue-600/30 cursor-pointer">
                    Masculino
                  </SelectItem>
                  <SelectItem value="Otro" className="text-xs dark:text-white dark:focus:bg-blue-600/30 cursor-pointer">
                    Otro
                  </SelectItem>
                  <SelectItem value="Prefiero no decirlo" className="text-xs dark:text-white dark:focus:bg-blue-600/30 cursor-pointer">
                    Prefiero no decirlo
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Checkbox de Consentimiento de Marketing / Regalos */}
          <div className="flex items-start gap-3 rounded-2xl bg-blue-50/60 p-3.5 sm:p-4 border border-blue-100 dark:bg-blue-950/40 dark:border-blue-400/20">
            <Checkbox
              id="onboarding-marketing"
              checked={aceptaMarketing}
              onCheckedChange={(checked) => setAceptaMarketing(Boolean(checked))}
              className="mt-0.5 rounded-md data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-500"
            />
            <label
              htmlFor="onboarding-marketing"
              className="text-xs text-slate-600 dark:text-blue-100/80 leading-relaxed cursor-pointer select-none"
            >
              Quiero recibir mi regalo de cumpleaños, descuentos especiales y novedades de Amorelo por WhatsApp y correo electrónico.
            </label>
          </div>

          {/* Botones */}
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={handleRecordarTarde}
              disabled={cargando}
              className="h-11 rounded-xl text-xs text-slate-500 hover:text-slate-900 dark:text-blue-200/70 dark:hover:text-white dark:hover:bg-blue-900/30 font-semibold order-2 sm:order-1 cursor-pointer"
            >
              Recordármelo más tarde
            </Button>

            <Button
              type="submit"
              disabled={cargando || !dia || !mes || !anio || !ciudad.trim()}
              className="h-11 px-5 rounded-xl text-xs font-bold gap-2 order-1 sm:order-2 cursor-pointer shadow-md bg-blue-600 hover:bg-blue-500 text-white dark:bg-blue-600 dark:hover:bg-blue-500 dark:shadow-[0_0_20px_rgba(37,99,235,0.35)] transition-all disabled:opacity-50"
            >
              {cargando ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Gift className="size-4" />
                  <span>Activar mis Regalos</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
