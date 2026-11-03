import { Injectable } from '@angular/core';

import {
  CambiosTipoMineral,
  FiltroTiposMineral,
  NuevoTipoMineral,
  TipoMineral,
} from '@models/tipo-mineral.model';
import { RecursoCatalogoApi } from './recurso-catalogo-api';

/** Tipos de mineral (HU-M02-02). */
@Injectable({ providedIn: 'root' })
export class TiposMineralApiService extends RecursoCatalogoApi<
  TipoMineral,
  NuevoTipoMineral,
  CambiosTipoMineral,
  FiltroTiposMineral
> {
  constructor() {
    super('tipos-mineral');
  }
}
