import { Ingreso } from './ingreso.model';
import { Reconocimiento } from './reconocimiento.model';
import { ResultadoValidacion } from './validacion.model';

export type TipoRespaldo = 'IMAGEN' | 'SIN_RESPALDO_FOTOGRAFICO' | 'NO_DISPONIBLE';

/** Estado del ticket de respaldo (RN-M07-04): tres hechos distintos. */
export interface RespaldoTicket {
  tipo: TipoRespaldo;
  url: string | null;
  motivo?: string | null;
  mensaje?: string;
}

/** Un bloque del detalle: presente, o ausente con su mensaje (RN-M07-08: no se omite). */
export type BloqueDetalle<T> = ({ disponible: true } & T) | { disponible: false; mensaje: string };

export type BloqueReconocimiento = BloqueDetalle<Reconocimiento>;
export type BloqueValidaciones = BloqueDetalle<{ resultados: ResultadoValidacion[] }>;

/**
 * Detalle completo de un ingreso (`GET consulta/ingresos/{id}/`). Es la única llamada que
 * necesitan las pestañas (RNF-M07-02). La trazabilidad y el historial se tipan en FB5 y FB4.
 */
export interface DetalleIngreso extends Omit<Ingreso, 'reconocimiento'> {
  reconocimiento: BloqueReconocimiento;
  respaldo: RespaldoTicket;
  validaciones: BloqueValidaciones;
  trazabilidad: unknown;
  historial: unknown[];
}
