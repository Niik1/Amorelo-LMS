// Tipos compartidos del módulo de cupones: los usa la tabla, los filtros y el
// formulario (crear/editar).

/** Lo mínimo para pre-llenar el form en modo edición. */
export type CuponEditable = {
  id: string;
  codigo: string;
  tipo_descuento: string;
  valor_descuento: number | string;
  valido_desde: string | null;
  valido_hasta: string | null;
  usos_maximos: number | null;
  activo: boolean;
  creado_en: string;
};

/** Fila completa que llega del servidor. */
export type FilaCupon = CuponEditable & {
  usos_actuales: number;
};
