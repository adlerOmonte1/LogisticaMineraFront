import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ErrorApi } from '@models/error-api.model';
import { PendientesDestare, ResultadoDestare } from '@models/ingreso.model';
import { comoErrorApi } from '@core/errores/error-inesperado';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { EncabezadoPaginaComponent } from '@shared/components/encabezado-pagina/encabezado-pagina.component';
import { EstadoVacioComponent } from '@shared/components/estado-vacio/estado-vacio.component';
import { EnvioFormulario } from '@shared/formularios/envio-formulario';
import { IngresosApiService } from '../../data-access/ingresos-api.service';
import {
  DatosDestare,
  FormularioDestareComponent,
} from '../../ui/formulario-destare/formulario-destare.component';
import { PendientesDestareComponent } from '../../ui/pendientes-destare/pendientes-destare.component';
import { ResultadoDestareComponent } from '../../ui/resultado-destare.component';

/** Registro del destare de un vehículo en su primer viaje (HU-M03-04). */
@Component({
  selector: 'app-destares',
  standalone: true,
  imports: [
    MatProgressBarModule,
    AvisoErrorComponent,
    EncabezadoPaginaComponent,
    EstadoVacioComponent,
    PendientesDestareComponent,
    FormularioDestareComponent,
    ResultadoDestareComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './destares.page.html',
  styleUrl: './destares.page.scss',
})
export class DestaresPage implements OnInit {
  private readonly api = inject(IngresosApiService);

  protected readonly pendientes = signal<PendientesDestare | null>(null);
  protected readonly cargando = signal(false);
  protected readonly errorCarga = signal<ErrorApi | null>(null);
  protected readonly elegido = signal<number | null>(null);
  protected readonly resultado = signal<ResultadoDestare | null>(null);
  protected readonly envio = new EnvioFormulario();

  protected readonly vehiculoElegido = computed(
    () => this.pendientes()?.vehiculos.find((v) => v.id === this.elegido()) ?? null,
  );

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);
    this.resultado.set(null);
    this.elegido.set(null);
    this.envio.limpiar();
    this.api.pendientesDestare().subscribe({
      next: (pendientes) => {
        this.pendientes.set(pendientes);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.errorCarga.set(comoErrorApi(error));
        this.cargando.set(false);
      },
    });
  }

  protected elegir(vehiculo: number): void {
    this.envio.limpiar();
    this.elegido.set(vehiculo);
  }

  protected registrar(vehiculo: number, datos: DatosDestare): void {
    this.envio.ejecutar(this.api.registrarDestare({ vehiculo, ...datos }), (resultado) =>
      this.resultado.set(resultado),
    );
  }
}
