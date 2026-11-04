/**
 * Fracciones de un lote, escritas como el usuario las piensa: `1/3`, `0.5`, `0,25`, `1`
 * (RNF-M06-10). Solo sirven para **mostrar** cuánto suman antes de enviar; el servidor tiene la
 * última palabra y rechaza lo que no cierra la unidad con su mensaje (HU-M06-04 CA04).
 */
export function parsearFraccion(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.');
  if (!limpio) {
    return null;
  }
  const partes = limpio.split('/');
  if (partes.length > 2) {
    return null;
  }
  const numerador = Number(partes[0]);
  const denominador = partes.length === 2 ? Number(partes[1]) : 1;
  if (!Number.isFinite(numerador) || !Number.isFinite(denominador) || denominador === 0) {
    return null;
  }
  const valor = numerador / denominador;
  return valor >= 0 ? valor : null;
}

export interface SumaFracciones {
  /** Suma de las fracciones que se pudieron leer. */
  suma: number;
  /** Cuánto falta para llegar a la unidad (negativo si se pasa). */
  falta: number;
  /** `true` si alguna fracción escrita no se pudo leer. */
  hayIlegibles: boolean;
  /** `true` si la suma cierra la unidad (con tolerancia de redondeo). */
  completa: boolean;
}

const TOLERANCIA = 1e-6;

export function sumarFracciones(textos: readonly string[]): SumaFracciones {
  let suma = 0;
  let hayIlegibles = false;
  for (const texto of textos) {
    if (!texto.trim()) {
      continue;
    }
    const valor = parsearFraccion(texto);
    if (valor === null) {
      hayIlegibles = true;
    } else {
      suma += valor;
    }
  }
  const falta = 1 - suma;
  return { suma, falta, hayIlegibles, completa: !hayIlegibles && Math.abs(falta) < TOLERANCIA };
}

/** `0.3333` → `0.333`: para mostrar sumas sin ruido de coma flotante. */
export function textoSuma(valor: number): string {
  return String(Math.round(valor * 1000) / 1000);
}
