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
  PasoRecorrido,
  RutaCatalogo,
  SiguientePaso,
} from '@models/lote.model';
import { estabilizar } from '../../testing/estabilizar';
import { crearLote } from '../../testing/fabricas';
import { BigbagsLoteComponent } from './ui/bigbags-lote/bigbags-lote.component';
import { ComposicionLoteComponent } from './ui/composicion-lote/composicion-lote.component';
import { DialogoAsignarComponent } from './ui/dialogo-asignar/dialogo-asignar.component';
import { DialogoBigbagsComponent } from './ui/dialogo-bigbags/dialogo-bigbags.component';
import { DialogoDivisionComponent } from './ui/dialogo-division/dialogo-division.component';
import { DialogoEtapaComponent } from './ui/dialogo-etapa/dialogo-etapa.component';
import { DialogoMineralComponent } from './ui/dialogo-mineral/dialogo-mineral.component';
import { construirFlujo } from './ui/flujo-lote/flujo-lote';
import { FlujoLoteComponent } from './ui/flujo-lote/flujo-lote.component';

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

const CATALOGO = { etapas: ETAPAS, rutas: RUTAS, destinos: [] };

function pasoRecorrido(cambios: Partial<PasoRecorrido> = {}): PasoRecorrido {
  return {
    id: 1,
    etapa: 'SECADO',
    etapa_texto: 'Secado',
    carga: 'Lote prueba',
    parte: null,
    ingreso_tardio: null,
    fecha_hora: '2026-11-03T09:00:00-05:00',
    usuario: 'sup.prueba',
    horas_molienda: null,
    observacion: '',
    ...cambios,
  };
}

const BIGBAG = {
  id: 1,
  parte: null,
  cantidad: 9,
  peso_aproximado_tn: '1.47',
  recalculado: false,
  es_estimacion: true,
  fecha_hora: '2026-11-03T10:00:00-05:00',
};

describe('construirFlujo (RNF-M06-07)', () => {
  it('la tarjeta siguiente es la que nombra `siguientes`; el cliente no la deduce', () => {
    const flujo = construirFlujo(crearLote(), CATALOGO);
    expect(flujo.secado.estado).toBe('next');
    expect(flujo.secado.siguiente).toEqual(paso());
    expect(flujo.lineas.length).toBe(1);
    expect(flujo.lineas[0].etapas).toBeNull();
    expect(flujo.sueltos).toEqual([]);
  });

  it('un lote abierto espera el inicio del recorrido', () => {
    const flujo = construirFlujo(crearLote({ estado: 'ABIERTO', siguientes: [] }), CATALOGO);
    expect(flujo.secado.estado).toBe('wait');
  });

  it('tras el secado, «Ruta por definir» lleva el paso que pide elegirla (HU-M06-02 CA02)', () => {
    const elegir = paso({ etapa: null, elegir_ruta: true });
    const flujo = construirFlujo(crearLote({ recorrido: [pasoRecorrido()], siguientes: [elegir] }), CATALOGO);
    expect(flujo.secado.estado).toBe('ok');
    expect(flujo.lineas[0].elegirRuta).toEqual(elegir);
  });

  it('dividido: una columna por parte con las etapas de su ruta y el avance', () => {
    const flujo = construirFlujo(
      crearLote({
        partes: [
          parte(),
          parte({ id: 2, nombre: 'Parte B', ruta: 'MOLIENDA_ENSACADO', ruta_texto: 'Molido' }),
        ],
        recorrido: [
          pasoRecorrido(),
          pasoRecorrido({ id: 2, etapa: 'ZARANDEO', etapa_texto: 'Zarandeo', parte: 1, carga: 'Parte A' }),
        ],
        siguientes: [
          paso({ carga: 'Parte A', parte: 1, etapa: 'ENSACADO' }),
          paso({ carga: 'Parte B', parte: 2, etapa: 'MOLIENDA' }),
        ],
      }),
      CATALOGO,
    );
    expect(flujo.dividido).toBeTrue();
    expect(flujo.lineas.map((l) => l.etapas?.map((t) => `${t.etapa}:${t.estado}`))).toEqual([
      ['ZARANDEO:ok', 'ENSACADO:next'],
      ['MOLIENDA:next', 'ENSACADO:pend'],
    ]);
    expect(flujo.avance).toEqual({ hechas: 2, total: 5 });
  });

  it('un tardío con secado propio va aparte con su propio paso (HU-M06-01 CA13)', () => {
    const base = crearLote();
    const tardio = {
      ...base.composicion[0].ingresos[0],
      id: 9,
      codigo: 'ING-T',
      tardio: true,
      secado_propio: true,
    };
    const secadoPropio = paso({ carga: 'ING-T', ingreso: 9 });
    const flujo = construirFlujo(
      crearLote({
        composicion: [{ ...base.composicion[0], ingresos: [...base.composicion[0].ingresos, tardio] }],
        recorrido: [pasoRecorrido()],
        siguientes: [secadoPropio],
      }),
      CATALOGO,
    );
    expect(flujo.complementos.length).toBe(1);
    expect(flujo.complementos[0].secado.siguiente).toEqual(secadoPropio);
    expect(flujo.secado.estado).toBe('ok');
  });

  it('un `siguientes` que no encaja en ninguna tarjeta se ofrece igual', () => {
    const raro = paso({ carga: 'Otra', parte: 99, etapa: 'MOLIENDA' });
    const flujo = construirFlujo(crearLote({ siguientes: [paso(), raro] }), CATALOGO);
    expect(flujo.sueltos).toEqual([raro]);
  });

  it('el lote cerrado cuenta todas las etapas como hechas', () => {
    const flujo = construirFlujo(crearLote({ estado: 'CERRADO', siguientes: [] }), CATALOGO);
    expect(flujo.avance.hechas).toBe(flujo.avance.total);
  });
});

describe('FlujoLoteComponent (HU-M06-02)', () => {
  it('dibuja la etapa común con el botón del `siguientes` del servidor, y lo emite', () => {
    const { fixture, raiz } = montar(FlujoLoteComponent, {
      lote: crearLote(),
      catalogo: CATALOGO,
      puedeRegistrar: true,
    });
    const emitidos: SiguientePaso[] = [];
    fixture.componentInstance.registrar.subscribe((p) => emitidos.push(p));
    expect(textos(raiz, 'siguiente')).toEqual(['Registrar secado']);
    raiz.querySelector<HTMLButtonElement>('[data-prueba="siguiente"]')?.click();
    expect(emitidos).toEqual([paso()]);
  });

  it('sin permiso para registrar no ofrece botones, pero dice cuál sigue', () => {
    const { raiz } = montar(FlujoLoteComponent, { lote: crearLote(), catalogo: CATALOGO });
    expect(raiz.querySelector('[data-prueba="siguiente"]')).toBeNull();
    expect(textos(raiz, 'etapa-estado')).toContain('Siguiente etapa');
  });

  it('«Ruta por definir» ofrece registrar el siguiente paso (CA02)', () => {
    const elegir = paso({ etapa: null, elegir_ruta: true });
    const { raiz } = montar(FlujoLoteComponent, {
      lote: crearLote({ recorrido: [pasoRecorrido()], siguientes: [elegir] }),
      catalogo: CATALOGO,
      puedeRegistrar: true,
    });
    expect(raiz.querySelector('[data-prueba="ruta-por-definir"]')).not.toBeNull();
    expect(textos(raiz, 'siguiente')).toEqual(['Registrar siguiente paso']);
  });

  it('una etapa hecha dice quién y cuándo, y las horas de molienda', () => {
    const { raiz } = montar(FlujoLoteComponent, {
      lote: crearLote({
        ruta: 'MOLIENDA_ENSACADO',
        recorrido: [
          pasoRecorrido(),
          pasoRecorrido({ id: 2, etapa: 'MOLIENDA', etapa_texto: 'Molienda', horas_molienda: '4.00' }),
        ],
        siguientes: [paso({ etapa: 'ENSACADO' })],
      }),
      catalogo: CATALOGO,
      puedeRegistrar: true,
    });
    expect(textos(raiz, 'etapa-nombre')).toEqual(['Secado', 'Molienda', 'Ensacado']);
    expect(textos(raiz, 'etapa-registro')[0]).toContain('sup.prueba');
    expect(textos(raiz, 'horas')).toEqual(['4 h de molienda']);
    expect(textos(raiz, 'siguiente')).toEqual(['Registrar ensacado']);
  });

  it('dividido: «Dividido en 2 partes» y una columna por parte', () => {
    const { raiz } = montar(FlujoLoteComponent, {
      lote: crearLote({
        partes: [parte(), parte({ id: 2, nombre: 'Parte B' })],
        recorrido: [pasoRecorrido()],
        siguientes: [],
      }),
      catalogo: CATALOGO,
    });
    expect(textos(raiz, 'dividido')).toEqual(['Dividido en 2 partes']);
    expect(textos(raiz, 'linea-nombre')).toEqual(['Parte A', 'Parte B']);
    expect(textos(raiz, 'linea-detalle')[0]).toBe('Zaranda, 1/2 del lote, ≈ 6.60 t');
  });

  it('con el ensacado, los bigbags son estimación y «Asociar» solo aparece si se puede (CA11, CA13)', () => {
    const lote = crearLote({
      ruta: 'ZARANDEO_ENSACADO',
      recorrido: [
        pasoRecorrido(),
        pasoRecorrido({ id: 2, etapa: 'ZARANDEO', etapa_texto: 'Zarandeo' }),
        pasoRecorrido({ id: 3, etapa: 'ENSACADO', etapa_texto: 'Ensacado' }),
      ],
      bigbags: [BIGBAG],
      siguientes: [],
      pendientes: [],
    });
    const lectura = montar(FlujoLoteComponent, { lote, catalogo: CATALOGO });
    const resumen = textos(lectura.raiz, 'resumen-bigbags')[0];
    expect(resumen).toContain('9 bigbags');
    expect(resumen).toContain('≈ 13.23 t');
    expect(resumen).toContain('(estimación)');
    expect(lectura.raiz.querySelector('[data-prueba="asociar-bigbags"]')).toBeNull();
    const gestion = montar(FlujoLoteComponent, { lote, catalogo: CATALOGO, puedeAsociar: true });
    expect(gestion.raiz.querySelector('[data-prueba="asociar-bigbags"]')).not.toBeNull();
  });

  it('el tardío con secado propio tiene su tarjeta y su botón', () => {
    const base = crearLote();
    const tardio = {
      ...base.composicion[0].ingresos[0],
      id: 9,
      codigo: 'ING-T',
      tardio: true,
      secado_propio: true,
    };
    const { raiz } = montar(FlujoLoteComponent, {
      lote: crearLote({
        composicion: [{ ...base.composicion[0], ingresos: [...base.composicion[0].ingresos, tardio] }],
        recorrido: [pasoRecorrido()],
        siguientes: [paso({ carga: 'ING-T', ingreso: 9 })],
      }),
      catalogo: CATALOGO,
      puedeRegistrar: true,
    });
    expect(raiz.querySelectorAll('[data-prueba="complemento"]').length).toBe(1);
    expect(textos(raiz, 'siguiente')).toEqual(['Registrar secado propio']);
  });
});

describe('BigbagsLoteComponent (HU-M06-02 CA11)', () => {
  it('cada registro con su parte, peso por bigbag y total, siempre aproximados', () => {
    const { raiz } = montar(BigbagsLoteComponent, {
      bigbags: [{ ...BIGBAG, parte: 1, cantidad: 2, peso_aproximado_tn: '2.72', recalculado: true }],
      partes: [parte()],
    });
    const fila = textos(raiz, 'bigbags')[0];
    expect(fila).toContain('Parte A');
    expect(fila).toContain('Recalculado');
    expect(fila).toContain('≈ 5.44 t');
    expect(textos(raiz, 'peso-bigbag')[0]).toBe('≈ 2.72 t');
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
    expect(textos(raiz, 'grupo-vacio')).toEqual(['Sin ingresos de este mineral todavía.']);
  });

  it('cada código lleva al detalle del ingreso', () => {
    const { raiz } = montar(ComposicionLoteComponent, { composicion: composicion(), total });
    expect(raiz.querySelector('[data-prueba="codigo"]')?.getAttribute('href')).toBe('/consulta/ingresos/1');
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
