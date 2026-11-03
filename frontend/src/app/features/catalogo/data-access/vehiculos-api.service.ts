import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

import {
  CambioTara,
  CambiosVehiculo,
  FiltroVehiculos,
  NuevoVehiculo,
  Vehiculo,
} from '@models/vehiculo.model';
import { RecursoCatalogoApi } from './recurso-catalogo-api';

/** Vehículos (HU-M02-01). El alta está abierta a los tres roles (DR-17). */
@Injectable({ providedIn: 'root' })
export class VehiculosApiService extends RecursoCatalogoApi<
  Vehiculo,
  NuevoVehiculo,
  CambiosVehiculo,
  FiltroVehiculos
> {
  constructor() {
    super('vehiculos');
  }

  /** Solo el Administrador, con motivo (HU-M02-01 CA09 a CA11). */
  modificarTara(id: number, cambio: CambioTara): Observable<Vehiculo> {
    return this.http.patch<Vehiculo>(this.url(id, 'tara'), cambio).pipe(tap(() => this.invalidarCache()));
  }
}
