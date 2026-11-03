import { Directive, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import { EnvioFormulario } from '../formularios/envio-formulario';

/**
 * Datos de un diálogo que envía algo al servidor. La página decide **qué** se guarda
 * (`guardar`); el diálogo solo presenta el formulario, muestra el error y se cierra con el
 * resultado. Así el diálogo no depende de ningún servicio (inversión de dependencias).
 */
export interface DatosDialogoEnvio<TValor, TResultado> {
  titulo: string;
  guardar: (valor: TValor) => Observable<TResultado>;
}

@Directive()
export abstract class DialogoEnvioBase<
  TValor,
  TResultado,
  TDatos extends DatosDialogoEnvio<TValor, TResultado> = DatosDialogoEnvio<TValor, TResultado>,
> {
  protected readonly datos = inject<TDatos>(MAT_DIALOG_DATA);
  private readonly referencia = inject<MatDialogRef<unknown, TResultado>>(MatDialogRef);

  readonly envio = new EnvioFormulario();

  get titulo(): string {
    return this.datos.titulo;
  }

  guardar(valor: TValor): void {
    this.envio.ejecutar(this.datos.guardar(valor), (resultado) => this.referencia.close(resultado));
  }

  cerrar(): void {
    this.referencia.close();
  }
}
