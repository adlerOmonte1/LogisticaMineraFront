---
name: frontend-offline-pwa
description: Implementa la captura sin conexión de M07 en el frontend — service worker de Angular, cola de sincronización en IndexedDB, uuid local, hora de captura local, reintento y estrategias de caché de catálogos. Úsala al tocar core/services de sincronización o conectividad, ngsw-config.json, IndexedDB, o cuando se mencione offline, PWA, service worker, cola, sincronización o pérdida de conexión.
---

# Captura sin conexión (M07)

Carga antes `contexto-frontend`. Es el módulo diferenciador de la tesis: sin él, la latencia (I1) no
baja en las horas sin señal y la cobertura (I2) se degrada justo en los turnos con más ingresos.

## Dónde vive

En `core/`, **no** en `features/`. La captura sin conexión es transversal: si fuera una pantalla,
cada feature tendría que preguntar si hay red (D-04, D-11).

```
core/
  interceptors/offline.interceptor.ts     decide entre red y cola
  services/conectividad.service.ts        estado de la conexión, como signal
  services/cola-sincronizacion.service.ts IndexedDB, reintento, contador de pendientes
```

## Las tres reglas del dato offline

**1. El cliente genera `uuidLocal`, nunca un correlativo** (D-02). El correlativo definitivo lo asigna
el servidor al sincronizar. Si el dispositivo lo asignara, dos supervisores trabajando sin conexión
producirían el mismo número y el ingreso dejaría de ser identificable de forma única — la unidad de
análisis de toda la tesis.

**2. Se envía `horaCapturaLocal`, y el servidor la persiste como `hora_registro`** (D-03). Si se
usara la hora de sincronización, I1 mediría el tiempo hasta que hubo señal, no el tiempo hasta que se
capturó el dato: quedaría invalidado precisamente el indicador que el módulo debía mejorar.

**3. El `uuidLocal` es la clave de idempotencia.** Un lote reenviado tras un corte no debe duplicar
registros: el servidor reconoce el `uuidLocal` ya procesado y responde con el registro existente.
Sin esto, un reintento infla la cobertura I2 con duplicados.

```typescript
await db.put('cola', {
  ...registro,
  uuidLocal: crypto.randomUUID(),
  horaCapturaLocal: new Date().toISOString(),
  intentos: 0,
});
```

## Envío

Un solo endpoint, por lotes: `POST /api/v1/sincronizacion/lote/`. La respuesta indica, por
`uuidLocal`, cuáles se aceptaron y cuáles fueron rechazados con su error.

**Un rechazo por regla de negocio no se reintenta**: se marca el elemento y se muestra al usuario
para que lo corrija. Reintentar en bucle algo que el servidor rechazará siempre vacía la batería y
oculta el problema. Solo se reintentan los fallos de red, con espera creciente.

La cola se procesa cuando `conectividad.service` pasa a en línea, y también al abrir la aplicación.

## Lo que el usuario tiene que ver

- Un contador de **pendientes de sincronizar**, visible siempre, no escondido en un menú.
- Un estado por elemento: pendiente, enviando, aceptado, rechazado con su motivo.
- Confirmación explícita al cerrar sesión si hay pendientes.

Sin señal visible, el supervisor no sabe si su registro llegó y ante la duda lo anota también en
papel. El trabajo duplicado es la señal de que la interfaz falló, no el usuario.

## Caché

`ngsw-config.json`:

| Recurso | Estrategia | Por qué |
|---|---|---|
| App shell, JS, CSS | `prefetch` | La aplicación debe abrir sin red |
| Catálogos (productos, vehículos) | `freshness` con `maxAge` de horas | Cambian poco; el formulario no puede depender de una petición al abrir |
| Listados y consultas | Sin caché de datos | Mostrar existencias obsoletas como si fueran actuales corrompe una decisión de operación |

La distinción importa: cachear el catálogo permite registrar sin red; cachear un saldo de stock hace
que alguien decida sobre un número viejo.

## Cómo se prueba de verdad

`ng serve` **no registra el service worker**: en `app.config.ts` está `enabled: !isDevMode()`, y el
dev-server tampoco sirve `ngsw-worker.js`. Probar M07 con `npm start` da falsos negativos.

El procedimiento real:

```bash
npx ng build --configuration production
npx http-server dist/mineria-logistica/browser -p 4300
```

Luego, en DevTools › Network › **Offline**: registrar, volver a línea y comprobar que el correlativo
llega del servidor y que `hora_registro` conserva la hora de captura, no la de sincronización.

La cola en IndexedDB sí funciona con `ng serve`, porque no depende del service worker: lo que no se
puede probar así es el arranque de la aplicación sin red.

## Verificación

- [ ] Registrar sin red deja el elemento en la cola con `uuidLocal` y `horaCapturaLocal`.
- [ ] Al volver la red, el registro sube y recibe correlativo **del servidor**.
- [ ] `hora_registro` en el servidor coincide con la hora de captura, no con la de sincronización.
- [ ] Reenviar el mismo lote no duplica registros.
- [ ] Un rechazo por regla de negocio no entra en bucle de reintentos.
- [ ] La aplicación abre sin red y el formulario tiene sus catálogos (probado sobre el build).
