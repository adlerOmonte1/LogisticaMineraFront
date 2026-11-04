import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';

import { TiposMineralApiService } from '@core/catalogo/tipos-mineral-api.service';
import { NotificacionService } from '@core/notificacion/notificacion.service';
import { TipoMineral } from '@models/tipo-mineral.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { EncabezadoPaginaComponent } from '@shared/components/encabezado-pagina/encabezado-pagina.component';
import { EnvioFormulario } from '@shared/formularios/envio-formulario';
import { ErrorCampoPipe } from '@shared/pipes/error-campo.pipe';
import { separarFechaYHoraLima } from '@shared/utils/fecha-hora';
import { LotesApiService } from '../../data-access/lotes-api.service';

/**
 * Abrir un lote (HU-M06-01 CA01 a CA03): nombre, tipo de mineral y fecha de apertura. El
 * selector de fecha no ofrece días futuros, pero quien decide es el servidor: un nombre repetido
 * o una apertura futura vuelven con su mensaje literal. Es de gestión; el Supervisor no llega
 * aquí (guard) y el servidor lo rechazaría igual.
 */
@Component({
  selector: 'app-abrir-lote',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    AvisoErrorComponent,
    EncabezadoPaginaComponent,
    ErrorCampoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './abrir-lote.page.html',
})
export class AbrirLotePage implements OnInit {
  private readonly api = inject(LotesApiService);
  private readonly tiposMineral = inject(TiposMineralApiService);
  private readonly notificacion = inject(NotificacionService);
  private readonly router = inject(Router);

  protected readonly envio = new EnvioFormulario();
  protected readonly minerales = signal<TipoMineral[]>([]);
  /** Último día que ofrece el selector: hoy, en la zona de la planta. */
  protected readonly hoy = separarFechaYHoraLima(new Date().toISOString()).fecha;

  protected readonly formulario = new FormGroup({
    nombre: new FormControl('', { nonNullable: true }),
    tipo_mineral: new FormControl<number | null>(null),
    fecha_apertura: new FormControl(this.hoy, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.tiposMineral.listarVigentes().subscribe({ next: (lista) => this.minerales.set(lista) });
  }

  protected abrir(): void {
    const { nombre, tipo_mineral, fecha_apertura } = this.formulario.getRawValue();
    this.envio.ejecutar(
      this.api.abrir({ nombre: nombre.trim(), tipo_mineral, fecha_apertura: fecha_apertura || null }),
      (lote) => {
        if (lote.mensaje) {
          this.notificacion.exito(lote.mensaje);
        }
        void this.router.navigate(['/lotes', lote.id]);
      },
      this.formulario,
    );
  }
}
