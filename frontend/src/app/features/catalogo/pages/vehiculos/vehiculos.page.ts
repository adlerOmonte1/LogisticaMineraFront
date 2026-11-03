import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { AutorizacionService } from '@core/autorizacion/autorizacion.service';
import { Transportista } from '@models/transportista.model';
import {
  ETIQUETA_TITULARIDAD,
  FiltroVehiculos,
  NuevoVehiculo,
  Titularidad,
  Vehiculo,
} from '@models/vehiculo.model';
import { MarcoListadoComponent } from '@shared/components/marco-listado/marco-listado.component';
import { crearListadoPaginado } from '@shared/listados/listado-paginado';
import { cambiosRespectoDe } from '@shared/utils/cambios';
import { normalizarPlaca } from '@shared/utils/placa';
import { FiltroCatalogo } from '../../data-access/recurso-catalogo-api';
import { TransportistasApiService } from '../../data-access/transportistas-api.service';
import { VehiculosApiService } from '../../data-access/vehiculos-api.service';
import { DatosDialogoTara, DialogoTaraComponent } from '../../ui/dialogo-tara.component';
import { DatosDialogoVehiculo, DialogoVehiculoComponent } from '../../ui/dialogos-catalogo.component';
import { TablaVehiculosComponent } from '../../ui/tabla-vehiculos.component';
import { PaginaCatalogoBase, TextosCatalogo } from '../pagina-catalogo.base';

type FiltroPantallaVehiculos = FiltroVehiculos & FiltroCatalogo;

/** Catálogo de vehículos (HU-M02-01). */
@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MarcoListadoComponent,
    TablaVehiculosComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vehiculos.page.html',
})
export class VehiculosPage extends PaginaCatalogoBase<Vehiculo, FiltroPantallaVehiculos> {
  protected readonly api = inject(VehiculosApiService);
  private readonly transportistas = inject(TransportistasApiService);
  private readonly autorizacion = inject(AutorizacionService);

  protected readonly textos: TextosCatalogo = {
    registrado: 'Vehículo registrado',
    guardado: 'Vehículo actualizado',
    desactivado: 'Vehículo dado de baja',
    reactivado: 'Vehículo reactivado',
  };
  protected readonly titularidades: readonly Titularidad[] = ['PROPIO', 'EXTERNO'];
  protected readonly etiquetaTitularidad = ETIQUETA_TITULARIDAD;
  protected readonly puedeModificarTara = computed(() => this.autorizacion.puede('MODIFICAR_TARA'));

  readonly listado = crearListadoPaginado<Vehiculo, FiltroPantallaVehiculos>(
    (filtro, pagina) => this.api.listar(filtro, pagina),
    { titularidad: null, placa: null, incluir_inactivos: false },
  );

  filtrarPorTitularidad(titularidad: Titularidad | null): void {
    this.listado.filtrar({ titularidad });
  }

  buscarPlaca(placa: string): void {
    this.listado.filtrar({ placa: normalizarPlaca(placa) || null });
  }

  crear(): void {
    this.conTransportistas((transportistas) =>
      this.abrirDialogo<DialogoVehiculoComponent, DatosDialogoVehiculo>(
        DialogoVehiculoComponent,
        { titulo: 'Nuevo vehículo', vehiculo: null, transportistas, guardar: (alta) => this.api.crear(alta) },
        this.textos.registrado,
      ),
    );
  }

  editar(vehiculo: Vehiculo): void {
    const original: NuevoVehiculo = {
      placa: vehiculo.placa,
      tipo_titularidad: vehiculo.titularidad,
      capacidad_tn: vehiculo.capacidad_tn,
      transportista: vehiculo.transportista,
    };
    this.conTransportistas((transportistas) =>
      this.abrirDialogo<DialogoVehiculoComponent, DatosDialogoVehiculo>(
        DialogoVehiculoComponent,
        {
          titulo: `Editar el vehículo ${vehiculo.placa}`,
          vehiculo,
          transportistas,
          guardar: (valor) => this.api.editar(vehiculo.id, cambiosRespectoDe(original, valor)),
        },
        this.textos.guardado,
      ),
    );
  }

  modificarTara(vehiculo: Vehiculo): void {
    this.abrirDialogo<DialogoTaraComponent, DatosDialogoTara>(
      DialogoTaraComponent,
      {
        titulo: `Tara del vehículo ${vehiculo.placa}`,
        vehiculo,
        guardar: (cambio) => this.api.modificarTara(vehiculo.id, cambio),
      },
      'Tara actualizada',
    );
  }

  protected nombrar(vehiculo: Vehiculo): string {
    return `el vehículo ${vehiculo.placa}`;
  }

  /** El formulario necesita los transportistas vigentes para un vehículo externo. */
  private conTransportistas(abrir: (transportistas: Transportista[]) => void): void {
    this.transportistas.listarVigentes().subscribe({
      next: abrir,
      error: (error: unknown) => this.notificacion.rechazo(error),
    });
  }
}
