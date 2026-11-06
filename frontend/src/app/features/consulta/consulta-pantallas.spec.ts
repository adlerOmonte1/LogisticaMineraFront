import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { TiposMineralApiService } from '@core/catalogo/tipos-mineral-api.service';
import { DescargaService } from '@core/http/descarga.service';
import { RUTAS_PENDIENTES } from '@core/layout/rutas-pendientes';
import { NotificacionService } from '@core/notificacion/notificacion.service';
import { SesionService } from '@core/sesion/sesion.service';
import { FilaIngreso, InicioDia } from '@models/consulta.model';
import { ErrorApi } from '@models/error-api.model';
import { Rol } from '@models/rol.model';
import { estabilizar } from '../../testing/estabilizar';
import {
  crearCalendario,
  crearDetalle,
  crearFilaIngreso,
  crearInicio,
  crearRespuestaLogin,
  crearResultadoConsulta,
  crearTrazabilidad,
} from '../../testing/fabricas';
import { CONSULTA_ROUTES } from './consulta.routes';
import { ConsultaApiService } from './data-access/consulta-api.service';
import { CalendarioPage, celdasPrevias, numeroDeDia } from './pages/calendario/calendario.page';
import { ConsultaPlacaFechaPage } from './pages/consulta-placa-fecha/consulta-placa-fecha.page';
import { InicioPage } from './pages/inicio/inicio.page';
import { ListadoIngresosPage } from './pages/listado-ingresos/listado-ingresos.page';
import { BarrasSemanaComponent } from './ui/barras-semana/barras-semana.component';
import { CifraInicioComponent } from './ui/cifra-inicio/cifra-inicio.component';
import { TablaIngresosComponent } from './ui/tabla-ingresos/tabla-ingresos.component';

function textos(raiz: HTMLElement, prueba: string): string[] {
  return [...raiz.querySelectorAll(`[data-prueba="${prueba}"]`)].map((e) =>
    (e.textContent ?? '').replace(/\s+/g, ' ').trim(),
  );
}

const hay = (raiz: HTMLElement, prueba: string): boolean =>
  raiz.querySelector(`[data-prueba="${prueba}"]`) !== null;

function montar<T>(
  componente: Type<T>,
  proveedores: unknown[] = [],
  entradas: Record<string, unknown> = {},
  rol: Rol = 'ADMINISTRADOR',
) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideNoopAnimations(), ...(proveedores as never[])],
  });
  TestBed.inject(SesionService).iniciar(crearRespuestaLogin(rol));
  const fixture = TestBed.createComponent(componente);
  for (const [nombre, valor] of Object.entries(entradas)) {
    fixture.componentRef.setInput(nombre, valor);
  }
  estabilizar(fixture);
  return { fixture, raiz: fixture.nativeElement as HTMLElement };
}

function espiaConsulta(): jasmine.SpyObj<ConsultaApiService> {
  return jasmine.createSpyObj<ConsultaApiService>('ConsultaApiService', [
    'buscar',
    'listar',
    'exportar',
    'detalleIngreso',
    'ticketIngreso',
    'calendario',
    'inicio',
  ]);
}

afterEach(() => localStorage.clear());

describe('TablaIngresosComponent (RNF-M03-16, HU-M07-01 CA05, CA08, CA09)', () => {
  const tabla = (filas: FilaIngreso[], entradas: Record<string, unknown> = {}) =>
    montar(TablaIngresosComponent, [], { filas, ...entradas });

  it('señala sin abrir el detalle el anulado con su motivo, el En proceso y el sin foto', () => {
    const { raiz } = tabla([
      crearFilaIngreso({ id: 1, estado: 'ANULADO', motivo_anulacion: 'Ticket duplicado' }),
      crearFilaIngreso({ id: 2, estado: 'EN_PROCESO', pendiente_destare: true, peso_neto_tn: null }),
      crearFilaIngreso({ id: 3, sin_respaldo_fotografico: true, motivo_sin_respaldo: 'Sin cámara' }),
    ]);
    const estados = textos(raiz, 'estado');
    expect(estados[0]).toContain('Anulado');
    expect(estados[0]).toContain('Motivo: Ticket duplicado');
    expect(estados[1]).toContain('En proceso');
    expect(estados[2]).toContain('Sin respaldo fotográfico');
  });

  it('un ingreso en proceso dice «Pendiente del destare» en lugar del neto', () => {
    const { raiz } = tabla([
      crearFilaIngreso({ pendiente_destare: true, peso_neto_tn: null, estado: 'EN_PROCESO' }),
    ]);
    expect(textos(raiz, 'neto')).toEqual(['Pendiente del destare']);
    expect(textos(raiz, 'bruto')).toEqual(['32.40 t']);
  });

  it('el código enlaza al detalle y se ve el tipo de vehículo', () => {
    const { raiz } = tabla([crearFilaIngreso()]);
    expect(raiz.querySelector('[data-prueba="codigo"] a')?.getAttribute('href')).toBe(
      '/consulta/ingresos/331',
    );
    expect(textos(raiz, 'placa')).toEqual(['V2K-841']);
    expect(raiz.textContent).toContain('Propio');
  });

  it('la versión compacta omite el pesaje, y «Ver ticket» solo si es seleccionable', () => {
    const completa = tabla([crearFilaIngreso()]);
    expect(hay(completa.raiz, 'pesaje')).toBeTrue();
    expect(hay(completa.raiz, 'ver-ticket')).toBeFalse();
    const compacta = tabla([crearFilaIngreso()], { compacta: true, seleccionable: true });
    expect(hay(compacta.raiz, 'pesaje')).toBeFalse();
    expect(hay(compacta.raiz, 'ver-ticket')).toBeTrue();
  });

  it('elegir una fila emite esa fila', () => {
    const { fixture, raiz } = tabla([crearFilaIngreso()], { seleccionable: true });
    const emitidas: FilaIngreso[] = [];
    fixture.componentInstance.elegir.subscribe((f) => emitidas.push(f));
    raiz.querySelector<HTMLButtonElement>('[data-prueba="ver-ticket"]')?.click();
    expect(emitidas).toEqual([crearFilaIngreso()]);
  });
});

describe('ConsultaPlacaFechaPage (HU-M07-01)', () => {
  let api: jasmine.SpyObj<ConsultaApiService>;

  function pagina(entradas: Record<string, unknown> = {}) {
    api = espiaConsulta();
    api.buscar.and.returnValue(
      of(crearResultadoConsulta([crearFilaIngreso(), crearFilaIngreso({ id: 332 })])),
    );
    api.detalleIngreso.and.returnValue(of(crearDetalle({ trazabilidad: crearTrazabilidad() })));
    api.ticketIngreso.and.returnValue(of(new Blob(['imagen'], { type: 'image/jpeg' })));
    return montar(ConsultaPlacaFechaPage, [{ provide: ConsultaApiService, useValue: api }], entradas);
  }

  function consultar(
    raiz: HTMLElement,
    fixture: { detectChanges: () => void },
    valores: Record<string, string>,
  ): void {
    for (const [campo, valor] of Object.entries(valores)) {
      const entrada = raiz.querySelector<HTMLInputElement>(`[data-prueba="${campo}"]`);
      if (entrada) {
        entrada.value = valor;
        entrada.dispatchEvent(new Event('input'));
      }
    }
    raiz.querySelector<HTMLButtonElement>('[data-prueba="buscar"]')?.click();
    fixture.detectChanges();
  }

  it('al abrir no muestra resultados ni «sin resultados» antes de buscar', () => {
    const { raiz } = pagina();
    expect(api.buscar).not.toHaveBeenCalled();
    expect(hay(raiz, 'fila-ingreso')).toBeFalse();
    expect(raiz.querySelector('[role="status"]')).toBeNull();
  });

  it('busca por placa parcial y fecha; la placa se normaliza a mayúsculas (CA01, CA02)', () => {
    const { fixture, raiz } = pagina();
    consultar(raiz, fixture, { placa: ' v2k ', fecha: '2026-11-03' });
    expect(api.buscar).toHaveBeenCalledOnceWith({ placa: 'V2K', fecha: '2026-11-03', hasta: '' }, 1);
    expect(raiz.querySelectorAll('[data-prueba="fila-ingreso"]').length).toBe(2);
  });

  it('sin criterios envía la búsqueda igual y muestra el mensaje literal del servidor (CA06)', () => {
    const { fixture, raiz } = pagina();
    api.buscar.and.returnValue(
      throwError(() => new ErrorApi(400, 'SIN_CRITERIOS', 'Debe indicar al menos la placa o la fecha')),
    );
    consultar(raiz, fixture, {});
    expect(api.buscar).toHaveBeenCalledWith({ placa: '', fecha: '', hasta: '' }, 1);
    expect(raiz.querySelector('[role=alert]')?.textContent).toContain(
      'Debe indicar al menos la placa o la fecha',
    );
  });

  it('un rango inverso vuelve con el mensaje del servidor (CA12)', () => {
    const { fixture, raiz } = pagina();
    api.buscar.and.returnValue(
      throwError(
        () => new ErrorApi(400, 'RANGO_INVERSO', 'La fecha inicial no puede ser posterior a la fecha final'),
      ),
    );
    consultar(raiz, fixture, { fecha: '2026-11-05', hasta: '2026-11-01' });
    expect(api.buscar.calls.mostRecent().args[0]).toEqual({
      placa: '',
      fecha: '2026-11-05',
      hasta: '2026-11-01',
    });
    expect(raiz.querySelector('[role=alert]')?.textContent).toContain('posterior a la fecha final');
  });

  it('sin resultados muestra el mensaje del servidor como estado vacío (CA04)', () => {
    const { fixture, raiz } = pagina();
    api.buscar.and.returnValue(
      of(crearResultadoConsulta([], { mensaje: 'No se encontraron ingresos con los criterios indicados' })),
    );
    consultar(raiz, fixture, { placa: 'ZZZ' });
    expect(raiz.querySelector('[role="status"]')?.textContent).toContain(
      'No se encontraron ingresos con los criterios indicados',
    );
  });

  it('los criterios que traen la cabecera o el inicio por la URL buscan al llegar', () => {
    const { raiz } = pagina({ placa: 'ABC' });
    expect(api.buscar).toHaveBeenCalledOnceWith({ placa: 'ABC', fecha: '', hasta: '' }, 1);
    expect(raiz.querySelector<HTMLInputElement>('[data-prueba="placa"]')?.value).toBe('ABC');
  });

  it('una placa en minúsculas por la URL se muestra y se busca normalizada', () => {
    const { raiz } = pagina({ placa: 'b5a' });
    expect(api.buscar).toHaveBeenCalledOnceWith({ placa: 'B5A', fecha: '', hasta: '' }, 1);
    expect(raiz.querySelector<HTMLInputElement>('[data-prueba="placa"]')?.value).toBe('B5A');
  });

  it('al elegir un resultado abre el ticket junto a los datos, y el lote con su recorrido (CA03, CA10)', () => {
    const { fixture, raiz } = pagina({ placa: 'V2K' });
    raiz.querySelector<HTMLButtonElement>('[data-prueba="ver-ticket"]')?.click();
    estabilizar(fixture);

    expect(api.detalleIngreso).toHaveBeenCalledOnceWith(331);
    expect(api.ticketIngreso).toHaveBeenCalledOnceWith(331);
    const seleccion = raiz.querySelector('[data-prueba="seleccion"]') as HTMLElement;
    expect(seleccion.querySelector('app-visor-imagen img')?.getAttribute('src')).toMatch(/^blob:/);
    expect(seleccion.querySelector('app-pestana-datos')).not.toBeNull();
    expect(seleccion.querySelector('app-pestana-trazabilidad')).not.toBeNull();
    expect(seleccion.querySelector('[data-prueba="detalle-completo"]')?.getAttribute('href')).toBe(
      '/consulta/ingresos/331',
    );
  });

  it('un ingreso sin foto muestra su motivo en lugar de la imagen y no pide ninguna (CA09)', () => {
    const { fixture, raiz } = pagina({ placa: 'V2K' });
    api.detalleIngreso.and.returnValue(
      of(crearDetalle({ respaldo: { tipo: 'SIN_RESPALDO_FOTOGRAFICO', url: null, motivo: 'Sin cámara' } })),
    );
    raiz.querySelector<HTMLButtonElement>('[data-prueba="ver-ticket"]')?.click();
    estabilizar(fixture);
    expect(api.ticketIngreso).not.toHaveBeenCalled();
    expect(textos(raiz, 'sin-respaldo')[0]).toContain('Sin cámara');
  });

  it('un respaldo no disponible muestra los datos y el mensaje, no la imagen (CA07)', () => {
    const { fixture, raiz } = pagina({ placa: 'V2K' });
    api.detalleIngreso.and.returnValue(
      of(
        crearDetalle({
          respaldo: { tipo: 'NO_DISPONIBLE', url: null, mensaje: 'El respaldo no está disponible' },
        }),
      ),
    );
    raiz.querySelector<HTMLButtonElement>('[data-prueba="ver-ticket"]')?.click();
    estabilizar(fixture);
    expect(textos(raiz, 'no-disponible')[0]).toContain('El respaldo no está disponible');
    expect(raiz.querySelector('app-pestana-datos')).not.toBeNull();
  });

  it('un ingreso sin lote dice que el mineral espera en cancha (CA11)', () => {
    const { fixture, raiz } = pagina({ placa: 'V2K' });
    api.detalleIngreso.and.returnValue(of(crearDetalle()));
    raiz.querySelector<HTMLButtonElement>('[data-prueba="ver-ticket"]')?.click();
    estabilizar(fixture);
    expect(raiz.querySelector('app-pestana-trazabilidad [role="status"]')?.textContent).toContain(
      'aún no tiene lote',
    );
  });

  it('cerrar la selección libera el detalle; limpiar vacía la búsqueda', () => {
    const { fixture, raiz } = pagina({ placa: 'V2K' });
    raiz.querySelector<HTMLButtonElement>('[data-prueba="ver-ticket"]')?.click();
    estabilizar(fixture);
    raiz.querySelector<HTMLButtonElement>('[data-prueba="cerrar-seleccion"]')?.click();
    estabilizar(fixture);
    expect(hay(raiz, 'seleccion')).toBeFalse();
    raiz.querySelector<HTMLButtonElement>('[data-prueba="limpiar"]')?.click();
    estabilizar(fixture);
    expect(hay(raiz, 'fila-ingreso')).toBeFalse();
    expect(raiz.querySelector<HTMLInputElement>('[data-prueba="placa"]')?.value).toBe('');
  });
});

describe('ListadoIngresosPage (HU-M07-02)', () => {
  let api: jasmine.SpyObj<ConsultaApiService>;
  let descarga: jasmine.SpyObj<DescargaService>;
  let notificacion: jasmine.SpyObj<NotificacionService>;

  function pagina(rol: Rol = 'ADMINISTRATIVO') {
    api = espiaConsulta();
    api.listar.and.returnValue(
      of(crearResultadoConsulta([crearFilaIngreso(), crearFilaIngreso({ id: 332 })])),
    );
    descarga = jasmine.createSpyObj<DescargaService>('DescargaService', ['guardar']);
    notificacion = jasmine.createSpyObj<NotificacionService>('NotificacionService', [
      'exito',
      'error',
      'rechazo',
    ]);
    const minerales = jasmine.createSpyObj<TiposMineralApiService>('TiposMineralApiService', [
      'listarVigentes',
    ]);
    minerales.listarVigentes.and.returnValue(of([]));
    return montar(
      ListadoIngresosPage,
      [
        { provide: ConsultaApiService, useValue: api },
        { provide: DescargaService, useValue: descarga },
        { provide: NotificacionService, useValue: notificacion },
        { provide: TiposMineralApiService, useValue: minerales },
      ],
      {},
      rol,
    );
  }

  it('abre sin fechas y dice el rango que aplicó el servidor: el mes en curso (CA08)', () => {
    const { raiz } = pagina();
    expect(api.listar.calls.first().args[0].fecha_desde).toBe('');
    expect(textos(raiz, 'rango')).toEqual(['Del 01/11/2026 al 03/11/2026']);
  });

  it('muestra los ingresos y los totales del conjunto, sin contar anulados ni En proceso (CA03)', () => {
    const { raiz } = pagina();
    expect(raiz.querySelectorAll('[data-prueba="fila-ingreso"]').length).toBe(2);
    const totales = textos(raiz, 'totales')[0];
    expect(totales).toContain('2 ingresos');
    expect(totales).toContain('13.20 t');
    expect(totales).toContain('sin contar anulados ni en proceso');
  });

  it('los filtros se combinan y vuelven a la primera página (CA02)', () => {
    const { fixture } = pagina();
    const p = fixture.componentInstance;
    p['filtrar']({ estado: 'ANULADO' });
    p['filtrar']({ titularidad: 'EXTERNO', tipo_mineral: 3 });
    p['filtrar']({ fecha_desde: '2026-10-01', fecha_hasta: '2026-10-31' });
    expect(api.listar.calls.mostRecent().args).toEqual([
      {
        fecha_desde: '2026-10-01',
        fecha_hasta: '2026-10-31',
        tipo_mineral: 3,
        titularidad: 'EXTERNO',
        estado: 'ANULADO',
        q: '',
      },
      1,
    ]);
  });

  it('el texto libre busca por placa o código (CA10) y «Limpiar» quita todo', () => {
    const { fixture, raiz } = pagina();
    const texto = raiz.querySelector<HTMLInputElement>('[data-prueba="texto"]');
    if (texto) {
      texto.value = ' 00012 ';
      texto.dispatchEvent(new Event('change'));
    }
    expect(api.listar.calls.mostRecent().args[0].q).toBe('00012');
    raiz.querySelector<HTMLButtonElement>('[data-prueba="limpiar"]')?.click();
    estabilizar(fixture);
    expect(api.listar.calls.mostRecent().args[0].q).toBe('');
  });

  it('un rango inverso o un conjunto vacío vuelven con el mensaje del servidor (CA07, CA11)', () => {
    const { fixture, raiz } = pagina();
    api.listar.and.returnValue(
      throwError(
        () => new ErrorApi(400, 'RANGO_INVERSO', 'La fecha inicial no puede ser posterior a la fecha final'),
      ),
    );
    fixture.componentInstance['filtrar']({ fecha_desde: '2026-11-05' });
    estabilizar(fixture);
    expect(raiz.querySelector('[role=alert]')?.textContent).toContain('posterior a la fecha final');

    api.listar.and.returnValue(
      of(crearResultadoConsulta([], { mensaje: 'No hay ingresos con estos filtros' })),
    );
    fixture.componentInstance['filtrar']({ fecha_desde: '' });
    estabilizar(fixture);
    expect(raiz.querySelector('[role="status"]')?.textContent).toContain('No hay ingresos con estos filtros');
  });

  it('«Exportar» es de gestión: el Supervisor no lo ve (CA15)', () => {
    expect(hay(pagina('ADMINISTRATIVO').raiz, 'exportar')).toBeTrue();
    expect(hay(pagina('ADMINISTRADOR').raiz, 'exportar')).toBeTrue();
    expect(hay(pagina('SUPERVISOR').raiz, 'exportar')).toBeFalse();
  });

  it('exporta el conjunto con los filtros vigentes y entrega el archivo con el nombre del servidor (CA13)', () => {
    const { fixture, raiz } = pagina();
    const archivo = { nombre: 'ingresos_20261103.csv', contenido: new Blob(['x']) };
    api.exportar.and.returnValue(of(archivo));
    fixture.componentInstance['filtrar']({ estado: 'REGISTRADO' });
    raiz.querySelector<HTMLButtonElement>('[data-prueba="exportar"]')?.click();
    expect(api.exportar.calls.mostRecent().args[0].estado).toBe('REGISTRADO');
    expect(descarga.guardar).toHaveBeenCalledOnceWith(archivo);
  });

  it('exportar sin ingresos avisa con el mensaje del servidor, leído del blob (CA14)', () => {
    const { raiz } = pagina();
    const rechazo = new ErrorApi(400, 'SIN_EXPORTAR', 'No hay ingresos para exportar');
    api.exportar.and.returnValue(throwError(() => rechazo));
    raiz.querySelector<HTMLButtonElement>('[data-prueba="exportar"]')?.click();
    expect(notificacion.rechazo).toHaveBeenCalledOnceWith(rechazo);
    expect(descarga.guardar).not.toHaveBeenCalled();
  });
});

describe('CalendarioPage (HU-M07-03)', () => {
  let api: jasmine.SpyObj<ConsultaApiService>;

  function pagina() {
    api = espiaConsulta();
    api.calendario.and.callFake((anio: number, mes: number, dia?: number) =>
      of(
        crearCalendario(anio, mes, {
          dia: dia
            ? {
                fecha: `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
                ingresos: dia === 3 ? [crearFilaIngreso()] : [],
                mensaje: dia === 3 ? null : 'No llegaron volquetes este día',
              }
            : undefined,
        }),
      ),
    );
    return montar(CalendarioPage, [{ provide: ConsultaApiService, useValue: api }]);
  }

  const mesActual = (): [number, number] => {
    const [anio, mes] = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' })
      .format(new Date())
      .split('-')
      .map(Number);
    return [anio, mes];
  };

  it('abre en el mes en curso (CA01)', () => {
    const [anio, mes] = mesActual();
    pagina();
    expect(api.calendario).toHaveBeenCalledOnceWith(anio, mes, undefined);
  });

  it('cada día con llegadas dice sus ingresos y toneladas como texto', () => {
    const { raiz } = pagina();
    const dias = [...raiz.querySelectorAll('[data-prueba="dia"]')];
    expect(dias.length).toBeGreaterThanOrEqual(28);
    const tres = dias[2];
    expect(tres.querySelector('[data-prueba="dia-ingresos"]')?.textContent?.trim()).toBe('2 ingresos');
    expect(tres.querySelector('[data-prueba="dia-toneladas"]')?.textContent?.trim()).toBe('13.20 t');
    expect(dias[0].querySelector('[data-prueba="dia-ingresos"]')).toBeNull();
  });

  it('marca con icono y palabra los días con En proceso y con anulados, sin depender del color (CA02, CA03)', () => {
    const { raiz } = pagina();
    const dias = [...raiz.querySelectorAll('[data-prueba="dia"]')];
    expect(dias[2].querySelector('[data-prueba="dia-en-proceso"]')?.textContent).toContain('En proceso');
    expect(dias[2].querySelector('[data-prueba="dia-en-proceso"] mat-icon')).not.toBeNull();
    expect(dias[4].querySelector('[data-prueba="dia-anulados"]')?.textContent).toContain('Anulados');
    expect(dias[4].querySelector('[data-prueba="dia-anulados"] mat-icon')).not.toBeNull();
    expect(dias[0].querySelector('[data-prueba="dia-anulados"]')).toBeNull();
  });

  it('cada día se describe completo para un lector de pantalla', () => {
    const { raiz } = pagina();
    const dias = [...raiz.querySelectorAll('[data-prueba="dia"]')];
    expect(dias[2].getAttribute('aria-label')).toBe('3: 2 ingresos, 13.20 t, con ingresos en proceso');
    expect(dias[4].getAttribute('aria-label')).toBe('5: 1 ingreso, 9.00 t, con anulados');
  });

  it('el resumen del mes dice ingresos, toneladas, días con llegadas y los En proceso', () => {
    const { raiz } = pagina();
    const resumen = textos(raiz, 'resumen-mes')[0];
    expect(resumen).toContain('3 ingresos');
    expect(resumen).toContain('22.20 t');
    expect(resumen).toContain('2 días con llegadas');
    expect(resumen).toContain('1 en proceso');
  });

  it('navegar de mes recalcula los días y el resumen; enero retrocede a diciembre del año anterior (CA06)', () => {
    const { fixture, raiz } = pagina();
    const [anio, mes] = mesActual();
    raiz.querySelector<HTMLButtonElement>('[data-prueba="mes-anterior"]')?.click();
    estabilizar(fixture);
    const [anioPrevio, mesPrevio] = mes === 1 ? [anio - 1, 12] : [anio, mes - 1];
    expect(api.calendario.calls.mostRecent().args).toEqual([anioPrevio, mesPrevio, undefined]);
    raiz.querySelector<HTMLButtonElement>('[data-prueba="mes-siguiente"]')?.click();
    estabilizar(fixture);
    expect(api.calendario.calls.mostRecent().args).toEqual([anio, mes, undefined]);
  });

  it('el año cambia al pasar de diciembre a enero y de enero a diciembre', () => {
    const { fixture, raiz } = pagina();
    fixture.componentInstance['anio'].set(2026);
    fixture.componentInstance['mes'].set(12);
    raiz.querySelector<HTMLButtonElement>('[data-prueba="mes-siguiente"]')?.click();
    expect(api.calendario.calls.mostRecent().args).toEqual([2027, 1, undefined]);
    raiz.querySelector<HTMLButtonElement>('[data-prueba="mes-anterior"]')?.click();
    expect(api.calendario.calls.mostRecent().args).toEqual([2026, 12, undefined]);
  });

  it('elegir un día lista sus ingresos con hora, placa, código, mineral, neto y estado (CA04, CA07)', () => {
    const { fixture, raiz } = pagina();
    raiz.querySelectorAll<HTMLButtonElement>('[data-prueba="dia"]')[2].click();
    estabilizar(fixture);
    const [anio, mes] = mesActual();
    expect(api.calendario.calls.mostRecent().args).toEqual([anio, mes, 3]);
    const lista = raiz.querySelector('[data-prueba="del-dia"]') as HTMLElement;
    expect(lista.querySelectorAll('[data-prueba="fila-ingreso"]').length).toBe(1);
    expect(lista.querySelector('[data-prueba="codigo"] a')?.getAttribute('href')).toBe(
      '/consulta/ingresos/331',
    );
    expect(lista.textContent).toContain('V2K-841');
    expect(lista.textContent).toContain('13.20 t');
  });

  it('un día sin llegadas muestra el mensaje del servidor (CA05)', () => {
    const { fixture, raiz } = pagina();
    raiz.querySelectorAll<HTMLButtonElement>('[data-prueba="dia"]')[9].click();
    estabilizar(fixture);
    expect(raiz.querySelector('[data-prueba="del-dia"] [role="status"]')?.textContent).toContain(
      'No llegaron volquetes este día',
    );
  });

  it('cambiar de mes deja de mostrar el día elegido', () => {
    const { fixture, raiz } = pagina();
    raiz.querySelectorAll<HTMLButtonElement>('[data-prueba="dia"]')[2].click();
    estabilizar(fixture);
    raiz.querySelector<HTMLButtonElement>('[data-prueba="mes-anterior"]')?.click();
    estabilizar(fixture);
    expect(hay(raiz, 'del-dia')).toBeFalse();
  });

  it('la semana empieza en lunes: noviembre de 2026 empieza en domingo, con seis celdas antes', () => {
    expect(celdasPrevias(2026, 11)).toBe(6);
    expect(celdasPrevias(2026, 6)).toBe(0);
    expect(celdasPrevias(2026, 2)).toBe(6);
    expect(numeroDeDia('2026-11-03')).toBe(3);
  });
});

describe('InicioPage (HU-M07-04)', () => {
  let api: jasmine.SpyObj<ConsultaApiService>;

  function pagina(inicio: InicioDia = crearInicio(), rol: Rol = 'ADMINISTRADOR') {
    api = espiaConsulta();
    api.inicio.and.returnValue(of(inicio));
    return montar(InicioPage, [{ provide: ConsultaApiService, useValue: api }], {}, rol);
  }

  it('muestra las cuatro cifras del día (CA01)', () => {
    const { raiz } = pagina();
    expect(textos(raiz, 'cifra-etiqueta')).toEqual([
      'Ingresos de hoy',
      'Toneladas de hoy',
      'Pendientes de destare',
      'Lotes en proceso',
    ]);
    expect(textos(raiz, 'cifra-valor')).toEqual(['2', '13.20 t', '1', '3']);
  });

  it('bajo las toneladas dice «Sin contar n en proceso» y el último ingreso del día (CA02)', () => {
    const { raiz } = pagina();
    const detalles = textos(raiz, 'cifra-detalle');
    expect(detalles).toContain('Sin contar 1 en proceso');
    expect(detalles).toContain('Último: 16:33 · V2K-841');
    expect(detalles).toContain('ABC-123');
  });

  it('un día sin ingresos muestra cero y el mensaje del servidor (CA03)', () => {
    const { raiz } = pagina(
      crearInicio({
        ingresos_hoy: {
          cantidad: 0,
          ultimo: null,
          mensaje: 'Aún no hay ingresos hoy',
          enlace: '/consulta/calendario',
        },
        toneladas_hoy: { toneladas: '0.00', en_proceso: 0, mensaje: null, enlace: '/consolidacion' },
        ultimos_ingresos: [],
      }),
    );
    expect(textos(raiz, 'cifra-valor')[0]).toBe('0');
    expect(textos(raiz, 'cifra-detalle')[0]).toBe('Aún no hay ingresos hoy');
    expect(hay(raiz, 'sin-ultimos')).toBeTrue();
  });

  it('cada cifra enlaza donde dice el servidor, y sin enlace queda solo el dato (CA11)', () => {
    const supervisor = crearInicio({
      toneladas_hoy: { toneladas: '13.20', en_proceso: 0, mensaje: null, enlace: null },
    });
    const { raiz } = pagina(supervisor, 'SUPERVISOR');
    const enlaces = [...raiz.querySelectorAll('[data-prueba="cifra-enlace"]')].map((a) =>
      a.getAttribute('href'),
    );
    expect(enlaces).toEqual(['/consulta/calendario', '/ingresos/destares', '/lotes']);
    expect(raiz.querySelectorAll('[data-prueba="cifra-sin-enlace"]').length).toBe(1);
    expect(raiz.querySelector('[data-prueba="cifra-sin-enlace"]')?.textContent).toContain('Toneladas de hoy');
  });

  it('muestra los últimos ingresos y cada uno abre su detalle (CA05)', () => {
    const { raiz } = pagina();
    expect(raiz.querySelectorAll('[data-prueba="fila-ingreso"]').length).toBe(1);
    expect(raiz.querySelector('[data-prueba="codigo"] a')?.getAttribute('href')).toBe(
      '/consulta/ingresos/331',
    );
  });

  it('dibuja siete barras con la cifra de cada día escrita (CA04)', () => {
    const { raiz } = pagina();
    expect(textos(raiz, 'barra-valor')).toEqual([
      '0.00 t',
      '10.00 t',
      '0.00 t',
      '20.00 t',
      '5.00 t',
      '0.00 t',
      '13.20 t',
    ]);
  });

  it('la consulta rápida lleva a la consulta con la placa escrita', () => {
    const { fixture, raiz } = pagina();
    const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const entrada = raiz.querySelector<HTMLInputElement>('[data-prueba="placa-rapida"]');
    if (entrada) {
      entrada.value = ' abc-123 ';
      entrada.dispatchEvent(new Event('input'));
    }
    raiz.querySelector<HTMLButtonElement>('[data-prueba="consultar"]')?.click();
    fixture.detectChanges();
    expect(navegar).toHaveBeenCalledWith(['/consulta'], { queryParams: { placa: 'abc-123' } });
  });

  it('un error del servidor se muestra literal', () => {
    api = espiaConsulta();
    api.inicio.and.returnValue(throwError(() => new ErrorApi(500, 'ERROR', 'No se pudo leer el inicio')));
    const { raiz } = montar(InicioPage, [{ provide: ConsultaApiService, useValue: api }]);
    expect(raiz.querySelector('[role=alert]')?.textContent).toContain('No se pudo leer el inicio');
  });
});

describe('piezas del inicio', () => {
  it('BarrasSemanaComponent: la barra más alta es 100 % y un día vacío no tiene barra', () => {
    const { raiz } = montar(BarrasSemanaComponent, [], { dias: crearInicio().ultimos_siete_dias });
    const alturas = [...raiz.querySelectorAll<HTMLElement>('.barras__barra')].map((b) => b.style.height);
    expect(alturas[3]).toBe('100%');
    expect(alturas[0]).toBe('0%');
    expect(Number.parseFloat(alturas[1])).toBeCloseTo(50, 0);
  });

  it('BarrasSemanaComponent: un día mínimo sigue viéndose, y una semana sin toneladas no divide por cero', () => {
    const minimo = montar(BarrasSemanaComponent, [], {
      dias: [
        { fecha: '2026-11-02', toneladas: '0.01' },
        { fecha: '2026-11-03', toneladas: '100.00' },
      ],
    });
    expect(minimo.raiz.querySelector<HTMLElement>('.barras__barra')?.style.height).toBe('4%');
    const vacia = montar(BarrasSemanaComponent, [], { dias: [{ fecha: '2026-11-02', toneladas: '0.00' }] });
    expect(vacia.raiz.querySelector<HTMLElement>('.barras__barra')?.style.height).toBe('0%');
  });

  it('CifraInicioComponent: con enlace es un vínculo; sin él, un dato', () => {
    const con = montar(CifraInicioComponent, [], { etiqueta: 'X', valor: '1', enlace: '/lotes' });
    expect(con.raiz.querySelector('a')?.getAttribute('href')).toBe('/lotes');
    const sin = montar(CifraInicioComponent, [], { etiqueta: 'X', valor: '1' });
    expect(sin.raiz.querySelector('a')).toBeNull();
  });
});

describe('rutas de consulta', () => {
  it('la raíz es la consulta por placa, y el listado y el calendario tienen su ruta', async () => {
    const rutas = Object.fromEntries(CONSULTA_ROUTES.map((r) => [r.path, r]));
    expect(await rutas[''].loadComponent?.()).toBe(ConsultaPlacaFechaPage);
    expect(await rutas['ingresos'].loadComponent?.()).toBe(ListadoIngresosPage);
    expect(await rutas['calendario'].loadComponent?.()).toBe(CalendarioPage);
    expect(Object.keys(rutas)).toContain('ingresos/:id');
  });

  it('ya no queda ninguna pantalla pendiente: Consulta, Ingresos, Calendario y Consolidación existen', () => {
    expect(RUTAS_PENDIENTES.map((r) => r.path)).toEqual([]);
  });
});
