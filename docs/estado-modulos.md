# Estado de los módulos — frontend

**Documento:** vivo. Se actualiza al cerrar una fase o un trabajo relevante, no en cada commit.
**No duplica:** el plan ([`plan-implementacion.md`](plan-implementacion.md)), que dice qué toca y en
qué orden. Esto es el **avance real**, que diverge del plan por definición.
**Cómo se lee la revisión de cada fase:** [`bitacora-fases.md`](bitacora-fases.md).

Última actualización: **2026-11-03** — FB0, FB1 y FB2 construidas y en puerta técnica; pendientes de supervisión.

---

## Estados

| Estado | Significado |
|---|---|
| ⬜ No iniciado | Carpeta creada, sin archivos |
| 🟨 En progreso | Al menos un servicio o una página escritos; la fase no está en puerta |
| 🟩 En puerta | Puerta técnica pasada; pendiente de supervisión |
| ✅ Aprobado | Puerta de supervisión aprobada (fila en la bitácora) |
| ⚠️ Observado | Puerta observada; correcciones en curso |

## Fases

| Fase | Contenido | Estado | Puerta | Nota |
|---|---|---|---|---|
| FB0 | Realineación y núcleo | 🟩 | Técnica pasada | Falta 0.14 (esquema OpenAPI del backend, D-F09): es un cambio en el otro repositorio |
| FB1 | M01 Autenticación y roles | 🟩 | Técnica pasada | Login, cambio de clave, menú por rol, usuarios y permisos |
| FB2 | M02 Catálogo | 🟩 | Técnica pasada | Vehículos (con tara), tipos de mineral y transportistas |
| FB3 | M03 + M04 + M05 Registro | ⬜ | — | Fase crítica. Requiere el commit de F3–F7 del backend (R1) |
| FB4 | M09 Auditoría | ⬜ | — | — |
| FB5 | M06 Trazabilidad | ⬜ | — | — |
| FB6 | M07 Consulta | ⬜ | — | — |
| FB7 | M08 Consolidación | ⬜ | — | — |
| FB8 | Estabilización | ⬜ | — | — |
| FB9 | Despliegue | ⬜ | — | — |

## Features

| Módulo | Feature | Estado | Pantallas (ver [`pantallas.md`](pantallas.md)) | Backend |
|---|---|---|---|---|
| M01 Autenticación y roles | `features/auth/` | 🟩 | Login, cambiar clave, usuarios | ✅ F1 |
| M02 Catálogo maestro | `features/catalogo/` | 🟩 | Vehículos, tipos de mineral, transportistas | ✅ F2 |
| M03 Registro de ingresos | `features/ingresos/` | ⬜ | Registrar (3 pasos), destares, corregir, revertir, anular | ✅ F3 |
| M04 Reconocimiento | dentro de `ingresos/` y `consulta/` | ⬜ | Revisión del registro, pestaña Reconocimiento | ✅ F3 |
| M05 Validación | dentro de `ingresos/` y `consulta/` | ⬜ | Revisión del registro, pestaña Validación | ✅ F3 |
| M06 Trazabilidad | `features/trazabilidad/` | ⬜ | Lotes, detalle, abrir, asignar, dividir, cierre, pestaña Trazabilidad | ✅ F5 |
| M07 Consulta | `features/consulta/` | 🟨 Inicio mínimo | Inicio, avisos, consulta, listado, detalle, calendario | ✅ F6 |
| M08 Consolidación | `features/consolidacion/` | ⬜ | Consolidación | ✅ F7 |
| M09 Auditoría | `features/auditoria/` | ⬜ | Auditoría, pestaña Historial | ✅ F4 |

## Núcleo (`core/`, `shared/`, `models/`)

| Pieza | Estado | Fase |
|---|---|---|
| `sesion.service.ts` (signals, matriz de permisos) | ✅ | FB0 |
| `autenticacion.interceptor.ts` + renovación por actividad (D-F20) | ✅ | FB0 |
| `errores.interceptor.ts` (cuatro formas de `detalles`, errores en `Blob`) | ✅ | FB0 |
| `sesionGuard`, `invitadoGuard`, `permisoGuard`, `claveTemporalGuard` | ✅ | FB0 |
| Armazón: barra lateral por rol, cabecera, barra inferior, franja de conexión | ✅ | FB0 |
| Tema con los tokens de la maqueta | ✅ | FB0 |
| `borrador-registro.service.ts` (IndexedDB) | ⬜ | FB3 |
| `marco-listado`, `acciones-registro`, `insignia-estado`, `pestanas-ruta`, `formulario-vehiculo`, `formulario-tipo-mineral` | ✅ | FB0–FB2 |
| `visor-imagen-protegida` y demás de `pantallas.md` §6 | ⬜ | Según la fase que los necesite |

## Infraestructura del proyecto

| Pieza | Estado | Nota |
|---|---|---|
| Angular 17.3 standalone + signals | ✅ | — |
| Angular Material | ✅ | — |
| `@angular/pwa` y service worker | ✅ Retirados | D-F07 |
| `idb` | ✅ | Se conserva para el borrador (D-F15) |
| Tres entornos y proxy hacia `:8000` | ✅ | — |
| Node 20 LTS fijado | ✅ | `.nvmrc` y `engines`; el CI usa Node 20. La máquina local sigue en Node 24 |
| ESLint y Prettier | ✅ | Límites entre capas con `import/no-restricted-paths` (D-F22) |
| Pipeline de GitHub Actions | ✅ | `frontend.yml` (formato, lint, pruebas con cobertura, build y presupuesto) y `docs.yml` |
| Pruebas unitarias | ✅ | 130 pruebas; cobertura 89,6 % de sentencias (mínimo 80 %) |
| Bundle inicial | ✅ | 367 kB (presupuesto 500 kB, D-F21) |
| Esquema OpenAPI del backend completo | ⬜ | D-F09, paso 0.14 |

## Bloqueos actuales

1. **Backend sin commit de F3 a F7** (R1). No afectó a FB0–FB2; conviene resolverlo antes de FB3.
2. **Esquema OpenAPI incompleto** (D-F09, paso 0.14): pendiente en el repositorio del backend.

## Próximo paso

Puertas de supervisión de FB0, FB1 y FB2 con sus guiones (`plan-implementacion.md` §6). Aprobadas,
FB3: registro de ingresos.
