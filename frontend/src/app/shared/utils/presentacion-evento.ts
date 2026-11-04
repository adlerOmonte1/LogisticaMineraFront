import { AccionEvento, Evento } from '@models/evento.model';
import type { TonoInsignia } from '../components/insignia-estado/insignia-estado.component';
import { FechaLimaPipe } from '../pipes/fecha-lima.pipe';

/** Una cadena vacía o nula se ve igual que un valor ausente: un guion. */
const SIN_VALOR = '—';

const FECHA_HORA_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const FECHA = new FechaLimaPipe();

/**
 * Cómo se lee un valor guardado en un evento (JSON libre del servidor). No se interpreta ni
 * se traduce: solo se vuelve texto, para que «antes» y «después» se comparen a simple vista.
 */
export function textoValor(valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') {
    return SIN_VALOR;
  }
  if (typeof valor === 'boolean') {
    return valor ? 'Sí' : 'No';
  }
  if (Array.isArray(valor)) {
    return valor.length === 0 ? SIN_VALOR : valor.map(textoValor).join(', ');
  }
  if (typeof valor === 'object') {
    return JSON.stringify(valor);
  }
  // Una fecha y hora del servidor se lee en la zona de la planta, no como `…T09:15:00-05:00`.
  if (typeof valor === 'string' && FECHA_HORA_ISO.test(valor)) {
    return FECHA.transform(valor);
  }
  return String(valor);
}

/** Nombres de los campos que más aparecen en los eventos de un ingreso. */
const ETIQUETA_CAMPO: Readonly<Record<string, string>> = {
  codigo: 'Código',
  placa: 'Placa',
  estado: 'Estado',
  tara_tn: 'Tara (t)',
  peso_bruto_tn: 'Peso bruto (t)',
  peso_neto_tn: 'Peso neto (t)',
  tipo_mineral: 'Tipo de mineral',
  fecha_hora_pesaje: 'Fecha y hora del pesaje',
  motivo_sin_respaldo: 'Motivo sin respaldo',
  sin_respaldo_fotografico: 'Sin respaldo fotográfico',
  motivo_anulacion: 'Motivo de la anulación',
};

/** `peso_bruto_tn` → «Peso bruto (t)»; si no está en la lista, el nombre del servidor, legible. */
export function etiquetaCampo(campo: string): string {
  const conocida = ETIQUETA_CAMPO[campo];
  if (conocida) {
    return conocida;
  }
  const texto = campo.replace(/_/g, ' ').trim();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * «Ingreso · ING-2027-00001». Si el servidor no resolvió la referencia (un lote, un registro
 * ya inexistente) se muestra el identificador: `Lote · #12`.
 */
export function textoRegistro(evento: Pick<Evento, 'entidad' | 'referencia' | 'id_entidad'>): string {
  const detalle = evento.referencia ?? (evento.id_entidad === null ? null : `#${evento.id_entidad}`);
  return detalle ? `${evento.entidad} · ${detalle}` : evento.entidad;
}

const TONO_POR_ACCION: Readonly<Record<AccionEvento, TonoInsignia>> = {
  CREAR: 'exito',
  MODIFICAR: 'aviso',
  CORREGIR_DATO: 'aviso',
  ANULAR: 'error',
  ACCESO_RECHAZADO: 'error',
  RECONOCER: 'info',
  EXPORTAR: 'info',
  INICIAR_SESION: 'neutro',
  CERRAR_SESION: 'neutro',
};

/** El tono acompaña al texto de la acción, nunca lo reemplaza (RNF-M07-11). */
export function tonoDeAccion(accion: AccionEvento): TonoInsignia {
  return TONO_POR_ACCION[accion];
}
