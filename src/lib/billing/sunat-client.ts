// Fase 4 — Cliente de la API externa de facturación electrónica SUNAT.
// Responsabilidad: emitir boleta/factura/nota de crédito, descargar PDF/XML/CDR
// y consultar estado. La emisión es asíncrona para no bloquear la compra (plan §15).
// TODO(Fase 4): implementar emisión y reintentos (next_retry_at) usando
// BILLING_API_URL y BILLING_API_TOKEN (plan §13, Fase 4).

export {};
