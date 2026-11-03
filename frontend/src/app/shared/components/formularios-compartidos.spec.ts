import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ErrorApi } from '@models/error-api.model';
import { NuevoVehiculo } from '@models/vehiculo.model';
import { crearVehiculo } from '../../testing/fabricas';
import {
  FormularioTipoMineralComponent,
  ValorTipoMineral,
} from './formulario-tipo-mineral/formulario-tipo-mineral.component';
import { FormularioVehiculoComponent } from './formulario-vehiculo/formulario-vehiculo.component';

interface ConFormulario {
  formulario: {
    patchValue(valor: object): void;
    controls: Record<string, { value: unknown; errors: object | null }>;
  };
}

describe('FormularioVehiculoComponent', () => {
  function montar(entradas: Record<string, unknown> = {}) {
    TestBed.configureTestingModule({ providers: [provideNoopAnimations()] });
    const fixture = TestBed.createComponent(FormularioVehiculoComponent);
    for (const [nombre, valor] of Object.entries(entradas)) {
      fixture.componentRef.setInput(nombre, valor);
    }
    fixture.detectChanges();
    const emitidos: NuevoVehiculo[] = [];
    fixture.componentInstance.enviar.subscribe((valor) => emitidos.push(valor));
    const { formulario } = fixture.componentInstance as unknown as ConFormulario;
    const enviar = () => fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    return { fixture, emitidos, formulario, enviar };
  }

  it('el transportista solo aparece y viaja con un vehículo externo (HU-M02-01 CA04, CA05)', () => {
    const { fixture, emitidos, formulario, enviar } = montar();
    expect(fixture.nativeElement.querySelector('[data-prueba="transportista"]')).toBeNull();

    formulario.patchValue({
      placa: 'abc-123',
      capacidad_tn: '30,5',
      tipo_titularidad: 'EXTERNO',
      transportista: 4,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-prueba="transportista"]')).not.toBeNull();
    enviar();
    formulario.patchValue({ tipo_titularidad: 'PROPIO' });
    enviar();

    expect(emitidos).toEqual([
      { placa: 'ABC-123', tipo_titularidad: 'EXTERNO', capacidad_tn: '30.5', transportista: 4 },
      { placa: 'ABC-123', tipo_titularidad: 'PROPIO', capacidad_tn: '30.5', transportista: null },
    ]);
  });

  it('no emite con la capacidad vacía o inválida', () => {
    const { emitidos, formulario, enviar } = montar();
    formulario.patchValue({ placa: 'ABC-123', capacidad_tn: '0' });
    enviar();
    expect(emitidos.length).toBe(0);
  });

  it('precarga el vehículo al editar y conserva un transportista de baja entre las opciones', () => {
    const vehiculo = crearVehiculo({
      titularidad: 'EXTERNO',
      transportista: 9,
      transportista_nombre: 'De baja SAC',
    });
    const { formulario, fixture } = montar({ vehiculo, transportistas: [] });
    expect(formulario.controls['placa'].value).toBe('ABC-123');
    const opciones = (
      fixture.componentInstance as unknown as { opcionesTransportista(): { id: number }[] }
    ).opcionesTransportista();
    expect(opciones.map((o) => o.id)).toEqual([9]);
  });

  it('usa la placa sugerida del ticket en el alta desde el registro', () => {
    const { formulario } = montar({ placaSugerida: 'b5a 812' });
    expect(formulario.controls['placa'].value).toBe('B5A812');
  });

  it('pinta los errores de campo del servidor', () => {
    const { fixture, formulario } = montar();
    fixture.componentRef.setInput(
      'error',
      new ErrorApi(400, 'X', 'La placa ya está registrada', { placa: 'Repetida' }),
    );
    fixture.detectChanges();
    expect(formulario.controls['placa'].errors).toEqual(jasmine.objectContaining({ servidor: 'Repetida' }));
  });
});

describe('FormularioTipoMineralComponent', () => {
  it('normaliza el código y no adelanta las reglas del servidor (CA05, CA06, CA08)', () => {
    TestBed.configureTestingModule({ providers: [provideNoopAnimations()] });
    const fixture = TestBed.createComponent(FormularioTipoMineralComponent);
    fixture.detectChanges();
    const emitidos: ValorTipoMineral[] = [];
    fixture.componentInstance.enviar.subscribe((valor) => emitidos.push(valor));

    const codigo: HTMLInputElement = fixture.nativeElement.querySelector('[data-prueba="codigo"]');
    codigo.value = 'moa ';
    codigo.dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    expect(emitidos).toEqual([{ codigo: 'MOA', nombre: '' }]);
  });

  it('en la edición el código es de solo lectura', () => {
    TestBed.configureTestingModule({ providers: [provideNoopAnimations()] });
    const fixture = TestBed.createComponent(FormularioTipoMineralComponent);
    fixture.componentRef.setInput('tipoMineral', {
      id: 1,
      codigo: 'MOA',
      nombre: 'Óxido',
      unidad_medida: 'TONELADA',
      activo: true,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-prueba="codigo"]').readOnly).toBeTrue();
    expect(fixture.nativeElement.querySelector('[data-prueba="nombre"]').value).toBe('Óxido');
  });
});
