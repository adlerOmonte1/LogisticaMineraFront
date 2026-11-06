import { TestBed } from '@angular/core/testing';

import { EstadoIngreso } from '@models/ingreso.model';
import { IndicadorConfianzaComponent } from './indicador-confianza/indicador-confianza.component';
import { InsigniaIngresoComponent } from './insignia-ingreso/insignia-ingreso.component';
import { MarcaSinRespaldoComponent } from './marca-sin-respaldo/marca-sin-respaldo.component';
import { VisorImagenComponent } from './visor-imagen/visor-imagen.component';

describe('IndicadorConfianzaComponent', () => {
  function texto(entradas: Record<string, unknown>): string {
    const fixture = TestBed.createComponent(IndicadorConfianzaComponent);
    for (const [nombre, valor] of Object.entries(entradas)) {
      fixture.componentRef.setInput(nombre, valor);
    }
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  it('acepta la confianza como número (borrador) o como cadena (guardada)', () => {
    expect(texto({ confianza: 0.906 })).toContain('Confianza 91 %');
    expect(texto({ confianza: '0.735' })).toContain('74 %');
  });

  it('un dato dudoso muestra el aviso literal del servidor', () => {
    expect(
      texto({ confianza: 0.735, dudoso: true, aviso: 'Verifique este dato: lectura con baja confianza' }),
    ).toContain('Verifique este dato: lectura con baja confianza · 74 %');
  });

  it('sin confianza: no hubo lectura y el dato queda para completar', () => {
    expect(texto({ confianza: null })).toContain('Sin lectura');
    expect(texto({ confianza: '' })).toContain('Sin lectura');
  });
});

describe('Insignias del ingreso', () => {
  it('cada estado lleva su texto y su tono, no solo color', () => {
    const esperado: Record<EstadoIngreso, [string, string]> = {
      REGISTRADO: ['Registrado', 'ficha--green'],
      EN_PROCESO: ['En proceso', 'ficha--orange'],
      ANULADO: ['Anulado', 'ficha--red'],
    };
    for (const [estado, [texto, clase]] of Object.entries(esperado)) {
      const fixture = TestBed.createComponent(InsigniaIngresoComponent);
      fixture.componentRef.setInput('estado', estado);
      fixture.detectChanges();
      const raiz: HTMLElement = fixture.nativeElement;
      expect(raiz.textContent).toContain(texto);
      expect(raiz.querySelector(`.${clase}`)).not.toBeNull();
    }
  });

  it('«sin respaldo fotográfico» muestra su marca y su motivo', () => {
    const fixture = TestBed.createComponent(MarcaSinRespaldoComponent);
    fixture.componentRef.setInput('motivo', 'Sin cámara');
    fixture.detectChanges();
    const raiz: HTMLElement = fixture.nativeElement;
    expect(raiz.textContent).toContain('Sin respaldo fotográfico');
    expect(raiz.querySelector('app-ficha')?.getAttribute('title')).toBe('Sin cámara');
  });
});

describe('VisorImagenComponent', () => {
  function montar(entradas: Record<string, unknown>) {
    const fixture = TestBed.createComponent(VisorImagenComponent);
    for (const [nombre, valor] of Object.entries(entradas)) {
      fixture.componentRef.setInput(nombre, valor);
    }
    fixture.detectChanges();
    return { fixture, raiz: fixture.nativeElement as HTMLElement };
  }

  it('muestra la miniatura y la amplía en un diálogo nativo (HU-M07-01 CA03)', () => {
    const { fixture, raiz } = montar({ src: 'blob:http://localhost/imagen', alt: 'Ticket' });
    const dialogo = raiz.querySelector('dialog') as HTMLDialogElement;
    expect(raiz.querySelector('.visor__miniatura img')?.getAttribute('src')).toBe(
      'blob:http://localhost/imagen',
    );
    expect(dialogo.open).toBeFalse();

    raiz.querySelector<HTMLButtonElement>('.visor__miniatura')?.click();
    fixture.detectChanges();
    expect(dialogo.open).toBeTrue();

    raiz.querySelector<HTMLButtonElement>('.ampliacion__barra button:last-child')?.click();
    expect(dialogo.open).toBeFalse();
  });

  it('alterna entre ajustar a la pantalla y tamaño real', () => {
    const { fixture, raiz } = montar({ src: 'blob:x' });
    raiz.querySelector<HTMLButtonElement>('.visor__miniatura')?.click();
    fixture.detectChanges();
    expect(raiz.querySelector('.ampliacion__marco--real')).toBeNull();
    raiz.querySelector<HTMLButtonElement>('.ampliacion__imagen')?.click();
    fixture.detectChanges();
    expect(raiz.querySelector('.ampliacion__marco--real')).not.toBeNull();
    (raiz.querySelector('dialog') as HTMLDialogElement).close();
  });

  it('distingue cargando, error y sin imagen', () => {
    expect(montar({ estado: 'cargando' }).raiz.textContent).toContain('Cargando imagen');
    expect(montar({ estado: 'error' }).raiz.textContent).toContain('No se pudo cargar la imagen');
    expect(montar({ src: null }).raiz.querySelector('.visor__miniatura')).toBeNull();
  });
});
