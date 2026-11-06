import { EstadoLote, ETIQUETA_ESTADO_LOTE } from '@models/lote.model';
import type { TonoInsignia } from '../components/insignia-estado/insignia-estado.component';

export interface PresentacionEstado {
  texto: string;
  tono: TonoInsignia;
}

const TONO_POR_ESTADO: Readonly<Record<EstadoLote, TonoInsignia>> = {
  ABIERTO: 'info',
  EN_RECORRIDO: 'aviso',
  CERRADO: 'neutro',
};

/** El estado de un lote con su tono; el texto siempre acompaña al color (RNF-M07-11). */
export function presentarEstadoLote(estado: EstadoLote): PresentacionEstado {
  return { texto: ETIQUETA_ESTADO_LOTE[estado], tono: TONO_POR_ESTADO[estado] };
}

/** Colores de las fichas de la maqueta (`.pill`). */
export type ColorFicha = 'green' | 'orange' | 'red' | 'blue' | 'purple' | 'gray';

export interface FichaEstado {
  texto: string;
  color: ColorFicha;
}

const COLOR_POR_ESTADO: Readonly<Record<EstadoLote, ColorFicha>> = {
  ABIERTO: 'blue',
  EN_RECORRIDO: 'purple',
  CERRADO: 'gray',
};

/**
 * El estado del lote como lo pinta la maqueta (`loteEstado`). «Listo para cerrar» es un lote en
 * recorrido al que el servidor ya no le marca pendientes: lo decide `pendientes`, no el cliente.
 */
export function fichaEstadoLote(estado: EstadoLote, listoParaCerrar = false): FichaEstado {
  if (estado === 'EN_RECORRIDO' && listoParaCerrar) {
    return { texto: 'Listo para cerrar', color: 'green' };
  }
  return { texto: ETIQUETA_ESTADO_LOTE[estado], color: COLOR_POR_ESTADO[estado] };
}
