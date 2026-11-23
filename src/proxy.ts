// Proxy: protege /panel-admin/*.
// - Sin sesión → redirect al login (con redirect_to), salvo que ya esté ahí.
// - Con sesión pero sin fila activa en usuarios_admin → 404 vacío (no revela
//   que la ruta existe).
// - Con sesión pero sin el segundo factor cargado (aal1) → de vuelta al login,
//   que es donde se completa. La contraseña sola no abre el panel.
// - Admin ya logueado y verificado en /login → redirect al dashboard.
// La fuente de verdad es la tabla usuarios_admin (no roles en metadata).

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/config/env";
// Efecto de import: fija la duración de la cookie de sesión.
import "@/lib/supabase/cookies";

const BASE = "/panel-admin";
const LOGIN = "/login";
const DASHBOARD = `${BASE}/dashboard`;

/**
 * Redirect conservando las cookies que el cliente pudo haber refrescado:
 * `getUser` renueva el token y lo escribe en `res`. Sin esto el navegador se
 * queda con el token viejo y vuelve a refrescar en cada request.
 */
function redirigir(res: NextResponse, url: URL) {
  const redireccion = NextResponse.redirect(url);
  for (const cookie of res.cookies.getAll()) {
    redireccion.cookies.set(cookie);
  }
  return redireccion;
}

export async function proxy(req: NextRequest) {
  const res = NextResponse.next({ request: req });
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } =
    getSupabasePublicEnv();
  const supabase = createServerClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const pathname = req.nextUrl.pathname;

  // Redirigir cualquier acceso directo al viejo login del admin hacia el login unificado
  if (pathname === `${BASE}/login` || pathname === `${BASE}/login/`) {
    const url = req.nextUrl.clone();
    url.pathname = LOGIN;
    url.searchParams.set("redirect_to", DASHBOARD);
    return NextResponse.redirect(url);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // --- Protección del Aula Virtual (/aula/*) ---
  if (pathname.startsWith("/aula")) {
    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = LOGIN;
      url.searchParams.set("redirect_to", pathname);
      return NextResponse.redirect(url);
    }
    return res;
  }

  // --- Protección del Panel Admin (/panel-admin/*) ---
  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = LOGIN;
    url.searchParams.set("redirect_to", pathname);
    return NextResponse.redirect(url);
  }

  const { data: fila } = await supabase
    .from("profiles")
    .select("id,activo,rol")
    .eq("id", user.id)
    .eq("rol", "admin")
    .maybeSingle();

  if (!fila || !fila.activo) {
    console.error(`[proxy] acceso denegado al panel: ${user.id}`);
    return new NextResponse(null, { status: 404 });
  }

  // Verificar que el admin haya completado segundo factor (si tiene MFA)
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const factores = await supabase.auth.mfa.listFactors();
  const tieneTotp = factores.data?.totp && factores.data.totp.length > 0;

  if (tieneTotp && aal?.currentLevel !== "aal2") {
    const url = req.nextUrl.clone();
    url.pathname = LOGIN;
    url.search = "";
    url.searchParams.set("mfa", "1");
    url.searchParams.set("redirect_to", pathname);
    return redirigir(res, url);
  }

  return res;
}

export const config = {
  matcher: ["/panel-admin/:path*", "/aula/:path*"],
};
