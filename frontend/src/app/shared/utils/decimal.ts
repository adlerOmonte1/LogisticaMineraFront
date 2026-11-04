const DECIMAL = /^(\d+)(?:\.(\d{1,2}))?$/;

/**
 * Aritmética de toneladas en centésimas enteras. Los decimales llegan como cadena (D-F17) y
 * una resta en coma flotante puede dar `9.499999`; aquí nunca ocurre.
 */
export function aCentesimas(valor: string | null | undefined): number | null {
  const coincidencia = DECIMAL.exec((valor ?? '').trim().replace(',', '.'));
  if (!coincidencia) {
    return null;
  }
  return Number(coincidencia[1]) * 100 + Number((coincidencia[2] ?? '').padEnd(2, '0'));
}

export function deCentesimas(centesimas: number): string {
  const signo = centesimas < 0 ? '-' : '';
  const absoluto = Math.abs(centesimas);
  return `${signo}${Math.floor(absoluto / 100)}.${String(absoluto % 100).padStart(2, '0')}`;
}

/**
 * Peso neto de referencia: bruto − tara. Es una vista previa para el usuario; el neto real lo
 * calcula el servidor al registrar (D-17). `null` si falta un dato.
 */
export function calcularNeto(
  bruto: string | null | undefined,
  tara: string | null | undefined,
): string | null {
  const pesoBruto = aCentesimas(bruto);
  const pesoTara = aCentesimas(tara);
  return pesoBruto === null || pesoTara === null ? null : deCentesimas(pesoBruto - pesoTara);
}
