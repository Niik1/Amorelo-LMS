// Fase 3 — Servicio de pagos.
// Responsabilidad: crear el pago en el proveedor (Mercado Pago / PayPal), recibir
// el webhook, verificarlo contra la API, registrar la fila en payments y completar
// la orden con mark_order_paid() (idempotente). La reconciliación del cron usa el
// mismo camino (plan §6.3).
// TODO(Fase 3): implementar (Fase 5 para PayPal).

export {};
