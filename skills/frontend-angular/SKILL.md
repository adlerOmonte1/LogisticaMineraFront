---
name: frontend-angular
description: Implementa el frontend Angular del sistema de control de producción y existencias — componentes standalone con signals, features por módulo con carga diferida, interceptor JWT, guards por rol, formularios reactivos y tablas con Angular Material. Úsala al crear o modificar cualquier cosa bajo src/app, al escribir un componente, un servicio de feature, un formulario o una tabla, y cuando se mencione Angular, SPA, formulario, interceptor, guard o pantalla.
---

# Frontend Angular

Carga antes `contexto-frontend`. Esta skill cubre lo general; para tareas concretas hay skills
específicas: `frontend-feature-nuevo`, `frontend-http-sesion`, `frontend-formularios` y
`frontend-offline-pwa`.

## Stack fijado

Angular 17.3 con **componentes standalone y signals** (sin NgModules) · Angular Material ·
Angular Service Worker + IndexedDB para M07. Sin librerías de gráficos: ninguna de las historias
cubre un dashboard, y no está en el alcance.

Elige **Angular Material** y no lo mezcles con otra librería de componentes: dos duplican el peso del
bundle, que es precisamente lo que se descarga en un teléfono con conectividad intermitente.

**El CLI no está instalado de forma global**: se invoca con `npx ng <comando>`, para que la versión
quede fijada en `package.json` y el entorno sea reproducible en otra máquina.

## Estructura

```
src/app/
  core/               interceptores JWT, guards, errores, conectividad y cola offline (M07)
  shared/             componentes, pipes y directivas reutilizables, sin estado
  models/             interfaces TypeScript espejo de los serializers
  features/
    autenticacion/ M01   catalogo/ M02   ingresos/ M03   salidas/ M04
    existencias/   M05   reportes/ M06   auditoria/ M08   busqueda/ M09
```

Un feature por módulo, con carga diferida (`loadChildren`) y su propio routing. **M07 no tiene
feature**: es transversal y vive en `core/`. Dentro de cada feature, tres capas (D-11):

```
features/ingresos/
  data-access/ingresos.service.ts        class IngresosService — única puerta a HttpClient
  pages/ingreso-form.page.ts             class IngresoFormPage — ruteado, con estado
  ui/ingreso-tabla.component.ts          class IngresoTablaComponent — input()/output()
  ingresos.routes.ts
models/ingreso.model.ts                  interface Ingreso
```

Nombres de archivo en kebab-case, clases en PascalCase, dominio en español: `Ingreso`, `Volquete`,
`Producto` tienen significado preciso en la empresa y traducirlos introduce ambigüedad. Las palabras
del framework se quedan en inglés.

## Reglas no negociables

**1. Ningún componente llama a `HttpClient` directamente.** Cada feature expone un servicio en
`data-access/`. Un `ApiService` global con treinta métodos obliga a cada componente a depender de
todo el sistema (ISP).

**2. Un feature no importa de otro.** Lo compartido sube a `shared/` o a `models/`. Importar del
feature vecino arrastra su bundle y la carga diferida deja de serlo.

**3. Las reglas de negocio no se replican como fuente de verdad** (D-08). Angular valida en el
formulario para mejorar la experiencia; la validación autoritativa está en el backend, porque un
registro que llega por la cola de M07 no pasa por ningún formulario.

**4. Los campos calculados son `readonly`, nunca `disabled`.** Los controles deshabilitados **no
viajan en el payload**. Aplica al peso neto (HU-M03-01 CA03).

**5. Los mensajes de error del servidor se muestran literales**, en el campo correspondiente. El
texto coincide con el criterio de aceptación y las pruebas lo verifican por igualdad exacta.

**6. Lo que se oculta por rol también se rechaza en el servidor.** El guard de ruta es experiencia de
usuario; el control real está en `permissions.py`.

**7. Nada de `any`.** Un `any` en la respuesta de la API anula la única verificación de contrato que
existe entre los dos repositorios.

## Estado

Signals por página. Sin NgRx: nueve módulos y ocho semanas no justifican una máquina de estado
global, y una infraestructura sin uso real se defiende peor en sustentación que su ausencia.

## Formulario de ingreso — el crítico

Es la pantalla de la que dependen I1 e I2. Además de su historia debe cumplir:

- Operable por completo en pantalla de **5 pulgadas sin desplazamiento horizontal** (RNF-M03-05).
- Completable en **menos de 90 segundos** por un usuario capacitado (RNF-M03-03).
- `inputmode="decimal"` en los campos de peso (RNF-M03-04).
- **Borrador persistido en IndexedDB con cada cambio** (RNF-M03-06), limpiado al confirmar.
- Catálogos de producto y vehículo desde caché, para que el formulario abra sin red.

Ver `frontend-formularios` para el detalle.
