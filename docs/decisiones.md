# Decisiones de implementación del frontend

**Documento:** propio de este repositorio, formato ADR-lite.
**No duplica:** `decisiones_diseno.md` del backend (decisiones D-01 a D-11, de alcance de tesis). Estas son decisiones de **cómo se construye el cliente**, más finas de grano, que alguien podría cuestionar razonablemente en sustentación o en una revisión de código. Cada una tiene fecha, alternativas descartadas y la razón concreta — no la preferencia.

Numeración propia: **D-F01** en adelante (`F` de frontend), para no confundirlas con las D-nn del backend.

---

## D-F01. Estado con signals, sin NgRx

**Fecha:** 2026-09 (esqueleto inicial)
**Alternativas descartadas:** NgRx, NgXs, un servicio de estado global hecho a mano.

Nueve módulos, ocho semanas, un desarrollador. NgRx aporta trazabilidad de acciones y time-travel debugging, que rinden en equipos grandes con estado compartido complejo entre muchas pantallas. Aquí cada página tiene su propio estado local (una lista, un formulario, un contador de pendientes) y casi nada se comparte entre features — de hecho, un feature no debe importar de otro (ver `frontend-feature-nuevo`).

Una infraestructura de estado global sin un caso real que la necesite es peor que no tenerla: en sustentación, "¿por qué NgRx?" sin una razón de dominio se defiende mal. Signals por página cubre el caso con menos código y menos conceptos que enseñar.

**Se revisa si:** aparece un estado que de verdad cruza tres o más features (por ejemplo, un contador de notificaciones global visible en toda la app). Hasta entonces, un signal en `core/services/` para ese caso puntual basta; no justifica una librería.

## D-F02. Refresh token en `localStorage`, access token en memoria

**Fecha:** 2026-09
**Alternativa descartada:** cookies `HttpOnly`.

Documentado también en la skill `frontend-http-sesion`, pero merece registro aparte porque es la decisión de seguridad más discutible del proyecto y quien la audite debe encontrarla con su razón, no deducirla.

Una cookie `HttpOnly` es más segura contra XSS porque JavaScript no puede leerla. No se usó porque exige que backend y frontend compartan dominio (o se configure `SameSite`/CORS con credenciales de forma cuidadosa), y este proyecto desplegó backend y frontend en **repositorios y dominios separados** por decisión explícita (D-11 del backend). Forzar cookies aquí habría significado o bien un dominio compartido —contradiciendo esa decisión— o una configuración CORS con `credentials: true` que en la práctica es tan frágil como el propio `localStorage`.

**Mitigación aceptada:** vida corta del access token (30 min, configurable en el backend vía `JWT_ACCESS_MINUTES`), y ningún uso de `[innerHTML]` con datos no saneados del servidor en ningún componente. Es una superficie de riesgo conocida y limitada, no una omisión.

**Se revisa si:** backend y frontend alguna vez comparten dominio (por ejemplo, el frontend servido desde el mismo host que la API mediante un reverse proxy). En ese escenario, cookies `HttpOnly` pasan a ser la opción estrictamente mejor y sin el costo de configuración actual.

## D-F03. Angular Material como única librería de componentes

**Fecha:** 2026-09
**Alternativas descartadas:** PrimeNG, componentes hechos a mano con solo CSS.

Mezclar dos librerías de componentes (p. ej. Material para tablas y PrimeNG para un date-picker que Material no trae bien) duplica el peso del bundle inicial — cada librería trae su propio sistema de theming y sus propias dependencias de CDK/utilidades. El presupuesto de bundle está fijado en 500 kB de aviso / 1 MB de error precisamente porque el sistema debe cargar en un teléfono con conectividad intermitente en planta (ver `entorno.md` §5).

Si un componente que Material no cubre bien aparece (por ejemplo, un selector de fecha con reglas de negocio específicas), la solución es construirlo a mano sobre primitivas HTML + CDK de Angular Material (que ya está instalado), no traer una segunda librería completa por un solo widget.

**Se revisa si:** aparece una necesidad de UI que Angular Material genuinamente no puede resolver ni extender razonablemente (poco probable dado el alcance de 34 historias, ninguna de las cuales pide un dashboard con gráficos).

## D-F04. Sin librería de gráficos

**Fecha:** 2026-09

Ninguna de las historias de usuario documentadas pide un dashboard o una visualización de series de tiempo. Instalar `ngx-charts`, Chart.js o similar "por si acaso" es peso muerto en el bundle que nunca se usa, y una superficie más que mantener actualizada.

**Se revisa si:** una historia futura (o un cambio de alcance aprobado) pide explícitamente un gráfico. En ese momento se evalúa la librería más liviana que cubra ese caso puntual, no una general.

## D-F05. Sin SSR (Server-Side Rendering)

**Fecha:** 2026-09 (`--ssr=false` al generar el proyecto)

El requisito central de M07 es que la aplicación funcione **sin red**, arrancando desde el service worker y los datos en caché del dispositivo. SSR resuelve un problema distinto (tiempo de primera pintura, SEO) y asume que hay un servidor Node disponible en cada petición — exactamente la disponibilidad de red que M07 existe para no necesitar. Añadir SSR aquí sería resolver un problema que el proyecto no tiene a costa de complicar el que sí tiene.

**Se revisa si:** el alcance de la tesis cambiara para incluir una vitrina pública indexable por buscadores, cosa que no está en ninguna historia actual.

## D-F06. Sin monorepo (Nx u otra herramienta)

**Fecha:** 2026-09

Un monorepo con librerías compartidas rinde cuando hay varias aplicaciones (por ejemplo, una app de escritorio y una web) o varios equipos trabajando en paralelo sobre código compartido. Aquí hay una sola aplicación y un desarrollador. La estructura de `frontend/` con `core/`, `shared/` y `features/` ya resuelve la separación de responsabilidades sin la complejidad de configuración adicional (build targets, cache distribuido) que Nx introduce.

**Se revisa si:** el proyecto creciera para incluir una segunda aplicación real (por ejemplo, un panel administrativo separado de la app de planta) que comparta un volumen significativo de código con esta.
