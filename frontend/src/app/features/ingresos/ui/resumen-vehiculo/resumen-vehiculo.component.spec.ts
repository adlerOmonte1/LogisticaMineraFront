import { TestBed } from '@angular/core/testing';

import { ConsultaVehiculo } from '@models/registro-ingreso.model';
import { ResumenVehiculoComponent } from './resumen-vehiculo.component';

describe('ResumenVehiculoComponent', () => {
  const propio = {
    id: 1,
    placa: 'V2K-841',
    titularidad: 'PROPIO',
    capacidad_tn: '18.00',
    tara_tn: '11.80',
    pendiente_destare: false,
    activo: true,
  } as const;

  function montar(placa: string, consulta: ConsultaVehiculo | null, extra: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(ResumenVehiculoComponent);
    fixture.componentRef.setInput('placa', placa);
    fixture.componentRef.setInput('consulta', consulta);
    for (const [nombre, valor] of Object.entries(extra)) {
      fixture.componentRef.setInput(nombre, valor);
    }
    fixture.detectChanges();
    const raiz: HTMLElement = fixture.nativeElement;
    return { fixture, raiz, estado: raiz.querySelector('section')?.getAttribute('data-estado') };
  }

  it('con tara muestra titularidad, capacidad, tara y el neto de referencia', () => {
    const { raiz, estado } = montar(
      'V2K-841',
      { placa: 'V2K-841', vehiculo: propio },
      { pesoBruto: '29,80' },
    );
    expect(estado).toBe('con-tara');
    expect(raiz.textContent).toContain('Propio');
    expect(raiz.textContent).toContain('18.00 t'.replace('.', '.'));
    expect(raiz.querySelector('[data-prueba="neto-referencia"]')?.textContent?.trim()).toBe('18.00 t');
    expect(raiz.textContent).toContain('solo una referencia');
  });

  it('sin tara avisa que el ingreso quedará En proceso (HU-M03-01 CA05)', () => {
    const { raiz, estado } = montar(
      'ZZ3-901',
      { placa: 'ZZ3-901', vehiculo: { ...propio, placa: 'ZZ3-901', tara_tn: null, pendiente_destare: true } },
      { pesoBruto: '15.50' },
    );
    expect(estado).toBe('sin-tara');
    expect(raiz.querySelector('[data-prueba="sin-tara"]')?.textContent).toContain('quedará En proceso');
    expect(raiz.querySelector('[data-prueba="neto-referencia"]')?.textContent?.trim()).toBe('—');
  });

  it('una placa nueva muestra el aviso literal del servidor y ofrece registrar el vehículo', () => {
    const { fixture, raiz, estado } = montar(
      'QQQ-999',
      { placa: 'QQQ-999', vehiculo: null },
      {
        avisoServidor: 'La placa QQQ-999 no está registrada. Complete los datos del vehículo para continuar',
      },
    );
    let pedidos = 0;
    fixture.componentInstance.registrarVehiculo.subscribe(() => pedidos++);

    expect(estado).toBe('nuevo');
    expect(raiz.querySelector('[data-prueba="placa-nueva"]')?.textContent).toContain(
      'La placa QQQ-999 no está registrada',
    );
    raiz.querySelector<HTMLButtonElement>('[data-prueba="registrar-vehiculo"]')?.click();
    expect(pedidos).toBe(1);
  });

  it('sin aviso del servidor usa un texto neutro de la interfaz', () => {
    const { raiz } = montar('QQQ-999', { placa: 'QQQ-999', vehiculo: null });
    expect(raiz.querySelector('[data-prueba="placa-nueva"]')?.textContent).toContain(
      'no está en el catálogo',
    );
  });

  it('un vehículo de baja no se ofrece para registrar', () => {
    const { raiz, estado } = montar('V2K-841', { placa: 'V2K-841', vehiculo: { ...propio, activo: false } });
    expect(estado).toBe('baja');
    expect(raiz.textContent).toContain('dado de baja');
    expect(raiz.querySelector('[data-prueba="registrar-vehiculo"]')).toBeNull();
  });

  it('distingue vacío, consultando y falla del catálogo', () => {
    expect(montar('', null).estado).toBe('vacio');
    expect(montar('ABC-123', null).estado).toBe('consultando');
    expect(montar('ABC-123', { placa: 'OTRA-111', vehiculo: null }).estado).toBe('consultando');
    expect(montar('ABC-123', { placa: 'ABC-123', vehiculo: null, fallo: true }).estado).toBe('fallo');
  });
});
