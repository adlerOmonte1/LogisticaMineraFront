import { Titularidad } from './vehiculo.model';

export type EstadoIngreso = 'EN_PROCESO' | 'REGISTRADO' | 'ANULADO';

export const ETIQUETA_ESTADO_INGRESO: Readonly<Record<EstadoIngreso, string>> = {
  EN_PROCESO: 'En proceso',
  REGISTRADO: 'Registrado',
  ANULADO: 'Anulado',
};

/** Motivos del registro sin foto (lista cerrada del backend, HU-M03-01 CA16). */
export type MotivoSinFoto = 'TICKET_EXTRAVIADO' | 'SIN_CAMARA' | 'BALANZA_SIN_TICKET' | 'OTRO';

/**
 * Textos de la lista de motivos. Son la etiqueta de cada opción de la interfaz; los códigos
 * son los del backend (`Ingreso.MOTIVOS_SIN_FOTO`).
 */
export const MOTIVOS_SIN_FOTO: readonly { codigo: MotivoSinFoto; etiqueta: string }[] = [
  { codigo: 'TICKET_EXTRAVIADO', etiqueta: 'Ticket extraviado o dañado' },
  { codigo: 'SIN_CAMARA', etiqueta: 'Sin cámara o sin señal en el punto de pesaje' },
  { codigo: 'BALANZA_SIN_TICKET', etiqueta: 'La balanza no emitió ticket' },
  { codigo: 'OTRO', etiqueta: 'Otro' },
];

/** Resumen del reconocimiento dentro del ingreso (`IngresoSerializer.get_reconocimiento`). */
export interface ResumenReconocimiento {
  id: number | null;
  hubo_reconocimiento: boolean;
  motivo: string | null;
}

/**
 * Recurso del ingreso (`IngresoSerializer`). Las tres marcas de tiempo son distintas y de solo
 * lectura (D-01); tara y peso neto los calcula el servidor (D-17).
 */
export interface Ingreso {
  id: number;
  codigo: string;
  estado: EstadoIngreso;
  placa: string;
  vehiculo: number;
  tipo_vehiculo: Titularidad;
  tipo_mineral: number;
  tipo_mineral_codigo: string;
  tipo_mineral_nombre: string;
  fecha_hora_pesaje: string;
  hora_inicio_registro: string;
  hora_fin_registro: string;
  peso_bruto_tn: string;
  tara_tn: string | null;
  peso_neto_tn: string | null;
  sin_respaldo_fotografico: boolean;
  /** Cadena vacía cuando el ingreso tiene foto. */
  motivo_sin_respaldo: MotivoSinFoto | '';
  motivo_sin_respaldo_texto: string;
  imagen_url: string | null;
  registrado_por: string;
  motivo_anulacion: string | null;
  anulado_por: string | null;
  reconocimiento: ResumenReconocimiento;
  /** Id del evento de la última corrección vigente: lo que se envía para revertirla. */
  correccion_revertible: number | null;
}

/** Fila de «pendientes de destare» (`PendienteDestareSerializer`, HU-M03-04 CA06). */
export interface IngresoPendienteDestare {
  id: number;
  codigo: string;
  vehiculo: number;
  placa: string;
  fecha_hora_pesaje: string;
  peso_bruto_tn: string;
}

export interface VehiculoPendiente {
  id: number;
  placa: string;
  ingresos: number;
}

/** Respuesta de `GET ingresos/`: los pendientes de destare, no un listado general (D-19). */
export interface PendientesDestare {
  count: number;
  mensaje: string | null;
  vehiculos: VehiculoPendiente[];
  results: IngresoPendienteDestare[];
}

export interface NuevoDestare {
  vehiculo: number;
  tara_tn: string;
  fecha_destare?: string | null;
  /** Por código de ingreso, no por regla (D-25). */
  justificaciones?: Record<string, string>;
}

export interface IngresoDestarado {
  id: number;
  codigo: string;
  peso_bruto_tn: string;
  peso_neto_tn: string;
  estado: EstadoIngreso;
}

export interface ResultadoDestare {
  mensaje: string;
  vehiculo: { id: number; placa: string; tara_tn: string; fecha_destare: string };
  ingresos: IngresoDestarado[];
}

/** Campos que una corrección puede cambiar (HU-M03-02 CA04: nada más se envía). */
export interface CambiosIngreso {
  placa?: string;
  fecha?: string;
  hora?: string;
  peso_bruto_tn?: string;
  tipo_mineral?: number;
}

export interface CorreccionIngreso extends CambiosIngreso {
  motivo: string;
  /** Por regla: `{"V4": "…"}`. */
  justificaciones?: Record<string, string>;
}

export interface ReversionCorreccion {
  motivo: string;
  correccion: number;
  justificaciones?: Record<string, string>;
}
