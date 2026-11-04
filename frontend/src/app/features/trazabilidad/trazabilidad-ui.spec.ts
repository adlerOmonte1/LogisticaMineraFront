import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ErrorApi } from '@models/error-api.model';
import {
  DisponiblesLote,
  EtapaCatalogo,
  Lote,
  ParteLote,
  RutaCatalogo,
  SiguientePaso,
} from '@models/lote.model';
import { estabilizar } from '../../testing/estabilizar';
import { crearLote } from '../../testing/fabricas';
import { ComposicionLoteComponent } from './ui/composicion-lote/composicion-lote.component';
import { DialogoAsignarComponent } from './ui/dialogo-asignar/dialogo-asignar.component';
import { DialogoBigbagsComponent } from './ui/dialogo-bigbags/dialogo-bigbags.component';
import { DialogoDivisionComponent } from './ui/dialogo-division/dialogo-division.component';
import { DialogoEtapaComponent } from './ui/dialogo-etapa/dialogo-etapa.component';
import { DialogoMineralComponent } from './ui/dialogo-mineral/dialogo-mineral.component';
import { PartesLoteComponent } from './ui/partes-lote/partes-lote.component';
import { RecorridoLoteComponent } from './ui/recorrido-lote/recorrido-lote.component';
import { SiguientePasoComponent } from './ui/siguiente-paso/siguiente-paso.component';

const ETAPAS: EtapaCatalogo[] = [
  { codigo: 'SECADO', nombre: 'Secado', orden: 1 },
  { codigo: 'ZARANDEO', nombre: 'Zarandeo', orden: 2 },
  { codigo: 'MOLIENDA', nombre: 'Molienda', orden: 3 },
  { codigo: 'ENSACADO', nombre: 'Ensacado', orden: 4 },
];

const RUTAS: RutaCatalogo[] = [
  { codigo: 'ZARANDEO_ENSACADO', nombre: 'Zaranda', etapas: ['ZARANDEO', 'ENSACADO'] },
  { codigo: 'MOLIENDA_ENSACADO', nombre: 'Molido', etapas: ['MOLIENDA', 'ENSACADO'] },
];

function paso(cambios: Partial<SiguientePaso> = {}): SiguientePaso {
  return {
    carga: 'Lote prueba',
    parte: null,
    ingreso: null,
    etapa: 'SECADO',
    elegir_ruta: false,
    ...cambios,
  };
}

function parte(cambios: Partial<ParteLote> = {}): ParteLote {
  return {
    id: 1,
    nombre: 'Parte A',
    fraccion: '1/2',
    ruta: 'ZARANDEO_ENSACADO',
    ruta_texto: 'Zaranda',
    toneladas_aproximadas: '6.60',
    es_estimacion: true,
    ...cambios,
  };
}

function montar<T>(componente: Type<T>, entradas: Record<string, unknown>) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideRouter([]), provideNoopAnimations()] });
  const fixture = TestBed.createComponent(componente);
  for (const [nombre, valor] of Object.entries(entradas)) {
    fixture.componentRef.setInput(nombre, valor);
  }
  estabilizar(fixture);
  return { fixture, raiz: fixture.nativeElement as HTMLElement };
}

function textos(raiz: HTMLElement, prueba: string): string[] {
  return [...raiz.querySelectorAll(`[data-prueba="${prueba}"]`)].map((e) => e.textContent?.trim() ?? '');
}

describe('SiguientePasoComponent (RNF-M06-07)', () => {
  it('ofrece un botón por cada carga que trae `siguientes`, y nada más', () => {
    const { raiz } = montar(SiguientePasoComponent, {
      siguientes: [paso(), paso({ carga: 'Parte A', parte: 1, etapa: 'ZARANDEO' })],
      etapas: ETAPAS,
    });
    const botones = textos(raiz, 'siguiente').map((texto) => texto.replace(/^arrow_forward\s*/, ''));
    expect(botones).toEqual(['Registrar secado', 'Registrar zarandeo']);
    expect(textos(raiz, 'carga')).toEqual(['Lote prueba', 'Parte A']);
  });

  it('tras el secado pide la ruta en lugar de una etapa (HU-M06-02 CA02)', () => {
    const { raiz } = montar(SiguientePasoComponent, {
      siguientes: [paso({ etapa: null, elegir_ruta: true })],
      etapas: ETAPAS,
    });
    expect(textos(raiz, 'siguiente')[0]).toContain('Elegir la ruta');
  });

  it('con la ruta completa no dibuja nada (CA09)', () => {
    const { raiz } = montar(SiguientePasoComponent, { siguientes: [], etapas: ETAPAS });
    expect(raiz.querySelector('[data-prueba="siguiente"]')).toBeNull();
    expect(raiz.querySelector('section')).toBeNull();
  });

  it('al pulsar emite la carga elegida', () => {
    const { fixture, raiz } = montar(SiguientePasoComponent, { siguientes: [paso()], etapas: ETAPAS });
    const emitidos: SiguientePaso[] = [];
    fixture.componentInstance.registrar.subscribe((p) => emitidos.push(p));
    raiz.querySelector<HTMLButtonElement>('[data-prueba="siguiente"]')?.click();
    expect(emitidos).toEqual([paso()]);
  });
});

describe('ComposicionLoteComponent (HU-M06-01 CA04, CA12, CA13, CA16, CA17, CA21)', () => {
  const composicion = (): Lote['composicion'] => [
    {
      ...crearLote().composicion[0],
      ingresos: [
        { ...crearLote().composicion[0].ingresos[0], id: 1, codigo: 'ING-A' },
        { ...crearLote().composicion[0].ingresos[0], id: 2, codigo: 'ING-B', tardio: true },
        {
          ...crearLote().composicion[0].ingresos[0],
          id: 3,
          codigo: 'ING-C',
          tardio: true,
          secado_propio: true,
        },
      ],
      cantidad: 3,
      toneladas: '39.60',
    },
    {
      tipo_mineral: { id: 2, codigo: 'PB', nombre: 'Plomo' },
      otro_mineral: true,
      autorizacion: 'Autoriza el gerente',
      ingresos: [],
      cantidad: 0,
      toneladas: '0.00',
    },
  ];
  const total = { ingresos: 3, toneladas: '39.60' };

  it('señala con texto los tardíos, el secado propio y el «Otro mineral» con su autorización', () => {
    const { raiz } = montar(ComposicionLoteComponent, { composicion: composicion(), total });
    const cuerpo = raiz.textContent ?? '';
    expect(cuerpo).toContain('Tardío');
    expect(cuerpo).toContain('Tardío · secado propio');
    expect(cuerpo).toContain('Otro mineral');
    expect(textos(raiz, 'autorizacion')).toEqual(['Autorización: Autoriza el gerente']);
  });

  it('muestra el total de ingresos y toneladas, y el de cada mineral', () => {
    const { raiz } = montar(ComposicionLoteComponent, { composicion: composicion(), total });
    expect(textos(raiz, 'total')[0]).toContain('3 ingresos registrados');
    expect(textos(raiz, 'total')[0]).toContain('39.60 t');
    expect(textos(raiz, 'resumen-mineral')[0]).toContain('3 ingresos');
  });

  it('un mineral agregado sin ingresos aparece con su grupo vacío (CA17)', () => {
    const { raiz } = montar(ComposicionLoteComponent, { composicion: composicion(), total });
    expect(raiz.querySelectorAll('[data-prueba="grupo-mineral"]').length).toBe(2);
    expect(textos(raiz, 'grupo-vacio')).toEqual(['Sin ingresos todavía']);
  });

  it('solo ofrece retirar y quitar cuando es editable, y emite lo elegido', () => {
    const lectura = montar(ComposicionLoteComponent, { composicion: composicion(), total });
    expect(lectura.raiz.querySelector('[data-prueba="retirar"]')).toBeNull();
    expect(lectura.raiz.querySelector('[data-prueba="quitar-mineral"]')).toBeNull();

    const { fixture, raiz } = montar(ComposicionLoteComponent, {
      composicion: composicion(),
      total,
      editable: true,
    });
    const retirados: number[] = [];
    const quitados: number[] = [];
    fixture.componentInstance.retirar.subscribe((i) => retirados.push(i.id));
    fixture.componentInstance.quitarMineral.subscribe((g) => quitados.push(g.tipo_mineral.id));
    raiz.querySelector<HTMLButtonElement>('[data-prueba="retirar"]')?.click();
    raiz.querySelectorAll<HTMLButtonElement>('[data-prueba="quitar-mineral"]')[1].click();
    expect(retirados).toEqual([1]);
    expect(quitados).toEqual([2]);
  });
});

describe('PartesLoteComponent (HU-M06-04 CA08)', () => {
  it('las toneladas de cada parte se señalan como estimación', () => {
    const { raiz } = montar(PartesLoteComponent, { partes: [parte(), parte({ id: 2, nombre: 'Parte B' })] });
    expect(raiz.querySelectorAll('[data-prueba="parte"]').length).toBe(2);
    const toneladas = textos(raiz, 'toneladas')[0];
    expect(toneladas).toContain('≈');
    expect(toneladas).toContain('6.60 t');
    expect(toneladas).toContain('(estimación)');
    expect(textos(raiz, 'fraccion')[0]).toBe('Fracción 1/2');
    expect(textos(raiz, 'ruta')[0]).toBe('Zaranda');
  });
});

describe('RecorridoLoteComponent', () => {
  const pasos = [
    {
      id: 1,
      etapa: 'MOLIENDA' as const,
      etapa_texto: 'Molienda',
      carga: 'Lote prueba',
      parte: null,
      ingreso_tardio: null,
      fecha_hora: '2026-11-03T09:00:00-05:00',
      usuario: 'sup.prueba',
      horas_molienda: '4.00',
      observacion: '',
    },
  ];
  const bigbags = [
    {
      id: 1,
      parte: null,
      cantidad: 9,
      peso_aproximado_tn: '1.47',
      recalculado: false,
      es_estimacion: true,
      fecha_hora: '2026-11-03T10:00:00-05:00',
    },
  ];

  it('muestra quién registró cada paso, cuándo y las horas de molienda', () => {
    const { raiz } = montar(RecorridoLoteComponent, { recorrido: pasos, bigbags: [] });
    expect(textos(raiz, 'etapa')).toEqual(['Molienda']);
    expect(textos(raiz, 'usuario')).toEqual(['sup.prueba']);
    expect(textos(raiz, 'horas')).toEqual(['4.00 h de molienda']);
  });

  it('el peso de cada bigbag es una estimación (CA11)', () => {
    const { raiz } = montar(RecorridoLoteComponent, { recorrido: pasos, bigbags });
    expect(textos(raiz, 'peso-bigbag')[0]).toContain('≈ 1.47 t c/u');
    expect(textos(raiz, 'peso-bigbag')[0]).toContain('(estimación)');
  });

  it('sin pasos ni bigbags lo dice', () => {
    const { raiz } = montar(RecorridoLoteComponent, { recorrido: [], bigbags: [] });
    expect(raiz.querySelector('[data-prueba="sin-pasos"]')).not.toBeNull();
    expect(raiz.querySelector('[data-prueba="sin-bigbags"]')).not.toBeNull();
  });

  it('«Asociar bigbags» solo se ofrece cuando se puede (CA13)', () => {
    expect(
      montar(RecorridoLoteComponent, { recorrido: pasos, bigbags: [] }).raiz.querySelector(
        '[data-prueba="asociar-bigbags"]',
      ),
    ).toBeNull();
    expect(
      montar(RecorridoLoteComponent, {
        recorrido: pasos,
        bigbags: [],
        puedeAsociar: true,
      }).raiz.querySelector('[data-prueba="asociar-bigbags"]'),
    ).not.toBeNull();
  });
});

describe('diálogos de envío', () => {
  function abrir<T, D>(componente: Type<T>, datos: D) {
    const cierre = jasmine.createSpy('close');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: datos },
        { provide: MatDialogRef, useValue: { close: cierre } },
      ],
    });
    const fixture = TestBed.createComponent(componente);
    estabilizar(fixture);
    const raiz = fixture.nativeElement as HTMLElement;
    const escribir = (prueba: string, valor: string): void => {
      const entrada = raiz.querySelector<HTMLInputElement>(`[data-prueba="${prueba}"]`);
      if (!entrada) {
        throw new Error(`No existe ${prueba}`);
      }
      entrada.value = valor;
      entrada.dispatchEvent(new Event('input'));
    };
    const enviar = (): void => {
      raiz.querySelector<HTMLButtonElement>('[data-prueba="enviar"]')?.click();
      estabilizar(fixture);
    };
    return { fixture, raiz, cierre, escribir, enviar };
  }

  function datosEtapa(siguiente: SiguientePaso, partes: ParteLote[] = []) {
    const guardar = jasmine.createSpy('guardar').and.returnValue(of(crearLote()));
    return {
      guardar,
      datos: { titulo: 'Registrar', siguiente, nombreEtapa: 'Secado', rutas: RUTAS, partes, guardar },
    };
  }

  describe('DialogoEtapaComponent', () => {
    it('el secado solo pide la fecha, que viene en «ahora» (RNF-M06-06)', () => {
      const { datos, guardar } = datosEtapa(paso());
      const { raiz, escribir, enviar, cierre } = abrir(DialogoEtapaComponent, datos);
      expect(raiz.querySelector<HTMLInputElement>('[data-prueba="fecha-hora"]')?.value).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
      );
      for (const campo of ['ruta', 'horas', 'bigbags', 'reparto']) {
        expect(raiz.querySelector(`[data-prueba="${campo}"]`))
          .withContext(campo)
          .toBeNull();
      }
      escribir('observacion', ' Lluvia ');
      enviar();
      const valor = guardar.calls.mostRecent().args[0];
      // La fecha propuesta no se envía: la pone el servidor y no puede quedar antes del paso previo.
      expect(valor.fecha_hora).toBeNull();
      expect(valor.observacion).toBe('Lluvia');
      expect(valor.ruta).toBeNull();
      expect(valor.bigbags).toBeNull();
      expect(cierre).toHaveBeenCalledTimes(1);
    });

    it('si el usuario cambia la fecha, esa fecha viaja con el desfase de Lima', () => {
      const { datos, guardar } = datosEtapa(paso());
      const { escribir, enviar } = abrir(DialogoEtapaComponent, datos);
      escribir('fecha-hora', '2026-11-03T10:30');
      enviar();
      expect(guardar.calls.mostRecent().args[0].fecha_hora).toBe('2026-11-03T10:30:00-05:00');
    });

    it('tras el secado pide la ruta y la envía (CA02)', () => {
      const { datos, guardar } = datosEtapa(paso({ etapa: null, elegir_ruta: true }));
      const { fixture, raiz, enviar } = abrir(DialogoEtapaComponent, datos);
      expect(raiz.querySelector('[data-prueba="ruta"]')).not.toBeNull();
      fixture.componentInstance['formulario'].patchValue({ ruta: 'MOLIENDA_ENSACADO' });
      enviar();
      expect(guardar.calls.mostRecent().args[0].ruta).toBe('MOLIENDA_ENSACADO');
    });

    it('la molienda pide las horas y acepta la coma del teclado (CA10)', () => {
      const { datos, guardar } = datosEtapa(paso({ etapa: 'MOLIENDA' }));
      const { raiz, escribir, enviar } = abrir(DialogoEtapaComponent, datos);
      expect(raiz.querySelector('[data-prueba="ruta"]')).toBeNull();
      escribir('horas', '4,5');
      enviar();
      expect(guardar.calls.mostRecent().args[0].horas_molienda).toBe('4.5');
    });

    it('el ensacado ofrece los bigbags, opcionales, con «Recalcular» a la vista (CA11, CA12)', () => {
      const { datos, guardar } = datosEtapa(paso({ etapa: 'ENSACADO' }));
      const sin = abrir(DialogoEtapaComponent, datos);
      expect(sin.raiz.querySelector('[data-prueba="recalcular"]')).not.toBeNull();
      sin.enviar();
      expect(guardar.calls.mostRecent().args[0].bigbags).toBeNull();

      const con = abrir(DialogoEtapaComponent, datos);
      con.escribir('bigbags', '9');
      con.escribir('peso', '1,5');
      con.enviar();
      expect(guardar.calls.mostRecent().args[0].bigbags).toEqual({
        cantidad: 9,
        recalcular: false,
        peso_aproximado_tn: '1.5',
      });
    });

    it('el secado propio de un tardío propone el reparto de las partes y lo envía (CA14, HU-M06-04 CA09)', () => {
      const partes = [parte(), parte({ id: 2, nombre: 'Parte B', fraccion: '1/2' })];
      const { datos, guardar } = datosEtapa(paso({ ingreso: 331, etapa: 'SECADO' }), partes);
      const { raiz, enviar } = abrir(DialogoEtapaComponent, datos);
      const reparto = [...raiz.querySelectorAll<HTMLInputElement>('[data-prueba="reparto"]')].map(
        (i) => i.value,
      );
      expect(reparto).toEqual(['1/2', '1/2']);
      expect(textos(raiz, 'suma')[0]).toContain('1 de 1');
      enviar();
      expect(guardar.calls.mostRecent().args[0].fracciones).toEqual([
        { parte: 1, fraccion: '1/2' },
        { parte: 2, fraccion: '1/2' },
      ]);
    });

    it('un rechazo del servidor se muestra literal y el diálogo no se cierra', () => {
      const { datos, guardar } = datosEtapa(paso());
      guardar.and.returnValue(
        throwError(() => new ErrorApi(400, 'ERROR_DE_VALIDACION', 'La etapa ya fue registrada')),
      );
      const { raiz, enviar, cierre } = abrir(DialogoEtapaComponent, datos);
      enviar();
      expect(raiz.querySelector('[role=alert]')?.textContent).toContain('La etapa ya fue registrada');
      expect(cierre).not.toHaveBeenCalled();
    });
  });

  describe('DialogoDivisionComponent (HU-M06-04)', () => {
    function dividir() {
      const guardar = jasmine.createSpy('guardar').and.returnValue(of(crearLote()));
      return { guardar, ...abrir(DialogoDivisionComponent, { titulo: 'Dividir', rutas: RUTAS, guardar }) };
    }

    it('empieza con dos partes y no deja quitar por debajo de dos (CA05)', () => {
      const { raiz } = dividir();
      expect(raiz.querySelectorAll('[data-prueba="parte"]').length).toBe(2);
      expect(raiz.querySelector('[data-prueba="quitar-parte"]')).toBeNull();
    });

    it('no deja agregar la séptima parte (CA05)', () => {
      const { fixture, raiz } = dividir();
      const agregar = raiz.querySelector<HTMLButtonElement>('[data-prueba="agregar-parte"]');
      for (let i = 0; i < 6; i++) {
        agregar?.click();
        estabilizar(fixture);
      }
      expect(raiz.querySelectorAll('[data-prueba="parte"]').length).toBe(6);
      expect(agregar?.disabled).toBeTrue();
    });

    it('muestra la suma y cuánto falta antes de enviar, y no bloquea el envío (CA04)', () => {
      const { fixture, raiz, guardar, enviar } = dividir();
      const campos = raiz.querySelectorAll<HTMLInputElement>('[data-prueba="fraccion"]');
      campos[0].value = '0.5';
      campos[0].dispatchEvent(new Event('input'));
      campos[1].value = '0.4';
      campos[1].dispatchEvent(new Event('input'));
      estabilizar(fixture);
      expect(textos(raiz, 'suma')[0]).toContain('0.9 de 1');
      expect(textos(raiz, 'suma')[0]).toContain('faltan 0.1');

      enviar();
      expect(guardar).toHaveBeenCalledTimes(1);
    });

    it('cuando cierra la unidad no avisa de nada', () => {
      const { fixture, raiz } = dividir();
      const campos = raiz.querySelectorAll<HTMLInputElement>('[data-prueba="fraccion"]');
      campos[0].value = '1/2';
      campos[0].dispatchEvent(new Event('input'));
      campos[1].value = '1/2';
      campos[1].dispatchEvent(new Event('input'));
      estabilizar(fixture);
      expect(textos(raiz, 'suma')[0]).toContain('1 de 1');
      expect(textos(raiz, 'suma')[0]).not.toContain('faltan');
    });

    it('envía las partes con sus textos tal como se escribieron, sin espacios', () => {
      const { fixture, raiz, guardar, enviar } = dividir();
      const nombres = raiz.querySelectorAll<HTMLInputElement>('[data-prueba="nombre"]');
      nombres[0].value = ' A ';
      nombres[0].dispatchEvent(new Event('input'));
      const fracciones = raiz.querySelectorAll<HTMLInputElement>('[data-prueba="fraccion"]');
      fracciones[0].value = '1/3';
      fracciones[0].dispatchEvent(new Event('input'));
      fixture.componentInstance['partes'].at(0).patchValue({ ruta: 'ZARANDEO_ENSACADO' });
      enviar();
      expect(guardar.calls.mostRecent().args[0][0]).toEqual({
        nombre: 'A',
        fraccion: '1/3',
        ruta: 'ZARANDEO_ENSACADO',
      });
    });
  });

  describe('DialogoAsignarComponent (HU-M06-01 CA05, CA20)', () => {
    const disponibles: DisponiblesLote = {
      ingresos: [
        {
          id: 1,
          codigo: 'ING-1',
          placa: 'ABC-123',
          fecha_hora_pesaje: '2026-11-01T10:00:00-05:00',
          peso_neto_tn: '10.00',
          lote_actual: null,
        },
        {
          id: 2,
          codigo: 'ING-2',
          placa: 'DEF-456',
          fecha_hora_pesaje: '2026-11-01T11:00:00-05:00',
          peso_neto_tn: '11.00',
          lote_actual: 'LOT-2026-0007',
        },
      ],
      otros_minerales: [
        {
          tipo_mineral: { id: 2, codigo: 'PB', nombre: 'Plomo' },
          ingresos: [
            {
              id: 9,
              codigo: 'ING-9',
              placa: 'XYZ-987',
              fecha_hora_pesaje: '2026-11-01T12:00:00-05:00',
              peso_neto_tn: '9.00',
              lote_actual: null,
            },
          ],
        },
      ],
    };

    function asignar() {
      const guardar = jasmine.createSpy('guardar').and.returnValue(of(crearLote()));
      return { guardar, ...abrir(DialogoAsignarComponent, { titulo: 'Asignar', disponibles, guardar }) };
    }

    const marcar = (raiz: HTMLElement, id: number): void =>
      raiz.querySelector<HTMLInputElement>(`[data-prueba="ingreso-${id}"] input`)?.click();

    it('agrupa los de otro mineral bajo «Agregar de otro tipo de mineral» y dice dónde está cada uno (CA05, CA08)', () => {
      const { raiz } = asignar();
      expect(textos(raiz, 'otros-minerales')).toEqual(['Agregar de otro tipo de mineral']);
      expect(raiz.textContent).toContain('Plomo');
      expect(textos(raiz, 'lote-actual')).toEqual(['· hoy en LOT-2026-0007']);
    });

    it('el campo de autorización aparece solo al elegir uno de otro mineral, antes de enviar (CA20)', () => {
      const { fixture, raiz } = asignar();
      marcar(raiz, 1);
      estabilizar(fixture);
      expect(raiz.querySelector('[data-prueba="autorizacion"]')).toBeNull();
      marcar(raiz, 9);
      estabilizar(fixture);
      expect(raiz.querySelector('[data-prueba="autorizacion"]')).not.toBeNull();
      marcar(raiz, 9);
      estabilizar(fixture);
      expect(raiz.querySelector('[data-prueba="autorizacion"]')).toBeNull();
    });

    it('envía los ingresos elegidos y la autorización solo cuando corresponde', () => {
      const { fixture, raiz, guardar, escribir, enviar } = asignar();
      marcar(raiz, 1);
      marcar(raiz, 9);
      estabilizar(fixture);
      escribir('autorizacion', ' Autoriza el gerente ');
      enviar();
      expect(guardar.calls.mostRecent().args[0]).toEqual({
        ingresos: [1, 9],
        autorizacion: 'Autoriza el gerente',
      });
    });

    it('sin selección envía la lista vacía: el mensaje es del servidor (CA14)', () => {
      const { guardar, enviar } = asignar();
      enviar();
      expect(guardar.calls.mostRecent().args[0]).toEqual({ ingresos: [], autorizacion: '' });
    });

    it('sin nada disponible lo dice', () => {
      const guardar = jasmine.createSpy('guardar').and.returnValue(of(crearLote()));
      const { raiz } = abrir(DialogoAsignarComponent, {
        titulo: 'Asignar',
        disponibles: { ingresos: [], otros_minerales: [] },
        guardar,
      });
      expect(raiz.querySelector('[data-prueba="sin-disponibles"]')).not.toBeNull();
    });
  });

  describe('DialogoBigbagsComponent', () => {
    it('normaliza el peso con coma y envía la cantidad como número', () => {
      const guardar = jasmine.createSpy('guardar').and.returnValue(of({}));
      const { escribir, enviar } = abrir(DialogoBigbagsComponent, { titulo: 'Bigbags', partes: [], guardar });
      escribir('cantidad', '12');
      escribir('peso', '1,45');
      enviar();
      expect(guardar.calls.mostRecent().args[0]).toEqual({
        parte: null,
        cantidad: 12,
        recalcular: false,
        peso_aproximado_tn: '1.45',
      });
    });

    it('pide la parte solo si el lote está dividido', () => {
      const guardar = jasmine.createSpy('guardar').and.returnValue(of({}));
      expect(
        abrir(DialogoBigbagsComponent, { titulo: 'B', partes: [], guardar }).raiz.querySelector(
          '[data-prueba="parte"]',
        ),
      ).toBeNull();
      expect(
        abrir(DialogoBigbagsComponent, { titulo: 'B', partes: [parte()], guardar }).raiz.querySelector(
          '[data-prueba="parte"]',
        ),
      ).not.toBeNull();
    });
  });

  describe('DialogoMineralComponent (HU-M06-01 CA17, CA18)', () => {
    it('envía el mineral elegido; uno repetido lo rechaza el servidor con su mensaje', () => {
      const guardar = jasmine
        .createSpy('guardar')
        .and.returnValue(throwError(() => new ErrorApi(400, 'ERROR', 'El mineral ya está en el lote')));
      const { fixture, raiz, enviar } = abrir(DialogoMineralComponent, {
        titulo: 'Agregar',
        minerales: [{ id: 2, codigo: 'PB', nombre: 'Plomo', unidad_medida: 'TONELADA', activo: true }],
        guardar,
      });
      fixture.componentInstance['formulario'].patchValue({ tipo: 2 });
      enviar();
      expect(guardar).toHaveBeenCalledWith(2);
      expect(raiz.querySelector('[role=alert]')?.textContent).toContain('El mineral ya está en el lote');
    });
  });
});
