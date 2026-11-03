---
name: frontend-formularios
description: Implementa formularios reactivos del frontend Angular — altas y ediciones de usuarios, catálogo y lotes, corrección, anulación, destare, división y cierre — con validación de experiencia, campos del servidor de solo lectura, mensajes literales del servidor en su campo, inconsistencias V1 a V5 junto al campo con su justificación, motivos obligatorios y teclado numérico. Úsala al crear o modificar cualquier formulario, al tratar validación, FormGroup, errores 400 de la API, detalles.campos, inconsistencias, justificaciones, motivos, inputmode, o cuando un campo no llegue al backend.
---

# Formularios reactivos

Carga antes `contexto-frontend`. Para la captura y la revisión del registro, además,
`frontend-registro-ticket`.

## Las reglas que se rompen siempre

**1. Lo que asigna el servidor no está en el formulario.** Código, marcas de tiempo, tara, peso neto
y tipo de vehículo se muestran como texto. Si por diseño un valor calculado debe verse dentro del
formulario, `readonly`, nunca `disabled` en un `FormGroup` que se envía: un control deshabilitado no
viaja en `value`.

**2. El cliente no es la fuente de verdad** (D-08). `Validators` solo para lo que mejora la
experiencia y no contradice al servidor: requerido, longitud mínima de la clave, número positivo,
fecha no futura. **No** se replica V1–V5 como bloqueo, ni el patrón de placa (configurable en el
servidor, D-24): a lo sumo se normaliza a mayúsculas.

**3. El mensaje del servidor, literal y en su lugar.** Ningún texto de error del dominio se escribe
en el cliente: si el formulario necesita mostrar algo antes de enviar, usa un texto propio de la
interfaz («Campo obligatorio»), nunca el del criterio.

**4. Sin `[(ngModel)]` en formularios reactivos.** Formularios tipados (`FormGroup<{…}>`,
`nonNullable`).

## Pintar un `ErrorApi` (skill `frontend-http-sesion`)

```typescript
function aplicarError(form: FormGroup, error: ErrorApi): void {
  for (const campo of error.camposObligatorios) form.get(campo)?.setErrors({ servidor: 'Obligatorio' });
  for (const [campo, texto] of Object.entries(error.camposConError)) form.get(campo)?.setErrors({ servidor: texto });
  // inconsistencias: se pintan con aviso-inconsistencia junto a su campo, no como error del control
}
```

- `mensaje` siempre visible arriba del formulario (o en el diálogo).
- `detalles.campos` → cada control listado marcado como obligatorio.
- `detalles.<campo>` (DRF) → texto bajo el control.
- `detalles.inconsistencias` → `aviso-inconsistencia` junto al control de su `campo`, con su
  `mensaje`; si `exige_justificacion`, una `caja-justificacion` que escribe en
  `justificaciones[regla]`.
- `justificaciones_faltantes` → resalta las cajas vacías que el servidor reclama.
- El error del servidor se limpia del control cuando el usuario lo modifica.

## Justificaciones y motivos

| Formulario | Campo | Forma |
|---|---|---|
| Registro y corrección | `justificaciones` | `{"V1": "…", "V4": "…"}` por regla |
| Destare | `justificaciones` | `{"ING-2027-00001": "…"}` por código de ingreso |
| Corrección, reversión, anulación | `motivo` | Texto obligatorio; el servidor lo exige con su mensaje |
| Tara del vehículo | `motivo` | Ídem |
| Asignar otro mineral al lote | `autorizacion` | Obligatoria solo si se eligió un ingreso de otro mineral |

El motivo se pide en el mismo formulario, no en un segundo diálogo.

## Teclado y formato

| Campo | Atributos |
|---|---|
| Pesos, tara, capacidad, horas de molino | `inputmode="decimal"`, se envían como cadena con punto |
| RUC, cantidad de bigbags | `inputmode="numeric"` |
| Placa | `autocapitalize="characters"`, se normaliza a mayúsculas |
| Fracciones | Texto libre (`1/3`, `0.5`); la suma se muestra en vivo (RNF-M06-10) |
| Fechas y horas | `mat-datepicker` y `type="time"`; nunca futuras en apertura de lote, etapas y destare |

Campos y botones de al menos 44 px en teléfono; una columna a 360 px.

## Solo enviar lo que cambió

La corrección (`PATCH ingresos/{id}/`) y las ediciones del catálogo y de usuarios envían **solo**
los campos modificados (`form.controls[k].dirty`). Sin cambios, se deja que el servidor responda «No
hay cambios que guardar» o se deshabilita «Guardar» hasta que haya uno.

## Formularios compartidos

`formulario-vehiculo` y `formulario-tipo-mineral` viven en `shared/components/` porque los usan el
catálogo y el registro. Reciben el modo (`alta`, `edicion`, `desdeRegistro`) y el `ErrorApi` por
`input()`, y emiten el cuerpo con `output()`. La página que los aloja hace el `POST`.

## Verificación

- [ ] Ningún valor asignado por el servidor se envía.
- [ ] Provocado cada rechazo de la fase, el texto exacto aparece en su lugar.
- [ ] Las inconsistencias se ven junto a su campo y todas a la vez.
- [ ] A 360 px no hay desplazamiento horizontal y el teclado correcto aparece en el teléfono.
