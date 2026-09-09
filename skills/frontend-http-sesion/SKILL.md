---
name: frontend-http-sesion
description: Implementa la capa HTTP y de sesión del frontend Angular — interceptor JWT con refresh, interceptor de errores que traduce el cuerpo uniforme codigo/mensaje/detalles, guards de sesión y de rol, y almacenamiento del token. Úsala al escribir o modificar algo en core/interceptors o core/guards, al tratar login, logout, expiración de sesión, 401, 403, manejo de errores de la API o control de acceso por rol.
---

# HTTP y sesión

Carga antes `contexto-frontend`. Todo lo de esta skill vive en `core/`, se instancia una sola vez y
lo consumen todos los features.

## Interceptores, en este orden

El orden de registro en `app.config.ts` **importa**: se ejecutan en secuencia.

```typescript
provideHttpClient(withInterceptors([authInterceptor, offlineInterceptor, errorInterceptor]))
```

1. `authInterceptor` — adjunta el token antes de nada.
2. `offlineInterceptor` — decide entre red y cola (ver `frontend-offline-pwa`).
3. `errorInterceptor` — traduce lo que vuelve.

## 1. authInterceptor

Adjunta `Authorization: Bearer <access>` a toda petición a `environment.apiUrl`, y **a nada más**:
mandar el token a un tercero es una fuga de credenciales.

Ante un 401 con token expirado, intenta **un** refresh y reintenta la petición original. Si el
refresh también falla, cierra sesión y navega a `/login`. Un bucle de reintentos deja al supervisor
en una pantalla congelada, que en planta significa volver al papel.

El refresh concurrente se resuelve con un único `Observable` compartido: si cinco peticiones fallan a
la vez, se pide un solo token nuevo, no cinco.

## 2. errorInterceptor

El backend devuelve **siempre** la misma forma:

```json
{"codigo": "TARA_MAYOR_QUE_BRUTO", "mensaje": "La tara debe ser menor que el peso bruto", "detalles": {"campo": "tara_tn"}}
```

Por eso el cliente necesita **un solo** traductor:

| Situación | Qué hace el interceptor |
|---|---|
| 400 / 422 con `detalles.campo` | Lo deja pasar; el formulario lo pinta en ese campo |
| 401 | Delegado a `authInterceptor` (refresh o cierre de sesión) |
| 403 | Aviso «No tiene permiso para esta acción»; **no** navega a login |
| 404 | Aviso y vuelta al listado |
| 5xx | Aviso genérico y conserva los datos del formulario |
| Sin red | No es error: lo captura `offlineInterceptor` y encola |

**El `mensaje` del servidor se muestra literal.** Coincide con el criterio de aceptación y las pruebas
del backend lo verifican por igualdad exacta. Si lo reformulas, rompes la trazabilidad entre la
prueba y lo que ve el usuario.

Nunca conviertas un 5xx en «Error inesperado, intente de nuevo» descartando el cuerpo: sin el
`codigo` no se puede diagnosticar nada desde planta.

## 3. Guards

```typescript
export const sesionGuard: CanActivateFn = () => { ... };
export const rolGuard = (roles: Rol[]): CanActivateFn => () => { ... };
```

`rolGuard` es una **fábrica**, no un guard con la lista dentro: los roles permitidos son un dato de
la ruta, no del guard (ISP).

**Lo que el guard oculta, el servidor lo rechaza.** HU-M01-04 CA02 exige que una petición directa de
un supervisor al módulo de reportes sea rechazada **en el servidor** y quede en auditoría. Un guard
sin su permiso correspondiente en el backend es un agujero, no una protección.

## 4. Almacenamiento del token

`localStorage` para el `refresh`, memoria para el `access`. Es la opción viable aquí: la aplicación
debe abrir sin red y con la sesión viva (M07), y una cookie `HttpOnly` exigiría que backend y
frontend compartan dominio, lo que contradice el despliegue separado de D-11.

Consecuencia que hay que asumir y documentar: es vulnerable a XSS. La mitigación es no inyectar HTML
sin sanear —nada de `[innerHTML]` con datos del servidor— y mantener corta la vida del `access`
(30 minutos, `JWT_ACCESS_MINUTES` en el backend).

Al cerrar sesión se limpian token, caché de catálogos y borradores. Lo que **no** se borra es la cola
de sincronización pendiente: son registros de trabajo ya hecho, y perderlos degrada I1 e I2
exactamente en el escenario que el sistema debía resolver. Avisa de los pendientes antes de cerrar.
