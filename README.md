# LogisticaMineraFront

Cliente Angular del **sistema web inteligente para el control de inventarios de ingreso de mineral**
(tesis 2027, empresa Construcción y Minería, planta de Pillcomarca, Huánuco): registro del ingreso
desde la foto del ticket de balanza, reconocimiento automático de placa, fecha y peso bruto,
validación de consistencia, trazabilidad por lotes y etapas, consulta con el ticket de respaldo y
consolidado mensual por tipo de mineral.

Este repositorio contiene **solo el frontend**. El backend (Django 5 + DRF + PostgreSQL 16) y toda la
documentación del sistema —marco de tesis, historias de usuario, requerimientos, diagramas,
decisiones y la maqueta— viven en el repositorio vecino `LogisticaMinera`. No se duplican aquí: dos
copias de una historia divergen y la trazabilidad se pierde (D-11 del backend, D-F10).

## Organización del repositorio

```
LogisticaMineraFront/
├── frontend/           proyecto Angular — aquí se ejecuta npm
│   ├── angular.json  package.json  proxy.conf.json
│   └── src/
├── skills/             skills de trabajo, versionadas
├── scripts/            validar_docs.py (enlaces y conceptos del alcance anterior)
├── .github/workflows/  frontend.yml (calidad) · docs.yml (documentación)
├── docs/               documentación propia de este repositorio (ver abajo)
├── .claude/skills  →   enlace simbólico a ../skills, para que Claude las cargue
├── CONTRIBUTING.md     paso a paso para trabajar aquí
└── README.md           este archivo
```

**Todos los comandos de npm se ejecutan dentro de `frontend/`.**

## Documentación

| Documento | Qué encontrar ahí |
|---|---|
| [`docs/plan-implementacion.md`](docs/plan-implementacion.md) | **El plan.** Fases FB0 a FB9, pasos con su verificación, guion de revisión y puerta de cada fase |
| [`docs/verificacion-criterios.md`](docs/verificacion-criterios.md) | Los 277 criterios de aceptación: qué se revisa en la interfaz, en qué fase |
| [`docs/bitacora-fases.md`](docs/bitacora-fases.md) | Registro de cada puerta: aprobada u observada |
| [`docs/estado-modulos.md`](docs/estado-modulos.md) | Avance real por fase y por feature |
| [`docs/contrato-api.md`](docs/contrato-api.md) | Cada endpoint del backend leído desde el cliente: formas, errores, permisos, rarezas |
| [`docs/pantallas.md`](docs/pantallas.md) | Rutas, menú por rol, pantallas y componentes compartidos |
| [`docs/decisiones.md`](docs/decisiones.md) | Decisiones de implementación D-F01 en adelante |
| [`docs/entorno.md`](docs/entorno.md) | Versiones, arranque con el backend, verificación antes de un commit |
| [`docs/flujo-github.md`](docs/flujo-github.md) | Ramas, issues, etiquetas, hitos, protección y ciclo de una fase en GitHub |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Cómo trabajar una fase, commits, checklist de PR |

Fuentes del backend que se leen a menudo (ruta relativa desde la raíz de este repositorio):

| Fuente | Ruta |
|---|---|
| Marco de tesis (manda sobre todo) | `../LogisticaMinera/docs/00-tesis/marco_tesis.md` |
| Historias por módulo | `../LogisticaMinera/docs/modulos/M{nn}-*/HU.md` |
| Guía del frontend | `../LogisticaMinera/docs/00-arquitectura/GUIA_FRONTEND_ANGULAR.md` |
| Decisiones de diseño D-01 a D-28 | `../LogisticaMinera/docs/00-arquitectura/decisiones_diseno.md` |
| Criterios por caso (Anexo A) | `../LogisticaMinera/docs/01-plan/PLAN_IMPLEMENTACION.md` |
| Maqueta | `../LogisticaMinera/Mockup/index.html` |
| API viva | `http://localhost:8000/api/v1/docs/` |

## Stack

| Pieza | Versión | Para qué |
|---|---|---|
| Angular | 17.3, standalone + signals | SPA con carga diferida por feature |
| Angular Material + CDK | 17.3 | Componentes. Uno solo (D-F03) |
| `idb` | 8 | Borrador del registro en IndexedDB (D-F15) |
| TypeScript | 5.4 | |
| Node | 20 LTS | Fijado con `.nvmrc` (FB0) |

Sin PWA ni service worker (D-F07), sin librería de gráficos (D-F04), sin NgRx (D-F01), sin SSR
(D-F05).

## Cómo ejecutar el proyecto

El frontend no funciona solo: cada pantalla pide sus datos al backend. Se levantan los dos, el
backend primero.

### 1. Requisitos

| Herramienta | Versión | Para qué |
|---|---|---|
| Git | cualquiera reciente | Clonar los dos repositorios |
| Docker Desktop (con Docker Compose) | cualquiera reciente | Backend y PostgreSQL |
| Node.js | **20 LTS** (fijado en `frontend/.nvmrc`) | Angular 17 |
| Chrome o Edge | actual | Usar el sistema y correr las pruebas |

Con `nvm` (o `nvm-windows`): `nvm install 20` y `nvm use 20`. Con Node 22 o superior el proyecto
compila, pero `npm install` avisa `EBADENGINE` y Angular 17 no está probado ahí.

### 2. Clonar los dos repositorios, lado a lado

```bash
git clone https://github.com/adlerOmonte1/LogisticaMinera.git
git clone https://github.com/adlerOmonte1/LogisticaMineraFront.git
```

Lado a lado, las rutas `../LogisticaMinera/…` de esta documentación funcionan tal cual.

### 3. Levantar el backend (desde `LogisticaMinera/`)

Con Docker Desktop **abierto**:

```bash
docker compose up -d --build
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py cargar_datos_prueba
```

- `migrate` solo hace falta la primera vez y cuando el backend trae migraciones nuevas.
- `cargar_datos_prueba` crea, o devuelve a su estado inicial, una cuenta por rol (Administrador,
  Administrativo y Supervisor), el catálogo y datos de ejemplo. Solo corre con `DEBUG` activo.
- **Credenciales de prueba:** en `LogisticaMinera/postman/entornos/local.postman_environment.json`
  (`usuario_admin`, `usuario_administrativo`, `usuario_supervisor` y sus `clave_…`). No se copian a
  este repositorio.

Comprobar que respondió: `http://localhost:8000/api/v1/docs/` abre el Swagger de la API.

### 4. Levantar el frontend (desde `LogisticaMineraFront/frontend/`)

```bash
npm install        # solo la primera vez o cuando cambia package-lock.json
npm start
```

Abrir **`http://localhost:4200`** e iniciar sesión con una de las cuentas de prueba. El menú cambia
según el rol.

`npm start` usa `proxy.conf.json`: todo lo que va a `/api` lo reenvía a `http://localhost:8000`, así
que el navegador ve un solo origen y no hace falta configurar CORS en desarrollo.

### 5. Apagar y volver a empezar

```bash
# en frontend/: Ctrl + C detiene npm start
docker compose stop        # en LogisticaMinera/: detiene el backend sin perder datos
docker compose up -d       # la siguiente vez basta con esto (sin --build ni migrate)
```

Para repetir una revisión con los datos de prueba desde cero (en `LogisticaMinera/`):

```bash
docker compose exec backend python manage.py flush --no-input
docker compose exec backend python manage.py cargar_datos_prueba
```

### 6. Problemas frecuentes

| Síntoma | Causa | Qué hacer |
|---|---|---|
| `failed to connect to the docker API` | Docker Desktop cerrado | Abrir Docker Desktop y esperar a que diga «running» |
| El inicio de sesión falla con un error del servidor y la terminal de `npm start` muestra `ECONNREFUSED` | Backend apagado | Paso 3; comprobar `http://localhost:8000/api/v1/docs/` |
| «Credenciales inválidas» con las cuentas de prueba | Base sin datos de prueba, o datos de otra revisión | `cargar_datos_prueba` de nuevo |
| `npm start` se queda preguntando por *analytics* | Primera ejecución del CLI de Angular | Responder `N`; o definir antes `NG_CLI_ANALYTICS=false` (PowerShell: `$env:NG_CLI_ANALYTICS='false'`) |
| `Port 4200 is already in use` | Otro `npm start` abierto | Cerrarlo, o `npx ng serve --port 4300` |
| Aviso `EBADENGINE` en `npm install` | Node distinto de 20 | Cambiar a Node 20 (paso 1) |

Para usarlo desde un teléfono en la misma red, y otros ajustes del backend útiles para revisar
(sesión que expira, motor de reconocimiento caído): [`docs/entorno.md`](docs/entorno.md) §3.3 y §4.

El CLI se invoca siempre con `npx ng <comando>` dentro de `frontend/`, para que la versión sea la de
`package.json`.

## Módulos y features

| Módulo | Responsabilidad | Feature |
|---|---|---|
| M01 Autenticación y roles | Identificar al usuario y limitar cada operación según su rol | `features/auth/` |
| M02 Catálogo maestro | Tipos de mineral, vehículos (titularidad, capacidad, tara) y transportistas | `features/catalogo/` |
| M03 Registro de ingresos | Registro desde la imagen del ticket o sin ella, corrección, anulación, destare | `features/ingresos/` |
| M04 Reconocimiento automático | Placa, fecha y peso bruto con su confianza | dentro de `ingresos/` |
| M05 Validación automática | Reglas V1 a V5 y su resolución | dentro de `ingresos/` |
| M06 Trazabilidad | Lotes, ruta, etapas, división, bigbags y cierre con destino | `features/trazabilidad/` |
| M07 Consulta | Inicio, avisos, búsqueda, listado, detalle con el ticket, calendario | `features/consulta/` |
| M08 Consolidación | Total mensual por tipo de mineral y su exportación | `features/consolidacion/` |
| M09 Auditoría | Historial de un ingreso y auditoría del sistema | `features/auditoria/` |

Roles: **Administrador**, **Administrativo** y **Supervisor de planta**. El menú se construye con el
rol que devuelve el inicio de sesión; ocultar una opción no reemplaza el control del servidor
(HU-M01-03).

## Estructura

```
src/app/
├── core/          se instancia una sola vez
│   ├── sesion/         sesión, renovación por actividad, interceptor JWT (D-F20)
│   ├── errores/        interceptor y traductor del cuerpo uniforme {codigo, mensaje, detalles}
│   ├── autorizacion/   matriz permiso → roles, `*appSiPuede` · guards/ · http/ · notificacion/ · dialogos/
│   ├── catalogo/       datos de referencia (vehículos, tipos de mineral, transportistas) usados por varios features
│   └── layout/         armazón: menú por rol, cabecera con búsqueda y avisos
├── shared/        reutilizable y sin estado: components/ · pipes/ · utils/
├── models/        espejo de lo que viaja por la API (docs/contrato-api.md)
└── features/      auth · catalogo · ingresos · trazabilidad · consulta · consolidacion · auditoria
```

Cada feature tiene tres capas, espejo de las del backend:

```
features/ingresos/
├── data-access/    servicio del feature: ÚNICA puerta a HttpClient
├── pages/          componentes ruteados: orquestan una pantalla, tienen estado
├── ui/             presentacionales: input() y output(), sin servicios
└── ingresos.routes.ts
```

## Reglas de la estructura

1. **Solo `data-access/` inyecta `HttpClient`.**
2. **`ui/` y `shared/` no inyectan servicios.** Si lo necesitan, son una página mal ubicada.
3. **Un feature no importa de otro.** Lo compartido sube a `shared/` o `models/`; entre features se
   navega por URL.
4. **El servidor manda** (D-08 del backend). El cliente valida para la experiencia; la autoridad es
   la API.
5. **Nada se borra.** Ningún servicio expone `eliminar()`: se anula o se desactiva (D-07, D-22).
6. **Los mensajes del servidor se muestran literales**, en su lugar. Coinciden con los criterios de
   aceptación y las pruebas del backend los comparan por igualdad exacta.
7. **Lo que asigna el servidor no se edita ni se envía**: código, marcas de tiempo, tara, peso neto.
   Se muestran como texto o `readonly`, nunca `disabled` en un formulario que se envía.
8. **Nada de `any`.**

## Verificación y pipeline

```bash
cd frontend
npm run format:check   # Prettier
npm run lint           # ESLint, incluidos los límites entre capas y features (D-F22)
npm run test:ci        # Karma en ChromeHeadless, con cobertura mínima
npx ng build           # producción, con el presupuesto de tamaño
```

GitHub Actions repite lo mismo en cada PR (`.github/workflows/frontend.yml`) y valida la
documentación (`.github/workflows/docs.yml`, con `scripts/validar_docs.py`).

## Entornos

| Configuración | Archivo | `apiUrl` |
|---|---|---|
| `development` | `environment.development.ts` | `/api/v1` vía proxy |
| `preproduction` | `environment.preproduction.ts` | `https://pre.<dominio>/api/v1` |
| `production` | `environment.ts` | `https://api.<dominio>/api/v1` |

El build de producción aplica el presupuesto de tamaño (aviso a 500 kB, error a 1 MB): el sistema se
abre en un teléfono en planta.

## Convención de commits

```
M03: registra el ingreso desde la revision del ticket (HU-M03-01)
chore(FB0): retira la PWA (D-F07)
fix(FB3): obs. 2 — conserva el tipo de mineral al cerrar el panel del vehiculo
```

Igual que en el backend: módulo e historia, sin tildes. Es lo que permite reconstruir la cadena
`RF → módulo → HU → caso de prueba → commit` repartida entre los dos repositorios.

## Skills

En `skills/` hay seis skills de trabajo: `contexto-frontend` (siempre primero),
`frontend-angular`, `frontend-feature-nuevo`, `frontend-http-sesion`, `frontend-formularios` y
`frontend-registro-ticket`. `.claude/skills` es un enlace simbólico a `skills/`.
