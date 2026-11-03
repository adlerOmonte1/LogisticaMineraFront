import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';

import { DialogosService } from '@core/dialogos/dialogos.service';
import { AutenticacionService } from '@core/sesion/autenticacion.service';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { EnvioFormulario } from '@shared/formularios/envio-formulario';
import { ErrorCampoPipe } from '@shared/pipes/error-campo.pipe';
import { DialogoOlvidoClaveComponent } from '../../ui/dialogo-olvido-clave.component';

/**
 * Inicio de sesión (HU-M01-01). Un rechazo de credenciales no marca un campo concreto: el
 * mensaje va sobre el formulario, sin revelar cuál falló (RNF-M01-02).
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    AvisoErrorComponent,
    ErrorCampoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly autenticacion = inject(AutenticacionService);
  private readonly router = inject(Router);
  private readonly dialogos = inject(DialogosService);

  protected readonly envio = new EnvioFormulario();
  protected readonly motivoCierre = this.autenticacion.motivoCierre;
  protected readonly claveVisible = signal(false);

  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  ingresar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.autenticacion.descartarMotivo();
    this.envio.ejecutar(this.autenticacion.iniciarSesion(this.formulario.getRawValue()), (usuario) => {
      void this.router.navigateByUrl(this.autenticacion.rutaDeEntrada(usuario));
    });
  }

  alternarClave(): void {
    this.claveVisible.update((visible) => !visible);
  }

  mostrarAyudaClave(): void {
    this.dialogos.abrir(DialogoOlvidoClaveComponent, null).subscribe();
  }
}
