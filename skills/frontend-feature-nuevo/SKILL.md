---
name: frontend-feature-nuevo
description: Crea un feature completo del frontend Angular — carpeta features/modulo con data-access, pages y ui, rutas con carga diferida, modelos e integración en app.routes.ts. Úsala cuando se pida crear, montar o levantar la pantalla de un módulo (M01 a M09), un listado, un alta o un feature nuevo, y antes de escribir el primer componente de un módulo que aún no existe.
---

# Feature nuevo

Carga antes `contexto-frontend`. El orden importa: cada paso se apoya en el anterior.

## 1. Las tres capas

```
features/ingresos/
  data-access/    servicio del feature. ÚNICA puerta a HttpClient
  pages/          componentes ruteados: orquestan una pantalla, tienen estado
  ui/             presentacionales: input() y output(), sin servicios, sin estado propio
  ingresos.routes.ts
```

Es la misma separación por motivo de cambio que el backend aplica con `repositories/`, `services/` y
`views/`. La prueba para ubicar cualquier cosa: **si necesita inyectar algo, no es `ui/`**.

| Backend | Frontend |
|---|---|
| `repositories/` + `services/` | `data-access/` |
| `views/` | `pages/` |
| `serializers/` | `ui/` |
| `models/` | `models/` (en la raíz de `app/`) |

La ganancia es verificable: un componente de `ui/` se prueba con entradas y salidas, sin
`HttpTestingController`. Eso sostiene la característica *capacidad de ser probado* de ISO/IEC 25010
que afirma la tesis, y en sustentación se enseña abriendo una carpeta.

## 2. Orden de construcción

**1. El modelo, en `src/app/models/`.** Espejo del serializer, no del modelo de la base: lo que viaja
por la API es la única forma que el cliente conoce.

```typescript
// models/ingreso.model.ts
export interface Ingreso {
  id: number;
  correlativo: string;
  fechaPesaje: string;      // ISO
  horaPesaje: string;       // HH:mm
  horaRegistro: string;
  pesoBrutoTn: number;
  taraTn: number;
  pesoNetoTn: number;
  estado: 'REGISTRADO' | 'ANULADO';
}
```

Tipos union para los `enum` del backend, nunca `string`: si el servidor añade un estado, el
compilador señala cada punto que hay que revisar.

**2. El servicio, en `data-access/`.**

```typescript
@Injectable({ providedIn: 'root' })
export class IngresosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/ingresos/`;

  listar(filtros: FiltroIngreso = {}): Observable<Pagina<Ingreso>> { ... }
  registrar(payload: NuevoIngreso): Observable<Ingreso> { ... }
  anular(id: number, motivo: string): Observable<Ingreso> { ... }
}
```

Sin `eliminar()`: el sistema no borra, anula (D-07). Ningún ViewSet del backend expone `destroy`.

**3. Las rutas del feature, con carga diferida.**

```typescript
// features/ingresos/ingresos.routes.ts
export const INGRESOS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/ingresos-lista.page').then(m => m.IngresosListaPage) },
  { path: 'nuevo', loadComponent: () => import('./pages/ingreso-form.page').then(m => m.IngresoFormPage) },
  { path: ':id', loadComponent: () => import('./pages/ingreso-detalle.page').then(m => m.IngresoDetallePage) },
];
```

**4. El enganche en `app.routes.ts`**, con los guards que exige la historia:

```typescript
{
  path: 'ingresos',
  canActivate: [sesionGuard, rolGuard(['ADMINISTRADOR', 'SUPERVISOR'])],
  loadChildren: () => import('./features/ingresos/ingresos.routes').then(m => m.INGRESOS_ROUTES),
}
```

**5. Los componentes:** primero el `pages/` que orquesta, después los `ui/` que extraes cuando un
bloque se repite o cuando la plantilla deja de leerse de un vistazo. No crees componentes de `ui/`
por adelantado: abstraer por si acaso es tan defectuoso como no abstraer.

## 3. Estado con signals

```typescript
export class IngresosListaPage {
  private servicio = inject(IngresosService);
  ingresos = signal<Ingreso[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);
}
```

## 4. Antes de dar por cerrado el feature

- [ ] Cada historia del módulo tiene su pantalla y su ruta.
- [ ] Los mensajes de error se muestran literales, en el campo que indica `detalles.campo`.
- [ ] El guard de rol coincide con lo que `permissions.py` rechaza en el servidor.
- [ ] El feature no importa de ningún otro feature.
- [ ] `npx ng build --configuration production` pasa los presupuestos de tamaño.
- [ ] El commit referencia su historia: `M03: lista de ingresos con filtros (HU-M03-05)`.
