---
name: contexto-frontend
description: Carga el contexto de la tesis antes de escribir cualquier cosa en el frontend Angular — sistema web inteligente para el control de inventarios de ingreso de mineral, indicadores vigentes I1 a I6 y de la variable independiente, roles, mapa de módulos M01 a M09 y features, fases FB0 a FB9, decisiones D-nn y D-F vigentes y dónde está la documentación fuente. Úsala como primer paso de toda tarea en este repositorio, y siempre que aparezcan siglas como HU-M, CA, RN-M, RNF-M, RF, D-nn, D-F, DR-nn, FB, V1 a V5, T01 a T06 o los indicadores.
---

# Contexto — frontend de la tesis

Este repositorio contiene **solo el cliente Angular** del *sistema web inteligente para el control
de inventarios de ingreso de mineral* (Construcción y Minería, planta de Pillcomarca, Huánuco,
2027). La documentación del sistema vive en el repositorio vecino y **no se copia aquí** (D-11,
D-F10). Rutas, desde la raíz de este repositorio:

| Qué | Dónde |
|---|---|
| Marco de tesis — manda sobre todo | `../LogisticaMinera/docs/00-tesis/marco_tesis.md` |
| Decisiones de reformulación DR-01 a DR-31 | `../LogisticaMinera/docs/00-tesis/decisiones_reformulacion.md` |
| Decisiones de diseño D-01 a D-28 | `../LogisticaMinera/docs/00-arquitectura/decisiones_diseno.md` |
| Guía del frontend | `../LogisticaMinera/docs/00-arquitectura/GUIA_FRONTEND_ANGULAR.md` |
| Historias y requerimientos | `../LogisticaMinera/docs/modulos/M{nn}-*/HU.md` y `requerimientos/` |
| Criterios por caso (Anexo A) | `../LogisticaMinera/docs/01-plan/PLAN_IMPLEMENTACION.md` |
| Maqueta (forma de las pantallas) | `../LogisticaMinera/Mockup/index.html` |
| Código del backend (verdad del contrato) | `../LogisticaMinera/backend/apps/` |

Si necesitas una historia, una regla o un mensaje, **léelo allí**. Si el repositorio vecino no está,
pídelo antes de inventar contenido.

## Documentos de este repositorio

| Documento | Para qué |
|---|---|
| `docs/plan-implementacion.md` | Fases FB0 a FB9 con pasos, guion de revisión y puerta |
| `docs/verificacion-criterios.md` | Qué se revisa en la interfaz de cada uno de los 277 criterios |
| `docs/contrato-api.md` | Cada endpoint desde el cliente: formas, errores, permisos |
| `docs/pantallas.md` | Rutas, menú por rol, pantallas, componentes compartidos |
| `docs/decisiones.md` | D-F01 en adelante |
| `docs/estado-modulos.md` · `docs/bitacora-fases.md` | Avance real y registro de puertas |

## Qué mide la tesis

**Variable dependiente** — se mide por observación de cada ingreso, no con consultas al sistema;
el sistema debe conservar marcas de tiempo confiables y no estorbar:

| Indicador | Qué mide | Dónde lo toca el frontend |
|---|---|---|
| I1 Tiempo de espera del registro | Inicio del registro − pesaje | Que registrar desde el teléfono sea inmediato: captura en un toque desde cualquier pantalla |
| I2 Tiempo de registro | Fin − inicio del registro | La pantalla de revisión única: cada toque de más cuenta |
| I3 Completitud | 7 campos consignados | Revisión: placa, fecha y hora, bruto, tara, neto, mineral, tipo de vehículo |
| I4 Recuperación del respaldo | Consulta → ticket y datos en pantalla | Consulta por placa y fecha con el ticket al lado |
| I5 Tiempo de consolidación | Solicitud → total del mes | Consolidación |
| I6 Grado de trazabilidad | Etapas vinculadas / etapas de la ruta | Detalle del lote y pestaña Trazabilidad |

**Variable independiente**: RFC (10 RF), CPS (casos de prueba), ERA (exactitud del reconocimiento),
TDI (detección de inconsistencias V1–V5), **SUS** (usabilidad) y **TCA** (tareas T01–T06 completadas
sin asistencia). SUS y TCA dependen casi por completo del frontend.

> Los indicadores I1 a I6 del sistema anterior (latencia, cobertura, stock, desviación…) significaban
> otra cosa. Si los ves en algún archivo, es un residuo y se corrige.

**La pantalla crítica es la revisión del registro** (FB3): una sola pantalla con lo reconocido, su
confianza, las inconsistencias junto al campo y la confirmación.

## Módulos, features y fases

| Módulo | Feature | Fase |
|---|---|---|
| M01 Autenticación y roles | `features/auth/` | FB1 |
| M02 Catálogo maestro | `features/catalogo/` | FB2 |
| M03 Registro de ingresos | `features/ingresos/` | FB3 |
| M04 Reconocimiento automático | dentro de `ingresos/` y pestaña del detalle | FB3 |
| M05 Validación automática (V1–V5) | dentro de `ingresos/` y pestaña del detalle | FB3 |
| M09 Auditoría | `features/auditoria/` y pestaña Historial | FB4 |
| M06 Trazabilidad | `features/trazabilidad/` | FB5 |
| M07 Consulta | `features/consulta/` (incluye el detalle del ingreso) | FB6 (detalle desde FB3) |
| M08 Consolidación | `features/consolidacion/` | FB7 |

FB0 es el núcleo; FB8 la estabilización; FB9 el despliegue.

## Roles (valores de la API entre paréntesis)

| Rol | Alcance |
|---|---|
| Administrador (`ADMINISTRADOR`) | Todo, incluidos usuarios, auditoría, anulación, modificar tara y cierre de lotes |
| Administrativo (`ADMINISTRATIVO`) | Registro, corrección, consultas, consolidación y exportación, catálogos (salvo tara registrada), composición de lotes |
| Supervisor de planta (`SUPERVISOR`) | Registro de ingresos, vehículos nuevos y destares, paso por las etapas, consulta |

Lo que se oculta por rol **también** lo rechaza el servidor; la matriz única está en
`backend/apps/accounts/permissions.py` y resumida en `docs/contrato-api.md` §9.

## Decisiones que condicionan el código del cliente

| Decisión | Consecuencia |
|---|---|
| D-01 | El ingreso tiene tres marcas: pesaje (fecha reconocida + hora que propone el servidor y edita el usuario), inicio y fin del registro (servidor, nadie las edita) |
| D-02 | El código del ingreso lo asigna el servidor; el cliente nunca lo genera |
| D-07, D-22 | Nada se borra: se anula o se desactiva; ningún `DELETE` |
| D-08 | Las reglas viven en el servidor; el cliente solo muestra el resultado |
| D-13 | Lo reconocido no se persiste sin confirmación del usuario |
| D-19 | El listado de ingresos es de M07 |
| D-23 | Códigos HTTP y cuerpo uniforme de error |
| D-25 | Borrador firmado: `POST ingresos/borradores/` → revisión → `POST ingresos/` |
| D-27 | Búsqueda y listado en un endpoint; cabecera; respaldo con tres estados |
| D-F07 | Sin PWA ni service worker |
| D-F13 | Las rutas del cliente son las que fabrica el servidor en sus enlaces |
| D-F14 | La imagen del ticket se carga como `Blob` autenticado |
| D-F15 | El borrador del registro vive en IndexedDB |

## Contrato con el backend

Base `/api/v1/`, plural y con barra final. Todo error llega como
`{"codigo", "mensaje", "detalles"}`. El `mensaje` coincide **literalmente** con el criterio de
aceptación: se muestra tal cual, nunca se reformula ni se escribe en el cliente. `detalles` tiene
cuatro formas (`campos`, `inconsistencias`, campos de DRF y propias): ver `docs/contrato-api.md`
§1.3. **No existe** `detalles.campo`.

Fuera de alcance, para no construirlo por inercia: salidas y ventas (solo el destino del lote),
existencias de producto terminado, cola de sincronización sin conexión, aplicación nativa,
integración con la balanza.
