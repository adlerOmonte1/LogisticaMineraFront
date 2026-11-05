/** Un mes del calendario: `mes` va de 1 a 12. */
export interface Periodo {
  anio: number;
  mes: number;
}

/** Una fila del consolidado: un tipo de mineral con ingresos en el periodo (docs/contrato-api.md §7). */
export interface FilaConsolidado {
  tipo_mineral: number;
  codigo: string;
  nombre: string;
  ingresos: number;
  /** Decimal en cadena (D-F17). */
  toneladas: string;
  /** Porcentaje sobre el total, en cadena: `"63.21"`. */
  participacion: string;
}

/**
 * `GET consolidacion/mensual/`. `mensaje`, `en_proceso_mensaje` y `al_corte` son textos del
 * servidor listos para mostrar; un tipo de mineral sin ingresos no aparece (RN-M08-03).
 */
export interface Consolidado extends Periodo {
  tipos_mineral: FilaConsolidado[];
  total_toneladas: string;
  total_ingresos: number;
  en_proceso: { cantidad: number; codigos: string[] };
  anulados_excluidos: number;
  /** Con texto solo si el periodo no tiene ingresos (HU-M08-01 CA03). */
  mensaje: string | null;
  /** Con texto si hay ingresos En proceso: el total aún no es definitivo (CA07). */
  en_proceso_mensaje: string | null;
  /** Con texto solo en el mes en curso: «Total al corte de hoy, …» (CA09). */
  al_corte: string | null;
}
