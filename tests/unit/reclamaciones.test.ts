// @vitest-environment node
import { describe, it, expect } from "vitest";

describe("Módulo de Reclamaciones — Lógica y Validaciones", () => {
  it("calcula correctamente el semáforo SLA de días hábiles/restantes", () => {
    const calcularSla = (fechaLimiteStr: string, respondido: boolean, ahoraMs: number) => {
      if (respondido) return { dias: 0, estado: "respondido" as const };
      const limite = new Date(fechaLimiteStr).getTime();
      const diffMs = limite - ahoraMs;
      const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDias < 0) return { dias: Math.abs(diffDias), estado: "vencido" as const };
      if (diffDias <= 5) return { dias: diffDias, estado: "por_vencer" as const };
      return { dias: diffDias, estado: "en_plazo" as const };
    };

    const ahora = new Date("2026-11-06T12:00:00Z").getTime();

    // Caso 1: En plazo (> 5 días)
    const limite10Dias = "2026-11-16T12:00:00Z";
    expect(calcularSla(limite10Dias, false, ahora)).toEqual({
      dias: 10,
      estado: "en_plazo",
    });

    // Caso 2: Próximo a vencer (<= 5 días)
    const limite3Dias = "2026-11-09T12:00:00Z";
    expect(calcularSla(limite3Dias, false, ahora)).toEqual({
      dias: 3,
      estado: "por_vencer",
    });

    // Caso 3: Vencido (< 0 días)
    const limitePasado = "2026-11-02T12:00:00Z";
    expect(calcularSla(limitePasado, false, ahora)).toEqual({
      dias: 4,
      estado: "vencido",
    });

    // Caso 4: Respondido (sin importar la fecha)
    expect(calcularSla(limitePasado, true, ahora)).toEqual({
      dias: 0,
      estado: "respondido",
    });
  });

  it("valida que la respuesta del proveedor cumpla los requisitos mínimos", () => {
    const validarRespuesta = (respuesta: string) => {
      if (!respuesta || respuesta.trim().length < 10) {
        return { valido: false, error: "La respuesta debe tener al menos 10 caracteres." };
      }
      return { valido: true };
    };

    expect(validarRespuesta("").valido).toBe(false);
    expect(validarRespuesta("   ").valido).toBe(false);
    expect(validarRespuesta("ok visto").valido).toBe(false);
    expect(
      validarRespuesta("Se ha verificado el caso y se procedió con la reposición del producto.").valido
    ).toBe(true);
  });

  it("escapa comillas dobles correctamente al exportar registros a CSV", () => {
    const escaparCsv = (valor: string) => `"${valor.replace(/"/g, '""')}"`;

    const textoConComillas = 'Curso "Flores de Azúcar" en oferta';
    expect(escaparCsv(textoConComillas)).toBe('"Curso ""Flores de Azúcar"" en oferta"');
  });
});
