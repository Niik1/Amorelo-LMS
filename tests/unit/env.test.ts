import { afterEach, describe, expect, it } from "vitest";
import { getPublicEnv } from "@/lib/config/env";

const PUBLIC_KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
] as const;

const validEnv: Record<(typeof PUBLIC_KEYS)[number], string> = {
  NEXT_PUBLIC_SITE_URL: "https://example.com",
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "site-key",
};

describe("getPublicEnv", () => {
  afterEach(() => {
    for (const key of PUBLIC_KEYS) delete process.env[key];
  });

  it("valida un entorno completo", () => {
    Object.assign(process.env, validEnv);
    expect(getPublicEnv()).toMatchObject(validEnv);
  });

  it("falla si falta una variable requerida", () => {
    Object.assign(process.env, validEnv);
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(() => getPublicEnv()).toThrow();
  });

  it("falla si una URL es inválida", () => {
    Object.assign(process.env, validEnv, {
      NEXT_PUBLIC_SITE_URL: "no-es-una-url",
    });
    expect(() => getPublicEnv()).toThrow();
  });
});
