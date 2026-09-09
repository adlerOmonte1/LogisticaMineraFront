---
name: frontend-formularios
description: Implementa formularios reactivos del frontend Angular — el alta de ingreso de M03 y las demás altas y ediciones, con validaciones, campos calculados, mensajes de error del servidor y borrador persistido. Úsala al crear o modificar cualquier formulario, al tratar validación, FormGroup, campos calculados como el peso neto, teclado numérico, o cuando un campo no llegue al backend.
---

# Formularios reactivos

Carga antes `contexto-frontend`. El formulario de ingreso (M03) es la pantalla de la que dependen I1
e I2: lo que sigue se escribió pensando en ella, y aplica a las demás.

## Las cuatro reglas que se rompen siempre

**1. Los campos calculados son `readonly`, nunca `disabled`.** Un control deshabilitado **no viaja en
el payload** de un formulario reactivo. Es un error que rompe el alta sin dar señal clara: el
servidor responde que falta un campo obligatorio que en pantalla se ve lleno.

```typescript
this.form.controls.pesoNetoTn.disable();          // MAL: no llega al servidor
<input formControlName="pesoNetoTn" readonly>     // BIEN
```

**2. Las validaciones del cliente no son la fuente de verdad** (D-08). Duplica en `Validators` lo que
mejora la experiencia, pero un registro que entra por la cola de M07 no pasa por este formulario: la
regla autoritativa está en el modelo del backend. Si una validación existe **solo** aquí, no existe.

**3. Los mensajes de error del servidor se muestran literales**, en el campo que indica
`detalles.campo`. Ese texto coincide con el criterio de aceptación de la historia. No lo reformules,
no lo traduzcas, no lo metas en un cuadro genérico.

**4. Nada de `[(ngModel)]` en formularios reactivos.** Mezclar las dos APIs produce estados
inconsistentes que se manifiestan como campos que «a veces» no se envían.

## El formulario de ingreso, requisito por requisito

| Requisito | Implementación |
|---|---|
| RNF-M03-03: completable en menos de 90 s | Cada campo se paga en ese cronómetro. Antes de añadir uno, pregunta qué historia lo exige |
| RNF-M03-04: teclado numérico | `inputmode="decimal"` en pesos; `type="number"` no basta en todos los navegadores |
| RNF-M03-05: 5 pulgadas sin desplazamiento horizontal | Una columna, campos a ancho completo. Verifícalo a 360 px |
| RNF-M03-06: borrador persistido | Guarda en IndexedDB con cada `valueChanges`; limpia al confirmar |
| Catálogos sin red | Producto y vehículo desde caché, no desde una petición al abrir |

El borrador no es comodidad: si el formulario pierde los datos al caerse la conexión, el supervisor
vuelve al papel y la latencia regresa a los valores del pretest. Eso es el indicador I1 degradándose
por una decisión de interfaz.

## Hora de pesaje y hora de registro

`horaPesaje` la escribe el usuario copiándola del ticket de balanza. `horaRegistro` **no está en el
formulario**: la asigna el servidor (D-01). No la muestres como campo editable ni la envíes; si
aparece en el payload, el backend la rechaza.

En captura sin conexión lo que se envía es `horaCapturaLocal` (D-03), y lo pone la cola, no el
formulario. Ver `frontend-offline-pwa`.

## Estructura

El formulario vive en `pages/` porque tiene estado y orquesta; los campos repetidos que extraigas van
a `ui/` y reciben el `FormControl` por `input()`. Un componente de `ui/` que inyecte el servicio del
feature está mal ubicado.

## Verificación

- [ ] Ningún control calculado usa `disabled`.
- [ ] Los errores del servidor aparecen en su campo, con el texto exacto de la API.
- [ ] El formulario abre y se completa **sin red**, con los catálogos en caché.
- [ ] El borrador sobrevive a recargar la página.
- [ ] A 360 px de ancho no hay desplazamiento horizontal.
