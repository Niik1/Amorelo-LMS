import { describe, expect, it } from "vitest";
import type { FilaCupon } from "@/lib/cupones/tipos";
import {
  contarPorEstado,
  estadoUsos,
  esVigente,
  filtrarCupones,
  FILTROS_VACIOS,
  formatearDescuento,
  formatoDescuento,
  hayFiltros,
  textoVigencia,
} from "@/lib/cupones/vista";

const AHORA = new Date("2026-10-21T12:00:00Z").getTime();

function cupon(extra: Partial<FilaCupon> = {}): FilaCupon {
  return {
    id: "c1",
    codigo: "LIVE60",
    tipo_descuento: "porcentaje",
    valor_descuento: 60,
    valido_desde: null,
    valido_hasta: null,
    usos_maximos: 200,
    usos_actuales: 0,
    activo: true,
    creado_en: "2026-10-01T00:00:00Z",
    ...extra,
  };
}

describe("formatoDescuento", () => {
  it("agrega el símbolo según el tipo", () => {
    expect(formatoDescuento(cupon({ valor_descuento: 30 }))).toBe("30%");
    expect(
      formatoDescuento(
        cupon({ tipo_descuento: "monto_fijo", valor_descuento: 15 }),
      ),
    ).toBe("S/ 15");
  });

  it("conserva decimales", () => {
    expect(formatoDescuento(cupon({ valor_descuento: 12.5 }))).toBe("12.5%");
  });
});

describe("formatearDescuento", () => {
  it("formatea sin depender de una fila", () => {
    expect(formatearDescuento("porcentaje", 10)).toBe("10%");
    expect(formatearDescuento("monto_fijo", "15")).toBe("S/ 15");
  });
});

describe("textoVigencia", () => {
  it("usa el fin cuando existe", () => {
    const vista = textoVigencia(
      cupon({ valido_hasta: "2026-11-30T18:00:00Z" }),
    );
    expect(vista.conFecha).toBe(true);
    expect(vista.texto).toBe("Hasta 30 nov. 2026");
  });

  it("cae al inicio cuando no hay fin", () => {
    const vista = textoVigencia(
      cupon({ valido_desde: "2026-11-01T18:00:00Z" }),
    );
    expect(vista.texto).toBe("Desde 1 nov. 2026");
  });

  it("sin fechas no se muestra como chip", () => {
    expect(textoVigencia(cupon())).toEqual({
      texto: "Sin fecha",
      conFecha: false,
      titulo: null,
    });
  });
});

describe("estadoUsos", () => {
  it("calcula el porcentaje y marca agotado", () => {
    expect(estadoUsos(cupon({ usos_actuales: 0 }))).toMatchObject({
      texto: "0 / 200",
      porcentaje: 0,
      agotado: false,
    });
    expect(
      estadoUsos(cupon({ usos_actuales: 200, usos_maximos: 200 })),
    ).toMatchObject({ agotado: true, porcentaje: 100 });
  });

  it("sin tope no dibuja barra", () => {
    expect(estadoUsos(cupon({ usos_maximos: null, usos_actuales: 7 }))).toEqual(
      { texto: "7", detalle: "Sin límite", porcentaje: null, agotado: false },
    );
  });
});

describe("esVigente", () => {
  it("sin fechas siempre está vigente", () => {
    expect(esVigente(cupon(), AHORA)).toBe(true);
  });

  it("respeta el rango", () => {
    expect(
      esVigente(cupon({ valido_hasta: "2026-10-01T00:00:00Z" }), AHORA),
    ).toBe(false);
    expect(
      esVigente(cupon({ valido_desde: "2026-12-01T00:00:00Z" }), AHORA),
    ).toBe(false);
  });
});

describe("filtrarCupones", () => {
  const filas = [
    cupon({ id: "a", codigo: "OFERTA30", valor_descuento: 30 }),
    cupon({ id: "b", codigo: "LIVE60" }),
    cupon({
      id: "c",
      codigo: "VENCIDO10",
      activo: false,
      usos_actuales: 100,
      usos_maximos: 100,
      valido_hasta: "2026-01-01T00:00:00Z",
    }),
    cupon({
      id: "d",
      codigo: "MONTO5",
      tipo_descuento: "monto_fijo",
      valor_descuento: 5,
      usos_maximos: null,
    }),
  ];

  it("busca por código sin importar mayúsculas", () => {
    const r = filtrarCupones(filas, { ...FILTROS_VACIOS, q: "live" }, AHORA);
    expect(r.map((f) => f.codigo)).toEqual(["LIVE60"]);
  });

  it("filtra por estado", () => {
    expect(
      filtrarCupones(filas, { ...FILTROS_VACIOS, estado: "inactivos" }, AHORA),
    ).toHaveLength(1);
    expect(
      filtrarCupones(filas, { ...FILTROS_VACIOS, estado: "activos" }, AHORA),
    ).toHaveLength(3);
  });

  it("filtra vencidos y agotados", () => {
    expect(
      filtrarCupones(filas, { ...FILTROS_VACIOS, vigencia: "vencidos" }, AHORA).map(
        (f) => f.codigo,
      ),
    ).toEqual(["VENCIDO10"]);
    expect(
      filtrarCupones(filas, { ...FILTROS_VACIOS, usos: "agotados" }, AHORA).map(
        (f) => f.codigo,
      ),
    ).toEqual(["VENCIDO10"]);
  });

  it("sin filtros devuelve todo", () => {
    expect(filtrarCupones(filas, FILTROS_VACIOS, AHORA)).toHaveLength(4);
  });
});

describe("hayFiltros y conteos", () => {
  it("detecta si hay algo aplicado", () => {
    expect(hayFiltros(FILTROS_VACIOS)).toBe(false);
    expect(hayFiltros({ ...FILTROS_VACIOS, q: "  " })).toBe(false);
    expect(hayFiltros({ ...FILTROS_VACIOS, estado: "activos" })).toBe(true);
  });

  it("cuenta activos e inactivos", () => {
    const filas = [cupon({ id: "1" }), cupon({ id: "2", activo: false })];
    expect(contarPorEstado(filas)).toEqual({
      todos: 2,
      activos: 1,
      inactivos: 1,
    });
  });
});
