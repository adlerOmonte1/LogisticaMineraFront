# Estado de los módulos — frontend

**Documento:** vivo, se actualiza en cada sesión de trabajo relevante (al cerrar un feature, no en cada commit).
**No duplica:** el cronograma de semanas de `GUIA_FRONTEND_ANGULAR.md` (backend), que es el plan. Esto es el **avance real**, que diverge del plan por definición — para eso existe la tabla.

Última actualización: **2026-09-09**.

---

## Cómo leer esta tabla

| Estado | Significado |
|---|---|
| ⬜ No iniciado | Carpeta creada (`data-access/ pages/ ui/`), sin archivos |
| 🟨 En progreso | Al menos un componente o servicio escrito, feature no navegable completo |
| 🟩 Montado | Todas las pantallas de las historias del módulo existen y están enganchadas en `app.routes.ts` |
| ✅ Verificado | Montado + probado contra un backend real, checklist de la skill correspondiente cumplido |

## Tabla de estado

| Módulo | Feature | Estado | Depende de (backend) | Nota |
|---|---|---|---|---|
| M01 Autenticación | `features/autenticacion/` | ⬜ No iniciado | `POST /api/v1/auth/login/` | Bloquea todo lo demás: sin login no hay guard que probar |
| M02 Catálogo | `features/catalogo/` | ⬜ No iniciado | `GET /api/v1/catalogo/{productos,vehiculos}/` | — |
| M03 Ingresos | `features/ingresos/` | ⬜ No iniciado | `POST/GET /api/v1/ingresos/` | Pantalla crítica (I1, I2). Ver `frontend-formularios` antes de empezar |
| M04 Salidas | `features/salidas/` | ⬜ No iniciado | `POST /api/v1/salidas/` | — |
| M05 Existencias | `features/existencias/` | ⬜ No iniciado | `GET /api/v1/existencias/` | Solo lectura, sin formulario propio |
| M06 Reportes | `features/reportes/` | ⬜ No iniciado | `GET /api/v1/reportes/consolidado/` | Sin modelo propio (consume M03-M05) |
| M07 Sin conexión | `core/` (no es feature) | ⬜ No iniciado | `POST /api/v1/sincronizacion/lote/` | Transversal. Ver `frontend-offline-pwa` |
| M08 Auditoría | `features/auditoria/` | ⬜ No iniciado | `GET /api/v1/auditoria/eventos/` | — |
| M09 Búsqueda | `features/busqueda/` | ⬜ No iniciado | `GET /api/v1/busqueda/ingresos/` | Sin modelo propio (consume M03) |

## Infraestructura transversal (`core/`)

| Pieza | Estado | Nota |
|---|---|---|
| `core/interceptors/auth.interceptor.ts` | ⬜ No iniciado | `provideHttpClient(withInterceptors([]))` ya está cableado en `app.config.ts`, vacío |
| `core/interceptors/offline.interceptor.ts` | ⬜ No iniciado | — |
| `core/interceptors/error.interceptor.ts` | ⬜ No iniciado | — |
| `core/guards/sesion.guard.ts` | ⬜ No iniciado | — |
| `core/guards/rol.guard.ts` | ⬜ No iniciado | — |
| `core/services/cola-sincronizacion.service.ts` | ⬜ No iniciado | Depende de que M03 exista primero (no tiene sentido encolar antes de tener el formulario) |
| `src/app/models/` | ⬜ No iniciado | Ningún `.model.ts` creado todavía |

## Infraestructura de proyecto (ya resuelta)

| Pieza | Estado |
|---|---|
| Angular 17.3 standalone + signals, esqueleto de carpetas | ✅ |
| Angular Material + animaciones | ✅ |
| Service Worker (`@angular/pwa`) + `idb` instalados | ✅ |
| Tres entornos (`development` / `preproduction` / `production`) | ✅ |
| Proxy de desarrollo hacia backend en `:8000` | ✅ |
| `provideHttpClient` cableado (sin interceptores todavía) | 🟨 |
| CI / verificación automática de build | ⬜ No iniciado |

## Bloqueos actuales

1. **No hay backend corriendo contra el cual probar.** Todo lo de arriba es esqueleto puro; el primer feature real (M01) no puede verificarse de extremo a extremo hasta que `POST /api/v1/auth/login/` exista y responda.
2. **Node 24 sin soportar oficialmente** (ver `entorno.md` §1). No bloquea hoy, pero es deuda a resolver antes de que el proyecto tenga peso real de dependencias.

## Próximo paso recomendado

M01 primero, siempre — es la dependencia de todo el resto (guards, interceptor de auth, y cualquier pantalla que necesite saber quién es el usuario). Usar `frontend-feature-nuevo` para el orden de construcción (modelo → servicio → rutas → componentes) y `frontend-http-sesion` para el interceptor de autenticación en paralelo, porque M01 sin interceptor no tiene sentido probarlo.
