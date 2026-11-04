import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { DialogosService } from '@core/dialogos/dialogos.service';
import {
  ACCIONES_EVENTO,
  AccionEvento,
  ETIQUETA_ACCION,
  Evento,
  FiltroAuditoria,
} from '@models/evento.model';
import { MarcoListadoComponent } from '@shared/components/marco-listado/marco-listado.component';
import { crearListadoPaginado } from '@shared/listados/listado-paginado';
import { AuditoriaApiService } from '../../data-access/auditoria-api.service';
import { DialogoEventoComponent } from '../../ui/dialogo-evento/dialogo-evento.component';
import { TablaEventosComponent } from '../../ui/tabla-eventos/tabla-eventos.component';

const FILTRO_VACIO: FiltroAuditoria = { usuario: '', accion: null, texto: '' };

/**
 * Auditoría del sistema, solo del Administrador (HU-M09-03): del evento más reciente al más
 * antiguo, con filtros de usuario, acción y texto que se combinan. El detalle de un evento
 * (antes, después, motivo) se abre en un diálogo. `texto` llega de la URL cuando se entra desde
 * el historial de un ingreso (`?texto=ING-2027-00001`).
 */
@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MarcoListadoComponent,
    TablaEventosComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auditoria.page.html',
  styles: `
    .filtros-auditoria {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 16px;
      width: 100%;
    }
  `,
})
export class AuditoriaPage {
  /** Filtro de texto que trae la URL (`withComponentInputBinding`). */
  readonly texto = input<string | undefined>();

  private readonly api = inject(AuditoriaApiService);
  private readonly dialogos = inject(DialogosService);

  protected readonly acciones = ACCIONES_EVENTO;
  protected readonly etiquetaAccion = ETIQUETA_ACCION;

  protected readonly formulario = new FormGroup({
    usuario: new FormControl(FILTRO_VACIO.usuario, { nonNullable: true }),
    accion: new FormControl<AccionEvento | null>(FILTRO_VACIO.accion),
    texto: new FormControl(FILTRO_VACIO.texto, { nonNullable: true }),
  });

  protected readonly listado = crearListadoPaginado<Evento, FiltroAuditoria>(
    (filtro, pagina) => this.api.consultar(filtro, pagina),
    FILTRO_VACIO,
  );

  /** Sin resultados se muestra el `mensaje` que manda el servidor (HU-M09-03 CA04). */
  protected readonly mensajeVacio = computed(() => this.listado.datos()?.mensaje ?? 'Sin resultados');

  constructor() {
    // Primera carga y cada vez que cambia `?texto=` con la página ya abierta.
    effect(() => {
      const texto = this.texto() ?? '';
      untracked(() => {
        this.formulario.patchValue({ texto });
        this.aplicar();
      });
    });
  }

  protected aplicar(): void {
    const { usuario, accion, texto } = this.formulario.getRawValue();
    this.listado.filtrar({ usuario: usuario.trim(), accion, texto: texto.trim() });
  }

  protected limpiar(): void {
    this.formulario.reset(FILTRO_VACIO);
    this.aplicar();
  }

  protected verDetalle(evento: Evento): void {
    this.dialogos.abrir<DialogoEventoComponent, Evento, void>(DialogoEventoComponent, evento).subscribe();
  }
}
