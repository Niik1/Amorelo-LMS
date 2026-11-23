import { expect, test } from "@playwright/test";

// Fase 0 — Smoke test mínimo para verificar la instalación de Playwright.
// TODO(Fase 9): flujos completos de compra — pago con/sin cupón, boleta y factura,
// doble clic en pagar, webhook duplicado/perdido, cupón agotado, edición llena
// y fallo de la API de facturación (plan §13, Fase 9).

test("la página de inicio responde 200", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
});
