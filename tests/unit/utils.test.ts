import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("concatena clases condicionales", () => {
    expect(cn("p-2", "text-sm")).toBe("p-2 text-sm");
  });

  it("resuelve conflictos de Tailwind (gana la última clase)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
