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
 * Revierte la última corrección vigente de un ingreso (HU-M03-02 CA12 a CA14). El identificador
 * del evento a revertir sale de `correccion_revertible`: el servidor solo acepta la última.
 */
@Component({
  selector: 'app-revertir-correccion',
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
      titulo="Revertir corrección"
      subtitulo="Se restauran los valores anteriores a la última corrección"
    />
    <app-aviso-error [error]="errorCarga()" />
    @if (cargando()) {
      <mat-progress-bar mode="indeterminate" />
    }
    @if (ingreso(); as ingreso) {
      <app-resumen-ingreso [ingreso]="ingreso" />
      <app-formulario-motivo
        etiqueta="Motivo de la reversión"
        textoEnviar="Revertir corrección"
        [error]="envio.error()"
        [enviando]="envio.enviando()"
        (enviar)="revertir($event)"
        (cancelar)="volverAlDetalle()"
      />
    }
  `,
})
export class RevertirCorreccionPage extends PaginaAccionSobreIngreso {
  protected revertir({ motivo, justificaciones }: DatosMotivo): void {
    const correccion = this.ingreso()?.correccion_revertible;
    if (correccion === null || correccion === undefined) {
      return;
    }
    this.envio.ejecutar(
      this.api.revertirCorreccion(Number(this.id()), { motivo, correccion, justificaciones }),
      (respuesta) => this.terminar(respuesta),
    );
  }
}
