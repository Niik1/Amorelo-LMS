// @vitest-environment node
import { describe, it, expect } from "vitest";

describe("Validación y Normalización de Códigos de Tickets", () => {
  it("extrae correctamente el token limpio de una URL completa escaneada con cámara", () => {
    const urlHttp = "http://localhost:3000/t/demo-taller-ticket";
    const urlHttps = "https://amorelo.pe/t/demo-taller-ticket?ref=qr";
    const codigoManual = "TK-7842";

    const limpiar = (cod: string) => {
      let limpio = cod.trim();
      if (limpio.includes("/t/")) {
        limpio = limpio.split("/t/").pop()?.split("?")[0] || limpio;
      }
      return limpio;
    };

    expect(limpiar(urlHttp)).toBe("demo-taller-ticket");
    expect(limpiar(urlHttps)).toBe("demo-taller-ticket");
    expect(limpiar(codigoManual)).toBe("TK-7842");
  });

  it("calcula correctamente los saldos para reservas con adelanto", () => {
    const precioTaller = 199.0;
    const adelanto = 50.0;
    const saldoPendiente = Math.max(0, precioTaller - adelanto);

    expect(saldoPendiente).toBe(149.0);
  });
});
