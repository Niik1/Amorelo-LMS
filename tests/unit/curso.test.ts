import { describe, expect, it } from "vitest";
import { esquemaCurso } from "@/lib/validators/curso";

describe("esquemaCurso", () => {
  const base = {
    nombre: "Masterclass de decoración de globos",
    precio_pen: 300,
    activo: true,
  };

  it("acepta el curso y convierte los opcionales vacíos a undefined", () => {
    const r = esquemaCurso.safeParse({
      ...base,
      descripcion: "",
      imagen_url: "",
      precio_usd: "",
    });

    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.descripcion).toBeUndefined();
      expect(r.data.imagen_url).toBeUndefined();
      expect(r.data.precio_usd).toBeUndefined();
    }
  });

  it("convierte los precios enviados como texto", () => {
    const r = esquemaCurso.safeParse({
      ...base,
      precio_pen: "300",
      precio_usd: "95",
    });

    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.precio_pen).toBe(300);
      expect(r.data.precio_usd).toBe(95);
    }
  });

  it("rechaza un precio negativo", () => {
    expect(esquemaCurso.safeParse({ ...base, precio_pen: -1 }).success).toBe(
      false,
    );
  });

  it("rechaza una URL inválida", () => {
    expect(
      esquemaCurso.safeParse({ ...base, imagen_url: "no-es-url" }).success,
    ).toBe(false);
  });

  it("activa el curso por defecto", () => {
    const r = esquemaCurso.safeParse({
      nombre: base.nombre,
      precio_pen: base.precio_pen,
    });

    expect(r.success).toBe(true);
    if (r.success) expect(r.data.activo).toBe(true);
  });
});
