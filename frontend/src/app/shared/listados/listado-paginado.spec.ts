import { Subject, of, throwError } from 'rxjs';

import { ErrorApi } from '@models/error-api.model';
import { Pagina } from '@models/pagina.model';
import { paginaDe } from '../../testing/fabricas';
import { ListadoPaginado } from './listado-paginado';

interface Filtro {
  rol: string | null;
}

describe('ListadoPaginado', () => {
  it('carga con el filtro y la página actuales', () => {
    const cargador = jasmine.createSpy('cargador').and.returnValue(of(paginaDe(['a', 'b'])));
    const listado = new ListadoPaginado<string, Filtro>(cargador, { rol: null });

    listado.cargar();

    expect(cargador).toHaveBeenCalledWith({ rol: null }, 1);
    expect(listado.filas()).toEqual(['a', 'b']);
    expect(listado.total()).toBe(2);
    expect(listado.vacio()).toBeFalse();
    expect(listado.cargando()).toBeFalse();
  });

  it('filtrar vuelve a la primera página', () => {
    const cargador = jasmine.createSpy('cargador').and.returnValue(of(paginaDe<string>([])));
    const listado = new ListadoPaginado<string, Filtro>(cargador, { rol: null });

    listado.irAPagina(3);
    listado.filtrar({ rol: 'SUPERVISOR' });

    expect(cargador.calls.mostRecent().args).toEqual([{ rol: 'SUPERVISOR' }, 1]);
    expect(listado.vacio()).toBeTrue();
  });

  it('una consulta nueva cancela la anterior: una respuesta lenta no pisa a la reciente', () => {
    const lenta = new Subject<Pagina<string>>();
    const cargador = jasmine.createSpy('cargador').and.returnValues(lenta, of(paginaDe(['reciente'])));
    const listado = new ListadoPaginado<string, Filtro>(cargador, { rol: null });

    listado.cargar();
    listado.cargar();
    lenta.next(paginaDe(['vieja']));

    expect(listado.filas()).toEqual(['reciente']);
  });

  it('guarda el ErrorApi de una carga fallida', () => {
    const error = new ErrorApi(500, 'ERROR_DEL_SERVIDOR', 'falla');
    const listado = new ListadoPaginado<string, Filtro>(() => throwError(() => error), { rol: null });

    listado.cargar();

    expect(listado.error()).toBe(error);
    expect(listado.cargando()).toBeFalse();
  });
});
