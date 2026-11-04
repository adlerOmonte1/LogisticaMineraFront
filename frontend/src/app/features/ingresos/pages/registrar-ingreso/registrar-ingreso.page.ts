import { ChangeDetectionStrategy, Component, OnInit, effect, inject, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime, filter, switchMap } from 'rxjs';

import { TiposMineralApiService } from '@core/catalogo/tipos-mineral-api.service';
import { TransportistasApiService } from '@core/catalogo/transportistas-api.service';
import { VehiculosApiService } from '@core/catalogo/vehiculos-api.service';
import { DialogosService } from '@core/dialogos/dialogos.service';
import { NotificacionService } from '@core/notificacion/notificacion.service';
import { TipoMineral } from '@models/tipo-mineral.model';
import { Vehiculo } from '@models/vehiculo.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { EncabezadoPaginaComponent } from '@shared/components/encabezado-pagina/encabezado-pagina.component';
import {
  DatosDialogoTipoMineral,
  DialogoTipoMineralComponent,
} from '@shared/dialogos/dialogo-tipo-mineral.component';
import { DatosDialogoVehiculo, DialogoVehiculoComponent } from '@shared/dialogos/dialogo-vehiculo.component';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';
import { CapturaTicketComponent } from '../../ui/captura-ticket/captura-ticket.component';
import { ConfirmacionIngresoComponent } from '../../ui/confirmacion-ingreso.component';
import { PasosRegistroComponent } from '../../ui/pasos-registro.component';
import {
  ConfirmacionDeRevision,
  RevisionIngresoComponent,
} from '../../ui/revision-ingreso/revision-ingreso.component';
import {
  asegurarJustificaciones,
  camposDe,
  crearFormularioRevision,
  justificacionesDe,
} from '../../ui/revision-ingreso/formulario-revision';
import { RegistroIngresoStore } from './registro-ingreso.store';

const ESPERA_GUARDADO_MS = 400;

const SUBTITULO_POR_PASO = {
  captura: 'Fotografíe el ticket de balanza apenas el volquete sale de la balanza',
  revision: 'Revise los datos, corrija lo que haga falta y confirme',
  confirmado: 'El ingreso quedó registrado',
} as const;

/**
 * Registro de un ingreso (HU-M03-01, HU-M04-01, HU-M05-01): captura, revisión y confirmación en
 * una sola ruta, para que volver atrás no pierda nada. La página une el formulario con el
 * almacén (`RegistroIngresoStore`) y abre los diálogos de alta; no tiene reglas propias.
 */
@Component({
  selector: 'app-registrar-ingreso',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    FechaLimaPipe,
    AvisoErrorComponent,
    EncabezadoPaginaComponent,
    PasosRegistroComponent,
    CapturaTicketComponent,
    RevisionIngresoComponent,
    ConfirmacionIngresoComponent,
  ],
  providers: [RegistroIngresoStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './registrar-ingreso.page.html',
  styleUrl: './registrar-ingreso.page.scss',
})
export class RegistrarIngresoPage implements OnInit {
  protected readonly store = inject(RegistroIngresoStore);
  private readonly dialogos = inject(DialogosService);
  private readonly notificacion = inject(NotificacionService);
  private readonly vehiculosApi = inject(VehiculosApiService);
  private readonly transportistasApi = inject(TransportistasApiService);
  private readonly tiposMineralApi = inject(TiposMineralApiService);

  protected readonly formulario = crearFormularioRevision();
  protected readonly subtitulo = SUBTITULO_POR_PASO;

  constructor() {
    // Una propuesta nueva (o un borrador recuperado) precarga el formulario.
    effect(() => {
      const propuesta = this.store.propuesta();
      untracked(() => (propuesta ? this.precargarFormulario() : this.formulario.reset()));
    });
    this.formulario.controls.placa.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((placa) => this.store.placaEscrita(placa));
    // Lo que el usuario edita se guarda en el dispositivo, sin enviarse a ningún lado (RNF-M03-05).
    this.formulario.valueChanges
      .pipe(debounceTime(ESPERA_GUARDADO_MS), takeUntilDestroyed())
      .subscribe(() => {
        if (this.store.paso() === 'revision') {
          this.store.recordarCampos(camposDe(this.formulario), justificacionesDe(this.formulario));
        }
      });
  }

  ngOnInit(): void {
    void this.store.iniciar();
  }

  protected confirmar({ campos, justificaciones }: ConfirmacionDeRevision): void {
    this.store.confirmar(campos, justificaciones);
  }

  /** Alta del vehículo en un diálogo: el registro sigue con todo lo capturado (RNF-M03-13). */
  protected registrarVehiculo(placa: string): void {
    this.transportistasApi
      .listarVigentes()
      .pipe(
        switchMap((transportistas) =>
          this.dialogos.abrir<DialogoVehiculoComponent, DatosDialogoVehiculo, Vehiculo>(
            DialogoVehiculoComponent,
            {
              titulo: 'Registrar vehículo',
              vehiculo: null,
              transportistas,
              placaSugerida: placa,
              textoEnviar: 'Registrar y continuar',
              guardar: (alta) => this.vehiculosApi.crear(alta),
            },
          ),
        ),
        filter((vehiculo): vehiculo is Vehiculo => vehiculo !== undefined),
      )
      .subscribe({
        next: (vehiculo) => {
          this.store.vehiculoCreado(vehiculo);
          this.formulario.controls.placa.setValue(vehiculo.placa);
          this.notificacion.exito('Vehículo registrado');
        },
        error: (error: unknown) => this.notificacion.rechazo(error),
      });
  }

  /** Solo Administrativo y Administrador (HU-M03-01 CA14); el servidor decide quién puede. */
  protected agregarTipoMineral(): void {
    this.dialogos
      .abrir<DialogoTipoMineralComponent, DatosDialogoTipoMineral, TipoMineral>(DialogoTipoMineralComponent, {
        titulo: 'Agregar tipo de mineral',
        tipoMineral: null,
        desdeRegistro: true,
        textoEnviar: 'Agregar y elegir',
        guardar: (valor) => this.tiposMineralApi.crear({ ...valor, desde_registro: true }),
      })
      .pipe(filter((tipo): tipo is TipoMineral => tipo !== undefined))
      .subscribe((tipo) => {
        this.store.tipoMineralCreado();
        this.formulario.controls.tipo_mineral.setValue(tipo.id);
        this.notificacion.exito('Tipo de mineral registrado');
      });
  }

  protected registrarOtro(): void {
    this.store.nuevo();
  }

  private precargarFormulario(): void {
    const { justificaciones: registro } = this.formulario.controls;
    for (const regla of Object.keys(registro.controls)) {
      registro.removeControl(regla);
    }
    const iniciales = this.store.justificacionesIniciales();
    asegurarJustificaciones(registro, Object.keys(iniciales));
    this.formulario.patchValue({ ...this.store.camposIniciales(), justificaciones: iniciales });
  }
}
