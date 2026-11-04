import { EstadoIngreso } from './ingreso.model';
import { Pagina } from './pagina.model';
import { Titularidad } from './vehiculo.model';

/** Fila de listado, búsqueda, calendario e inicio (docs/contrato-api.md §6). */
export interface FilaIngreso {
  id: number;
  codigo: string;
  fecha_hora_pesaje: string;
  placa: string;
  tipo_vehiculo: Titularidad;
  tipo_mineral: string;
  peso_bruto_tn: string;
  /** `null` mientras el ingreso espera el destare. */
  peso_neto_tn: string | null;
  pendiente_destare: boolean;
  estado: EstadoIngreso;
  estado_texto: string;
  motivo_anulacion: string | null;
  sin_respaldo_fotografico: boolean;
  motivo_sin_respaldo: string | null;
}

/** Totales del conjunto filtrado: `toneladas` no suma anulados ni En proceso (HU-M07-02 CA03). */
export interface TotalesIngresos {
  ingresos: number;
  registrados: number;
  en_proceso: number;
  anulados: number;
  toneladas: string;
}

/** Respuesta de `GET consulta/ingresos/` (búsqueda y listado comparten forma). */
export interface ResultadoConsulta extends Pagina<FilaIngreso> {
  totales: TotalesIngresos;
  /** Rango que aplicó el servidor; sin fechas, el mes en curso (HU-M07-02 CA08). */
  filtros: { fecha_desde: string | null; fecha_hasta: string | null };
  mensaje: string | null;
}

/** Búsqueda por placa y fecha (HU-M07-01). Una fecha sola es un día; con `hasta`, un rango. */
export interface FiltroBusqueda {
  placa: string;
  fecha: string;
  hasta: string;
}

/** Filtros combinables del listado (HU-M07-02 CA02). */
export interface FiltroListado {
  fecha_desde: string;
  fecha_hasta: string;
  tipo_mineral: number | null;
  titularidad: Titularidad | null;
  estado: EstadoIngreso | null;
  /** Texto libre: placa o código (CA10). */
  q: string;
}

export interface DiaCalendario {
  fecha: string;
  ingresos: number;
  toneladas: string;
  con_en_proceso: boolean;
  con_anulados: boolean;
}

export interface DetalleDia {
  fecha: string;
  ingresos: FilaIngreso[];
  mensaje: string | null;
}

export interface CalendarioMes {
  anio: number;
  mes: number;
  dias: DiaCalendario[];
  resumen: { ingresos: number; toneladas: string; dias_con_llegadas: number; en_proceso: number };
  dia?: DetalleDia;
}

/** Resultado de la búsqueda de la cabecera (HU-M07-02 CA16 y CA17). */
export type ResultadoCabecera =
  | { tipo: 'INGRESO'; id: number; codigo: string }
  | { tipo: 'PLACA'; placa: string };

/** Cada cifra del inicio trae su `enlace`, o `null` si el rol no tiene esa pantalla (CA11). */
export interface InicioDia {
  fecha: string;
  ingresos_hoy: {
    cantidad: number;
    ultimo: { hora: string; placa: string } | null;
    mensaje: string | null;
    enlace: string | null;
  };
  toneladas_hoy: { toneladas: string; en_proceso: number; mensaje: string | null; enlace: string | null };
  pendientes_destare: { cantidad: number; placas: string[]; enlace: string | null };
  lotes_en_proceso: { cantidad: number; enlace: string | null };
  ultimos_ingresos: FilaIngreso[];
  ultimos_siete_dias: { fecha: string; toneladas: string }[];
}

export type TipoAviso = 'DESTARE' | 'V4_JUSTIFICADA' | 'LOTE' | 'LOTE_LISTO' | 'SIN_LOTE';

export interface Aviso {
  tipo: TipoAviso;
  titulo: string;
  detalle: string;
  enlace: string;
  ingreso?: number;
  lote?: number;
}

/** `GET consulta/avisos/`: solo lo que el rol puede resolver (HU-M07-04 CA08). */
export interface RespuestaAvisos {
  cantidad: number;
  avisos: Aviso[];
  /** Texto del servidor cuando no hay nada pendiente (CA09). */
  mensaje: string | null;
}
