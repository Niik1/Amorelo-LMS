// Navbar píldora flotante: cápsula crema centrada, links marrón oscuro,
// activo/hover en azul marca. CTA amarillo igual. Menú mobile en panel claro.
// Se monta en src/app/(public)/layout.tsx y cubre todo el grupo público.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Play, User } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/public/button";
import { ThemePillToggle } from "@/components/public/theme-pill-toggle";
import { SocialInstagramIcon } from "@/components/icons/social-instagram";
import { SocialTiktokIcon } from "@/components/icons/social-tiktok";
import { siteConfig } from "@/lib/config/site";

// Sociales en el nav (pedido del dueño): solo en el menú mobile, como
// íconos fantasma discretos. En desktop no van — el CTA manda y no hay
// competencia en la cápsula. Las URLs canónicas viven en el footer; aquí
// en espejo (si se agregan más redes, centralizar en siteConfig).
const NAV_SOCIALS = [
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
] as const;

// Hamburguesa propia con morph a X: 3 barritas redondeadas escalonadas en
// currentColor; al abrir, las externas rotan al centro y la del medio se
// desvanece, todo con transición suave.
function HamburgerIcon({
  open,
  className = "",
}: {
  open: boolean;
  className?: string;
}) {
  const bar =
    "absolute left-0 h-[3px] rounded-full bg-current transition-all duration-300 ease-out motion-reduce:transition-none";
  return (
    <span aria-hidden="true" className={`relative block ${className}`}>
      <span
        className={`${bar} w-full ${open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-[3px]"}`}
      />
      <span
        className={`${bar} ${open ? "top-1/2 w-full -translate-y-1/2 opacity-0" : "top-1/2 w-3/5 -translate-y-1/2 opacity-100"}`}
      />
      <span
        className={`${bar} ${open ? "top-1/2 w-full -translate-y-1/2 -rotate-45" : "top-[22px] w-4/5"}`}
      />
    </span>
  );
}

// Links de navegación según página, scroll y modo
function navLinkClass(
  isActive: boolean,
  variant: "desktop" | "mobile",
  isScrolled = false,
  isHome = true
) {
  if (variant === "desktop") {
    const isLightHeader = isScrolled || !isHome;
    return cn(
      "relative px-1 py-2 text-base font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2",
      isLightHeader
        ? "text-slate-700 hover:text-[#1A73E8] focus-visible:ring-[#1A73E8] dark:text-white/85 dark:hover:text-white dark:drop-shadow-xs dark:focus-visible:ring-white"
        : "text-white/85 hover:text-white drop-shadow-xs focus-visible:ring-white",
      isActive &&
        (isLightHeader
          ? "text-[#1A73E8] font-bold dark:text-white dark:font-extrabold"
          : "text-white font-extrabold")
    );
  }

  return cn(
    "relative block rounded-2xl px-4 py-3 text-xl font-extrabold text-[#38241a] dark:text-white transition-colors duration-200 hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#1A73E8] focus-visible:ring-brand/50 focus-visible:outline-none focus-visible:ring-2",
    isActive && "text-[#1A73E8] dark:text-blue-300"
  );
}

function hashOf(href: string) {
  const idx = href.indexOf("#");
  return idx >= 0 ? href.slice(idx) : "";
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [hash, setHash] = useState("#inicio");
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // IDs de las secciones del home, derivados de los navLinks (fuente
  // única: si se agrega una sección al nav, el spy la sigue solo).
  // Sin el "#": getElementById recibe el id a secas.
  const sectionIds = siteConfig.navLinks
    .map((link) => hashOf(link.href).replace(/^#/, ""))
    .filter(Boolean);

  useEffect(() => {
    const sync = () => setHash(window.location.hash || "#inicio");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  // Scroll-spy: pinta el link de la sección que cruza la banda de medición
  // (40%-45% del viewport, justo bajo el nav fijo). Entre secciones (gaps
  // sin ancla, ej. reseñas/final CTA) se conserva el último estado — sin
  // parpadeos. Fuera del home (sin secciones) queda el estado del hash.
  useEffect(() => {
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });
        if (visible.size === 0) return;
        // El más alto en la página entre los visibles gana la banda.
        const current = sectionIds.find((id) => visible.has(id));
        if (current) setHash(`#${current}`);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    sections.forEach((section) => io.observe(section));
    return () => io.disconnect();
    // sectionIds no cambia entre renders (es constante del nav).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isHome = pathname === "/";
  const isLightHeader = isScrolled || !isHome;

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 w-full transition-all duration-300",
          isScrolled
            ? "border-b border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-[#0c2356]/80 backdrop-blur-md shadow-xs supports-[backdrop-filter]:bg-white/75 dark:supports-[backdrop-filter]:bg-[#0c2356]/75"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <nav
          aria-label="Principal"
          className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        >
          {/* Lado Izquierdo: Logo */}
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/#inicio"
              onClick={close}
              aria-label={siteConfig.name}
              className="inline-flex items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8]"
            >
              {/* Modo Oscuro: Splash blanco, letra A negra */}
              <Image
                src="/images/logo/logoA.svg"
                alt={siteConfig.name}
                width={170}
                height={50}
                unoptimized
                priority
                className={cn(
                  "h-14 sm:h-16 w-auto object-contain transition-all duration-300",
                  "hidden dark:block",
                  !isLightHeader && "block dark:block"
                )}
              />

              {/* Modo Claro: Splash azul marca (#1A73E8), letra A blanca */}
              <Image
                src="/images/logo/logoA-light.svg"
                alt={siteConfig.name}
                width={170}
                height={50}
                unoptimized
                priority
                className={cn(
                  "h-14 sm:h-16 w-auto object-contain transition-all duration-300",
                  "drop-shadow-[0_2px_8px_rgba(26,115,232,0.18)] dark:hidden",
                  !isLightHeader && "hidden"
                )}
              />
            </Link>
          </div>

          {/* Lado Derecho: Links de Navegación alineados a la derecha + Toggle de Tema + Acceder Aula Virtual */}
          <div className="flex items-center justify-end gap-5 lg:gap-7">
            {/* Links de Navegación Desktop (apegados al toggle de modo claro/oscuro) */}
            <div className="hidden items-center gap-5 lg:gap-7 md:flex">
              {siteConfig.navLinks.map((link) => {
                const isAnchor = link.href.includes("#");
                const isActive = isAnchor
                  ? pathname === "/" && hashOf(link.href) === hash
                  : pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      navLinkClass(isActive, "desktop", isScrolled, isHome),
                      "inline-flex items-center gap-2",
                    )}
                  >
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Toggle de Tema + Botón Acceder Aula Virtual */}
            <div className="flex items-center gap-3">
              <ThemePillToggle className="hidden sm:flex" />

              <Link
                href="/login"
                onClick={close}
                className={cn(
                  "group relative hidden sm:inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-bold transition-all duration-200 active:scale-95",
                  isScrolled || !isHome
                    ? "bg-[#1A73E8] text-white shadow-xs hover:bg-[#155fc0] dark:bg-white dark:text-slate-900 dark:shadow-md dark:hover:bg-slate-100"
                    : "bg-white text-slate-900 shadow-md hover:bg-slate-100"
                )}
              >
                <User
                  className={cn(
                    "size-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                    isScrolled || !isHome ? "text-white dark:text-slate-700" : "text-slate-700"
                  )}
                />
                <span>Acceder Aula Virtual</span>
              </Link>

              {/* Botón menú hamburguesa en mobile */}
              <Button
                variant="ghost"
                size="icon-lg"
                className={cn(
                  "mr-2 bg-transparent transition-colors aria-expanded:bg-transparent md:hidden",
                  isScrolled || !isHome
                    ? "text-slate-800 dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
                    : "text-white hover:bg-white/10"
                )}
                aria-expanded={open}
                aria-controls="site-header-menu"
                onClick={() => setOpen((value) => !value)}
              >
                <HamburgerIcon open={open} className="size-7" />
                <span className="sr-only">
                  {open ? "Cerrar menú" : "Abrir menú"}
                </span>
              </Button>
            </div>
          </div>
        </nav>

        {/* Menú Desplegable Móvil pegado al header */}
        {open && (
          <div
            id="site-header-menu"
            className="border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0c2356]/95 backdrop-blur-md px-4 pt-3 pb-6 shadow-xl md:hidden"
          >
            {/* Selector de tema en mobile */}
            <div className="flex items-center justify-between py-2 px-2 border-b border-slate-100 dark:border-white/10 mb-2">
              <span className="text-sm font-bold text-slate-700 dark:text-white/80">Tema</span>
              <ThemePillToggle />
            </div>

            <ul className="flex flex-col gap-1">
              {siteConfig.navLinks.map((link, index) => {
                const isAnchor = link.href.includes("#");
                const isActive = isAnchor
                  ? pathname === "/" && hashOf(link.href) === hash
                  : pathname === link.href;

                return (
                  <li
                    key={link.href}
                    className="animate-menu-item-in motion-reduce:animate-none"
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <Link
                      href={link.href}
                      onClick={close}
                      aria-current={isActive ? "true" : undefined}
                      className={cn(
                        navLinkClass(isActive, "mobile"),
                        "flex items-center justify-between",
                      )}
                    >
                      <span>{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Acción en móvil: Acceder Aula Virtual + Selector de tema */}
            <div
              className="animate-menu-item-in mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex flex-col gap-3 sm:hidden"
              style={{
                animationDelay: `${siteConfig.navLinks.length * 70}ms`,
              }}
            >
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Modo de color
                </span>
                <ThemePillToggle />
              </div>

              <Link
                href="/login"
                onClick={close}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1A73E8] px-5 text-base font-bold text-white shadow-xs transition-colors hover:bg-[#155fc0] active:bg-[#134fa0]"
              >
                <User className="size-5 shrink-0" />
                <span>Acceder Aula Virtual</span>
              </Link>
            </div>

            {/* Redes sociales en móvil */}
            <div
              className="animate-menu-item-in mt-3 flex items-center justify-center gap-1 motion-reduce:animate-none"
              style={{
                animationDelay: `${siteConfig.navLinks.length * 70 + 70}ms`,
              }}
            >
              {NAV_SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={close}
                  aria-label={social.label}
                  className="focus-visible:ring-brand/50 inline-flex size-12 items-center justify-center rounded-full text-[#38241a]/70 transition-colors duration-200 hover:bg-black/5 hover:text-[#1A73E8] focus-visible:ring-2 focus-visible:outline-none"
                >
                  <social.Icon className="size-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Velo con blur detrás del menú mobile (debajo del header) */}
      <div
        aria-hidden="true"
        onClick={close}
        className={`fixed inset-0 z-40 bg-[#1F3A6E]/25 backdrop-blur-md transition-opacity duration-500 motion-reduce:transition-none md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
    </>
  );
}
