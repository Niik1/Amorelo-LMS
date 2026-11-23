// Tabla interactiva de asistentes a un taller presencial con filtro, búsqueda y control de puerta.
// Patrón híbrido responsive (0% scroll horizontal en móviles).
// Fase 4: Item 4.3 y 4.4 del Checklist + Gestión de Saldos Vencidos y Liquidación.

"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  UserCheck,
  UserX,
  Users,
  MoreVertical,
  DollarSign,
  CalendarPlus,
  UserMinus,
} from "lucide-react";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-time-picker";
import { cn } from "@/lib/utils";
import { obtenerBaseUrl } from "@/lib/urls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ReservaAsistenteItem } from "@/server/talleres/consultas";
import {
  marcarAsistenciaManualAction,
  liquidarSaldoReservaAction,
  extenderPlazoReservaAction,
  liberarCupoReservaAction,
  marcarReservasContactosExportadosAction,
} from "@/server/talleres/acciones";
import { toast } from "sonner";
import { ModalExportarContactos } from "@/components/admin/shared/modal-exportar-contactos";
import { BotonExportarTablaExcel } from "@/components/admin/shared/boton-exportar-tabla-excel";
import { type DatosContactoExportar } from "@/lib/contactos/formato-contacto";

interface TablaAsistentesProps {
  asistentes: ReservaAsistenteItem[];
  tallerId: string;
  tallerNombre: string;
  tallerFechaInicio?: string;
}

type FiltroEstado =
  | "todos"
  | "confirmada"
  | "adelanto"
  | "vencidos"
  | "asistio"
  | "pendiente_ingreso";

type TipoEstadoPago =
  | "pagado"
  | "adelanto_vigente"
  | "vence_pronto"
  | "plazo_vencido"
  | "vencida";

function calcularEstadoPago(a: ReservaAsistenteItem): {
  tipo: TipoEstadoPago;
  label: string;
  badgeClass: string;
} {
  if (a.estado === "vencida") {
    return {
      tipo: "vencida",
      label: "Cupo Liberado",
      badgeClass:
        "bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
    };
  }

  if (a.saldo_pendiente <= 0 || a.estado === "confirmada") {
    return {
      tipo: "pagado",
      label: `100% Pagado (S/ ${a.total.toFixed(2)})`,
      badgeClass:
        "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700",
    };
  }

  if (!a.fecha_limite_saldo) {
    return {
      tipo: "adelanto_vigente",
      label: `Adelanto: S/ ${a.monto_pagado.toFixed(2)}`,
      badgeClass:
        "bg-orange-100 text-orange-950 border-orange-300 dark:bg-orange-950/80 dark:text-orange-200 dark:border-orange-700",
    };
  }

  const hoy = new Date();
  const limite = new Date(a.fecha_limite_saldo);
  const diffMs = limite.getTime() - hoy.getTime();
  const diffHoras = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) {
    return {
      tipo: "plazo_vencido",
      label: "Plazo Vencido",
      badgeClass:
        "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700",
    };
  }

  if (diffHoras <= 48) {
    return {
      tipo: "vence_pronto",
      label: "Vence Pronto",
      badgeClass:
        "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700",
    };
  }

  return {
    tipo: "adelanto_vigente",
    label: `Adelanto: S/ ${a.monto_pagado.toFixed(2)}`,
    badgeClass:
      "bg-orange-100 text-orange-950 border-orange-300 dark:bg-orange-950/80 dark:text-orange-200 dark:border-orange-700",
  };
}

function formatearFechaLimite(iso?: string | null): string {
  if (!iso) return "Sin fecha límite";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "America/Lima",
    });
  } catch {
    return iso;
  }
}

export function TablaAsistentes({
  asistentes,
  tallerId,
  tallerNombre,
  tallerFechaInicio,
}: TablaAsistentesProps) {
  const router = useRouter();
  const [listaAsistentes, setListaAsistentes] = useState<ReservaAsistenteItem[]>(asistentes);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<FiltroEstado>("todos");
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Estados para los modales de acción administrativa
  const [reservaParaLiquidar, setReservaParaLiquidar] = useState<ReservaAsistenteItem | null>(null);
  const [canalLiquidacion, setCanalLiquidacion] = useState<"yape" | "transferencia" | "efectivo" | "whatsapp">("yape");
  const [notasLiquidacion, setNotasLiquidacion] = useState("");

  const [reservaParaExtender, setReservaParaExtender] = useState<ReservaAsistenteItem | null>(null);
  const [nuevaFechaLimite, setNuevaFechaLimite] = useState("");
  const [errorExtender, setErrorExtender] = useState("");

  const [reservaParaLiberar, setReservaParaLiberar] = useState<ReservaAsistenteItem | null>(null);
  const [motivoLiberacion, setMotivoLiberacion] = useState("");

  // Contadores para las píldoras de filtro
  const total = listaAsistentes.length;
  const confirmadas = listaAsistentes.filter(
    (a) => a.estado === "confirmada" || (a.saldo_pendiente <= 0 && a.estado !== "vencida")
  ).length;
  const adelantos = listaAsistentes.filter(
    (a) => a.estado === "adelanto" && a.saldo_pendiente > 0
  ).length;
  const vencidos = listaAsistentes.filter(
    (a) => calcularEstadoPago(a).tipo === "plazo_vencido" || a.estado === "vencida"
  ).length;
  const asistieron = listaAsistentes.filter((a) => a.asistio).length;
  const pendientesIngreso = listaAsistentes.filter((a) => !a.asistio && a.estado !== "vencida").length;

  // Filtrado reactivo
  const asistentesFiltrados = useMemo(() => {
    return listaAsistentes.filter((a) => {
      const estadoPago = calcularEstadoPago(a);

      // Filtro por píldora
      if (filtro === "confirmada" && estadoPago.tipo !== "pagado") return false;
      if (filtro === "adelanto" && !(a.estado === "adelanto" && a.saldo_pendiente > 0)) return false;
      if (filtro === "vencidos" && !(estadoPago.tipo === "plazo_vencido" || a.estado === "vencida")) return false;
      if (filtro === "asistio" && !a.asistio) return false;
      if (filtro === "pendiente_ingreso" && (a.asistio || a.estado === "vencida")) return false;

      // Búsqueda por texto
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase().trim();
      const nombreCompleto = `${a.nombres} ${a.apellidos}`.toLowerCase();
      const doc = (a.numero_documento || "").toLowerCase();
      const ticket = (a.ticket_codigo || "").toLowerCase();
      const orden = (a.numero_orden || "").toLowerCase();
      const correo = (a.correo || "").toLowerCase();
      const tel = (a.telefono || "").toLowerCase();

      return (
        nombreCompleto.includes(q) ||
        doc.includes(q) ||
        ticket.includes(q) ||
        orden.includes(q) ||
        correo.includes(q) ||
        tel.includes(q)
      );
    });
  }, [listaAsistentes, filtro, busqueda]);

  const contactosParaExportar = useMemo<
    (DatosContactoExportar & { contactoExportadoEn?: string | null })[]
  >(() => {
    return listaAsistentes.map((a) => ({
      id: a.id,
      nombres: a.nombres,
      apellidos: a.apellidos,
      nombreCompleto: `${a.nombres} ${a.apellidos}`.trim(),
      telefono: a.telefono || "",
      pais: a.pais || "PE",
      correo: a.correo || "",
      documento: a.numero_documento ? `DNI: ${a.numero_documento}` : a.numero_orden,
      cursoOTallerNombre: tallerNombre,
      tipo: "taller",
      fechaRegistroIso: a.creado_en || new Date().toISOString(),
      estado: a.estado,
      contactoExportadoEn: a.contacto_exportado_en,
    }));
  }, [listaAsistentes, tallerNombre]);

  const contactosFiltradosParaExportar = useMemo(() => {
    const idsFiltrados = new Set(asistentesFiltrados.map((a) => a.id));
    return contactosParaExportar.filter((c) => idsFiltrados.has(c.id));
  }, [contactosParaExportar, asistentesFiltrados]);

  const handleCopiarEnlace = async (token: string, id: string) => {
    const baseUrl = obtenerBaseUrl();
    const url = `${baseUrl}/t/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const handleAbrirWhatsApp = (a: ReservaAsistenteItem) => {
    if (!a.telefono) return;
    const telLimpio = a.telefono.replace(/\D/g, "");
    const prefijo = telLimpio.startsWith("51") ? telLimpio : `51${telLimpio}`;
    const baseUrl = obtenerBaseUrl();
    const ticketUrl = `${baseUrl}/t/${a.token_acceso}`;
    const estadoPago = calcularEstadoPago(a);
    const fechaLim = formatearFechaLimite(a.fecha_limite_saldo);

    let mensaje = "";
    if (estadoPago.tipo === "vencida") {
      mensaje = `Estimado/a ${a.nombres}, le informamos que el cupo reservado para el taller *${tallerNombre}* ha sido liberado por vencimiento del plazo para cancelar el saldo restante.\n\n🎟️ *Ticket:* ${a.ticket_codigo}\n📱 *Enlace informativo:* ${ticketUrl}\n\nSi crees que esto es un error, por favor responde a este mensaje para ayudarte. ✨`;
    } else if (estadoPago.tipo === "plazo_vencido") {
      mensaje = `¡Hola ${a.nombres}! ⚠️\nTe recordamos que la fecha límite para completar el saldo de tu reserva en el taller *${tallerNombre}* venció el *${fechaLim}*.\n\n🎟️ *Ticket:* ${a.ticket_codigo}\n💰 *Saldo Pendiente:* S/ ${a.saldo_pendiente.toFixed(2)}\n📱 *Tu Ticket Digital:* ${ticketUrl}\n\nPor favor comunícate a la brevedad para coordinar la regularización de tu cupo antes de que sea reasignado. ¡Gracias! ✨`;
    } else if (estadoPago.tipo === "vence_pronto") {
      mensaje = `¡Hola ${a.nombres}! ⏰\nTe recordamos que tu plazo para cancelar el saldo pendiente de tu reserva en el taller *${tallerNombre}* vence pronto (*${fechaLim}*).\n\n🎟️ *Ticket:* ${a.ticket_codigo}\n💰 *Saldo a Liquidar:* S/ ${a.saldo_pendiente.toFixed(2)}\n📱 *Revisa tu Ticket Digital:* ${ticketUrl}\n\n¡Te esperamos con muchas ganas! 🎈`;
    } else if (a.saldo_pendiente > 0) {
      mensaje = `¡Hola ${a.nombres}! 🎈\nTe recordamos tus datos de entrada para el taller *${tallerNombre}*:\n\n🎟️ *Código de Ticket:* ${a.ticket_codigo}\n💰 *Saldo Pendiente:* S/ ${a.saldo_pendiente.toFixed(2)} (Fecha límite: ${fechaLim})\n📱 *Enlace a tu Ticket Digital:*\n${ticketUrl}\n\n¡Te esperamos! ✨`;
    } else {
      mensaje = `¡Hola ${a.nombres}! 🎈\nTe recordamos tus datos de entrada para el taller *${tallerNombre}*:\n\n🎟️ *Código de Ticket:* ${a.ticket_codigo}\n✅ *Estado:* Confirmado 100%\n📱 *Enlace a tu Ticket Digital:*\n${ticketUrl}\n\n¡Te esperamos! ✨`;
    }

    const url = `https://wa.me/${prefijo}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  };

  const handleToggleAsistencia = (a: ReservaAsistenteItem) => {
    startTransition(async () => {
      const nuevoEstado = !a.asistio;
      const res = await marcarAsistenciaManualAction(a.id, nuevoEstado, tallerId);
      if (res.ok) {
        toast.success(
          nuevoEstado
            ? `Ingreso registrado para ${a.nombres} ${a.apellidos}`
            : `Ingreso desmarcado para ${a.nombres} ${a.apellidos}`
        );
        router.refresh();
      } else {
        toast.error(res.error || "No se pudo actualizar la asistencia.");
      }
    });
  };

  const handleConfirmarLiquidarSaldo = () => {
    if (!reservaParaLiquidar) return;
    startTransition(async () => {
      const res = await liquidarSaldoReservaAction({
        reservaId: reservaParaLiquidar.id,
        ordenId: reservaParaLiquidar.orden_id,
        tallerId,
        canal: canalLiquidacion,
        notas: notasLiquidacion,
      });

      if (res.ok) {
        toast.success("Saldo liquidado exitosamente", {
          description: `Se confirmó el cupo de ${reservaParaLiquidar.nombres} al 100%.`,
        });
        setReservaParaLiquidar(null);
        setNotasLiquidacion("");
        router.refresh();
      } else {
        toast.error("Error al liquidar el saldo", {
          description: res.error || "Ocurrió un error al procesar el pago.",
        });
      }
    });
  };

  const handleConfirmarExtenderPlazo = () => {
    if (!reservaParaExtender) return;
    if (!nuevaFechaLimite.trim()) {
      setErrorExtender("Por favor selecciona una nueva fecha límite.");
      return;
    }

    const ahora = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const hoyStr = `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}`;

    if (nuevaFechaLimite < hoyStr) {
      setErrorExtender("La fecha límite no puede ser anterior a la fecha de hoy.");
      return;
    }

    if (tallerFechaInicio) {
      const dInicio = new Date(tallerFechaInicio);
      const inicioStr = !isNaN(dInicio.getTime())
        ? `${dInicio.getFullYear()}-${pad(dInicio.getMonth() + 1)}-${pad(dInicio.getDate())}`
        : tallerFechaInicio.split("T")[0];

      if (nuevaFechaLimite > inicioStr) {
        setErrorExtender(`La fecha límite no puede ser posterior a la fecha del taller (${inicioStr}).`);
        return;
      }
    }

    startTransition(async () => {
      const res = await extenderPlazoReservaAction({
        reservaId: reservaParaExtender.id,
        ordenId: reservaParaExtender.orden_id,
        tallerId,
        nuevaFechaLimite,
      });

      if (res.ok) {
        toast.success("Plazo de pago extendido", {
          description: `Nueva fecha límite establecida para ${reservaParaExtender.nombres}.`,
        });
        setReservaParaExtender(null);
        router.refresh();
      } else {
        toast.error("Error al extender el plazo", {
          description: res.error || "No se pudo actualizar la fecha.",
        });
      }
    });
  };

  const handleConfirmarLiberarCupo = () => {
    if (!reservaParaLiberar) return;
    startTransition(async () => {
      const res = await liberarCupoReservaAction({
        reservaId: reservaParaLiberar.id,
        ordenId: reservaParaLiberar.orden_id,
        tallerId,
        motivo: motivoLiberacion.trim() || undefined,
      });

      if (res.ok) {
        toast.success("Cupo liberado exitosamente", {
          description: `El cupo de ${reservaParaLiberar.nombres} ha vuelto a estar disponible para el aforo.`,
        });
        setReservaParaLiberar(null);
        setMotivoLiberacion("");
        router.refresh();
      } else {
        toast.error("Error al liberar cupo", {
          description: res.error || "No se pudo liberar el cupo.",
        });
      }
    });
  };

  const hayFiltrosActivos = busqueda.trim() !== "" || filtro !== "todos";

  return (
    <div className="flex flex-col gap-6">
      {/* Barra de Filtros y Búsqueda */}
      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-5 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Buscador acotado */}
            <div className="relative w-full lg:max-w-md">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, DNI, ticket o correo…"
                aria-label="Buscar asistente por nombre, DNI, ticket o correo"
                className="h-10 rounded-xl border-border bg-card pr-3 pl-9 text-sm"
              />
            </div>

            {/* Píldoras de Estado agrupadas con conteos */}
            <div
              role="group"
              aria-label="Filtrar asistentes por estado"
              className="flex flex-wrap items-center gap-2"
            >
              {(
                [
                  { id: "todos", label: "Todos", conteo: total },
                  { id: "confirmada", label: "Confirmados", conteo: confirmadas },
                  { id: "adelanto", label: "Con Adelanto", conteo: adelantos },
                  { id: "vencidos", label: "Plazos Vencidos", conteo: vencidos },
                  { id: "asistio", label: "Ingresaron", conteo: asistieron },
                  { id: "pendiente_ingreso", label: "Por Ingresar", conteo: pendientesIngreso },
                ] as const
              ).map((f) => {
                const activo = filtro === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => setFiltro(f.id)}
                    className={cn(
                      "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/30 cursor-pointer",
                      activo
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-muted"
                    )}
                  >
                    <span>{f.label}</span>
                    <span
                      className={cn(
                        "tabular-nums text-xs",
                        activo ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}
                    >
                      ({f.conteo})
                    </span>
                  </button>
                );
              })}

              {/* Botón para resetear filtros */}
              {hayFiltrosActivos && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setBusqueda("");
                    setFiltro("todos");
                  }}
                  className="h-10 px-3 text-muted-foreground hover:text-foreground"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabla de Asistentes usando shadcn Card */}
      <Card className="gap-0 py-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-heading">Asistentes Inscritos</h2>
            <span
              aria-live="polite"
              className="bg-muted text-muted-foreground rounded-full px-3.5 py-1 text-xs font-semibold tabular-nums whitespace-nowrap shrink-0"
            >
              Mostrando {asistentesFiltrados.length} de {listaAsistentes.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ModalExportarContactos
              tituloModulo={`Taller: ${tallerNombre}`}
              tipo="taller"
              contactos={contactosParaExportar}
              contactosFiltradosTabla={contactosFiltradosParaExportar}
              onMarcarExportados={async (ids) => {
                const res = await marcarReservasContactosExportadosAction(ids);
                if (res.ok) {
                  const ahoraIso = new Date().toISOString();
                  setListaAsistentes((prev) =>
                    prev.map((a) =>
                      ids.includes(a.id)
                        ? { ...a, contacto_exportado_en: ahoraIso }
                        : a
                    )
                  );
                  router.refresh();
                }
                return res;
              }}
            />

            <BotonExportarTablaExcel
              nombreArchivo={`asistentes-${tallerNombre
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "") || "taller"}`}
              titulo={`AMORELO — ASISTENTES: ${tallerNombre.toUpperCase()}`}
              subtitulo={`Padrón de Asistentes y Control de Puerta • Exportado el ${new Date().toLocaleDateString("es-PE")}`}
              nombreHoja="Asistentes"
              totalFiltrados={asistentesFiltrados.length}
              columnas={[
                { header: "Ticket", key: "ticket_codigo", width: 14, align: "center" },
                { header: "Asistente", key: "asistente", width: 28, align: "left" },
                { header: "Documento", key: "documento", width: 16, align: "center" },
                { header: "Teléfono / WhatsApp", key: "telefono", width: 18, align: "center" },
                { header: "Correo Electrónico", key: "correo", width: 28, align: "left" },
                { header: "N° Orden", key: "numero_orden", width: 14, align: "center" },
                { header: "Canal", key: "canal", width: 14, align: "center" },
                { header: "Precio Total", key: "total", width: 15, isCurrency: true },
                { header: "Monto Pagado", key: "monto_pagado", width: 15, isCurrency: true },
                { header: "Saldo Pendiente", key: "saldo_pendiente", width: 15, isCurrency: true },
                { header: "Estado de Pago", key: "estado_pago", width: 18, align: "center" },
                { header: "Fecha Límite Saldo", key: "fecha_limite", width: 18, align: "center" },
                { header: "Asistencia en Puerta", key: "asistencia", width: 18, align: "center" },
                { header: "Hora de Ingreso", key: "asistencia_fecha", width: 20, align: "center" },
              ]}
              obtenerFilas={() =>
                asistentesFiltrados.map((a) => {
                  const ep = calcularEstadoPago(a);
                  let fechaIngresoStr = "-";
                  const fechaIngresoRaw = a.asistencia_marcada_en || a.validado_en;
                  if (a.asistio && fechaIngresoRaw) {
                    try {
                      fechaIngresoStr = new Date(fechaIngresoRaw).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                    } catch {
                      fechaIngresoStr = fechaIngresoRaw;
                    }
                  }

                  return {
                    ticket_codigo: a.ticket_codigo || "-",
                    asistente: `${a.nombres || ""} ${a.apellidos || ""}`.trim() || "-",
                    documento: a.numero_documento || "-",
                    telefono: a.telefono || "-",
                    correo: a.correo || "-",
                    numero_orden: a.numero_orden ? `#${a.numero_orden}` : "-",
                    canal: a.canal === "whatsapp" ? "WhatsApp" : "Web / MP",
                    total: Number(a.total || 0),
                    monto_pagado: Number(a.monto_pagado || 0),
                    saldo_pendiente: Number(a.saldo_pendiente || 0),
                    estado_pago: ep.label,
                    fecha_limite: a.fecha_limite_saldo ? formatearFechaLimite(a.fecha_limite_saldo) : "-",
                    asistencia: a.asistio ? "Asistió" : "Pendiente",
                    asistencia_fecha: fechaIngresoStr,
                  };
                })
              }
              obtenerTotal={(filas) => {
                const sumaTotal = filas.reduce((acc, f) => acc + Number(f.total || 0), 0);
                const sumaPagado = filas.reduce((acc, f) => acc + Number(f.monto_pagado || 0), 0);
                const sumaSaldo = filas.reduce((acc, f) => acc + Number(f.saldo_pendiente || 0), 0);
                const sumaAsistieron = filas.filter((f) => f.asistencia === "Asistió").length;
                return {
                  labelColSpan: 7,
                  label: "TOTALES",
                  valores: {
                    total: sumaTotal,
                    monto_pagado: sumaPagado,
                    saldo_pendiente: sumaSaldo,
                    asistencia: `${sumaAsistieron} / ${filas.length}`,
                  },
                };
              }}
            />
          </div>
        </div>

        {asistentesFiltrados.length === 0 ? (
          <div className="flex h-36 flex-col items-center justify-center gap-1.5 p-6 text-center text-muted-foreground">
            <Users className="size-8 opacity-40 text-icon-accent" />
            <p className="text-sm font-medium">No se encontraron asistentes para los criterios seleccionados.</p>
          </div>
        ) : (
          <>
            {/* VISTA 1: TABLA PARA PANTALLAS GRANDES (md en adelante) */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-5 w-24 text-center">Ticket</TableHead>
                    <TableHead className="px-4">Asistente</TableHead>
                    <TableHead className="px-4">Contacto</TableHead>
                    <TableHead className="px-4">Estado Pago</TableHead>
                    <TableHead className="px-4 text-center">Asistencia en Puerta</TableHead>
                    <TableHead className="px-5 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {asistentesFiltrados.map((a) => {
                    const estadoPago = calcularEstadoPago(a);
                    const esVencida = a.estado === "vencida";

                    return (
                      <TableRow key={a.id} className={cn(esVencida && "opacity-75 bg-muted/20")}>
                        {/* Código Ticket */}
                        <TableCell className="px-5 py-4 text-center font-mono font-bold text-icon-accent">
                          {a.ticket_codigo}
                        </TableCell>

                        {/* Asistente */}
                        <TableCell className="px-4">
                          <div className="font-bold text-heading text-sm">
                            {a.nombres} {a.apellidos}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {a.numero_documento ? `DNI: ${a.numero_documento}` : a.numero_orden}
                          </div>
                        </TableCell>

                        {/* Contacto */}
                        <TableCell className="px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-medium text-foreground">
                              {a.telefono || "Sin celular"}
                            </span>
                            {a.telefono && (
                              a.contacto_exportado_en ? (
                                <span
                                  className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 px-1.5 py-0.5 text-[9px] font-bold"
                                  title={`Agendado en celular el ${new Date(a.contacto_exportado_en).toLocaleDateString("es-PE")}`}
                                >
                                  <CheckCircle2 className="size-2.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>Agendado</span>
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 px-1.5 py-0.5 text-[9px] font-bold"
                                  title="Pendiente de agendar en tu celular"
                                >
                                  <Clock className="size-2.5 text-amber-600 dark:text-amber-400" />
                                  <span>Sin agendar</span>
                                </span>
                              )
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                            {a.correo}
                          </div>
                        </TableCell>

                        {/* Estado de Pago con Alto Contraste */}
                        <TableCell className="px-4">
                          <div className="flex flex-col gap-1.5 items-start">
                            <Badge
                              className={cn(
                                "font-extrabold text-[11px] px-2.5 py-0.5 border shadow-2xs gap-1",
                                estadoPago.badgeClass
                              )}
                            >
                              {estadoPago.tipo === "plazo_vencido" && (
                                <AlertCircle className="size-3 text-rose-800 dark:text-rose-200" />
                              )}
                              {estadoPago.tipo === "vence_pronto" && (
                                <Clock className="size-3 text-amber-900 dark:text-amber-200" />
                              )}
                              <span>{estadoPago.label}</span>
                            </Badge>

                            {/* Detalles monetarios y límite */}
                            {a.saldo_pendiente > 0 && !esVencida && (
                              <div className="flex flex-col gap-0.5 text-[11px]">
                                <div className="flex items-center gap-1.5 font-bold">
                                  <span className="text-muted-foreground text-[10px] font-medium">Resta:</span>
                                  <span className="text-rose-600 dark:text-rose-400 font-extrabold bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                                    S/ {a.saldo_pendiente.toFixed(2)}
                                  </span>
                                </div>
                                {a.fecha_limite_saldo && (
                                  <span className="text-[10px] text-muted-foreground font-medium">
                                    Límite: <strong className="text-foreground">{formatearFechaLimite(a.fecha_limite_saldo)}</strong>
                                  </span>
                                )}
                              </div>
                            )}

                            {esVencida && (
                              <span className="text-[10px] text-muted-foreground font-medium">
                                Adelanto retenido: S/ {a.monto_pagado.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Asistencia en Puerta */}
                        <TableCell className="px-4 text-center">
                          <Button
                            size="sm"
                            variant={a.asistio ? "default" : "outline"}
                            disabled={isPending || esVencida}
                            onClick={() => handleToggleAsistencia(a)}
                            title={esVencida ? "Cupo liberado por vencimiento" : undefined}
                            className={`h-7 rounded-full px-3 text-xs font-bold gap-1.5 transition-colors cursor-pointer ${
                              a.asistio
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                                : "border-border text-foreground hover:bg-muted"
                            }`}
                          >
                            {a.asistio ? (
                              <>
                                <UserCheck className="size-3.5" />
                                Ingresó
                              </>
                            ) : (
                              <>
                                <UserX className="size-3.5 text-muted-foreground" />
                                {esVencida ? "Sin Cupo" : "Marcar Entrada"}
                              </>
                            )}
                          </Button>
                        </TableCell>

                        {/* Acciones */}
                        <TableCell className="px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* WhatsApp */}
                            {a.telefono && (
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleAbrirWhatsApp(a)}
                                className="size-8 rounded-full border border-slate-300 bg-slate-100 text-emerald-600 shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400 dark:hover:bg-slate-700 cursor-pointer"
                                title="Enviar Notificación por WhatsApp"
                              >
                                <WhatsappIcon className="size-4" />
                              </Button>
                            )}

                            {/* Copiar Enlace */}
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleCopiarEnlace(a.token_acceso, a.id)}
                              className="size-8 rounded-full border border-slate-300 bg-slate-100 text-icon-accent shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 cursor-pointer"
                              title="Copiar enlace del ticket"
                            >
                              {copiadoId === a.id ? (
                                <Check className="size-4 text-emerald-600" />
                              ) : (
                                <Copy className="size-4" />
                              )}
                            </Button>

                            {/* Ver Ticket */}
                            <Button
                              size="icon"
                              variant="outline"
                              nativeButton={false}
                              render={
                                <Link
                                  href={`/t/${a.token_acceso}`}
                                  target="_blank"
                                  title="Abrir ticket digital"
                                >
                                  <ExternalLink className="size-4" />
                                </Link>
                              }
                              className="size-8 rounded-full border border-slate-300 bg-slate-100 text-icon-accent shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 cursor-pointer"
                            />

                            {/* Menú de Gestión de Saldo / Plazo (solo si la reserva tiene saldo y no está vencida) */}
                            {a.saldo_pendiente > 0 && !esVencida && (
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="size-8 rounded-full border border-slate-300 bg-slate-100 text-icon-accent shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 cursor-pointer"
                                      title="Gestionar Saldo / Plazo"
                                    >
                                      <MoreVertical className="size-4" />
                                    </Button>
                                  }
                                />
                                <DropdownMenuContent align="end" className="w-52">
                                  {a.saldo_pendiente > 0 && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setReservaParaLiquidar(a);
                                        setCanalLiquidacion("yape");
                                        setNotasLiquidacion("");
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <DollarSign className="size-4 text-emerald-600 dark:text-emerald-400 mr-2" />
                                      <span>Liquidar Saldo</span>
                                    </DropdownMenuItem>
                                  )}

                                  <DropdownMenuItem
                                    onClick={() => {
                                      setReservaParaExtender(a);
                                      setNuevaFechaLimite(
                                        a.fecha_limite_saldo
                                          ? a.fecha_limite_saldo.split("T")[0]
                                          : new Date().toISOString().split("T")[0]
                                      );
                                      setErrorExtender("");
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <CalendarPlus className="size-4 text-blue-600 dark:text-blue-400 mr-2" />
                                    <span>Extender Plazo</span>
                                  </DropdownMenuItem>

                                  {!esVencida && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        variant="destructive"
                                        onClick={() => {
                                          setReservaParaLiberar(a);
                                          setMotivoLiberacion("");
                                        }}
                                        className="cursor-pointer"
                                      >
                                        <UserMinus className="size-4 mr-2" />
                                        <span>Liberar Cupo</span>
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* VISTA 2: TARJETAS EN MÓVIL (0% Scroll Horizontal) */}
            <div className="flex flex-col gap-3 p-4 md:hidden border-t">
              {asistentesFiltrados.map((a) => {
                const estadoPago = calcularEstadoPago(a);
                const esVencida = a.estado === "vencida";

                return (
                  <div
                    key={a.id}
                    className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-2xs transition-colors ${
                      a.asistio
                        ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/10"
                        : esVencida
                        ? "border-border/60 bg-muted/20 opacity-80"
                        : "border-border/80 bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-icon-accent-soft text-icon-accent">
                          {a.ticket_codigo}
                        </span>
                        <h4 className="font-bold text-sm text-heading mt-1">
                          {a.nombres} {a.apellidos}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {a.numero_documento ? `DNI: ${a.numero_documento}` : a.numero_orden}
                        </p>
                        {a.telefono && (
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className="text-xs font-medium text-foreground">{a.telefono}</span>
                            {a.contacto_exportado_en ? (
                              <span
                                className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 px-1.5 py-0.5 text-[9px] font-bold"
                                title={`Agendado el ${new Date(a.contacto_exportado_en).toLocaleDateString("es-PE")}`}
                              >
                                <CheckCircle2 className="size-2.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Agendado</span>
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 px-1.5 py-0.5 text-[9px] font-bold"
                                title="Pendiente de agendar en tu celular"
                              >
                                <Clock className="size-2.5 text-amber-600 dark:text-amber-400" />
                                <span>Sin agendar</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Badge Asistencia */}
                      {a.asistio ? (
                        <Badge className="bg-emerald-600 text-white font-bold text-xs gap-1 shrink-0">
                          <CheckCircle2 className="size-3" />
                          Asistió
                        </Badge>
                      ) : esVencida ? (
                        <Badge variant="outline" className="text-rose-600 border-rose-300 dark:text-rose-400 text-xs shrink-0">
                          Cupo Vencido
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-xs shrink-0">
                          Sin ingresar
                        </Badge>
                      )}
                    </div>

                    {/* Pago y Saldo en móvil */}
                    <div className="py-2.5 border-y border-border/60 flex flex-col gap-2 text-xs">
                      <div className="flex flex-wrap justify-between items-center gap-1.5">
                        <span className="text-muted-foreground font-medium">Estado Pago:</span>
                        <Badge
                          className={cn(
                            "font-extrabold text-[11px] px-2.5 py-0.5 border shadow-2xs gap-1",
                            estadoPago.badgeClass
                          )}
                        >
                          {estadoPago.tipo === "plazo_vencido" && (
                            <AlertCircle className="size-3 text-rose-800 dark:text-rose-200" />
                          )}
                          {estadoPago.tipo === "vence_pronto" && (
                            <Clock className="size-3 text-amber-900 dark:text-amber-200" />
                          )}
                          <span>{estadoPago.label}</span>
                        </Badge>
                      </div>

                      {a.saldo_pendiente > 0 && !esVencida && (
                        <div className="flex justify-between items-center text-[11px] bg-muted/40 p-2 rounded-xl">
                          <span className="text-muted-foreground font-medium">Resta por pagar:</span>
                          <span className="font-extrabold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            S/ {a.saldo_pendiente.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {a.fecha_limite_saldo && a.saldo_pendiente > 0 && !esVencida && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-muted-foreground">Fecha límite:</span>
                          <span className="font-bold text-foreground">
                            {formatearFechaLimite(a.fecha_limite_saldo)}
                          </span>
                        </div>
                      )}

                      {esVencida && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-muted-foreground">Adelanto retenido:</span>
                          <span className="font-bold text-foreground">
                            S/ {a.monto_pagado.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Fila de Acciones de Saldo en móvil (solo si tiene saldo y no está vencida) */}
                    {a.saldo_pendiente > 0 && !esVencida && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-0.5">
                        {a.saldo_pendiente > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReservaParaLiquidar(a);
                              setCanalLiquidacion("yape");
                              setNotasLiquidacion("");
                            }}
                            className="h-8 text-xs font-bold text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 cursor-pointer gap-1"
                          >
                            <DollarSign className="size-3.5" />
                            Liquidar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReservaParaExtender(a);
                            setNuevaFechaLimite(
                              a.fecha_limite_saldo
                                ? a.fecha_limite_saldo.split("T")[0]
                                : new Date().toISOString().split("T")[0]
                            );
                            setErrorExtender("");
                          }}
                          className="h-8 text-xs font-bold text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800 cursor-pointer gap-1"
                        >
                          <CalendarPlus className="size-3.5" />
                          Extender
                        </Button>
                        {!esVencida && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReservaParaLiberar(a);
                              setMotivoLiberacion("");
                            }}
                            className="h-8 text-xs font-bold text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 cursor-pointer gap-1 col-span-2 sm:col-span-1"
                          >
                            <UserMinus className="size-3.5" />
                            Liberar
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Botones de Acción Móvil */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
                      {/* Botón Principal: Entrada / Registro */}
                      <Button
                        size="sm"
                        variant={a.asistio ? "default" : "outline"}
                        disabled={isPending || esVencida}
                        onClick={() => handleToggleAsistencia(a)}
                        className={`w-full h-10 rounded-full text-xs font-bold cursor-pointer ${
                          a.asistio
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "border-border"
                        }`}
                      >
                        {a.asistio
                          ? "✓ Ingreso Registrado"
                          : esVencida
                          ? "Cupo Liberado (Sin Acceso)"
                          : "Marcar Entrada"}
                      </Button>

                      {/* Fila Inferior: Los 3 botones centrados y agrandados en móvil */}
                      <div className="flex items-center justify-center gap-3.5 pt-1">
                        {a.telefono && (
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleAbrirWhatsApp(a)}
                            className="size-11 shrink-0 rounded-full border border-slate-300 bg-slate-100 text-emerald-600 shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400 dark:hover:bg-slate-700 cursor-pointer"
                            title="Enviar Notificación por WhatsApp"
                          >
                            <WhatsappIcon className="size-5" />
                          </Button>
                        )}

                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleCopiarEnlace(a.token_acceso, a.id)}
                          className="size-11 shrink-0 rounded-full border border-slate-300 bg-slate-100 text-icon-accent shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 cursor-pointer"
                          title="Copiar enlace del ticket"
                        >
                          {copiadoId === a.id ? (
                            <Check className="size-5 text-emerald-600" />
                          ) : (
                            <Copy className="size-5" />
                          )}
                        </Button>

                        <Button
                          size="icon"
                          variant="outline"
                          nativeButton={false}
                          render={
                            <Link
                              href={`/t/${a.token_acceso}`}
                              target="_blank"
                              title="Abrir ticket digital"
                            >
                              <ExternalLink className="size-5" />
                            </Link>
                          }
                          className="size-11 shrink-0 rounded-full border border-slate-300 bg-slate-100 text-icon-accent shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* MODAL 1: LIQUIDAR SALDO RESTANTE */}
      <Dialog
        open={Boolean(reservaParaLiquidar)}
        onOpenChange={(abierto) => {
          if (!abierto) setReservaParaLiquidar(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
              <DollarSign className="size-4" />
              <span>LIQUIDAR SALDO PENDIENTE</span>
            </div>
            <DialogTitle className="text-lg font-black text-heading">
              Confirmar Pago de Saldo
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Registrar la cancelación del saldo pendiente para confirmar el cupo al 100%.
            </DialogDescription>
          </DialogHeader>

          {reservaParaLiquidar && (
            <div className="space-y-4 py-2">
              <div className="rounded-2xl bg-muted/40 p-3.5 border border-border/40 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Asistente:</span>
                  <span className="font-bold text-foreground">
                    {reservaParaLiquidar.nombres} {reservaParaLiquidar.apellidos}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Código de Ticket:</span>
                  <span className="font-mono font-bold text-icon-accent">
                    {reservaParaLiquidar.ticket_codigo}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Taller:</span>
                  <span className="font-bold text-foreground">
                    S/ {reservaParaLiquidar.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Adelanto Registrado:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    S/ {reservaParaLiquidar.monto_pagado.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-border pt-2 text-sm">
                  <span className="font-black text-heading">Monto a Liquidar:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                    S/ {reservaParaLiquidar.saldo_pendiente.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-heading mb-1.5 block">
                  Canal de Pago del Saldo
                </Label>
                <Select
                  value={canalLiquidacion}
                  items={[
                    { value: "yape", label: "Yape / Plin" },
                    { value: "transferencia", label: "Transferencia Bancaria" },
                    { value: "efectivo", label: "Efectivo en Puerta" },
                    { value: "whatsapp", label: "Coordinado por WhatsApp" },
                  ]}
                  onValueChange={(val: any) => setCanalLiquidacion(val)}
                >
                  <SelectTrigger className="h-10 text-sm font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yape">Yape / Plin</SelectItem>
                    <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                    <SelectItem value="efectivo">Efectivo en Puerta</SelectItem>
                    <SelectItem value="whatsapp">Coordinado por WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-bold text-heading mb-1.5 block">
                  Notas de Liquidación (Opcional)
                </Label>
                <Input
                  value={notasLiquidacion}
                  onChange={(e) => setNotasLiquidacion(e.target.value)}
                  placeholder="Ej: Pago verificado por voucher de Yape"
                  className="h-9 text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setReservaParaLiquidar(null)}
              disabled={isPending}
              className="cursor-pointer font-bold"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarLiquidarSaldo}
              disabled={isPending}
              className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            >
              {isPending
                ? "Procesando..."
                : `Liquidar S/ ${reservaParaLiquidar?.saldo_pendiente.toFixed(2)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: EXTENDER PLAZO DE FECHA LÍMITE */}
      <Dialog
        open={Boolean(reservaParaExtender)}
        onOpenChange={(abierto) => {
          if (!abierto) setReservaParaExtender(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
              <CalendarPlus className="size-4" />
              <span>EXTENDER PLAZO DE SALDO</span>
            </div>
            <DialogTitle className="text-lg font-black text-heading">
              Nueva Fecha Límite de Pago
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Otorga más días al asistente para cancelar su saldo pendiente sin perder el cupo.
            </DialogDescription>
          </DialogHeader>

          {reservaParaExtender && (
            <div className="space-y-4 py-2">
              <div className="rounded-2xl bg-muted/40 p-3.5 border border-border/40 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Asistente:</span>
                  <span className="font-bold text-foreground">
                    {reservaParaExtender.nombres} {reservaParaExtender.apellidos}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Saldo Restante:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    S/ {reservaParaExtender.saldo_pendiente.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Fecha Límite Anterior:</span>
                  <span className="font-bold text-foreground">
                    {formatearFechaLimite(reservaParaExtender.fecha_limite_saldo)}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-heading mb-1.5 block">
                  Seleccionar Nueva Fecha Límite *
                </Label>
                <DatePicker
                  value={nuevaFechaLimite}
                  onChange={(val) => {
                    setNuevaFechaLimite(val);
                    setErrorExtender("");
                  }}
                  placeholder="Seleccionar nueva fecha..."
                />
                {errorExtender && (
                  <p className="text-destructive mt-1.5 text-xs font-semibold">
                    {errorExtender}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setReservaParaExtender(null)}
              disabled={isPending}
              className="cursor-pointer font-bold"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarExtenderPlazo}
              disabled={isPending}
              className="font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            >
              {isPending ? "Guardando..." : "Actualizar Plazo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: CONFIRMACIÓN DE LIBERAR CUPO */}
      <AlertDialog
        open={Boolean(reservaParaLiberar)}
        onOpenChange={(abierto) => {
          if (!abierto) setReservaParaLiberar(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-black text-heading flex items-center gap-2">
              <UserMinus className="size-5 text-rose-600 dark:text-rose-400" />
              <span>¿Liberar cupo por falta de pago?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Esta acción marcará la reserva de{" "}
              <strong className="text-foreground">
                {reservaParaLiberar?.nombres} {reservaParaLiberar?.apellidos}
              </strong>{" "}
              como <strong>vencida</strong> y liberará inmediatamente 1 cupo para el aforo
              disponible del taller. El adelanto abonado de{" "}
              <strong>S/ {reservaParaLiberar?.monto_pagado.toFixed(2)}</strong> quedará retenido
              según las políticas de reserva.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-2">
            <Label className="text-xs font-bold text-heading mb-1.5 block">
              Motivo o Detalle (Opcional)
            </Label>
            <Input
              value={motivoLiberacion}
              onChange={(e) => setMotivoLiberacion(e.target.value)}
              placeholder="Ej: Plazo de pago vencido sin respuesta del asistente"
              className="h-9 text-xs"
            />
          </div>

          <AlertDialogFooter className="flex sm:justify-end gap-2">
            <AlertDialogCancel
              disabled={isPending}
              onClick={() => setReservaParaLiberar(null)}
              className="cursor-pointer font-bold"
            >
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={handleConfirmarLiberarCupo}
              className="font-bold cursor-pointer"
            >
              {isPending ? "Liberando..." : "Sí, liberar cupo"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
