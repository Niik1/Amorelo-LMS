// Presentación del módulo de cupones: formato de valores, vigencia, usos y
// filtros. Funciones puras y con "ahora" explícito para poder testearlas.

import type { FilaCupon } from "@/lib/cupones/tipos";

const ZONA_LIMA = "America/Lima";

const FECHA = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: ZONA_LIMA,
});

const NUMERO = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 });

/**
 * "30%" o "12.5%". El formato "S/ 15" queda solo para cupones históricos de
 * monto fijo: el panel ya no permite crearlos ni editarlos.
 */
export function formatearDescuento(
  tipo: string,
  valor: number | string,
): string {
  const numero = NUMERO.format(Number(valor));
  return tipo === "porcentaje" ? `${numero}%` : `S/ ${numero}`;
}

export function formatoDescuento(fila: FilaCupon) {
  return formatearDescuento(fila.tipo_descuento, fila.valor_descuento);
}

/** "30 nov. 2026" en hora de Lima. */
export function fechaLima(iso: string) {
  return FECHA.format(new Date(iso));
}

export type VigenciaVista = {
  texto: string;
  /** Tiene alguna fecha: se muestra como chip, no como texto apagado. */
  conFecha: boolean;
  /** Rango completo para el tooltip; null si no hay fechas. */
  titulo: string | null;
};

export function textoVigencia(fila: FilaCupon): VigenciaVista {
  const desde = fila.valido_desde ? fechaLima(fila.valido_desde) : null;
  const hasta = fila.valido_hasta ? fechaLima(fila.valido_hasta) : null;

  if (hasta) {
    return {
      texto: `Hasta ${hasta}`,
      conFecha: true,
      titulo: desde ? `Desde ${desde} hasta ${hasta}` : `Vence el ${hasta}`,
    };
  }
  if (desde) {
    return {
      texto: `Desde ${desde}`,
      conFecha: true,
      titulo: `Válido desde el ${desde}`,
    };
  }
  return { texto: "Sin fecha", conFecha: false, titulo: null };
}

export type UsosVista = {
  texto: string;
  /** Nota al lado del número cuando no hay tope. */
  detalle: string | null;
  /** 0–100, o null si el cupón no tiene límite. */
  porcentaje: number | null;
  agotado: boolean;
};

export function estadoUsos(fila: FilaCupon): UsosVista {
  const usados = fila.usos_actuales;
  if (fila.usos_maximos === null) {
    return {
      texto: String(usados),
      detalle: "Sin límite",
      porcentaje: null,
      agotado: false,
    };
  }
  const tope = fila.usos_maximos;
  return {
    texto: `${usados} / ${tope}`,
    detalle: null,
    porcentaje: tope > 0 ? Math.min(100, Math.round((usados / tope) * 100)) : 100,
    agotado: usados >= tope,
  };
}

/** Un cupón sin fechas está siempre vigente. */
export function esVigente(fila: FilaCupon, ahora: number) {
  const desde = fila.valido_desde ? new Date(fila.valido_desde).getTime() : null;
  const hasta = fila.valido_hasta ? new Date(fila.valido_hasta).getTime() : null;
  if (desde !== null && desde > ahora) return false;
  if (hasta !== null && hasta < ahora) return false;
  return true;
}

export function estaVencido(fila: FilaCupon, ahora: number) {
  return (
    fila.valido_hasta !== null &&
    new Date(fila.valido_hasta).getTime() < ahora
  );
}

export function sinFecha(fila: FilaCupon) {
  return !fila.valido_desde && !fila.valido_hasta;
}

// === Filtros ===

export type Filtros = {
  q: string;
  estado: "todos" | "activos" | "inactivos";
  /** "monto_fijo" se conserva para filtrar cupones históricos. */
  tipo: "todos" | "porcentaje" | "monto_fijo";
  vigencia: "cualquiera" | "vigentes" | "vencidos" | "sin_fecha";
  usos: "todos" | "con_limite" | "sin_limite" | "agotados";
};

export const FILTROS_VACIOS: Filtros = {
  q: "",
  estado: "todos",
  tipo: "todos",
  vigencia: "cualquiera",
  usos: "todos",
};

export function hayFiltros(f: Filtros) {
  return (
    f.q.trim() !== "" ||
    f.estado !== "todos" ||
    f.tipo !== "todos" ||
    f.vigencia !== "cualquiera" ||
    f.usos !== "todos"
  );
}

export function filtrarCupones(
  filas: FilaCupon[],
  f: Filtros,
  ahora: number,
): FilaCupon[] {
  const q = f.q.trim().toUpperCase();

  return filas.filter((fila) => {
    if (q && !fila.codigo.toUpperCase().includes(q)) return false;
    if (f.estado === "activos" && !fila.activo) return false;
    if (f.estado === "inactivos" && fila.activo) return false;
    if (f.tipo !== "todos" && fila.tipo_descuento !== f.tipo) return false;
    if (f.vigencia === "vigentes" && !esVigente(fila, ahora)) return false;
    if (f.vigencia === "vencidos" && !estaVencido(fila, ahora)) return false;
    if (f.vigencia === "sin_fecha" && !sinFecha(fila)) return false;
    if (f.usos === "con_limite" && fila.usos_maximos === null) return false;
    if (f.usos === "sin_limite" && fila.usos_maximos !== null) return false;
    if (
      f.usos === "agotados" &&
      !(fila.usos_maximos !== null && fila.usos_actuales >= fila.usos_maximos)
    ) {
      return false;
    }
    return true;
  });
}

export function contarPorEstado(filas: FilaCupon[]) {
  const activos = filas.filter((f) => f.activo).length;
  return { todos: filas.length, activos, inactivos: filas.length - activos };
}
