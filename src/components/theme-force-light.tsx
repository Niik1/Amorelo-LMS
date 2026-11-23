"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

/** Fuerza el tema a 'light' en la página actual */
export function ForceLightTheme() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (theme !== "light") {
      setTheme("light");
    }
  }, [theme, setTheme]);

  return null;
}
