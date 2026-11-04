/**
 * Sobre de paginación del backend (`PageNumberPagination`, 25 por página).
 * Ver docs/contrato-api.md §1.4.
 */
export interface Pagina<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  /** Los listados que lo traen lo llenan solo cuando no hay resultados (p. ej. la auditoría). */
  mensaje?: string | null;
}

/** Tamaño de página fijo del backend: no admite cambiarlo por parámetro. */
export const TAMANO_PAGINA_API = 25;

/**
 * Respuesta de una acción que modifica: el recurso con su mensaje literal al lado
 * (docs/contrato-api.md §1.5).
 */
export type ConMensaje<T> = T & { mensaje?: string | null };

/** Respuesta que solo trae el mensaje. */
export interface SoloMensaje {
  mensaje: string;
}
