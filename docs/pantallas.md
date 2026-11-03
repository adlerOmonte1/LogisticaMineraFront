# Pantallas, rutas y navegación

**Documento:** propio de este repositorio. Inventario de todas las pantallas del cliente con su ruta,
su feature, los roles que la ven, los endpoints que consume, las historias que cubre y la pantalla de
la maqueta contra la que se revisa.
**Referencia visual:** `LogisticaMinera/Mockup/index.html` del backend. La maqueta manda en la
**forma** (disposición, textos de la interfaz, flujo de pasos); la documentación del backend manda en
el **fondo** (reglas, mensajes, permisos). Si chocan, gana la documentación y se anota la diferencia
en la fila correspondiente.
**Contrato:** [`contrato-api.md`](contrato-api.md).
**Última revisión:** 2026-11-03.

---

## 1. Mapa de rutas

Las rutas que el backend fabrica como `enlace` en el inicio y los avisos (marcadas ◆) son contrato:
no se renombran (D-F13).

| Ruta | Feature | Página | Roles | Fase |
|---|---|---|---|---|
| `/login` | `auth` | `LoginPage` | Pública | FB1 |
| `/cuenta/clave` | `auth` | `CambiarClavePage` | Todos (forzada si `debe_cambiar_clave`) | FB1 |
| `/inicio` | `consulta` | `InicioPage` | Todos | FB1 (mínima) → FB6 |
| `/ingresos/registrar` | `ingresos` | `RegistrarIngresoPage` | Todos | FB3 |
| `/ingresos/destares` ◆ | `ingresos` | `DestaresPage` | Todos | FB3 |
| `/ingresos/:id/corregir` | `ingresos` | `CorregirIngresoPage` | Administrativo, Administrador | FB3 |
| `/ingresos/:id/revertir` | `ingresos` | `RevertirCorreccionPage` | Administrativo, Administrador | FB3 |
| `/ingresos/:id/anular` | `ingresos` | `AnularIngresoPage` | Administrador | FB3 |
| `/consulta` | `consulta` | `ConsultaPlacaFechaPage` | Todos | FB6 |
| `/consulta/ingresos` | `consulta` | `ListadoIngresosPage` | Todos | FB6 |
| `/consulta/ingresos/:id` ◆ | `consulta` | `DetalleIngresoPage` (pestañas como rutas hijas) | Todos | FB3 → FB6 |
| `/consulta/ingresos/:id/:pestana` | `consulta` | idem; `datos`, `ticket`, `reconocimiento`, `validacion`, `trazabilidad`, `historial` | Todos | FB3 → FB5 |
| `/consulta/calendario` ◆ | `consulta` | `CalendarioPage` | Todos | FB6 |
| `/lotes` ◆ | `trazabilidad` | `LotesPage` | Todos | FB5 |
| `/lotes/nuevo` | `trazabilidad` | `AbrirLotePage` | Administrativo, Administrador | FB5 |
| `/lotes/cierre` | `trazabilidad` | `CierreLotesPage` | Administrador | FB5 |
| `/lotes/:id` ◆ | `trazabilidad` | `LoteDetallePage` | Todos | FB5 |
| `/lotes/:id/cerrar` ◆ | `trazabilidad` | `CerrarLotePage` | Administrador | FB5 |
| `/consolidacion` ◆ | `consolidacion` | `ConsolidacionPage` | Administrativo, Administrador | FB7 |
| `/catalogos/vehiculos` | `catalogo` | `VehiculosPage` | Administrativo, Administrador | FB2 |
| `/catalogos/tipos-mineral` | `catalogo` | `TiposMineralPage` | Administrativo, Administrador | FB2 |
| `/catalogos/transportistas` | `catalogo` | `TransportistasPage` | Administrativo, Administrador | FB2 |
| `/administracion/usuarios` | `auth` | `UsuariosPage` | Administrador | FB1 |
| `/administracion/permisos` | `auth` | `PermisosPage` (solo lectura) | Administrador | FB1 |
| `/administracion/auditoria` | `auditoria` | `AuditoriaPage` | Administrador | FB4 |

Administración tiene tres pestañas, como en la maqueta: Usuarios, Permisos y Auditoría.
| `**` | — | Redirección a `/inicio` (o `/login` sin sesión) | — | FB0 |

Un rol que fuerza una ruta que no le corresponde ve la pantalla de «Acción no autorizada» del
armazón, no una pantalla vacía (`permisoGuard`). El servidor la rechaza igual (HU-M01-03 CA02).

## 2. Menú por rol (HU-M01-03 CA01)

Mismo orden y mismos textos que el `NAV` de la maqueta; la columna de rutas usa las de §1.

| Sección | Entrada | Ruta | Admin | Administrativo | Supervisor |
|---|---|---|:-:|:-:|:-:|
| General | Inicio | `/inicio` | ✓ | ✓ | ✓ |
| | Ingresos (insignia: En proceso) | `/consulta/ingresos` | ✓ | ✓ | ✓ |
| | Calendario | `/consulta/calendario` | ✓ | ✓ | ✓ |
| | Trazabilidad | `/lotes` | ✓ | ✓ | ✓ |
| | Cierre de lotes | `/lotes/cierre` | ✓ | — | — |
| | Consulta | `/consulta` | ✓ | ✓ | ✓ |
| | Consolidación | `/consolidacion` | ✓ | ✓ | — |
| Gestión | Catálogos | `/catalogos/vehiculos` | ✓ | ✓ | — |
| | Administración | `/administracion/usuarios` | ✓ | — | — |

Acciones primarias fijas: **Registrar ingreso** (botón principal del armazón y de la barra inferior
en teléfono) y **Destares** dentro de Ingresos, para los tres roles. Cabecera: búsqueda (HU-M07-02
CA16–CA17) y campana de avisos (HU-M07-04) en todas las pantallas.

Acciones condicionadas dentro de las pantallas:

| Acción | Dónde | Quién la ve |
|---|---|---|
| Corregir, revertir corrección | Detalle del ingreso | Administrativo, Administrador (y `correccion_revertible` no nulo para revertir) |
| Anular | Detalle del ingreso | Administrador |
| Exportar listado | Listado de ingresos | Administrativo, Administrador |
| Modificar tara | Catálogo de vehículos | Administrador |
| Agregar tipo de mineral desde el registro | Revisión del registro | Según `puede_agregar_tipo_mineral` del borrador |
| Abrir lote, minerales, asignar, retirar, iniciar recorrido, dividir | Lotes | Administrativo, Administrador |
| Registrar etapa, secado propio, bigbags | Detalle del lote | Todos |
| Cerrar lote | Detalle del lote y Cierre de lotes | Administrador |
| Ir a la auditoría completa | Pestaña Historial | Según `puede_ver_auditoria` |

## 3. Armazón (`core/layout/`)

| Pieza | Comportamiento |
|---|---|
| Barra lateral | Escritorio: fija, oscura (`--sidebar`). Teléfono: oculta, se abre con el botón de menú. Entradas según §2 |
| Barra inferior | Solo en teléfono: Inicio, Ingresos, **Registrar** (central), Trazabilidad, Consulta |
| Cabecera | Título y migas de pan de la página · búsqueda · campana con contador · menú del usuario (nombre, rol, cambiar contraseña, cerrar sesión) |
| Aviso de conexión | Franja visible cuando `navigator.onLine` es `false` o una petición falla por red; en el registro indica que el borrador está a salvo |
| Avisos | Snackbar para los `mensaje` de éxito; los errores de campo van en el campo, no en el snackbar |

## 4. Pantallas por feature

Columnas: **HU** que cubre, **endpoints** (base `/api/v1/`), **maqueta** (función `p…` de
`Mockup/index.html`).

### 4.1 `auth` — M01

| Pantalla | Contenido | HU | Endpoints | Maqueta |
|---|---|---|---|---|
| Inicio de sesión | Usuario, contraseña (campos ≥ 44 px, RNF-M01-05), «¿Olvidó su contraseña?» con el texto de HU-M01-01 CA08 en un diálogo, errores literales | HU-M01-01 | `auth/login/` | `pLogin` |
| Cambiar contraseña | Actual, nueva, repetición; modo forzado sin menú | HU-M01-01 CA09, HU-M01-02 CA05–CA07, CA11 | `usuarios/cambiar-clave/` | — |
| Usuarios | Tabla con filtro por rol y «mostrar inactivos»; alta y edición en panel; desactivar/reactivar con confirmación; restablecer clave con diálogo de una sola vez | HU-M01-02, HU-M01-03 | `usuarios/…` | `pAdmin('usuarios')` |
| Permisos | Matriz de solo lectura «función × rol», con los textos de las funciones de la maqueta (`FUNCS`). Sin endpoint: se dibuja con la misma tabla de permisos de `SesionService`, que es la lectura de `permissions.py`. Los roles no se editan desde la interfaz | HU-M01-03 | — | `pAdmin('permisos')` |

### 4.2 `catalogo` — M02

| Pantalla | Contenido | HU | Endpoints | Maqueta |
|---|---|---|---|---|
| Vehículos | Tabla (placa, titularidad, capacidad, transportista, tara o «Pendiente de destare», estado) con filtros; alta/edición en panel; transportista obligatorio si EXTERNO; tara solo Administrador con motivo; baja y reactivación | HU-M02-01 | `catalogo/vehiculos/…`, `catalogo/transportistas/` | `pCatalogos('vehiculos')` |
| Tipos de mineral | Tabla (código, nombre, estado); alta/edición (código inmutable); baja y reactivación | HU-M02-02 | `catalogo/tipos-mineral/…` | `pCatalogos('minerales')` |
| Transportistas | Tabla (razón social, RUC, estado); alta/edición; baja y reactivación | HU-M02-03 | `catalogo/transportistas/…` | `pCatalogos('transportistas')` |

Los formularios de vehículo y de tipo de mineral son componentes de `ui/` **sin servicio**, porque
el registro (feature `ingresos`) los reutiliza en su panel lateral. Viven en `shared/components/`
(regla de no importar entre features).

### 4.3 `ingresos` — M03, M04, M05

| Pantalla | Contenido | HU | Endpoints | Maqueta |
|---|---|---|---|---|
| Registrar · paso 1 Captura | Zona de captura (`capture="environment"`), selección o arrastre; reducción con `canvas`; «Registrar sin foto» en la misma pantalla con motivo de lista cerrada; indicador de progreso del reconocimiento | HU-M03-01 CA02, CA07, CA16; HU-M04-01 CA04–CA05 | `ingresos/borradores/` | `pRegistrar` paso 1 |
| Registrar · paso 2 Revisión | Una sola pantalla: imagen ampliable al lado; placa, fecha, **hora propuesta señalada**, peso bruto con su confianza y resaltado de dudosos; tipo de mineral; tara y neto de referencia (solo lectura); aviso «quedará En proceso» si no hay tara; inconsistencias junto al campo y caja de justificación para V1/V4; `aviso_placa` con el alta del vehículo en panel; alta de tipo de mineral en panel si `puede_agregar_tipo_mineral` | HU-M03-01, HU-M04-01, HU-M05-01, HU-M02-01 CA12, HU-M02-02 CA07 | `ingresos/` (POST), `catalogo/vehiculos/`, `catalogo/tipos-mineral/` | `pRegistrar` paso 2 |
| Registrar · paso 3 Confirmado | Código asignado, estado, enlaces a «Ver detalle» y «Registrar otro» | HU-M03-01 CA01, CA05 | — | `pRegistrar` `ok` |
| Destares | Lista de pendientes agrupada por vehículo; elegir vehículo; tara, fecha/hora del destare; justificación por ingreso si V4; resultado con los ingresos que pasan a Registrado | HU-M03-04 | `ingresos/`, `ingresos/destares/` | `pDestare` |
| Corregir | Formulario con los campos corregibles precargados, motivo obligatorio, inconsistencias y justificaciones como en la revisión | HU-M03-02 CA01–CA10 | `ingresos/{id}/` (GET, PATCH) | Modal de corrección de `pDetalle` |
| Revertir corrección | Valores que se restaurarán, motivo, justificaciones si una regla vuelve a advertir | HU-M03-02 CA12–CA14 | `ingresos/{id}/`, `ingresos/{id}/revertir-correccion/` | Acción de `pDetalle` |
| Anular | Resumen del ingreso y motivo obligatorio | HU-M03-03 | `ingresos/{id}/`, `ingresos/{id}/anular/` | Acción de `pDetalle` |

Las tres se abren **desde el detalle** (feature `consulta`) por navegación, no por import: su
servicio vive en `ingresos/data-access/`. En teléfono son páginas; en escritorio, la misma página se
presenta como hoja lateral sobre el detalle. Al terminar vuelven al detalle (§5).

### 4.4 `consulta` — M07 (y el detalle que agrega M03 a M06 y M09)

| Pantalla | Contenido | HU | Endpoints | Maqueta |
|---|---|---|---|---|
| Inicio | Cuatro cifras con enlace según rol, últimos 5 ingresos, toneladas de los últimos 7 días como barras CSS (sin librería, D-F04), acceso directo a la consulta por placa y fecha (RNF-M07-07) | HU-M07-04 CA01–CA05, CA11 | `consulta/inicio/` | `pInicio` |
| Avisos (panel de la campana) | Lista con título, detalle y un solo paso a su pantalla | HU-M07-04 CA06–CA10 | `consulta/avisos/` | Panel de notificaciones |
| Consulta por placa y fecha | Placa (parcial), fecha o rango; resultados con estado, sin respaldo y anulado señalados; al elegir, el ticket ampliable junto a los datos | HU-M07-01 | `consulta/ingresos/?placa&fecha…`, `consulta/ingresos/{id}/`, `…/ticket/` | `pConsulta` |
| Listado de ingresos | Filtros (rango, mineral, vehículo, titularidad, estado, texto), totales del conjunto, tabla paginada, exportar CSV | HU-M07-02 CA01–CA03, CA07–CA11, CA13–CA15 | `consulta/ingresos/`, `consulta/ingresos/exportar/` | `pIngresos` |
| Detalle del ingreso | Cabecera con código, estado y acciones; pestañas Datos · Ticket · Reconocimiento · Validación · Trazabilidad · Historial | HU-M07-02 CA04–CA06, CA12; HU-M03-01 CA09, CA17; HU-M03-03 CA05; HU-M04-02; HU-M06-03; HU-M09-02 | `consulta/ingresos/{id}/`, `…/ticket/` | `pDetalle` + `DTABS` |
| Calendario | Mes con cifras por día como texto (no solo color, RNF-M07-11), marcas de En proceso y anulados, navegación de meses, lista del día elegido | HU-M07-03 | `consulta/calendario/` | `pCalendario` |

### 4.5 `trazabilidad` — M06

| Pantalla | Contenido | HU | Endpoints | Maqueta |
|---|---|---|---|---|
| Lotes | Tabla con filtros por estado, mineral y fechas; botón «Abrir lote» para gestión | HU-M06-01 | `lotes/` | `pLotes` |
| Abrir lote | Nombre, tipo de mineral, fecha de apertura | HU-M06-01 CA01–CA03 | `lotes/` (POST), `catalogo/tipos-mineral/` | Modal de `pLotes` |
| Detalle del lote | Estado, composición por mineral con tardíos y «Otro mineral» señalados, totales; partes con fracción, ruta y toneladas **estimadas**; recorrido; bigbags; **«Siguiente paso»** construido solo con `siguientes` (≤ 3 toques, RNF-M06-06); acciones de composición para gestión | HU-M06-01 CA04–CA23, HU-M06-02, HU-M06-04 CA08 | `lotes/{id}/…`, `etapas/`, `rutas/` | `pLote` |
| Asignar ingresos | Disponibles del mineral del lote y «Agregar de otro tipo de mineral» agrupado, con autorización obligatoria | HU-M06-01 CA04–CA09, CA14, CA20–CA21 | `lotes/{id}/ingresos/` | Modal de `pLote` |
| Dividir | 2 a 6 partes con nombre, fracción y ruta; suma visible y cuánto falta (RNF-M06-10) | HU-M06-04 | `lotes/{id}/division/`, `rutas/` | Modal de `pLote` |
| Cierre de lotes | Lotes en recorrido con su estado de cierre (listo / pendientes) | HU-M06-05 | `lotes/?estado=EN_RECORRIDO` | `pAltas` |
| Cerrar lote | Resumen con la diferencia ensacado–registrado **como estimación**, destino, observación, confirmación | HU-M06-05 | `lotes/{id}/resumen/`, `lotes/{id}/cerrar/` | `pAlta` |

### 4.6 `consolidacion` — M08

| Pantalla | Contenido | HU | Endpoints | Maqueta |
|---|---|---|---|---|
| Consolidación | Selector de mes y año (sin futuro); tabla por tipo de mineral con ingresos, toneladas y participación; total; avisos de En proceso, anulados excluidos y «al corte»; exportar XLSX | HU-M08-01, HU-M08-02 | `consolidacion/mensual/`, `…/exportar/` | `pConsolidacion` |

### 4.7 `auditoria` — M09

| Pantalla | Contenido | HU | Endpoints | Maqueta |
|---|---|---|---|---|
| Auditoría del sistema | Filtros de usuario, acción y texto; tabla del más reciente al más antiguo; detalle del evento con antes/después y enlace al ingreso o al lote | HU-M09-03 | `auditoria/` | `pAdmin('auditoria')` |

La pestaña **Historial** del detalle es de `consulta` (el dato llega en el detalle); su componente
de presentación de eventos vive en `shared/components/linea-eventos/` porque también lo usa esta
pantalla.

## 5. Flujos entre features sin importarse

| Necesidad | Solución |
|---|---|
| El registro reutiliza el formulario de vehículo y de tipo de mineral | Formularios en `shared/components/` (solo `input()`/`output()`); la página del registro llama a su propio `data-access/` para el `POST` |
| El detalle (consulta) ofrece corregir, revertir y anular (ingresos) | Navegación a `/ingresos/:id/corregir`, `/revertir` o `/anular`; al terminar, vuelve a `/consulta/ingresos/:id` |
| El detalle muestra la trazabilidad (trazabilidad) | El dato viene en el detalle de M07; el componente de recorrido vive en `shared/components/recorrido-etapas/` |
| El inicio y los avisos enlazan a lotes, destares, consolidación | Por URL (`enlace` del servidor), nunca por import |

## 6. Componentes compartidos previstos (`shared/components/`)

| Componente | Lo usan |
|---|---|
| `tabla-paginada` (sobre `mat-table` + `mat-paginator` con el sobre de §1.4 del contrato) | Todas las listas |
| `estado-vacio` | Listas sin resultados (con el `mensaje` del servidor) |
| `insignia-estado` | `EN_PROCESO`, `REGISTRADO`, `ANULADO`, `ABIERTO`, `EN_RECORRIDO`, `CERRADO`, activo/inactivo |
| `marca-sin-respaldo` | Toda lista y detalle de ingresos (RNF-M03-16) |
| `visor-imagen-protegida` | Ticket en la revisión, en el detalle y en la consulta; carga por blob y amplía (HU-M07-01 CA03) |
| `campo-confianza` | Revisión del registro y pestaña Reconocimiento |
| `aviso-inconsistencia` + `caja-justificacion` | Revisión, corrección, destare |
| `formulario-vehiculo`, `formulario-tipo-mineral` | Catálogo y registro |
| `recorrido-etapas` | Detalle del lote y pestaña Trazabilidad |
| `linea-eventos` | Pestaña Historial y auditoría |
| `confirmacion` (diálogo con motivo opcional u obligatorio) | Bajas, anulación, reversión, cierre |
| `selector-periodo` | Calendario y consolidación |

Ninguno inyecta servicios. Se crean cuando la segunda pantalla los necesita, no antes.
