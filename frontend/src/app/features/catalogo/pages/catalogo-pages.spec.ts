import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { DialogosService } from '@core/dialogos/dialogos.service';
import { NotificacionService } from '@core/notificacion/notificacion.service';
import { SesionService } from '@core/sesion/sesion.service';
import { DatosDialogoEnvio } from '@shared/dialogos/dialogo-envio.base';
import { crearRespuestaLogin, crearVehiculo, paginaDe } from '../../../testing/fabricas';
import { TiposMineralApiService } from '../data-access/tipos-mineral-api.service';
import { TransportistasApiService } from '../data-access/transportistas-api.service';
import { VehiculosApiService } from '../data-access/vehiculos-api.service';
import { TiposMineralPage } from './tipos-mineral/tipos-mineral.page';
import { TransportistasPage } from './transportistas/transportistas.page';
import { VehiculosPage } from './vehiculos/vehiculos.page';

describe('Páginas del catálogo', () => {
  let dialogos: jasmine.SpyObj<DialogosService>;
  let notificacion: jasmine.SpyObj<NotificacionService>;
  let vehiculos: jasmine.SpyObj<VehiculosApiService>;
  let transportistas: jasmine.SpyObj<TransportistasApiService>;
  let tipos: jasmine.SpyObj<TiposMineralApiService>;
  const metodos = ['listar', 'listarVigentes', 'crear', 'editar', 'desactivar', 'reactivar'] as const;

  beforeEach(() => {
    dialogos = jasmine.createSpyObj<DialogosService>('DialogosService', ['abrir', 'confirmar']);
    notificacion = jasmine.createSpyObj<NotificacionService>('NotificacionService', ['exito', 'rechazo']);
    vehiculos = jasmine.createSpyObj<VehiculosApiService>('VehiculosApiService', [
      ...metodos,
      'modificarTara',
    ]);
    transportistas = jasmine.createSpyObj<TransportistasApiService>('TransportistasApiService', [...metodos]);
    tipos = jasmine.createSpyObj<TiposMineralApiService>('TiposMineralApiService', [...metodos]);
    vehiculos.listar.and.returnValue(
      of(
        paginaDe([
          crearVehiculo(),
          crearVehiculo({ id: 8, placa: 'XYZ-987', pendiente_destare: true, tara_tn: null }),
        ]),
      ),
    );
    transportistas.listar.and.returnValue(of(paginaDe([])));
    transportistas.listarVigentes.and.returnValue(of([]));
    tipos.listar.and.returnValue(of(paginaDe([])));
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        { provide: DialogosService, useValue: dialogos },
        { provide: NotificacionService, useValue: notificacion },
        { provide: VehiculosApiService, useValue: vehiculos },
        { provide: TransportistasApiService, useValue: transportistas },
        { provide: TiposMineralApiService, useValue: tipos },
      ],
    });
  });

  afterEach(() => localStorage.clear());

  function montarVehiculos() {
    const fixture = TestBed.createComponent(VehiculosPage);
    fixture.detectChanges();
    return fixture;
  }

  it('vehículos: muestra «Pendiente de destare» cuando no hay tara (HU-M02-01 CA08)', () => {
    const elemento: HTMLElement = montarVehiculos().nativeElement;
    expect(elemento.textContent).toContain('ABC-123');
    expect(elemento.textContent).toContain('Pendiente de destare');
  });

  it('vehículos: filtra por titularidad y por placa normalizada', () => {
    const pagina = montarVehiculos().componentInstance;
    pagina.filtrarPorTitularidad('EXTERNO');
    pagina.buscarPlaca(' abc-123 ');
    expect(vehiculos.listar).toHaveBeenCalledWith(
      jasmine.objectContaining({ titularidad: 'EXTERNO', placa: 'ABC-123' }),
      1,
    );
  });

  it('vehículos: la edición envía solo lo que cambió', () => {
    dialogos.abrir.and.returnValue(of(undefined));
    const vehiculo = crearVehiculo();
    montarVehiculos().componentInstance.editar(vehiculo);

    const datos = dialogos.abrir.calls.mostRecent().args[1] as DatosDialogoEnvio<object, unknown>;
    vehiculos.editar.and.returnValue(of(vehiculo));
    datos
      .guardar({ placa: 'ABC-123', tipo_titularidad: 'PROPIO', capacidad_tn: '32.00', transportista: null })
      .subscribe();
    expect(vehiculos.editar).toHaveBeenCalledWith(7, { capacidad_tn: '32.00' });
  });

  it('vehículos: el alta recibe los transportistas vigentes y avisa al guardar', () => {
    dialogos.abrir.and.returnValue(of(crearVehiculo()));
    montarVehiculos().componentInstance.crear();
    expect(transportistas.listarVigentes).toHaveBeenCalled();
    expect(notificacion.exito).toHaveBeenCalledWith('Vehículo registrado');
  });

  it('vehículos: solo el Administrador ve «Modificar tara» (HU-M02-01 CA09)', () => {
    TestBed.inject(SesionService).iniciar(crearRespuestaLogin('ADMINISTRATIVO'));
    const fixture = montarVehiculos();
    expect(
      (fixture.componentInstance as unknown as { puedeModificarTara(): boolean }).puedeModificarTara(),
    ).toBeFalse();
    TestBed.inject(SesionService).iniciar(crearRespuestaLogin('ADMINISTRADOR'));
    expect(
      (fixture.componentInstance as unknown as { puedeModificarTara(): boolean }).puedeModificarTara(),
    ).toBeTrue();
  });

  it('vehículos: modificar la tara abre su diálogo', () => {
    dialogos.abrir.and.returnValue(of(undefined));
    montarVehiculos().componentInstance.modificarTara(crearVehiculo());
    expect(dialogos.abrir).toHaveBeenCalled();
  });

  it('dar de baja muestra el mensaje del servidor, o el de la interfaz si no viene (D-07)', () => {
    dialogos.confirmar.and.returnValue(of(true));
    const pagina = montarVehiculos().componentInstance;
    vehiculos.desactivar.and.returnValue(
      of({ ...crearVehiculo(), mensaje: 'El vehículo se desactivó porque tiene ingresos registrados' }),
    );
    pagina.desactivar(crearVehiculo());
    vehiculos.reactivar.and.returnValue(of(crearVehiculo()));
    pagina.reactivar(crearVehiculo());

    expect(notificacion.exito).toHaveBeenCalledWith(
      'El vehículo se desactivó porque tiene ingresos registrados',
    );
    expect(notificacion.exito).toHaveBeenCalledWith('Vehículo reactivado');
  });

  it('mostrar dados de baja recarga incluyendo inactivos', () => {
    montarVehiculos().componentInstance.mostrarInactivos(true);
    expect(vehiculos.listar).toHaveBeenCalledWith(jasmine.objectContaining({ incluir_inactivos: true }), 1);
  });

  it('tipos de mineral: la edición solo envía el nombre (RN-M02-16)', () => {
    dialogos.abrir.and.returnValue(of(undefined));
    const fixture = TestBed.createComponent(TiposMineralPage);
    fixture.detectChanges();
    const tipo = { id: 2, codigo: 'MOA', nombre: 'Óxido', unidad_medida: 'TONELADA' as const, activo: true };
    fixture.componentInstance.editar(tipo);
    const datos = dialogos.abrir.calls.mostRecent().args[1] as DatosDialogoEnvio<
      { codigo: string; nombre: string },
      unknown
    >;
    tipos.editar.and.returnValue(of(tipo));
    datos.guardar({ codigo: 'OTRO', nombre: 'Óxido rojo' }).subscribe();
    expect(tipos.editar).toHaveBeenCalledWith(2, { nombre: 'Óxido rojo' });

    fixture.componentInstance.crear();
    expect(dialogos.abrir).toHaveBeenCalledTimes(2);
  });

  it('transportistas: alta y edición abren su diálogo', () => {
    dialogos.abrir.and.returnValue(of(undefined));
    const fixture = TestBed.createComponent(TransportistasPage);
    fixture.detectChanges();
    const transportista = { id: 1, razon_social: 'TH', ruc: '20123456789', activo: true };
    fixture.componentInstance.crear();
    fixture.componentInstance.editar(transportista);
    const datos = dialogos.abrir.calls.mostRecent().args[1] as DatosDialogoEnvio<object, unknown>;
    transportistas.editar.and.returnValue(of(transportista));
    datos.guardar({ razon_social: 'TH', ruc: '20999999999' }).subscribe();
    expect(transportistas.editar).toHaveBeenCalledWith(1, { ruc: '20999999999' });
  });
});
