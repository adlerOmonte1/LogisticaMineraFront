import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';

import { ETIQUETA_OPERACION, Evento } from '@models/evento.model';
import { CambiosEventoComponent } from '@shared/components/cambios-evento/cambios-evento.component';
import { InsigniaEstadoComponent } from '@shared/components/insignia-estado/insignia-estado.component';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';
import { textoRegistro, tonoDeAccion } from '@shared/utils/presentacion-evento';

/**
 * Un evento completo: quién, cuándo, desde dónde, el motivo y, por campo, el antes y el después
 * (HU-M09-03 CA03, HU-M09-01 CA02 y CA07), con el enlace al ingreso que afecta. El lote no
 * tiene enlace hasta que exista su pantalla (FB5); sus ingresos relacionados sí.
 */
@Component({
  selector: 'app-dialogo-evento',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogModule,
    RouterLink,
    CambiosEventoComponent,
    InsigniaEstadoComponent,
    FechaLimaPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Evento {{ evento.id }}</h2>
    <mat-dialog-content>
      <dl class="datos">
        <dt>Fecha y hora</dt>
        <dd data-prueba="fecha">{{ evento.fecha_hora | fechaLima }}</dd>
        <dt>Usuario</dt>
        <dd data-prueba="usuario">{{ evento.usuario ?? 'Sin sesión' }}</dd>
        <dt>Acción</dt>
        <dd>
          <app-insignia-estado [texto]="evento.accion_texto" [tono]="tono()" />
          @if (operacion(); as texto) {
            <span class="texto-secundario" data-prueba="operacion"> {{ texto }}</span>
          }
        </dd>
        <dt>Registro afectado</dt>
        <dd data-prueba="registro">{{ registro() }}</dd>
        @if (evento.direccion_ip) {
          <dt>Dirección IP</dt>
          <dd class="monoespaciado" data-prueba="ip">{{ evento.direccion_ip }}</dd>
        }
        @if (evento.motivo) {
          <dt>Motivo</dt>
          <dd data-prueba="motivo">{{ evento.motivo }}</dd>
        }
      </dl>

      @if (evento.cambios.length > 0) {
        <h3 class="subtitulo">Cambios</h3>
        <app-cambios-evento [cambios]="evento.cambios" />
      }

      @if (idIngreso() !== null || relacionados().length > 0) {
        <h3 class="subtitulo">Ir a</h3>
        <div class="enlaces">
          @if (idIngreso(); as id) {
            <a mat-stroked-button [routerLink]="['/consulta/ingresos', id]" data-prueba="enlace-ingreso">
              Ingreso {{ evento.referencia ?? '#' + id }}
            </a>
          }
          @for (id of relacionados(); track id) {
            <a mat-stroked-button [routerLink]="['/consulta/ingresos', id]" data-prueba="enlace-relacionado">
              Ingreso #{{ id }}
            </a>
          }
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" type="button" mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .datos {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 6px 16px;
      margin: 0;
    }
    .datos dt {
      color: var(--label-3);
    }
    .datos dd {
      margin: 0;
      overflow-wrap: anywhere;
    }
    .subtitulo {
      margin: 16px 0 8px;
      font-size: 1rem;
    }
    .enlaces {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  `,
})
export class DialogoEventoComponent {
  protected readonly evento = inject<Evento>(MAT_DIALOG_DATA);

  protected readonly tono = computed(() => tonoDeAccion(this.evento.accion));
  protected readonly registro = computed(() => textoRegistro(this.evento));
  protected readonly operacion = computed(() =>
    this.evento.operacion ? ETIQUETA_OPERACION[this.evento.operacion] : null,
  );

  /** El evento de un ingreso enlaza al ingreso. */
  protected readonly idIngreso = computed(() =>
    this.evento.entidad === 'Ingreso' ? this.evento.id_entidad : null,
  );

  /** Los ingresos que un evento de lote afecta (RS-M09-13), sin repetir el del propio evento. */
  protected readonly relacionados = computed(() =>
    this.evento.ingresos_relacionados.filter((id) => id !== this.idIngreso()),
  );
}
