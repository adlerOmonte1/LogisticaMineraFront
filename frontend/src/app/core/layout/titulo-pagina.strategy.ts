import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

export const NOMBRE_SISTEMA = 'Control de ingreso de mineral';

/** Título de la pestaña del navegador: «Pantalla · Control de ingreso de mineral». */
@Injectable({ providedIn: 'root' })
export class TituloPaginaStrategy extends TitleStrategy {
  private readonly titulo = inject(Title);

  override updateTitle(estado: RouterStateSnapshot): void {
    const pantalla = this.buildTitle(estado);
    this.titulo.setTitle(pantalla ? `${pantalla} · ${NOMBRE_SISTEMA}` : NOMBRE_SISTEMA);
  }
}
