import { crearParametros } from './parametros-http';

describe('crearParametros', () => {
  it('omite lo vacío y convierte los booleanos a 1/0', () => {
    const parametros = crearParametros({
      rol: 'SUPERVISOR',
      placa: '',
      titularidad: null,
      x: undefined,
      incluir_inactivos: true,
      page: 2,
    });

    expect(parametros.keys().sort()).toEqual(['incluir_inactivos', 'page', 'rol']);
    expect(parametros.get('incluir_inactivos')).toBe('1');
    expect(parametros.get('page')).toBe('2');
  });

  it('envía falso como 0', () => {
    expect(crearParametros({ activo: false }).get('activo')).toBe('0');
  });
});
