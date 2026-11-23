"use client";

import * as React from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// -------------------------------------------------------------
// Utilidades de Parseo y Formato
// -------------------------------------------------------------

function parseDateTimeString(val?: string | null): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function parseDateOnlyString(val?: string | null): Date | null {
  if (!val) return null;
  // Si viene en formato "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [y, m, d] = val.split("-").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function toLocalIsoString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
}

function toDateOnlyString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}`;
}

// -------------------------------------------------------------
// Componente Núcleo: Calendario Mensual Interactivo
// -------------------------------------------------------------

interface VistaMesProps {
  mesActual: Date;
  fechaSeleccionada: Date | null;
  onSelectFecha: (d: Date) => void;
  onMesAnterior: () => void;
  onMesSiguiente: () => void;
  minDate?: Date;
  maxDate?: Date;
}

function VistaMes({
  mesActual,
  fechaSeleccionada,
  onSelectFecha,
  onMesAnterior,
  onMesSiguiente,
  minDate,
  maxDate,
}: VistaMesProps) {
  const inicioMes = startOfMonth(mesActual);
  const finMes = endOfMonth(mesActual);
  const inicioGrid = startOfWeek(inicioMes, { weekStartsOn: 1 });
  const finGrid = endOfWeek(finMes, { weekStartsOn: 1 });
  const dias = eachDayOfInterval({ start: inicioGrid, end: finGrid });

  const diasSemana = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

  return (
    <div className="w-[280px] space-y-3 select-none">
      {/* Cabecera de Navegación del Mes */}
      <div className="flex items-center justify-between px-1">
        <h4 className="text-sm font-bold text-heading capitalize">
          {format(mesActual, "MMMM yyyy", { locale: es })}
        </h4>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMesAnterior}
            className="size-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
            title="Mes anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMesSiguiente}
            className="size-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
            title="Mes siguiente"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Días de la Semana */}
      <div className="grid grid-cols-7 text-center">
        {diasSemana.map((d) => (
          <span
            key={d}
            className="text-[11px] font-bold text-muted-foreground/70 uppercase"
          >
            {d}
          </span>
        ))}
      </div>

      {/* Grid de Días */}
      <div className="grid grid-cols-7 gap-1">
        {dias.map((dia) => {
          const esDelMes = isSameMonth(dia, mesActual);
          const esSeleccionado =
            fechaSeleccionada && isSameDay(dia, fechaSeleccionada);
          const esHoy = isToday(dia);

          const deshabilitado =
            (minDate && dia < startOfMonth(minDate) && !isSameDay(dia, minDate)) ||
            (maxDate && dia > maxDate);

          return (
            <button
              key={dia.toISOString()}
              type="button"
              disabled={Boolean(deshabilitado)}
              onClick={() => onSelectFecha(dia)}
              className={cn(
                "size-8 rounded-lg text-xs font-semibold transition-all flex items-center justify-center cursor-pointer outline-none",
                !esDelMes && "text-muted-foreground/30 hover:bg-muted/40",
                esDelMes && !esSeleccionado && "text-foreground hover:bg-muted",
                esHoy && !esSeleccionado && "border border-icon-accent font-bold text-icon-accent",
                esSeleccionado &&
                  "bg-primary text-primary-foreground font-black shadow-xs hover:bg-primary/90"
              )}
            >
              {dia.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 1. DATETIME PICKER (Fecha + Hora / Minuto / AM-PM)
// -------------------------------------------------------------

export interface DateTimePickerProps {
  value?: string; // Formato ISO local: "YYYY-MM-DDTHH:mm"
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha y hora...",
  className,
  id,
  disabled = false,
}: DateTimePickerProps) {
  const [abierto, setAbierto] = React.useState(false);
  const fechaSeleccionada = React.useMemo(() => parseDateTimeString(value), [value]);

  const [mesActual, setMesActual] = React.useState<Date>(
    fechaSeleccionada || new Date()
  );

  // Estados de Hora, Minuto y Periodo (AM/PM)
  const [hora12, setHora12] = React.useState<number>(() => {
    if (!fechaSeleccionada) return 9; // 9 AM por defecto
    const h = fechaSeleccionada.getHours();
    return h % 12 === 0 ? 12 : h % 12;
  });

  const [minuto, setMinuto] = React.useState<number>(() => {
    if (!fechaSeleccionada) return 0;
    return fechaSeleccionada.getMinutes();
  });

  const [periodo, setPeriodo] = React.useState<"AM" | "PM">(() => {
    if (!fechaSeleccionada) return "AM";
    return fechaSeleccionada.getHours() >= 12 ? "PM" : "AM";
  });

  // Sincronizar estados si el value externo cambia
  React.useEffect(() => {
    if (fechaSeleccionada) {
      setMesActual(fechaSeleccionada);
      const h = fechaSeleccionada.getHours();
      setHora12(h % 12 === 0 ? 12 : h % 12);
      setMinuto(fechaSeleccionada.getMinutes());
      setPeriodo(h >= 12 ? "PM" : "AM");
    }
  }, [fechaSeleccionada]);

  const aplicarFechaYHora = (
    baseDate: Date,
    h12: number,
    min: number,
    p: "AM" | "PM"
  ) => {
    let hora24 = h12 % 12;
    if (p === "PM") hora24 += 12;

    const nueva = new Date(baseDate);
    nueva.setHours(hora24, min, 0, 0);
    onChange(toLocalIsoString(nueva));
  };

  const handleSelectDia = (dia: Date) => {
    aplicarFechaYHora(dia, hora12, minuto, periodo);
  };

  const handleCambioHora = (nuevaH: number) => {
    setHora12(nuevaH);
    const base = fechaSeleccionada || new Date();
    aplicarFechaYHora(base, nuevaH, minuto, periodo);
  };

  const handleCambioMinuto = (nuevoMin: number) => {
    setMinuto(nuevoMin);
    const base = fechaSeleccionada || new Date();
    aplicarFechaYHora(base, hora12, nuevoMin, periodo);
  };

  const handleTogglePeriodo = (nuevoP: "AM" | "PM") => {
    setPeriodo(nuevoP);
    const base = fechaSeleccionada || new Date();
    aplicarFechaYHora(base, hora12, minuto, nuevoP);
  };

  const handleLimpiar = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const horas = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutos = [0, 15, 30, 45];

  const textoFechaHora = React.useMemo(() => {
    if (!fechaSeleccionada) return null;
    const f = format(fechaSeleccionada, "EEE, d MMM yyyy, hh:mm", { locale: es });
    const ampm = fechaSeleccionada.getHours() >= 12 ? "PM" : "AM";
    return `${f} ${ampm}`;
  }, [fechaSeleccionada]);

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger
        render={
          <button
            type="button"
            id={id}
            disabled={disabled}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-xl border border-input bg-card px-3 text-sm font-medium transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <CalendarIcon className="size-4 shrink-0 text-icon-accent" />
              {textoFechaHora ? (
                <span className="text-foreground text-xs sm:text-[13px] font-semibold truncate">
                  {textoFechaHora}
                </span>
              ) : (
                <span className="text-muted-foreground text-xs sm:text-sm truncate">{placeholder}</span>
              )}
            </div>

            {fechaSeleccionada && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleLimpiar}
                className="size-5 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer shrink-0 ml-1.5"
                title="Limpiar fecha"
              >
                <X className="size-3.5" />
              </span>
            )}
          </button>
        }
      />

      <PopoverContent align="start" className="p-4 space-y-4 w-auto">
        {/* Calendario de Días */}
        <VistaMes
          mesActual={mesActual}
          fechaSeleccionada={fechaSeleccionada}
          onSelectFecha={handleSelectDia}
          onMesAnterior={() => setMesActual((prev) => subMonths(prev, 1))}
          onMesSiguiente={() => setMesActual((prev) => addMonths(prev, 1))}
        />

        {/* Selector de Hora (Opción A: Hora / Minuto / AM-PM) */}
        <div className="border-t border-border pt-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-heading">
            <Clock className="size-3.5 text-icon-accent" />
            <span>Hora del Taller</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector Hora */}
            <div className="flex-1">
              <select
                aria-label="Hora"
                value={hora12}
                onChange={(e) => handleCambioHora(Number(e.target.value))}
                className="h-8 w-full rounded-lg border border-input bg-card px-2 text-xs font-bold text-foreground focus:outline-none cursor-pointer"
              >
                {horas.map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>

            <span className="font-bold text-muted-foreground">:</span>

            {/* Selector Minutos */}
            <div className="flex-1">
              <select
                aria-label="Minuto"
                value={minuto}
                onChange={(e) => handleCambioMinuto(Number(e.target.value))}
                className="h-8 w-full rounded-lg border border-input bg-card px-2 text-xs font-bold text-foreground focus:outline-none cursor-pointer"
              >
                {minutos.map((m) => (
                  <option key={m} value={m}>
                    {String(m).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle AM / PM */}
            <div className="flex rounded-lg border border-input p-0.5 bg-muted/40">
              <button
                type="button"
                onClick={() => handleTogglePeriodo("AM")}
                className={cn(
                  "px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer",
                  periodo === "AM"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => handleTogglePeriodo("PM")}
                className={cn(
                  "px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer",
                  periodo === "PM"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                PM
              </button>
            </div>
          </div>
        </div>

        {/* Botón de Confirmación Rápida */}
        <div className="pt-1">
          <Button
            type="button"
            size="sm"
            onClick={() => setAbierto(false)}
            className="w-full h-8 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Listo
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// -------------------------------------------------------------
// 2. DATE PICKER (Solo Fecha YYYY-MM-DD)
// -------------------------------------------------------------

export interface DatePickerProps {
  value?: string; // Formato: "YYYY-MM-DD"
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha...",
  className,
  id,
  disabled = false,
}: DatePickerProps) {
  const [abierto, setAbierto] = React.useState(false);
  const fechaSeleccionada = React.useMemo(() => parseDateOnlyString(value), [value]);

  const [mesActual, setMesActual] = React.useState<Date>(
    fechaSeleccionada || new Date()
  );

  React.useEffect(() => {
    if (fechaSeleccionada) {
      setMesActual(fechaSeleccionada);
    }
  }, [fechaSeleccionada]);

  const handleSelectDia = (dia: Date) => {
    onChange(toDateOnlyString(dia));
    setAbierto(false); // Cierre inmediato al elegir fecha
  };

  const handleLimpiar = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger
        render={
          <button
            type="button"
            id={id}
            disabled={disabled}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-xl border border-input bg-card px-3 text-sm font-medium transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <CalendarIcon className="size-4 shrink-0 text-icon-accent" />
              {fechaSeleccionada ? (
                <span className="text-foreground font-semibold text-xs sm:text-[13px] truncate">
                  {format(fechaSeleccionada, "EEE, d MMM yyyy", {
                    locale: es,
                  })}
                </span>
              ) : (
                <span className="text-muted-foreground text-xs sm:text-sm truncate">{placeholder}</span>
              )}
            </div>

            {fechaSeleccionada && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleLimpiar}
                className="size-5 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                title="Limpiar fecha"
              >
                <X className="size-3.5" />
              </span>
            )}
          </button>
        }
      />

      <PopoverContent align="start" className="p-4 w-auto">
        <VistaMes
          mesActual={mesActual}
          fechaSeleccionada={fechaSeleccionada}
          onSelectFecha={handleSelectDia}
          onMesAnterior={() => setMesActual((prev) => subMonths(prev, 1))}
          onMesSiguiente={() => setMesActual((prev) => addMonths(prev, 1))}
        />
      </PopoverContent>
    </Popover>
  );
}
