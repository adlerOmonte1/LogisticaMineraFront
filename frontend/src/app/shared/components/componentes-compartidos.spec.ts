import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ErrorApi } from '@models/error-api.model';
import { AccionesRegistroComponent, AccionExtra } from './acciones-registro/acciones-registro.component';
import { AvisoErrorComponent } from './aviso-error/aviso-error.component';
import { InsigniaEstadoComponent } from './insignia-estado/insignia-estado.component';
import { MarcoListadoComponent } from './marco-listado/marco-listado.component';

@Component({
  standalone: true,
  imports: [MarcoListadoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-marco-listado
      [vacio]="vacio()"
      mensajeVacio="No hay vehículos con estos filtros"
      [total]="60"
      (cambioPagina)="pagina = $event"
    >
      <span filtros class="filtro">filtro</span>
      <p class="tabla-proyectada">tabla</p>
    </app-marco-listado>
  `,
})
class AnfitrionListadoComponent {
  readonly vacio = signal(false);
  pagina = 1;
}

describe('Componentes compartidos', () => {
  it('insignia: lleva icono y texto, no solo color', () => {
    const fixture = TestBed.createComponent(InsigniaEstadoComponent);
    fixture.componentRef.setInput('texto', 'Pendiente de destare');
    fixture.componentRef.setInput('tono', 'aviso');
    fixture.detectChanges();
    const elemento: HTMLElement = fixture.nativeElement;
    expect(elemento.textContent).toContain('Pendiente de destare');
    expect(elemento.querySelector('mat-icon')?.textContent).toBe('schedule');
    expect(elemento.querySelector('.insignia--aviso')).not.toBeNull();
  });

  it('aviso de error: muestra el mensaje literal con role=alert', () => {
    const fixture = TestBed.createComponent(AvisoErrorComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]')).toBeNull();
    fixture.componentRef.setInput('error', new ErrorApi(400, 'X', 'La placa ya está registrada'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain(
      'La placa ya está registrada',
    );
  });

  it('acciones de un registro: extras solo mientras está activo, y reactivar si está de baja', async () => {
    await TestBed.configureTestingModule({ providers: [provideNoopAnimations()] }).compileComponents();
    const fixture = TestBed.createComponent(AccionesRegistroComponent);
    const extras: AccionExtra[] = [
      { id: 'tara', etiqueta: 'Modificar tara', icono: 'scale', soloActivo: true },
    ];
    fixture.componentRef.setInput('nombre', 'ABC-123');
    fixture.componentRef.setInput('activo', false);
    fixture.componentRef.setInput('extras', extras);
    fixture.detectChanges();

    const elegidas: string[] = [];
    fixture.componentInstance.reactivar.subscribe(() => elegidas.push('reactivar'));
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    const opciones = [...document.querySelectorAll('.mat-mdc-menu-item')].map((b) => b.textContent?.trim());
    expect(opciones.some((texto) => texto?.includes('Modificar tara'))).toBeFalse();
    (document.querySelector('.mat-mdc-menu-item:last-child') as HTMLElement).click();
    expect(elegidas).toEqual(['reactivar']);
  });

  it('marco de listado: proyecta filtros y tabla, o el estado vacío', () => {
    TestBed.configureTestingModule({ providers: [provideNoopAnimations()] });
    const fixture = TestBed.createComponent(AnfitrionListadoComponent);
    fixture.detectChanges();
    const elemento: HTMLElement = fixture.nativeElement;
    expect(elemento.querySelector('.filtros .filtro')).not.toBeNull();
    expect(elemento.querySelector('.tabla-proyectada')).not.toBeNull();

    fixture.componentInstance.vacio.set(true);
    fixture.detectChanges();
    expect(elemento.querySelector('.tabla-proyectada')).toBeNull();
    expect(elemento.textContent).toContain('No hay vehículos con estos filtros');

    (elemento.querySelector('button.mat-mdc-paginator-navigation-next') as HTMLButtonElement).click();
    expect(fixture.componentInstance.pagina).toBe(2);
  });
});
