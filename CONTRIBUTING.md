# Cómo trabajar en este repositorio

Guía operativa. El *qué* y el *cuándo* están en [`docs/plan-implementacion.md`](docs/plan-implementacion.md);
el *por qué* de cada regla, en [`docs/decisiones.md`](docs/decisiones.md) y en las skills. Esto es el
*cómo*, en orden.

## 1. Antes de empezar una fase

1. Entorno listo: [`docs/entorno.md`](docs/entorno.md) §3, con el backend y sus datos de prueba.
2. Mirar en [`docs/estado-modulos.md`](docs/estado-modulos.md) que la fase anterior esté ✅ y en
   [`docs/bitacora-fases.md`](docs/bitacora-fases.md) que su puerta esté aprobada.
3. Leer la fase en el plan: pasos, guion de revisión, puerta de salida.
4. Leer las HU de la fase en `../LogisticaMinera/docs/modulos/M{nn}-*/HU.md`.
5. Leer su sección de [`docs/contrato-api.md`](docs/contrato-api.md) y probar los endpoints en
   Swagger con una cuenta de cada rol.
6. Abrir su pantalla en la maqueta y en [`docs/pantallas.md`](docs/pantallas.md).

## 2. Rama y commits

Una rama por módulo, con el **mismo nombre que su rama del backend** (`feature/Mnn-nombre`), para
que la cadena `HU → módulo → rama → commit` se lea igual en los dos repositorios:

| Fase | Rama | Rama del backend |
|---|---|---|
| FB0 | `chore/FB0-nucleo` | `chore/F0-preparacion-backend` |
| FB1 | `feature/M01-autenticacion` | `feature/M01-autenticacion` |
| FB2 | `feature/M02-catalogo` | `feature/M02-catalogo` |
| FB3 | `feature/M03-registro-ingresos` | `feature/M03-registro-ingresos` |
| FB4 | `feature/M09-auditoria` | — |
| FB5 | `feature/M06-trazabilidad` | `feature/M06-trazabilidad` |
| FB6 | `feature/M07-consulta` | `feature/M07-consulta` |
| FB7 | `feature/M08-consolidacion` | — |

```bash
git switch staging && git pull
git switch -c feature/M09-auditoria
```

Las ramas salen de `staging` y vuelven a `staging` con un PR; `main` solo recibe PR desde `staging`
tras la puerta de supervisión. Issues, etiquetas, hitos y protección de ramas:
[`docs/flujo-github.md`](docs/flujo-github.md).

| Tipo de cambio | Formato |
|---|---|
| Una historia | `M03: registra el ingreso desde la revision del ticket (HU-M03-01)` |
| Núcleo o fase sin historia | `chore(FB0): retira la PWA (D-F07)` |
| Corrección de una observación de puerta | `fix(FB3): obs. 2 — conserva el tipo de mineral` |
| Documentación | `docs(plan): ajusta el guion de FB5` |

Sin tildes en el mensaje. Una historia por commit cuando se pueda; una fase por PR.

## 3. Construir dentro de una fase

Orden fijo (skill `frontend-feature-nuevo`):

1. **Modelo** en `frontend/src/app/models/` — espejo de `contrato-api.md`.
2. **Servicio** en `features/<f>/data-access/`.
3. **Rutas** en `features/<f>/<f>.routes.ts`, enganche en `app.routes.ts` con sus guards, entrada de
   menú.
4. **Páginas**, y `ui/` o `shared/` solo cuando algo se repite.
5. **Pruebas** del servicio y de los componentes con lógica.

## 4. Puerta técnica (antes de pedir revisión)

- [ ] `npm run format:check`, `npx ng lint`, `npm run test:ci` y
      `npx ng build --configuration production` en verde, sin avisos de presupuesto.
- [ ] Cada HU de la fase con su pantalla, su ruta y su entrada de menú por rol.
- [ ] Cada criterio de la fase marcado en [`docs/verificacion-criterios.md`](docs/verificacion-criterios.md).
- [ ] Recorrido con las tres cuentas, en escritorio y a 360 px (y en teléfono real en FB3, FB5 y FB8).
- [ ] Ningún `ui/` ni `shared/` inyecta servicios; ningún feature importa de otro.
- [ ] Ningún texto de error o de éxito del dominio escrito en el cliente.
- [ ] Nada asignado por el servidor se edita ni se envía.
- [ ] Ningún `any`.
- [ ] Opciones ocultas por rol = `apps/accounts/permissions.py` del backend.
- [ ] `estado-modulos.md` actualizado y fila «Pendiente de supervisión» en `bitacora-fases.md`, con
      el commit del backend revisado.

## 5. Puerta de supervisión

El supervisor sigue el guion de revisión de la fase y escribe en la bitácora **Aprobada** u
**Observada** con sus observaciones numeradas. Si se observa, cada observación se corrige en su
propio commit `fix(FBn): obs. k — …` y se vuelve a pedir la revisión. Aprobada la fase:

```bash
git tag FB3-aprobada
```

Y cuando un par de módulos queda cerrado en los dos repositorios, el mismo día:
`git tag M03-cerrado`.

## 6. Registrar una decisión

Una decisión de «cómo construir» que alguien podría cuestionar (una librería, un patrón, una
alternativa descartada) se añade a `docs/decisiones.md` como D-F siguiente, **antes** de fusionar:
fecha, fase, alternativas descartadas, razón concreta y cuándo se revisaría.

## 7. Si el backend cambia

1. Leer el cambio en el backend (serializer, mensaje, permiso).
2. Actualizar [`docs/contrato-api.md`](docs/contrato-api.md).
3. Ajustar `models/` y el servicio.
4. Revisar las pantallas afectadas y sus criterios.

## 8. Qué no hacer

- No duplicar documentación del backend (historias, criterios, mensajes). Enlazar.
- No agregar una librería sin revisar si Material o CDK ya lo resuelven (D-F03, D-F04).
- No replicar una regla del servidor como validación bloqueante del cliente (D-08 del backend).
- No escribir un mensaje del dominio en el cliente: se muestra el que llega.
- No usar `<img src>` para la imagen del ticket: exige sesión (D-F14).
- No calcular en el cliente qué etapa sigue en un lote: se pinta `siguientes` (FB5).
