import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

/** Archivo descargado de la API: el nombre lo decide el servidor (`Content-Disposition`). */
export interface ArchivoDescargado {
  nombre: string;
  contenido: Blob;
}

/**
 * Descarga de exportaciones (listado en CSV, consolidado en XLSX). El error de una descarga
 * llega como JSON dentro de un `Blob`; lo traduce el interceptor de errores (D-F14).
 */
@Injectable({ providedIn: 'root' })
export class DescargaService {
  private readonly http = inject(HttpClient);
  private readonly documento = inject(DOCUMENT);

  obtener(url: string, parametros?: HttpParams): Observable<ArchivoDescargado> {
    return this.http
      .get(url, { params: parametros, responseType: 'blob', observe: 'response' })
      .pipe(
        map((respuesta) => ({ nombre: nombreDeArchivo(respuesta), contenido: respuesta.body ?? new Blob() })),
      );
  }

  /** Entrega el archivo al navegador como una descarga normal. */
  guardar({ nombre, contenido }: ArchivoDescargado): void {
    const url = URL.createObjectURL(contenido);
    const enlace = this.documento.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    URL.revokeObjectURL(url);
  }
}

const NOMBRE_POR_DEFECTO = 'descarga';

export function nombreDeArchivo(respuesta: HttpResponse<unknown>): string {
  const disposicion = respuesta.headers.get('Content-Disposition') ?? '';
  const coincidencia = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposicion);
  return coincidencia ? decodeURIComponent(coincidencia[1]) : NOMBRE_POR_DEFECTO;
}
