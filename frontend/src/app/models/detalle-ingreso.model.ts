import { Evento } from './evento.model';
import { Ingreso } from './ingreso.model';
import { Reconocimiento } from './reconocimiento.model';
import { TrazabilidadIngreso } from './trazabilidad.model';
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
 * necesitan las pestañas (RNF-M07-02). La trazabilidad es la del ingreso (M06).
 */
export interface DetalleIngreso extends Omit<Ingreso, 'reconocimiento'> {
  reconocimiento: BloqueReconocimiento;
  respaldo: RespaldoTicket;
  validaciones: BloqueValidaciones;
  trazabilidad: TrazabilidadIngreso;
  /** Eventos del ingreso y de su lote, del primero al más reciente (HU-M09-02 CA01, CA03). */
  historial: Evento[];
}
