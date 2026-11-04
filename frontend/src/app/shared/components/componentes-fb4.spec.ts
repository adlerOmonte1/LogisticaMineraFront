import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ACCIONES_EVENTO, Evento } from '@models/evento.model';
import { etiquetaCampo, textoRegistro, textoValor, tonoDeAccion } from '@shared/utils/presentacion-evento';
import { estabilizar } from '../../testing/estabilizar';
import { crearEvento, crearEventoCorreccion } from '../../testing/fabricas';
import { CambiosEventoComponent } from './cambios-evento/cambios-evento.component';
import { LineaEventosComponent } from './linea-eventos/linea-eventos.component';

describe('presentación de un evento', () => {
  it('un valor guardado se vuelve texto sin interpretarlo; lo vacío es un guion', () => {
    expect(textoValor(null)).toBe('—');
    expect(textoValor(undefined)).toBe('—');
    expect(textoValor('')).toBe('—');
    expect(textoValor(true)).toBe('Sí');
    expect(textoValor(false)).toBe('No');
    expect(textoValor('31.50')).toBe('31.50');
    expect(textoValor(0)).toBe('0');
    expect(textoValor(['ZINC', 'PLOMO'])).toBe('ZINC, PLOMO');
    expect(textoValor([])).toBe('—');
    expect(textoValor({ partes: 2 })).toBe('{"partes":2}');
    // Una fecha y hora se lee en la zona de la planta, no como ISO crudo.
    expect(textoValor('2026-11-03T09:15:00-05:00')).toBe('03/11/2026 09:15');
    expect(textoValor('2026-11-03')).toBe('2026-11-03');
  });

  it('el nombre del campo del servidor se lee como etiqueta', () => {
    expect(etiquetaCampo('peso_bruto_tn')).toBe('Peso bruto (t)');
    expect(etiquetaCampo('codigo')).toBe('Código');
    expect(etiquetaCampo('campo_nuevo_del_servidor')).toBe('Campo nuevo del servidor');
    expect(etiquetaCampo('estado')).toBe('Estado');
  });

  it('el registro afectado usa la referencia, o el identificador si no se resolvió', () => {
    expect(textoRegistro({ entidad: 'Ingreso', referencia: 'ING-2026-00331', id_entidad: 331 })).toBe(
      'Ingreso · ING-2026-00331',
    );
    expect(textoRegistro({ entidad: 'Lote', referencia: null, id_entidad: 12 })).toBe('Lote · #12');
    expect(textoRegistro({ entidad: 'Usuario', referencia: null, id_entidad: null })).toBe('Usuario');
  });

  it('cada una de las nueve acciones tiene un tono; el rechazo y la anulación se ven como error', () => {
    for (const accion of ACCIONES_EVENTO) {
      expect(tonoDeAccion(accion)).toBeTruthy();
    }
    expect(tonoDeAccion('ANULAR')).toBe('error');
    expect(tonoDeAccion('ACCESO_RECHAZADO')).toBe('error');
    expect(tonoDeAccion('CREAR')).toBe('exito');
  });
});

describe('CambiosEventoComponent', () => {
  function montar(cambios: Evento['cambios']): HTMLElement {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideNoopAnimations()] });
    const fixture = TestBed.createComponent(CambiosEventoComponent);
    fixture.componentRef.setInput('cambios', cambios);
    estabilizar(fixture);
    return fixture.nativeElement as HTMLElement;
  }

  it('muestra por campo el valor anterior y el nuevo, con sus rótulos escritos (HU-M09-02 CA02)', () => {
    const raiz = montar(crearEventoCorreccion().cambios);
    const cambios = [...raiz.querySelectorAll('[data-prueba="cambio"]')];
    expect(cambios.length).toBe(2);
    expect(cambios[0].textContent).toContain('Peso bruto (t)');
    expect(cambios[0].querySelector('[data-prueba="antes"]')?.textContent).toBe('31.50');
    expect(cambios[0].querySelector('[data-prueba="despues"]')?.textContent).toBe('31.80');
    expect(cambios[0].textContent).toContain('Antes');
    expect(cambios[0].textContent).toContain('Después');
  });

  it('un campo que no tenía valor muestra un guion como anterior', () => {
    const raiz = montar(crearEventoCorreccion().cambios);
    const segundo = raiz.querySelectorAll('[data-prueba="cambio"]')[1];
    expect(segundo.querySelector('[data-prueba="antes"]')?.textContent).toBe('—');
    expect(segundo.querySelector('[data-prueba="despues"]')?.textContent).toBe('ZINC');
  });

  it('sin cambios no dibuja nada', () => {
    expect(montar([]).querySelector('[data-prueba="cambios"]')).toBeNull();
  });
});

describe('LineaEventosComponent', () => {
  function montar(eventos: Evento[], mensajeVacio?: string): HTMLElement {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideNoopAnimations()] });
    const fixture = TestBed.createComponent(LineaEventosComponent);
    fixture.componentRef.setInput('eventos', eventos);
    if (mensajeVacio) {
      fixture.componentRef.setInput('mensajeVacio', mensajeVacio);
    }
    estabilizar(fixture);
    return fixture.nativeElement as HTMLElement;
  }

  it('respeta el orden cronológico que manda el servidor, con fecha y autor (HU-M09-02 CA01)', () => {
    const raiz = montar([crearEvento(), crearEventoCorreccion()]);
    const eventos = [...raiz.querySelectorAll('[data-prueba="evento"]')];
    expect(eventos.length).toBe(2);
    expect(eventos[0].querySelector('[data-prueba="fecha"]')?.textContent?.trim()).toBe('03/11/2026 16:37');
    expect(eventos[0].querySelector('[data-prueba="autor"]')?.textContent?.trim()).toBe('sup.prueba');
    expect(eventos[1].querySelector('[data-prueba="fecha"]')?.textContent?.trim()).toBe('04/11/2026 09:10');
    expect(eventos[1].querySelector('[data-prueba="autor"]')?.textContent?.trim()).toBe('admin.prueba');
  });

  it('la acción va con el texto del servidor y la operación distingue la corrección (CA02)', () => {
    const raiz = montar([crearEventoCorreccion()]);
    expect(raiz.textContent).toContain('Modificar');
    expect(raiz.querySelector('[data-prueba="operacion"]')?.textContent).toBe('Corrección');
  });

  it('la reversión y el destare se distinguen de la corrección', () => {
    const raiz = montar([
      crearEventoCorreccion({ id: 1, operacion: 'REVERSION' }),
      crearEventoCorreccion({ id: 2, operacion: 'DESTARE' }),
    ]);
    const operaciones = [...raiz.querySelectorAll('[data-prueba="operacion"]')].map((o) => o.textContent);
    expect(operaciones).toEqual(['Reversión de una corrección', 'Destare']);
  });

  it('muestra el motivo junto al cambio, y solo cuando lo hay (CA02)', () => {
    const con = montar([crearEventoCorreccion()]);
    expect(con.querySelector('[data-prueba="motivo"]')?.textContent).toContain('La balanza marcó 31.80');
    expect(con.querySelectorAll('[data-prueba="cambio"]').length).toBe(2);
    const sin = montar([crearEvento()]);
    expect(sin.querySelector('[data-prueba="motivo"]')).toBeNull();
    expect(sin.querySelector('[data-prueba="cambios"]')).toBeNull();
  });

  it('incluye los eventos del lote, con su operación (HU-M09-02 CA03)', () => {
    const raiz = montar([
      crearEvento({
        id: 3,
        entidad: 'Lote',
        id_entidad: 12,
        referencia: null,
        accion: 'MODIFICAR',
        accion_texto: 'Modificar',
        operacion: 'ETAPA',
      }),
    ]);
    expect(raiz.querySelector('[data-prueba="operacion"]')?.textContent).toBe('Paso por una etapa');
  });

  it('un evento sin usuario (acceso rechazado sin sesión) lo dice', () => {
    const raiz = montar([
      crearEvento({ usuario: null, accion: 'ACCESO_RECHAZADO', accion_texto: 'Acceso rechazado' }),
    ]);
    expect(raiz.querySelector('[data-prueba="autor"]')?.textContent).toContain('Sin sesión');
  });

  it('sin eventos muestra el mensaje en lugar de una lista vacía', () => {
    const raiz = montar([], 'Este ingreso aún no tiene eventos');
    expect(raiz.querySelector('[data-prueba="evento"]')).toBeNull();
    expect(raiz.querySelector('[role="status"]')?.textContent).toContain('Este ingreso aún no tiene eventos');
  });
});
