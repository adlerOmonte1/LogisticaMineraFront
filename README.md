# LogisticaMineraFront

Cliente Angular del **Sistema de Control de Producción y Existencias** — tesis sobre el control de
ingresos de volquete, existencias y consolidados en planta minera.

Este repositorio contiene **solo el frontend**. El backend (Django 5 + DRF + PostgreSQL 16) y toda la
documentación de la tesis —historias de usuario, requerimientos, diagramas y decisiones de diseño—
viven en el repositorio del backend. No se duplican aquí: dos copias de una historia divergen y la
trazabilidad se pierde.

## Organización del repositorio

Espejo del repositorio del backend (`backend/` + `skills/`), para que los dos se lean igual:

```
LogisticaMineraFront/
├── frontend/           proyecto Angular — aquí se ejecuta npm
│   ├── angular.json  package.json  proxy.conf.json  ngsw-config.json
│   └── src/
├── skills/             seis skills de trabajo, versionadas
├── .claude/skills  →   enlace simbólico a ../skills, para que Claude las cargue
├── .gitignore          dist, .angular, node_modules, .env
└── README.md           este archivo
```

**Todos los comandos de npm se ejecutan dentro de `frontend/`.** El proyecto Angular vive ahí, no en
la raíz: la raíz es el repositorio, y el repositorio contiene más que la aplicación.

## Stack

| Pieza | Versión | Para qué |
|---|---|---|
| Angular | 17.3, standalone + signals | SPA con carga diferida por módulo |
| Angular Material | 17.3 | Componentes. Uno solo: dos librerías duplican el bundle |
| Service Worker + IndexedDB | `@angular/service-worker`, `idb` | Captura sin conexión (M07) |
| TypeScript | 5.4 | |

## Puesta en marcha

```bash
cd frontend
npm install
npm start          # http://localhost:4200 con proxy hacia el backend en :8000
```

El CLI **no se instala de forma global**: se invoca con `npx ng <comando>`, para que la versión quede
fijada en `package.json` y el entorno sea reproducible.

## Estructura

```
src/app/
├── core/                    se instancia una sola vez, lo consume todo
│   ├── interceptors/          auth (JWT) · offline (M07) · error (cuerpo uniforme)
│   ├── guards/                sesion · rol
│   └── services/              auth · conectividad · cola-sincronizacion · notificacion
├── shared/                  reutilizable y sin estado
│   └── components/ · directives/ · pipes/
├── models/                  interfaces espejo de los serializers del backend
└── features/                un feature por módulo, con carga diferida
    ├── autenticacion/  M01      ├── existencias/  M05
    ├── catalogo/       M02      ├── reportes/     M06
    ├── ingresos/       M03      ├── auditoria/    M08
    └── salidas/        M04      └── busqueda/     M09
```

Cada feature se divide en tres capas, espejo de las del backend:

```
features/ingresos/
├── data-access/    servicio del feature. ÚNICA puerta a HttpClient
├── pages/          componentes ruteados: orquestan una pantalla, tienen estado
├── ui/             presentacionales: input() y output(), sin servicios
└── ingresos.routes.ts
```

| Backend Django | Frontend Angular | Responsabilidad |
|---|---|---|
| `models/` | `models/` | Formas del dominio |
| `repositories/` + `services/` | `data-access/` | Hablar con la fuente de datos |
| `views/` | `pages/` | Orquestar una pantalla |
| `serializers/` | `ui/` | Presentar |
| `utils/` | `core/` + `shared/` | Transversal |

**M07 (captura sin conexión) no tiene feature**: es transversal y vive en `core/` como interceptor
más cola de sincronización. Si fuera una pantalla, M03 tendría que saber si hay red.

## Reglas de la estructura

1. **Solo `data-access/` inyecta `HttpClient`.** Un `ApiService` global con treinta métodos obliga a
   cada componente a depender de todo el sistema.
2. **`ui/` no inyecta servicios.** Recibe con `input()`, emite con `output()`. Si necesita un
   servicio, es un `pages/` mal ubicado — y deja de poder probarse sin `HttpTestingController`.
3. **Un feature no importa de otro.** Lo compartido sube a `shared/` o a `models/`; si no, la carga
   diferida deja de serlo.
4. **Las validaciones del cliente no son la fuente de verdad.** Un registro que entra por la cola de
   M07 no pasa por ningún formulario: la regla autoritativa está en el backend.
5. **Nada se borra: se anula o se desactiva.** Ningún servicio expone `eliminar()`.
6. **Los mensajes de error del servidor se muestran literales.** Coinciden con los criterios de
   aceptación y las pruebas del backend los verifican por igualdad exacta.
7. **Los campos calculados son `readonly`, nunca `disabled`**: un control deshabilitado no viaja en
   el payload.

## Entornos

La convención de Angular es al revés de la del backend: `environment.ts` es el archivo **de
producción** —el de por defecto— y las demás configuraciones lo reemplazan.

| Configuración | Archivo | `apiUrl` | Para qué |
|---|---|---|---|
| `development` | `environment.development.ts` | `/api/v1` vía proxy | Un solo origen: CORS no interviene |
| `preproduction` | `environment.preproduction.ts` | `pre.…/api/v1` | Pruebas de carga con JMeter |
| `production` | `environment.ts` | `api.…/api/v1` | Donde se recolecta el postest |

```bash
npx ng build --configuration development
npx ng build --configuration preproduction
npx ng build --configuration production
```

La de producción es la que aplica los presupuestos de tamaño (aviso a 500 kB, error a 1 MB de bundle
inicial). Ese límite es la defensa del requisito de carga en un teléfono con conectividad
intermitente: si algún día falla, la respuesta es quitar peso, no subir el presupuesto.

## Probar la captura sin conexión

`ng serve` no registra el service worker. Para probar M07 de verdad:

```bash
npx ng build --configuration production
npx http-server dist/mineria-logistica/browser -p 4300   # desde frontend/
```

Y en DevTools › Network › **Offline**: registrar, volver a línea, y comprobar que el correlativo
llega del servidor y que la hora de registro conserva la de captura.

## Convención de commits

```
M03: registra hora de pesaje separada de hora de registro (HU-M03-01)
```

Siempre con el código de módulo y la historia. Es lo que permite reconstruir la cadena
`indicador → requerimiento → módulo → historia → caso de prueba → commit` desde el historial de git,
repartida entre los dos repositorios.

## Skills

En `skills/` hay seis skills de trabajo, versionadas a propósito para que no se pierdan:
`contexto-frontend` (siempre primero), `frontend-angular`, `frontend-feature-nuevo`,
`frontend-http-sesion`, `frontend-formularios` y `frontend-offline-pwa`.

Viven en `skills/` para que la estructura sea espejo de la del backend, y `.claude/skills` es un
enlace simbólico que apunta ahí: Claude Code las carga desde `.claude/`, y quien abra el repositorio
las ve en la raíz sin tener que mirar dentro de una carpeta oculta. Un solo contenido, dos entradas.
