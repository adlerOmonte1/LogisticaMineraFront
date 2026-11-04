export type ReglaValidacion = 'V1' | 'V2' | 'V3' | 'V4' | 'V5';

/** Nombre de cada regla en la interfaz (marco de tesis §7). */
export const NOMBRE_REGLA: Readonly<Record<ReglaValidacion, string>> = {
  V1: 'Ticket no duplicado',
  V2: 'Tara menor que el peso bruto',
  V3: 'Formato de placa válido',
  V4: 'Peso neto dentro de la capacidad',
  V5: 'Fecha no posterior al registro',
};

export type MomentoValidacion = 'PROPUESTA' | 'CONFIRMACION' | 'DESTARE';
export type ResolucionValidacion = 'NO_APLICA' | 'CORREGIDA' | 'JUSTIFICADA';

export const ETIQUETA_MOMENTO: Readonly<Record<MomentoValidacion, string>> = {
  PROPUESTA: 'Propuesta',
  CONFIRMACION: 'Confirmación',
  DESTARE: 'Destare',
};

export const ETIQUETA_RESOLUCION: Readonly<Record<ResolucionValidacion, string>> = {
  NO_APLICA: 'No aplica',
  CORREGIDA: 'Corregida',
  JUSTIFICADA: 'Justificada',
};

/** Resultado de una regla sobre un ingreso (`ResultadoValidacionSerializer`, HU-M05-01 CA08). */
export interface ResultadoValidacion {
  id: number;
  regla: ReglaValidacion;
  momento: MomentoValidacion;
  cumple: boolean | null;
  detalle: string;
  resolucion: ResolucionValidacion;
  justificacion: string;
  fecha_hora: string;
}
