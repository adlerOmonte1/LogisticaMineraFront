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
