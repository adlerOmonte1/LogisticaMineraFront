# Contrato con la API del backend

**Documento:** propio de este repositorio. Es la lectura del contrato **desde el cliente**: qué
endpoint usa cada pantalla, qué forma tiene lo que envía y lo que recibe, y qué rarezas hay que
conocer antes de escribir un `data-access/`.
**No duplica:** historias, reglas ni mensajes. Los textos literales viven en el backend
(`apps/*/services/mensajes.py`) y el cliente **nunca** los escribe: los muestra tal como llegan.
**Fuente:** código del backend en la rama `feature/M03-registro-ingresos` (F0 a F7 cerradas,
2026-11-02) y el esquema que genera `manage.py spectacular`. Cuando el esquema y este documento
difieran, gana el código del backend y este documento se corrige.
**Última revisión:** 2026-11-03.

---

## 1. Convenciones generales

### 1.1 Base, formato y autenticación

| Aspecto | Valor |
|---|---|
| Base | `environment.apiUrl` = `/api/v1` (desarrollo, vía proxy) |
| Rutas | Plural y con barra final. Los identificadores solo admiten dígitos: uno mal formado responde 404 (D-27) |
| Métodos | `GET`, `POST`, `PATCH`. **Ningún endpoint usa `DELETE` ni `PUT`** (D-22): nada se borra, se anula o se desactiva |
| Autenticación | `Authorization: Bearer <access>`. JWT de SimpleJWT, `access` de 30 min y `refresh` de 7 días (`JWT_ACCESS_MINUTES`, `JWT_REFRESH_DAYS`). El refresh **no rota**: `POST auth/refresh/` devuelve solo un `access` nuevo. La vida del `access` es la **ventana de inactividad** (`apps/accounts/autenticacion.py`): un token vencido responde 401 `SESION_EXPIRADA`, y el cliente solo lo renueva antes de que venza y mientras el usuario trabaja (D-F20) |
| Zona horaria | `America/Lima`. Las fechas-hora llegan en ISO 8601 con desfase (`2026-11-02T08:15:00-05:00`); las fechas, `AAAA-MM-DD`; las horas, `HH:MM` |
| Decimales | Toneladas y capacidades llegan como **cadena** (`"12.50"`). El modelo del cliente las tipa `string` y solo las convierte para mostrar o calcular una vista previa |
| Documentación viva | `GET /api/v1/docs/` (Swagger) y `GET /api/v1/esquema/` (OpenAPI) |

### 1.2 Cuerpo de error uniforme (D-23)

Todo error llega así:

```json
{ "codigo": "INCONSISTENCIAS", "mensaje": "Debe corregir o justificar las inconsistencias señaladas", "detalles": { } }
```

| HTTP | Significado | Qué hace el cliente |
|---|---|---|
| 400 | Datos inválidos o regla incumplida | Muestra `mensaje` literal; pinta los campos según `detalles` (§1.3) |
| 401 | Sin sesión, credenciales inválidas, cuenta inactiva, sesión expirada | En login: muestra `mensaje`. Fuera de login: **no** reintenta con un refresh —el `access` es la ventana de inactividad (D-F20)—; cierra la sesión y muestra `mensaje` en la pantalla de inicio de sesión |
| 403 | Rol sin permiso **o** contraseña temporal pendiente | `ACCION_NO_AUTORIZADA`: aviso con `mensaje`, sin navegar. Contraseña temporal: lleva a `/cuenta/clave` (ver §2.1) |
| 404 | Recurso inexistente | Aviso y vuelta a la lista de origen |
| 409 | Choque con el estado actual (ya anulado, lote cerrado, vehículo con tara…) | Muestra `mensaje` y **recarga** el recurso: lo que el usuario ve está desactualizado |
| 423 | Cuenta bloqueada temporalmente | Muestra `mensaje` en el login |
| 5xx / sin red | Falla del servidor o de la red | Aviso genérico **conservando** el formulario y su borrador |

### 1.3 Formas de `detalles`

`detalles` **no** tiene una forma única. El cliente debe reconocer cuatro:

| Forma | Cuándo | Cómo se pinta |
|---|---|---|
| `{"campos": ["placa", "hora"]}` | Campos obligatorios ausentes (`CAMPOS_OBLIGATORIOS`) | `mensaje` arriba del formulario; cada campo listado marcado como requerido |
| `{"inconsistencias": [{regla, campo, mensaje, bloqueante, exige_justificacion}], "justificaciones_faltantes": [{regla, mensaje}]}` | Reglas V1 a V5 al registrar o corregir (`INCONSISTENCIAS`) | Cada inconsistencia **junto a su `campo`** con su `mensaje`; las de `exige_justificacion` abren su caja de justificación |
| `{"<campo>": ["texto"]}` | Validación de serializer de DRF (`ERROR_DE_VALIDACION`, `mensaje` = «Datos inválidos») | Texto bajo el control homónimo. Son errores de forma: con un formulario bien construido no deberían aparecer |
| `{"pendientes": [...]}` y otros propios | Cierre de lote con etapas pendientes, etc. | `mensaje` ya contiene la lista; `detalles` sirve para resaltar |

La skill `contexto-frontend` anterior hablaba de `detalles.campo`: **no existe**. El traductor de
errores (`core/interceptors/error.interceptor.ts`) normaliza las cuatro formas a un único
`ErrorApi { codigo, mensaje, camposConError: Record<string, string>, inconsistencias, justificacionesFaltantes }`.

### 1.4 Paginación

`PageNumberPagination` con **25 por página**, sin parámetro para cambiar el tamaño:

```json
{ "count": 80, "next": "http://…?page=2", "previous": null, "results": [ … ] }
```

Algunas listas añaden claves al sobre (`totales`, `filtros`, `mensaje`). Para llenar un selector con
un catálogo completo, `data-access/` recorre `next` hasta agotarlo y guarda el resultado en memoria
durante la sesión (RNF-M02-02).

### 1.5 Respuestas de acción

Las acciones que modifican devuelven el recurso **con un `mensaje` al lado**, aplanado:

```json
{ "mensaje": "Ingreso registrado con el código ING-2027-00012", "id": 12, "codigo": "ING-2027-00012", … }
```

El cliente muestra `mensaje` en un aviso (snackbar) y usa el resto como el recurso actualizado. Así
lo hacen `ingresos/`, `lotes/`, `usuarios/{id}/desactivar|reactivar/` y las bajas del catálogo.

### 1.6 Archivos

| Recurso | Endpoint | Tipo | Regla del cliente |
|---|---|---|---|
| Imagen del ticket | `GET ingresos/{id}/imagen/` · `GET consulta/ingresos/{id}/ticket/` | JPG o PNG | **Exige sesión** (RNF-M03-11, RNF-M07-05): no sirve en `<img src>`. Se pide con `HttpClient` `responseType: 'blob'` y se muestra con `URL.createObjectURL`, que se revoca al destruir el componente |
| Listado exportado | `GET consulta/ingresos/exportar/` | CSV UTF-8 con BOM, `;`, coma decimal | `responseType: 'blob'`; nombre desde `Content-Disposition`; total en `X-Total-Ingresos` |
| Consolidado exportado | `GET consolidacion/mensual/exportar/` | XLSX | Igual. Nombre `consolidado_AAAA_MM.xlsx` |

**Un error en una descarga llega como JSON dentro de un `Blob`.** El servicio de descarga lo lee con
`blob.text()` y lo convierte al `ErrorApi` normal; sin eso, «No hay ingresos para exportar» se pierde.

### 1.7 Enlaces que fabrica el servidor

El inicio y los avisos de M07 devuelven `enlace` con rutas **del cliente**: `/consulta/calendario`,
`/consolidacion`, `/ingresos/destares`, `/lotes`, `/lotes/{id}`, `/lotes/{id}/cerrar`,
`/consulta/ingresos/{id}`. Un `enlace: null` significa que el rol no tiene esa pantalla (HU-M07-04
CA11): se muestra la cifra sin enlace. **El enrutador del cliente debe tener exactamente esas rutas**
(D-F13).

---

## 2. M01 — Autenticación y usuarios

### 2.1 Sesión

| Operación | Endpoint | Cuerpo | Respuesta |
|---|---|---|---|
| Iniciar sesión | `POST auth/login/` | `{username, password}` | `{access, refresh, usuario: {id, username, nombre_completo, rol, debe_cambiar_clave}}` |
| Renovar | `POST auth/refresh/` | `{refresh}` | `{access}` |
| Cerrar sesión | `POST auth/logout/` | `{refresh}` | 204 |
| Cambiar la propia clave | `POST usuarios/cambiar-clave/` | `{password_actual, password_nueva, password_nueva_confirmacion}` | `{mensaje}` |

- **No hay endpoint «yo».** El usuario de la sesión solo se conoce por la respuesta del login: se
  guarda junto al `refresh` (D-F02) y se restaura al recargar.
- `rol` vale `ADMINISTRADOR`, `ADMINISTRATIVO` o `SUPERVISOR`. En pantalla: Administrador,
  Administrativo, Supervisor de planta.
- Si `debe_cambiar_clave` es `true`, toda otra petición responde **403** con el mensaje «Debe cambiar
  la contraseña temporal antes de continuar» (HU-M01-01 CA09). El cliente lleva directo a
  `/cuenta/clave` y no muestra el menú hasta completarlo; después de cambiarla, pide iniciar sesión
  otra vez (HU-M01-02 CA05).
- Login: 401 «Usuario o contraseña incorrectos», 401 cuenta inactiva, 423 cuenta bloqueada. Sin
  distinguir campo (RNF-M01-02).

### 2.2 Usuarios (solo Administrador)

| Operación | Endpoint | Cuerpo / parámetros | Respuesta |
|---|---|---|---|
| Listar | `GET usuarios/` | `?rol=`, `?incluir_inactivos=1`, `?page=` | Página de `{id, username, nombres, apellidos, rol, is_active}` |
| Crear | `POST usuarios/` | `{username, nombres, apellidos, password, rol}` | 201 `UsuarioDetalle` |
| Ver | `GET usuarios/{id}/` | — | `{id, username, nombres, apellidos, rol, is_active, date_joined}` |
| Editar | `PATCH usuarios/{id}/` | Cualquiera de `{username, nombres, apellidos, rol}` | `UsuarioDetalle` |
| Desactivar | `PATCH usuarios/{id}/desactivar/` | — | `{mensaje, …UsuarioDetalle}` |
| Reactivar | `PATCH usuarios/{id}/reactivar/` | — | `{mensaje, …UsuarioDetalle}` |
| Restablecer clave | `POST usuarios/{id}/restablecer-clave/` | — | `{username, clave_temporal}` — **se muestra una sola vez** (HU-M01-02 CA08) y no se guarda en ningún estado del cliente |

---

## 3. M02 — Catálogo maestro

Base `catalogo/`. Las tres entidades comparten forma: listar (vigentes por defecto,
`?incluir_inactivos=1` para todos), crear, ver, editar (`PATCH` parcial), `desactivar/` y
`reactivar/` (ambas `PATCH` sin cuerpo, responden `{mensaje?, …recurso}`).

| Entidad | Ruta | Recurso | Alta | Edición | Filtros |
|---|---|---|---|---|---|
| Tipo de mineral | `tipos-mineral/` | `{id, codigo, nombre, unidad_medida, activo}` | `{codigo, nombre, unidad_medida?, desde_registro?}` | `{nombre}` (el código no cambia) | `activo`, `codigo` |
| Vehículo | `vehiculos/` | `{id, placa, titularidad, capacidad_tn, transportista, transportista_nombre, tara_tn, fecha_destare, usuario_destare, pendiente_destare, activo}` | `{placa, tipo_titularidad, capacidad_tn, transportista?}` | Igual, sin tara | `titularidad`, `activo`, `placa` (exacta) |
| Transportista | `transportistas/` | `{id, razon_social, ruc, activo}` | `{razon_social, ruc}` | `{razon_social?, ruc?}` | — |

- **Asimetría de nombres:** el vehículo se **envía** con `tipo_titularidad` y se **recibe** con
  `titularidad`. Valores `PROPIO` y `EXTERNO`; `EXTERNO` exige `transportista`.
- **Tara:** `PATCH vehiculos/{id}/tara/` con `{tara_tn, motivo}`, solo Administrador (HU-M02-01
  CA09–CA11). Un `tara_tn` en la edición normal se ignora. El vehículo nace sin tara y
  `pendiente_destare: true`.
- **Alta rápida desde el registro:** `POST vehiculos/` está abierto a los tres roles (DR-17).
  `POST tipos-mineral/` con `desde_registro: true` hace opcional el código; solo Administrativo y
  Administrador.
- `unidad_medida` solo admite `TONELADA`.
- Patrón de placa configurable en el servidor (`PATRON_PLACA`, D-24). El cliente **no** lo replica
  como validador bloqueante: a lo sumo normaliza a mayúsculas y deja que V3 responda.

---

## 4. M03, M04 y M05 — Registro de ingresos

Base `ingresos/`. M03 no tiene listado general (D-19): el listado es de M07.

### 4.1 Flujo de registro (D-25)

```
captura ──POST ingresos/borradores/──► propuesta + borrador firmado
                                         │ el usuario revisa, corrige, justifica
                                         ▼
                         POST ingresos/ {borrador, placa, fecha, hora, peso_bruto_tn, tipo_mineral, justificaciones}
                                         │
                                         ▼
                              201 {mensaje, …Ingreso}
```

**Paso 1 · `POST ingresos/borradores/`** — `multipart/form-data`.

| Campo | Cuándo |
|---|---|
| `imagen` | Con foto. JPG o PNG, ≤ 10 MB; el cliente la reduce antes (RNF-M03-04) |
| `sin_foto=true` + `motivo_sin_respaldo` | Sin foto. Motivo: `TICKET_EXTRAVIADO`, `SIN_CAMARA`, `BALANZA_SIN_TICKET`, `OTRO` |

Respuesta 200:

```jsonc
{
  "borrador": "<token firmado>",           // se devuelve tal cual al confirmar; no vence
  "hora_inicio_registro": "2026-11-02T08:15:03-05:00",
  "sin_respaldo_fotografico": false,
  "motivo_sin_respaldo": null,
  "reconocimiento": {                      // null en el registro sin foto
    "exito": true, "motor": "tesseract", "version_motor": "5.3", "umbral_confianza": 0.8,
    "aviso": null,                          // texto literal si la imagen fue ilegible o el motor no respondió
    "campos": [ { "nombre": "PLACA", "valor": "ABC-123", "confianza": 0.93, "dudoso": false, "aviso": null } ]
  },
  "propuesta": { "placa": "ABC-123", "fecha": "2026-11-02", "peso_bruto_tn": "32.40",
                 "hora": "08:15", "hora_es_propuesta": true },
  "vehiculo": { "id": 4, "placa": "ABC-123", "titularidad": "PROPIO", "capacidad_tn": "30.00",
                "tara_tn": "12.00", "pendiente_destare": false, "activo": true },   // null si la placa no está
  "aviso_placa": null,                      // «La placa … no está registrada…» o «… está dado de baja…»
  "inconsistencias": [ { "regla": "V4", "campo": "peso_bruto_tn", "mensaje": "…", "bloqueante": false, "exige_justificacion": true } ],
  "puede_agregar_tipo_mineral": true,
  "aviso_tipo_mineral": null                // al Supervisor: «Si no está en la lista, pida a un administrativo…»
}
```

- Los nombres de campo del reconocimiento son `PLACA`, `FECHA`, `PESO_BRUTO`; en la propuesta,
  `placa`, `fecha`, `peso_bruto_tn`.
- `dudoso: true` ⇒ resaltar sin depender solo del color y mostrar `aviso` literal (HU-M04-01 CA02,
  RNF-M04-09).
- Campo con `valor: null` ⇒ vacío y editable, sin inventar nada (CA03).
- La hora la propone el **servidor**; el navegador no la calcula (DR-11).
- **Nada está persistido todavía** (D-13). El borrador es lo único que el cliente guarda.

**Paso 2 · `POST ingresos/`** — JSON:

```json
{ "borrador": "<token>", "placa": "ABC-123", "fecha": "2026-11-02", "hora": "08:10",
  "peso_bruto_tn": "32.40", "tipo_mineral": 3, "justificaciones": { "V4": "Carga autorizada por jefe de turno" } }
```

- Respuesta 201 `{mensaje, …Ingreso}`. Con tara: estado `REGISTRADO`; sin tara: `EN_PROCESO`.
- Rechazo por reglas: 400 `INCONSISTENCIAS` con `detalles` completo (§1.3).
- Borrador ya usado: 409 «Este borrador ya se registró como el ingreso {codigo}» — el cliente
  descarta el borrador local y lleva al detalle.
- Borrador inválido o ajeno: 400 «Debe adjuntar la imagen del ticket de balanza».
- **La revalidación ocurre solo al confirmar.** No hay endpoint para revalidar mientras el usuario
  corrige: si cambia un dato señalado, la alerta se actualiza con la respuesta del `POST` (HU-M05-01
  CA04). El cliente puede **anticipar** V2 (tara ≥ bruto) y V5 (fecha futura) como ayuda visual, sin
  bloquear (D-08).

### 4.2 Recurso `Ingreso`

```
id, codigo, estado (EN_PROCESO | REGISTRADO | ANULADO), placa, vehiculo, tipo_vehiculo (PROPIO | EXTERNO),
tipo_mineral, tipo_mineral_codigo, tipo_mineral_nombre,
fecha_hora_pesaje, hora_inicio_registro, hora_fin_registro,      ← tres marcas distintas, solo lectura
peso_bruto_tn, tara_tn, peso_neto_tn,                            ← tara y neto nunca editables
sin_respaldo_fotografico, motivo_sin_respaldo (cadena vacía si hay foto), motivo_sin_respaldo_texto, imagen_url,
registrado_por, motivo_anulacion, anulado_por,
reconocimiento: {id, hubo_reconocimiento, motivo},
correccion_revertible: <id del evento> | null
```

### 4.3 Operaciones sobre un ingreso

| Operación | Endpoint | Cuerpo | Rol |
|---|---|---|---|
| Ver | `GET ingresos/{id}/` | — | Todos |
| Imagen | `GET ingresos/{id}/imagen/` | — (blob) | Todos |
| Corregir | `PATCH ingresos/{id}/` | `{placa?, fecha?, hora?, peso_bruto_tn?, tipo_mineral?, motivo, justificaciones?}` | Administrativo, Administrador |
| Revertir la última corrección | `POST ingresos/{id}/revertir-correccion/` | `{motivo, correccion: <correccion_revertible>, justificaciones?}` | Administrativo, Administrador |
| Anular | `PATCH ingresos/{id}/anular/` | `{motivo}` | Administrador |
| Validaciones | `GET ingresos/{id}/validaciones/` | — | Todos. Lista sin paginar de `{id, regla, momento, cumple, detalle, resolucion, justificacion, fecha_hora}` |
| Reconocimiento | `GET reconocimientos/{id}/` | — | Todos. `{id, ingreso, codigo_ingreso, motor, version_motor, fecha_proceso, umbral_confianza, exito, causa_fallo, motivo_fallo, campos: [{nombre_campo, valor_reconocido, valor_confirmado, confianza, fue_corregido, dudoso}], puede_corregir_ingreso}` |

- La corrección solo envía lo que cambió; sin cambios responde «No hay cambios que guardar».
- Lo que el servidor asigna (código, marcas, tara, neto) se ignora si llega (HU-M03-02 CA04): el
  cliente no lo envía.
- `puede_corregir_ingreso` y `correccion_revertible` deciden si se ofrecen esos botones; el rol de la
  sesión decide el resto.

### 4.4 Destare

| Operación | Endpoint | Cuerpo / respuesta |
|---|---|---|
| Pendientes | `GET ingresos/` | `{count, mensaje, vehiculos: [{id, placa, ingresos}], results: [{id, codigo, vehiculo, placa, fecha_hora_pesaje, peso_bruto_tn}]}` — **no es un listado general**: son los ingresos En proceso. `mensaje` = «No hay vehículos pendientes de destare» cuando no hay |
| Registrar | `POST ingresos/destares/` | `{vehiculo, tara_tn, fecha_destare?, justificaciones?: {"<codigo del ingreso>": "…"}}` → 201 `{mensaje, vehiculo: {id, placa, tara_tn, fecha_destare}, ingresos: [{id, codigo, peso_bruto_tn, peso_neto_tn, estado}]}` |

En el destare las justificaciones van **por código de ingreso**, no por regla (D-25).

---

## 5. M06 — Trazabilidad

### 5.1 Catálogos de apoyo

| Endpoint | Respuesta |
|---|---|
| `GET etapas/` | `[{codigo: SECADO\|ZARANDEO\|MOLIENDA\|ENSACADO, nombre, orden}]` |
| `GET rutas/` | `{rutas: [{codigo, nombre, etapas: [...]}], destinos: [{codigo: VENTA\|TRASLADO, nombre}]}` |

Rutas: `ZARANDEO_ENSACADO` (Zaranda), `MOLIENDA_ENSACADO` (Molido),
`ZARANDEO_MOLIENDA_ENSACADO` (Zarandeado y molido). El secado es común y va antes de elegir ruta.

### 5.2 Lotes

| Operación | Endpoint | Cuerpo | Rol |
|---|---|---|---|
| Listar | `GET lotes/` | `?estado=ABIERTO\|EN_RECORRIDO\|CERRADO`, `?tipo_mineral=`, `?desde=`, `?hasta=`, `?page=` | Todos |
| Abrir | `POST lotes/` | `{nombre, tipo_mineral, fecha_apertura?}` | Gestión |
| Ver | `GET lotes/{id}/` | — | Todos |
| Agregar mineral | `POST lotes/{id}/minerales/` | `{tipo_mineral}` | Gestión |
| Quitar mineral | `POST lotes/{id}/minerales/{id_tipo}/quitar/` | — | Gestión |
| Disponibles para asignar | `GET lotes/{id}/ingresos/` | — → `{ingresos: [fila], otros_minerales: [{tipo_mineral, ingresos: [fila]}]}` | Todos |
| Asignar | `POST lotes/{id}/ingresos/` | `{ingresos: [ids], autorizacion?}` (autorización obligatoria si alguno es de otro mineral) | Gestión |
| Retirar | `POST lotes/{id}/ingresos/{id_ingreso}/retirar/` | — | Gestión |
| Iniciar recorrido | `PATCH lotes/{id}/iniciar-recorrido/` | — | Gestión |
| Registrar etapa | `POST lotes/{id}/etapas/` | `{etapa?, ruta?, parte?, ingreso?, fecha_hora?, horas_molienda?, observacion?, bigbags?: {cantidad, recalcular?, peso_aproximado_tn?}}` → 201 con `paso` | Todos |
| Secado propio de un tardío | `POST lotes/{id}/ingresos/{id_ingreso}/secado/` | `{fecha_hora?, observacion?, fracciones?: [{parte, fraccion}]}` | Todos |
| Bigbags | `POST lotes/{id}/bigbags/` | `{parte?, cantidad, recalcular?, peso_aproximado_tn?}` | Todos |
| Dividir | `POST lotes/{id}/division/` | `{partes: [{nombre, fraccion: "1/2", ruta}]}` (2 a 6) | Gestión |
| Resumen para cerrar | `GET lotes/{id}/resumen/` | — → `{pendientes, toneladas_registradas, bigbags, ensacado_aproximado_tn, diferencia_tn, es_estimacion, partes, horas_desde_apertura, horas_desde_inicio, ultimo_ensacado}` | Todos |
| Cerrar | `PATCH lotes/{id}/cerrar/` | `{destino: VENTA\|TRASLADO, observacion?}` | Administrador |

Fila de la lista: `{id, codigo, nombre, estado, tipo_mineral, tipo_mineral_nombre, fecha_apertura,
fecha_inicio_recorrido, ruta, destino, ingresos, toneladas}`.

Detalle: `{id, codigo, nombre, estado, fecha_apertura, fecha_inicio_recorrido, ruta, destino,
destino_texto, observacion_cierre, fecha_cierre, usuario_cierre, composicion, total, partes,
recorrido, bigbags, siguientes, pendientes}`. Lo que la interfaz necesita para no equivocarse:

- **`siguientes`** — `[{carga, parte, ingreso, etapa, elegir_ruta}]`: lo **único** que se ofrece
  registrar (RNF-M06-07). Si `elegir_ruta` es `true`, se pide la ruta en lugar de la etapa.
- **`pendientes`** — textos de lo que falta; alimentan el aviso y el cierre.
- **`composicion[].ingresos[]`** trae `tardio`, `secado_propio` y `otro_mineral` para señalarlos.
- Todo lo que lleva `es_estimacion: true` (toneladas por parte, peso de bigbags, diferencia) se
  muestra como estimación y nunca se suma (RNF-M06-09).

Las fracciones se escriben como texto (`"1/3"`, `"0.5"`). La interfaz suma y muestra cuánto falta
para la unidad antes de confirmar (RNF-M06-10); el servidor tiene la última palabra.

**Cómo lo lee el cliente.** `etapas/` y `rutas/` se piden una vez por sesión. El «Siguiente paso»
usa `POST …/etapas/`, salvo el secado de un tardío (`ingreso` con etapa `SECADO`), que usa
`POST …/ingresos/{id}/secado/` (D-F36). «Cierre de lotes» pide `…/resumen/` de cada lote de la
página porque la lista no trae los pendientes (D-F35). La pestaña Trazabilidad del ingreso lee
`trazabilidad` del detalle de M07 y no llama a `ingresos/{id}/trazabilidad/` (D-F37).

### 5.3 Trazabilidad de un ingreso

`GET ingresos/{id}/trazabilidad/` →

```
{ ingreso, anulado, lote: {id, codigo, nombre, estado, destino, fecha_cierre} | null, mensaje?,
  secado: {propio, completado, fecha_hora, usuario},
  lineas: [{nombre, ruta, etapas: [{codigo, nombre, completada, fecha_hora, usuario}]}],
  ruta_por_decidir, etapas_recorridas, etapas_totales, proceso_completo }
```

`etapas_totales: null` con `ruta_por_decidir: true` ⇒ no se muestra proporción (HU-M06-03 CA07).

---

## 6. M07 — Consulta

Base `consulta/`. Solo lectura, salvo el evento de la exportación.

| Operación | Endpoint | Parámetros | Respuesta |
|---|---|---|---|
| Búsqueda por placa y fecha | `GET ingresos/` | `placa`, `fecha` **(la presencia de cualquiera de las dos claves la convierte en búsqueda)**, `fecha_desde`, `fecha_hasta` | Página de filas + `totales`, `filtros`, `mensaje` |
| Listado | `GET ingresos/` | `fecha_desde`, `fecha_hasta`, `tipo_mineral`, `vehiculo`, `titularidad`, `estado`, `q`, `page` | Igual. Sin fechas: mes en curso hasta hoy |
| Exportar listado | `GET ingresos/exportar/` | Los filtros del listado | CSV (blob). Gestión |
| Detalle completo | `GET ingresos/{id}/` | — | Ver abajo |
| Ticket | `GET ingresos/{id}/ticket/` | — | Imagen (blob) o 400 con `codigo` `SIN_RESPALDO_FOTOGRAFICO` / `NO_DISPONIBLE` |
| Calendario | `GET calendario/` | `anio`, `mes`, `dia?` | `{anio, mes, dias: [{fecha, ingresos, toneladas, con_en_proceso, con_anulados}], resumen: {ingresos, toneladas, dias_con_llegadas, en_proceso}, dia?: {fecha, ingresos: [fila], mensaje}}` |
| Búsqueda de la cabecera | `GET cabecera/` | `q` | `{tipo: "INGRESO", id, codigo}` ⇒ abrir detalle · `{tipo: "PLACA", placa}` ⇒ ir a la consulta con esa placa |
| Inicio | `GET inicio/` | — | `{fecha, ingresos_hoy, toneladas_hoy, pendientes_destare, lotes_en_proceso, ultimos_ingresos: [fila], ultimos_siete_dias: [{fecha, toneladas}]}` — cada bloque con `enlace` |
| Avisos | `GET avisos/` | — | `{cantidad, avisos: [{tipo, titulo, detalle, enlace, ingreso?, lote?}], mensaje}` — tipos `DESTARE`, `V4_JUSTIFICADA`, `LOTE`, `LOTE_LISTO`, `SIN_LOTE` |

**Fila** (listado, búsqueda, calendario, inicio): `{id, codigo, fecha_hora_pesaje, placa,
tipo_vehiculo, tipo_mineral, peso_bruto_tn, peso_neto_tn, pendiente_destare, estado, estado_texto,
motivo_anulacion, sin_respaldo_fotografico, motivo_sin_respaldo}`. Con ella se señalan anulado, En
proceso y sin respaldo **sin abrir el detalle** (RNF-M03-16).

**Totales**: `{ingresos, registrados, en_proceso, anulados, toneladas}` — `toneladas` excluye
anulados y En proceso (HU-M07-02 CA03).

**Detalle** `GET consulta/ingresos/{id}/` = `Ingreso` (§4.2) más:

```
respaldo:       {tipo: IMAGEN | SIN_RESPALDO_FOTOGRAFICO | NO_DISPONIBLE, url?, motivo?, mensaje?}
reconocimiento: {disponible: true, …Reconocimiento} | {disponible: false, mensaje}
validaciones:   {disponible: true, resultados: [...]} | {disponible: false, mensaje}
trazabilidad:   (forma de §5.3; con lote null trae mensaje «El mineral espera en cancha…»)
historial:      [Evento]  (forma de §8)
```

**Es la única llamada que necesita el detalle con pestañas** (RNF-M07-02): las pestañas no hacen
peticiones propias, salvo la imagen. Un bloque ausente se **indica** con su `mensaje`, no se omite
(HU-M07-02 CA06).

**Cómo lo lee el cliente.** La pantalla de consulta envía siempre la clave `placa` (D-F40); el
listado no envía `placa` ni `fecha`. La búsqueda de la cabecera y los avisos se piden desde
`core/consulta/` y los avisos se recargan tras cada navegación (D-F39). `ingresos/exportar/` se
descarga como Blob con el nombre de `Content-Disposition`, y su error —«No hay ingresos para
exportar»— llega dentro del Blob y se traduce como cualquier otro (D-F14).

---

## 7. M08 — Consolidación (Administrativo y Administrador)

| Operación | Endpoint | Parámetros | Respuesta |
|---|---|---|---|
| Total mensual | `GET consolidacion/mensual/` | `anio`, `mes` (por defecto, el mes en curso) | `{anio, mes, tipos_mineral: [{tipo_mineral, codigo, nombre, ingresos, toneladas, participacion}], total_toneladas, total_ingresos, en_proceso: {cantidad, codigos}, anulados_excluidos, mensaje, en_proceso_mensaje, al_corte}` |
| Exportar | `GET consolidacion/mensual/exportar/` | `anio`, `mes` | XLSX (blob) |

`mensaje`, `en_proceso_mensaje` y `al_corte` son textos listos para mostrar. Periodo futuro: 400
«No se puede consolidar un periodo futuro».

---

## 8. M09 — Auditoría

| Operación | Endpoint | Parámetros | Respuesta | Rol |
|---|---|---|---|---|
| Historial de un ingreso | `GET ingresos/{id}/historial/` | — | `{ingreso, puede_ver_auditoria, count, results: [Evento]}` cronológico | Todos |
| Auditoría del sistema | `GET auditoria/` | `usuario`, `accion`, `texto`, `page` | Página de `Evento` + `mensaje` («No hay eventos con estos filtros») | Administrador |

**Evento**: `{id, fecha_hora, accion, accion_texto, operacion, entidad, id_entidad, referencia,
usuario, cambios: [{campo, anterior, nuevo}], valores_anteriores, valores_nuevos, motivo,
direccion_ip, ingresos_relacionados}`.

Acciones: `CREAR`, `MODIFICAR`, `ANULAR`, `RECONOCER`, `CORREGIR_DATO`, `EXPORTAR`,
`INICIAR_SESION`, `CERRAR_SESION`, `ACCESO_RECHAZADO`. `operacion` distingue `CORRECCION`,
`REVERSION` y `DESTARE` dentro de `MODIFICAR`.

`puede_ver_auditoria: false` ⇒ el historial no ofrece el enlace a la auditoría completa (HU-M09-02
CA05).

**Cómo lo lee el cliente (D-F32).** El detalle `GET consulta/ingresos/{id}/` ya trae `historial`
con los mismos eventos y el mismo orden que `ingresos/{id}/historial/`; la pestaña Historial usa
ese dato y decide el enlace con el permiso `CONSULTAR_AUDITORIA`, de modo que no llama al segundo
endpoint. `texto` de la auditoría busca en la referencia (código del ingreso, placa, RUC, código
del mineral, usuario) y en los valores y el motivo de cada evento. `mensaje` es `null` si hay
resultados. `usuario` acepta el nombre de usuario o su identificador; `accion`, uno de los nueve
valores de arriba.

---

## 9. Matriz de permisos

Única definición en el backend: `apps/accounts/permissions.py`. Esta tabla es su lectura; si
difieren, gana el backend.

| Permiso | Admin | Administrativo | Supervisor | Operaciones |
|---|:-:|:-:|:-:|---|
| `PuedeConsultar` | ✓ | ✓ | ✓ | Lecturas de M04 a M07, historial de M09, catálogos (lectura) |
| `PuedeRegistrarIngreso` · `PuedeRegistrarDestare` | ✓ | ✓ | ✓ | `borradores/`, `POST ingresos/`, `destares/` |
| `PuedeDarAltaVehiculo` | ✓ | ✓ | ✓ | `POST catalogo/vehiculos/` |
| `PuedeRegistrarEtapa` | ✓ | ✓ | ✓ | Etapas, secado propio, bigbags |
| `PuedeCorregirIngreso` | ✓ | ✓ | — | Corrección y reversión |
| `PuedeGestionarCatalogo` | ✓ | ✓ | — | Alta (salvo vehículo), edición, baja y reactivación del catálogo |
| `PuedeComponerLote` | ✓ | ✓ | — | Abrir, minerales, asignar, retirar, iniciar recorrido, dividir |
| `PuedeExportarListado` · `PuedeConsolidar` | ✓ | ✓ | — | Exportación del listado, consolidación y su exportación |
| `PuedeAnularIngreso` | ✓ | — | — | Anulación |
| `PuedeModificarTara` | ✓ | — | — | `vehiculos/{id}/tara/` |
| `PuedeCerrarLote` | ✓ | — | — | Cierre con destino |
| `PuedeGestionarUsuarios` · `PuedeConsultarAuditoria` | ✓ | — | — | Usuarios y auditoría |

---

## 10. Huecos conocidos del esquema OpenAPI

| Hueco | Efecto | Tratamiento |
|---|---|---|
| Las `APIView` de M06, M07 y M08 declaran `OpenApiTypes.OBJECT` | Swagger no muestra la forma de la respuesta | Este documento y los serializers del backend; D-F09 propone `@extend_schema` con serializers de documentación |
| Las acciones de `ingresos/` y `lotes/` declaran como cuerpo el serializer del recurso | El cuerpo real (`BorradorEntrada`, `RegistroEntrada`, `EtapaSerializer`…) no aparece | Ídem |
| `AutenticacionJWT` sin extensión de esquema | Swagger no permite probar con token | Ídem |
| Colisión de nombres `estado` (`Estado76bEnum`) | Nombres de enum feos si se genera código | Los modelos del cliente se escriben a mano (D-F09) |
