import { HttpErrorResponse } from '@angular/common/http';

import { CODIGO_ERROR, ErrorApi, Inconsistencia, JustificacionFaltante } from '@models/error-api.model';
import { TEXTO_ERROR } from './textos-error';

interface CuerpoUniforme {
  codigo: string;
  mensaje: string;
  detalles?: unknown;
}

/** Claves de `detalles` con forma propia: no son errores de un campo de DRF. */
const CLAVES_PROPIAS = new Set(['campos', 'inconsistencias', 'justificaciones_faltantes']);

/**
 * Convierte cualquier `HttpErrorResponse` en un `ErrorApi`. Es asíncrona porque el error de
 * una descarga llega dentro de un `Blob` que hay que leer.
 */
export async function traducirErrorHttp(error: HttpErrorResponse): Promise<ErrorApi> {
  if (error.status === 0) {
    return new ErrorApi(0, CODIGO_ERROR.sinConexion, TEXTO_ERROR.sinConexion);
  }
  const cuerpo = await leerCuerpo(error.error);
  if (!esCuerpoUniforme(cuerpo)) {
    return error.status >= 500
      ? new ErrorApi(error.status, CODIGO_ERROR.errorDelServidor, TEXTO_ERROR.servidor)
      : new ErrorApi(error.status, 'ERROR', TEXTO_ERROR.inesperado);
  }
  return desdeCuerpoUniforme(error.status, cuerpo);
}

export function desdeCuerpoUniforme(status: number, { codigo, mensaje, detalles }: CuerpoUniforme): ErrorApi {
  const registro = esRegistro(detalles) ? detalles : {};
  return new ErrorApi(
    status,
    codigo,
    mensaje,
    camposConError(registro),
    listaDeTextos(registro['campos']),
    listaDe<Inconsistencia>(registro['inconsistencias']),
    listaDe<JustificacionFaltante>(registro['justificaciones_faltantes']),
    detalles ?? null,
  );
}

/** Forma de DRF: `{campo: ["texto", …]}`. Une los textos de cada campo. */
function camposConError(detalles: Record<string, unknown>): Record<string, string> {
  const resultado: Record<string, string> = {};
  for (const [campo, valor] of Object.entries(detalles)) {
    if (CLAVES_PROPIAS.has(campo)) {
      continue;
    }
    const textos = listaDeTextos(valor);
    if (textos.length > 0) {
      resultado[campo] = textos.join(' ');
    } else if (typeof valor === 'string') {
      resultado[campo] = valor;
    }
  }
  return resultado;
}

async function leerCuerpo(cuerpo: unknown): Promise<unknown> {
  if (cuerpo instanceof Blob) {
    return interpretarJson(await cuerpo.text());
  }
  if (typeof cuerpo === 'string') {
    return interpretarJson(cuerpo);
  }
  return cuerpo;
}

function interpretarJson(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

function esCuerpoUniforme(valor: unknown): valor is CuerpoUniforme {
  return esRegistro(valor) && typeof valor['codigo'] === 'string' && typeof valor['mensaje'] === 'string';
}

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function listaDeTextos(valor: unknown): string[] {
  return Array.isArray(valor) ? valor.filter((x): x is string => typeof x === 'string') : [];
}

function listaDe<T>(valor: unknown): T[] {
  return Array.isArray(valor) ? (valor as T[]) : [];
}
