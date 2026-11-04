import { TestBed } from '@angular/core/testing';
import { FormControl, FormRecord } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { Inconsistencia } from '@models/error-api.model';
import { ListaInconsistenciasComponent } from './lista-inconsistencias.component';

describe('ListaInconsistenciasComponent', () => {
  const v2: Inconsistencia = {
    regla: 'V2',
    campo: 'peso_bruto_tn',
    mensaje: 'La tara no puede ser mayor o igual que el peso bruto',
    bloqueante: true,
    exige_justificacion: false,
  };
  const v4: Inconsistencia = {
    regla: 'V4',
    campo: 'peso_bruto_tn',
    mensaje: 'El peso neto está fuera del rango de carga del vehículo V2K-841',
    bloqueante: false,
    exige_justificacion: true,
  };

  function montar(inconsistencias: Inconsistencia[], extra: Record<string, unknown> = {}) {
    TestBed.configureTestingModule({ providers: [provideNoopAnimations()] });
    const justificaciones = new FormRecord<FormControl<string>>({
      V4: new FormControl('', { nonNullable: true }),
    });
    const fixture = TestBed.createComponent(ListaInconsistenciasComponent);
    fixture.componentRef.setInput('inconsistencias', inconsistencias);
    fixture.componentRef.setInput('justificaciones', justificaciones);
    for (const [nombre, valor] of Object.entries(extra)) {
      fixture.componentRef.setInput(nombre, valor);
    }
    fixture.detectChanges();
    return { fixture, raiz: fixture.nativeElement as HTMLElement, justificaciones };
  }

  it('no dibuja nada si no hay inconsistencias (HU-M05-01 CA06)', () => {
    expect(montar([]).raiz.querySelector('ul')).toBeNull();
  });

  it('muestra todas las inconsistencias con el mensaje literal (CA01, CA05)', () => {
    const { raiz } = montar([v2, v4]);
    const textos = [...raiz.querySelectorAll('li')].map((li) => li.textContent);
    expect(textos.length).toBe(2);
    expect(textos[0]).toContain('La tara no puede ser mayor o igual que el peso bruto');
    expect(textos[1]).toContain('fuera del rango de carga del vehículo V2K-841');
  });

  it('una bloqueante pide corregir el dato y no tiene caja de justificación', () => {
    const { raiz } = montar([v2]);
    expect(raiz.textContent).toContain('Corrija el dato para poder registrar');
    expect(raiz.querySelector('textarea')).toBeNull();
  });

  it('una que exige justificación lleva su caja, enlazada al control de su regla', () => {
    const { raiz, justificaciones } = montar([v4]);
    const caja = raiz.querySelector<HTMLTextAreaElement>('[data-prueba="justificacion-V4"]');
    expect(caja).not.toBeNull();
    if (caja) {
      caja.value = 'autorizado';
      caja.dispatchEvent(new Event('input'));
    }
    expect(justificaciones.controls['V4'].value).toBe('autorizado');
  });

  it('señala las reglas cuyo dato cambió: se revalidan al confirmar (D-F19)', () => {
    const { raiz } = montar([v4], { porRevalidar: ['V4'] });
    expect(raiz.textContent).toContain('se revalidará al confirmar');
  });

  it('muestra la justificación que el servidor reclamó, con su mensaje literal', () => {
    const { fixture, raiz } = montar([v4], {
      faltantes: [{ regla: 'V4', mensaje: 'Debe indicar la justificación del peso fuera de rango' }],
    });
    const caja = raiz.querySelector('textarea');
    caja?.dispatchEvent(new Event('blur'));
    fixture.componentInstance['justificaciones']().controls['V4'].markAsTouched();
    fixture.componentInstance['justificaciones']().controls['V4'].setErrors({ servidor: true });
    fixture.detectChanges();
    expect(raiz.textContent).toContain('Debe indicar la justificación del peso fuera de rango');
  });
});
