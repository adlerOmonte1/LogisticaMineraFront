import { CODIGO_ERROR, ErrorApi, esErrorApi } from '@models/error-api.model';
import { TEXTO_ERROR } from './textos-error';

/**
 * Lo que llega a un `catch` o a un `error:` puede no ser un `ErrorApi`: una falla de programación,
 * por ejemplo. Se registra en consola y se informa con un texto de la interfaz, para que el
 * usuario nunca vea una pantalla congelada sin explicación.
 */
export function comoErrorApi(error: unknown): ErrorApi {
  if (esErrorApi(error)) {
    return error;
  }
  console.error(error);
  return new ErrorApi(0, CODIGO_ERROR.inesperado, TEXTO_ERROR.inesperado);
}
