// Tipos compartidos del módulo de cursos: los usan la página del panel y el
// formulario de edición.

/** Curso que se edita desde el panel. */
export type CursoEditable = {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  imagen_url: string | null;
  precio_pen: number;
  precio_usd: number | null;
  activo: boolean;
};

/** Oferta vigente que se usa para la vista previa del precio. */
export type OfertaPrecio = {
  codigo: string;
  tipo: string;
  valor: number;
} | null;
