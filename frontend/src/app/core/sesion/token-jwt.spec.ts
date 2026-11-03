import { crearToken } from '../../testing/fabricas';
import { leerVencimientoMs } from './token-jwt';

describe('leerVencimientoMs', () => {
  it('lee exp del JWT en milisegundos', () => {
    expect(leerVencimientoMs(crearToken(1_800_000_000_000))).toBe(1_800_000_000_000);
  });

  it('devuelve null con un token ilegible', () => {
    expect(leerVencimientoMs('no-es-un-jwt')).toBeNull();
    expect(leerVencimientoMs('a.%%%.c')).toBeNull();
    expect(leerVencimientoMs(`a.${btoa('{"sub":1}')}.c`)).toBeNull();
  });
});
