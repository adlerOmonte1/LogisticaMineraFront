import { cambiosRespectoDe } from './cambios';
import { normalizarPlaca } from './placa';

interface Valor {
  placa: string;
  capacidad_tn: string;
  transportista: number | null;
}

describe('cambiosRespectoDe', () => {
  it('devuelve solo lo que cambió, sin distinguir null de vacío ni espacios', () => {
    const original: Valor = { placa: 'ABC-123', capacidad_tn: '30.00', transportista: null };
    expect(
      cambiosRespectoDe<Valor>(original, { placa: 'ABC-123 ', capacidad_tn: '32.00', transportista: null }),
    ).toEqual({
      capacidad_tn: '32.00',
    });
    expect(cambiosRespectoDe<Valor>(original, { ...original })).toEqual({});
  });
});

describe('normalizarPlaca', () => {
  it('pasa a mayúsculas y quita espacios, sin validar el formato', () => {
    expect(normalizarPlaca(' abc 123 ')).toBe('ABC123');
    expect(normalizarPlaca('a1b-2c3')).toBe('A1B-2C3');
  });
});
