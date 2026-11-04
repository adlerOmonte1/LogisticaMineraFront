/**
 * Error de la API normalizado. El backend responde siempre `{codigo, mensaje, detalles}`
 * (D-23), pero `detalles` tiene cuatro formas (docs/contrato-api.md §1.3). Este tipo las
 * reduce a una sola, para que ninguna pantalla tenga que conocerlas.
 */
export interface Inconsistencia {
  regla: string;
  campo: string;
  mensaje: string;
  bloqueante: boolean;
  exige_justificacion: boolean;
}

export interface JustificacionFaltante {
  regla: string;
  mensaje: string;
  /** Solo en el destare: la justificación se pide por código de ingreso (D-25). */
  ingreso?: string;
}

export class ErrorApi extends Error {
  constructor(
    readonly status: number,
    readonly codigo: string,
    mensaje: string,
    /** Campo → texto a mostrar bajo el control (errores de DRF). */
    readonly camposConError: Readonly<Record<string, string>> = {},
    /** Campos que el servidor reclama como obligatorios (`detalles.campos`). */
    readonly camposObligatorios: readonly string[] = [],
    readonly inconsistencias: readonly Inconsistencia[] = [],
    readonly justificacionesFaltantes: readonly JustificacionFaltante[] = [],
    /** El `detalles` original, para los casos propios de cada módulo. */
    readonly detalles: unknown = null,
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }

  get mensaje(): string {
    return this.message;
  }

  get esDeRed(): boolean {
    return this.status === 0;
  }
}

export function esErrorApi(valor: unknown): valor is ErrorApi {
  return valor instanceof ErrorApi;
}

/** Códigos del backend que el núcleo trata de forma especial. */
export const CODIGO_ERROR = {
  sesionExpirada: 'SESION_EXPIRADA',
  claveTemporalPendiente: 'CLAVE_TEMPORAL_PENDIENTE',
  accionNoAutorizada: 'ACCION_NO_AUTORIZADA',
  noAutenticado: 'NO_AUTENTICADO',
  sinConexion: 'SIN_CONEXION',
  errorDelServidor: 'ERROR_DEL_SERVIDOR',
  inesperado: 'ERROR_INESPERADO',
} as const;
