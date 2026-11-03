export type Titularidad = 'PROPIO' | 'EXTERNO';

export const ETIQUETA_TITULARIDAD: Readonly<Record<Titularidad, string>> = {
  PROPIO: 'Propio',
  EXTERNO: 'Externo',
};

/** Recurso del vehículo (`VehiculoSerializer`). Se recibe con `titularidad`. */
export interface Vehiculo {
  id: number;
  placa: string;
  titularidad: Titularidad;
  capacidad_tn: string;
  transportista: number | null;
  transportista_nombre: string | null;
  tara_tn: string | null;
  fecha_destare: string | null;
  usuario_destare: string | null;
  pendiente_destare: boolean;
  activo: boolean;
}

/** Alta y edición. Se envía con `tipo_titularidad` (asimetría del backend). Sin tara. */
export interface NuevoVehiculo {
  placa: string;
  tipo_titularidad: Titularidad;
  capacidad_tn: string;
  transportista: number | null;
}

export type CambiosVehiculo = Partial<NuevoVehiculo>;

/** Cambio de tara, solo del Administrador (HU-M02-01 CA09 a CA11). */
export interface CambioTara {
  tara_tn: string;
  motivo: string;
}

export interface FiltroVehiculos {
  titularidad?: Titularidad | null;
  activo?: boolean | null;
  placa?: string | null;
}
