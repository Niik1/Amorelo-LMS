// Ancla de WhatsApp. No lleva el link final: apunta a nuestra ruta de
// redirección, que resuelve la oferta vigente en el momento del clic
// (plan-mvp §16). Así el mensaje nunca queda viejo aunque la landing
// lleve horas abierta. El clic se registra en esa misma petición.

"use client";

export type BotonClic = string;

export function CtaWhatsApp({
  boton,
  className,
  onClick,
  children,
}: {
  boton: BotonClic;
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={`/api/ir/whatsapp?boton=${boton}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={className}
    >
      {children}
    </a>
  );
}
