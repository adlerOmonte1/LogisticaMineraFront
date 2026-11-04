# PLAN-F — Plan de implementación del frontend por fases, con revisión por fase

**Documento:** propio de este repositorio. Es la *Parte B* de cada fase de
`docs/01-plan/PLAN_IMPLEMENTACION.md` del backend, que hasta hoy no se había ejecutado, convertida en
un plan con pasos, verificación y una puerta de revisión al cierre de cada fase.
**No duplica:** historias, criterios ni reglas. Cada paso cita la HU y el CA del backend; el texto
se lee allí.
**Documentos hermanos:** [`contrato-api.md`](contrato-api.md) (qué consume cada pantalla),
[`pantallas.md`](pantallas.md) (rutas, menú y pantallas), [`verificacion-criterios.md`](verificacion-criterios.md)
(qué revisar de cada criterio de aceptación), [`bitacora-fases.md`](bitacora-fases.md) (registro de
puertas), [`decisiones.md`](decisiones.md) (D-F01 en adelante), [`estado-modulos.md`](estado-modulos.md)
(avance real).
**Fecha:** 2026-11-03. **Estado:** vigente desde su aprobación; los cambios entran como decisión
D-F nueva.

---

## 1. Propósito

Construir el cliente Angular completo del sistema web inteligente para el control de inventarios de
ingreso de mineral, contra el backend ya terminado (F0 a F7 con puerta técnica cerrada), de modo
que:

1. Las **27 historias** de M01 a M09 tengan su pantalla y su flujo completo.
2. Los **criterios marcados «Interfaz»** en el Anexo A del plan del backend —la única deuda de
   cobertura del sistema— queden cerrados.
3. Las **seis tareas de usabilidad** T01 a T06 (marco de tesis §6) puedan ejecutarse sin asistencia,
   porque de eso depende el indicador TCA y el puntaje SUS de la variable independiente.
4. El registro desde el teléfono sea lo bastante rápido y claro como para no degradar los
   indicadores I1 a I3 de la variable dependiente (tiempo de espera, tiempo de registro y
   completitud del registro).

Cada fase termina en una **puerta**: el implementador la verifica, el supervisor la revisa contra la
maqueta y la aprueba o la observa. Ninguna fase empieza sin la puerta anterior aprobada.

## 2. Punto de partida

### 2.1 Backend

| Hecho | Consecuencia para el frontend |
|---|---|
| F0 a F7 cerradas: 524 pruebas, 858 aserciones de Newman, todos los módulos al 100 % salvo criterios de interfaz | El contrato es estable: se construye contra código real, no contra supuestos |
| El trabajo de F3 a F7 está **sin commit** en la rama `feature/M03-registro-ingresos` | Riesgo R1: antes de FB3 conviene que el backend haga commit y PR de esas fases |
| El esquema OpenAPI declara `object` en M06, M07 y M08 | `contrato-api.md` suple el hueco hasta aplicar D-F09 |
| `cargar_datos_prueba` crea una cuenta por rol; sus credenciales están en `postman/entornos/local.postman_environment.json` | Es el juego de datos de todas las revisiones de puerta |
| La maqueta `Mockup/index.html` tiene las 12 pantallas | Es la referencia visual de cada puerta |

### 2.2 Frontend

El repositorio tiene un esqueleto Angular 17.3 (standalone, Material, PWA) hecho **sobre el alcance
anterior** de la tesis. Lo obsoleto se lista en la fase FB0; en resumen: módulos, indicadores,
estructura de `features/`, la captura sin conexión con cola y `uuidLocal` (obsoletos), y las seis skills.

---

## 3. El ciclo de una fase

```
  ┌─────────────┐   ┌──────────────┐   ┌───────────────┐   ┌──────────────────┐   ┌─────────────┐
  │ 1. Preparar │──►│ 2. Construir │──►│ 3. Verificar  │──►│ 4. Puerta técnica│──►│ 5. Puerta de │
  │ leer HU,    │   │ modelo →     │   │ build, tests, │   │ checklist común  │   │ supervisión  │
  │ contrato y  │   │ servicio →   │   │ recorrido por │   │ + bitácora       │   │ revisión por │
  │ maqueta     │   │ rutas → UI   │   │ rol y 360 px  │   │                  │   │ rol, aprueba │
  └─────────────┘   └──────────────┘   └───────────────┘   └──────────────────┘   └──────┬──────┘
                                                                                          │
                                          observada: se corrige y se repite 3 a 5 ◄──────┘
```

### 3.1 Quién hace qué

| Rol | Responsabilidad |
|---|---|
| Implementador (desarrollador o agente) | Pasos 1 a 4. Escribe el código, ejecuta la verificación, llena la fila de la bitácora y deja la evidencia |
| Supervisor (autor de la tesis) | Paso 5. Recorre la fase con el guion de revisión, compara contra la maqueta y decide: **Aprobada** u **Observada** con la lista de observaciones |

### 3.2 Paso 1 — Preparar

1. Leer las HU de la fase en `../LogisticaMinera/docs/modulos/M{nn}-*/HU.md` y sus criterios en el
   Anexo A del plan del backend.
2. Leer la sección de la fase en [`contrato-api.md`](contrato-api.md) y probar los endpoints en
   `http://localhost:8000/api/v1/docs/` con una cuenta de cada rol.
3. Abrir la pantalla correspondiente de la maqueta y anotar lo que se toma de ella.
4. Revisar en [`verificacion-criterios.md`](verificacion-criterios.md) qué criterios cierra la fase.

### 3.3 Paso 2 — Construir, siempre en este orden

1. **Modelos** en `src/app/models/` — espejo de lo que viaja (contrato), tipos union para los
   enumerados, decimales como `string`.
2. **Servicio** en `features/<f>/data-access/` — única puerta a `HttpClient`.
3. **Rutas** del feature con carga diferida y sus guards; enganche en `app.routes.ts`; entrada de
   menú si corresponde.
4. **Páginas** (`pages/`) y, solo cuando algo se repite, componentes de `ui/` o `shared/`.
5. **Pruebas** unitarias del servicio (con `HttpTestingController`) y de los componentes de `ui/`
   con lógica (con entradas y salidas).

### 3.4 Paso 3 — Verificar

| Verificación | Cómo |
|---|---|
| Compila y respeta el presupuesto | `npx ng build --configuration production` sin avisos de presupuesto |
| Calidad estática | `npx ng lint` sin errores (desde FB0) |
| Pruebas | `npm run test:ci` en verde, con la cobertura mínima de `karma.conf.js` |
| Contra el backend real | `npm start` con el backend del Compose y `cargar_datos_prueba` recién ejecutado |
| Por rol | Recorrido con las tres cuentas de prueba |
| En teléfono | DevTools en 360 × 740 y, desde FB3, en un teléfono real: sin desplazamiento horizontal, campos ≥ 44 px |
| Mensajes | Cada rechazo provocado a propósito muestra el `mensaje` **literal** en su lugar |

### 3.5 Paso 4 — Puerta técnica (checklist común a todas las fases)

- [ ] Build de producción sin avisos; lint y pruebas en verde.
- [ ] Cada HU de la fase tiene su pantalla y su ruta, y está en el menú del rol que corresponde.
- [ ] Cada criterio de la fase en `verificacion-criterios.md` está marcado ✅ o tiene una nota que
      explique por qué no.
- [ ] Ningún componente de `ui/` ni de `shared/` inyecta servicios.
- [ ] Ningún feature importa de otro feature (`grep -r "features/" src/app/features/<f>` solo
      encuentra rutas de su propio feature).
- [ ] Ningún control asignado por el servidor está `disabled`: se muestran como texto o `readonly`.
- [ ] Ningún mensaje de error del servidor está escrito en el cliente (`grep` de los textos del
      backend en `src/` no devuelve nada fuera de pruebas).
- [ ] Ningún `any` en modelos ni servicios.
- [ ] Las opciones ocultas por rol coinciden con `apps/accounts/permissions.py`.
- [ ] `docs/estado-modulos.md` actualizado; fila nueva en `docs/bitacora-fases.md` con estado
      «Pendiente de supervisión».
- [ ] Commits con el formato `M0n: descripcion (HU-M0n-0m)`; una historia por commit cuando se
      pueda.

### 3.6 Paso 5 — Puerta de supervisión

El supervisor sigue el **guion de revisión** de la fase (sección 6), con las tres cuentas, en
escritorio y en 360 px, y con la maqueta abierta al lado. Registra en la bitácora:

- **Aprobada** — fecha y comentario. La fase siguiente puede empezar. Se etiqueta
  `git tag FBn-aprobada`.
- **Observada** — lista numerada de observaciones. Cada una se corrige en un commit que la cita
  (`fix(FB3): obs. 2 — ...`) y se repite la puerta.

---

## 4. Mapa de fases

Espejo de las fases del backend: FB*n* es la Parte B de F*n*.

| Fase | Contenido | HU | Criterios de interfaz que cierra | Depende de |
|---|---|---|---|---|
| **FB0** | Realineación del repositorio, núcleo (interceptores, guards, sesión, armazón, tema) | — | — | Plan aprobado |
| **FB1** | M01: inicio de sesión, cambio de clave, menú por rol, usuarios | HU-M01-01 a 03 | HU-M01-01 CA08 · HU-M01-03 CA01 | FB0 |
| **FB2** | M02: vehículos, tipos de mineral, transportistas | HU-M02-01 a 03 | — | FB1 |
| **FB3** | M03, M04, M05: registro en pasos, sin foto, destare, detalle base, corrección, reversión, anulación | HU-M03-01 a 04, HU-M04-01 y 02, HU-M05-01 | HU-M04-01 CA02 | FB2 |
| **FB4** | M09: pestaña Historial y auditoría del sistema | HU-M09-01 a 03 | HU-M07-02 CA12 · HU-M09-02 CA05 | FB3 |
| **FB5** | M06: lotes, etapas, división, bigbags, cierre, pestaña Trazabilidad | HU-M06-01 a 05 | — | FB3 |
| **FB6** | M07: inicio, avisos, cabecera, listado y exportación, consulta por placa y fecha, calendario | HU-M07-01 a 04 | HU-M07-01 CA03 | FB4, FB5 |
| **FB7** | M08: consolidación y exportación | HU-M08-01 y 02 | — | FB6 |
| **FB8** | Estabilización: regresión, T01–T06, accesibilidad, rendimiento, preproducción | Todas | Todos reconfirmados | FB7 |
| **FB9** | Despliegue para la presentación | — | — | FB8 |

FB4 y FB5 no dependen entre sí; pueden ordenarse según convenga, pero se revisan por separado.

---

## 5. Calendario resumido

Una semana por fase, salvo FB3 (la crítica) y FB5 (la más extensa), que tienen dos. Las semanas se
cuentan desde la aprobación de este plan.

| Semana | Fase | Puerta |
|---|---|---|
| 1 | FB0 | Núcleo y repositorio realineado |
| 2 | FB1 | M01 con menú por rol |
| 3 | FB2 | Catálogos |
| 4–5 | FB3 | Registro de ingresos completo |
| 6 | FB4 | Historial y auditoría |
| 7–8 | FB5 | Trazabilidad |
| 9 | FB6 | Consulta, inicio y avisos |
| 10 | FB7 | Consolidación |
| 11 | FB8 | Sistema congelado con el backend |
| Después | FB9 | En el alojamiento de la presentación |

Si una fase no cierra su puerta en su semana, la siguiente no empieza: se ajusta este calendario y se
anota el motivo en la bitácora.

---

## 6. Las fases en detalle

### FB0 — Realineación y núcleo

**Objetivo.** Un repositorio coherente con el alcance vigente y un núcleo sobre el que cualquier
feature se monta sin tocar `core/`.

**Pasos.**

| N.° | Paso | Verificación |
|---|---|---|
| 0.1 | Fijar Node 20 LTS con `frontend/.nvmrc` y `engines` en `package.json` | `node -v` = 20.x; `ng version` sin «Unsupported» |
| 0.2 | Retirar la PWA (D-F07): `provideServiceWorker`, `ngsw-config.json`, `manifest.webmanifest`, el `serviceWorker` de `angular.json` y `@angular/service-worker`. Se **conserva** `idb` para el borrador (D-F15) | Build sin `ngsw-worker.js`; `grep -r serviceWorker src angular.json` vacío |
| 0.3 | Rehacer `features/` (D-F08): `auth`, `catalogo`, `ingresos`, `trazabilidad`, `consulta`, `consolidacion`, `auditoria`, cada uno con `data-access/ pages/ ui/` | `ls src/app/features` coincide con `pantallas.md` |
| 0.4 | Lint: `ng add @angular-eslint/schematics`, Prettier, regla que prohíbe `any` y los imports entre features | `npx ng lint` en verde |
| 0.5 | Modelos base: `pagina.model.ts`, `error-api.model.ts`, `usuario.model.ts` (`Rol`, `UsuarioSesion`) | Compilan; sin `any` |
| 0.6 | `core/services/sesion.service.ts`: signals `usuario`, `rol`, `autenticado`, `debeCambiarClave`; `access` en memoria, `refresh` y usuario en `localStorage` (D-F02); `puede(permiso)` con la matriz del contrato §9 | Pruebas unitarias de `puede()` para los tres roles |
| 0.7 | `core/interceptors/auth.interceptor.ts`: adjunta el token solo a `environment.apiUrl`; ante 401, **un** refresh compartido y reintento; si falla, cierra sesión | Pruebas con `HttpTestingController`: cinco 401 simultáneos producen un solo refresh |
| 0.8 | `core/interceptors/error.interceptor.ts`: normaliza las cuatro formas de `detalles` (contrato §1.3) a `ErrorApi`; trata 403 de contraseña temporal; lee errores dentro de `Blob` | Pruebas por cada forma de `detalles` |
| 0.9 | Guards: `sesionGuard`, `invitadoGuard`, `permisoGuard(permiso)` (fábrica), `claveTemporalGuard` | Pruebas: Supervisor a `/administracion/usuarios` ve «Acción no autorizada» |
| 0.10 | Armazón en `core/layout/`: barra lateral con el menú de `pantallas.md` §2 construido desde `SesionService`, cabecera con huecos para búsqueda y campana, barra inferior en teléfono, franja de conexión, snackbar | Recorrido en escritorio y 360 px |
| 0.11 | Tema Material con los tokens de la maqueta (D-F18): fuente Barlow, `--gold`/`--accent` como primario, `--sidebar` oscuro, estados `--green`/`--orange`/`--red`/`--blue` | Comparación visual lado a lado con la maqueta |
| 0.12 | Utilidades compartidas: pipes `toneladas`, `fechaLima`, `rolTexto`, `estadoTexto`; `NotificacionService`; `DescargaService` (blob + nombre de `Content-Disposition`) | Pruebas de los pipes con decimales en cadena |
| 0.13 | Skills, README, `entorno.md`, `CONTRIBUTING.md` y `estado-modulos.md` realineados (hecho en la formulación del 2026-11-03; se revisa que sigan vigentes) | Ninguna mención a salidas, existencias, cola offline o `uuidLocal` |
| 0.14 | **Backend (D-F09):** `@extend_schema` en las vistas sin forma, extensión de esquema de `AutenticacionJWT` y `ENUM_NAME_OVERRIDES` para `estado`. Cambio sin lógica, en un PR aparte del backend | `manage.py spectacular` sin advertencias de `object`; Swagger permite autorizar con token |

**Guion de revisión.** (1) Abrir `http://localhost:4200` sin sesión: lleva a `/login` (pantalla
provisional). (2) En DevTools, simular una sesión de cada rol con el usuario guardado: el menú cambia
según `pantallas.md` §2. (3) Forzar `/administracion/usuarios` como Supervisor: pantalla «Acción no
autorizada». (4) Comparar colores, tipografía y barra lateral con la maqueta. (5) Reducir a 360 px:
aparece la barra inferior, no hay desplazamiento horizontal. (6) Desconectar la red: aparece la
franja de conexión.

**Riesgos.** Que el tema de Material 17 (M2) no alcance la paleta de la maqueta sin sobrescribir
demasiadas clases: se resuelve con variables CSS propias para los estados y Material solo para la
estructura.

**Puerta de salida.** Checklist común + núcleo con pruebas en verde + revisión visual del armazón.

---

### FB1 — M01 Autenticación y roles

**Objetivo.** Entrar, salir, cambiar la contraseña, ver solo lo que el rol permite y administrar
usuarios.

**Pasos.**

| N.° | Paso | HU · CA | Verificación |
|---|---|---|---|
| 1.1 | `auth/data-access/auth.service.ts`: `login`, `logout`, `cambiarClave` | HU-M01-01 | Pruebas del servicio |
| 1.2 | Página de inicio de sesión con campos de 44 px, botón «Ingresar», errores literales (401, 423, inactiva) en un aviso del formulario, sin marcar un campo concreto | CA01–CA04, RNF-M01-02, RNF-M01-05 | Credenciales erróneas, seis intentos, usuario inactivo |
| 1.3 | Diálogo «¿Olvidó su contraseña?» con el texto del criterio, sin pedir el usuario | **CA08 (Interfaz)** | El diálogo no revela nada |
| 1.4 | Redirección tras el login a `/inicio` (pantalla mínima con saludo y rol hasta FB6) | CA01 | Las tres cuentas llegan a `/inicio` |
| 1.5 | Cierre de sesión desde el menú de usuario: `logout` con el refresh, limpieza de sesión y del borrador ajeno, vuelta a `/login` | CA05 | Tras salir, «atrás» no muestra datos |
| 1.6 | Sesión expirada: el interceptor muestra «Su sesión ha expirado. Ingrese nuevamente» en el login | CA06 | Acortar `JWT_ACCESS_MINUTES` y `JWT_REFRESH_DAYS` en el backend local |
| 1.7 | Contraseña temporal: tras un login con `debe_cambiar_clave`, solo `/cuenta/clave`; el menú no aparece | CA09 | Restablecer la clave de una cuenta e ingresar con ella |
| 1.8 | Página de cambio de contraseña (actual, nueva, repetición); al terminar, pide iniciar sesión de nuevo | HU-M01-02 CA05–CA07, CA11 | Clave actual errónea, corta, repetición distinta |
| 1.9 | `UsuariosPage`: tabla paginada, filtro por rol, «mostrar inactivos», alta y edición en panel, desactivar y reactivar con confirmación | HU-M01-02 CA01–CA04, CA09, CA10 | Usuario repetido; desactivarse a sí mismo |
| 1.10 | Restablecer clave: diálogo que muestra la temporal **una sola vez**, con botón copiar; no queda en ningún estado | HU-M01-02 CA08 | Cerrar el diálogo y verificar que no se puede volver a ver |
| 1.11 | Menú por rol definitivo y entradas ocultas; guards en todas las rutas existentes | **HU-M01-03 CA01 (Interfaz)**, CA02 | Captura del menú de cada rol contra la maqueta |
| 1.12 | `PermisosPage`: matriz de solo lectura función × rol, dibujada con la tabla de `SesionService` | HU-M01-03 | Coincide con `permissions.py` fila por fila |

**Guion de revisión.**

1. Con la cuenta del Supervisor: credenciales erróneas (mensaje literal, sin decir cuál campo),
   luego correctas → `/inicio`. Menú: solo Inicio, Ingresos, Calendario, Trazabilidad, Consulta.
   Forzar `/administracion/usuarios` → «Acción no autorizada».
2. «¿Olvidó su contraseña?» → el texto indica que solo el Administrador puede restablecerla.
3. Con el Administrador: crear un usuario Administrativo; intentar repetir el nombre; desactivar,
   reactivar; restablecer su clave y anotarla.
4. Entrar con ese usuario y la clave temporal: solo se ofrece cambiarla; con clave corta y con
   repetición distinta, mensajes literales; al cambiarla, vuelve al login.
5. Con el Administrativo: menú con Consolidación y Catálogos, sin Administración ni Cierre de lotes.
6. Cerrar sesión y pulsar «atrás» en el navegador: no se ve ninguna pantalla interna.
7. Repetir 1 y 4 a 360 px.

**Riesgos.** Que el cambio de rol de un usuario (HU-M01-03 CA03) no se refleje hasta el siguiente
login, porque el rol se guarda con la sesión. Es aceptable: el servidor aplica el rol nuevo en la
siguiente petición y el menú se corrige al volver a entrar. Se documenta en la bitácora.

**Puerta de salida.** Checklist común + HU-M01-01 a 03 navegables + los dos criterios de interfaz
cerrados.

---

### FB2 — M02 Catálogo maestro

**Objetivo.** Mantener vehículos, tipos de mineral y transportistas, y dejar los formularios listos
para el alta rápida desde el registro.

**Pasos.**

| N.° | Paso | HU · CA | Verificación |
|---|---|---|---|
| 2.1 | Modelos `vehiculo`, `tipo-mineral`, `transportista` con la asimetría `tipo_titularidad`/`titularidad` | — | Compilan |
| 2.2 | `catalogo/data-access/`: un servicio por entidad con `listar`, `listarTodos` (recorre `next`), `crear`, `editar`, `desactivar`, `reactivar`; `vehiculos.modificarTara`. Caché en memoria por sesión, invalidada en cada escritura propia (RNF-M02-02) | — | Pruebas: `listarTodos` con tres páginas |
| 2.3 | Pestañas Vehículos · Tipos de mineral · Transportistas bajo `/catalogos/*`, solo Gestión en el menú | HU-M01-03 CA01 | El Supervisor no las ve |
| 2.4 | Vehículos: tabla con filtros (titularidad, activo, placa), «Pendiente de destare» cuando no hay tara; `shared/components/formulario-vehiculo` (placa en mayúsculas, titularidad, capacidad con `inputmode="decimal"`, transportista visible y obligatorio si EXTERNO) | HU-M02-01 CA01–CA05, CA08 | Placa repetida, formato inválido, externo sin transportista |
| 2.5 | Baja y reactivación con el `mensaje` del servidor («se desactivó porque tiene ingresos…», «Vehículo reactivado») | CA06, CA13 | Dar de baja un vehículo con ingresos |
| 2.6 | Modificar tara (solo Administrador): diálogo con tara y motivo obligatorio | CA09–CA11 | Administrativo no ve la acción; sin motivo, mensaje literal |
| 2.7 | Tipos de mineral: tabla, `shared/components/formulario-tipo-mineral` (código inmutable al editar; modo `desdeRegistro` con código opcional), baja y reactivación | HU-M02-02 CA01–CA06, CA08–CA09 | Código repetido, nombre repetido, código de 7 caracteres |
| 2.8 | Transportistas: tabla, alta y edición con RUC de 11 dígitos (`inputmode="numeric"`), baja y reactivación | HU-M02-03 | RUC corto, RUC repetido, baja con vehículos |

**Guion de revisión.**

1. Administrativo: alta de un vehículo propio y de uno externo (sin transportista → mensaje); placa
   repetida; formato inválido. El nuevo aparece «Pendiente de destare».
2. Dar de baja un vehículo con ingresos (mensaje literal) y reactivarlo.
3. Intentar modificar la tara como Administrativo: la acción no aparece. Como Administrador: sin
   motivo → mensaje; con motivo → la tara cambia.
4. Tipos de mineral: alta, código repetido, nombre repetido, baja con ingresos, reactivación.
5. Transportistas: RUC de 10 dígitos, RUC repetido, baja con vehículos.
6. Supervisor: ninguna entrada de Catálogos en el menú; `/catalogos/vehiculos` forzado → «Acción no
   autorizada».

**Puerta de salida.** Checklist común + HU-M02-01 a 03 completas + formularios compartidos probados
con entradas y salidas.

---

### FB3 — M03, M04 y M05 · Registro de ingresos (fase crítica)

**Objetivo.** Registrar un ingreso desde la foto del ticket —o sin ella— en una pantalla de revisión
única, en un teléfono, con una sola mano; registrar destares; ver el detalle básico; corregir,
revertir y anular.

**Por qué es crítica.** De esta pantalla dependen la tarea T01 (registrar desde la imagen) y T02
(corregir un dato reconocido), los indicadores de la capacidad inteligente que el usuario percibe
(ERA, TDI) y los de la variable dependiente I1 (espera del registro), I2 (tiempo de registro) e I3
(completitud). Cada toque de más es tiempo de registro.

**Pasos.**

| N.° | Paso | HU · CA / RNF | Verificación |
|---|---|---|---|
| 3.1 | Modelos `borrador`, `reconocimiento`, `inconsistencia`, `ingreso`, `pendiente-destare`, `resultado-validacion` | Contrato §4 | Compilan |
| 3.2 | `ingresos/data-access/ingresos-api.service.ts`: `iniciarBorrador`, `iniciarBorradorSinFoto`, `registrar`, `obtener`, `corregir`, `revertirCorreccion`, `anular`, `pendientesDestare`, `registrarDestare`. El estado del flujo vive en `RegistroIngresoStore` (provisto por la página) | — | Pruebas del servicio con `FormData` |
| 3.3 | `shared/utils/reducir-imagen.ts`: `canvas`, lado mayor 1600 px, JPEG 0,8; rechazo local de formatos que no sean JPG/PNG y de más de 10 MB con el texto que devuelve el servidor para ese caso (se obtiene provocando el error una vez; nunca se escribe a mano) | RNF-M03-01, RNF-M03-04, CA07 | Veinte tickets: legibles tras reducir; tamaño final < 1 MB |
| 3.4 | `ingresos/data-access/borrador-local.service.ts` en IndexedDB (D-F15, D-F26): imagen reducida como `Blob`, token del borrador, campos editados, paso y momento; guardado en cada cambio; descarte al confirmar | RNF-M03-05 | Recargar la página a mitad de la revisión: todo vuelve |
| 3.5 | Paso 1 · Captura: zona con `capture="environment"`, arrastre en escritorio, «Registrar sin foto» con motivo de lista cerrada en la misma pantalla; progreso mientras el servidor reconoce; si no hay red, la imagen queda en el borrador y se ofrece reintentar | HU-M03-01 CA02, CA07, CA16; RNF-M03-02, RNF-M03-07, RNF-M03-17 | Foto desde el teléfono; sin foto; sin red |
| 3.6 | Paso 2 · Revisión: `campo-confianza` para placa, fecha y peso (resaltado con icono y texto, no solo color; `aviso` literal); vacío y editable si no hubo lectura; aviso del reconocimiento fallido con continuación manual | HU-M04-01 **CA02 (Interfaz)**, CA01, CA03–CA05; RNF-M04-09, RNF-M03-08 | Ticket legible, ilegible y motor caído (`RECONOCEDOR_ACTIVO` inexistente) |
| 3.7 | Hora del pesaje propuesta por el servidor, señalada como «propuesta» junto a la fecha | HU-M03-01 CA10 | La hora no la calcula el navegador |
| 3.8 | Tipo de mineral (selector desde la caché); alta en panel si `puede_agregar_tipo_mineral`, si no, `aviso_tipo_mineral` | HU-M03-01 CA14, CA15; HU-M02-02 CA07 | Como Supervisor y como Administrativo |
| 3.9 | Vehículo: si `aviso_placa`, mostrarlo y abrir `formulario-vehiculo` en panel; al guardar, el registro sigue con todo lo capturado | HU-M03-01 CA04, CA13; HU-M02-01 CA12; RNF-M03-13 | Placa nueva; placa dada de baja |
| 3.10 | Tara y peso neto como referencia de solo lectura; sin tara, aviso de que quedará En proceso | HU-M03-01 CA05, CA08 | Vehículo recién creado |
| 3.11 | Inconsistencias junto a su campo con el mensaje literal; caja de justificación para V1 y V4; anticipo visual de V2 y V5 sin bloquear | HU-M05-01 CA01–CA06, CA09–CA12 | Las diez inconsistencias sembradas de TDI (2 por regla) |
| 3.12 | Confirmar: `POST ingresos/`; ante 400 `INCONSISTENCIAS`, repintar todas; ante 409 de borrador usado, descartar el borrador y abrir el detalle; teclado numérico en el peso (`inputmode="decimal"`) | HU-M03-01 CA01, CA03, CA06, CA12; RNF-M03-09 | Confirmar sin justificar; confirmar dos veces |
| 3.13 | Paso 3 · Confirmado: código, estado, `mensaje`; «Ver detalle» y «Registrar otro» | CA01, CA05 | — |
| 3.14 | Destares: pendientes agrupados por vehículo (`mensaje` si no hay), tara, fecha/hora, justificación por ingreso; resultado con los ingresos que pasan a Registrado | HU-M03-04 | Destare con tara ≥ bruto, neto fuera de rango, fecha futura, vehículo con tara |
| 3.15 | Detalle base `/consulta/ingresos/:id` (feature `consulta`) con `GET consulta/ingresos/{id}/`: pestañas **Datos** (tres marcas de tiempo distintas, tara aplicada, registrado por, anulado por y motivo, marca sin respaldo con motivo), **Ticket** (`visor-imagen-protegida`, ampliable), **Reconocimiento** (leído vs confirmado, corregido, motor y versión, o motivo de su ausencia), **Validación** (resultado por regla y justificación) | HU-M03-01 CA09, CA17; HU-M03-03 CA05; HU-M04-02 CA01–CA05; HU-M07-02 CA04–CA06 | Ingreso con foto, sin foto, anulado |
| 3.16 | Corregir, revertir y anular como páginas de `ingresos` abiertas desde el detalle | HU-M03-02 CA01–CA10, CA12–CA14; HU-M03-03 CA01–CA04 | Sin motivo; sin cambios; ingreso anulado; Supervisor sin acciones |
| 3.17 | Prueba de campo: cronometrar T01 y T02 con la cuenta del Supervisor en un teléfono real, tres repeticiones | T01, T02 | Tiempos anotados en la bitácora como referencia |

**Guion de revisión.**

1. **Supervisor, teléfono, una mano.** Registrar con `postman/archivos/ticket_legible.jpg`: la
   revisión muestra placa, fecha y peso con confianza; la hora aparece como propuesta; confirmar →
   «Ingreso registrado con el código …».
2. Repetir con `ticket_ilegible.png`: mensaje de lectura fallida y campos vacíos editables.
3. Ticket con una placa nueva: aparece el aviso y el panel del vehículo; guardarlo no pierde la foto
   ni los campos; el ingreso queda **En proceso**.
4. Escribir un peso que dispare V4: el aviso aparece junto al peso; confirmar sin justificar →
   rechazo literal; justificar → registra.
5. Registrar dos veces el mismo ticket con la misma hora: V1 pide justificación.
6. «Registrar sin foto» con motivo; el detalle lo muestra «sin respaldo fotográfico» con el motivo.
7. A mitad de una revisión, activar el modo avión y recargar: el borrador vuelve completo; al
   recuperar la red se confirma sin volver a fotografiar.
8. Destares: el vehículo del paso 3 aparece; registrar su tara → el ingreso pasa a Registrado.
9. **Administrativo:** abrir un ingreso, corregir el peso sin motivo (rechazo), con motivo (neto
   recalculado), revertir la corrección. **Administrador:** anular con motivo; el detalle muestra
   anulado, motivo y responsable. **Supervisor:** el detalle no ofrece corregir ni anular.
10. Pestaña Reconocimiento del ingreso corregido: el campo aparece como corregido.

**Riesgos.** (1) Tesseract tarda más de lo esperado en el borrador: progreso visible y el tiempo real
se anota para el piloto de motores. (2) La cuota de IndexedDB en iOS: la imagen reducida pesa menos
de 1 MB, muy por debajo. (3) El texto del rechazo de formato de imagen debe salir del servidor:
la validación local solo evita subir algo que el servidor rechazará y reutiliza ese texto.

**Puerta de salida.** Checklist común + HU-M03-01 a 04, HU-M04-01 y 02, HU-M05-01 completas +
HU-M04-01 CA02 cerrado + T01 y T02 cronometradas + revisión en teléfono real.

---

### FB4 — M09 Auditoría

**Objetivo.** Ver la historia de un ingreso dentro de su detalle y, para el Administrador, la
auditoría del sistema.

**Pasos.**

| N.° | Paso | HU · CA | Verificación |
|---|---|---|---|
| 4.1 | Modelo `evento` con `cambios`, `operacion` y las nueve acciones | Contrato §8 | — |
| 4.2 | `shared/components/linea-eventos`: cronológico, autor, acción en texto, antes/después por campo, motivo; `operacion` para distinguir corrección, reversión y destare | HU-M09-02 CA01–CA03 | Ingreso corregido, revertido y destarado |
| 4.3 | Pestaña **Historial** del detalle con los eventos que ya trae `consulta/ingresos/{id}/`; enlace a la auditoría solo si el rol es Administrador | **HU-M07-02 CA12 (Interfaz)**, HU-M09-02 CA04, **CA05 (Interfaz)** | Supervisor ve el historial sin enlace |
| 4.4 | `auditoria/data-access/` y `AuditoriaPage`: filtros usuario, acción, texto; tabla paginada del más reciente al más antiguo; `mensaje` cuando no hay; detalle del evento con antes/después y enlace al ingreso o lote | HU-M09-03 | Filtros combinados; filtro sin resultados |

**Guion de revisión.** (1) Abrir el ingreso corregido y revertido en FB3 → pestaña Historial en orden
cronológico con antes, después y motivo. (2) Como Supervisor, la misma pestaña, sin enlace a la
auditoría. (3) Administrador → Administración › Auditoría: filtrar por el usuario Administrativo y la
acción Modificar; abrir un evento y saltar al ingreso. (4) Filtro sin resultados → mensaje literal.
(5) Ver que los accesos rechazados de FB1 y FB2 aparecen como «Acceso rechazado».

**Puerta de salida.** Checklist común + HU-M09-02 y 03 completas + dos criterios de interfaz
cerrados. HU-M09-01 es del servidor; se comprueba viendo sus eventos en esta pantalla.

---

### FB5 — M06 Trazabilidad del proceso

**Objetivo.** Agrupar ingresos en lotes, decidir la ruta, registrar el paso por las etapas desde el
teléfono, dividir, asociar bigbags y cerrar con destino; ver la trazabilidad de un ingreso.

**Pasos.**

| N.° | Paso | HU · CA / RNF | Verificación |
|---|---|---|---|
| 5.1 | Modelos `lote`, `lote-fila`, `composicion`, `parte`, `paso`, `siguiente`, `resumen-cierre`, `trazabilidad`, `ruta`, `etapa` | Contrato §5 | — |
| 5.2 | `trazabilidad/data-access/`: lotes con todas sus acciones, `etapas` y `rutas` en caché de sesión | — | Pruebas del servicio |
| 5.3 | `LotesPage`: filtros estado, mineral y fechas; abrir lote (Gestión) | HU-M06-01 CA01–CA03 | Nombre repetido; apertura futura |
| 5.4 | `LoteDetallePage`: estado, composición por mineral con tardíos, «Otro mineral» y su autorización señalados; totales; partes con toneladas **estimadas**; recorrido con `recorrido-etapas`; bigbags | HU-M06-01 CA16, HU-M06-04 CA08; RNF-M06-09 | Lote simple, dividido y con tardío |
| 5.5 | Composición (Gestión): agregar y quitar mineral, asignar desde `GET lotes/{id}/ingresos/` con «Agregar de otro tipo de mineral» y autorización, retirar, iniciar recorrido | HU-M06-01 CA04–CA15, CA17–CA23 | Asignar En proceso, anulado, sin selección, de otro mineral sin autorización |
| 5.6 | **Siguiente paso** construido solo con `siguientes`: un botón por carga con su etapa; si `elegir_ruta`, selector de ruta; fecha/hora con «ahora» por defecto; horas de molino en molienda (muestra t/h); bigbags en ensacado; en tres toques desde el detalle | HU-M06-02 CA01–CA13, CA15; RNF-M06-06, RNF-M06-07 | Secado → elegir ruta → zarandeo → ensacado con bigbags, en teléfono |
| 5.7 | Secado propio de un tardío con reparto por partes | HU-M06-02 CA14, HU-M06-04 CA09 | Tardío en lote dividido |
| 5.8 | Dividir: 2 a 6 partes, suma de fracciones en vivo y cuánto falta | HU-M06-04 CA01–CA07, CA10; RNF-M06-10 | Fracciones que no suman; siete partes; nombres repetidos |
| 5.9 | `CierreLotesPage` (Administrador) y `CerrarLotePage`: resumen con diferencia como estimación, destino, observación, confirmación | HU-M06-05 | Cerrar con pendientes; sin destino; lote cerrado |
| 5.10 | Pestaña **Trazabilidad** del detalle del ingreso: lote, estado, ruta por línea, etapas completadas con fecha y responsable, «x de y», proceso completo, destino y cierre; mensaje «espera en cancha» | HU-M06-03; HU-M07-01 CA10–CA11 | Ingreso sin lote, en lote dividido, en lote cerrado, anulado |

**Guion de revisión.**

1. Administrativo: abrir «Lote prueba» de un mineral; asignar dos ingresos Registrados; intentar uno
   En proceso (mensaje literal); agregar uno de otro mineral sin y con autorización.
2. Iniciar el recorrido. **Supervisor, en teléfono:** desde el detalle, registrar Secado en tres
   toques; el siguiente paso pide la ruta; elegir «Zarandeado y molido»; registrar Zarandeo con una
   fecha anterior al secado (mensaje literal) y luego con la correcta.
3. Administrativo: dividir otro lote en dos partes con fracciones que suman 0,9 (la pantalla avisa
   antes de enviar) y luego 1.
4. Registrar Molienda con 0 horas (rechazo) y con horas válidas (muestra t/h); Ensacado con bigbags.
5. Administrador: Cierre de lotes → el lote aparece listo; el resumen muestra la diferencia como
   estimación; cerrar sin destino (rechazo) y con destino.
6. Abrir un ingreso del lote → pestaña Trazabilidad: etapas con fecha y responsable, proporción,
   destino y fecha de cierre.
7. Supervisor: no ve Abrir lote, Asignar, Dividir ni Cerrar.

**Riesgos.** La lógica de «qué sigue» es compleja (huecos, partes, tardíos): el cliente **no** la
calcula, solo pinta `siguientes`. Si la interfaz necesita algo que `siguientes` no trae, se pide al
backend; no se deduce.

**Puerta de salida.** Checklist común + HU-M06-01 a 05 completas + paso de etapa en ≤ 3 toques
comprobado en teléfono real.

---

### FB6 — M07 Consulta de ingresos y respaldo

**Objetivo.** Encontrar cualquier ingreso y su ticket en pocos segundos, ver el día y el mes, y saber
qué está pendiente.

**Pasos.**

| N.° | Paso | HU · CA / RNF | Verificación |
|---|---|---|---|
| 6.1 | Modelos `fila-ingreso`, `totales`, `detalle-ingreso`, `calendario`, `inicio`, `aviso`, `resultado-cabecera` | Contrato §6 | — |
| 6.2 | `consulta/data-access/`: `buscar`, `listar`, `exportar`, `detalle`, `ticket`, `calendario`, `cabecera`, `inicio`, `avisos` | — | Pruebas: la búsqueda envía la clave `placa` aunque esté vacía |
| 6.3 | `ConsultaPlacaFechaPage`: placa parcial, fecha o rango; resultados del más reciente al más antiguo con anulado (y motivo), En proceso (neto «pendiente del destare») y sin respaldo señalados; al elegir uno, ticket ampliable junto a los datos | HU-M07-01; **CA03 (Interfaz)**; RNF-M07-04 | Sin criterios; rango inverso; sin resultados; ingreso sin foto; respaldo no disponible |
| 6.4 | `ListadoIngresosPage`: filtros, totales del conjunto, paginación, exportar (Gestión) con el nombre del servidor | HU-M07-02 CA01–CA03, CA07–CA11, CA13–CA15 | Exportar vacío; abrir el CSV en Excel con acentos correctos |
| 6.5 | Detalle completo: se reutiliza el de FB3–FB5; se verifica que un bloque ausente muestra su `mensaje` | HU-M07-02 CA04–CA06 | Ingreso sin reconocimiento ni validaciones |
| 6.6 | Búsqueda de la cabecera: código completo o dígitos finales → detalle; otro texto → consulta con esa placa | HU-M07-02 CA16–CA17 | `00012`, código completo, `ABC` |
| 6.7 | `CalendarioPage`: cuadrícula del mes con ingresos y toneladas como texto, marcas de En proceso y anulados con icono, navegación de meses, lista del día y su `mensaje` | HU-M07-03; RNF-M07-11 | Día sin llegadas; mes anterior; comparar con el consolidado (FB7) |
| 6.8 | `InicioPage` completa: cuatro cifras con `enlace` (o sin él), últimos 5, barras de 7 días en CSS, acceso a la consulta | HU-M07-04 CA01–CA05, CA11; RNF-M07-07 | Día sin ingresos; Supervisor sin enlace a consolidación |
| 6.9 | Campana de avisos: contador, panel, un paso a la pantalla de cada aviso; recarga al volver a la pestaña y tras cada registro propio | HU-M07-04 CA06–CA10; RNF-M07-16 | Aviso de destare desaparece tras destarar |

**Guion de revisión.**

1. Desde el inicio, consultar por la placa de un ingreso de hoy (T03): el resultado se abre con el
   ticket al lado; ampliarlo. Medir el tiempo.
2. Consultar sin criterios, con rango inverso y sin resultados: mensajes literales.
3. Listado: filtrar por mineral y estado; los totales no suman anulados ni En proceso; exportar como
   Administrativo; el Supervisor no ve «Exportar».
4. Cabecera: escribir los dígitos finales de un código → detalle; escribir una placa → consulta.
5. Calendario: un día con anulados y otro con En proceso se distinguen sin depender del color; elegir
   un día; ir al mes anterior.
6. Inicio de cada rol: las cifras sin permiso no tienen enlace; campana: el Supervisor no ve «listo
   para cerrar» ni «sin lote».
7. Registrar un destare pendiente y volver a abrir la campana: el aviso desapareció.

**Puerta de salida.** Checklist común + HU-M07-01 a 04 completas + HU-M07-01 CA03 cerrado + T03
cronometrada.

---

### FB7 — M08 Consolidación de la producción

**Objetivo.** Obtener y exportar el total acumulado del mes por tipo de mineral (T05, T06).

**Pasos.**

| N.° | Paso | HU · CA / RNF | Verificación |
|---|---|---|---|
| 7.1 | Modelo `consolidado` | Contrato §7 | — |
| 7.2 | `consolidacion/data-access/`: `mensual(anio, mes)`, `exportar(anio, mes)` | — | Pruebas |
| 7.3 | `shared/components/selector-periodo` (compartido con el calendario): mes y año, sin periodos futuros | HU-M08-01 CA04 | Elegir el mes siguiente |
| 7.4 | `ConsolidacionPage`: tabla por mineral (ingresos, toneladas, participación), total, `en_proceso_mensaje`, anulados excluidos, `al_corte`, `mensaje` sin ingresos | HU-M08-01 | Mes en curso; mes vacío |
| 7.5 | Exportar XLSX con el nombre del servidor; error en blob traducido | HU-M08-02; RNF-M08-02 | Exportar un mes vacío |
| 7.6 | Comprobación cruzada: total del mes en pantalla = calendario del mes = archivo exportado | HU-M07-03 CA08, HU-M08-02 CA03; RNF-M08-05 | Tres cifras iguales |

**Guion de revisión.** (1) Administrativo: consolidar el mes en curso (T05) y leer «al corte de
hoy». (2) Exportar (T06), abrir el archivo y comparar cada fila con la pantalla. (3) Comparar el total
con el resumen del calendario del mismo mes. (4) Mes futuro y mes sin ingresos: mensajes literales.
(5) Supervisor: sin entrada de menú; ruta forzada → «Acción no autorizada».

**Puerta de salida.** Checklist común + HU-M08-01 y 02 completas + T05 y T06 cronometradas + cifras
cruzadas iguales.

---

### FB8 — Estabilización

**Objetivo.** Sistema completo, sin defectos críticos ni altos, congelado junto con el backend.

| N.° | Paso | Verificación |
|---|---|---|
| 8.1 | Regresión completa: guiones de revisión de FB1 a FB7 seguidos, con las tres cuentas, sobre datos recién cargados | Cero defectos críticos o altos abiertos |
| 8.2 | Todos los criterios de `verificacion-criterios.md` en ✅ | Tabla completa |
| 8.3 | Tareas T01 a T06 ejecutadas sin asistencia por una persona que no participó en el desarrollo | Tareas completadas y tiempos anotados |
| 8.4 | Accesibilidad básica: contraste AA, foco visible, etiquetas en todos los controles, navegación por teclado en escritorio | Lighthouse ≥ 90 en Accesibilidad en inicio, registro y detalle |
| 8.5 | Rendimiento: bundle inicial < 500 kB; carga en 4G simulado < 3 s; registro con imagen de 5 MB < 8 s hasta la revisión (RNF-M03-02) | Lighthouse y cronometraje |
| 8.6 | Navegadores: Chrome Android, Safari iOS, Chrome y Edge de escritorio | Recorrido de humo en cada uno |
| 8.7 | Preproducción: `environment.preproduction.ts` con el dominio real; CORS del backend con el origen; humo contra preproducción | Humo en verde |
| 8.8 | Congelamiento: etiqueta `v1.0.0` en el frontend y `FB8-aprobada`, el mismo día que el backend congela motor y reglas (D-16) | Etiquetas en los dos repositorios |

**Puerta de salida.** Todas las puertas anteriores reconfirmadas, más el acta de pruebas del
backend firmada con los criterios de interfaz incluidos.

---

### FB9 — Despliegue para la presentación

| N.° | Paso | Verificación |
|---|---|---|
| 9.1 | Elegir cómo se sirven los estáticos: el Nginx del backend en el mismo dominio (habilita cookies `HttpOnly`, revisa D-F02) o un alojamiento de estáticos aparte | Decisión D-F registrada |
| 9.2 | `environment.ts` de producción con el dominio real; HTTPS; caché larga para los archivos con hash y sin caché para `index.html` | Cabeceras verificadas |
| 9.3 | Reescritura de rutas al `index.html` para que `/consulta/ingresos/12` abra directo | Recargar una ruta profunda |
| 9.4 | Humo en el servidor: sesión de cada rol, registro de un ingreso con foto, consulta y consolidado | Humo en verde |
| 9.5 | Bitácora de despliegues iniciada | Fila con la versión desplegada |

**Puerta de salida.** Humo en verde en el servidor de la presentación. El sistema no entra en
operación real en planta hasta que termine el pretest (marco de tesis §11).

---

## 7. Reglas de trabajo durante toda la implementación

1. **Una historia, un commit; una fase, un PR**, con el formato `M0n: descripcion (HU-M0n-0m)` del
   backend. Las fases sin historia (FB0, FB8, FB9) usan `chore(FBn): …`.
2. **El servidor manda.** Ninguna regla vive solo en Angular; toda opción oculta tiene su 403 en el
   backend. Si la interfaz necesita un dato que el servidor no da, se pide al backend, no se deduce.
3. **Los mensajes son contrato.** El cliente no escribe ningún texto de error ni de éxito del
   dominio: los muestra tal como llegan.
4. **Nada se elimina.** Ningún servicio expone `eliminar()`.
5. **Un feature no importa de otro.** Lo compartido sube a `shared/` o `models/`.
6. **Las decisiones nuevas se registran antes de fusionar**, en `docs/decisiones.md`.
7. **Si el backend cambia un serializer**, primero se actualiza `contrato-api.md`, después `models/`.
8. **Etiquetas en las dos puntas.** Al cerrar un par de módulos, `git tag M0n-cerrado` en los dos
   repositorios el mismo día (guía del frontend del backend, §7).

## 8. Riesgos transversales

| N.° | Riesgo | Mitigación |
|---|---|---|
| R1 | La rama del backend con F3–F7 sin commit cambia bajo el frontend | Pedir commit y PR antes de FB3; fijar en la bitácora el commit del backend contra el que se revisó cada puerta |
| R2 | Formas de respuesta no declaradas en el esquema | `contrato-api.md` + D-F09 en FB0 |
| R3 | Node 24 fuera de la matriz de Angular 17 | Node 20 LTS en FB0 |
| R4 | El reconocimiento tarda en red móvil | Imagen reducida en el cliente; progreso visible; tiempo real medido en FB3 |
| R5 | La maqueta y la documentación difieren en un detalle | Gana la documentación; se anota en `pantallas.md` y en la bitácora |
| R6 | El tiempo de una persona en planta no alcanza para revisar en teléfono real cada fase | Mínimo obligatorio en FB3, FB5 y FB8; las demás en DevTools a 360 px |
