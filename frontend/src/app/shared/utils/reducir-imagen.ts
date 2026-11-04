/** Lado mayor de la imagen que se envía: sobra para leer un ticket impreso (RNF-M03-04). */
export const LADO_MAXIMO_PX = 1600;
export const CALIDAD_JPEG = 0.8;
/** Por debajo de este peso no se reduce: ya es liviana y cada recompresión pierde nitidez. */
export const PESO_SIN_REDUCIR_BYTES = 1_000_000;

export interface Dimensiones {
  ancho: number;
  alto: number;
}

/** Escala para que el lado mayor no pase de `ladoMaximo`, conservando la proporción. */
export function calcularDimensiones(ancho: number, alto: number, ladoMaximo = LADO_MAXIMO_PX): Dimensiones {
  const lado = Math.max(ancho, alto);
  if (lado <= ladoMaximo) {
    return { ancho, alto };
  }
  const escala = ladoMaximo / lado;
  return { ancho: Math.round(ancho * escala), alto: Math.round(alto * escala) };
}

/**
 * Reduce la fotografía antes de enviarla: una foto de teléfono pasa de 5 MB y casi todo ese
 * peso es irrelevante para leer el ticket. Sin librería: `createImageBitmap` respeta la
 * orientación EXIF y `canvas` reescala.
 *
 * Si el archivo no se puede decodificar (no es una imagen) o la reducción no lo achica, se
 * devuelve el original: el servidor lo rechaza con su mensaje literal (HU-M03-01 CA07).
 */
export async function reducirImagen(archivo: Blob): Promise<Blob> {
  if (archivo.size <= PESO_SIN_REDUCIR_BYTES) {
    return archivo;
  }
  try {
    const mapa = await createImageBitmap(archivo);
    const { ancho, alto } = calcularDimensiones(mapa.width, mapa.height);
    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;
    lienzo.getContext('2d')?.drawImage(mapa, 0, 0, ancho, alto);
    mapa.close();
    const reducida = await aBlob(lienzo);
    return reducida && reducida.size < archivo.size ? reducida : archivo;
  } catch {
    return archivo;
  }
}

function aBlob(lienzo: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolver) => lienzo.toBlob(resolver, 'image/jpeg', CALIDAD_JPEG));
}
