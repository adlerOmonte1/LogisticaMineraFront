import { NombreCampoReconocido } from './registro-ingreso.model';

/** Un campo ya guardado: lo reconocido frente a lo confirmado (`CampoReconocidoSerializer`). */
export interface CampoReconocidoGuardado {
  nombre_campo: NombreCampoReconocido;
  valor_reconocido: string | null;
  valor_confirmado: string | null;
  confianza: string | null;
  fue_corregido: boolean;
  dudoso: boolean;
}

/** Reconocimiento persistido de un ingreso (`ReconocimientoSerializer`, HU-M04-02). */
export interface Reconocimiento {
  id: number;
  ingreso: number;
  codigo_ingreso: string;
  motor: string;
  version_motor: string;
  fecha_proceso: string;
  umbral_confianza: string;
  exito: boolean;
  causa_fallo: string;
  motivo_fallo: string | null;
  campos: CampoReconocidoGuardado[];
  puede_corregir_ingreso: boolean;
}
