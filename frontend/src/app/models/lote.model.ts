import { EstadoIngreso } from './ingreso.model';
import { ConMensaje } from './pagina.model';

/** Estados, etapas, rutas y destinos de M06 (docs/contrato-api.md §5). Dominios cerrados. */
export type EstadoLote = 'ABIERTO' | 'EN_RECORRIDO' | 'CERRADO';
export const ESTADOS_LOTE: readonly EstadoLote[] = ['ABIERTO', 'EN_RECORRIDO', 'CERRADO'];
export const ETIQUETA_ESTADO_LOTE: Readonly<Record<EstadoLote, string>> = {
  ABIERTO: 'Abierto',
  EN_RECORRIDO: 'En recorrido',
  CERRADO: 'Cerrado',
};

export type CodigoEtapa = 'SECADO' | 'ZARANDEO' | 'MOLIENDA' | 'ENSACADO';
export type CodigoRuta = 'ZARANDEO_ENSACADO' | 'MOLIENDA_ENSACADO' | 'ZARANDEO_MOLIENDA_ENSACADO';
export type CodigoDestino = 'VENTA' | 'TRASLADO';

/** El servidor manda `''` o `null` mientras el lote no tiene ruta o destino. */
export type RutaLote = CodigoRuta | '' | null;
export type DestinoLote = CodigoDestino | '' | null;

export interface EtapaCatalogo {
  codigo: CodigoEtapa;
  nombre: string;
  orden: number;
}

export interface RutaCatalogo {
  codigo: CodigoRuta;
  nombre: string;
  etapas: CodigoEtapa[];
}

export interface DestinoCatalogo {
  codigo: CodigoDestino;
  nombre: string;
}

export interface RutasYDestinos {
  rutas: RutaCatalogo[];
  destinos: DestinoCatalogo[];
}

/** Lo que las pantallas de lotes necesitan para nombrar etapas, rutas y destinos. */
export interface CatalogoRecorrido extends RutasYDestinos {
  etapas: EtapaCatalogo[];
}

/** Fila de `GET lotes/`. */
export interface LoteFila {
  id: number;
  codigo: string;
  nombre: string;
  estado: EstadoLote;
  tipo_mineral: number;
  tipo_mineral_nombre: string;
  fecha_apertura: string;
  fecha_inicio_recorrido: string | null;
  ruta: RutaLote;
  destino: DestinoLote;
  ingresos: number;
  /** Decimal en cadena (D-F17). */
  toneladas: string;
}

export interface FiltroLotes {
  estado: EstadoLote | null;
  tipo_mineral: number | null;
  desde: string;
  hasta: string;
}

export interface IngresoDeComposicion {
  id: number;
  codigo: string;
  fecha_hora_pesaje: string;
  peso_neto_tn: string | null;
  estado: EstadoIngreso;
  /** Llegó después de que el lote empezó su recorrido (HU-M06-01 CA12). */
  tardio: boolean;
  /** El tardío ya pasó el secado del lote: necesita el suyo (CA13). */
  secado_propio: boolean;
  otro_mineral: boolean;
}

export interface ComposicionMineral {
  tipo_mineral: { id: number; codigo: string; nombre: string };
  /** DR-27: «Otro mineral», con la autorización con que se agregó. */
  otro_mineral: boolean;
  autorizacion: string | null;
  ingresos: IngresoDeComposicion[];
  cantidad: number;
  toneladas: string;
}

export interface ParteLote {
  id: number;
  nombre: string;
  /** Texto escrito por el usuario: `1/3`, `0.5`. */
  fraccion: string;
  ruta: CodigoRuta;
  ruta_texto: string;
  toneladas_aproximadas: string;
  /** Siempre `true`: nunca se suma a un total (RNF-M06-09). */
  es_estimacion: boolean;
}

export interface PasoRecorrido {
  id: number;
  etapa: CodigoEtapa;
  etapa_texto: string;
  carga: string;
  parte: number | null;
  ingreso_tardio: number | null;
  fecha_hora: string;
  usuario: string;
  horas_molienda: string | null;
  observacion: string;
}

export interface RegistroBigbags {
  id: number;
  parte: number | null;
  cantidad: number;
  peso_aproximado_tn: string;
  recalculado: boolean;
  es_estimacion: boolean;
  fecha_hora: string;
}

/** Lo único que se ofrece registrar en una carga (RNF-M06-07). */
export interface SiguientePaso {
  carga: string;
  parte: number | null;
  ingreso: number | null;
  etapa: CodigoEtapa | null;
  /** Después del secado se pide la ruta en lugar de la etapa. */
  elegir_ruta: boolean;
}

/** `GET lotes/{id}/`. */
export interface Lote {
  id: number;
  codigo: string;
  nombre: string;
  estado: EstadoLote;
  fecha_apertura: string;
  fecha_inicio_recorrido: string | null;
  ruta: RutaLote;
  destino: DestinoLote;
  destino_texto: string;
  observacion_cierre: string;
  fecha_cierre: string | null;
  usuario_cierre: string | null;
  composicion: ComposicionMineral[];
  total: { ingresos: number; toneladas: string };
  partes: ParteLote[];
  recorrido: PasoRecorrido[];
  bigbags: RegistroBigbags[];
  siguientes: SiguientePaso[];
  /** Textos de lo que falta para poder cerrar. */
  pendientes: string[];
}

/** Lo calculado por el servidor al registrar una etapa. */
export interface PasoCalculado {
  id: number;
  etapa: CodigoEtapa;
  carga: string;
  toneladas_por_hora?: string;
  bigbags?: { cantidad: number; peso_aproximado_tn: string; recalculado: boolean };
}

export type RespuestaLote = ConMensaje<Lote>;
export type RespuestaEtapa = RespuestaLote & { paso: PasoCalculado };
export type RespuestaBigbags = RespuestaLote & {
  registro: { cantidad: number; peso_aproximado_tn: string; recalculado: boolean };
};

export interface IngresoDisponible {
  id: number;
  codigo: string;
  placa: string;
  fecha_hora_pesaje: string;
  peso_neto_tn: string;
  /** Código del lote donde está hoy, si ya está en otro. */
  lote_actual: string | null;
}

export interface DisponiblesLote {
  ingresos: IngresoDisponible[];
  otros_minerales: {
    tipo_mineral: { id: number; codigo: string; nombre: string };
    ingresos: IngresoDisponible[];
  }[];
}

export interface ParteResumen {
  nombre: string;
  ruta: CodigoRuta | null;
  fraccion: string;
  toneladas_aproximadas: string;
  horas_molienda: string | null;
  toneladas_por_hora: string | null;
}

/** `GET lotes/{id}/resumen/`: lo que se confirma antes de cerrar (HU-M06-05 CA06). */
export interface ResumenLote {
  pendientes: string[];
  toneladas_registradas: string;
  bigbags: number;
  ensacado_aproximado_tn: string;
  /** Estimación: ensacado aproximado menos lo registrado (RNF-M06-09). */
  diferencia_tn: string;
  es_estimacion: boolean;
  partes: ParteResumen[];
  horas_desde_apertura: number | null;
  horas_desde_inicio: number | null;
  ultimo_ensacado: string | null;
}

/* Cuerpos de las operaciones. */

export interface NuevoLote {
  nombre: string;
  tipo_mineral: number | null;
  fecha_apertura?: string | null;
}

export interface CuerpoBigbags {
  parte?: number | null;
  cantidad: number | null;
  recalcular?: boolean;
  peso_aproximado_tn?: string | null;
}

export interface CuerpoEtapa {
  etapa?: CodigoEtapa | null;
  ruta?: CodigoRuta | null;
  parte?: number | null;
  ingreso?: number | null;
  fecha_hora?: string | null;
  horas_molienda?: string | null;
  observacion?: string;
  bigbags?: CuerpoBigbags | null;
}

export interface FraccionParte {
  parte: number;
  fraccion: string;
}

export interface CuerpoSecadoPropio {
  fecha_hora?: string | null;
  observacion?: string;
  fracciones?: FraccionParte[];
}

export interface ParteNueva {
  nombre: string;
  fraccion: string;
  ruta: CodigoRuta | '';
}

export interface CuerpoCierre {
  destino: CodigoDestino | null;
  observacion?: string;
}

export interface CuerpoAsignar {
  ingresos: number[];
  autorizacion?: string;
}

/** Texto de cada destino de cierre (docs/contrato-api.md §5.1: `rutas/` → `destinos`). */
export const ETIQUETA_DESTINO: Readonly<Record<CodigoDestino, string>> = {
  VENTA: 'Venta',
  TRASLADO: 'Traslado a otro punto',
};
