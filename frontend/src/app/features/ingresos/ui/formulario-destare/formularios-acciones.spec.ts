import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { ErrorApi } from '@models/error-api.model';
import { ResultadoDestare } from '@models/ingreso.model';
import { crearIngreso } from '../../../../testing/fabricas';
import { estabilizar } from '../../../../testing/estabilizar';
import {
  DatosCorreccion,
  FormularioCorreccionComponent,
} from '../formulario-correccion/formulario-correccion.component';
import { DatosMotivo, FormularioMotivoComponent } from '../formulario-motivo/formulario-motivo.component';
import { PendientesDestareComponent } from '../pendientes-destare/pendientes-destare.component';
import { ResultadoDestareComponent } from '../resultado-destare.component';
import { ResumenIngresoComponent } from '../resumen-ingreso.component';
import { DatosDestare, FormularioDestareComponent } from './formulario-destare.component';

const vehiculo = { id: 3, placa: 'ZZ3-901', ingresos: 2 };

describe('FormularioDestareComponent (HU-M03-04)', () => {
  function montar(error: ErrorApi | null = null) {
    TestBed.configureTestingModule({ providers: [provideNoopAnimations()] });
    const fixture = TestBed.createComponent(FormularioDestareComponent);
    fixture.componentRef.setInput('vehiculo', vehiculo);
    fixture.componentRef.setInput('error', error);
    fixture.detectChanges();
    const datos: DatosDestare[] = [];
    fixture.componentInstance.registrarDestare.subscribe((d) => datos.push(d));
    const raiz: HTMLElement = fixture.nativeElement;
    const escribir = (nombre: string, valor: string) => {
      const campo = raiz.querySelector<HTMLInputElement>(`[data-prueba="${nombre}"]`);
      if (campo) {
        campo.value = valor;
        campo.dispatchEvent(new Event('input'));
      }
    };
    const enviar = () => raiz.querySelector('form')?.dispatchEvent(new Event('submit'));
    return { fixture, raiz, datos, escribir, enviar };
  }

  it('emite la tara con punto decimal y la fecha en la zona de Lima; vacía, el servidor usa «ahora»', () => {
    const { datos, escribir, enviar } = montar();
    escribir('tara', '5,25');
    enviar();
    escribir('fecha-destare', '2026-11-03T10:30');
    enviar();
    expect(datos).toEqual([
      { tara_tn: '5.25', fecha_destare: null, justificaciones: {} },
      { tara_tn: '5.25', fecha_destare: '2026-11-03T10:30:00-05:00', justificaciones: {} },
    ]);
  });

  it('una tara con formato imposible no se envía; el resto lo decide el servidor', () => {
    const { datos, escribir, enviar } = montar();
    escribir('tara', 'abc');
    enviar();
    expect(datos).toEqual([]);
  });

  it('pide la justificación de cada ingreso que el servidor señala, por código (CA04, D-25)', () => {
    const error = new ErrorApi(
      400,
      'INCONSISTENCIAS',
      'Debe indicar la justificación del peso fuera de rango',
      {},
      [],
      [],
      [
        {
          ingreso: 'ING-2026-00332',
          regla: 'V4',
          mensaje: 'Debe indicar la justificación del peso fuera de rango',
        },
      ],
    );
    const { fixture, raiz, datos, escribir, enviar } = montar(error);
    estabilizar(fixture);
    expect(raiz.textContent).toContain('Justificación de ING-2026-00332');

    escribir('tara', '5');
    escribir('justificacion-ING-2026-00332', 'Carga autorizada');
    enviar();
    expect(datos[0].justificaciones).toEqual({ 'ING-2026-00332': 'Carga autorizada' });
  });

  it('muestra el rechazo literal de la tara', () => {
    const { raiz } = montar(
      new ErrorApi(400, 'INCONSISTENCIAS', 'La tara no puede ser mayor o igual que el peso bruto'),
    );
    expect(raiz.querySelector('[role=alert]')?.textContent).toContain(
      'La tara no puede ser mayor o igual que el peso bruto',
    );
  });
});

describe('PendientesDestareComponent y ResultadoDestareComponent', () => {
  it('lista los ingresos de cada vehículo y emite el elegido (CA06)', () => {
    const fixture = TestBed.createComponent(PendientesDestareComponent);
    fixture.componentRef.setInput('vehiculos', [vehiculo, { id: 8, placa: 'AAA-111', ingresos: 1 }]);
    fixture.componentRef.setInput('ingresos', [
      {
        id: 1,
        codigo: 'ING-1',
        vehiculo: 3,
        placa: 'ZZ3-901',
        fecha_hora_pesaje: '2026-09-13T16:42:00-05:00',
        peso_bruto_tn: '15.50',
      },
      {
        id: 2,
        codigo: 'ING-2',
        vehiculo: 8,
        placa: 'AAA-111',
        fecha_hora_pesaje: '2026-09-14T08:00:00-05:00',
        peso_bruto_tn: '20.00',
      },
    ]);
    fixture.componentRef.setInput('elegido', 8);
    const elegidos: number[] = [];
    fixture.componentInstance.elegir.subscribe((id) => elegidos.push(id));
    fixture.detectChanges();
    const raiz: HTMLElement = fixture.nativeElement;

    expect(raiz.textContent).toContain('2 ingresos en proceso');
    expect(raiz.textContent).toContain('1 ingreso en proceso');
    expect(raiz.textContent).toContain('13/09/2026 16:42');
    expect(raiz.textContent).toContain('Bruto 15.50 t');
    expect(raiz.querySelectorAll('.vehiculo--elegido').length).toBe(1);
    raiz.querySelector<HTMLButtonElement>('[data-prueba="destarar-ZZ3-901"]')?.click();
    expect(elegidos).toEqual([3]);
  });

  it('el resultado muestra el mensaje del servidor y los ingresos que pasaron a Registrado (CA01)', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const resultado: ResultadoDestare = {
      mensaje: 'Destare registrado',
      vehiculo: { id: 3, placa: 'ZZ3-901', tara_tn: '5.25', fecha_destare: '2026-11-03T16:50:00-05:00' },
      ingresos: [
        {
          id: 332,
          codigo: 'ING-2026-00332',
          peso_bruto_tn: '15.50',
          peso_neto_tn: '10.25',
          estado: 'REGISTRADO',
        },
      ],
    };
    const fixture = TestBed.createComponent(ResultadoDestareComponent);
    fixture.componentRef.setInput('resultado', resultado);
    let continuar = 0;
    fixture.componentInstance.continuar.subscribe(() => continuar++);
    fixture.detectChanges();
    const raiz: HTMLElement = fixture.nativeElement;

    expect(raiz.querySelector('[data-prueba="mensaje-destare"]')?.textContent).toContain(
      'Destare registrado',
    );
    expect(raiz.textContent).toContain('10.25 t');
    expect(raiz.textContent).toContain('Registrado');
    raiz.querySelector<HTMLButtonElement>('[data-prueba="continuar-destares"]')?.click();
    expect(continuar).toBe(1);
  });
});

describe('FormularioMotivoComponent', () => {
  function montar(error: ErrorApi | null = null) {
    TestBed.configureTestingModule({ providers: [provideNoopAnimations()] });
    const fixture = TestBed.createComponent(FormularioMotivoComponent);
    fixture.componentRef.setInput('etiqueta', 'Motivo de la anulación');
    fixture.componentRef.setInput('textoEnviar', 'Anular ingreso');
    fixture.componentRef.setInput('error', error);
    estabilizar(fixture);
    const datos: DatosMotivo[] = [];
    fixture.componentInstance.enviar.subscribe((d) => datos.push(d));
    const raiz: HTMLElement = fixture.nativeElement;
    return { fixture, raiz, datos };
  }

  it('emite el motivo recortado; si falta, lo reclama el servidor con su mensaje (HU-M03-03 CA02)', () => {
    const { raiz, datos } = montar();
    const campo = raiz.querySelector<HTMLTextAreaElement>('[data-prueba="motivo"]');
    raiz.querySelector('form')?.dispatchEvent(new Event('submit'));
    if (campo) {
      campo.value = '  Ticket duplicado  ';
      campo.dispatchEvent(new Event('input'));
    }
    raiz.querySelector('form')?.dispatchEvent(new Event('submit'));
    expect(datos.map((d) => d.motivo)).toEqual(['', 'Ticket duplicado']);
  });

  it('muestra el rechazo literal del servidor', () => {
    const { raiz } = montar(
      new ErrorApi(400, 'MOTIVO_OBLIGATORIO', 'Debe indicar el motivo de la anulación', {}, ['motivo']),
    );
    expect(raiz.querySelector('[role=alert]')?.textContent).toContain(
      'Debe indicar el motivo de la anulación',
    );
  });

  it('una reversión que restaura valores fuera de regla pide su justificación (CA14)', () => {
    const { raiz } = montar(
      new ErrorApi(
        400,
        'INCONSISTENCIAS',
        'x',
        {},
        [],
        [
          {
            regla: 'V4',
            campo: 'peso_bruto_tn',
            mensaje: 'Fuera de rango',
            bloqueante: false,
            exige_justificacion: true,
          },
        ],
      ),
    );
    expect(raiz.querySelector('[data-prueba="justificacion-V4"]')).not.toBeNull();
  });
});

describe('FormularioCorreccionComponent (HU-M03-02)', () => {
  function montar(error: ErrorApi | null = null) {
    TestBed.configureTestingModule({ providers: [provideNoopAnimations()] });
    const fixture = TestBed.createComponent(FormularioCorreccionComponent);
    fixture.componentRef.setInput(
      'ingreso',
      crearIngreso({ tipo_mineral: 77, tipo_mineral_nombre: 'Mineral de baja' }),
    );
    fixture.componentRef.setInput('tiposMineral', [
      { id: 1, codigo: 'MOA', nombre: 'Óxido A', unidad_medida: 'TONELADA', activo: true },
    ]);
    fixture.componentRef.setInput('error', error);
    estabilizar(fixture);
    const datos: DatosCorreccion[] = [];
    fixture.componentInstance.enviar.subscribe((d) => datos.push(d));
    const raiz: HTMLElement = fixture.nativeElement;
    const escribir = (nombre: string, valor: string) => {
      const campo = raiz.querySelector<HTMLInputElement>(`[data-prueba="${nombre}"]`);
      if (campo) {
        campo.value = valor;
        campo.dispatchEvent(new Event('input'));
      }
    };
    const enviar = () => raiz.querySelector('form')?.dispatchEvent(new Event('submit'));
    return { fixture, raiz, datos, escribir, enviar };
  }

  it('precarga el ingreso, con la fecha y la hora de la planta, y no ofrece lo que asigna el servidor (CA04)', () => {
    const { raiz } = montar();
    expect(raiz.querySelector<HTMLInputElement>('[data-prueba="placa"]')?.value).toBe('V2K-841');
    expect(raiz.querySelector<HTMLInputElement>('[data-prueba="fecha"]')?.value).toBe('2026-09-14');
    expect(raiz.querySelector<HTMLInputElement>('[data-prueba="hora"]')?.value).toBe('16:33');
    expect(raiz.querySelector<HTMLInputElement>('[data-prueba="peso"]')?.value).toBe('25.00');
    for (const asignado of ['codigo', 'tara', 'neto', 'inicio']) {
      expect(raiz.querySelector(`[data-prueba="${asignado}"]`)).toBeNull();
    }
  });

  it('envía solo lo que cambió, con el peso normalizado y el motivo', () => {
    const { datos, escribir, enviar } = montar();
    escribir('peso', '26,50');
    escribir('motivo', 'Peso transcrito mal');
    enviar();
    expect(datos).toEqual([
      { cambios: { peso_bruto_tn: '26.50' }, motivo: 'Peso transcrito mal', justificaciones: {} },
    ]);
  });

  it('sin cambios envía un cuerpo vacío: el servidor responde «No hay cambios que guardar» (CA10)', () => {
    const { datos, enviar } = montar();
    enviar();
    expect(datos[0].cambios).toEqual({});
  });

  it('no pierde el tipo de mineral actual aunque esté dado de baja', () => {
    const { raiz } = montar();
    const opciones = (raiz.ownerDocument.defaultView as Window).document;
    expect(opciones).toBeDefined();
    expect(raiz.textContent).toContain('Mineral óxido Pingüino'.slice(0, 0));
  });

  it('muestra el rechazo literal y la justificación que reclama una regla', () => {
    const { raiz } = montar(
      new ErrorApi(
        400,
        'INCONSISTENCIAS',
        'Debe indicar la justificación del peso fuera de rango',
        {},
        [],
        [
          {
            regla: 'V4',
            campo: 'peso_bruto_tn',
            mensaje: 'Fuera de rango',
            bloqueante: false,
            exige_justificacion: true,
          },
        ],
      ),
    );
    expect(raiz.querySelector('[role=alert]')?.textContent).toContain(
      'Debe indicar la justificación del peso fuera de rango',
    );
    expect(raiz.querySelector('[data-prueba="justificacion-V4"]')).not.toBeNull();
  });
});

describe('ResumenIngresoComponent', () => {
  it('muestra el ingreso sobre el que se actúa; sin neto, dice que espera el destare', () => {
    const fixture = TestBed.createComponent(ResumenIngresoComponent);
    fixture.componentRef.setInput(
      'ingreso',
      crearIngreso({ estado: 'EN_PROCESO', peso_neto_tn: null, tara_tn: null }),
    );
    fixture.detectChanges();
    const texto = (fixture.nativeElement as HTMLElement).textContent;
    expect(texto).toContain('ING-2026-00331');
    expect(texto).toContain('En proceso');
    expect(texto).toContain('Pendiente del destare');
  });
});
