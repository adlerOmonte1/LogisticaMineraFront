import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { TiposMineralApiService } from '@core/catalogo/tipos-mineral-api.service';
import { TipoMineral } from '@models/tipo-mineral.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { EncabezadoPaginaComponent } from '@shared/components/encabezado-pagina/encabezado-pagina.component';
import {
  DatosCorreccion,
  FormularioCorreccionComponent,
} from '../../ui/formulario-correccion/formulario-correccion.component';
import { ResumenIngresoComponent } from '../../ui/resumen-ingreso.component';
import { PaginaAccionSobreIngreso } from '../accion-sobre-ingreso.base';

/**
 * Corrección de un ingreso registrado (HU-M03-02), solo Administrativo y Administrador. Envía
 * únicamente lo que cambió, con su motivo; el servidor recalcula el neto y audita el antes y el
 * después.
 */
@Component({
  selector: 'app-corregir-ingreso',
  standalone: true,
  imports: [
    MatProgressBarModule,
    AvisoErrorComponent,
    EncabezadoPaginaComponent,
    ResumenIngresoComponent,
    FormularioCorreccionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-encabezado-pagina
      titulo="Corregir ingreso"
      subtitulo="Modifique solo lo que esté mal e indique el motivo"
    />
    <app-aviso-error [error]="errorCarga()" />
    @if (cargando()) {
      <mat-progress-bar mode="indeterminate" />
    }
    @if (ingreso(); as ingreso) {
      <app-resumen-ingreso [ingreso]="ingreso" />
      <app-formulario-correccion
        [ingreso]="ingreso"
        [tiposMineral]="tiposMineral()"
        [error]="envio.error()"
        [enviando]="envio.enviando()"
        (enviar)="corregir($event)"
        (cancelar)="volverAlDetalle()"
      />
    }
  `,
})
export class CorregirIngresoPage extends PaginaAccionSobreIngreso {
  private readonly tiposMineralApi = inject(TiposMineralApiService);
  protected readonly tiposMineral = signal<TipoMineral[]>([]);

  protected override alCargarIngreso(): void {
    this.tiposMineralApi.listarVigentes().subscribe({ next: (tipos) => this.tiposMineral.set(tipos) });
  }

  protected corregir({ cambios, motivo, justificaciones }: DatosCorreccion): void {
    this.envio.ejecutar(
      this.api.corregir(Number(this.id()), { ...cambios, motivo, justificaciones }),
      (respuesta) => this.terminar(respuesta),
    );
  }
}
