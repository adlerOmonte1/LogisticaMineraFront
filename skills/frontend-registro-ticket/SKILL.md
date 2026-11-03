---
name: frontend-registro-ticket
description: Implementa el registro de un ingreso de mineral en el frontend — captura del ticket con la cámara, reducción de la imagen con canvas, registro sin foto con motivo, borrador firmado del servidor, pantalla de revisión única con campos reconocidos y su confianza, hora propuesta, inconsistencias V1 a V5 y su justificación, alta del vehículo y del tipo de mineral en panel, confirmación, destare y conservación del borrador en IndexedDB ante pérdida de conexión. Úsala al tocar features/ingresos, core/services/borrador-registro, la captura o la revisión, y cuando se mencione ticket, foto, cámara, reconocimiento, confianza, borrador, sin foto, destare, sin conexión o pérdida de señal.
---

# Registro del ingreso desde el ticket (FB3)

Carga antes `contexto-frontend` y `frontend-formularios`. Contrato: `docs/contrato-api.md` §4.
Pantallas: `docs/pantallas.md` §4.3. Es la pantalla crítica: de ella dependen T01, T02 y los
indicadores I1 a I3. Cada toque de más es tiempo de registro.

> Esta skill reemplaza a `frontend-offline-pwa`. La captura sin conexión con cola de sincronización
> salió del alcance (DR-01, D-F07). Lo único que sobrevive es **conservar el borrador** (RNF-M03-05).

## El flujo

```
Paso 1 Captura ──POST ingresos/borradores/ (multipart)──► Paso 2 Revisión ──POST ingresos/──► Paso 3 Confirmado
     │                                                         │
     └── «Registrar sin foto» + motivo ────────────────────────┘
```

Una ruta (`/ingresos/registrar`), una página con tres pasos en un `signal<'captura' | 'revision' |
'confirmado'>`. No son tres rutas: volver atrás no debe perder nada.

## Paso 1 · Captura

```html
<input type="file" accept="image/jpeg,image/png" capture="environment" (change)="alElegir($event)">
```

- `capture="environment"` abre la cámara trasera sin pantalla intermedia (RNF-M03-07). En escritorio,
  además, arrastrar y soltar.
- **Reducir antes de enviar** (RNF-M03-04) con `shared/utils/reducir-imagen.ts`: `createImageBitmap`
  (respeta la orientación EXIF), `canvas` con el lado mayor a 1600 px, `toBlob('image/jpeg', 0.8)`.
  Verificar sobre tickets reales que el texto sigue legible; si no, subir el lado o la calidad.
- Archivo que no es JPG ni PNG, o de más de 10 MB antes de reducir: no se envía; el texto del aviso
  es el que devuelve el servidor para ese caso, guardado al provocarlo (nunca escrito a mano).
- **«Registrar sin foto»** en la misma pantalla (RNF-M03-17): lista cerrada de motivos
  (`TICKET_EXTRAVIADO`, `SIN_CAMARA`, `BALANZA_SIN_TICKET`, `OTRO`) con los textos de la HU.
- Mientras el servidor reconoce: progreso visible y la imagen ya guardada en el borrador local.
- La **hora de inicio del registro la pone el servidor** al recibir la imagen (D-01); el cliente no
  envía ninguna marca de tiempo.

## Paso 2 · Revisión — una sola pantalla

Imagen ampliable al lado (o arriba en teléfono) con `visor-imagen-protegida` sobre el `Blob` local.

| Elemento | Origen | Regla |
|---|---|---|
| Placa, fecha, peso bruto | `propuesta` + `reconocimiento.campos` | `campo-confianza`: confianza visible; si `dudoso`, resaltado con icono **y** el `aviso` literal (HU-M04-01 CA02, RNF-M04-09). Sin lectura: vacío y editable |
| Aviso del reconocimiento | `reconocimiento.aviso` | Ilegible o motor caído: se muestra y se sigue a mano (CA04, CA05) |
| Hora del pesaje | `propuesta.hora` | Junto a la fecha, marcada «propuesta: ajústela a la del pesaje» (CA10). El navegador no la calcula |
| Tipo de mineral | Caché del catálogo | Solo activos. Alta en panel si `puede_agregar_tipo_mineral`; si no, `aviso_tipo_mineral` |
| Vehículo | `vehiculo`, `aviso_placa` | Placa nueva o de baja: el aviso literal; placa nueva → `formulario-vehiculo` en panel. Al guardar, el registro sigue con todo (RNF-M03-13) |
| Tara y peso neto | `vehiculo.tara_tn` | Referencia de solo lectura; el neto mostrado es vista previa (bruto − tara). Sin tara: aviso de que quedará En proceso |
| Tipo de vehículo | `vehiculo.titularidad` | Texto, derivado del catálogo |
| Inconsistencias | `inconsistencias` | Junto a su `campo`, todas a la vez, con su `mensaje`; `exige_justificacion` → caja de justificación (V1, V4) |

Reglas de la revisión:

- **Nada está persistido** (D-13). Solo el borrador local.
- Al cambiar un dato señalado, su inconsistencia se marca «por revalidar»; la revalidación real es
  la del `POST` al confirmar (D-F19). El cliente puede anticipar V2 y V5 como ayuda, sin bloquear.
- Si el usuario cambia la placa, el vehículo mostrado deja de valer: se busca con
  `GET catalogo/vehiculos/?placa=` para refrescar tara y titularidad de referencia.

## Confirmar

```json
POST ingresos/
{ "borrador": "<token>", "placa": "…", "fecha": "AAAA-MM-DD", "hora": "HH:MM",
  "peso_bruto_tn": "32.40", "tipo_mineral": 3, "justificaciones": { "V4": "…" } }
```

| Respuesta | Qué hace la pantalla |
|---|---|
| 201 | Paso 3 con el `mensaje`, código y estado; descarta el borrador local |
| 400 `INCONSISTENCIAS` | Repinta **todas** las de `detalles`, resalta las justificaciones faltantes, queda en la revisión |
| 400 `CAMPOS_OBLIGATORIOS` | Marca `detalles.campos` |
| 400 borrador inválido | Mensaje literal; ofrece volver a capturar (el borrador local se conserva hasta entonces) |
| 409 borrador ya registrado | Descarta el borrador local y abre el detalle del ingreso ya registrado |
| Sin red / 5xx | Aviso; todo sigue en el borrador; el usuario reintenta cuando quiera |

## El borrador (D-F15)

`core/services/borrador-registro.service.ts` sobre IndexedDB con `idb`:

```typescript
interface BorradorLocal {
  usuarioId: number;
  paso: 'captura' | 'revision';
  imagen?: Blob;                 // solo hasta recibir el token
  sinFoto?: { motivo: MotivoSinFoto };
  respuesta?: RespuestaBorrador; // lo que devolvió POST ingresos/borradores/
  campos: CamposEditables;       // placa, fecha, hora, peso_bruto_tn, tipo_mineral
  justificaciones: Record<string, string>;
  actualizado: string;           // ISO, para mostrar «borrador de hace 5 min»
}
```

- Se guarda en cada cambio (con `debounceTime` corto) y al ocultarse la página.
- Al abrir `/ingresos/registrar` con un borrador del mismo usuario: «Tiene un registro en curso —
  Continuar / Descartar».
- **Nunca se envía solo.** No hay reintento automático ni envío en segundo plano: el ingreso siempre
  lo confirma una persona contra el servidor (guía del frontend §5.3).
- El token del borrador no vence (D-25): retomar al día siguiente es válido; el servidor decide.
- Al cerrar sesión, se descarta si es de otro usuario.

## Destare (`/ingresos/destares`)

- `GET ingresos/` = pendientes de destare (no es un listado general). Agrupados por `vehiculos`.
  Vacío: el `mensaje` del servidor.
- Elegir vehículo → tara (`inputmode="decimal"`), fecha/hora del destare (no futura), y para cada
  ingreso cuyo neto quedaría fuera de rango, una caja de justificación **por código de ingreso**.
- Resultado: el `mensaje` y la lista de ingresos que pasan a Registrado con su neto.

## Verificación de la fase

- [ ] Ticket legible, ilegible y motor caído en un teléfono real.
- [ ] Placa nueva: el panel del vehículo no pierde la foto ni los campos.
- [ ] Las diez inconsistencias sembradas (2 por regla) aparecen junto a su campo.
- [ ] Modo avión a mitad de la revisión, recarga, vuelve todo, se confirma sin volver a fotografiar.
- [ ] Confirmar dos veces el mismo borrador lleva al detalle del ya registrado.
- [ ] Registro completo en vertical, con una mano, a 360 px.
- [ ] T01 y T02 cronometradas y anotadas en `docs/bitacora-fases.md`.
