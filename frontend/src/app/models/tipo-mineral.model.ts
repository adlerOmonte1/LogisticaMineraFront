export type UnidadMedida = 'TONELADA';

export interface TipoMineral {
  id: number;
  codigo: string;
  nombre: string;
  unidad_medida: UnidadMedida;
  activo: boolean;
}

/**
 * Alta de un tipo de mineral. Con `desde_registro` el código es opcional y lo genera el
 * servidor (HU-M02-02 CA07).
 */
export interface NuevoTipoMineral {
  codigo: string;
  nombre: string;
  unidad_medida?: UnidadMedida;
  desde_registro?: boolean;
}

/** El código no cambia después del alta (RN-M02-16). */
export interface CambiosTipoMineral {
  nombre?: string;
}

export interface FiltroTiposMineral {
  activo?: boolean | null;
  codigo?: string | null;
}
