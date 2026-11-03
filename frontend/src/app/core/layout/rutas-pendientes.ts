import { Route } from '@angular/router';

import { Permiso } from '../autorizacion/permisos';
import { permisoGuard } from '../guards/sesion.guards';
import type { DatosPantallaPendiente } from './paginas/pantalla-pendiente.page';

/**
 * Rutas de fases posteriores (docs/plan-implementacion.md §4). Cada una se reemplaza por su
 * feature al construir la fase; mientras tanto, el menú de cada rol está completo.
 */
const PENDIENTES: readonly { ruta: string; titulo: string; fase: string; permiso: Permiso }[] = [
  { ruta: 'ingresos/registrar', titulo: 'Registrar ingreso', fase: 'FB3', permiso: 'REGISTRAR_INGRESO' },
  { ruta: 'ingresos/destares', titulo: 'Destares', fase: 'FB3', permiso: 'REGISTRAR_DESTARE' },
  { ruta: 'lotes', titulo: 'Trazabilidad', fase: 'FB5', permiso: 'CONSULTAR' },
  { ruta: 'lotes/cierre', titulo: 'Cierre de lotes', fase: 'FB5', permiso: 'CERRAR_LOTE' },
  { ruta: 'consulta', titulo: 'Consulta', fase: 'FB6', permiso: 'CONSULTAR' },
  { ruta: 'consulta/ingresos', titulo: 'Ingresos', fase: 'FB6', permiso: 'CONSULTAR' },
  { ruta: 'consulta/calendario', titulo: 'Calendario', fase: 'FB6', permiso: 'CONSULTAR' },
  { ruta: 'consolidacion', titulo: 'Consolidación', fase: 'FB7', permiso: 'CONSOLIDAR' },
];

export function rutaPendiente(ruta: string, titulo: string, fase: string, permiso: Permiso): Route {
  const datos: DatosPantallaPendiente = { titulo, fase };
  return {
    path: ruta,
    title: titulo,
    canActivate: [permisoGuard(permiso)],
    data: datos,
    loadComponent: () => import('./paginas/pantalla-pendiente.page').then((m) => m.PantallaPendientePage),
  };
}

export const RUTAS_PENDIENTES: Route[] = PENDIENTES.map(({ ruta, titulo, fase, permiso }) =>
  rutaPendiente(ruta, titulo, fase, permiso),
);
