// Lectura de las ofertas vigentes para la vista previa del módulo de cursos.
// El "ahora" se resuelve acá, fuera del render del componente, para que la
// página sea pura.

import "server-only";

export type CuponOferta = {
  codigo: string;
  oferta: string | null;
  tipo_descuento: string;
  valor_descuento: number | string;
  valido_desde: string | null;
  valido_hasta: string | null;
  usos_maximos: number | null;
  usos_actuales: number;
};

export function ofertasVigentes(
  cupones: CuponOferta[],
  ahora = Date.now(),
): CuponOferta[] {
  return cupones.filter((cupon) => {
    if (cupon.valido_desde && new Date(cupon.valido_desde).getTime() > ahora) {
      return false;
    }
    if (cupon.valido_hasta && new Date(cupon.valido_hasta).getTime() < ahora) {
      return false;
    }
    if (
      cupon.usos_maximos !== null &&
      cupon.usos_actuales >= cupon.usos_maximos
    ) {
      return false;
    }
    return true;
  });
}
