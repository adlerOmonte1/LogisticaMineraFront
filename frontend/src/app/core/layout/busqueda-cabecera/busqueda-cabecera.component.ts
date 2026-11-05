import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ConsultaCabeceraApiService } from '../../consulta/consulta-cabecera-api.service';
import { NotificacionService } from '../../notificacion/notificacion.service';

/**
 * Búsqueda rápida de la cabecera (HU-M07-02 CA16 y CA17): el código de un ingreso, completo o con
 * sus dígitos finales, abre su detalle; cualquier otro texto lleva a la consulta con esa placa.
 * Quien decide qué es el texto es el servidor. En teléfono se reduce a un acceso a la consulta.
 */
@Component({
  selector: 'app-busqueda-cabecera',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="busqueda" role="search" [formGroup]="formulario" (ngSubmit)="buscar()">
      <mat-icon class="busqueda__icono" aria-hidden="true">search</mat-icon>
      <input
        class="busqueda__campo"
        type="search"
        formControlName="texto"
        placeholder="Código o placa"
        aria-label="Buscar un ingreso por código o placa"
        autocomplete="off"
        autocapitalize="characters"
        data-prueba="busqueda"
      />
    </form>
    <a mat-icon-button class="solo-movil" routerLink="/consulta" aria-label="Consultar un ingreso">
      <mat-icon>search</mat-icon>
    </a>
  `,
  styles: `
    .busqueda {
      display: none;
      align-items: center;
      gap: 6px;
      padding: 0 12px;
      border-radius: 999px;
      background: var(--fill);
      color: var(--label);
    }
    .busqueda__campo {
      width: 150px;
      min-height: 36px;
      border: 0;
      outline: 0;
      background: transparent;
      color: inherit;
      font: inherit;
    }
    .busqueda__icono {
      color: var(--label-3);
    }
    @media (min-width: 600px) {
      .busqueda {
        display: flex;
      }
      .solo-movil {
        display: none;
      }
    }
  `,
})
export class BusquedaCabeceraComponent {
  private readonly api = inject(ConsultaCabeceraApiService);
  private readonly router = inject(Router);
  private readonly notificacion = inject(NotificacionService);

  protected readonly buscando = signal(false);
  protected readonly formulario = new FormGroup({ texto: new FormControl('', { nonNullable: true }) });

  protected buscar(): void {
    const texto = this.formulario.controls.texto.value.trim();
    if (!texto || this.buscando()) {
      return;
    }
    this.buscando.set(true);
    this.api
      .buscar(texto)
      .pipe(finalize(() => this.buscando.set(false)))
      .subscribe({
        next: (resultado) => {
          this.formulario.reset();
          if (resultado.tipo === 'INGRESO') {
            void this.router.navigate(['/consulta/ingresos', resultado.id]);
          } else {
            void this.router.navigate(['/consulta'], { queryParams: { placa: resultado.placa } });
          }
        },
        error: (error: unknown) => this.notificacion.rechazo(error),
      });
  }
}
