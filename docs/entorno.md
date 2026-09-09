# Entorno de desarrollo

**Documento:** operativo, propio de este repositorio
**No duplica:** `ARQ-02_Arquitectura_Tecnica.md` del repositorio del backend, que fija el stack a nivel de tesis. Esto es lo que hace falta saber para que el entorno de una máquina nueva funcione.

---

## 1. Versiones exactas

| Herramienta | Versión instalada | Versión soportada por Angular 17 | Estado |
|---|---|---|---|
| Node.js | 24.13.1 | 18.x / 20.x | ⚠️ No soportado — funciona, pero fuera de la matriz oficial |
| npm | 11.8.0 | viene con Node | — |
| Angular CLI (global) | 17.3.17 | — | Fijado para que coincida con el proyecto |
| Angular CLI (local, `frontend/`) | 17.3.17 | — | El que realmente compila el build |
| TypeScript | 5.4.2 | 5.2–5.4 | OK |

### Por qué Node 24 es un riesgo, no un error

`ng version` marca Node 24 como `(Unsupported)`. Hoy compila y sirve sin problema — se verificó con `ng build --configuration production` — pero "funciona hoy" no es lo mismo que "está soportado". Angular 17 se probó y se mantiene contra Node 18 y 20; nadie en el equipo de Angular corre CI contra Node 24. El riesgo no es abstracto: es que un `npm install` futuro traiga una versión de alguna dependencia que sí choque con Node 24, y que eso se descubra en la semana 8 (preproducción, JMeter) en vez de ahora.

**Recomendación:** instalar Node 20 LTS con `nvm` y fijarlo con un `.nvmrc`. No es urgente mientras el proyecto siga en esqueleto, pero conviene resolverlo antes de que el volumen de dependencias crezca (Material ya está, faltan librerías de formularios y quizá de fechas).

```bash
# instalar nvm si no está
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# instalar y fijar Node 20
nvm install 20
nvm alias default 20
echo "20" > frontend/.nvmrc
```

## 2. Por qué el CLI no se instala global "porque sí"

Se instaló global (`npm install -g @angular/cli@17.3.17`) por comodidad de terminal — para que `ng version`, `ng generate` funcionen sin escribir `npx`. Pero **la versión que importa es la local**, la de `frontend/package.json`. Si alguna vez divergen (por ejemplo, alguien actualiza el global a Angular 18), usar `npx ng` dentro de `frontend/` siempre respeta la versión del proyecto y evita builds inconsistentes entre máquinas.

Regla práctica: `ng` a secas para comandos exploratorios (`ng version`, `ng doc`); `npx ng` dentro de `frontend/` para todo lo que termine en un commit (`generate`, `build`, `add`).

## 3. Arranque en una máquina nueva

```bash
git clone <url> LogisticaMineraFront
cd LogisticaMineraFront/frontend
npm install
npm start                # http://localhost:4200, proxy hacia backend en :8000
```

El backend debe estar corriendo en `localhost:8000` (ver `entorno.md` / README del repositorio del backend) para que el proxy de `proxy.conf.json` tenga a quién redirigir `/api`.

## 4. Cómo probar la captura sin conexión (M07)

`ng serve` **no** registra el service worker (`enabled: !isDevMode()` en `app.config.ts`), así que probar offline con `npm start` da falsos negativos: el navegador nunca tiene nada que servir sin red.

Procedimiento real, siempre sobre un build de producción:

```bash
cd frontend
npx ng build --configuration production
npx http-server dist/mineria-logistica/browser -p 4300
```

Luego, en Chrome DevTools → pestaña **Network** → casilla **Offline**:

1. Registrar un ingreso. Debe quedar en la cola de IndexedDB (Application → IndexedDB → `logistica` → `cola`) con `uuidLocal` y `horaCapturaLocal`.
2. Desmarcar Offline (vuelve la red).
3. Verificar que el registro sale de la cola y que el `correlativo` que queda en pantalla es el que asignó el servidor, no uno generado en el cliente.
4. Confirmar en el backend que `hora_registro` coincide con `horaCapturaLocal`, no con el momento en que volvió la señal.

La cola en IndexedDB sí se puede inspeccionar con `ng serve` normal — lo que no funciona ahí es el arranque de la aplicación completa sin red.

## 5. Comandos de verificación antes de un commit

```bash
cd frontend
npx ng build --configuration development     # falla rápido si algo no compila
npx ng build --configuration production      # el que importa: aplica presupuestos de tamaño
```

El build de producción avisa a 500 kB y falla a 1 MB de bundle inicial (`angular.json`, sección `budgets`). Ese límite existe porque el sistema debe cargar en un teléfono con conectividad intermitente en planta — no es un capricho de configuración, es la defensa de un RNF.

## 6. Variables de entorno vs. `environment.*.ts`

Angular no lee `.env` en tiempo de ejecución: todo lo que el cliente necesita saber en runtime (URL de la API, nombre del entorno) va en `src/environments/environment*.ts`, que se seleccionan por configuración de build (`fileReplacements` en `angular.json`), no por variables de shell. Un `.env` en este repositorio solo tendría sentido para scripts de CI/CD, nunca para el código de la aplicación.

| Configuración | Archivo que se usa | `apiUrl` |
|---|---|---|
| `development` (por defecto en `ng serve`) | `environment.development.ts` | `/api/v1` vía proxy |
| `preproduction` | `environment.preproduction.ts` | `https://pre.<dominio>/api/v1` |
| `production` (por defecto en `ng build`) | `environment.ts` | `https://api.<dominio>/api/v1` |
