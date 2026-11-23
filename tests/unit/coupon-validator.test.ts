import { describe, expect, it } from "vitest";
import { esquemaCupon } from "@/lib/validators/coupon";

const BASE = {
  codigo: "OFERTA30",
  tipo_descuento: "porcentaje",
  valor_descuento: 30,
  oferta: "normal",
  mensaje_whatsapp: "Quiero el cupón {codigo} con {descuento} de descuento.",
};

describe("esquemaCupon", () => {
  it("acepta un porcentaje válido", () => {
    const resultado = esquemaCupon.safeParse(BASE);

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.tipo_descuento).toBe("porcentaje");
      expect(resultado.data.codigo).toBe("OFERTA30");
    }
  });

  it("rechaza un descuento de monto fijo", () => {
    const resultado = esquemaCupon.safeParse({
      ...BASE,
      tipo_descuento: "monto_fijo",
      valor_descuento: 15,
    });

    expect(resultado.success).toBe(false);
  });

  it("rechaza porcentajes mayores a 100", () => {
    const resultado = esquemaCupon.safeParse({
      ...BASE,
      valor_descuento: 101,
    });

    expect(resultado.success).toBe(false);
  });

  it("rechaza el placeholder {descuento} seguido de %", () => {
    const resultado = esquemaCupon.safeParse({
      ...BASE,
      mensaje_whatsapp: "Quiero el cupón {codigo} del {descuento}%.",
    });

    expect(resultado.success).toBe(false);
  });
});
