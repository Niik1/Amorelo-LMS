// Botón para alternar entre modo claro y modo oscuro.

"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex size-8 items-center justify-center rounded-lg text-slate-400">
        <Sun className="size-4" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  const handleToggle = () => {
    const nuevoModo = isDark ? "light" : "dark";
    setTheme(nuevoModo);
    if (typeof document !== "undefined") {
      if (nuevoModo === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="flex size-8 items-center justify-center rounded-lg border border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {isDark ? (
        <Sun className="size-4 text-amber-400" />
      ) : (
        <Moon className="size-4 text-slate-600" />
      )}
    </button>
  );
}
