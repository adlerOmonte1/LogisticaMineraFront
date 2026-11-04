import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { DialogosService } from '@core/dialogos/dialogos.service';
import { API_URL } from '@core/http/api-url.token';
import { ErrorApi } from '@models/error-api.model';
import { Evento, FiltroAuditoria } from '@models/evento.model';
import { Pagina } from '@models/pagina.model';
import { estabilizar } from '../../testing/estabilizar';
import { crearEvento, crearEventoCorreccion } from '../../testing/fabricas';
import { AUDITORIA_ROUTES } from './auditoria.routes';
import { AuditoriaApiService } from './data-access/auditoria-api.service';
import { AuditoriaPage } from './pages/auditoria/auditoria.page';
import { DialogoEventoComponent } from './ui/dialogo-evento/dialogo-evento.component';

const FILTRO_VACIO: FiltroAuditoria = { usuario: '', accion: null, texto: '' };

function pagina(results: Evento[], mensaje: string | null = null): Pagina<Evento> {
  return { count: results.length, next: null, previous: null, results, mensaje };
}

describe('AuditoriaApiService', () => {
  let controlador: HttpTestingController;
  let api: AuditoriaApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }],
    });
    controlador = TestBed.inject(HttpTestingController);
    api = TestBed.inject(AuditoriaApiService);
  });

  afterEach(() => controlador.verify());

  it('combina usuario, acción y texto en una sola consulta (HU-M09-03 CA02)', () => {
    api.consultar({ usuario: 'adm', accion: 'MODIFICAR', texto: 'ING-1' }, 2).subscribe();
    const peticion = controlador.expectOne(
      (p) => p.urlWithParams === '/api/v1/auditoria/?usuario=adm&accion=MODIFICAR&texto=ING-1&page=2',
    );
    expect(peticion.request.method).toBe('GET');
    peticion.flush(pagina([]));
  });

  it('omite los filtros vacíos y pide la primera página', () => {
    api.consultar(FILTRO_VACIO).subscribe();
    controlador.expectOne((p) => p.urlWithParams === '/api/v1/auditoria/?page=1').flush(pagina([]));
  });
});

describe('AuditoriaPage', () => {
  let api: jasmine.SpyObj<AuditoriaApiService>;
  let dialogos: jasmine.SpyObj<DialogosService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<AuditoriaApiService>('AuditoriaApiService', ['consultar']);
    api.consultar.and.returnValue(of(pagina([crearEventoCorreccion(), crearEvento()])));
    dialogos = jasmine.createSpyObj<DialogosService>('DialogosService', ['abrir']);
    dialogos.abrir.and.returnValue(of(undefined));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AuditoriaApiService, useValue: api },
        { provide: DialogosService, useValue: dialogos },
      ],
    });
  });

  function montar(texto?: string) {
    const fixture = TestBed.createComponent(AuditoriaPage);
    fixture.componentRef.setInput('texto', texto);
    estabilizar(fixture);
    return { fixture, raiz: fixture.nativeElement as HTMLElement };
  }

  function escribir(raiz: HTMLElement, campo: string, valor: string): void {
    const entrada = raiz.querySelector<HTMLInputElement>(`input[formcontrolname="${campo}"]`);
    if (!entrada) {
      throw new Error(`No existe el campo ${campo}`);
    }
    entrada.value = valor;
    entrada.dispatchEvent(new Event('input'));
  }

  it('abre con todos los eventos, en el orden del servidor: del más reciente al más antiguo (CA01)', () => {
    const { raiz } = montar();
    expect(api.consultar).toHaveBeenCalledOnceWith(FILTRO_VACIO, 1);
    const filas = [...raiz.querySelectorAll('[data-prueba="fila-evento"]')];
    expect(filas.length).toBe(2);
    expect(filas[0].textContent).toContain('04/11/2026 09:10');
    expect(filas[0].textContent).toContain('admin.prueba');
    expect(filas[0].textContent).toContain('Ingreso · ING-2026-00331');
    expect(filas[0].textContent).toContain('Corrección');
    expect(filas[1].textContent).toContain('03/11/2026 16:37');
  });

  it('el texto que trae la URL filtra desde el primer momento y se ve en el campo', () => {
    const { raiz } = montar('ING-2026-00331');
    expect(api.consultar).toHaveBeenCalledOnceWith({ ...FILTRO_VACIO, texto: 'ING-2026-00331' }, 1);
    expect(raiz.querySelector<HTMLInputElement>('input[formcontrolname="texto"]')?.value).toBe(
      'ING-2026-00331',
    );
  });

  it('combina los filtros al buscar, sin espacios sobrantes y desde la página 1 (CA02)', () => {
    const { fixture, raiz } = montar();
    fixture.componentInstance['formulario'].patchValue({ accion: 'MODIFICAR' });
    escribir(raiz, 'usuario', '  admin.prueba ');
    escribir(raiz, 'texto', 'V2K-841');
    raiz.querySelector<HTMLButtonElement>('[data-prueba="buscar"]')?.click();
    estabilizar(fixture);

    expect(api.consultar).toHaveBeenCalledTimes(2);
    expect(api.consultar.calls.mostRecent().args).toEqual([
      { usuario: 'admin.prueba', accion: 'MODIFICAR', texto: 'V2K-841' },
      1,
    ]);
  });

  it('«Limpiar» quita todos los filtros', () => {
    const { fixture, raiz } = montar('ING-2026-00331');
    raiz.querySelector<HTMLButtonElement>('[data-prueba="limpiar"]')?.click();
    estabilizar(fixture);
    expect(api.consultar.calls.mostRecent().args).toEqual([FILTRO_VACIO, 1]);
    expect(raiz.querySelector<HTMLInputElement>('input[formcontrolname="texto"]')?.value).toBe('');
  });

  it('sin resultados muestra el mensaje del servidor y ninguna fila (CA04)', () => {
    api.consultar.and.returnValue(of(pagina([], 'No hay eventos con estos filtros')));
    const { raiz } = montar();
    expect(raiz.querySelector('[role="status"]')?.textContent).toContain('No hay eventos con estos filtros');
    expect(raiz.querySelector('[data-prueba="fila-evento"]')).toBeNull();
  });

  it('el detalle de un evento se abre en su diálogo, con el evento elegido', () => {
    const { raiz } = montar();
    raiz.querySelector<HTMLButtonElement>('[data-prueba="ver-detalle"]')?.click();
    expect(dialogos.abrir).toHaveBeenCalledOnceWith(DialogoEventoComponent, crearEventoCorreccion());
  });

  it('un rechazo del servidor se muestra literal', () => {
    api.consultar.and.returnValue(
      throwError(() => new ErrorApi(403, 'ACCION_NO_AUTORIZADA', 'Acción no autorizada para su rol')),
    );
    const { raiz } = montar();
    expect(raiz.querySelector('[role=alert]')?.textContent).toContain('Acción no autorizada para su rol');
  });
});

describe('DialogoEventoComponent', () => {
  function abrir(evento: Evento): HTMLElement {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: evento },
        { provide: MatDialogRef, useValue: { close: () => undefined } },
      ],
    });
    const fixture = TestBed.createComponent(DialogoEventoComponent);
    estabilizar(fixture);
    return fixture.nativeElement as HTMLElement;
  }

  it('muestra quién, cuándo, desde dónde, el motivo y el antes y después (HU-M09-03 CA03)', () => {
    const raiz = abrir(crearEventoCorreccion());
    expect(raiz.querySelector('[data-prueba="fecha"]')?.textContent).toContain('04/11/2026 09:10');
    expect(raiz.querySelector('[data-prueba="usuario"]')?.textContent).toContain('admin.prueba');
    expect(raiz.querySelector('[data-prueba="ip"]')?.textContent).toContain('10.0.0.8');
    expect(raiz.querySelector('[data-prueba="motivo"]')?.textContent).toContain('La balanza marcó 31.80');
    expect(raiz.querySelector('[data-prueba="operacion"]')?.textContent).toContain('Corrección');
    expect(raiz.querySelector('[data-prueba="antes"]')?.textContent).toBe('31.50');
    expect(raiz.querySelector('[data-prueba="despues"]')?.textContent).toBe('31.80');
  });

  it('el evento de un ingreso enlaza al ingreso', () => {
    const raiz = abrir(crearEventoCorreccion());
    expect(raiz.querySelector('[data-prueba="enlace-ingreso"]')?.getAttribute('href')).toBe(
      '/consulta/ingresos/331',
    );
  });

  it('el evento de un lote enlaza a los ingresos que afecta, no al lote (llega con FB5)', () => {
    const raiz = abrir(
      crearEvento({
        entidad: 'Lote',
        id_entidad: 12,
        referencia: null,
        ingresos_relacionados: [331, 332],
      }),
    );
    expect(raiz.querySelector('[data-prueba="registro"]')?.textContent).toContain('Lote · #12');
    expect(raiz.querySelector('[data-prueba="enlace-ingreso"]')).toBeNull();
    const enlaces = [...raiz.querySelectorAll('[data-prueba="enlace-relacionado"]')].map((a) =>
      a.getAttribute('href'),
    );
    expect(enlaces).toEqual(['/consulta/ingresos/331', '/consulta/ingresos/332']);
  });

  it('un evento sin ingreso asociado ni motivo no ofrece enlaces ni motivo', () => {
    const raiz = abrir(
      crearEvento({
        entidad: 'Usuario',
        id_entidad: 4,
        referencia: 'sup.prueba',
        usuario: null,
        accion: 'ACCESO_RECHAZADO',
        accion_texto: 'Acceso rechazado',
        direccion_ip: null,
      }),
    );
    expect(raiz.querySelector('[data-prueba="usuario"]')?.textContent).toContain('Sin sesión');
    expect(raiz.querySelector('[data-prueba="enlace-ingreso"]')).toBeNull();
    expect(raiz.querySelector('[data-prueba="motivo"]')).toBeNull();
    expect(raiz.querySelector('[data-prueba="ip"]')).toBeNull();
  });
});

describe('AUDITORIA_ROUTES', () => {
  it('la ruta carga la página y exige el permiso de auditoría', async () => {
    const [ruta] = AUDITORIA_ROUTES;
    expect(ruta.canActivate?.length).toBe(1);
    expect(await ruta.loadComponent?.()).toBe(AuditoriaPage);
  });
});
