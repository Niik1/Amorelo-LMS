// Sidebar del aula virtual: navegación del estudiante, colapsable a iconos.
// Fondo azul oscuro (#1e3a8a) con texto e iconos blancos.

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Award,
  BookOpen,
  CalendarDays,
  ChevronsUpDown,
  LogOut,
  Receipt,
  Sun,
  Moon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { cerrarSesionApp } from "@/server/auth/acciones";

const BASE = "/aula";

const MODULOS = [
  { href: BASE, etiqueta: "Mis Cursos", Icon: BookOpen },
  { href: `${BASE}/talleres`, etiqueta: "Mis Talleres", Icon: CalendarDays },
  { href: `${BASE}/certificados`, etiqueta: "Mis Constancias", Icon: Award },
  { href: `${BASE}/compras`, etiqueta: "Mis Compras", Icon: Receipt },
] as const;

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AulaSidebar({
  nombre,
  correo,
}: {
  nombre: string;
  correo: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { isMobile, setOpenMobile } = useSidebar();

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  const handleToggleTheme = () => {
    const nuevoModo = isDark ? "light" : "dark";
    setTheme(nuevoModo);
    if (typeof document !== "undefined") {
      if (nuevoModo === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    // Cerrar el menú lateral automáticamente al cambiar tema en móvil
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Cerrar sidebar en mobile al navegar
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [pathname, isMobile, setOpenMobile]);

  const salir = async () => {
    try {
      await cerrarSesionApp();
    } catch {}

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}

    window.location.href = "/login";
  };

  // For "Mis Cursos" which is the root /aula, only match exact path
  const isActive = (href: string) => {
    if (href === BASE) return pathname === BASE || pathname === `${BASE}/`;
    return pathname.startsWith(href);
  };

  return (
    <Sidebar
      collapsible="icon"
      className="!bg-[#1e3a8a] !text-white border-r border-blue-900/40"
      style={{
        "--sidebar": "#1e3a8a",
        "--sidebar-foreground": "#ffffff",
        "--sidebar-primary": "#ffffff",
        "--sidebar-primary-foreground": "#1e3a8a",
        "--sidebar-accent": "rgba(255,255,255,0.15)",
        "--sidebar-accent-foreground": "#ffffff",
        "--sidebar-border": "rgba(255,255,255,0.15)",
        "--sidebar-ring": "rgba(255,255,255,0.3)",
      } as React.CSSProperties}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Aula Amorelo"
              render={<Link href={BASE} onClick={handleLinkClick} />}
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-extrabold text-[#1e3a8a]"
              >
                A
              </span>
              <span className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-extrabold text-white">Amorelo</span>
                <span className="text-xs text-blue-200">Aula Virtual</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold tracking-wider uppercase text-blue-200/80">
            Mi Espacio
          </SidebarGroupLabel>
          <SidebarMenu>
            {MODULOS.map(({ href, etiqueta, Icon }) => {
              const active = isActive(href);
              return (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    isActive={active}
                    tooltip={etiqueta}
                    render={<Link href={href} onClick={handleLinkClick} />}
                    className={`text-white hover:bg-white/10 hover:text-white transition-colors ${
                      active
                        ? "bg-white/20 font-bold text-white shadow-xs"
                        : "text-white/90"
                    }`}
                  >
                    <Icon aria-hidden="true" className="size-4 shrink-0 text-white" />
                    <span className="text-white">{etiqueta}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    tooltip={`${nombre} — ${correo}`}
                    className="text-white hover:bg-white/10 hover:text-white data-[state=open]:bg-white/15 data-[state=open]:text-white"
                  />
                }
              >
                <span className="sr-only">Cuenta de {nombre}</span>
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/20 text-xs font-extrabold text-white"
                >
                  {iniciales(nombre)}
                </span>
                <span className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-bold text-white">{nombre}</span>
                  <span className="truncate text-xs text-blue-200">
                    {correo}
                  </span>
                </span>
                <ChevronsUpDown aria-hidden="true" className="size-4 text-white/70 group-data-[collapsible=icon]:hidden" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-2xl p-1.5 shadow-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                    <span
                      aria-hidden="true"
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1e3a8a] text-xs font-extrabold text-white"
                    >
                      {iniciales(nombre)}
                    </span>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-bold text-slate-900 dark:text-white">{nombre}</span>
                      <span className="text-muted-foreground truncate text-xs">
                        {correo}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Alternar modo claro / modo oscuro */}
                <DropdownMenuItem
                  onClick={handleToggleTheme}
                  className="cursor-pointer font-medium"
                >
                  {isDark ? (
                    <>
                      <Sun aria-hidden="true" className="size-4 mr-2 text-amber-500" />
                      <span>Modo claro</span>
                    </>
                  ) : (
                    <>
                      <Moon aria-hidden="true" className="size-4 mr-2 text-slate-600 dark:text-slate-300" />
                      <span>Modo oscuro</span>
                    </>
                  )}
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => void salir()}
                  className="cursor-pointer font-medium text-rose-600 focus:text-rose-600"
                >
                  <LogOut aria-hidden="true" className="size-4 mr-2" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
