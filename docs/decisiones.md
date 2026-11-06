# Decisiones de implementación del frontend

**Documento:** propio de este repositorio, formato ADR-lite.
**No duplica:** `decisiones_diseno.md` del backend (decisiones D-01 a D-28) ni `decisiones_reformulacion.md` (DR-01 a DR-31). Estas son decisiones de **cómo se construye el cliente**, más finas de grano, que alguien podría cuestionar razonablemente en sustentación o en una revisión de código. Cada una tiene fecha, alternativas descartadas y la razón concreta — no la preferencia.

Numeración propia: **D-F01** en adelante (`F` de frontend), para no confundirlas con las D-nn del backend.

---

## D-F01. Estado con signals, sin NgRx

**Fecha:** 2026-09 (esqueleto inicial)
**Alternativas descartadas:** NgRx, NgXs, un servicio de estado global hecho a mano.

Nueve módulos, siete features, un equipo reducido. NgRx aporta trazabilidad de acciones y time-travel debugging, que rinden en equipos grandes con estado compartido complejo entre muchas pantallas. Aquí cada página tiene su propio estado local (una lista, un formulario, un contador de pendientes) y casi nada se comparte entre features — de hecho, un feature no debe importar de otro (ver `frontend-feature-nuevo`).

Una infraestructura de estado global sin un caso real que la necesite es peor que no tenerla: en sustentación, "¿por qué NgRx?" sin una razón de dominio se defiende mal. Signals por página cubre el caso con menos código y menos conceptos que enseñar.

**Se revisa si:** aparece un estado que de verdad cruza tres o más features (por ejemplo, un contador de notificaciones global visible en toda la app). Hasta entonces, un signal en `core/services/` para ese caso puntual basta; no justifica una librería.

## D-F02. Refresh token en `localStorage`, access token en memoria

**Fecha:** 2026-09
**Alternativa descartada:** cookies `HttpOnly`.

Documentado también en la skill `frontend-http-sesion`, pero merece registro aparte porque es la decisión de seguridad más discutible del proyecto y quien la audite debe encontrarla con su razón, no deducirla.

Una cookie `HttpOnly` es más segura contra XSS porque JavaScript no puede leerla. No se usó porque exige que backend y frontend compartan dominio (o se configure `SameSite`/CORS con credenciales de forma cuidadosa), y este proyecto desplegó backend y frontend en **repositorios y dominios separados** por decisión explícita (D-11 del backend). Forzar cookies aquí habría significado o bien un dominio compartido —contradiciendo esa decisión— o una configuración CORS con `credentials: true` que en la práctica es tan frágil como el propio `localStorage`.

*Revisión 2026-11-03:* la razón original incluía abrir la aplicación sin red con la sesión viva, que ya no es un requisito (DR-01). La decisión se mantiene por la separación de dominios. Como no hay endpoint «yo» en el backend, junto al `refresh` se guarda el usuario que devuelve el login (`id`, `username`, `nombre_completo`, `rol`, `debe_cambiar_clave`), para reconstruir el menú al recargar sin pedir otro login.

*Revisión 2026-11-03 (D-F20):* el `access` también se guarda en `localStorage`. Ver D-F20.

**Mitigación aceptada:** vida corta del access token (30 min, configurable en el backend vía `JWT_ACCESS_MINUTES`), y ningún uso de `[innerHTML]` con datos no saneados del servidor en ningún componente. Es una superficie de riesgo conocida y limitada, no una omisión.

**Se revisa si:** backend y frontend alguna vez comparten dominio (por ejemplo, el frontend servido desde el mismo host que la API mediante un reverse proxy). En ese escenario, cookies `HttpOnly` pasan a ser la opción estrictamente mejor y sin el costo de configuración actual.

## D-F03. Angular Material como única librería de componentes

**Fecha:** 2026-09
**Alternativas descartadas:** PrimeNG, componentes hechos a mano con solo CSS.

Mezclar dos librerías de componentes (p. ej. Material para tablas y PrimeNG para un date-picker que Material no trae bien) duplica el peso del bundle inicial — cada librería trae su propio sistema de theming y sus propias dependencias de CDK/utilidades. El presupuesto de bundle está fijado en 500 kB de aviso / 1 MB de error precisamente porque el sistema debe cargar en un teléfono con conectividad intermitente en planta (ver `entorno.md` §5).

Si un componente que Material no cubre bien aparece (por ejemplo, un selector de fecha con reglas de negocio específicas), la solución es construirlo a mano sobre primitivas HTML + CDK de Angular Material (que ya está instalado), no traer una segunda librería completa por un solo widget.

**Se revisa si:** aparece una necesidad de UI que Angular Material genuinamente no puede resolver ni extender razonablemente (poco probable dado el alcance de 27 historias, ninguna de las cuales pide un dashboard con gráficos).

## D-F04. Sin librería de gráficos

**Fecha:** 2026-09

Ninguna de las historias de usuario documentadas pide un dashboard o una visualización de series de tiempo. Instalar `ngx-charts`, Chart.js o similar "por si acaso" es peso muerto en el bundle que nunca se usa, y una superficie más que mantener actualizada.

*Revisión 2026-11-03:* las dos visualizaciones del alcance vigente —las toneladas de los últimos siete días del inicio (HU-M07-04) y el calendario de llegadas (HU-M07-03)— se resuelven con barras y una cuadrícula en CSS, con la cifra siempre escrita como texto (RNF-M07-11). No justifican una librería.

**Se revisa si:** una historia futura (o un cambio de alcance aprobado) pide explícitamente un gráfico. En ese momento se evalúa la librería más liviana que cubra ese caso puntual, no una general.

## D-F05. Sin SSR (Server-Side Rendering)

**Fecha:** 2026-09 (`--ssr=false` al generar el proyecto)

SSR resuelve el tiempo de primera pintura y la indexación por buscadores, y exige un servidor Node en cada petición. El sistema no tiene páginas públicas —todo está detrás del inicio de sesión— y se despliega como estáticos separados de la API (D-11 del backend), así que SSR añadiría un proceso más que operar sin resolver ningún problema que el proyecto tenga.

*Revisión 2026-11-03:* la razón original citaba la captura sin conexión de M07, que salió del alcance con la reformulación (DR-01). La decisión se mantiene por la razón de arriba.

**Se revisa si:** el alcance de la tesis cambiara para incluir una vitrina pública indexable por buscadores, cosa que no está en ninguna historia actual.

## D-F06. Sin monorepo (Nx u otra herramienta)

**Fecha:** 2026-09

Un monorepo con librerías compartidas rinde cuando hay varias aplicaciones (por ejemplo, una app de escritorio y una web) o varios equipos trabajando en paralelo sobre código compartido. Aquí hay una sola aplicación y un desarrollador. La estructura de `frontend/` con `core/`, `shared/` y `features/` ya resuelve la separación de responsabilidades sin la complejidad de configuración adicional (build targets, cache distribuido) que Nx introduce.

**Se revisa si:** el proyecto creciera para incluir una segunda aplicación real (por ejemplo, un panel administrativo separado de la app de planta) que comparta un volumen significativo de código con esta.

---

# Decisiones de la realineación con el backend terminado (2026-11-03)

Tomadas al formular [`plan-implementacion.md`](plan-implementacion.md), cuando el backend cerró F0 a
F7 y se comprobó que el esqueleto del frontend respondía al alcance anterior de la tesis.

## D-F07. Sin PWA ni service worker

**Fecha:** 2026-11-03 · **Fase:** FB0
**Alternativa descartada:** conservar `@angular/pwa` «por si acaso».

La captura sin conexión con cola de sincronización salió del alcance (DR-01; marco de tesis §10:
«operación sin señal de red, salvo la conservación del borrador»), y la guía del frontend del
backend dice expresamente que no se agrega `@angular/pwa`. Un service worker que nadie necesita no
es inocuo: cachea `index.html` y los bundles, y en planta provoca que un teléfono siga ejecutando una
versión vieja después de un despliegue, que es exactamente el cambio no controlado que ARQ-02 §7
quiere evitar durante la operación.

Se retiran `provideServiceWorker`, `ngsw-config.json`, `manifest.webmanifest`, la opción
`serviceWorker` de `angular.json` y la dependencia `@angular/service-worker`.

**Se revisa si:** el alcance vuelve a incluir operación sin señal.

## D-F08. Estructura de `features/` de la guía del backend

**Fecha:** 2026-11-03 · **Fase:** FB0

Siete features: `auth` (M01), `catalogo` (M02), `ingresos` (M03 con M04 y M05), `trazabilidad`
(M06), `consulta` (M07), `consolidacion` (M08) y `auditoria` (M09), según
`GUIA_FRONTEND_ANGULAR.md` §3. M04 y M05 no tienen feature: sus pantallas son parte del mismo flujo
de registro, y separarlas obligaría a M03 a orquestar tres pantallas para una operación que el
usuario percibe como una.

El **detalle del ingreso** vive en `consulta` porque el listado y el detalle son de M07 (D-19 del
backend) y su endpoint compone todos los bloques en una sola respuesta (RNF-M07-02). Las acciones
que modifican el ingreso (corregir, revertir, anular) son páginas de `ingresos` a las que el detalle
navega: así ningún feature importa a otro.

## D-F09. Modelos escritos a mano; esquema del backend completado

**Fecha:** 2026-11-03 · **Fase:** FB0 (paso 0.14, cambio en el backend)
**Alternativas descartadas:** generar el cliente desde el OpenAPI (`openapi-generator`,
`ng-openapi-gen`); escribir los modelos sin tocar el esquema.

El esquema actual declara `object` en todas las `APIView` de M06, M07 y M08, y el cuerpo de las
acciones de `ingresos/` y `lotes/` como el serializer del recurso, no el real. Un cliente generado
desde ahí estaría lleno de `any` y nombres como `Estado76bEnum`. Los modelos se escriben a mano,
espejo de [`contrato-api.md`](contrato-api.md), que es su fuente.

Aun así el esquema es el contrato entre repositorios (guía del frontend, §7), y uno incompleto deja
que un cambio de serializer se descubra en la pantalla. Por eso, en FB0, el backend recibe un cambio
sin lógica: `@extend_schema` con serializers de documentación en esas vistas, la extensión de esquema
para `AutenticacionJWT` y `ENUM_NAME_OVERRIDES`.

**Se revisa si:** el esquema queda completo y estable; entonces puede generarse al menos la capa de
modelos y compararse con la escrita a mano.

## D-F10. La documentación del backend se lee desde el repositorio vecino

**Fecha:** 2026-11-03

Los dos repositorios se clonan lado a lado (`TesisConsmin/LogisticaMinera` y
`TesisConsmin/LogisticaMineraFront`). Las skills y los documentos de este repositorio citan la
documentación del backend con la ruta relativa `../LogisticaMinera/docs/…` y nunca la copian (D-11
del backend: dos copias de una historia divergen).

## D-F11. Pruebas unitarias y revisión manual guiada; sin e2e automatizados

**Fecha:** 2026-11-03
**Alternativas descartadas:** Cypress, Playwright.

Las reglas viven en el servidor y ya tienen 524 pruebas y 858 aserciones de contrato. Lo que el
cliente añade es presentación y flujo. Se prueban con Karma y Jasmine (ya instalados) los servicios
de `data-access/` con `HttpTestingController`, los interceptores y los componentes de `ui/` con
lógica. Los criterios de interfaz y los flujos se verifican con el guion de revisión de cada fase,
que el supervisor ejecuta en la puerta.

Un juego e2e costaría mantener datos sembrados, selectores y un navegador en CI, para cubrir sobre
todo lo que ya cubren Postman y la revisión guiada.

**Se revisa si:** la regresión manual de FB8 encuentra defectos que una prueba e2e habría
detectado antes, o el sistema sigue evolucionando después de la tesis.

## D-F12. Se construye contra la rama del backend con F3 a F7

**Fecha:** 2026-11-03

El código de F3 a F7 está en `feature/M03-registro-ingresos`, sin commit a la fecha. El frontend se
construye contra esa rama, y cada fila de la bitácora anota el commit del backend contra el que se
revisó la puerta. Antes de FB3 se pide al backend el commit y el PR de esas fases (riesgo R1).

## D-F13. Las rutas del cliente son las que fabrica el servidor

**Fecha:** 2026-11-03

El inicio y los avisos de M07 devuelven enlaces del cliente (`/ingresos/destares`,
`/consulta/calendario`, `/consulta/ingresos/{id}`, `/lotes`, `/lotes/{id}`, `/lotes/{id}/cerrar`,
`/consolidacion`) y deciden por rol si los devuelven (HU-M07-04 CA11). El enrutador usa exactamente
esas rutas; donde la maqueta usaba otras (`#/destare`, `#/altas`), gana el servidor. Renombrar una
ruta del cliente sin cambiar el backend rompe un aviso en silencio.

## D-F14. La imagen del ticket se carga como `Blob` autenticado

**Fecha:** 2026-11-03

La imagen solo se entrega con sesión (RNF-M03-11, RNF-M07-05) y un `<img src>` no envía la cabecera
`Authorization`. `shared/components/visor-imagen-protegida` la pide con `HttpClient`
(`responseType: 'blob'`), la muestra con `URL.createObjectURL` y revoca la URL al destruirse. Lo
mismo para las descargas del listado y del consolidado, cuyo error llega como JSON dentro del `Blob`
y se traduce al cuerpo uniforme.

Descartado: un token en la URL de la imagen (queda en historiales y registros del servidor) o pedir
al backend una ruta pública firmada (contradice RNF-M03-11 tal como está escrito).

## D-F15. El borrador del registro vive en IndexedDB

**Fecha:** 2026-11-03 · **Fase:** FB3
**Alternativa descartada:** `localStorage`, como sugiere el boceto de la guía del frontend §5.3.

RNF-M03-05 exige conservar **la imagen y los campos editados** y reanudar sin volver a fotografiar.
`localStorage` solo guarda texto: la imagen tendría que ir en base64 (un tercio más pesada) dentro de
un límite de unos 5 MB por origen, compartido con la sesión. IndexedDB guarda el `Blob` de la imagen
reducida tal cual y no tiene ese límite práctico. Se usa con `idb` (ya instalado, ~1 kB).

El borrador guarda: la imagen reducida (solo hasta que el servidor devuelve el token, porque desde
entonces la imagen ya está en el servidor dentro del borrador firmado, D-25), el token, la respuesta
del borrador, los campos editados, las justificaciones, el paso y el momento. Se descarta al
confirmar, al recibir el 409 de borrador ya registrado, y al cerrar sesión si pertenece a otro
usuario. Nunca se reenvía solo: el usuario confirma (guía §5.3).

## D-F16. Catálogos en memoria durante la sesión

**Fecha:** 2026-11-03 · **Fase:** FB2

RNF-M02-02 pide conservar los catálogos en el cliente y recargarlos solo al detectar un cambio. El
backend no ofrece un indicador de cambio, así que el servicio de cada catálogo guarda la lista
completa en un `signal` y la invalida: en cada escritura propia, al volver a la pantalla del catálogo
y con el botón «Actualizar». Un tipo de mineral creado por otro usuario aparece, a más tardar, al
recargar la página. Es suficiente para un catálogo que cambia pocas veces al mes.

## D-F17. Decimales como cadena y fechas en la zona de Lima

**Fecha:** 2026-11-03

Las toneladas llegan como cadena (`"12.50"`) y así se tipan en `models/`: convertirlas a `number` al
recibirlas introduce errores de coma flotante en sumas que el servidor ya hace exactas. El cliente
solo convierte para mostrar (pipe `toneladas`) o para una vista previa que no se envía (la suma de
fracciones al dividir). Se envían como cadena con punto decimal.

Las fechas se muestran siempre en `America/Lima` con el formato de la maqueta (`dd/mm/aaaa hh:mm`),
sin depender de la zona horaria del teléfono.

## D-F18. Tema de Material con los tokens de la maqueta

**Fecha:** 2026-11-03 · **Fase:** FB0

La maqueta define su identidad con variables CSS (fuente Barlow; `--gold` y `--accent` como color de
acción; `--sidebar` oscuro; `--green`, `--orange`, `--red`, `--blue` para los estados). El tema de
Angular Material se construye con esa paleta y las variables se copian a `styles.scss` para lo que
Material no cubre (insignias de estado, marca sin respaldo, calendario). Barlow se carga desde Google
Fonts con `display=swap`, solo los pesos 400, 500, 600 y 700.

## D-F19. Revalidación solo al confirmar

**Fecha:** 2026-11-03 · **Fase:** FB3

El backend valida V1 a V5 al crear el borrador y al confirmar; no ofrece un endpoint para revalidar
mientras el usuario corrige. Inventar uno, o replicar las cinco reglas en el cliente, contradice D-08
del backend. La revisión muestra las inconsistencias de la propuesta; cuando el usuario cambia un
dato señalado, la alerta se marca «por revalidar» y se resuelve con la respuesta de la confirmación.
El cliente solo **anticipa** V2 (tara ≥ bruto) y V5 (fecha posterior a hoy) como ayuda visual, porque
tiene a mano todos sus datos, y nunca bloquea por ellas.

**Se revisa si:** la revisión de FB3 muestra que el usuario confirma varias veces seguidas para
descubrir inconsistencias; entonces se pide al backend una revalidación del borrador.

---

# Decisiones de la construcción de FB0 a FB2 (2026-11-03)

## D-F20. El `access` es la ventana de inactividad: se renueva por actividad, nunca ante un 401

**Fecha:** 2026-11-03 · **Fase:** FB0
**Alternativa descartada:** el patrón habitual de «ante un 401, pedir un refresh y reintentar».

`backend/apps/accounts/autenticacion.py` usa la vida del `access` (`JWT_ACCESS_MINUTES`) como la
ventana de inactividad de HU-M01-01 CA06: un token vencido responde 401 `SESION_EXPIRADA` con el
mensaje literal «Su sesión ha expirado. Ingrese nuevamente». Si el cliente renovara ante ese 401,
con un `refresh` de siete días la sesión nunca expiraría y el criterio no se cumpliría.

Por eso el cliente renueva **antes** de que venza y **solo** si el usuario trabajó en los últimos
cinco minutos (`core/sesion/politica-renovacion.ts`, una función pura con sus pruebas). Lo revisa
el interceptor antes de cada petición y un temporizador cada minuto, para quien llena un formulario
largo sin hacer peticiones. Varias peticiones comparten una sola renovación. La actividad son los
eventos `pointerdown`, `keydown` y `touchstart` del documento.

Consecuencia sobre D-F02: el `access` también se guarda en `localStorage`. Si solo viviera en
memoria, al recargar no habría token que enviar y el servidor respondería «Credenciales inválidas
o ausentes» en lugar del mensaje de sesión expirada. No aumenta la superficie de riesgo: el
`refresh`, más poderoso, ya estaba ahí.

Verificado contra el backend: con la pestaña inactiva más de 30 minutos, la siguiente acción llevó
al inicio de sesión con el mensaje literal.

## D-F21. Material se configura en las rutas diferidas; el snackbar se carga en diferido

**Fecha:** 2026-11-03 · **Fase:** FB0

Con los tokens de Material en `app.config.ts` y el interceptor de errores dependiendo del snackbar,
el bundle inicial medía 826 kB (presupuesto: aviso a 500 kB). Importar
`MAT_FORM_FIELD_DEFAULT_OPTIONS` o `MatPaginatorIntl` desde el arranque arrastra form-field, select
y paginator a un trozo compartido que pasa a ser inicial.

- `core/layout/provide-interfaz.ts` declara esos tokens en las rutas diferidas (`login.routes.ts`
  y `rutas-con-sesion.routes.ts`). `DialogosService` se vuelve a proveer ahí y abre los diálogos con
  ese inyector, para que sus campos tengan la misma apariencia.
- `NotificacionService` importa el snackbar con `import()` la primera vez que se usa.
- El armazón y el inicio de sesión se cargan en diferido; el arranque solo trae los guards.
- `styles.scss` incluye los temas de los componentes usados, no `all-component-themes`.

Resultado: **367 kB** iniciales (100 kB transferidos). El CI trata el aviso de presupuesto como
falla.

## D-F22. Los límites entre capas los hace cumplir ESLint

**Fecha:** 2026-11-03 · **Fase:** FB0

Las reglas de la estructura (README §Reglas) se verifican en cada PR, no en la revisión manual:

| Regla | Mecanismo |
|---|---|
| Un feature no importa de otro | `import/no-restricted-paths` con una zona por feature |
| `core/` y `shared/` no dependen de features; `models/` de nada | `import/no-restricted-paths` |
| Solo `data-access/` y el núcleo usan `HttpClient` | `no-restricted-imports` de `@angular/common/http` en `pages/`, `ui/` y `shared/` |
| Todo componente es `OnPush` | `@angular-eslint/prefer-on-push-component-change-detection` |
| Sin `any` | `@typescript-eslint/no-explicit-any` |

Se descartó `no-restricted-imports` con patrones relativos para los features: no distingue
`../../data-access` del mismo feature de uno vecino. `no-restricted-paths` resuelve la ruta real.

## D-F23. El cliente no adelanta una regla que el servidor responde con un mensaje literal

**Fecha:** 2026-11-03 · **Fase:** FB1

Si el formulario valida antes una regla que tiene criterio con mensaje propio, el usuario nunca ve
ese mensaje y el criterio queda sin verificar en la interfaz. Por eso no hay validadores de cliente
para: longitud mínima y coincidencia de la contraseña (HU-M01-02 CA07, CA11), formato de placa
(HU-M02-01 CA03, D-24), transportista de un externo (CA04), motivo del cambio de tara (CA10),
código y nombre del tipo de mineral (HU-M02-02 CA05, CA06, CA08), RUC (HU-M02-03 CA02). El cliente
sí valida lo que no tiene mensaje de criterio: campos requeridos genéricos y el formato decimal.
Desactivar la propia cuenta tampoco se oculta: lo rechaza el servidor (HU-M01-02 CA09).

## D-F24. Guards y menú por permiso, no por rol

**Fecha:** 2026-11-03 · **Fase:** FB1

Las rutas usan `permisoGuard('GESTIONAR_CATALOGO')`, no listas de roles. La correspondencia permiso →
roles es una sola tabla, `core/autorizacion/permisos.ts`, que lee `permissions.py`: de ella salen el
menú de cada rol, los guards, los botones condicionados (`*appSiPuede`) y la pantalla de Permisos.
Si el backend cambia un permiso, se cambia una línea.

## D-F25. Formularios presentacionales y diálogos que reciben qué guardar

**Fecha:** 2026-11-03 · **Fase:** FB1

Los formularios (`formulario-vehiculo`, `formulario-usuario`…) solo reciben datos y emiten el valor.
Los diálogos extienden `DialogoEnvioBase`, que recibe de la página una función `guardar` y se
encarga del envío, del error literal y del cierre; no inyectan servicios. Así el mismo formulario
de vehículo sirve en el catálogo (FB2) y en el alta desde el registro (FB3), y cada pieza se prueba
sin `HttpTestingController`.

Las pantallas de catálogo comparten `PaginaCatalogoBase` (baja, reactivación, inactivos, diálogos)
y todas las listas el marco `app-marco-listado` y el estado `ListadoPaginado`.

---

# Decisiones de la construcción de FB3 (2026-11-03)

## D-F26. Los datos de referencia viven en `core/catalogo/`; los diálogos de alta, en `shared/`

**Fecha:** 2026-11-03 · **Fase:** FB3
**Alternativa descartada:** que el registro importe los servicios de `features/catalogo/`.

El registro de un ingreso necesita listar tipos de mineral y dar de alta un vehículo o un tipo de
mineral; los lotes (FB5) y los filtros de consulta (FB6) necesitarán lo mismo. La regla «un feature
no importa de otro» (D-F22) lo impide, y duplicar las llamadas en cada feature repetiría las URL y
la caché. Los tres servicios del catálogo y su clase base `RecursoCatalogoApi` son singletons con
una caché en memoria (D-F16): pasan a `core/catalogo/`. El feature `catalogo` conserva sus páginas
y componentes de presentación, y sus diálogos de vehículo y tipo de mineral suben a
`shared/dialogos/` porque el registro los reutiliza.

## D-F27. El registro tiene un almacén de estado por visita, sin librería

**Fecha:** 2026-11-03 · **Fase:** FB3

`RegistroIngresoStore` (provisto a nivel de la página, así cada visita empieza limpia) concentra el
estado del flujo captura → revisión → confirmación y todas sus transiciones, con signals. La página
solo une el formulario con el almacén y abre los diálogos; los componentes de `ui/` solo pintan.
Es la separación que permite probar el flujo completo —reintento sin red, recuperación del
borrador, rechazos, consulta del vehículo con espera— sin tocar el DOM (30 pruebas del almacén).
Descartado: NgRx (D-F01); poner el estado en la página, que la haría imposible de probar aparte.

## D-F28. Dónde se guarda el borrador, y qué contiene

**Fecha:** 2026-11-03 · **Fase:** FB3 · Precisa D-F15

El servicio vive en `features/ingresos/data-access/` (es acceso a un almacén de datos, y solo el
registro lo usa), no en `core/`. Guarda la imagen reducida **hasta confirmar**, y no solo hasta
recibir el token como decía D-F15: la revisión necesita mostrarla al recuperar el borrador. Lleva el
`usuarioId`; al abrir la pantalla, el borrador de otro usuario se descarta. Un fallo de
IndexedDB (modo privado, cuota) nunca interrumpe el registro.

## D-F29. Un `effect` no debe ser el único responsable de que algo se dibuje

**Fecha:** 2026-11-03 · **Fase:** FB3

Dos defectos reales de la misma raíz aparecieron al construir la revisión y el destare:

- Las cajas de justificación se creaban en un `effect` sobre un `FormRecord`; un componente `OnPush`
  no se entera de que se agregó un control. **Solución:** `ListaInconsistenciasComponent` escucha el
  `valueChanges` del registro (`toSignal`), que se emite al agregar un control.
- `*appSiPuede` creaba su vista dentro de un `effect`, fuera de una pasada de detección de
  cambios: el texto estático se veía, pero `mat-icon` no ejecutaba su inicialización y los iconos
  salían como texto. **Solución:** `createEmbeddedView(...).detectChanges()`, con su prueba de
  regresión (falla sin la corrección).

Cuando el estado cabe en un `signal` (las justificaciones del destare), se usa un `signal`, no un
`FormRecord` mutado desde un `effect`.

## D-F30. Sin validadores de «obligatorio» en la revisión

**Fecha:** 2026-11-03 · **Fase:** FB3 · Aplica D-F23

El formulario de revisión no marca campos requeridos: el servidor reclama los ausentes con su mensaje
literal y su lista en `detalles.campos` (HU-M03-01 CA03), que se pinta sobre cada campo. Solo se
cuida el formato decimal del peso, que no tiene criterio con mensaje propio. Consecuencia: «Confirmar»
siempre está habilitado, salvo mientras se envía. Un caso distinto es `PLACA_NO_REGISTRADA`, que
también trae `detalles.campos: ["placa"]` pero no es un campo ausente: ahí se muestra el mensaje
literal, no «Campo obligatorio».

## D-F31. La coma decimal se normaliza antes de enviar

**Fecha:** 2026-11-03 · **Fase:** FB3

El teclado numérico de un teléfono en español escribe `40,00`. El validador la acepta y **todo
valor decimal se normaliza con `normalizarDecimal` justo antes de enviarse** (peso del registro,
corrección, tara, capacidad). El defecto apareció al probar contra el backend: el servidor
rechazaba `"40,00"` con «Datos inválidos». Los pesos y las toneladas se muestran siempre con punto
(`ToneladasPipe`), como el servidor los devuelve.

## D-F32. El historial del ingreso usa los eventos del detalle; el enlace a la auditoría, el permiso

**Fecha:** 2026-11-03 · **Fase:** FB4 · Aplica D-F24

La pestaña **Historial** pinta `historial` de `GET consulta/ingresos/{id}/` —los mismos eventos, en el
mismo orden, que devuelve `GET ingresos/{id}/historial/`— y ofrece el enlace a la auditoría con
`*appSiPuede="'CONSULTAR_AUDITORIA'"`, no con el `puede_ver_auditoria` de ese otro endpoint. El
cliente **no consume** `ingresos/{id}/historial/`.

- *Alternativa descartada:* pedir `historial/` al abrir la pestaña para leer la bandera. Cuesta una
  petición más por cada apertura y rompe RNF-M07-02 (el detalle es una sola llamada) a cambio de un
  dato que la matriz de permisos ya tiene (D-F24): `PuedeConsultarAuditoria` y
  `puede_ver_auditoria` son hoy el mismo conjunto, solo el Administrador.
- *Qué mira el criterio:* HU-M09-02 CA05 se cumple porque el enlace no se dibuja; el servidor
  rechaza la auditoría al resto con 403 de todos modos.
- *Cuándo se revisaría:* si el backend separa la bandera del permiso de la auditoría, o si el
  detalle deja de traer `historial`.

## D-F33. Las pestañas de Administración se arman fuera de los features

**Fecha:** 2026-11-03 · **Fase:** FB4 · Aplica D-F22

`/administracion` agrupa Usuarios y Permisos (M01, `features/auth/`) y Auditoría (M09,
`features/auditoria/`) bajo una misma barra de pestañas. Como un feature no importa de otro,
`auth.routes.ts` exporta `rutasAdministracion(pestanasDeOtrosFeatures)` y
`rutas-administracion.routes.ts` (junto a `rutas-con-sesion.routes.ts`, fuera de todo feature) la
llama con `AUDITORIA_ROUTES`. La lista de pestañas visible sigue en `AdministracionPage`.

- *Alternativas descartadas:* importar `auditoria` desde `auth` (rompe D-F22 y el lint lo marca);
  sacar la Auditoría de las pestañas con ruta propia (se aleja de la maqueta, que la pone junto a
  Usuarios y Permisos).
- *Cuándo se revisaría:* si otro feature aporta una pestaña a una pantalla que no le pertenece, la
  composición se repite con el mismo patrón.

## D-F34. La auditoría filtra al pulsar «Buscar», no al teclear

**Fecha:** 2026-11-03 · **Fase:** FB4

Los filtros de usuario, acción y texto se envían juntos al pulsar **Buscar** (o Intro). El filtro
`texto` busca en la referencia y dentro del JSON de valores y motivo de cada evento: es la consulta
más costosa del backend, y una por tecla sobre una tabla que solo crece no lo justifica. La
auditoría la usa un solo rol, con propósito (revisar un caso), no la exploración rápida.

- Entrar desde el historial de un ingreso abre `/administracion/auditoria?texto=<código>` y filtra
  de inmediato; el campo muestra el texto recibido.
- El detalle de un evento (antes, después, motivo, IP) se abre en un diálogo. El evento de un
  ingreso enlaza al ingreso; el de un lote, a los ingresos que afecta (`ingresos_relacionados`).
  **El enlace al lote se agrega en FB5**, cuando exista `/lotes/:id`.
- `Pagina<T>` gana un `mensaje` opcional: la auditoría lo llena con el texto del servidor cuando
  no hay resultados (HU-M09-03 CA04), y se muestra literal como estado vacío.

---

# Decisiones de la construcción de FB5 (2026-11-03)

> Numeradas desde D-F35: D-F32 a D-F34 son de FB4 (rama `feature/M09-auditoria`).

## D-F35. El cierre de lotes pide el resumen de cada fila de la página

**Fecha:** 2026-11-03 · **Fase:** FB5

`GET lotes/` no trae los pendientes de cada lote, y «Cierre de lotes» debe decir cuáles están
listos (HU-M06-05). El cliente no los deduce (riesgo de FB5 en el plan): de cada lote de la
página —25 como máximo— pide `GET lotes/{id}/resumen/` en paralelo y muestra «Listo para cerrar»,
«n pendientes» o «No disponible» si un resumen falla; un fallo no tumba la lista.

- *Alternativa descartada:* calcular «listo» en el cliente desde el detalle. Duplicaría reglas del
  servidor (D-08).
- *Cuándo se revisaría:* si hay más de unas decenas de lotes en recorrido a la vez. Entonces se
  pide al backend un conteo de pendientes en la fila de la lista; es un cambio sin lógica de
  negocio nueva.

## D-F36. Un paso se registra con `etapas/`; el secado de un tardío, con su propio endpoint

**Fecha:** 2026-11-03 · **Fase:** FB5

El «Siguiente paso» se construye solo con `siguientes` (RNF-M06-07). Cada entrada lleva `parte`,
`ingreso`, `etapa` y `elegir_ruta`, y con ellas basta para decidir la llamada:

| Entrada de `siguientes` | Llamada |
|---|---|
| `elegir_ruta: true` | `POST lotes/{id}/etapas/` con `ruta`, sin `etapa` |
| `etapa` y sin `ingreso` | `POST lotes/{id}/etapas/` con `etapa` y `parte` |
| `etapa: SECADO` con `ingreso` (tardío) | `POST lotes/{id}/ingresos/{ingreso}/secado/`, con `fracciones` si el lote está dividido |
| `etapa` con `ingreso` y `parte` | `POST lotes/{id}/etapas/` con `ingreso` y `parte` |

El diálogo de la etapa pregunta solo lo que esa etapa necesita (ruta, horas de molienda,
bigbags, reparto) y propone la fecha en «ahora»: registrar son dos toques, tres si hay que elegir
ruta (RNF-M06-06). El reparto de un tardío se propone con las fracciones de las partes y es
editable; la suma de fracciones se muestra mientras se escribe y **no bloquea** el envío
(RNF-M06-10): quien rechaza lo que no cierra la unidad es el servidor (HU-M06-04 CA04). Las
fracciones se leen con `parsearFraccion` (`1/3`, `0.5`, `0,25`) solo para mostrar la suma.

## D-F37. La pestaña Trazabilidad usa el dato del detalle; `recorrido-etapas` es solo suyo

**Fecha:** 2026-11-03 · **Fase:** FB5 · Aplica D-F32 (FB4)

`GET consulta/ingresos/{id}/` ya trae `trazabilidad` con la misma forma que
`GET ingresos/{id}/trazabilidad/`; la pestaña usa ese dato y el cliente **no consume** el segundo
endpoint (RNF-M07-02: el detalle es una sola llamada). `pantallas.md` §6 preveía
`recorrido-etapas` también para el detalle del lote, pero lo que el lote trae —`recorrido`— son
pasos ya registrados (etapa, carga, usuario), no las líneas de una ruta con etapas pendientes. El
detalle del lote tiene su propio `recorrido-lote` en `features/trazabilidad/ui/`, y
`shared/components/recorrido-etapas/` lo usa únicamente la pestaña (en `shared/` porque la
pestaña es de `consulta` y un feature no importa de otro).

## D-F38. Todo `<form (ngSubmit)>` lleva `[formGroup]`

**Fecha:** 2026-11-03 · **Fase:** FB5

Defecto encontrado al probar los diálogos de lotes: `ReactiveFormsModule` no incluye `NgForm`, así
que un `<form (ngSubmit)="…">` sin `[formGroup]` **no emite `ngSubmit`**; el clic en «Guardar»
hacía un envío nativo del navegador y recargaba la página (en Karma, desconectaba el navegador).
Regla: un formulario con `(ngSubmit)` siempre se asocia a un `FormGroup` (`[formGroup]`), aunque
tenga un solo control. Está anotada en la skill `frontend-formularios`.

---

# Decisiones de la construcción de FB6 (2026-11-03)

## D-F39. La búsqueda y los avisos de la cabecera viven en `core/consulta/`

**Fecha:** 2026-11-03 · **Fase:** FB6 · Aplica D-F22 y D-F26

La búsqueda rápida y la campana son parte del armazón, y `core/` no depende de ningún feature. Su
acceso a la API (`ConsultaCabeceraApiService`) y el estado de los avisos (`AvisosService`) están
en `core/consulta/`; sus componentes, en `core/layout/`. Lo demás de M07 (consulta, listado,
calendario, inicio) es del feature `consulta`.

Los avisos los calcula el servidor al consultarse y ya vienen filtrados por rol (HU-M07-04 CA08):
el cliente no decide qué mostrar. Se recargan al abrir la sesión, al abrir el panel, al volver a
la pestaña del navegador y **tras cada navegación**: un registro o un destare propio termina
navegando, así que el aviso desaparece sin que el armazón conozca esos flujos (RNF-M07-16). Al
destruirse el armazón (cerrar sesión) se limpian.

- *Alternativa descartada:* que cada pantalla que cambia algo avise a la campana. Acopla la
  cabecera con cada feature.
- *Cuándo se revisaría:* si la lectura tras cada navegación pesa en planta; se pasaría a recargar
  solo tras `POST` propios con un interceptor.

## D-F40. Búsqueda y listado: dos pantallas, un endpoint, y `placa` viaja siempre

**Fecha:** 2026-11-03 · **Fase:** FB6 · Aplica D-27 del backend

El servidor distingue la búsqueda del listado por la **presencia** de la clave `placa` o `fecha`.
La pantalla de consulta envía `placa` siempre, aunque vaya vacía, y así «sin criterios» vuelve
con el mensaje del servidor (HU-M07-01 CA06) en lugar de convertirse en un listado. El listado
nunca envía `placa` ni `fecha` (sus filtros vacíos se omiten), así que sin fechas recibe el mes
en curso y la pantalla muestra el rango que el servidor aplicó (HU-M07-02 CA08). Una prueba fija
ambos comportamientos.

## D-F41. El ticket se abre junto a los datos, en la misma pantalla de consulta

**Fecha:** 2026-11-03 · **Fase:** FB6

La tarea T03 mide cuánto tarda recuperar un respaldo: elegir un resultado no navega, abre debajo
de la lista el ticket ampliable, los datos y el lote con su recorrido, reutilizando las piezas
del detalle (`pestana-ticket`, `pestana-datos`, `pestana-trazabilidad`). La imagen se pide con
`TicketImagen`, el cargador compartido con el detalle del ingreso (Blob autenticado, D-F14): se
libera al cambiar de ingreso y no se descarga dos veces. El detalle completo sigue a un enlace.

## D-F42. Calendario e inicio: presentación sin cálculo propio

**Fecha:** 2026-11-03 · **Fase:** FB6 · Aplica D-F04, RNF-M07-11

- El calendario empieza la semana en **lunes** y calcula las celdas previas con UTC para que el
  desfase del teléfono no mueva el día. Los días con En proceso o con anulados llevan icono **y**
  palabra. En teléfono la celda no muestra las toneladas (no caben en 360 px); quedan el número, los
  ingresos y las marcas, y las toneladas del día están en su lista y en el resumen del mes.
- Las barras de siete días son CSS (sin librería de gráficos): la altura es proporcional al mayor
  de la semana, un día con toneladas siempre se ve (mínimo 4 %) y la cifra va escrita bajo cada
  barra, de modo que la altura nunca es el único dato.
- Las cifras del inicio no se calculan en el cliente: el `enlace` de cada una lo manda el
  servidor, y `null` significa que el rol no tiene esa pantalla (HU-M07-04 CA11).

## D-F43. Un valor ausente no se envía como `null`; y «ahora» no se envía si no se tocó

**Fecha:** 2026-11-03 · **Fase:** FB4–FB6 · Corrige un defecto hallado en el recorrido contra el backend

Dos defectos del cliente que solo aparecieron al usar el backend real:

- **`null` explícito.** «Cerrar lote» sin destino y «Agregar mineral» sin elegir enviaban
  `{destino: null}` y `{tipo_mineral: null}`; el serializador los rechaza como tipo inválido y la
  respuesta era el genérico «Datos inválidos» en lugar del mensaje del criterio (HU-M06-05 CA03,
  HU-M06-01 CA17). Ahora el campo ausente **no viaja** y el servidor contesta con su mensaje.
- **Fecha «ahora».** El diálogo de una etapa propone la hora actual redondeada al minuto; enviada
  tal cual, quedaba antes del paso anterior si se registraba en el mismo minuto (23:03:00 frente a
  23:03:41) y el servidor la rechazaba. Ahora la fecha **solo viaja si el usuario la cambió**; si no,
  la asigna el servidor, como en el resto del sistema (D-01). Corrige lo dicho en D-F36.

---

# Decisiones de la construcción de FB7 (2026-11-04)

## D-F44. `selector-periodo` limita el futuro; el calendario conserva su navegación

**Fecha:** 2026-11-04 · **Fase:** FB7 · Aplica HU-M08-01 CA04 · Precisa `pantallas.md` (componentes compartidos)

`pantallas.md` preveía `shared/components/selector-periodo` para el calendario y la consolidación.
Al construirlo, el calendario (FB6) ya tenía su propia navegación de mes, que **sí** permite ir a
meses futuros (un mes sin llegadas es un estado válido de la consulta), mientras que la
consolidación **no** debe ofrecerlos (CA04). Se decide:

- `selector-periodo` es presentacional, con `limite` opcional: con él, la flecha «siguiente» se
  deshabilita en el límite, la lista de meses del año límite se corta en el mes límite y la de años
  termina en el año límite. Lo usa la consolidación con el mes en curso de Lima (D-F17).
- El calendario **no** se migra: cambiar una pantalla ya recorrida contra el backend no aporta y
  mezclaría FB6 en el commit de FB7.
- El periodo va en la URL (`?anio=&mes=`), así que un mes se puede enlazar. Un periodo futuro
  forzado así **no se corrige en el cliente**: se envía y el servidor responde «No se puede
  consolidar un periodo futuro», que se muestra literal. Un valor que no es un mes válido cae en el
  mes en curso.
- El cliente no suma ni redondea: la tabla y el total son los del servidor, con las mismas columnas
  y en el mismo orden que el XLSX, para comparar fila por fila (HU-M08-02 CA03).

---

# Rediseño de Trazabilidad con la maqueta (2026-11-05)

## D-F45. Las pantallas de Trazabilidad siguen la disposición de la maqueta

**Fecha:** 2026-11-05 · **Fase:** FB5 (rediseño) · Aplica D-F18 · Reemplaza la presentación de FB5

Las pantallas de lotes quedaron como listas de datos (`dl`, listas sueltas, un bloque «Siguiente
paso» aparte del recorrido) y en la revisión no se entendía en qué etapa estaba cada parte. La
maqueta (`pLotes`, `pLote`, `pAltas`, `pAlta`) lo resuelve con un flujo visual. Se adopta su
disposición, con sus mismos nombres de clase para compararlas directo:

- **Componentes, no clases sueltas.** Las piezas con identidad son componentes con estilos
  encapsulados: `app-ficha` (la `pill` de la maqueta) y `app-aviso-franja` (el `banner`) en
  `shared/`, y `app-tarjeta-etapa` y `app-flujo-lote` en Trazabilidad; la cifra (`kpi`), la línea
  de tiempo y los segmentos viven en el componente que los usa. En `src/estilos/_maqueta.scss`
  quedan solo los tokens que faltaban (`--purple`, `--ink`, `--font-d`…, sin colores fijos en los
  componentes) y utilidades de disposición con prefijo `lm-` (`lm-card`, `lm-kv`, `lm-tabla`,
  `lm-grid`…), para no chocar con Material ni con librerías.
- **Detalle del lote:** fichas de estado y avance, cifras del lote, un aviso según el estado y
  «Recorrido del mineral»: etapa común, división y una columna por parte, con una tarjeta por etapa
  (completada, siguiente o pendiente). El botón de registrar vive **en la tarjeta** de la etapa
  que sigue; los tardíos con secado propio van aparte. Reemplaza `siguiente-paso`, `partes-lote` y
  `recorrido-lote`.
- **El cliente no decide qué etapa sigue** (RNF-M06-07): `construirFlujo` solo acomoda
  `recorrido` (hecho) y `siguientes` (lo que sigue) en las tarjetas de la ruta del catálogo. Un
  `siguientes` que no encaja en ninguna tarjeta se ofrece igual en «Otros pasos pendientes», para
  no perder una acción.
- **«Listo para cerrar»** es un lote en recorrido sin `pendientes` del servidor. «Cerrar lote»
  aparece en el detalle solo entonces, como en la maqueta; el resumen de cierre sigue permitiendo
  intentarlo con pendientes y el servidor responde con su mensaje (HU-M06-05 CA02).
- **Cierre de lotes** en tres secciones (listos, en proceso con lo primero que falta, cerrados con
  su destino); el resumen de un lote con cuatro cifras, tiempos, resultado por parte, recorrido en
  línea de tiempo e ingresos.
- **Lo que la maqueta tiene y el contrato no:** el avance de la lista de lotes, sus bigbags y el
  filtro «Listos para cerrar» (la lista `GET lotes/` no los trae); los códigos de bigbag; y el
  rendimiento t/h por etapa (solo llega al registrar la molienda y en el resumen). No se inventan
  en el cliente. Se conservan los filtros de mineral y fechas, que la maqueta no tiene (HU-M06-01).

Se revisaría si el backend agrega avance y bigbags a `GET lotes/`.
