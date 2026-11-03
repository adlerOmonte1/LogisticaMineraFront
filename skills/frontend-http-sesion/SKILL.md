---
name: frontend-http-sesion
description: Implementa la capa HTTP y de sesión del frontend Angular — servicio de sesión con signals y matriz de permisos, interceptor JWT con un único refresh, interceptor de errores que normaliza el cuerpo uniforme codigo/mensaje/detalles en sus cuatro formas, guards de sesión, rol y contraseña temporal, descargas con errores dentro de Blob. Úsala al escribir o modificar algo en core/interceptors, core/guards o core/services/sesion, al tratar login, logout, refresh, expiración, 401, 403, 409, 423, contraseña temporal, manejo de errores de la API o control de acceso por rol.
---

# HTTP y sesión

Carga antes `contexto-frontend`. Todo vive en `core/`, se instancia una vez y lo usan todos los
features. Contrato: `docs/contrato-api.md` §1 y §2.

## 1. `SesionService`

```typescript
export type Rol = 'ADMINISTRADOR' | 'ADMINISTRATIVO' | 'SUPERVISOR';
export interface UsuarioSesion { id: number; username: string; nombre_completo: string; rol: Rol; debe_cambiar_clave: boolean; }
```

- Signals: `usuario`, `rol` (`computed`), `autenticado`, `debeCambiarClave`.
- `access`, `refresh` y `usuario` en `localStorage` (D-F02 revisada por D-F20). **No hay endpoint
  «yo»**: el usuario se conoce solo por la respuesta del login y se restaura de ahí al recargar.
- `puede(permiso)` con la matriz de `docs/contrato-api.md` §9 — una sola tabla en el cliente, para
  el menú, los guards y los botones. Si cambia `permissions.py`, cambia esta tabla.
- `cerrarSesion()`: `POST auth/logout/` con el refresh (si falla, se limpia igual), borra sesión y
  caché de catálogos, descarta el borrador si es de otro usuario, navega a `/login`.

## 2. Interceptores, en este orden

```typescript
provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))
```

### `authInterceptor`

- Adjunta `Authorization: Bearer <access>` **solo** a peticiones que empiezan por
  `environment.apiUrl`, y nunca a `auth/login/` ni `auth/refresh/`.
- **Antes** de enviar, `RenovacionSesionService.renovarSiCorresponde()`: renueva el `access` solo
  si le quedan menos de 5 min **y** el usuario tocó la pantalla o el teclado en ese margen
  (`politica-renovacion.ts`, D-F20). Varias peticiones a la vez comparten una sola renovación
  (`shareReplay(1)`). Un temporizador revisa cada minuto, para quien llena un formulario largo.
- **Nunca** se renueva ante un 401: la vida del `access` es la ventana de inactividad del backend.
  El 401 `SESION_EXPIRADA` lo atiende `erroresInterceptor`: cierra la sesión y el login muestra su
  `mensaje` literal (HU-M01-01 CA06).
- El refresh no rota y va por `HttpBackend` (sin interceptores): `POST auth/refresh/ {refresh}` →
  `{access}`.

### `errorInterceptor`

Normaliza cualquier error a:

```typescript
export interface ErrorApi {
  status: number;
  codigo: string;
  mensaje: string;
  camposConError: Record<string, string>;      // campo → texto a mostrar bajo el control
  camposObligatorios: string[];                // de detalles.campos
  inconsistencias: Inconsistencia[];           // de detalles.inconsistencias
  justificacionesFaltantes: { regla: string; mensaje: string }[];
  detalles: unknown;                           // el original, para casos propios
}
```

`detalles` tiene **cuatro formas** (contrato §1.3): `{campos: [...]}`, `{inconsistencias,
justificaciones_faltantes}`, `{<campo>: [textos]}` de DRF, y propias (`pendientes`…). **No existe
`detalles.campo`.** Si el cuerpo es un `Blob` (descargas), se lee con `await blob.text()` y se
parsea.

| Estado | Qué hace |
|---|---|
| 400 | Deja pasar el `ErrorApi`: el formulario lo pinta (skill `frontend-formularios`) |
| 401 | Lo resuelve `authInterceptor` |
| 403 `ACCION_NO_AUTORIZADA` | Aviso con el `mensaje`; no navega |
| 403 contraseña temporal | Marca `debeCambiarClave` y navega a `/cuenta/clave` |
| 404 | Aviso y vuelta a la lista de origen |
| 409 | Aviso con el `mensaje`; la página recarga el recurso |
| 423 | Lo muestra el login |
| 0 (sin red) / 5xx | Aviso genérico; el formulario **conserva** sus datos y su borrador |

El `mensaje` del servidor **siempre** literal. Un 5xx no se convierte en «Error inesperado»
descartando el cuerpo: sin `codigo` no se diagnostica nada desde planta.

## 3. Guards

```typescript
export const sesionGuard: CanActivateFn = () => …;              // sin sesión → /login
export const claveTemporalGuard: CanActivateFn = () => …;       // debe_cambiar_clave → /cuenta/clave
export const invitadoGuard: CanActivateFn = () => …;            // con sesión → /inicio
export const permisoGuard = (permiso: Permiso): CanActivateFn => () => …;
```

`permisoGuard` es una **fábrica**: el permiso es dato de la ruta, y la matriz permiso → roles vive
en un solo lugar (`core/autorizacion/permisos.ts`, D-F24). Un rol sin permiso no se redirige en
silencio: ve la pantalla «Acción no autorizada» del armazón (HU-M01-03 CA02). El guard es
experiencia; el control es `permissions.py`.

## 4. Login

- Un error de credenciales no marca un campo concreto (RNF-M01-02): el `mensaje` va encima del
  formulario.
- «¿Olvidó su contraseña?» no llama a la API: abre un diálogo con el texto de HU-M01-01 CA08.
- Tras el login: `/cuenta/clave` si `debe_cambiar_clave`; si no, `/inicio`.

## 5. Descargas

`DescargaService.descargar(url, params)`: `responseType: 'blob'`, `observe: 'response'`; nombre de
`Content-Disposition`; crea un enlace temporal y lo revoca. El error dentro del `Blob` pasa por el
mismo `ErrorApi`.

## 6. Seguridad

- Nunca `[innerHTML]` con datos del servidor.
- Nunca el token en una URL (D-F14).
- La clave temporal de un restablecimiento se muestra una vez y no se guarda en ningún estado.
