// Tipos y funciones de mapeo de datos para el módulo de Libro de Reclamaciones.
// Separado de acciones-admin.ts para cumplir la regla de Next.js ("use server" exige funciones async).

export type ItemReclamoAdmin = {
  id: string;
  numero: string;
  tipo: "reclamo" | "queja";
  consumidorNombres: string;
  consumidorApellidos: string;
  nombreCompleto: string;
  tipoDocumento: "DNI" | "CE" | "PASAPORTE" | "RUC" | string;
  numeroDocumento: string;
  domicilio: string;
  telefono: string | null;
  correo: string;
  esMenorEdad: boolean;
  representanteNombre: string | null;
  representanteDocumento: string | null;
  bienContratado: "producto" | "servicio";
  descripcionBien: string;
  montoReclamado: number | null;
  moneda: "PEN" | "USD" | string | null;
  ordenId: string | null;
  detalle: string;
  pedidoConsumidor: string;
  estado: "pendiente" | "en_proceso" | "respondido" | "cerrado" | string;
  fechaLimiteRespuesta: string;
  respuesta: string | null;
  respondidoEn: string | null;
  respondidoPor: string | null;
  copiaEnviadaEn: string | null;
  respuestaEnviadaEn: string | null;
  ip: string | null;
  creadoEn: string;
  actualizadoEn: string;
};

export function mapearFilaAReclamoAdmin(row: any): ItemReclamoAdmin {
  return {
    id: row.id,
    numero: row.numero,
    tipo: row.tipo as "reclamo" | "queja",
    consumidorNombres: row.consumidor_nombres,
    consumidorApellidos: row.consumidor_apellidos,
    nombreCompleto: `${row.consumidor_nombres} ${row.consumidor_apellidos}`.trim(),
    tipoDocumento: row.tipo_documento,
    numeroDocumento: row.numero_documento,
    domicilio: row.domicilio,
    telefono: row.telefono,
    correo: row.correo,
    esMenorEdad: Boolean(row.es_menor_edad),
    representanteNombre: row.representante_nombre,
    representanteDocumento: row.representante_documento,
    bienContratado: row.bien_contratado as "producto" | "servicio",
    descripcionBien: row.descripcion_bien,
    montoReclamado: row.monto_reclamado,
    moneda: row.moneda,
    ordenId: row.orden_id,
    detalle: row.detalle,
    pedidoConsumidor: row.pedido_consumidor,
    estado: row.estado,
    fechaLimiteRespuesta: row.fecha_limite_respuesta,
    respuesta: row.respuesta,
    respondidoEn: row.respondido_en,
    respondidoPor: row.respondido_por,
    copiaEnviadaEn: row.copia_enviada_en,
    respuestaEnviadaEn: row.respuesta_enviada_en,
    ip: row.ip,
    creadoEn: row.creado_en,
    actualizadoEn: row.actualizado_en,
  };
}
