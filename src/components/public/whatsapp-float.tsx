// Fase 1 — Botón flotante de WhatsApp. Se monta en src/app/(public)/layout.tsx
// y cubre todas las páginas del grupo público.
//
// La librería abre un chatbox simulado y al enviar redirige a
// https://api.whatsapp.com/send/?phone=…, así que el número vive en
// siteConfig.whatsapp (ver src/lib/config/site.ts).
//
// Detalles de implementación:
// - ssr:false: el bundle inyecta sus estilos en <head> al importarse; se carga
//   además de forma diferida porque trae un avatar base64 (~319 kB en dev).
// - El <div> que hace de botón en la librería viene con aria-hidden, tabIndex
//   ausente y onClick, es decir inaccesible por teclado y por lector de
//   pantalla (WCAG 2.1.1 y 4.1.2). Se añade un enlace real, enfocable y
//   visible solo con foco, que apunta al mismo destino de WhatsApp.
// - BUG DE LA LIBRERÍA: allowClickAway registra un listener en `document` que
//   cierra el chatbox sin mirar el destino. El onClick del chatbox intenta
//   frenar el evento con stopPropagation(), pero React delega en `document`,
//   o sea que ese stopPropagation corre DESPUÉS en el mismo nodo y no afecta
//   a los listeners que siguen: el chatbox se cerraba con solo hacer clic
//   dentro (imposible escribir). Se corta el evento para los listeners
//   posteriores con stopImmediatePropagation(), dejando pasar a React.

"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { siteConfig } from "@/lib/config/site";

const FloatingWhatsApp = dynamic(
  () =>
    import("react-floating-whatsapp").then((mod) => mod.FloatingWhatsApp),
  { ssr: false },
);

const CHATBOX_SELECTOR = ".floating-whatsapp-chatbox";

export function WhatsAppFloat() {
  const { phoneNumber, statusMessage, chatMessage, placeholder } =
    siteConfig.whatsapp;

  useEffect(() => {
    const stopChatboxClicks = (event: Event) => {
      const { target } = event;
      if (target instanceof Element && target.closest(CHATBOX_SELECTOR)) {
        event.stopImmediatePropagation();
      }
    };

    document.addEventListener("click", stopChatboxClicks);

    return () => {
      document.removeEventListener("click", stopChatboxClicks);
    };
  }, []);

  const digits = phoneNumber.replace(/\D/g, "");

  if (!digits) return null;

  return (
    <>
      <FloatingWhatsApp
        phoneNumber={digits}
        accountName={siteConfig.name}
        avatar="/images/eventos/3.webp"
        statusMessage={statusMessage}
        chatMessage={chatMessage}
        placeholder={placeholder}
        allowClickAway
        allowEsc
      />
      <a
        href={`https://wa.me/${digits}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-brand hover:bg-brand/90 pointer-events-none fixed top-4 left-4 z-[9999] rounded-full px-4 py-2 text-sm font-semibold text-white opacity-0 shadow-lg transition-opacity focus:pointer-events-auto focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring/50"
      >
        Escríbenos por WhatsApp
      </a>
    </>
  );
}
