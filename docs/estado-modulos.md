# Estado de los módulos — frontend

**Documento:** vivo. Se actualiza al cerrar una fase o un trabajo relevante, no en cada commit.
**No duplica:** el plan ([`plan-implementacion.md`](plan-implementacion.md)), que dice qué toca y en
qué orden. Esto es el **avance real**, que diverge del plan por definición.
**Cómo se lee la revisión de cada fase:** [`bitacora-fases.md`](bitacora-fases.md).

Última actualización: **2026-11-04** — FB0 a FB3 en puerta técnica, pendientes de supervisión; FB4 a FB7 construidas y recorridas contra el backend, en puerta técnica; pendientes de supervisión.

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
| FB3 | M03 + M04 + M05 Registro | 🟩 | Técnica pasada | Registro en 3 pasos, sin foto, destare, detalle (4 pestañas), corrección, reversión y anulación. Pendiente: T01 y T02 cronometradas en teléfono real |
| FB4 | M09 Auditoría | 🟩 | Técnica pasada, con recorrido en vivo | Pestaña Historial del detalle y Auditoría del sistema. Faltan por recorrer los filtros de usuario y de acción y los eventos de acceso rechazado |
| FB5 | M06 Trazabilidad | 🟩 | Técnica pasada, con recorrido en vivo | Lotes, detalle con el recorrido en tarjetas por etapa, composición, división, bigbags, cierre y pestaña Trazabilidad; rediseñado con la disposición de la maqueta el 2026-11-05 (D-F45), sin recorrido visual posterior. Secado en 2 toques y ruta en 3 comprobados en teléfono **emulado**; falta teléfono real, dividir, tardíos y traslados |
| FB6 | M07 Consulta | 🟩 | Técnica pasada, con recorrido en vivo | Inicio con avisos, consulta por placa y fecha con el ticket al lado, listado con totales y exportación, calendario y búsqueda de la cabecera. Falta cronometrar T03 en un teléfono real y recorrer lo anotado en la bitácora |
| FB7 | M08 Consolidación | 🟩 | Técnica pasada, con recorrido en vivo | Total mensual por tipo de mineral con avisos de En proceso, anulados excluidos y «al corte», selector de periodo sin futuro y exportación XLSX; pantalla = archivo = calendario (84,80 t en noviembre). Falta cronometrar T05 y T06 en un teléfono real y ver el total cambiar tras una corrección de peso (CA05) |
| FB8 | Estabilización | ⬜ | — | — |
| FB9 | Despliegue | ⬜ | — | — |

## Features

| Módulo | Feature | Estado | Pantallas (ver [`pantallas.md`](pantallas.md)) | Backend |
|---|---|---|---|---|
| M01 Autenticación y roles | `features/auth/` | 🟩 | Login, cambiar clave, usuarios | ✅ F1 |
| M02 Catálogo maestro | `features/catalogo/` | 🟩 | Vehículos, tipos de mineral, transportistas | ✅ F2 |
| M03 Registro de ingresos | `features/ingresos/` | 🟩 | Registrar (3 pasos), destares, corregir, revertir, anular | ✅ F3 |
| M04 Reconocimiento | dentro de `ingresos/` y `consulta/` | 🟩 | Revisión del registro, pestaña Reconocimiento | ✅ F3 |
| M05 Validación | dentro de `ingresos/` y `consulta/` | 🟩 | Revisión del registro, pestaña Validación | ✅ F3 |
| M06 Trazabilidad | `features/trazabilidad/` | 🟩 | Lotes, abrir, detalle (asignar, dividir, siguiente paso, bigbags), cierre de lotes y cerrar; la pestaña Trazabilidad vive en `consulta/` (D-F37) | ✅ F5 |
| M07 Consulta | `features/consulta/` | 🟩 | Inicio, consulta por placa y fecha, listado y exportación, calendario y detalle con sus pestañas; los avisos y la búsqueda están en la cabecera (D-F39) | ✅ F6 |
| M08 Consolidación | `features/consolidacion/` | 🟩 | Consolidación con su exportación XLSX | ✅ F7 |
| M09 Auditoría | `features/auditoria/` | 🟩 | Auditoría del sistema; la pestaña Historial vive en `consulta/` (D-F32) | ✅ F4 |

## Núcleo (`core/`, `shared/`, `models/`)

| Pieza | Estado | Fase |
|---|---|---|
| `sesion.service.ts` (signals, matriz de permisos) | ✅ | FB0 |
| `autenticacion.interceptor.ts` + renovación por actividad (D-F20) | ✅ | FB0 |
| `errores.interceptor.ts` (cuatro formas de `detalles`, errores en `Blob`) | ✅ | FB0 |
| `sesionGuard`, `invitadoGuard`, `permisoGuard`, `claveTemporalGuard` | ✅ | FB0 |
| Armazón: barra lateral por rol, cabecera, barra inferior, franja de conexión | ✅ | FB0 |
| Búsqueda de la cabecera y campana de avisos (`core/consulta/`, D-F39) | ✅ | FB6 |
| Tema con los tokens de la maqueta | ✅ | FB0 |
| `borrador-local.service.ts` (IndexedDB, en `features/ingresos`, D-F28) | ✅ | FB3 |
| `core/catalogo/` (datos de referencia con caché, D-F26) | ✅ | FB2–FB3 |
| `marco-listado`, `acciones-registro`, `insignia-estado`, `pestanas-ruta`, `formulario-vehiculo`, `formulario-tipo-mineral` | ✅ | FB0–FB2 |
| `visor-imagen`, `indicador-confianza`, `marca-sin-respaldo`, `insignia-ingreso` | ✅ | FB3 |
| `linea-eventos`, `cambios-evento` | ✅ | FB4 |
| `recorrido-etapas` | ✅ | FB5 |
| `selector-periodo` (con límite opcional, D-F44) | ✅ | FB7 |
| Piezas visuales de la maqueta, `estilos/_maqueta.scss` (D-F45) | ✅ | FB5 (rediseño) |
| `tabla-paginada` | ⬜ | Según la fase que la necesite |

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
| Pruebas unitarias | ✅ | 535 pruebas; cobertura 94,0 % de sentencias (mínimo 80 %) |
| Bundle inicial | ✅ | 376,6 kB (presupuesto 500 kB, D-F21); el registro, la auditoría, los lotes y la consolidación son chunks diferidos |
| Esquema OpenAPI del backend completo | ⬜ | D-F09, paso 0.14 |

## Bloqueos actuales

1. ~~Backend sin commit de F3 a F7 (R1)~~ — resuelto: `main` del backend contiene F3 a F7 (PR #68, `a755736`).
2. **Esquema OpenAPI incompleto** (D-F09, paso 0.14): pendiente en el repositorio del backend. Al 2026-11-04
   `manage.py spectacular` da 34 avisos, sobre todo por falta de la extensión de autenticación de
   `AutenticacionJWT`.

## Próximo paso

Con FB7 terminan los módulos: sigue **FB8 (estabilización)**, y en paralelo las puertas de
supervisión de FB0 a FB7 con sus guiones (`plan-implementacion.md` §6). Antes, lo que el recorrido
contra el backend dejó sin ver (detalle en la bitácora): en un **teléfono real**, el paso de una
etapa en tres toques o menos (FB5) y las tareas T01 a T03, T05 y T06 cronometradas; y, con las tres
cuentas, dividir un lote, los tardíos, el aviso que desaparece tras un destare y el total de la
consolidación que cambia tras corregir un peso.
