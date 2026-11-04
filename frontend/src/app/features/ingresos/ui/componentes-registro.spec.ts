import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CampoReconocidoPropuesto } from '@models/registro-ingreso.model';
import { crearIngreso } from '../../../testing/fabricas';
import { ConfirmacionIngresoComponent } from './confirmacion-ingreso.component';
import { NotaLecturaComponent } from './nota-lectura.component';
import { PasosRegistroComponent } from './pasos-registro.component';

describe('PasosRegistroComponent', () => {
  it('marca el paso actual con aria-current y los anteriores como hechos', () => {
    const fixture = TestBed.createComponent(PasosRegistroComponent);
    fixture.componentRef.setInput('paso', 'revision');
    fixture.detectChanges();
    const pasos = [...(fixture.nativeElement as HTMLElement).querySelectorAll('li')];
    expect(pasos.map((p) => p.getAttribute('aria-current'))).toEqual([null, 'step', null]);
    expect(pasos[0].classList).toContain('pasos__item--hecho');
    expect(pasos[2].classList).not.toContain('pasos__item--hecho');
  });
});

describe('NotaLecturaComponent', () => {
  const campo: CampoReconocidoPropuesto = {
    nombre: 'PLACA',
    valor: 'V2K-841',
    confianza: 0.735,
    dudoso: true,
    aviso: 'Verifique este dato: lectura con baja confianza',
  };

  function montar(estado: string, valor: CampoReconocidoPropuesto | null = campo) {
    const fixture = TestBed.createComponent(NotaLecturaComponent);
    fixture.componentRef.setInput('campo', valor);
    fixture.componentRef.setInput('estado', estado);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent?.replace(/\s+/g, ' ').trim();
  }

  it('un dato dudoso muestra el aviso literal y el porcentaje, con icono (HU-M04-01 CA02)', () => {
    expect(montar('dudoso')).toContain('Verifique este dato: lectura con baja confianza · 74 %');
  });

  it('un dato confiable muestra su confianza', () => {
    expect(montar('ok', { ...campo, dudoso: false, confianza: 0.86 })).toContain('Confianza 86 %');
  });

  it('un dato sin lectura queda editable y lo dice (CA03)', () => {
    expect(montar('sin-lectura', { ...campo, valor: null, confianza: null })).toContain('Sin lectura');
  });

  it('un dato corregido por el usuario ya no muestra la advertencia', () => {
    const texto = montar('corregido');
    expect(texto).toContain('Corregido por usted');
    expect(texto).not.toContain('baja confianza');
  });

  it('sin reconocimiento no dibuja nada', () => {
    expect(montar('ninguna', null)).toBe('');
  });
});

describe('ConfirmacionIngresoComponent', () => {
  it('muestra el mensaje literal del servidor, el código, el estado y los enlaces', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ConfirmacionIngresoComponent);
    fixture.componentRef.setInput('ingreso', {
      ...crearIngreso(),
      mensaje: 'Ingreso registrado con el código ING-2026-00331',
    });
    let otros = 0;
    fixture.componentInstance.registrarOtro.subscribe(() => otros++);
    fixture.detectChanges();
    const raiz: HTMLElement = fixture.nativeElement;

    expect(raiz.querySelector('[data-prueba="mensaje"]')?.textContent).toBe(
      'Ingreso registrado con el código ING-2026-00331',
    );
    expect(raiz.querySelector('[data-prueba="codigo"]')?.textContent).toBe('ING-2026-00331');
    expect(raiz.textContent).toContain('Registrado');
    expect(raiz.querySelector('[data-prueba="ver-detalle"]')?.getAttribute('href')).toBe(
      '/consulta/ingresos/331',
    );
    raiz.querySelector<HTMLButtonElement>('[data-prueba="registrar-otro"]')?.click();
    expect(otros).toBe(1);
  });
});
