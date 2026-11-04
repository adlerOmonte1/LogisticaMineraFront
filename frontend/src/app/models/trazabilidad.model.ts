import { CodigoDestino, CodigoEtapa, CodigoRuta, EstadoLote } from './lote.model';

/** Una etapa de la ruta de un ingreso, hecha o por hacer (docs/contrato-api.md §5.3). */
export interface EtapaTrazada {
  codigo: CodigoEtapa;
  nombre: string;
  completada: boolean;
  fecha_hora: string | null;
  usuario: string | null;
}

/** Una línea del recorrido: el lote entero, o cada parte en que se dividió (HU-M06-03 CA06). */
export interface LineaTrazabilidad {
  nombre: string;
  ruta: CodigoRuta | null;
  etapas: EtapaTrazada[];
}

export interface LoteDeIngreso {
  id: number;
  codigo: string;
  nombre: string;
  estado: EstadoLote;
  destino: CodigoDestino | null;
  fecha_cierre: string | null;
}

export interface SecadoDeIngreso {
  propio: boolean;
  completado: boolean;
  fecha_hora: string | null;
  usuario: string | null;
}

/**
 * Trazabilidad de un ingreso, tal como la trae el detalle (`trazabilidad`) o
 * `GET ingresos/{id}/trazabilidad/`. Sin lote, el servidor manda `mensaje` y no hay secado.
 */
export interface TrazabilidadIngreso {
  ingreso: string;
  anulado: boolean;
  lote: LoteDeIngreso | null;
  mensaje?: string;
  secado?: SecadoDeIngreso;
  lineas: LineaTrazabilidad[];
  /** `true` mientras alguna línea no tiene ruta: no se muestra proporción (HU-M06-03 CA07). */
  ruta_por_decidir: boolean;
  etapas_recorridas: number;
  etapas_totales: number | null;
  proceso_completo: boolean;
}
