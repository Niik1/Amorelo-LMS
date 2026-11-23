export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      aceptaciones_legales: {
        Row: {
          aceptado_en: string
          documento_id: string
          id: string
          ip: string | null
          orden_id: string
          user_agent: string | null
        }
        Insert: {
          aceptado_en?: string
          documento_id: string
          id?: string
          ip?: string | null
          orden_id: string
          user_agent?: string | null
        }
        Update: {
          aceptado_en?: string
          documento_id?: string
          id?: string
          ip?: string | null
          orden_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aceptaciones_legales_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos_legales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aceptaciones_legales_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
        ]
      }
      archivos_leccion: {
        Row: {
          creado_en: string
          id: string
          leccion_id: string
          nombre: string
          ruta_storage: string
          tipo: string
        }
        Insert: {
          creado_en?: string
          id?: string
          leccion_id: string
          nombre: string
          ruta_storage: string
          tipo?: string
        }
        Update: {
          creado_en?: string
          id?: string
          leccion_id?: string
          nombre?: string
          ruta_storage?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "archivos_leccion_leccion_id_fkey"
            columns: ["leccion_id"]
            isOneToOne: false
            referencedRelation: "lecciones"
            referencedColumns: ["id"]
          },
        ]
      }
      canjes_cupon: {
        Row: {
          canjeado_en: string
          cliente_id: string
          cupon_id: string
          descuento_aplicado: number
          id: string
          orden_id: string
        }
        Insert: {
          canjeado_en?: string
          cliente_id: string
          cupon_id: string
          descuento_aplicado: number
          id?: string
          orden_id: string
        }
        Update: {
          canjeado_en?: string
          cliente_id?: string
          cupon_id?: string
          descuento_aplicado?: number
          id?: string
          orden_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "canjes_cupon_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canjes_cupon_cupon_id_fkey"
            columns: ["cupon_id"]
            isOneToOne: false
            referencedRelation: "cupones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canjes_cupon_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: true
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
        ]
      }
      certificados: {
        Row: {
          anulado_en: string | null
          anulado_por: string | null
          codigo_verificacion: string
          emitido_en: string
          emitido_por: string | null
          enviado_en: string | null
          estado: string
          fecha_referencia: string
          horas_academicas: number | null
          id: string
          matricula_id: string | null
          motivo_anulacion: string | null
          nombre_certificado: string
          plantilla: string
          reemplaza_certificado_id: string | null
          reserva_id: string | null
          ruta_pdf: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          anulado_en?: string | null
          anulado_por?: string | null
          codigo_verificacion?: string
          emitido_en?: string
          emitido_por?: string | null
          enviado_en?: string | null
          estado?: string
          fecha_referencia: string
          horas_academicas?: number | null
          id?: string
          matricula_id?: string | null
          motivo_anulacion?: string | null
          nombre_certificado: string
          plantilla: string
          reemplaza_certificado_id?: string | null
          reserva_id?: string | null
          ruta_pdf?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          anulado_en?: string | null
          anulado_por?: string | null
          codigo_verificacion?: string
          emitido_en?: string
          emitido_por?: string | null
          enviado_en?: string | null
          estado?: string
          fecha_referencia?: string
          horas_academicas?: number | null
          id?: string
          matricula_id?: string | null
          motivo_anulacion?: string | null
          nombre_certificado?: string
          plantilla?: string
          reemplaza_certificado_id?: string | null
          reserva_id?: string | null
          ruta_pdf?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificados_anulado_por_fkey"
            columns: ["anulado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificados_emitido_por_fkey"
            columns: ["emitido_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificados_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificados_reemplaza_certificado_id_fkey"
            columns: ["reemplaza_certificado_id"]
            isOneToOne: false
            referencedRelation: "certificados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificados_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas_taller"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          acepta_marketing: boolean
          acepta_marketing_en: string | null
          actualizado_en: string
          apellidos: string
          ciudad: string | null
          correo: string
          creado_en: string
          fecha_nacimiento: string | null
          genero: string | null
          id: string
          nombres: string
          numero_documento: string | null
          origen: string | null
          pais: string | null
          telefono: string
          tipo_documento: string | null
        }
        Insert: {
          acepta_marketing?: boolean
          acepta_marketing_en?: string | null
          actualizado_en?: string
          apellidos: string
          ciudad?: string | null
          correo: string
          creado_en?: string
          fecha_nacimiento?: string | null
          genero?: string | null
          id?: string
          nombres: string
          numero_documento?: string | null
          origen?: string | null
          pais?: string | null
          telefono: string
          tipo_documento?: string | null
        }
        Update: {
          acepta_marketing?: boolean
          acepta_marketing_en?: string | null
          actualizado_en?: string
          apellidos?: string
          ciudad?: string | null
          correo?: string
          creado_en?: string
          fecha_nacimiento?: string | null
          genero?: string | null
          id?: string
          nombres?: string
          numero_documento?: string | null
          origen?: string | null
          pais?: string | null
          telefono?: string
          tipo_documento?: string | null
        }
        Relationships: []
      }
      comprobantes: {
        Row: {
          actualizado_en: string
          anulado_en: string | null
          cliente_correo: string | null
          cliente_direccion: string | null
          cliente_nombre: string
          cliente_numero_doc: string | null
          cliente_tipo_doc: string | null
          codigo_sunat: string | null
          comprobante_relacionado_id: string | null
          concepto: string | null
          creado_en: string
          emisor: Json
          emitido_en: string
          estado_registro: string
          estado_sunat: string
          id: string
          id_externo: string | null
          igv: number
          intentos: number
          items: Json
          mensaje_sunat: string | null
          modo: string
          moneda: string
          motivo_anulacion: string | null
          numero: number
          numero_completo: string | null
          orden_id: string
          pago_id: string | null
          proximo_reintento_en: string | null
          ruta_cdr: string | null
          ruta_pdf: string | null
          ruta_xml: string | null
          serie: string
          subtotal: number
          tipo_documento: string
          total: number
          ultimo_error: string | null
        }
        Insert: {
          actualizado_en?: string
          anulado_en?: string | null
          cliente_correo?: string | null
          cliente_direccion?: string | null
          cliente_nombre: string
          cliente_numero_doc?: string | null
          cliente_tipo_doc?: string | null
          codigo_sunat?: string | null
          comprobante_relacionado_id?: string | null
          concepto?: string | null
          creado_en?: string
          emisor: Json
          emitido_en?: string
          estado_registro?: string
          estado_sunat?: string
          id?: string
          id_externo?: string | null
          igv?: number
          intentos?: number
          items: Json
          mensaje_sunat?: string | null
          modo: string
          moneda: string
          motivo_anulacion?: string | null
          numero: number
          numero_completo?: string | null
          orden_id: string
          pago_id?: string | null
          proximo_reintento_en?: string | null
          ruta_cdr?: string | null
          ruta_pdf?: string | null
          ruta_xml?: string | null
          serie: string
          subtotal: number
          tipo_documento: string
          total: number
          ultimo_error?: string | null
        }
        Update: {
          actualizado_en?: string
          anulado_en?: string | null
          cliente_correo?: string | null
          cliente_direccion?: string | null
          cliente_nombre?: string
          cliente_numero_doc?: string | null
          cliente_tipo_doc?: string | null
          codigo_sunat?: string | null
          comprobante_relacionado_id?: string | null
          concepto?: string | null
          creado_en?: string
          emisor?: Json
          emitido_en?: string
          estado_registro?: string
          estado_sunat?: string
          id?: string
          id_externo?: string | null
          igv?: number
          intentos?: number
          items?: Json
          mensaje_sunat?: string | null
          modo?: string
          moneda?: string
          motivo_anulacion?: string | null
          numero?: number
          numero_completo?: string | null
          orden_id?: string
          pago_id?: string | null
          proximo_reintento_en?: string | null
          ruta_cdr?: string | null
          ruta_pdf?: string | null
          ruta_xml?: string | null
          serie?: string
          subtotal?: number
          tipo_documento?: string
          total?: number
          ultimo_error?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comprobantes_comprobante_relacionado_id_fkey"
            columns: ["comprobante_relacionado_id"]
            isOneToOne: false
            referencedRelation: "comprobantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comprobantes_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comprobantes_pago_id_fkey"
            columns: ["pago_id"]
            isOneToOne: false
            referencedRelation: "pagos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comprobantes_pago_id_fkey"
            columns: ["pago_id"]
            isOneToOne: false
            referencedRelation: "v_pagos_sin_comprobante"
            referencedColumns: ["pago_id"]
          },
        ]
      }
      configuraciones: {
        Row: {
          actualizado_en: string
          actualizado_por: string | null
          clave: string
          es_publica: boolean
          valor: Json
        }
        Insert: {
          actualizado_en?: string
          actualizado_por?: string | null
          clave: string
          es_publica?: boolean
          valor: Json
        }
        Update: {
          actualizado_en?: string
          actualizado_por?: string | null
          clave?: string
          es_publica?: boolean
          valor?: Json
        }
        Relationships: [
          {
            foreignKeyName: "configuraciones_actualizado_por_fkey"
            columns: ["actualizado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cupones: {
        Row: {
          activo: boolean
          actualizado_en: string
          codigo: string
          creado_en: string
          creado_por: string | null
          curso_id: string | null
          id: string
          porcentaje: number
          usos_actuales: number
          usos_maximos: number | null
          valido_desde: string | null
          valido_hasta: string | null
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          codigo: string
          creado_en?: string
          creado_por?: string | null
          curso_id?: string | null
          id?: string
          porcentaje: number
          usos_actuales?: number
          usos_maximos?: number | null
          valido_desde?: string | null
          valido_hasta?: string | null
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          codigo?: string
          creado_en?: string
          creado_por?: string | null
          curso_id?: string | null
          id?: string
          porcentaje?: number
          usos_actuales?: number
          usos_maximos?: number | null
          valido_desde?: string | null
          valido_hasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cupones_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupones_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos: {
        Row: {
          activo: boolean
          actualizado_en: string
          creado_en: string
          descripcion: string | null
          horas_academicas: number | null
          id: string
          imagen_url: string | null
          nombre: string
          precio_pen: number
          precio_usd: number | null
          slug: string
          vigencia_meses: number
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          creado_en?: string
          descripcion?: string | null
          horas_academicas?: number | null
          id?: string
          imagen_url?: string | null
          nombre: string
          precio_pen: number
          precio_usd?: number | null
          slug: string
          vigencia_meses?: number
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          creado_en?: string
          descripcion?: string | null
          horas_academicas?: number | null
          id?: string
          imagen_url?: string | null
          nombre?: string
          precio_pen?: number
          precio_usd?: number | null
          slug?: string
          vigencia_meses?: number
        }
        Relationships: []
      }
      documentos_legales: {
        Row: {
          id: string
          publicado_en: string
          tipo: string
          url: string | null
          version: string
          vigente: boolean
        }
        Insert: {
          id?: string
          publicado_en?: string
          tipo: string
          url?: string | null
          version: string
          vigente?: boolean
        }
        Update: {
          id?: string
          publicado_en?: string
          tipo?: string
          url?: string | null
          version?: string
          vigente?: boolean
        }
        Relationships: []
      }
      emisor: {
        Row: {
          actualizado_en: string
          actualizado_por: string | null
          correo: string | null
          departamento: string | null
          direccion_fiscal: string | null
          distrito: string | null
          id: boolean
          logo_ruta: string | null
          nombre_comercial: string | null
          pie_comprobante: string | null
          provincia: string | null
          razon_social: string | null
          ruc: string | null
          sitio_web: string | null
          telefono: string | null
          ubigeo: string | null
        }
        Insert: {
          actualizado_en?: string
          actualizado_por?: string | null
          correo?: string | null
          departamento?: string | null
          direccion_fiscal?: string | null
          distrito?: string | null
          id?: boolean
          logo_ruta?: string | null
          nombre_comercial?: string | null
          pie_comprobante?: string | null
          provincia?: string | null
          razon_social?: string | null
          ruc?: string | null
          sitio_web?: string | null
          telefono?: string | null
          ubigeo?: string | null
        }
        Update: {
          actualizado_en?: string
          actualizado_por?: string | null
          correo?: string | null
          departamento?: string | null
          direccion_fiscal?: string | null
          distrito?: string | null
          id?: boolean
          logo_ruta?: string | null
          nombre_comercial?: string | null
          pie_comprobante?: string | null
          provincia?: string | null
          razon_social?: string | null
          ruc?: string | null
          sitio_web?: string | null
          telefono?: string | null
          ubigeo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emisor_actualizado_por_fkey"
            columns: ["actualizado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_webhook: {
        Row: {
          contenido: Json
          error: string | null
          evento_id: string
          id: string
          procesado: boolean
          procesado_en: string | null
          proveedor: string
          recibido_en: string
          tipo_evento: string | null
        }
        Insert: {
          contenido: Json
          error?: string | null
          evento_id: string
          id?: string
          procesado?: boolean
          procesado_en?: string | null
          proveedor: string
          recibido_en?: string
          tipo_evento?: string | null
        }
        Update: {
          contenido?: Json
          error?: string | null
          evento_id?: string
          id?: string
          procesado?: boolean
          procesado_en?: string | null
          proveedor?: string
          recibido_en?: string
          tipo_evento?: string | null
        }
        Relationships: []
      }
      lecciones: {
        Row: {
          creado_en: string
          descripcion: string | null
          id: string
          modulo_id: string
          orden: number
          recurso_url: string | null
          tipo_contenido: string
          titulo: string
          video_url: string | null
        }
        Insert: {
          creado_en?: string
          descripcion?: string | null
          id?: string
          modulo_id: string
          orden?: number
          recurso_url?: string | null
          tipo_contenido?: string
          titulo: string
          video_url?: string | null
        }
        Update: {
          creado_en?: string
          descripcion?: string | null
          id?: string
          modulo_id?: string
          orden?: number
          recurso_url?: string | null
          tipo_contenido?: string
          titulo?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lecciones_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      matriculas: {
        Row: {
          curso_id: string
          estado: string
          id: string
          motivo_revocacion: string | null
          orden_id: string
          otorgada_en: string
          perfil_id: string
          revocada_en: string | null
          vence_en: string
        }
        Insert: {
          curso_id: string
          estado?: string
          id?: string
          motivo_revocacion?: string | null
          orden_id: string
          otorgada_en?: string
          perfil_id: string
          revocada_en?: string | null
          vence_en: string
        }
        Update: {
          curso_id?: string
          estado?: string
          id?: string
          motivo_revocacion?: string | null
          orden_id?: string
          otorgada_en?: string
          perfil_id?: string
          revocada_en?: string | null
          vence_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "matriculas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: true
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      modulos: {
        Row: {
          creado_en: string
          curso_id: string
          descripcion: string | null
          id: string
          orden: number
          titulo: string
        }
        Insert: {
          creado_en?: string
          curso_id: string
          descripcion?: string | null
          id?: string
          orden?: number
          titulo: string
        }
        Update: {
          creado_en?: string
          curso_id?: string
          descripcion?: string | null
          id?: string
          orden?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "modulos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      orden_items: {
        Row: {
          cantidad: number
          creado_en: string
          curso_id: string | null
          descripcion: string
          id: string
          orden_id: string
          precio_unitario: number
          subtotal: number
          taller_id: string | null
          tipo_item: string
        }
        Insert: {
          cantidad?: number
          creado_en?: string
          curso_id?: string | null
          descripcion: string
          id?: string
          orden_id: string
          precio_unitario: number
          subtotal: number
          taller_id?: string | null
          tipo_item: string
        }
        Update: {
          cantidad?: number
          creado_en?: string
          curso_id?: string | null
          descripcion?: string
          id?: string
          orden_id?: string
          precio_unitario?: number
          subtotal?: number
          taller_id?: string | null
          tipo_item?: string
        }
        Relationships: [
          {
            foreignKeyName: "orden_items_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orden_items_orden_id_tipo_item_fkey"
            columns: ["orden_id", "tipo_item"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id", "tipo_orden"]
          },
          {
            foreignKeyName: "orden_items_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orden_items_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "v_talleres_ocupacion"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes: {
        Row: {
          actualizado_en: string
          canal: string
          clave_idempotencia: string
          cliente_id: string
          comprobante_solicitado: string
          creado_en: string
          cupon_id: string | null
          estado: string
          estado_acceso: string | null
          facturacion_direccion: string | null
          facturacion_nombre: string | null
          facturacion_numero_doc: string | null
          facturacion_tipo_doc: string | null
          id: string
          intentos_acceso: number
          intentos_conciliacion: number
          moneda: string
          monto_descuento: number
          monto_pagado: number
          numero_orden: string
          pagada_en: string | null
          registrada_por: string | null
          saldo_pendiente: number | null
          subtotal: number
          tipo_orden: string
          total: number
          ultima_conciliacion_en: string | null
          utm_campana: string | null
          utm_medio: string | null
          utm_origen: string | null
        }
        Insert: {
          actualizado_en?: string
          canal?: string
          clave_idempotencia: string
          cliente_id: string
          comprobante_solicitado?: string
          creado_en?: string
          cupon_id?: string | null
          estado?: string
          estado_acceso?: string | null
          facturacion_direccion?: string | null
          facturacion_nombre?: string | null
          facturacion_numero_doc?: string | null
          facturacion_tipo_doc?: string | null
          id?: string
          intentos_acceso?: number
          intentos_conciliacion?: number
          moneda?: string
          monto_descuento?: number
          monto_pagado?: number
          numero_orden?: string
          pagada_en?: string | null
          registrada_por?: string | null
          saldo_pendiente?: number | null
          subtotal: number
          tipo_orden: string
          total: number
          ultima_conciliacion_en?: string | null
          utm_campana?: string | null
          utm_medio?: string | null
          utm_origen?: string | null
        }
        Update: {
          actualizado_en?: string
          canal?: string
          clave_idempotencia?: string
          cliente_id?: string
          comprobante_solicitado?: string
          creado_en?: string
          cupon_id?: string | null
          estado?: string
          estado_acceso?: string | null
          facturacion_direccion?: string | null
          facturacion_nombre?: string | null
          facturacion_numero_doc?: string | null
          facturacion_tipo_doc?: string | null
          id?: string
          intentos_acceso?: number
          intentos_conciliacion?: number
          moneda?: string
          monto_descuento?: number
          monto_pagado?: number
          numero_orden?: string
          pagada_en?: string | null
          registrada_por?: string | null
          saldo_pendiente?: number | null
          subtotal?: number
          tipo_orden?: string
          total?: number
          ultima_conciliacion_en?: string | null
          utm_campana?: string | null
          utm_medio?: string | null
          utm_origen?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_cupon_id_fkey"
            columns: ["cupon_id"]
            isOneToOne: false
            referencedRelation: "cupones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_registrada_por_fkey"
            columns: ["registrada_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          actualizado_en: string
          creado_en: string
          estado: string
          id: string
          metodo_pago: string | null
          moneda: string
          monto: number
          notas: string | null
          orden_id: string
          pagado_en: string | null
          proveedor: string
          proveedor_pago_id: string | null
          proveedor_preferencia_id: string | null
          referencia: string | null
          registrado_por: string | null
          respuesta_cruda: Json | null
          tipo: string
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          estado?: string
          id?: string
          metodo_pago?: string | null
          moneda: string
          monto: number
          notas?: string | null
          orden_id: string
          pagado_en?: string | null
          proveedor: string
          proveedor_pago_id?: string | null
          proveedor_preferencia_id?: string | null
          referencia?: string | null
          registrado_por?: string | null
          respuesta_cruda?: Json | null
          tipo?: string
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          estado?: string
          id?: string
          metodo_pago?: string | null
          moneda?: string
          monto?: number
          notas?: string | null
          orden_id?: string
          pagado_en?: string | null
          proveedor?: string
          proveedor_pago_id?: string | null
          proveedor_preferencia_id?: string | null
          referencia?: string | null
          registrado_por?: string | null
          respuesta_cruda?: Json | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activo: boolean
          cliente_id: string | null
          correo: string
          creado_en: string
          debe_cambiar_clave: boolean
          id: string
          nombre_completo: string
          rol: string
          ultimo_acceso_en: string | null
        }
        Insert: {
          activo?: boolean
          cliente_id?: string | null
          correo: string
          creado_en?: string
          debe_cambiar_clave?: boolean
          id: string
          nombre_completo: string
          rol?: string
          ultimo_acceso_en?: string | null
        }
        Update: {
          activo?: boolean
          cliente_id?: string | null
          correo?: string
          creado_en?: string
          debe_cambiar_clave?: boolean
          id?: string
          nombre_completo?: string
          rol?: string
          ultimo_acceso_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: true
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      progreso_lecciones: {
        Row: {
          completada_en: string
          leccion_id: string
          perfil_id: string
        }
        Insert: {
          completada_en?: string
          leccion_id: string
          perfil_id: string
        }
        Update: {
          completada_en?: string
          leccion_id?: string
          perfil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progreso_lecciones_leccion_id_fkey"
            columns: ["leccion_id"]
            isOneToOne: false
            referencedRelation: "lecciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progreso_lecciones_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reclamos: {
        Row: {
          actualizado_en: string
          bien_contratado: string
          consumidor_apellidos: string
          consumidor_nombres: string
          copia_enviada_en: string | null
          correo: string
          creado_en: string
          descripcion_bien: string
          detalle: string
          domicilio: string
          es_menor_edad: boolean
          estado: string
          fecha_limite_respuesta: string
          id: string
          ip: string | null
          moneda: string | null
          monto_reclamado: number | null
          numero: string
          numero_documento: string
          orden_id: string | null
          pedido_consumidor: string
          representante_documento: string | null
          representante_nombre: string | null
          respondido_en: string | null
          respondido_por: string | null
          respuesta: string | null
          respuesta_enviada_en: string | null
          telefono: string | null
          tipo: string
          tipo_documento: string
        }
        Insert: {
          actualizado_en?: string
          bien_contratado: string
          consumidor_apellidos: string
          consumidor_nombres: string
          copia_enviada_en?: string | null
          correo: string
          creado_en?: string
          descripcion_bien: string
          detalle: string
          domicilio: string
          es_menor_edad?: boolean
          estado?: string
          fecha_limite_respuesta: string
          id?: string
          ip?: string | null
          moneda?: string | null
          monto_reclamado?: number | null
          numero?: string
          numero_documento: string
          orden_id?: string | null
          pedido_consumidor: string
          representante_documento?: string | null
          representante_nombre?: string | null
          respondido_en?: string | null
          respondido_por?: string | null
          respuesta?: string | null
          respuesta_enviada_en?: string | null
          telefono?: string | null
          tipo: string
          tipo_documento: string
        }
        Update: {
          actualizado_en?: string
          bien_contratado?: string
          consumidor_apellidos?: string
          consumidor_nombres?: string
          copia_enviada_en?: string | null
          correo?: string
          creado_en?: string
          descripcion_bien?: string
          detalle?: string
          domicilio?: string
          es_menor_edad?: boolean
          estado?: string
          fecha_limite_respuesta?: string
          id?: string
          ip?: string | null
          moneda?: string | null
          monto_reclamado?: number | null
          numero?: string
          numero_documento?: string
          orden_id?: string | null
          pedido_consumidor?: string
          representante_documento?: string | null
          representante_nombre?: string | null
          respondido_en?: string | null
          respondido_por?: string | null
          respuesta?: string | null
          respuesta_enviada_en?: string | null
          telefono?: string | null
          tipo?: string
          tipo_documento?: string
        }
        Relationships: [
          {
            foreignKeyName: "reclamos_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reclamos_respondido_por_fkey"
            columns: ["respondido_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      registro_correos: {
        Row: {
          cliente_id: string | null
          correo_destino: string
          creado_en: string
          enviado_en: string | null
          error: string | null
          estado: string
          fecha_referencia: string | null
          id: string
          mensaje_proveedor_id: string | null
          orden_id: string | null
          pago_id: string | null
          reserva_id: string | null
          tipo: string
        }
        Insert: {
          cliente_id?: string | null
          correo_destino: string
          creado_en?: string
          enviado_en?: string | null
          error?: string | null
          estado?: string
          fecha_referencia?: string | null
          id?: string
          mensaje_proveedor_id?: string | null
          orden_id?: string | null
          pago_id?: string | null
          reserva_id?: string | null
          tipo: string
        }
        Update: {
          cliente_id?: string | null
          correo_destino?: string
          creado_en?: string
          enviado_en?: string | null
          error?: string | null
          estado?: string
          fecha_referencia?: string | null
          id?: string
          mensaje_proveedor_id?: string | null
          orden_id?: string | null
          pago_id?: string | null
          reserva_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "registro_correos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registro_correos_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registro_correos_pago_id_fkey"
            columns: ["pago_id"]
            isOneToOne: false
            referencedRelation: "pagos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registro_correos_pago_id_fkey"
            columns: ["pago_id"]
            isOneToOne: false
            referencedRelation: "v_pagos_sin_comprobante"
            referencedColumns: ["pago_id"]
          },
          {
            foreignKeyName: "registro_correos_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas_taller"
            referencedColumns: ["id"]
          },
        ]
      }
      reservas_taller: {
        Row: {
          actualizado_en: string
          asistencia_marcada_en: string | null
          asistencia_marcada_por: string | null
          asistio: boolean | null
          cliente_id: string
          creado_en: string
          estado: string
          fecha_limite_saldo: string | null
          id: string
          notas: string | null
          orden_id: string
          retenida_hasta: string | null
          taller_id: string
          ticket_codigo: string
          ticket_enviado_en: string | null
          token_acceso: string
          validado_en: string | null
          validado_por: string | null
        }
        Insert: {
          actualizado_en?: string
          asistencia_marcada_en?: string | null
          asistencia_marcada_por?: string | null
          asistio?: boolean | null
          cliente_id: string
          creado_en?: string
          estado: string
          fecha_limite_saldo?: string | null
          id?: string
          notas?: string | null
          orden_id: string
          retenida_hasta?: string | null
          taller_id: string
          ticket_codigo?: string
          ticket_enviado_en?: string | null
          token_acceso?: string
          validado_en?: string | null
          validado_por?: string | null
        }
        Update: {
          actualizado_en?: string
          asistencia_marcada_en?: string | null
          asistencia_marcada_por?: string | null
          asistio?: boolean | null
          cliente_id?: string
          creado_en?: string
          estado?: string
          fecha_limite_saldo?: string | null
          id?: string
          notas?: string | null
          orden_id?: string
          retenida_hasta?: string | null
          taller_id?: string
          ticket_codigo?: string
          ticket_enviado_en?: string | null
          token_acceso?: string
          validado_en?: string | null
          validado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservas_taller_asistencia_marcada_por_fkey"
            columns: ["asistencia_marcada_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_taller_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_taller_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: true
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_taller_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_taller_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "v_talleres_ocupacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_taller_validado_por_fkey"
            columns: ["validado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      series_comprobantes: {
        Row: {
          activa: boolean
          creado_en: string
          id: string
          modo: string
          serie: string
          tipo_documento: string
          ultimo_numero: number
        }
        Insert: {
          activa?: boolean
          creado_en?: string
          id?: string
          modo: string
          serie: string
          tipo_documento: string
          ultimo_numero?: number
        }
        Update: {
          activa?: boolean
          creado_en?: string
          id?: string
          modo?: string
          serie?: string
          tipo_documento?: string
          ultimo_numero?: number
        }
        Relationships: []
      }
      sesiones_activas: {
        Row: {
          dispositivo: string | null
          iniciada_en: string
          ip: string | null
          navegador: string | null
          perfil_id: string
          session_id: string
          ultima_actividad_en: string
        }
        Insert: {
          dispositivo?: string | null
          iniciada_en?: string
          ip?: string | null
          navegador?: string | null
          perfil_id: string
          session_id: string
          ultima_actividad_en?: string
        }
        Update: {
          dispositivo?: string | null
          iniciada_en?: string
          ip?: string | null
          navegador?: string | null
          perfil_id?: string
          session_id?: string
          ultima_actividad_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "sesiones_activas_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talleres: {
        Row: {
          actualizado_en: string
          creado_en: string
          cupos_totales: number
          descripcion: string | null
          direccion: string | null
          estado: string
          fecha_fin: string
          fecha_inicio: string
          horas_academicas: number | null
          id: string
          imagen_url: string | null
          lugar: string
          maps_url: string | null
          material_incluido: string | null
          nombre: string
          precio_pen: number
          precio_preventa_pen: number | null
          preventa_hasta: string | null
          referencia: string | null
          slug: string
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          cupos_totales: number
          descripcion?: string | null
          direccion?: string | null
          estado?: string
          fecha_fin: string
          fecha_inicio: string
          horas_academicas?: number | null
          id?: string
          imagen_url?: string | null
          lugar: string
          maps_url?: string | null
          material_incluido?: string | null
          nombre: string
          precio_pen: number
          precio_preventa_pen?: number | null
          preventa_hasta?: string | null
          referencia?: string | null
          slug: string
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          cupos_totales?: number
          descripcion?: string | null
          direccion?: string | null
          estado?: string
          fecha_fin?: string
          fecha_inicio?: string
          horas_academicas?: number | null
          id?: string
          imagen_url?: string | null
          lugar?: string
          maps_url?: string | null
          material_incluido?: string | null
          nombre?: string
          precio_pen?: number
          precio_preventa_pen?: number | null
          preventa_hasta?: string | null
          referencia?: string | null
          slug?: string
        }
        Relationships: []
      }
      proyectos: {
        Row: {
          actualizado_en: string
          creado_en: string
          es_obligatorio: boolean
          foto_referencia_url: string | null
          id: string
          instrucciones: string | null
          leccion_id: string
          titulo_proyecto: string
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          es_obligatorio?: boolean
          foto_referencia_url?: string | null
          id?: string
          instrucciones?: string | null
          leccion_id: string
          titulo_proyecto: string
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          es_obligatorio?: boolean
          foto_referencia_url?: string | null
          id?: string
          instrucciones?: string | null
          leccion_id?: string
          titulo_proyecto?: string
        }
        Relationships: [
          {
            foreignKeyName: "proyectos_leccion_id_fkey"
            columns: ["leccion_id"]
            isOneToOne: true
            referencedRelation: "lecciones"
            referencedColumns: ["id"]
          },
        ]
      }
      entregas_proyectos: {
        Row: {
          actualizado_en: string
          aprobado_por: string | null
          comentarios_admin: string | null
          creado_en: string
          estado: string
          fecha_aprobacion: string | null
          fecha_envio_whatsapp: string | null
          id: string
          matricula_id: string
          perfil_id: string
          proyecto_id: string
        }
        Insert: {
          actualizado_en?: string
          aprobado_por?: string | null
          comentarios_admin?: string | null
          creado_en?: string
          estado?: string
          fecha_aprobacion?: string | null
          fecha_envio_whatsapp?: string | null
          id?: string
          matricula_id: string
          perfil_id: string
          proyecto_id: string
        }
        Update: {
          actualizado_en?: string
          aprobado_por?: string | null
          comentarios_admin?: string | null
          creado_en?: string
          estado?: string
          fecha_aprobacion?: string | null
          fecha_envio_whatsapp?: string | null
          id?: string
          matricula_id?: string
          perfil_id?: string
          proyecto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entregas_proyectos_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_proyectos_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_proyectos_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_proyectos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          actualizado_en: string
          creado_en: string
          descripcion: string | null
          id: string
          intentos_permitidos: number | null
          leccion_id: string
          porcentaje_minimo: number
          titulo: string
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          descripcion?: string | null
          id?: string
          intentos_permitidos?: number | null
          leccion_id: string
          porcentaje_minimo?: number
          titulo: string
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          descripcion?: string | null
          id?: string
          intentos_permitidos?: number | null
          leccion_id?: string
          porcentaje_minimo?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_leccion_id_fkey"
            columns: ["leccion_id"]
            isOneToOne: true
            referencedRelation: "lecciones"
            referencedColumns: ["id"]
          },
        ]
      }
      preguntas_quiz: {
        Row: {
          creado_en: string
          enunciado: string
          explicacion: string | null
          id: string
          orden: number
          quiz_id: string
        }
        Insert: {
          creado_en?: string
          enunciado: string
          explicacion?: string | null
          id?: string
          orden?: number
          quiz_id: string
        }
        Update: {
          creado_en?: string
          enunciado?: string
          explicacion?: string | null
          id?: string
          orden?: number
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preguntas_quiz_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      opciones_quiz: {
        Row: {
          creado_en: string
          es_correcta: boolean
          id: string
          pregunta_id: string
          texto_opcion: string
        }
        Insert: {
          creado_en?: string
          es_correcta?: boolean
          id?: string
          pregunta_id: string
          texto_opcion: string
        }
        Update: {
          creado_en?: string
          es_correcta?: boolean
          id?: string
          pregunta_id?: string
          texto_opcion?: string
        }
        Relationships: [
          {
            foreignKeyName: "opciones_quiz_pregunta_id_fkey"
            columns: ["pregunta_id"]
            isOneToOne: false
            referencedRelation: "preguntas_quiz"
            referencedColumns: ["id"]
          },
        ]
      }
      intentos_quiz: {
        Row: {
          aprobado: boolean
          creado_en: string
          id: string
          matricula_id: string
          perfil_id: string
          puntaje: number
          quiz_id: string
          respuestas_detalle: Json | null
        }
        Insert: {
          aprobado?: boolean
          creado_en?: string
          id?: string
          matricula_id: string
          perfil_id: string
          puntaje: number
          quiz_id: string
          respuestas_detalle?: Json | null
        }
        Update: {
          aprobado?: boolean
          creado_en?: string
          id?: string
          matricula_id?: string
          perfil_id?: string
          puntaje?: number
          quiz_id?: string
          respuestas_detalle?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "intentos_quiz_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intentos_quiz_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intentos_quiz_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_embudo_por_origen: {
        Row: {
          campana: string | null
          conversion_pct: number | null
          ingresos: number | null
          ordenes_creadas: number | null
          ordenes_pagadas: number | null
          origen: string | null
          tipo_orden: string | null
        }
        Relationships: []
      }
      v_pagos_sin_comprobante: {
        Row: {
          moneda: string | null
          monto: number | null
          orden_id: string | null
          pagado_en: string | null
          pago_id: string | null
          tipo: string | null
        }
        Insert: {
          moneda?: string | null
          monto?: number | null
          orden_id?: string | null
          pagado_en?: never
          pago_id?: string | null
          tipo?: string | null
        }
        Update: {
          moneda?: string | null
          monto?: number | null
          orden_id?: string | null
          pagado_en?: never
          pago_id?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
        ]
      }
      v_talleres_ocupacion: {
        Row: {
          asistieron: number | null
          con_adelanto: number | null
          confirmadas: number | null
          cupos_totales: number | null
          disponibles: number | null
          estado: string | null
          fecha_inicio: string | null
          id: string | null
          ingresos_validados: number | null
          nombre: string | null
          ocupados: number | null
          vencidas: number | null
        }
        Relationships: []
      }
      v_ventas_diarias: {
        Row: {
          dia: string | null
          ingresos: number | null
          moneda: string | null
          pagos: number | null
          tipo_orden: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      anular_certificado: {
        Args: { p_admin: string; p_certificado_id: string; p_motivo: string }
        Returns: boolean
      }
      anular_comprobante_interno: {
        Args: { p_motivo: string; p_pago_id: string }
        Returns: boolean
      }
      cancelar_taller: { Args: { p_taller_id: string }; Returns: number }
      canjear_cupon: {
        Args: {
          p_cliente_id: string
          p_cupon_id: string
          p_descuento: number
          p_orden_id: string
        }
        Returns: boolean
      }
      confirmar_reserva_taller: {
        Args: { p_orden_id: string }
        Returns: string
      }
      consultar_reserva_por_token: {
        Args: { p_token: string }
        Returns: {
          asistente_nombre: string
          asistio: boolean
          direccion: string
          estado: string
          fecha_fin: string
          fecha_inicio: string
          fecha_limite_saldo: string
          lugar: string
          material_incluido: string
          monto_pagado: number
          numero_orden: string
          referencia: string
          retenida_hasta: string
          saldo_pendiente: number
          taller_nombre: string
          ticket_codigo: string
          total: number
          validado_en: string
        }[]
      }
      cupos_disponibles: { Args: { p_taller_id: string }; Returns: number }
      cupos_ocupados: { Args: { p_taller_id: string }; Returns: number }
      emitir_certificado_curso: {
        Args: {
          p_admin: string
          p_forzar?: boolean
          p_matricula_id: string
          p_nombre_corregido?: string
        }
        Returns: string
      }
      emitir_certificado_taller: {
        Args: {
          p_admin: string
          p_nombre_corregido?: string
          p_reserva_id: string
        }
        Returns: string
      }
      emitir_comprobante_interno: {
        Args: { p_pago_id: string }
        Returns: string
      }
      es_admin: { Args: never; Returns: boolean }
      liberar_sesion: {
        Args: { p_perfil_id: string; p_session_id: string }
        Returns: undefined
      }
      marcar_asistencia: {
        Args: { p_admin: string; p_asistio: boolean; p_reserva_id: string }
        Returns: undefined
      }
      marcar_orden_pagada: { Args: { p_orden_id: string }; Returns: boolean }
      obtener_sesion_activa: {
        Args: { p_perfil_id: string }
        Returns: {
          dispositivo: string | null
          iniciada_en: string
          ip: string | null
          navegador: string | null
          perfil_id: string
          session_id: string
          ultima_actividad_en: string
        }[]
        SetofOptions: {
          from: "*"
          to: "sesiones_activas"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      orden_tiene_aceptaciones: {
        Args: { p_orden_id: string }
        Returns: boolean
      }
      ordenes_pendientes_por_conciliar: {
        Args: { p_edad_max?: string; p_edad_min?: string; p_limite?: number }
        Returns: {
          actualizado_en: string
          canal: string
          clave_idempotencia: string
          cliente_id: string
          comprobante_solicitado: string
          creado_en: string
          cupon_id: string | null
          estado: string
          estado_acceso: string | null
          facturacion_direccion: string | null
          facturacion_nombre: string | null
          facturacion_numero_doc: string | null
          facturacion_tipo_doc: string | null
          id: string
          intentos_acceso: number
          intentos_conciliacion: number
          moneda: string
          monto_descuento: number
          monto_pagado: number
          numero_orden: string
          pagada_en: string | null
          registrada_por: string | null
          saldo_pendiente: number | null
          subtotal: number
          tipo_orden: string
          total: number
          ultima_conciliacion_en: string | null
          utm_campana: string | null
          utm_medio: string | null
          utm_origen: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "ordenes"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      otorgar_matricula:
        | { Args: { p_orden_id: string; p_perfil_id: string }; Returns: string }
        | {
            Args: {
              p_orden_id: string
              p_perfil_id: string
              p_vence_en?: string
            }
            Returns: string
          }
      precio_taller_vigente: { Args: { p_taller_id: string }; Returns: number }
      progreso_curso: {
        Args: { p_curso_id: string; p_perfil_id: string }
        Returns: number
      }
      puede_comprar_curso: {
        Args: { p_correo: string; p_curso_id: string }
        Returns: boolean
      }
      registrar_sesion: {
        Args: {
          p_dispositivo?: string
          p_ip?: string
          p_navegador?: string
          p_perfil_id: string
          p_session_id: string
        }
        Returns: undefined
      }
      responder_reclamo: {
        Args: { p_admin: string; p_reclamo_id: string; p_respuesta: string }
        Returns: boolean
      }
      resumen_diario: { Args: { p_fecha?: string }; Returns: Json }
      revocar_orden: {
        Args: { p_motivo?: string; p_orden_id: string }
        Returns: undefined
      }
      sesion_valida: { Args: never; Returns: boolean }
      siguiente_numero_comprobante: {
        Args: { p_modo: string; p_tipo_documento: string }
        Returns: {
          o_numero: number
          o_serie: string
        }[]
      }
      tiene_acceso_curso: { Args: { p_curso_id: string }; Returns: boolean }
      tocar_sesion: {
        Args: { p_perfil_id: string; p_session_id: string }
        Returns: boolean
      }
      tomar_cupo_taller: {
        Args: {
          p_cliente_id: string
          p_fecha_limite_saldo?: string
          p_minutos_retencion?: number
          p_modo?: string
          p_orden_id: string
          p_taller_id: string
        }
        Returns: string
      }
      validar_ticket: {
        Args: { p_admin: string; p_codigo: string; p_taller_id?: string }
        Returns: string
      }
      vencer_matriculas: { Args: never; Returns: number }
      vencer_reservas_taller: {
        Args: never
        Returns: {
          actualizado_en: string
          asistencia_marcada_en: string | null
          asistencia_marcada_por: string | null
          asistio: boolean | null
          cliente_id: string
          creado_en: string
          estado: string
          fecha_limite_saldo: string | null
          id: string
          notas: string | null
          orden_id: string
          retenida_hasta: string | null
          taller_id: string
          ticket_codigo: string
          ticket_enviado_en: string | null
          token_acceso: string
          validado_en: string | null
          validado_por: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "reservas_taller"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      verificar_certificado: {
        Args: { p_codigo: string }
        Returns: {
          estado: string
          fecha: string
          nombre: string
          tipo: string
          titulo: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
