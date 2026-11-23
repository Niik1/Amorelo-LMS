// Fase 0 — Configuración del sitio (constantes compartidas: nombre, descripción, URL).
// TODO(Fase 1): definir la marca definitiva y los textos del sitio.
// TODO(Fase 8): ampliar con metadatos SEO, Open Graph y datos estructurados schema.org.

// La ruta /inscripciones se eliminó: toda inscripción va por WhatsApp.
const WHATSAPP_NUMERO = "+51 945729551";
const WHATSAPP_DIGITOS = WHATSAPP_NUMERO.replace(/\D/g, "");

/** Arma un link de WhatsApp con el texto ya codificado. */
export function whatsappUrl(texto: string) {
  return `https://wa.me/${WHATSAPP_DIGITOS}?text=${encodeURIComponent(texto)}`;
}

/** Mensaje de respaldo cuando no hay cupón de oferta vigente. */
export const MENSAJE_INSCRIPCION =
  "Hola, quiero inscribirme en la MasterClass de Amorelo.";

/** Link de inscripción por WhatsApp (reemplaza a /inscripciones). */
export const INSCRIPCION_WHATSAPP_URL = whatsappUrl(MENSAJE_INSCRIPCION);

export type NavLink = {
  label: string;
  href: string;
  badge?: string;
};

export const siteConfig = {
  name: "Amorelo",
  description:
    "Web corporativa para la venta de la masterclass de decoración, globos y lettering.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  // Navegación principal: solo Inicio y Certificados
  navLinks: [
    { label: "Inicio", href: "/#inicio" },
    { label: "Certificados", href: "/verificar" },
  ] as const,
  cta: { label: "Inscribirme", href: INSCRIPCION_WHATSAPP_URL },
  // Botón flotante de WhatsApp (react-floating-whatsapp). phoneNumber en
  // formato internacional sin "+", ej. 51987654321. El componente lo normaliza
  // igualmente quitando todo lo que no sea dígito, así que se puede pegar el
  // número tal cual ("+51 969906609").
  whatsapp: {
    phoneNumber: WHATSAPP_NUMERO,
    statusMessage: "Respondemos en minutos",
    chatMessage: "¡Hola! ¿Tienes dudas sobre la masterclass? Escríbenos.",
    placeholder: "Escribe tu mensaje…",
  },
} as const;
