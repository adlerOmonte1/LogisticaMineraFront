---
name: frontend-angular
description: Implementa el frontend Angular del sistema de control de inventarios de ingreso de mineral — componentes standalone con signals, siete features con carga diferida, interceptores JWT y de errores, guards por rol, tablas y formularios con Angular Material, tema de la maqueta. Úsala al crear o modificar cualquier cosa bajo src/app, al escribir un componente, un servicio de feature, una tabla o una página, y cuando se mencione Angular, SPA, pantalla, componente, Material o signals.
---

# Frontend Angular

Carga antes `contexto-frontend`. Esta skill cubre lo general; para tareas concretas:
`frontend-feature-nuevo` (montar un feature), `frontend-http-sesion` (núcleo HTTP y sesión),
`frontend-formularios` (formularios y errores del servidor) y `frontend-registro-ticket` (captura,
revisión y borrador del registro).

## Stack fijado

Angular 17.3 con **componentes standalone y signals** (sin NgModules) · Angular Material + CDK ·
`idb` solo para el borrador. **Sin** PWA (D-F07), librería de gráficos (D-F04), NgRx (D-F01) ni SSR
(D-F05). Una sola librería de componentes (D-F03). El CLI se invoca con `npx ng`.

## Estructura

```
src/app/
  core/       interceptors/ (auth, error) · guards/ (sesion, rol, clave temporal)
              sesion/ · autorizacion/ · catalogo/ (datos de referencia, D-F26) · http/ · errores/ · layout/ (armazón)
  shared/     components/ · pipes/ · utils/        sin estado, sin servicios
  models/     espejo de docs/contrato-api.md
  features/
    auth/  catalogo/  ingresos/  trazabilidad/  consulta/  consolidacion/  auditoria/
```

Dentro de cada feature, tres capas (D-11):

```
features/consulta/
  data-access/consulta.service.ts          ConsultaService — única puerta a HttpClient
  pages/detalle-ingreso.page.ts            DetalleIngresoPage — ruteada, con estado
  ui/bloque-validacion.component.ts        BloqueValidacionComponent — input()/output()
  consulta.routes.ts
```

Archivos en kebab-case; clases en PascalCase; el dominio en español (`Ingreso`, `Lote`, `Destare`,
`TipoMineral`): tiene significado preciso en la planta. Las palabras del framework, en inglés.

## Reglas no negociables

1. **Solo `data-access/` inyecta `HttpClient`.**
2. **`ui/` y `shared/` no inyectan servicios.** Reciben con `input()`, emiten con `output()`.
3. **Un feature no importa de otro.** Lo compartido sube a `shared/` o `models/`; entre features se
   navega por URL (`docs/pantallas.md` §5).
4. **El servidor manda** (D-08). Ninguna regla de negocio se aplica solo en el cliente; tampoco se
   replica como validación que bloquee.
5. **Los mensajes del servidor se muestran literales**, en su lugar. Ningún texto de error o de
   éxito del dominio se escribe en el cliente.
6. **Lo que asigna el servidor no se edita ni se envía**: código, tres marcas de tiempo, tara, peso
   neto, tipo de vehículo. Se muestran como texto.
7. **Lo que se oculta por rol también lo rechaza el servidor.** El guard es experiencia.
8. **Nada de `any`.** Los decimales son `string` (D-F17).
9. **Nada se borra.** Ningún servicio expone `eliminar()`.

## Estado

Signals por página: `signal`, `computed`, y `toSignal` para convertir el `Observable` del servicio.
El único estado global es la sesión (`core/services/sesion.service.ts`) y la caché de catálogos del
servicio de `catalogo` (D-F16).

```typescript
export class LotesPage {
  private servicio = inject(LotesService);
  filtros = signal<FiltroLotes>({ estado: 'EN_RECORRIDO' });
  pagina = signal<Pagina<LoteFila> | null>(null);
  cargando = signal(false);
}
```

## Plantillas

Control de flujo nuevo de Angular 17 (`@if`, `@for` con `track`, `@switch`), no `*ngIf`/`*ngFor`.
`ChangeDetectionStrategy.OnPush` en todos los componentes.

## Tablas y listas

`shared/components/tabla-paginada` sobre `mat-table` y `mat-paginator`, alimentada con el sobre
`{count, next, previous, results}` (25 por página, sin cambiar el tamaño). Lista vacía:
`estado-vacio` con el `mensaje` que manda el servidor. En teléfono, cada fila se presenta como
tarjeta (como la maqueta, `data-l` por celda), nunca con desplazamiento horizontal.

Estados de ingresos, lotes y cuentas con `insignia-estado`; el ingreso sin foto con
`marca-sin-respaldo` en **toda** lista (RNF-M03-16). Ninguna señal depende solo del color.

## Imágenes y descargas

La imagen del ticket **nunca** en `<img src="/api/…">`: exige sesión. Se usa
`visor-imagen-protegida` (D-F14). Las exportaciones con `DescargaService`, que lee el nombre de
`Content-Disposition` y traduce el error que llega dentro del `Blob`.

## Tema

Material con los tokens de la maqueta (D-F18): Barlow, `--gold`/`--accent` como acción, barra lateral
`--sidebar`, estados `--green`, `--orange`, `--red`, `--blue`. Campos y botones de al menos 44 px de
alto en teléfono (RNF-M01-05).

## Responsivo

Todas las pantallas a 360 px sin desplazamiento horizontal. El registro y el paso por una etapa se
diseñan **primero** para teléfono en vertical y con una mano (RNF-M03-07, RNF-M06-06).
