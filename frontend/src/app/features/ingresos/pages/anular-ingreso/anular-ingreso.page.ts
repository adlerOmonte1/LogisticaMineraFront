import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { EncabezadoPaginaComponent } from '@shared/components/encabezado-pagina/encabezado-pagina.component';
import {
  DatosMotivo,
  FormularioMotivoComponent,
} from '../../ui/formulario-motivo/formulario-motivo.component';
import { ResumenIngresoComponent } from '../../ui/resumen-ingreso.component';
import { PaginaAccionSobreIngreso } from '../accion-sobre-ingreso.base';

/**
 * Anulación de un ingreso, solo del Administrador (HU-M03-03). Nada se elimina: el ingreso
 * queda anulado, con su motivo y su responsable, y su imagen se conserva (D-07).
 */
@Component({
  selector: 'app-anular-ingreso',
  standalone: true,
  imports: [
    MatProgressBarModule,
    AvisoErrorComponent,
    EncabezadoPaginaComponent,
    ResumenIngresoComponent,
    FormularioMotivoComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-encabezado-pagina
      titulo="Anular ingreso"
      subtitulo="El ingreso se conserva, pero deja de sumar en los totales"
    />
    <app-aviso-error [error]="errorCarga()" />
    @if (cargando()) {
      <mat-progress-bar mode="indeterminate" />
    }
    @if (ingreso(); as ingreso) {
      <app-resumen-ingreso [ingreso]="ingreso" />
      <app-formulario-motivo
        etiqueta="Motivo de la anulación"
        textoEnviar="Anular ingreso"
        [advertencia]="true"
        [error]="envio.error()"
        [enviando]="envio.enviando()"
        (enviar)="anular($event)"
        (cancelar)="volverAlDetalle()"
      />
    }
  `,
})
export class AnularIngresoPage extends PaginaAccionSobreIngreso {
  protected anular({ motivo }: DatosMotivo): void {
    this.envio.ejecutar(this.api.anular(Number(this.id()), motivo), (respuesta) => this.terminar(respuesta));
  }
}
