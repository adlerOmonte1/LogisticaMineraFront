---
name: frontend-feature-nuevo
description: Monta un feature completo del frontend Angular — modelos espejo del contrato, servicio en data-access, rutas con carga diferida y guards por rol, entrada de menú, páginas y componentes de ui, pruebas — siguiendo la fase correspondiente del plan. Úsala cuando se pida crear, montar o levantar las pantallas de un módulo (M01 a M09) o de una fase (FB1 a FB7), un listado, un alta o un detalle, y antes de escribir el primer componente de un feature que aún no tiene archivos.
---

# Feature nuevo

Carga antes `contexto-frontend`. Lee la fase en `docs/plan-implementacion.md`, sus pantallas en
`docs/pantallas.md`, sus endpoints en `docs/contrato-api.md` y sus criterios en
`docs/verificacion-criterios.md`. El orden de abajo importa: cada paso se apoya en el anterior.

## 1. Las tres capas

```
features/trazabilidad/
  data-access/    servicio del feature. ÚNICA puerta a HttpClient
  pages/          componentes ruteados: orquestan una pantalla, tienen estado
  ui/             presentacionales: input() y output(), sin servicios
  trazabilidad.routes.ts
```

| Backend | Frontend |
|---|---|
| `repositories/` + `services/` | `data-access/` |
| `views/` | `pages/` |
| `serializers/` | `ui/` |
| `models/` | `models/` en la raíz de `app/` |

La prueba para ubicar algo: **si necesita inyectar un servicio, no es `ui/`**. Si lo usan dos
features, va a `shared/`.

## 2. Orden de construcción

**1. Modelos** en `src/app/models/`, espejo de lo que viaja (`docs/contrato-api.md`), no de la base:

```typescript
// models/lote.model.ts
export type EstadoLote = 'ABIERTO' | 'EN_RECORRIDO' | 'CERRADO';
export type CodigoRuta = 'ZARANDEO_ENSACADO' | 'MOLIENDA_ENSACADO' | 'ZARANDEO_MOLIENDA_ENSACADO';

export interface SiguientePaso {
  carga: string;
  parte: number | null;
  ingreso: number | null;
  etapa: CodigoEtapa | null;
  elegir_ruta: boolean;
}

export interface LoteFila {
  id: number;
  codigo: string;
  nombre: string;
  estado: EstadoLote;
  tipo_mineral_nombre: string;
  ingresos: number;
  toneladas: string;          // decimal en cadena (D-F17)
}
```

- Nombres de propiedad **tal como llegan** (`snake_case`): sin capa de traducción que mantener.
- Tipos union para los enumerados; nunca `string` genérico.
- Decimales como `string`; fechas como `string` ISO.
- Las respuestas de acción `{mensaje, …recurso}` se tipan `ConMensaje<Lote>`.

**2. Servicio** en `data-access/`:

```typescript
@Injectable({ providedIn: 'root' })
export class LotesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/lotes/`;

  listar(filtros: FiltroLotes, page = 1): Observable<Pagina<LoteFila>> {
    return this.http.get<Pagina<LoteFila>>(this.base, { params: aParams({ ...filtros, page }) });
  }
  registrarEtapa(id: number, cuerpo: RegistroEtapa): Observable<ConMensaje<Lote>> {
    return this.http.post<ConMensaje<Lote>>(`${this.base}${id}/etapas/`, cuerpo);
  }
}
```

Sin `eliminar()`. Un método por operación del contrato. Sin lógica de negocio: si el servidor
devuelve `siguientes`, el servicio no los recalcula.

**3. Rutas** del feature con carga diferida, y enganche con sus guards:

```typescript
// features/trazabilidad/trazabilidad.routes.ts
export const TRAZABILIDAD_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/lotes.page').then(m => m.LotesPage) },
  { path: 'nuevo', canActivate: [permisoGuard('COMPONER_LOTE')],
    loadComponent: () => import('./pages/abrir-lote.page').then(m => m.AbrirLotePage) },
  { path: 'cierre', canActivate: [permisoGuard('CERRAR_LOTE')],
    loadComponent: () => import('./pages/cierre-lotes.page').then(m => m.CierreLotesPage) },
  { path: ':id', loadComponent: () => import('./pages/lote-detalle.page').then(m => m.LoteDetallePage) },
  { path: ':id/cerrar', canActivate: [permisoGuard('CERRAR_LOTE')],
    loadComponent: () => import('./pages/cerrar-lote.page').then(m => m.CerrarLotePage) },
];

// rutas-con-sesion.routes.ts, dentro del armazón
{ path: 'lotes', loadChildren: () => import('./features/trazabilidad/trazabilidad.routes').then(m => m.TRAZABILIDAD_ROUTES) },
```

Las rutas son las de `docs/pantallas.md` §1; las marcadas ◆ las fabrica el servidor y **no se
renombran** (D-F13). Cada ruta se protege con el **permiso** (`core/autorizacion/permisos.ts`), nunca
con una lista de roles escrita en la ruta: la matriz es una sola (D-F24).

**4. Menú.** Si la fase añade una entrada, se agrega a la definición del menú en `core/layout/` con
su lista de roles, según `docs/pantallas.md` §2.

**5. Páginas, después `ui/`.** Primero la página que orquesta; los componentes de `ui/` se extraen
cuando un bloque se repite o la plantilla deja de leerse de un vistazo. No por adelantado.

**6. Pruebas.** El servicio con `HttpTestingController` (URL, método, cuerpo, parámetros). Los
componentes de `ui/` con lógica, con entradas y salidas. Las páginas se cubren con el guion de
revisión de la fase.

## 3. Antes de dar la fase por lista para su puerta

- [ ] Cada HU de la fase tiene su pantalla, su ruta y su entrada de menú por rol.
- [ ] Cada criterio de la fase está marcado en `docs/verificacion-criterios.md`.
- [ ] Los mensajes del servidor aparecen literales y en su lugar.
- [ ] Guards y acciones ocultas = `permissions.py`.
- [ ] El feature no importa de ningún otro.
- [ ] `npx ng lint`, `npx ng test --watch=false` y `npx ng build --configuration production` en verde.
- [ ] Commits `M0n: descripcion (HU-M0n-0m)`.
- [ ] `docs/estado-modulos.md` y `docs/bitacora-fases.md` actualizados.
