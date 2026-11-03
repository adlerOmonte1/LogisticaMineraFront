import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ErrorApi } from '@models/error-api.model';
import { ETIQUETA_ROL, ROLES, Rol } from '@models/rol.model';
import { UsuarioDetalle } from '@models/usuario.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { aplicarErrorEnFormulario } from '@shared/formularios/errores-formulario';
import { ErrorCampoPipe } from '@shared/pipes/error-campo.pipe';

export interface ValorFormularioUsuario {
  username: string;
  nombres: string;
  apellidos: string;
  rol: Rol;
  /** Solo en el alta: en la edición la contraseña no se toca (HU-M01-02). */
  password?: string;
}

/** Alta y edición de un usuario (HU-M01-02 CA01). Presentacional: emite el valor. */
@Component({
  selector: 'app-formulario-usuario',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    AvisoErrorComponent,
    ErrorCampoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './formulario-usuario.component.html',
})
export class FormularioUsuarioComponent implements OnInit {
  readonly usuario = input<UsuarioDetalle | null>(null);
  readonly error = input<ErrorApi | null>(null);
  readonly enviando = input(false);
  readonly enviar = output<ValorFormularioUsuario>();
  readonly cancelar = output<void>();

  protected readonly roles = ROLES;
  protected readonly etiquetaRol = ETIQUETA_ROL;
  protected readonly esAlta = computed(() => this.usuario() === null);

  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    username: ['', Validators.required],
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    rol: ['' as Rol | '', Validators.required],
    password: [''],
  });

  constructor() {
    effect(() => {
      const error = this.error();
      if (error) {
        aplicarErrorEnFormulario(this.formulario, error);
      }
    });
  }

  ngOnInit(): void {
    const usuario = this.usuario();
    if (usuario) {
      this.formulario.patchValue(usuario);
    } else {
      this.formulario.controls.password.addValidators(Validators.required);
    }
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { password, rol, ...datos } = this.formulario.getRawValue();
    this.enviar.emit({ ...datos, rol: rol as Rol, ...(this.esAlta() ? { password } : {}) });
  }
}
