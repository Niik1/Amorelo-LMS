// Tipos específicos para el sistema de Proyectos Prácticos, Quizzes y Constancias
export type EstadoEntregaProyecto = 'pendiente' | 'enviado_whatsapp' | 'aprobado' | 'observado';

export interface ProyectoConEntrega {
  id: string;
  leccion_id: string;
  titulo_proyecto: string;
  instrucciones: string | null;
  foto_referencia_url: string | null;
  es_obligatorio: boolean;
  entrega?: {
    id: string;
    estado: EstadoEntregaProyecto;
    fecha_envio_whatsapp: string | null;
    fecha_aprobacion: string | null;
    comentarios_admin: string | null;
  } | null;
}
