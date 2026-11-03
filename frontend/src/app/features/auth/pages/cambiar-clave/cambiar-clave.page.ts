import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { switchMap } from 'rxjs';

import { AutenticacionService } from '@core/sesion/autenticacion.service';
import { SesionService } from '@core/sesion/sesion.service';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { EncabezadoPaginaComponent } from '@shared/components/encabezado-pagina/encabezado-pagina.component';
import { EnvioFormulario } from '@shared/formularios/envio-formulario';
import { ErrorCampoPipe } from '@shared/pipes/error-campo.pipe';
import { CuentaApiService } from '../../data-access/cuenta-api.service';

/**
 * Cambio de la propia contraseña (HU-M01-02 CA05 a CA07 y CA11) y cambio obligatorio de la
 * temporal (HU-M01-01 CA09). La longitud mínima y la coincidencia las valida el servidor con
 * sus mensajes literales: el cliente no las adelanta para no reemplazarlos.
 */
@Component({
  selector: 'app-cambiar-clave',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    AvisoErrorComponent,
    EncabezadoPaginaComponent,
    ErrorCampoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cambiar-clave.page.html',
})
export class CambiarClavePage {
  private readonly cuenta = inject(CuentaApiService);
  private readonly autenticacion = inject(AutenticacionService);

  protected readonly obligatorio = inject(SesionService).debeCambiarClave;
  protected readonly envio = new EnvioFormulario();
  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    password_actual: ['', Validators.required],
    password_nueva: ['', Validators.required],
    password_nueva_confirmacion: ['', Validators.required],
  });

  /** Tras cambiarla, el servidor pide iniciar sesión otra vez: se cierra con su mensaje. */
  cambiar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const operacion = this.cuenta
      .cambiarClave(this.formulario.getRawValue())
      .pipe(switchMap(({ mensaje }) => this.autenticacion.cerrarSesion(mensaje)));
    this.envio.ejecutar(operacion, () => undefined, this.formulario);
  }
}
