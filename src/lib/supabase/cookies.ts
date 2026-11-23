// Duración de la sesión del panel en el navegador.
//
// @supabase/ssr 0.12.x fuerza `maxAge` al valor de DEFAULT_COOKIE_OPTIONS al
// escribir la cookie de sesión, e IGNORA `cookieOptions.maxAge` (ver
// dist/module/cookies.js, applyServerStorage y createStorageFromOptions). La
// constante está exportada, así que la ajustamos una sola vez acá.
//
// Cualquier cliente de Supabase de la app tiene que importar este módulo antes
// de crearse: lo hacen los tres factories (server, browser y proxy).
//
// Es una ventana deslizante: cada vez que se refresca el token la cookie se
// reescribe con los mismos 15 días. O sea, son 15 días SIN usar el panel.

import { DEFAULT_COOKIE_OPTIONS } from "@supabase/ssr";

/** Días que el panel recuerda la sesión sin volver a pedir credenciales. */
export const DIAS_SESION = 15;

DEFAULT_COOKIE_OPTIONS.maxAge = DIAS_SESION * 24 * 60 * 60;
