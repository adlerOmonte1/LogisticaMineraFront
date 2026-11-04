import { CODIGO_ERROR, ErrorApi } from '@models/error-api.model';
import { TEXTO_ERROR } from './textos-error';
import { comoErrorApi } from './error-inesperado';

describe('comoErrorApi', () => {
  it('deja pasar un ErrorApi sin tocarlo', () => {
    const error = new ErrorApi(400, 'X', 'literal');
    expect(comoErrorApi(error)).toBe(error);
  });

  it('convierte una falla de programación en un aviso de la interfaz y la registra', () => {
    spyOn(console, 'error');
    const resultado = comoErrorApi(new TypeError('falla'));
    expect(resultado.codigo).toBe(CODIGO_ERROR.inesperado);
    expect(resultado.mensaje).toBe(TEXTO_ERROR.inesperado);
    expect(console.error).toHaveBeenCalled();
  });
});
