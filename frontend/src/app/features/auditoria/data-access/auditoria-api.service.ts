import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '@core/http/api-url.token';
import { crearParametros } from '@core/http/parametros-http';
import { Evento, FiltroAuditoria } from '@models/evento.model';
import { Pagina } from '@models/pagina.model';

/**
 * Auditoría del sistema, solo del Administrador (HU-M09-03; docs/contrato-api.md §8). Solo
 * lectura: no hay operación que cree, modifique ni elimine un evento (RN-M09-02).
 */
@Injectable({ providedIn: 'root' })
export class AuditoriaApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_URL)}/auditoria/`;

  /** Del más reciente al más antiguo. Con `count` en 0, `mensaje` trae el texto del servidor. */
  consultar(filtro: FiltroAuditoria, pagina = 1): Observable<Pagina<Evento>> {
    return this.http.get<Pagina<Evento>>(this.base, {
      params: crearParametros({ ...filtro, page: pagina }),
    });
  }
}
