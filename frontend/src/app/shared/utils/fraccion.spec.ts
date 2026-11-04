import { parsearFraccion, sumarFracciones, textoSuma } from './fraccion';

describe('fracciones del lote', () => {
  it('lee las formas en que se escribe una fracción', () => {
    expect(parsearFraccion('1/2')).toBe(0.5);
    expect(parsearFraccion('0.25')).toBe(0.25);
    expect(parsearFraccion('0,25')).toBe(0.25);
    expect(parsearFraccion(' 1 ')).toBe(1);
    expect(parsearFraccion('1/3')).toBeCloseTo(0.3333, 4);
  });

  it('lo que no es una fracción es nulo, no cero', () => {
    for (const texto of ['', '  ', 'abc', '1/0', '1/2/3', '-1/2']) {
      expect(parsearFraccion(texto)).toBeNull();
    }
  });

  it('1/3 + 1/3 + 1/3 cierra la unidad sin ruido de coma flotante', () => {
    const suma = sumarFracciones(['1/3', '1/3', '1/3']);
    expect(suma.completa).toBeTrue();
    expect(suma.hayIlegibles).toBeFalse();
  });

  it('dice cuánto falta cuando no suman, como en el ejemplo del guion (0,9)', () => {
    const suma = sumarFracciones(['0.5', '0.4']);
    expect(suma.completa).toBeFalse();
    expect(textoSuma(suma.suma)).toBe('0.9');
    expect(textoSuma(suma.falta)).toBe('0.1');
  });

  it('una suma que se pasa de la unidad da un faltante negativo', () => {
    const suma = sumarFracciones(['0.7', '0.5']);
    expect(suma.completa).toBeFalse();
    expect(suma.falta).toBeLessThan(0);
  });

  it('señala la fracción ilegible y no la cuenta; las vacías se ignoran', () => {
    const suma = sumarFracciones(['1/2', 'xx', '']);
    expect(suma.hayIlegibles).toBeTrue();
    expect(suma.suma).toBe(0.5);
    expect(suma.completa).toBeFalse();
  });
});
