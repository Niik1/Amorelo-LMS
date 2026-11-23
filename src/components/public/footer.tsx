// Pie público estilo referencia: 3 columnas (navegación, suscripción por
// WhatsApp, contacto) sobre el azul del hero + barra gigante con AMORELO
// recortada abajo. Se monta en src/app/(public)/layout.tsx.

"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon, MailIcon, PhoneIcon } from "lucide-react";
import { SocialFacebookIcon } from "@/components/icons/social-facebook";
import { SocialInstagramIcon } from "@/components/icons/social-instagram";
import { SocialTiktokIcon } from "@/components/icons/social-tiktok";
import { siteConfig } from "@/lib/config/site";

const SOCIALS = [
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@eltallerdeamorelo",
    Icon: SocialTiktokIcon,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/eltallerdeamorelo/",
    Icon: SocialInstagramIcon,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/amorelo.peru",
    Icon: SocialFacebookIcon,
  },
] as const;

const SERVICE = [
  { label: "Política de privacidad" },
  { label: "Términos y condiciones" },
  { label: "Devoluciones" },
] as const;

function ColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-heading text-xl font-extrabold tracking-tight text-[var(--public-footer-text)]">
      {children}
    </p>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  const digits = siteConfig.whatsapp.phoneNumber.replace(/\D/g, "");
  const [email, setEmail] = useState("");

  const subscribe = (event: FormEvent) => {
    event.preventDefault();
    const text = encodeURIComponent(
      `Hola, quiero recibir las novedades de Amorelo. Mi correo es ${email}`,
    );
    window.open(`https://wa.me/${digits}?text=${text}`, "_blank");
  };

  return (
    <footer className="overflow-x-clip bg-[var(--public-footer-bg)] text-[var(--public-footer-text)] transition-colors duration-300">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 px-6 pt-14 sm:pt-16 md:grid-cols-[1fr_1.2fr_1fr] lg:max-w-[1400px]">
        {/* Col 1: navegación del sitio + Libro de Reclamaciones integrado. */}
        <nav aria-label="Mapa del sitio">
          <ColumnTitle>Navegación</ColumnTitle>
          <ul className="mt-5 flex flex-col gap-2.5">
            {siteConfig.navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm font-semibold text-[var(--public-footer-text-muted)] transition-colors hover:text-[var(--public-footer-text)] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Distintivo Oficial Libro de Reclamaciones debajo de navegación */}
          <div className="mt-7 pt-1">
            <Link
              href="/libro-de-reclamaciones"
              title="Libro de Reclamaciones Virtual"
              aria-label="Ir al Libro de Reclamaciones Virtual"
              className="group inline-flex items-center transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <Image
                src="/images/footer/reclamos.webp"
                alt="Libro de Reclamaciones Virtual"
                width={160}
                height={85}
                className="h-16 sm:h-20 w-auto object-contain transition-opacity group-hover:opacity-90"
              />
            </Link>
          </div>
        </nav>

        {/* Col 2: suscripción (abre WhatsApp, sin backend). */}
        <div>
          <ColumnTitle>Suscríbete</ColumnTitle>
          <p className="mt-3 text-sm leading-relaxed text-[var(--public-footer-text-muted)]">
            No te pierdas las novedades de Amorelo
          </p>
          <form
            onSubmit={subscribe}
            className="mt-5 flex items-center gap-2 rounded-full bg-[var(--public-footer-input-bg)] p-1.5 pl-5 transition-colors duration-300 shadow-sm"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Tu correo
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Tu correo"
              className="w-full bg-transparent text-sm font-semibold text-[var(--public-footer-input-text)] placeholder:text-[var(--public-footer-input-placeholder)] focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Suscribirme"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--public-footer-input-btn-bg)] text-[var(--public-footer-input-btn-text)] shadow-xs transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <ArrowRightIcon className="size-5" aria-hidden="true" />
            </button>
          </form>
        </div>

        {/* Col 3: contacto. */}
        <div className="md:justify-self-end">
          <ColumnTitle>Contacto</ColumnTitle>
          <ul className="mt-5 flex items-center gap-3">
            {SOCIALS.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="inline-flex size-11 items-center justify-center rounded-full bg-[var(--public-footer-social-bg)] text-[var(--public-footer-social-icon)] transition-all hover:scale-105 hover:bg-[var(--public-footer-social-hover)] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                >
                  <Icon className="size-5" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
          <ul className="mt-5 flex flex-col gap-2.5 text-sm font-semibold">
            <li>
              <a
                href={`https://wa.me/${digits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[var(--public-footer-text)] transition-colors hover:opacity-80 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              >
                <PhoneIcon className="size-4" aria-hidden="true" />
                {siteConfig.whatsapp.phoneNumber.slice(0)}
              </a>
            </li>
            <li>
              <a
                href="mailto:brayan@amorelo.pe"
                className="inline-flex items-center gap-2 text-[var(--public-footer-text)] transition-colors hover:opacity-80 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              >
                <MailIcon className="size-4" aria-hidden="true" />
                brayan@amorelo.pe
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Barra gigante con la marca, recortada abajo. */}
      <div aria-hidden="true" className="mt-8 overflow-hidden leading-none">
        <p className="font-heading -mb-[0.1em] text-center text-[19vw] font-extrabold tracking-tight whitespace-nowrap text-[var(--public-footer-wordmark)] select-none transition-colors duration-300">
          Amorelo
        </p>
      </div>

      {/* Barra inferior: copyright + legales + libro de reclamaciones. */}
      <div className="border-t border-[var(--public-footer-border)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 text-xs text-[var(--public-footer-text-muted)] sm:flex-row lg:max-w-[1400px]">
          <p>© {year} Amorelo. Todos los derechos reservados.</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {SERVICE.map((item) => (
                <li key={item.label}>
                  <span className="text-[var(--public-footer-text-muted)] cursor-default select-none">
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
