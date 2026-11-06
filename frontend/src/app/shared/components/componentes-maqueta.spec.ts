import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';

import { CabeceraDialogoComponent } from './cabecera-dialogo/cabecera-dialogo.component';
import { AvisoFranjaComponent } from './aviso-franja/aviso-franja.component';
import { CifraComponent } from './cifra/cifra.component';
import { FichaComponent } from './ficha/ficha.component';
import { SegmentosComponent } from './segmentos/segmentos.component';

function montar<T>(componente: new () => T, entradas: Record<string, unknown>) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(componente);
  for (const [nombre, valor] of Object.entries(entradas)) {
    fixture.componentRef.setInput(nombre, valor);
  }
  fixture.detectChanges();
  return { fixture, raiz: fixture.nativeElement as HTMLElement };
}

describe('piezas de la maqueta (D-F45, D-F46)', () => {
  it('FichaComponent: el color va en una clase y el punto es opcional', () => {
    const { raiz } = montar(FichaComponent, { color: 'orange', punto: true });
    expect(raiz.classList).toContain('ficha--orange');
    expect(raiz.querySelector('.ficha__punto')).not.toBeNull();
    expect(montar(FichaComponent, { color: 'gray' }).raiz.querySelector('.ficha__punto')).toBeNull();
  });

  it('AvisoFranjaComponent: icono, color y texto proyectado', () => {
    const { raiz } = montar(AvisoFranjaComponent, { color: 'red', icono: 'cancel' });
    expect(raiz.classList).toContain('aviso--red');
    expect(raiz.querySelector('mat-icon')?.textContent).toContain('cancel');
  });

  it('CifraComponent: valor con su unidad y un detalle opcional', () => {
    const { raiz } = montar(CifraComponent, {
      etiqueta: 'Toneladas',
      valor: '13.20',
      unidad: 't',
      detalle: 'Hoy',
    });
    expect(raiz.querySelector('[data-prueba="cifra-valor"]')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '13.20 t',
    );
    expect(raiz.querySelector('[data-prueba="cifra-detalle"]')?.textContent).toBe('Hoy');
    expect(
      montar(CifraComponent, { etiqueta: 'X', valor: '1' }).raiz.querySelector(
        '[data-prueba="cifra-detalle"]',
      ),
    ).toBeNull();
  });

  it('SegmentosComponent: marca la opción activa, y emite la elegida', () => {
    const { fixture, raiz } = montar(SegmentosComponent<string | null>, {
      opciones: [
        { valor: null, texto: 'Todos' },
        { valor: 'A', texto: 'Abiertos' },
      ],
      valor: null,
    });
    const emitidos: (string | null)[] = [];
    fixture.componentInstance.cambio.subscribe((v) => emitidos.push(v));
    const botones = [...raiz.querySelectorAll<HTMLButtonElement>('button')];
    expect(botones.map((b) => b.getAttribute('aria-selected'))).toEqual(['true', 'false']);
    botones[1].click();
    expect(emitidos).toEqual(['A']);
  });

  it('CabeceraDialogoComponent: el título es el del diálogo y «Cerrar» lo cierra sin resultado', () => {
    const cerrar = jasmine.createSpy('close');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: MatDialogRef, useValue: { close: cerrar, id: 'd1' } }],
    });
    const fixture = TestBed.createComponent(CabeceraDialogoComponent);
    fixture.componentRef.setInput('subtitulo', 'Detalle');
    fixture.detectChanges();
    const raiz = fixture.nativeElement as HTMLElement;
    expect(raiz.querySelector('h2')?.classList).toContain('mat-mdc-dialog-title');
    expect(raiz.textContent).toContain('Detalle');
    raiz.querySelector<HTMLButtonElement>('[data-prueba="cerrar-dialogo"]')?.click();
    expect(cerrar).toHaveBeenCalled();
  });
});
