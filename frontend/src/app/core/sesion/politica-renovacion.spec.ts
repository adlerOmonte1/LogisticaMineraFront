import { MARGEN_RENOVACION_MS, debeRenovar } from './politica-renovacion';

describe('debeRenovar', () => {
  const ahora = 1_000_000_000;
  const minuto = 60_000;

  it('renueva si el access está por vencer y el usuario trabajó dentro del margen', () => {
    expect(
      debeRenovar({ ahora, vencimientoAccess: ahora + 2 * minuto, ultimaActividad: ahora - minuto }),
    ).toBeTrue();
  });

  it('no renueva si falta mucho para que venza', () => {
    expect(
      debeRenovar({ ahora, vencimientoAccess: ahora + 20 * minuto, ultimaActividad: ahora }),
    ).toBeFalse();
  });

  it('no renueva a un usuario inactivo: la sesión debe expirar (HU-M01-01 CA06)', () => {
    expect(
      debeRenovar({
        ahora,
        vencimientoAccess: ahora + minuto,
        ultimaActividad: ahora - MARGEN_RENOVACION_MS - 1,
      }),
    ).toBeFalse();
  });

  it('no renueva un token vencido ni uno ilegible: decide el servidor', () => {
    expect(debeRenovar({ ahora, vencimientoAccess: ahora - 1, ultimaActividad: ahora })).toBeFalse();
    expect(debeRenovar({ ahora, vencimientoAccess: null, ultimaActividad: ahora })).toBeFalse();
  });
});
