# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Principal:** aspirante a emprendedor en Perú que quiere aprender decoración, globos y lettering para cobrar por su cuenta. Llega desde TikTok Live (donde ve el producto en vivo y toma captura para contactar por WhatsApp) o desde tráfico orgánico/WhatsApp directo. Compra la masterclass de S/ 150.
- **Secundario:** aficionado que decora sus propios eventos sin fines comerciales. La comunicación se dirige primero al emprendedor.
- **Operador interno:** la emprendedora, como única administradora del panel. Sin registro público ni roles en el MVP.

## Product Purpose

Venta automatizada de la masterclass de decoración: 7 cursos dictados en 1–2 semanas intensivas por edición, con ~30 inscritos. Reemplaza el proceso 100% manual actual (cupón por WhatsApp, captura de pago, validación a mano, grupo manual) con compra, pago, comprobante SUNAT y confirmación automáticos.

**Éxito:** una venta real completada con comprobante aceptado por SUNAT, sin cobros sin comprobante, sin comprobantes duplicados ni cupos excedidos.

## Positioning

La misma oferta que se ve en el TikTok Live se compra sola en la web — cupón del live, pago con Mercado Pago (Perú) o PayPal (internacional), boleta/factura electrónica SUNAT y correo de confirmación sin intervención manual. El live es el canal de descubrimiento; la web es el canal de cierre.

## Operating Context

- Canal principal de captación: transmisiones TikTok Live con cupones compartidos en vivo; ruta corta `/live` desde el live.
- Cobro en soles (Mercado Pago) y en USD (PayPal, clientes internacionales).
- Facturación electrónica obligatoria ante SUNAT.
- Entrega del producto: enlace de Zoom por edición, enviado por correo; nunca visible desde el navegador.
- Producción: requiere planes de pago de hosting/basededatos, dominio y certificado digital SUNAT.
- Idioma de la interfaz: español (`lang="es"`).

## Capabilities and Constraints

**Capacidades del MVP**

- Web pública: inicio, cursos, nosotros, contacto y legales (términos, privacidad, devoluciones).
- Checkout con cupones; pago con Mercado Pago y PayPal; emisión de comprobante SUNAT y correo de confirmación automáticos.
- Panel de administración: dashboard, órdenes, clientes, cupones, comprobantes, ediciones y configuración.

**Restricciones**

- Precios y cupones se calculan solo en backend; nada sensible es legible desde el navegador.
- Una edición por orden. Configuración por cliente vía variables de entorno (el repo está diseñado para clonarse).
- Stack: Next.js + TypeScript + Tailwind + shadcn/ui, Supabase, Mercado Pago y PayPal, Resend. Detalle técnico en `ARCHITECTURE.md`.

**Fuera de alcance**

- Panel de alumnos (otro repositorio), roles/auditoría, email marketing, carrito multi-producto.

## Brand Commitments

- Marca: **Amorelo** (el valor en `src/lib/config/site.ts` aún es placeholder).
- Voz: cercana y motivadora de emprendimiento.
- CTA: "Quiero Emprender".
- Logo definitivo disponible.

## Evidence on Hand

- Imágenes hero en la raíz del repo: `hero-1280.png`, `hero-768.png`, `hero-360.png`, `hero-360-galeria.png`, `hero-composicion-final.png`.
- Contenido real confirmado por el usuario: testimonios de alumnos, fotos de trabajos/alumnos, foto/video del emprendedor, logo definitivo. **Rutas/archivos aún no identificados en el repo.**
- Plan completo y esquema SQL en `docs/`.
- Ausencias que no deben inventarse: precios, métricas o claims distintos de los del plan (S/ 150, ~30 inscritos/edición, 7 cursos); no fabricar testimonios ni logos si los archivos reales no aparecen.

## Product Principles

1. El dinero primero: toda lógica de precios, cupones y pagos vive en el backend; nada se confía al navegador.
2. Idempotencia ante todo: doble clic, webhook repetido o perdido nunca generan orden, comprobante ni cobro duplicado.
3. El live manda: la web cierra lo que el TikTok Live abre (cupón del live, ruta `/live`, prueba social real de alumnos).
4. Automatizar lo manual sin perder trazabilidad: cada venta deja orden, comprobante, correo y métrica.
5. El MVP es un corte, no una promesa: lo diferido (panel de alumnos, roles, auditoría) queda fuera sin ensuciar el diseño del sistema.
