// Fase 4 — Servicio de comprobantes electrónicos (boleta/factura SUNAT).
// Responsabilidad: emitir tras el pago de forma asíncrona, guardar PDF/XML/CDR en
// el bucket privado y gestionar reintentos (invoices.next_retry_at) sin duplicar
// comprobantes por orden (índice único, plan §12).
// TODO(Fase 4): implementar con src/lib/billing/sunat-client.ts.

export {};
