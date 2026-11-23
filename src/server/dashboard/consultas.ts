import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type DashboardPeriodo = "hoy" | "7d" | "mes" | "30d" | "total" | "personalizado";

export interface DashboardMetrics {
  kpis: {
    // Compatibilidad y unificación
    ingresosMesPen: number;
    ingresosMesUsd: number;
    ordenesPagadas: number;
    totalOrdenesCreadas: number;
    ticketPromedio: number;
    matriculasActivas: number;
    alumnosNuevosMes: number;
    tasaConversion: number;
    comprobantesPendientes: number;

    // Métricas avanzadas del periodo seleccionado
    ingresosTotalPen: number;
    ingresosTotalUsd: number;
    ingresosVirtual: number;
    ingresosPresencial: number;
    pctVirtual: number;
    pctPresencial: number;
    crecimientoIngresosPct: number | null;
    ticketPromedioVirtual: number;
    ticketPromedioPresencial: number;
    montoPendiente: number;
    ordenesPendientes: number;
    matriculasNuevasPeriodo: number;
    ocupacionTalleres: {
      cuposTotales: number;
      cuposOcupados: number;
      porcentaje: number;
      talleresActivosCount: number;
    };
    periodo: DashboardPeriodo;
    periodoEtiqueta: string;
    periodoBadge: string;
  };
  charts: {
    // Gráfico de evolución en el tiempo desglosado (Cursos vs Talleres)
    revenueOverTime: Array<{
      fecha: string;
      ingresos: number;
      ingresosVirtual: number;
      ingresosPresencial: number;
      ordenes: number;
    }>;
    revenue30Days: Array<{ fecha: string; ingresos: number; ordenes: number }>;
    revenue12Months: Array<{ fecha: string; ingresos: number; ordenes: number }>;
    virtualVsPresencial: Array<{
      tipo: string;
      nombre: string;
      ingresos: number;
      ordenesCount: number;
      porcentaje: number;
      color: string;
    }>;
    topProducts: Array<{
      item: string;
      tipo: string;
      ingresos: number;
      unidades: number;
    }>;
    talleresOcupacionList: Array<{
      id: string;
      nombre: string;
      fecha: string;
      cuposTotales: number;
      ocupados: number;
      disponibles: number;
      porcentaje: number;
      estado: string;
    }>;
    orderStatus: Array<{
      estado: string;
      label: string;
      cantidad: number;
      monto: number;
      porcentaje: number;
      color: string;
    }>;
  };
}

const MESES_ES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Set", "Oct", "Nov", "Dic"
];

const MESES_COMPLETOS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const ESTADOS_MAP: Record<string, { label: string; color: string }> = {
  pagada: { label: "Pagadas", color: "#16a34a" },
  parcial: { label: "Con Adelanto", color: "#0ea5e9" },
  pendiente: { label: "Pendientes", color: "#f59e0b" },
  expirada: { label: "Expiradas", color: "#94a3b8" },
  cancelada: { label: "Canceladas", color: "#ef4444" },
  fallida: { label: "Fallidas", color: "#dc2626" },
  vencida: { label: "Vencidas", color: "#64748b" },
  reembolsada: { label: "Reembolsadas", color: "#a855f7" },
};

interface RangoFechas {
  clave: DashboardPeriodo;
  etiqueta: string;
  badge: string;
  inicio: Date;
  fin: Date;
  inicioAnterior: Date | null;
  finAnterior: Date | null;
}

function calcularRangoPeriodo(
  periodo: DashboardPeriodo,
  desde?: string,
  hasta?: string
): RangoFechas {
  const ahora = new Date();
  const fin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);

  if (periodo === "personalizado") {
    let inicio: Date;
    let finPersonalizado: Date;

    if (desde) {
      const [yD, mD, dD] = desde.split("-").map(Number);
      inicio = new Date(yD, mD - 1, dD, 0, 0, 0, 0);
    } else {
      // Por defecto: 30 días atrás
      inicio = new Date(ahora);
      inicio.setDate(inicio.getDate() - 29);
      inicio.setHours(0, 0, 0, 0);
    }

    if (hasta) {
      const [yH, mH, dH] = hasta.split("-").map(Number);
      finPersonalizado = new Date(yH, mH - 1, dH, 23, 59, 59, 999);
    } else {
      finPersonalizado = fin;
    }

    const diffMs = Math.max(86400000, finPersonalizado.getTime() - inicio.getTime());
    const inicioAnt = new Date(inicio.getTime() - diffMs);
    const finAnt = new Date(inicio.getTime() - 1);

    const fFormat = (d: Date) => `${d.getDate()} ${MESES_ES[d.getMonth()]}`;
    const etiqueta = `${fFormat(inicio)} - ${fFormat(finPersonalizado)}`;

    return {
      clave: "personalizado",
      etiqueta: `Rango: ${etiqueta}`,
      badge: etiqueta,
      inicio,
      fin: finPersonalizado,
      inicioAnterior: inicioAnt,
      finAnterior: finAnt,
    };
  }

  if (periodo === "hoy") {
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
    const inicioAnt = new Date(inicio);
    inicioAnt.setDate(inicioAnt.getDate() - 1);
    const finAnt = new Date(inicioAnt);
    finAnt.setHours(23, 59, 59, 999);

    return {
      clave: "hoy",
      etiqueta: "Hoy",
      badge: "Jornada actual",
      inicio,
      fin,
      inicioAnterior: inicioAnt,
      finAnterior: finAnt,
    };
  }

  if (periodo === "7d") {
    const inicio = new Date(ahora);
    inicio.setDate(inicio.getDate() - 6);
    inicio.setHours(0, 0, 0, 0);

    const inicioAnt = new Date(inicio);
    inicioAnt.setDate(inicioAnt.getDate() - 7);
    const finAnt = new Date(inicio);
    finAnt.setMilliseconds(-1);

    return {
      clave: "7d",
      etiqueta: "Últimos 7 días",
      badge: "Semana móvil",
      inicio,
      fin,
      inicioAnterior: inicioAnt,
      finAnterior: finAnt,
    };
  }

  if (periodo === "mes") {
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0);
    const nombreMes = MESES_COMPLETOS[ahora.getMonth()];

    const inicioAnt = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1, 0, 0, 0, 0);
    const finAnt = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59, 999);

    return {
      clave: "mes",
      etiqueta: `Este Mes (${nombreMes})`,
      badge: `Mes de ${nombreMes}`,
      inicio,
      fin,
      inicioAnterior: inicioAnt,
      finAnterior: finAnt,
    };
  }

  if (periodo === "total") {
    return {
      clave: "total",
      etiqueta: "Histórico Total",
      badge: "Acumulado histórico",
      inicio: new Date(2020, 0, 1, 0, 0, 0, 0),
      fin,
      inicioAnterior: null,
      finAnterior: null,
    };
  }

  // Por defecto: 30 días
  const inicio = new Date(ahora);
  inicio.setDate(inicio.getDate() - 29);
  inicio.setHours(0, 0, 0, 0);

  const inicioAnt = new Date(inicio);
  inicioAnt.setDate(inicioAnt.getDate() - 30);
  const finAnt = new Date(inicio);
  finAnt.setMilliseconds(-1);

  return {
    clave: "30d",
    etiqueta: "Últimos 30 días",
    badge: "Periodo 30 días",
    inicio,
    fin,
    inicioAnterior: inicioAnt,
    finAnterior: finAnt,
  };
}

export async function obtenerMetricasDashboard(
  periodo: DashboardPeriodo = "30d",
  desde?: string,
  hasta?: string
): Promise<DashboardMetrics> {
  const admin = createAdminClient();
  const rango = calcularRangoPeriodo(periodo, desde, hasta);
  const ahora = new Date();

  // 1. Consultas concurrentes a Supabase
  const [
    { data: ordenesRaw },
    { data: itemsRaw },
    { data: matriculasRaw },
    { count: comprobantesPendientes },
    { data: talleresRaw },
    { data: ocupacionRaw },
  ] = await Promise.all([
    (admin.from("ordenes") as any)
      .select("id, total, moneda, estado, tipo_orden, cupon_id, monto_descuento, creado_en, pagada_en")
      .order("creado_en", { ascending: true }),

    (admin.from("orden_items") as any)
      .select("id, orden_id, descripcion, tipo_item, cantidad, subtotal, precio_unitario"),

    (admin.from("matriculas") as any)
      .select("id, estado, otorgada_en, vence_en"),

    (admin.from("comprobantes") as any)
      .select("*", { count: "exact", head: true })
      .in("estado", ["pendiente_emision", "error"]),

    (admin.from("talleres") as any)
      .select("id, nombre, fecha_inicio, cupos_totales, estado, precio_pen")
      .order("fecha_inicio", { ascending: true }),

    (admin.from("v_talleres_ocupacion") as any)
      .select("id, cupos_totales, ocupados, disponibles, confirmadas, con_adelanto"),
  ]);

  const ordenes = ordenesRaw ?? [];
  const ordenItems = itemsRaw ?? [];
  const matriculas = matriculasRaw ?? [];
  const talleres = talleresRaw ?? [];
  const ocupacion = ocupacionRaw ?? [];

  // Mapear ocupación de talleres
  const ocupacionMap = new Map<string, any>(
    ocupacion.map((o: any) => [o.id, o])
  );

  // --- CÁLCULO DE KPIS UNIFICADOS POR PERIODO ---
  let ingresosTotalPen = 0;
  let ingresosTotalUsd = 0;
  let ingresosVirtual = 0;
  let ingresosPresencial = 0;
  let ordenesPagadasCount = 0;
  let ordenesVirtual = 0;
  let ordenesPresencial = 0;

  let totalOrdenesCreadasPeriodo = 0;
  let ordenesPendientesCobro = 0;
  let montoPendienteCobro = 0;

  let ingresosPreviosPen = 0;

  // Set de IDs de órdenes pagadas en el periodo actual
  const ordenesPagadasPeriodoIds = new Set<string>();

  for (const o of ordenes) {
    const fechaPago = new Date(o.pagada_en || o.creado_en);
    const fechaCreacion = new Date(o.creado_en);
    const monto = Number(o.total || 0);

    // Órdenes creadas en el periodo
    if (fechaCreacion >= rango.inicio && fechaCreacion <= rango.fin) {
      totalOrdenesCreadasPeriodo++;
      if (o.estado === "pendiente" || o.estado === "parcial") {
        ordenesPendientesCobro++;
        montoPendienteCobro += monto;
      }
    }

    // Órdenes pagadas en el periodo seleccionado
    if (o.estado === "pagada" && fechaPago >= rango.inicio && fechaPago <= rango.fin) {
      ordenesPagadasPeriodoIds.add(o.id);
      ordenesPagadasCount++;

      if (o.moneda === "USD") {
        ingresosTotalUsd += monto;
      } else {
        ingresosTotalPen += monto;
      }

      if (o.tipo_orden === "curso") {
        ingresosVirtual += monto;
        ordenesVirtual++;
      } else {
        ingresosPresencial += monto;
        ordenesPresencial++;
      }
    }

    // Comparativa con periodo anterior
    if (
      rango.inicioAnterior &&
      rango.finAnterior &&
      o.estado === "pagada" &&
      fechaPago >= rango.inicioAnterior &&
      fechaPago <= rango.finAnterior
    ) {
      if (o.moneda !== "USD") {
        ingresosPreviosPen += monto;
      }
    }
  }

  // Porcentajes de Virtual vs Presencial
  const totalFormatos = ingresosVirtual + ingresosPresencial;
  const pctVirtual = totalFormatos > 0 ? Math.round((ingresosVirtual / totalFormatos) * 100) : 0;
  const pctPresencial = totalFormatos > 0 ? 100 - pctVirtual : 0;

  // Crecimiento porcentual vs periodo anterior
  let crecimientoIngresosPct: number | null = null;
  if (rango.inicioAnterior && rango.finAnterior) {
    if (ingresosPreviosPen > 0) {
      crecimientoIngresosPct = Number(
        (((ingresosTotalPen - ingresosPreviosPen) / ingresosPreviosPen) * 100).toFixed(1)
      );
    } else if (ingresosTotalPen > 0) {
      crecimientoIngresosPct = 100;
    } else {
      crecimientoIngresosPct = 0;
    }
  }

  // Tickets Promedio
  const ticketPromedio = ordenesPagadasCount > 0
    ? Number((ingresosTotalPen / ordenesPagadasCount).toFixed(2))
    : 0;

  const ticketPromedioVirtual = ordenesVirtual > 0
    ? Number((ingresosVirtual / ordenesVirtual).toFixed(2))
    : 0;

  const ticketPromedioPresencial = ordenesPresencial > 0
    ? Number((ingresosPresencial / ordenesPresencial).toFixed(2))
    : 0;

  // Tasa de Conversión
  const tasaConversion = totalOrdenesCreadasPeriodo > 0
    ? Number(((ordenesPagadasCount / totalOrdenesCreadasPeriodo) * 100).toFixed(1))
    : 0;

  // Matrículas en el periodo
  const matriculasActivas = matriculas.filter((m: any) => m.estado === "activa").length;
  const matriculasNuevasPeriodo = matriculas.filter((m: any) => {
    const f = new Date(m.otorgada_en);
    return f >= rango.inicio && f <= rango.fin;
  }).length;

  // Ocupación de Talleres Presenciales
  let cuposTotalesTalleres = 0;
  let cuposOcupadosTalleres = 0;
  let talleresActivosCount = 0;

  const talleresOcupacionList = talleres.map((t: any) => {
    const o = ocupacionMap.get(t.id) || {};
    const cupos = Number(t.cupos_totales || 0);
    const ocupados = Number(o.ocupados || 0);
    const disponibles = Number(o.disponibles ?? Math.max(0, cupos - ocupados));
    const porcentaje = cupos > 0 ? Math.round((ocupados / cupos) * 100) : 0;

    const esActivo = t.estado === "publicado" || t.estado === "preventa";
    if (esActivo) {
      talleresActivosCount++;
      cuposTotalesTalleres += cupos;
      cuposOcupadosTalleres += ocupados;
    }

    return {
      id: t.id,
      nombre: t.nombre,
      fecha: t.fecha_inicio,
      cuposTotales: cupos,
      ocupados,
      disponibles,
      porcentaje,
      estado: t.estado,
    };
  });

  const porcentajeOcupacionGlobal = cuposTotalesTalleres > 0
    ? Math.round((cuposOcupadosTalleres / cuposTotalesTalleres) * 100)
    : 0;

  // --- CÁLCULO DE GRÁFICOS SINCRONIZADOS ---

  // A. Línea de tiempo según el periodo (Desglose apilado Cursos + Talleres)
  const timelineMap = new Map<
    string,
    { ingresos: number; ingresosVirtual: number; ingresosPresencial: number; ordenes: number }
  >();

  if (periodo === "hoy") {
    // Franjas horarias de 4 horas
    const slots = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];
    for (const s of slots) {
      timelineMap.set(s, { ingresos: 0, ingresosVirtual: 0, ingresosPresencial: 0, ordenes: 0 });
    }
  } else if (periodo === "7d") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(ahora);
      d.setDate(d.getDate() - i);
      const clave = `${String(d.getDate()).padStart(2, "0")} ${MESES_ES[d.getMonth()]}`;
      timelineMap.set(clave, { ingresos: 0, ingresosVirtual: 0, ingresosPresencial: 0, ordenes: 0 });
    }
  } else if (periodo === "mes") {
    const ultimoDia = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
    for (let dia = 1; dia <= ultimoDia; dia++) {
      const clave = `${String(dia).padStart(2, "0")} ${MESES_ES[ahora.getMonth()]}`;
      timelineMap.set(clave, { ingresos: 0, ingresosVirtual: 0, ingresosPresencial: 0, ordenes: 0 });
    }
  } else if (periodo === "total") {
    // 12 meses históricos
    for (let i = 11; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const clave = `${MESES_ES[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
      timelineMap.set(clave, { ingresos: 0, ingresosVirtual: 0, ingresosPresencial: 0, ordenes: 0 });
    }
  } else if (periodo === "personalizado") {
    // Generar TODOS los días del rango seleccionado día por día
    const dCursor = new Date(rango.inicio);
    dCursor.setHours(0, 0, 0, 0);
    const finDia = new Date(rango.fin);
    finDia.setHours(23, 59, 59, 999);

    while (dCursor <= finDia) {
      const clave = `${String(dCursor.getDate()).padStart(2, "0")} ${MESES_ES[dCursor.getMonth()]}`;
      timelineMap.set(clave, { ingresos: 0, ingresosVirtual: 0, ingresosPresencial: 0, ordenes: 0 });
      dCursor.setDate(dCursor.getDate() + 1);
    }
  } else {
    // 30 días
    for (let i = 29; i >= 0; i--) {
      const d = new Date(ahora);
      d.setDate(d.getDate() - i);
      const clave = `${String(d.getDate()).padStart(2, "0")} ${MESES_ES[d.getMonth()]}`;
      timelineMap.set(clave, { ingresos: 0, ingresosVirtual: 0, ingresosPresencial: 0, ordenes: 0 });
    }
  }

  // Poblar línea de tiempo
  for (const o of ordenes) {
    if (o.estado === "pagada") {
      const f = new Date(o.pagada_en || o.creado_en);
      if (f >= rango.inicio && f <= rango.fin) {
        let clave = "";
        if (periodo === "hoy") {
          const hora = f.getHours();
          const bloque = Math.floor(hora / 4) * 4;
          clave = `${String(bloque).padStart(2, "0")}:00`;
        } else if (periodo === "total") {
          clave = `${MESES_ES[f.getMonth()]} ${String(f.getFullYear()).slice(-2)}`;
        } else {
          // Para 7d, 30d, mes y personalizado: agrupar por DÍA EXACTO
          clave = `${String(f.getDate()).padStart(2, "0")} ${MESES_ES[f.getMonth()]}`;
        }

        const entrada = timelineMap.get(clave);
        if (entrada) {
          const monto = Number(o.total || 0);
          entrada.ingresos += monto;
          entrada.ordenes += 1;
          if (o.tipo_orden === "curso") {
            entrada.ingresosVirtual += monto;
          } else {
            entrada.ingresosPresencial += monto;
          }
        }
      }
    }
  }

  const revenueOverTime = Array.from(timelineMap.entries()).map(([fecha, datos]) => ({
    fecha,
    ingresos: datos.ingresos,
    ingresosVirtual: datos.ingresosVirtual,
    ingresosPresencial: datos.ingresosPresencial,
    ordenes: datos.ordenes,
  }));

  // Compatibilidad: Líneas de 30 días y 12 meses
  const mapa30Dias = new Map<string, { ingresos: number; ordenes: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(ahora);
    d.setDate(d.getDate() - i);
    mapa30Dias.set(`${String(d.getDate()).padStart(2, "0")} ${MESES_ES[d.getMonth()]}`, { ingresos: 0, ordenes: 0 });
  }
  const mapa12Meses = new Map<string, { ingresos: number; ordenes: number }>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    mapa12Meses.set(`${MESES_ES[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`, { ingresos: 0, ordenes: 0 });
  }

  const hace30 = new Date(ahora);
  hace30.setDate(hace30.getDate() - 30);
  for (const o of ordenes) {
    if (o.estado === "pagada") {
      const f = new Date(o.pagada_en || o.creado_en);
      const monto = Number(o.total || 0);
      if (f >= hace30) {
        const c30 = `${String(f.getDate()).padStart(2, "0")} ${MESES_ES[f.getMonth()]}`;
        const e30 = mapa30Dias.get(c30);
        if (e30) {
          e30.ingresos += monto;
          e30.ordenes += 1;
        }
      }
      const c12 = `${MESES_ES[f.getMonth()]} ${String(f.getFullYear()).slice(-2)}`;
      const e12 = mapa12Meses.get(c12);
      if (e12) {
        e12.ingresos += monto;
        e12.ordenes += 1;
      }
    }
  }

  const revenue30Days = Array.from(mapa30Dias.entries()).map(([fecha, d]) => ({ fecha, ...d }));
  const revenue12Months = Array.from(mapa12Meses.entries()).map(([fecha, d]) => ({ fecha, ...d }));

  // B. Virtual vs Presencial (SINCRONIZADO CON EL PERIODO SELECCIONADO)
  const virtualVsPresencial = [
    {
      tipo: "virtual",
      nombre: "Cursos Virtuales",
      ingresos: ingresosVirtual,
      ordenesCount: ordenesVirtual,
      porcentaje: pctVirtual,
      color: "#1e3a8a",
    },
    {
      tipo: "presencial",
      nombre: "Talleres Presenciales",
      ingresos: ingresosPresencial,
      ordenesCount: ordenesPresencial,
      porcentaje: pctPresencial,
      color: "#14b8a6",
    },
  ];

  // C. Top Productos Más Vendidos
  // Si el periodo actual tiene órdenes pagadas, calcularlo del periodo; si no, del histórico para dar valor visual
  const targetOrderIds = ordenesPagadasPeriodoIds.size > 0
    ? ordenesPagadasPeriodoIds
    : new Set(ordenes.filter((o: any) => o.estado === "pagada").map((o: any) => o.id));

  const productosMap = new Map<string, { tipo: string; ingresos: number; unidades: number }>();

  for (const item of ordenItems) {
    if (targetOrderIds.has(item.orden_id)) {
      const nombre = item.descripcion || "Producto sin nombre";
      const tipo = item.tipo_item === "curso" ? "Curso Virtual" : "Taller Presencial";
      const actual = productosMap.get(nombre) || { tipo, ingresos: 0, unidades: 0 };
      actual.ingresos += Number(item.subtotal || 0);
      actual.unidades += Number(item.cantidad || 1);
      productosMap.set(nombre, actual);
    }
  }

  const topProducts = Array.from(productosMap.entries())
    .map(([item, d]) => ({
      item,
      tipo: d.tipo,
      ingresos: d.ingresos,
      unidades: d.unidades,
    }))
    .sort((a, b) => b.ingresos - a.ingresos)
    .slice(0, 5);

  // D. Estados de Órdenes en el periodo
  const estadosMap = new Map<string, { cantidad: number; monto: number }>();
  for (const o of ordenes) {
    const f = new Date(o.creado_en);
    if (f >= rango.inicio && f <= rango.fin) {
      const est = o.estado || "pendiente";
      const monto = Number(o.total || 0);
      const actual = estadosMap.get(est) || { cantidad: 0, monto: 0 };
      actual.cantidad += 1;
      actual.monto += monto;
      estadosMap.set(est, actual);
    }
  }

  // Si no hay órdenes creadas en este periodo pero sí histórico, mostrar histórico para la tabla
  const ordenesParaTabla = estadosMap.size > 0
    ? estadosMap
    : (() => {
        const historicoMap = new Map<string, { cantidad: number; monto: number }>();
        for (const o of ordenes) {
          const est = o.estado || "pendiente";
          const monto = Number(o.total || 0);
          const actual = historicoMap.get(est) || { cantidad: 0, monto: 0 };
          actual.cantidad += 1;
          actual.monto += monto;
          historicoMap.set(est, actual);
        }
        return historicoMap;
      })();

  const totalParaPorcentaje = Array.from(ordenesParaTabla.values()).reduce((a, b) => a + b.cantidad, 0);

  const orderStatus = Array.from(ordenesParaTabla.entries())
    .map(([estado, val]) => {
      const meta = ESTADOS_MAP[estado] ?? { label: estado, color: "#64748b" };
      const pct = totalParaPorcentaje > 0 ? Math.round((val.cantidad / totalParaPorcentaje) * 100) : 0;
      return {
        estado,
        label: meta.label,
        cantidad: val.cantidad,
        monto: val.monto,
        porcentaje: pct,
        color: meta.color,
      };
    })
    .sort((a, b) => b.cantidad - a.cantidad);

  return {
    kpis: {
      // Compatibilidad
      ingresosMesPen: ingresosTotalPen,
      ingresosMesUsd: ingresosTotalUsd,
      ordenesPagadas: ordenesPagadasCount,
      totalOrdenesCreadas: totalOrdenesCreadasPeriodo || ordenes.length,
      ticketPromedio,
      matriculasActivas: matriculasActivas || matriculas.length,
      alumnosNuevosMes: matriculasNuevasPeriodo,
      tasaConversion,
      comprobantesPendientes: comprobantesPendientes ?? 0,

      // Métricas avanzadas
      ingresosTotalPen,
      ingresosTotalUsd,
      ingresosVirtual,
      ingresosPresencial,
      pctVirtual,
      pctPresencial,
      crecimientoIngresosPct,
      ticketPromedioVirtual,
      ticketPromedioPresencial,
      montoPendiente: montoPendienteCobro,
      ordenesPendientes: ordenesPendientesCobro,
      matriculasNuevasPeriodo,
      ocupacionTalleres: {
        cuposTotales: cuposTotalesTalleres,
        cuposOcupados: cuposOcupadosTalleres,
        porcentaje: porcentajeOcupacionGlobal,
        talleresActivosCount,
      },
      periodo: rango.clave,
      periodoEtiqueta: rango.etiqueta,
      periodoBadge: rango.badge,
    },
    charts: {
      revenueOverTime,
      revenue30Days,
      revenue12Months,
      virtualVsPresencial,
      topProducts,
      talleresOcupacionList,
      orderStatus,
    },
  };
}
