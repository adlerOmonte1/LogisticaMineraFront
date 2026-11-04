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
