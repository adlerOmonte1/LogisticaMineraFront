import { Injectable } from '@angular/core';

import { CambiosTransportista, NuevoTransportista, Transportista } from '@models/transportista.model';
import { RecursoCatalogoApi } from './recurso-catalogo-api';

/** Transportistas (HU-M02-03). */
@Injectable({ providedIn: 'root' })
export class TransportistasApiService extends RecursoCatalogoApi<
  Transportista,
  NuevoTransportista,
  CambiosTransportista
> {
  constructor() {
    super('transportistas');
  }
}
