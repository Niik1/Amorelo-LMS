import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ThemeToggle } from "@/components/theme-toggle";

const mockSetTheme = vi.fn();
let currentTheme = "light";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: currentTheme,
    resolvedTheme: currentTheme,
    setTheme: (t: string) => {
      currentTheme = t;
      mockSetTheme(t);
    },
  }),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentTheme = "light";
    document.documentElement.className = "";
  });

  it("alterna de modo claro a modo oscuro y actualiza el documento", async () => {
    const { rerender } = render(<ThemeToggle />);

    const boton = screen.getByRole("button", { name: /cambiar a modo oscuro/i });
    expect(boton).toBeDefined();

    await act(async () => {
      fireEvent.click(boton);
    });

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    rerender(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /cambiar a modo claro/i })).toBeDefined();
  });

  it("alterna de modo oscuro a modo claro al hacer click nuevamente", async () => {
    currentTheme = "dark";
    document.documentElement.classList.add("dark");

    const { rerender } = render(<ThemeToggle />);

    const boton = screen.getByRole("button", { name: /cambiar a modo claro/i });
    expect(boton).toBeDefined();

    await act(async () => {
      fireEvent.click(boton);
    });

    expect(mockSetTheme).toHaveBeenCalledWith("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    rerender(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /cambiar a modo oscuro/i })).toBeDefined();
  });
});
