---
name: contexto-frontend
description: Carga el contexto de la tesis minera antes de escribir cualquier cosa en el frontend Angular — variables de investigación, indicadores I1 a I6, roles, mapa de módulos M01 a M09, decisiones de diseño vigentes y ubicación de la documentación fuente. Úsala como primer paso de toda tarea en este repositorio, y siempre que aparezcan siglas como HU-M, RN-M, RNF-M, RU-M, RS-M, D-nn o los indicadores I1 a I6.
---

# Contexto — frontend de la tesis minera

Este repositorio contiene **solo el cliente Angular**. La documentación de la tesis —historias,
requerimientos, diagramas, decisiones— vive en el repositorio del backend y **no se duplica aquí**
(D-11): dos copias de una historia divergen y la trazabilidad muere ahí.

Si necesitas una historia, una regla de negocio o un requerimiento, léelo de
`docs/modulos/M{nn}-*/requerimientos/` del repositorio del backend. Si no lo tienes clonado, pídelo
antes de inventar el contenido.

## Qué mide la tesis

El sistema existe para mejorar seis indicadores. Cada pantalla sirve a uno; si no sirve a ninguno,
sobra.

| Indicador | Qué mide | Dónde lo toca el frontend |
|---|---|---|
| I1 | Latencia entre el pesaje y la disponibilidad del dato | Formulario de ingreso y cola offline |
| I2 | Cobertura de registro por tipo de vehículo (propio/externo) | Selector de vehículo del catálogo |
| I3 | Tiempo de determinación del stock por producto | Pantalla de existencias |
| I4 | Desviación entre stock declarado y estimado | Registro de salidas |
| I5 | Tiempo de recuperación del dato de un ingreso | Búsqueda y listados |
| I6 | Meses con reporte consolidado disponible | Reportes y exportaciones |

**La pantalla crítica es el formulario de ingreso.** De ella dependen I1 e I2 directamente. Cada
campo que se le añade se paga en el cronómetro del RNF-M03-03 (menos de 90 segundos).

## Módulos y features

| Módulo | Feature | Módulo | Feature |
|---|---|---|---|
| M01 Autenticación | `features/autenticacion/` | M05 Existencias | `features/existencias/` |
| M02 Catálogo | `features/catalogo/` | M06 Reportes | `features/reportes/` |
| M03 Ingresos | `features/ingresos/` | M08 Auditoría | `features/auditoria/` |
| M04 Salidas | `features/salidas/` | M09 Búsqueda | `features/busqueda/` |

**M07 (captura sin conexión) no tiene feature**: es transversal y vive en `core/` como interceptor
más cola de sincronización (D-04, D-11). Si fuera una pantalla, M03 tendría que saber si hay red.

## Roles

Administrador, Administrativo y Supervisor. Lo que se oculta por rol en la interfaz **también** se
rechaza en el servidor: el guard de ruta es experiencia de usuario, no control de acceso
(HU-M01-04 CA02).

## Decisiones que condicionan el código del cliente

| Decisión | Consecuencia en el frontend |
|---|---|
| D-01, D-03 | `hora_pesaje` la escribe el usuario; `hora_registro` la asigna el servidor. En offline se envía `horaCapturaLocal` |
| D-02 | El cliente genera `uuidLocal`, **nunca** un correlativo |
| D-04 | El service worker y la cola existen desde la semana 1, no se agregan al final |
| D-07 | Nada se borra: se anula o se desactiva |
| D-08 | Las validaciones del formulario son experiencia de usuario; la autoridad es el backend |
| D-10 | M06 y M09 no tienen modelos propios: consumen los de M03, M04 y M05 |
| D-11 | Repositorio aparte; cada feature con `data-access/`, `pages/` y `ui/` |

## Contrato con el backend

Base `/api/v1/`, plural y con barra final. Todo error llega con la misma forma:

```json
{"codigo": "TARA_MAYOR_QUE_BRUTO", "mensaje": "La tara debe ser menor que el peso bruto", "detalles": {"campo": "tara_tn"}}
```

El `mensaje` coincide **literalmente** con el criterio de aceptación de la historia y las pruebas del
backend lo verifican por igualdad exacta. Muéstralo tal cual, en el campo que indica `detalles.campo`.
No lo reformules ni lo traduzcas.

El esquema OpenAPI vivo está en `/api/v1/docs/` del backend: es el contrato entre los dos
repositorios. Ante una duda de forma, se consulta ahí antes de tocar `models/`.
