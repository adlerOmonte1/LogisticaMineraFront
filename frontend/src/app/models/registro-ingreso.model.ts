import { Inconsistencia } from './error-api.model';
import { MotivoSinFoto } from './ingreso.model';
import { Vehiculo } from './vehiculo.model';

/** Nombres de campo que devuelve el reconocimiento (`reconocimiento/dominio.py`). */
export type NombreCampoReconocido = 'PLACA' | 'FECHA' | 'PESO_BRUTO';

export interface CampoReconocidoPropuesto {
  nombre: NombreCampoReconocido;
  valor: string | null;
  confianza: number | null;
  /** Bajo el umbral: se resalta y se muestra su `aviso` literal (HU-M04-01 CA02). */
  dudoso: boolean;
  aviso: string | null;
}

export interface ReconocimientoPropuesto {
  exito: boolean;
  motor: string;
  version_motor: string;
  umbral_confianza: number;
  /** Texto literal si la imagen fue ilegible o el motor no respondió (CA04, CA05). */
  aviso: string | null;
  campos: CampoReconocidoPropuesto[];
}

export interface PropuestaIngreso {
  placa: string | null;
  fecha: string | null;
  peso_bruto_tn: string | null;
  /** `HH:MM`, propuesta por el servidor con la hora actual (HU-M03-01 CA10). */
  hora: string;
  hora_es_propuesta: boolean;
}

/** El vehículo tal como lo resume el borrador. El `Vehiculo` del catálogo lo cumple. */
export type VehiculoBreve = Pick<
  Vehiculo,
  'id' | 'placa' | 'titularidad' | 'capacidad_tn' | 'tara_tn' | 'pendiente_destare' | 'activo'
>;

/**
 * Respuesta de `POST ingresos/borradores/` (D-25). Nada de esto está persistido todavía
 * (D-13): el `borrador` es un token firmado que se devuelve tal cual al confirmar.
 */
export interface BorradorIngreso {
  borrador: string;
  hora_inicio_registro: string;
  sin_respaldo_fotografico: boolean;
  motivo_sin_respaldo: MotivoSinFoto | null;
  reconocimiento: ReconocimientoPropuesto | null;
  propuesta: PropuestaIngreso;
  vehiculo: VehiculoBreve | null;
  aviso_placa: string | null;
  inconsistencias: Inconsistencia[];
  puede_agregar_tipo_mineral: boolean;
  aviso_tipo_mineral: string | null;
}

/** El vehículo que corresponde a la placa que el usuario tiene escrita ahora. */
export interface ConsultaVehiculo {
  placa: string;
  vehiculo: VehiculoBreve | null;
  /** No se pudo consultar el catálogo: no es lo mismo que «no está registrada». */
  fallo?: boolean;
}

export type PasoRegistro = 'captura' | 'revision' | 'confirmado';

/** Lo que el usuario confirma o corrige en la revisión. */
export interface CamposRegistro {
  placa: string;
  fecha: string;
  hora: string;
  peso_bruto_tn: string;
  tipo_mineral: number | null;
}

/** Justificaciones por regla: `{"V1": "…", "V4": "…"}` (D-25). */
export type JustificacionesPorRegla = Record<string, string>;

export interface ConfirmacionIngreso {
  borrador: string;
  placa: string;
  fecha: string;
  hora: string;
  peso_bruto_tn: string;
  /** Puede ir vacío: el servidor lo reclama con su mensaje literal (HU-M03-01 CA03). */
  tipo_mineral: number | null;
  justificaciones: JustificacionesPorRegla;
}
