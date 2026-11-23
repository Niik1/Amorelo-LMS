// Proveedor de tema (claro/oscuro) para toda la app.
// Envuelve next-themes con attribute="class" para que Tailwind lo detecte.

"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
