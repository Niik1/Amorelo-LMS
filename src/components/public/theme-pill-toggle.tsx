"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "cn";

export function ThemePillToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "h-9 w-[76px] rounded-full border border-white/15 bg-white/10 opacity-70",
          className
        )}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  const cambiarTema = (nuevoTema: "light" | "dark") => {
    setTheme(nuevoTema);
    if (typeof document !== "undefined") {
      if (nuevoTema === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  return (
    <div
      role="group"
      aria-label="Selector de tema claro y oscuro"
      className={cn(
        "relative flex h-9 w-[76px] items-center rounded-full p-1 transition-colors duration-300",
        "border border-slate-300/70 bg-slate-200/80 dark:border-white/20 dark:bg-black/40 backdrop-blur-md shadow-inner",
        className
      )}
    >
      {/* Píldora deslizante activa */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-1 bottom-1 h-7 w-8 rounded-full bg-white shadow-md transition-transform duration-300 ease-out",
          isDark ? "translate-x-[36px]" : "translate-x-0"
        )}
      />

      {/* Botón Modo Claro (Sol) */}
      <button
        type="button"
        onClick={() => cambiarTema("light")}
        aria-label="Activar modo claro"
        aria-pressed={!isDark}
        title="Modo claro"
        className={cn(
          "relative z-10 flex h-7 w-8 items-center justify-center rounded-full transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
          !isDark
            ? "text-amber-500"
            : "text-white/60 hover:text-white"
        )}
      >
        <Sun className="size-4 stroke-[2.2]" />
      </button>

      {/* Botón Modo Oscuro (Luna) */}
      <button
        type="button"
        onClick={() => cambiarTema("dark")}
        aria-label="Activar modo oscuro"
        aria-pressed={isDark}
        title="Modo oscuro"
        className={cn(
          "relative z-10 flex h-7 w-8 items-center justify-center rounded-full transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
          isDark
            ? "text-[#0c2356]"
            : "text-slate-500 hover:text-slate-800"
        )}
      >
        <Moon className="size-4 stroke-[2.2]" />
      </button>
    </div>
  );
}
