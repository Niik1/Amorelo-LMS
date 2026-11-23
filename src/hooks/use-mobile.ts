import * as React from "react"

const MOBILE_BREAKPOINT = 768

// Mobile es "no llegar a md" de Tailwind: así el branch de JS coincide siempre
// con la visibilidad que decide el CSS (`hidden md:flex` en el sidebar).
const QUERY_MD = `(min-width: ${MOBILE_BREAKPOINT}px)`

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY_MD)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

const getSnapshot = () => !window.matchMedia(QUERY_MD).matches

// En servidor y durante la hidratación asumimos desktop, igual que el primer
// render anterior. React re-renderiza con el valor del cliente apenas hidrata
// y no hay parpadeo: abajo de `md` el sidebar de desktop está en display: none.
const getServerSnapshot = () => false

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
