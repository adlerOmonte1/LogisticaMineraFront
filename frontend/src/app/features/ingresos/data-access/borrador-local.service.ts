import { Injectable } from '@angular/core';
import { DBSchema, IDBPDatabase, openDB } from 'idb';

import { MotivoSinFoto } from '@models/ingreso.model';
import { BorradorIngreso, CamposRegistro, JustificacionesPorRegla } from '@models/registro-ingreso.model';

export type PasoPersistido = 'captura' | 'revision';

/**
 * El registro en curso (RNF-M03-05). Guarda la imagen reducida y lo que el usuario editó para
 * que, si se pierde la señal o se recarga la página, retome sin volver a fotografiar.
 * Nunca se reenvía solo: el ingreso siempre lo confirma una persona (D-F15).
 */
export interface BorradorLocal {
  usuarioId: number;
  paso: PasoPersistido;
  imagen: Blob | null;
  sinFoto: MotivoSinFoto | null;
  /** Lo que devolvió `POST ingresos/borradores/`; `null` si el envío de la imagen falló. */
  propuesta: BorradorIngreso | null;
  campos: CamposRegistro | null;
  justificaciones: JustificacionesPorRegla;
  actualizado: string;
}

interface EsquemaConsmin extends DBSchema {
  'registro-en-curso': { key: string; value: BorradorLocal };
}

const NOMBRE_BD = 'consmin';
const VERSION_BD = 1;
const ALMACEN = 'registro-en-curso';
const CLAVE = 'actual';

/**
 * Persistencia del borrador en IndexedDB. Si el navegador no la ofrece —modo privado, cuota—
 * el registro continúa sin borrador: nunca se interrumpe por esto.
 */
@Injectable({ providedIn: 'root' })
export class BorradorLocalService {
  private conexion: Promise<IDBPDatabase<EsquemaConsmin>> | null = null;

  /** Devuelve el borrador del usuario; el de otro usuario se descarta (cuenta compartida). */
  async leer(usuarioId: number): Promise<BorradorLocal | null> {
    try {
      const borrador = await (await this.abrir()).get(ALMACEN, CLAVE);
      if (borrador && borrador.usuarioId !== usuarioId) {
        await this.descartar();
        return null;
      }
      return borrador ?? null;
    } catch {
      return null;
    }
  }

  async guardar(borrador: BorradorLocal): Promise<void> {
    try {
      await (await this.abrir()).put(ALMACEN, borrador, CLAVE);
    } catch {
      // Sin almacenamiento: el registro sigue, solo que sin borrador.
    }
  }

  async descartar(): Promise<void> {
    try {
      await (await this.abrir()).delete(ALMACEN, CLAVE);
    } catch {
      // Nada que descartar.
    }
  }

  private abrir(): Promise<IDBPDatabase<EsquemaConsmin>> {
    this.conexion ??= openDB<EsquemaConsmin>(NOMBRE_BD, VERSION_BD, {
      upgrade: (bd) => bd.createObjectStore(ALMACEN),
    });
    return this.conexion;
  }
}
