import { describe, expect, it } from "vitest";
import {
  calcularPrecio,
  formatearMoneda,
  redondear2,
} from "@/lib/precios/calculo";

describe("calcularPrecio", () => {
  it("aplica el descuento porcentual de la oferta normal y live", () => {
    expect(calcularPrecio(300, { tipo: "porcentaje", valor: 30 })).toBe(210);
    expect(calcularPrecio(300, { tipo: "porcentaje", valor: 67 })).toBe(99);
    expect(calcularPrecio(95, { tipo: "porcentaje", valor: 30 })).toBe(66.5);
    expect(calcularPrecio(95, { tipo: "porcentaje", valor: 67 })).toBe(31.35);
  });

  it("sin descuento devuelve el precio de lista", () => {
    expect(calcularPrecio(300, null)).toBe(300);
    expect(calcularPrecio(300, undefined)).toBe(300);
    expect(calcularPrecio(300, { tipo: "porcentaje", valor: 0 })).toBe(300);
  });

  it("soporta montos fijos y nunca baja de cero", () => {
    expect(calcularPrecio(300, { tipo: "monto_fijo", valor: 50 })).toBe(250);
    expect(calcularPrecio(30, { tipo: "monto_fijo", valor: 50 })).toBe(0);
  });

  it("redondea a dos decimales", () => {
    expect(redondear2(99.999)).toBe(100);
    expect(calcularPrecio(95, { tipo: "porcentaje", valor: 33 })).toBe(63.65);
  });

  it("devuelve cero con un precio de lista inválido", () => {
    expect(calcularPrecio(Number.NaN, null)).toBe(0);
    expect(calcularPrecio(-10, null)).toBe(0);
  });
});

describe("formatearMoneda", () => {
  it("formatea soles y dólares con dos decimales", () => {
    expect(formatearMoneda(210, "PEN")).toContain("210");
    expect(formatearMoneda(66.5, "USD")).toContain("66.5");
  });
});
