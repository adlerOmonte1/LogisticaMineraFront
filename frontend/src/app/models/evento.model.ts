/** Dominio cerrado del campo `accion` (docs/contrato-api.md §8; `Accion.OPCIONES` del backend). */
export const ACCIONES_EVENTO = [
  'CREAR',
  'MODIFICAR',
  'ANULAR',
  'RECONOCER',
  'CORREGIR_DATO',
  'EXPORTAR',
  'INICIAR_SESION',
  'CERRAR_SESION',
  'ACCESO_RECHAZADO',
] as const;

export type AccionEvento = (typeof ACCIONES_EVENTO)[number];

/** Texto de cada acción para el filtro; en las filas se muestra el `accion_texto` del servidor. */
export const ETIQUETA_ACCION: Readonly<Record<AccionEvento, string>> = {
  CREAR: 'Crear',
  MODIFICAR: 'Modificar',
  ANULAR: 'Anular',
  RECONOCER: 'Reconocer',
  CORREGIR_DATO: 'Corregir dato',
  EXPORTAR: 'Exportar',
  INICIAR_SESION: 'Iniciar sesión',
  CERRAR_SESION: 'Cerrar sesión',
  ACCESO_RECHAZADO: 'Acceso rechazado',
};

/**
 * Operación con que el servidor distingue un evento dentro de su acción: la corrección, su
 * reversión y el destare de un ingreso (M03) y cada paso de un lote (M06, HU-M09-02 CA03).
 */
export type OperacionEvento =
  | 'CORRECCION'
  | 'REVERSION'
  | 'DESTARE'
  | 'ABRIR'
  | 'AGREGAR_MINERAL'
  | 'QUITAR_MINERAL'
  | 'TRASLADAR'
  | 'ASIGNAR'
  | 'RETIRAR'
  | 'INICIAR_RECORRIDO'
  | 'ETAPA'
  | 'SECADO_PROPIO'
  | 'DIVIDIR'
  | 'BIGBAGS'
  | 'CERRAR';

export const ETIQUETA_OPERACION: Readonly<Record<OperacionEvento, string>> = {
  CORRECCION: 'Corrección',
  REVERSION: 'Reversión de una corrección',
  DESTARE: 'Destare',
  ABRIR: 'Apertura del lote',
  AGREGAR_MINERAL: 'Mineral agregado al lote',
  QUITAR_MINERAL: 'Mineral quitado del lote',
  TRASLADAR: 'Traslado entre lotes',
  ASIGNAR: 'Asignación al lote',
  RETIRAR: 'Retiro del lote',
  INICIAR_RECORRIDO: 'Inicio del recorrido',
  ETAPA: 'Paso por una etapa',
  SECADO_PROPIO: 'Secado propio',
  DIVIDIR: 'División del lote',
  BIGBAGS: 'Bigbags del ensacado',
  CERRAR: 'Cierre del lote',
};

/** Un campo que cambió, con su valor anterior y el nuevo tal como los guardó el servidor. */
export interface CambioEvento {
  campo: string;
  anterior: unknown;
  nuevo: unknown;
}

/** Un evento de auditoría (docs/contrato-api.md §8). Solo lectura: nunca se envía al servidor. */
export interface Evento {
  id: number;
  fecha_hora: string;
  accion: AccionEvento;
  accion_texto: string;
  operacion: OperacionEvento | null;
  entidad: string;
  id_entidad: number | null;
  referencia: string | null;
  /** Nombre de usuario; `null` en un acceso rechazado sin sesión. */
  usuario: string | null;
  cambios: CambioEvento[];
  valores_anteriores: Record<string, unknown> | null;
  valores_nuevos: Record<string, unknown> | null;
  motivo: string;
  direccion_ip: string | null;
  ingresos_relacionados: number[];
}

/** Filtros combinables de la auditoría del sistema (HU-M09-03 CA02). */
export interface FiltroAuditoria {
  usuario: string;
  accion: AccionEvento | null;
  texto: string;
}
