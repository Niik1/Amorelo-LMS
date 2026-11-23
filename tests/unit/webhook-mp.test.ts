import { describe, expect, it, vi } from "vitest";
import crypto from "crypto";

vi.mock("server-only", () => ({}));

import { validarFirmaMercadoPago } from "@/server/checkout/webhook-mp";

describe("Webhook Mercado Pago - Validación Criptográfica x-signature", () => {
  const secretTest = "secret_key_amorelo_test_12345";
  const dataId = "1354396145";
  const requestId = "req-uuid-test-998877";
  const ts = "1742505638683";

  function generarFirmaValida(id: string, reqId: string, timestamp: string, secret: string) {
    const manifest = `id:${id.toLowerCase()};request-id:${reqId};ts:${timestamp};`;
    const v1 = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
    return `ts=${timestamp},v1=${v1}`;
  }

  it("acepta una firma criptográfica x-signature auténtica generada por Mercado Pago", () => {
    const signature = generarFirmaValida(dataId, requestId, ts, secretTest);
    const resultado = validarFirmaMercadoPago({
      xSignature: signature,
      xRequestId: requestId,
      dataId,
      secret: secretTest,
    });

    expect(resultado.valida).toBe(true);
    expect(resultado.razon).toBe("valida");
  });

  it("rechaza peticiones con firma alterada o clave secreta incorrecta", () => {
    const signature = generarFirmaValida(dataId, requestId, ts, "clave_falsa");
    const resultado = validarFirmaMercadoPago({
      xSignature: signature,
      xRequestId: requestId,
      dataId,
      secret: secretTest,
    });

    expect(resultado.valida).toBe(false);
    expect(resultado.razon).toBe("firma_hmac_no_coincide");
  });

  it("rechaza si falta el encabezado x-signature cuando hay secret configurado", () => {
    const resultado = validarFirmaMercadoPago({
      xSignature: null,
      xRequestId: requestId,
      dataId,
      secret: secretTest,
    });

    expect(resultado.valida).toBe(false);
    expect(resultado.razon).toBe("falta_encabezado_x_signature");
  });

  it("rechaza si el formato de x-signature no contiene ts o v1", () => {
    const resultado = validarFirmaMercadoPago({
      xSignature: "invalido=12345",
      xRequestId: requestId,
      dataId,
      secret: secretTest,
    });

    expect(resultado.valida).toBe(false);
    expect(resultado.razon).toBe("formato_x_signature_invalido");
  });

  it("permite omitir la validación si el secret no está configurado (modo dev/local)", () => {
    const resultado = validarFirmaMercadoPago({
      xSignature: null,
      xRequestId: null,
      dataId: null,
      secret: undefined,
    });

    expect(resultado.valida).toBe(true);
    expect(resultado.razon).toBe("secret_omitido_en_desarrollo");
  });
});
