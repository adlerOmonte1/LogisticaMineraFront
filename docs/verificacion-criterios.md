# Verificación de los criterios de aceptación en la interfaz

**Documento:** propio de este repositorio. Anexo de [`plan-implementacion.md`](plan-implementacion.md).
Dice, para cada criterio de aceptación de las 27 historias, **qué hay que ver en la interfaz** para
darlo por cubierto, en qué fase y con qué tipo de verificación. Es la lista que se marca en cada
puerta.
**No duplica:** el texto del criterio ni el mensaje esperado. Se leen en
`../LogisticaMinera/docs/modulos/M{nn}-*/HU.md` o en el Anexo A de `PLAN_IMPLEMENTACION.md` del
backend. Aquí solo está la parte del cliente.
**Total:** 277 criterios.

## Cómo se lee

| Tipo | Significado | Cómo se verifica |
|---|---|---|
| **I** | Criterio de **interfaz**: solo el cliente puede cerrarlo | Recorrido manual; captura en la bitácora |
| **AI** | API **e** interfaz: el servidor lo cumple y la pantalla debe reflejarlo | Recorrido manual con el caso del criterio |
| **M** | El servidor rechaza o informa con un mensaje literal; la pantalla debe mostrarlo **en su lugar** | Provocar el caso y ver el texto exacto donde corresponde |
| **R** | Restricción de rol: el servidor responde 403; la pantalla **no ofrece** la acción | Ver que la opción no aparece; forzarla da «Acción no autorizada» |
| **S** | Comportamiento solo del servidor (auditoría, transacción, cálculo) | Se observa de forma indirecta donde se indique, o no aplica al cliente |

**Estado:** ⬜ pendiente · ✅ verificado en la puerta · ⚠️ observado (ver bitácora). La columna se
llena al cerrar cada puerta; un criterio **S** sin observación indirecta se marca ✅ con «servidor».

---

## M01 — Autenticación y roles

### HU-M01-01 · Inicio y cierre de sesión — FB1

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | Tras el login, cada rol llega a `/inicio` y ve su menú | ✅ |
| CA02 | M | Mensaje en el formulario, **sin** marcar usuario ni contraseña como el campo erróneo | ✅ |
| CA03 | M | Al sexto intento, mensaje de bloqueo (423) en el formulario | ⬜ |
| CA04 | M | Cuenta inactiva: mensaje literal en el formulario | ⬜ |
| CA05 | AI | «Cerrar sesión» invalida el refresh y vuelve a `/login`; «atrás» no muestra datos | ✅ |
| CA06 | M | Con la sesión vencida, la siguiente acción lleva a `/login` mostrando el mensaje de expiración | ✅ |
| CA07 | S | Visible en FB4: eventos `INICIAR_SESION` y `CERRAR_SESION` en la auditoría | ⬜ |
| CA08 | **I** | «¿Olvidó su contraseña?» muestra el aviso sin pedir ni revelar el usuario | ✅ |
| CA09 | M | Con clave temporal solo se ofrece `/cuenta/clave`; cualquier otra ruta vuelve ahí | ✅ |

### HU-M01-02 · Gestión de usuarios — FB1

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | El alta pide nombres, apellidos, usuario, contraseña y rol; el nuevo aparece activo | ✅ |
| CA02 | M | Usuario repetido: mensaje en el formulario del alta | ⬜ |
| CA03 | AI | Desactivar con confirmación; mensaje literal; la fila pasa a inactiva y sale de la vista por defecto | ✅ |
| CA04 | R | Administración no aparece para Administrativo ni Supervisor | ✅ |
| CA05 | AI | Cambio de clave correcto: mensaje y vuelta al login | ✅ |
| CA06 | M | Clave actual errónea: mensaje en el formulario | ⬜ |
| CA07 | M | Clave nueva corta: mensaje en el formulario | ⬜ |
| CA08 | AI | La clave temporal se muestra una sola vez, con copiar; al cerrar no se recupera | ✅ |
| CA09 | M | Desactivarse a sí mismo: mensaje literal (la acción puede ofrecerse; el servidor decide) | ✅ |
| CA10 | AI | Reactivar desde «mostrar inactivos»; mensaje literal | ✅ |
| CA11 | M | Repetición distinta: mensaje literal | ✅ |

### HU-M01-03 · Control de acceso por rol — FB1 (se reconfirma en cada fase)

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | **I** | Menú del Supervisor exactamente como `pantallas.md` §2 | ✅ |
| CA02 | R | Ruta forzada fuera del rol: pantalla «Acción no autorizada» del armazón | ✅ |
| CA03 | S | Tras cambiar el rol, el menú se corrige en el siguiente login (riesgo aceptado, ver FB1) | ⬜ |
| CA04 | S | Visible en FB4: eventos `ACCESO_RECHAZADO` | ⬜ |
| CA05 | AI | El Supervisor da de alta un vehículo desde el registro (FB3) | ⬜ |
| CA06 | R | Cerrar lote no aparece para Administrativo ni Supervisor (FB5) | ⬜ |

---

## M02 — Catálogo maestro

### HU-M02-01 · Vehículos — FB2 (CA07 y CA12 en FB3)

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | Alta con placa, titularidad y capacidad; aparece activo | ✅ |
| CA02 | M | Placa repetida: mensaje bajo la placa o en el formulario | ⬜ |
| CA03 | M | Formato inválido: mensaje literal (el cliente no bloquea por su cuenta) | ⬜ |
| CA04 | M | EXTERNO sin transportista: mensaje; el selector de transportista aparece solo con EXTERNO | ✅ |
| CA05 | AI | PROPIO guarda sin transportista | ✅ |
| CA06 | AI | Baja con ingresos: mensaje literal; la fila queda inactiva | ✅ |
| CA07 | AI | Un vehículo de baja no se asocia: el registro muestra `aviso_placa` de baja (FB3) | ✅ |
| CA08 | AI | El nuevo aparece «Pendiente de destare» | ✅ |
| CA09 | R | «Modificar tara» solo para el Administrador | ✅ |
| CA10 | M | Sin motivo: mensaje en el diálogo de tara | ⬜ |
| CA11 | AI | Con motivo, la tara cambia; el historial (FB4) muestra antes, después y motivo | ⬜ |
| CA12 | AI | Alta desde el registro en panel, sin perder la captura; vuelve con el vehículo asociado (FB3) | ✅ |
| CA13 | AI | Reactivar: mensaje literal; vuelve a ofrecerse en el registro | ✅ |
| CA14 | R | Supervisor sin editar, dar de baja ni reactivar; sí alta desde el registro | ✅ |

### HU-M02-02 · Tipos de mineral — FB2 (CA04, CA07, CA08 en FB3)

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | Alta con código y nombre; aparece activo | ✅ |
| CA02 | M | Código repetido: mensaje literal | ⬜ |
| CA03 | AI | Baja con ingresos: mensaje literal | ✅ |
| CA04 | AI | Un tipo desactivado no aparece en el selector del registro | ✅ |
| CA05 | M | Nombre repetido: mensaje literal | ⬜ |
| CA06 | M | Código fuera de 2–6 caracteres: mensaje literal | ⬜ |
| CA07 | AI | Alta rápida desde el registro sin código: queda elegido en el ingreso | ✅ |
| CA08 | M | Alta rápida sin nombre: mensaje en el panel | ✅ |
| CA09 | AI | Reactivado, vuelve a ofrecerse en el registro y en la apertura de lotes | ⬜ |
| CA10 | R | Supervisor sin acciones de catálogo | ✅ |

### HU-M02-03 · Transportistas — FB2

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | Alta con razón social y RUC; aparece activo | ✅ |
| CA02 | M | RUC que no tiene 11 dígitos: mensaje literal; campo con teclado numérico | ⬜ |
| CA03 | AI | Baja con vehículos: mensaje literal | ⬜ |
| CA04 | M | RUC repetido: mensaje literal | ⬜ |
| CA05 | AI | Reactivado, vuelve al selector del vehículo externo | ⬜ |
| CA06 | R | Supervisor sin acciones | ✅ |

---

## M03 — Registro de ingresos — FB3

### HU-M03-01 · Registro a partir del ticket

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | Confirmación con tara: paso 3 con el código y el `mensaje` | ✅ |
| CA02 | M | Sin imagen y sin «sin foto» no se puede avanzar; si el borrador es inválido, mensaje literal | ✅ |
| CA03 | M | Campos faltantes: `mensaje` arriba y cada campo de `detalles.campos` marcado | ✅ |
| CA04 | AI | `aviso_placa` visible y el alta del vehículo en la misma pantalla | ✅ |
| CA05 | AI | Sin tara: aviso previo de «En proceso» y `mensaje` con el código y la placa | ✅ |
| CA06 | AI | Bloqueante o advertencia sin justificar: rechazo con mensaje y todas las inconsistencias junto a su campo | ✅ |
| CA07 | M | Formato o tamaño no admitido: mensaje literal en la zona de captura | ✅ |
| CA08 | AI | Peso neto y tara solo de lectura en revisión y detalle | ✅ |
| CA09 | AI | Detalle: pesaje, inicio y fin del registro como tres valores distintos, no editables | ✅ |
| CA10 | AI | Hora propuesta por el servidor, señalada como propuesta y editable | ✅ |
| CA11 | S | Observable en FB3: pestaña Reconocimiento con leído y confirmado; Ticket con la imagen | ⬜ |
| CA12 | S | — | ⬜ |
| CA13 | M | Vehículo de baja: mensaje literal y confirmación impedida | ✅ |
| CA14 | AI | Alta del tipo de mineral en panel (Administrativo, Administrador); queda elegido | ✅ |
| CA15 | AI | Supervisor: sin alta; se muestra `aviso_tipo_mineral` | ✅ |
| CA16 | AI | «Registrar sin foto» en la pantalla de captura, motivo de lista cerrada | ✅ |
| CA17 | AI | Marca «sin respaldo fotográfico» con motivo en toda lista (FB6) y en el detalle | ✅ |

### HU-M03-02 · Corrección

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | Corregir con motivo: `mensaje` y neto recalculado en el detalle | ✅ |
| CA02 | M | Sin motivo: mensaje literal | ✅ |
| CA03 | M | Valor que incumple una regla: mensaje literal junto al campo | ⬜ |
| CA04 | AI | El formulario no ofrece código, marcas de tiempo, tara ni neto | ✅ |
| CA05 | M | Ingreso anulado: el detalle no ofrece corregir; forzado, mensaje literal | ⬜ |
| CA06 | R | Supervisor sin «Corregir» | ✅ |
| CA07 | S | Visible en FB4: historial con antes, después y motivo | ⬜ |
| CA08 | AI | Placa de vehículo sin tara: el ingreso vuelve a En proceso en el detalle | ⬜ |
| CA09 | M | Mineral fuera de la lista del lote: mensaje literal (FB5) | ⬜ |
| CA10 | M | Sin cambios: mensaje literal | ✅ |
| CA11 | S | Visible en FB5–FB7: lote, consolidado y trazabilidad con el valor corregido | ⬜ |
| CA12 | AI | «Revertir corrección» desde el detalle (y desde el historial); `mensaje` literal | ✅ |
| CA13 | M | Corrección no última: mensaje literal | ⬜ |
| CA14 | M | Reversión que incumple una regla: mensaje literal | ⬜ |

### HU-M03-03 · Anulación

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | Anular con motivo: `mensaje` y estado Anulado | ✅ |
| CA02 | M | Sin motivo: mensaje literal | ✅ |
| CA03 | M | Ya anulado: la acción no se ofrece; forzada, mensaje literal | ⬜ |
| CA04 | R | Solo el Administrador ve «Anular» | ✅ |
| CA05 | AI | Detalle del anulado: datos, imagen, estado, motivo y responsable | ✅ |
| CA06 | S | Visible en FB6–FB7: los totales no lo incluyen | ⬜ |
| CA07 | S | Visible en FB4 | ⬜ |
| CA08 | S | Visible en FB5: el ingreso sale del lote | ⬜ |

### HU-M03-04 · Destare

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | Destare válido: `mensaje` y lista de ingresos que pasan a Registrado con su neto | ✅ |
| CA02 | M | Sin tara: mensaje literal | ⬜ |
| CA03 | M | Tara ≥ bruto: mensaje literal | ✅ |
| CA04 | M | Neto fuera de rango: caja de justificación por ingreso; sin ella, mensaje literal | ✅ |
| CA05 | M | Vehículo con tara: mensaje literal | ⬜ |
| CA06 | AI | Lista con código, placa, fecha del pesaje y peso bruto; se elige el vehículo | ✅ |
| CA07 | AI | Varios En proceso del mismo vehículo se resuelven a la vez | ✅ |
| CA08 | S | Visible en FB4 | ⬜ |
| CA09 | M | Fecha futura: mensaje literal | ⬜ |
| CA10 | M | Sin pendientes: `mensaje` del listado como estado vacío | ✅ |

---

## M04 — Reconocimiento automático — FB3

### HU-M04-01 · Reconocimiento del ticket

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | Tres campos precargados con su confianza visible | ✅ |
| CA02 | **I** | Campo bajo el umbral resaltado **con icono y texto**, no solo color, con el `aviso` literal | ✅ |
| CA03 | AI | Campo sin lectura: vacío y editable | ✅ |
| CA04 | M | Imagen ilegible: `reconocimiento.aviso` y continuación manual | ✅ |
| CA05 | M | Motor caído: `reconocimiento.aviso` y continuación manual | ⬜ |
| CA06 | S | Nada se guarda hasta confirmar (el cliente no hace `POST ingresos/` antes) | ⬜ |
| CA07 | S | Visible en la pestaña Reconocimiento | ⬜ |
| CA08 | AI | Sin foto: no hay bloque de confianza en la revisión | ✅ |

### HU-M04-02 · Reconocido frente a confirmado

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | Pestaña Reconocimiento: tres filas con reconocido, confirmado y confianza | ✅ |
| CA02 | AI | Campo corregido señalado | ✅ |
| CA03 | AI | Sin reconocimiento: se indica y se muestra el motivo | ✅ |
| CA04 | AI | Supervisor: solo lectura, sin «Corregir» (`puede_corregir_ingreso`) | ✅ |
| CA05 | AI | Motor y versión visibles | ✅ |
| CA06 | S | Sin sesión, el interceptor lleva al login | ⬜ |

---

## M05 — Validación automática — FB3

### HU-M05-01 · Detección y resolución de inconsistencias

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | Bloqueante señalada junto a su campo con el mensaje literal | ✅ |
| CA02 | M | V4 sin justificar: mensaje literal y caja de justificación | ✅ |
| CA03 | AI | Con justificación, registra; la pestaña Validación la muestra | ✅ |
| CA04 | AI | Corregido el dato, la alerta desaparece tras la respuesta del servidor | ⬜ |
| CA05 | AI | Varias inconsistencias a la vez se muestran todas | ✅ |
| CA06 | AI | Sin inconsistencias: ninguna alerta y «Confirmar» habilitado | ✅ |
| CA07 | S | — | ⬜ |
| CA08 | S | Visible en la pestaña Validación | ⬜ |
| CA09 | AI | Un campo vacío se reclama como obligatorio, no como inconsistencia | ✅ |
| CA10 | M | V1 sin justificar: mensaje literal y caja de justificación | ✅ |
| CA11 | AI | Sin tara: V2 y V4 no aparecen en la revisión | ⬜ |
| CA12 | AI | Sin foto: las inconsistencias se muestran igual | ✅ |
| CA13 | S | — | ⬜ |

---

## M06 — Trazabilidad — FB5

### HU-M06-01 · Lotes

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | Abrir lote: `mensaje` y el lote en la lista como Abierto | ✅ |
| CA02 | M | Nombre repetido: mensaje literal | ⬜ |
| CA03 | M | Apertura futura: mensaje literal (el selector de fecha tampoco ofrece futuro) | ⬜ |
| CA04 | AI | Tras asignar, totales del lote y de cada mineral | ✅ |
| CA05 | AI | Ingresos de otro mineral agrupados en «Agregar de otro tipo de mineral» | ✅ |
| CA06 | M | Anulado: mensaje literal | ⬜ |
| CA07 | M | En proceso: mensaje literal | ⬜ |
| CA08 | AI | Traslado entre lotes reflejado en ambos | ⬜ |
| CA09 | M | Ya zarandeado o molido: mensaje literal | ⬜ |
| CA10 | AI | Iniciar recorrido: `mensaje` y estado En recorrido | ✅ |
| CA11 | M | Sin ingresos: mensaje literal | ⬜ |
| CA12 | AI | Tardío antes del secado: señalado como tardío | ⬜ |
| CA13 | AI | Tardío después del secado: señalado con secado propio y su acción en «Siguiente paso» | ⬜ |
| CA14 | M | Sin selección: mensaje literal | ⬜ |
| CA15 | R | Supervisor sin abrir, asignar, retirar ni iniciar | ✅ |
| CA16 | AI | Estado, composición con código, fecha y neto, tardíos señalados, total de toneladas | ✅ |
| CA17 | AI | «Agregar otro mineral»: su grupo aparece vacío | ⬜ |
| CA18 | M | Mineral ya en el lote: mensaje literal | ⬜ |
| CA19 | M | Quitar mineral con ingresos: mensaje literal | ⬜ |
| CA20 | M | Otro mineral sin autorización: mensaje literal; el campo se pide antes de enviar | ✅ |
| CA21 | AI | Ingreso de otro mineral marcado «Otro mineral» con la autorización | ✅ |
| CA22 | AI | Retirar devuelve a cancha y recalcula totales | ⬜ |
| CA23 | M | Único ingreso en recorrido: mensaje literal | ⬜ |

### HU-M06-02 · Paso por una etapa

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | «Siguiente paso» registra y muestra el `mensaje` con el nombre del lote o la parte | ✅ |
| CA02 | M | Tras el secado se pide la ruta (`elegir_ruta`); forzado sin ruta, mensaje literal | ✅ |
| CA03 | M | Solo se ofrece la etapa que corresponde; forzada otra, mensaje literal | ⬜ |
| CA04 | M | Etapa repetida: mensaje literal | ⬜ |
| CA05 | M | Lote Abierto: no hay «Siguiente paso»; forzado, mensaje literal | ✅ |
| CA06 | M | Fecha futura: mensaje literal | ⬜ |
| CA07 | M | Fecha anterior a la etapa previa: mensaje literal | ⬜ |
| CA08 | M | Fecha anterior al inicio: mensaje literal | ✅ |
| CA09 | M | Ruta completa: sin «Siguiente paso» para esa carga | ✅ |
| CA10 | M | Horas ≤ 0: mensaje literal; válidas: se muestran las t/h | ✅ |
| CA11 | AI | Ensacado con bigbags: peso aproximado por bigbag mostrado como estimación | ✅ |
| CA12 | M | Todo ensacado sin «Recalcular»: mensaje literal y la opción visible | ⬜ |
| CA13 | M | Bigbags sin ensacado: la acción solo aparece con el ensacado | ⬜ |
| CA14 | AI | Secado propio del tardío con su reparto | ⬜ |
| CA15 | M | Lote cerrado: sin acciones; forzadas, mensaje literal | ⬜ |
| CA16 | S | Visible en el recorrido (usuario) y en FB4 | ⬜ |

### HU-M06-03 · Trazabilidad de un ingreso

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | Pestaña Trazabilidad: etapas de la ruta con completadas, fecha y responsable | ✅ |
| CA02 | AI | Sin lote: el `mensaje` correspondiente | ⬜ |
| CA03 | AI | «Proceso completo» visible | ✅ |
| CA04 | AI | «x de y etapas» visible | ✅ |
| CA05 | AI | Ingreso anulado señalado | ⬜ |
| CA06 | AI | Cada parte con su ruta; la proporción sobre la unión | ⬜ |
| CA07 | AI | Secado recorrido y «ruta por decidir», sin proporción | ⬜ |
| CA08 | AI | Lote cerrado: destino y fecha del cierre | ⬜ |

### HU-M06-04 · División por fracciones

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | División válida: `mensaje` y partes en el detalle | ⬜ |
| CA02 | M | Parte incompleta: mensaje literal | ⬜ |
| CA03 | M | Nombres repetidos: mensaje literal | ⬜ |
| CA04 | M | Fracciones que no suman: la pantalla avisa antes y el servidor responde con su mensaje | ⬜ |
| CA05 | M | Más de seis partes: el formulario no deja agregar la séptima; forzado, mensaje literal | ⬜ |
| CA06 | M | Ya dividido: la acción no se ofrece; forzada, mensaje literal | ⬜ |
| CA07 | M | Ya avanzó: mensaje literal | ⬜ |
| CA08 | AI | Partes con fracción, ruta y toneladas aproximadas **señaladas como estimación** | ⬜ |
| CA09 | M | Reparto del tardío: fracciones propuestas y editables; si no suman, mensaje literal | ⬜ |
| CA10 | R | Supervisor sin «Dividir» | ⬜ |

### HU-M06-05 · Cierre con destino

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | Cierre: `mensaje` con el destino; lote Cerrado con fecha y responsable | ✅ |
| CA02 | M | Con pendientes: mensaje con la lista | ⬜ |
| CA03 | M | Sin destino: mensaje literal | ⬜ |
| CA04 | M | Ya cerrado: sin acción; forzada, mensaje literal | ⬜ |
| CA05 | R | Solo el Administrador ve «Cerrar» y «Cierre de lotes» | ⬜ |
| CA06 | AI | Confirmación con el resumen y la diferencia **como estimación** | ✅ |
| CA07 | M | Lote cerrado: ninguna acción de composición ni de etapa | ✅ |
| CA08 | S | Visible en FB4 | ⬜ |

---

## M07 — Consulta — FB6 (el detalle, desde FB3)

### HU-M07-01 · Consulta por placa y fecha

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | Resultados del vehículo en la fecha, del más reciente al más antiguo | ✅ |
| CA02 | AI | Placa parcial devuelve todas las que la contienen | ✅ |
| CA03 | **I** | Al abrir un resultado: imagen del ticket junto a los datos, ampliable | ✅ |
| CA04 | M | Sin resultados: `mensaje` como estado vacío | ✅ |
| CA05 | AI | Anulado incluido, señalado y con motivo | ⬜ |
| CA06 | M | Sin criterios: mensaje literal | ✅ |
| CA07 | AI | Respaldo no disponible: datos y el mensaje en lugar de la imagen | ⬜ |
| CA08 | AI | En proceso: señalado, con bruto y neto «pendiente del destare» | ⬜ |
| CA09 | AI | Sin foto: motivo en lugar de la imagen | ⬜ |
| CA10 | AI | Con lote: lote, estado y recorrido | ⬜ |
| CA11 | AI | Sin lote: «espera en cancha» | ⬜ |
| CA12 | M | Rango inverso: mensaje literal | ✅ |

### HU-M07-02 · Listado y detalle

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | Rango de fechas: paginado y descendente | ✅ |
| CA02 | AI | Filtros combinados | ⬜ |
| CA03 | AI | Número de ingresos y toneladas del conjunto, sin anulados ni En proceso | ✅ |
| CA04 | AI | Detalle completo: datos, imagen, tres marcas, usuario, estado, tara | ✅ |
| CA05 | AI | Reconocimiento, validaciones y trazabilidad en su pestaña | ⬜ |
| CA06 | AI | Bloque ausente indicado con su `mensaje`, no omitido | ⬜ |
| CA07 | M | Rango inverso: mensaje literal | ⬜ |
| CA08 | AI | Sin fechas: mes en curso hasta hoy, y los filtros lo muestran | ✅ |
| CA09 | AI | Sin foto señalado en la fila | ✅ |
| CA10 | AI | Texto libre por placa o código | ⬜ |
| CA11 | M | Sin resultados: `mensaje` como estado vacío | ✅ |
| CA12 | **I** | Pestaña Historial en orden cronológico (FB4) | ✅ |
| CA13 | AI | Exportar descarga el CSV del conjunto completo, con el nombre del servidor | ✅ |
| CA14 | M | Exportar vacío: mensaje literal (leído del blob) | ✅ |
| CA15 | R | Supervisor sin «Exportar» | ⬜ |
| CA16 | AI | Cabecera: código o dígitos finales abren el detalle | ✅ |
| CA17 | AI | Cabecera: otro texto lleva a la consulta con esa placa | ⬜ |

### HU-M07-03 · Calendario

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | Mes en curso con ingresos y toneladas por día, como texto | ✅ |
| CA02 | AI | Día con anulados marcado con icono y texto | ✅ |
| CA03 | AI | Día con En proceso marcado con icono y texto | ✅ |
| CA04 | AI | Lista del día con hora, placa, código, mineral, neto y estado | ✅ |
| CA05 | M | Día vacío: `mensaje` | ⬜ |
| CA06 | AI | Navegar de mes recalcula días y resumen | ⬜ |
| CA07 | AI | Un ingreso del día abre su detalle | ⬜ |
| CA08 | AI | Total del mes = consolidado del mes (FB7) | ⬜ |

### HU-M07-04 · Inicio y avisos

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | Cuatro cifras del día | ✅ |
| CA02 | AI | «Sin contar n en proceso» bajo las toneladas | ✅ |
| CA03 | AI | Sin ingresos: cero y el `mensaje` | ⬜ |
| CA04 | AI | Barras de 7 días con la cifra legible; un día coincide con el calendario | ✅ |
| CA05 | AI | Un último ingreso abre su detalle | ⬜ |
| CA06 | AI | Aviso por cada pendiente de destare que lleva a `/ingresos/destares` | ⬜ |
| CA07 | AI | Administrador: «listo para cerrar» lleva a `/lotes/{id}/cerrar` | ⬜ |
| CA08 | AI | Supervisor sin avisos de cierre ni de ingresos sin lote | ⬜ |
| CA09 | M | Nada pendiente: `mensaje` | ⬜ |
| CA10 | AI | Tras el destare, el aviso desaparece al reabrir | ⬜ |
| CA11 | AI | Cifra sin permiso: sin enlace | ⬜ |

---

## M08 — Consolidación — FB7

### HU-M08-01 · Total mensual

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | Toneladas por cada tipo de mineral del periodo | ⬜ |
| CA02 | AI | Anulados fuera; `anulados_excluidos` visible | ⬜ |
| CA03 | M | Mes vacío: `mensaje` | ⬜ |
| CA04 | M | Futuro: el selector no lo ofrece; forzado, mensaje literal | ⬜ |
| CA05 | AI | Tras corregir un peso (FB3), el total cambia | ⬜ |
| CA06 | R | Supervisor sin Consolidación | ⬜ |
| CA07 | AI | `en_proceso_mensaje` visible | ⬜ |
| CA08 | S | — | ⬜ |
| CA09 | AI | `al_corte` visible en el mes en curso | ⬜ |
| CA10 | S | — | ⬜ |

### HU-M08-02 · Exportación

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | XLSX con total e ingresos por mineral | ⬜ |
| CA02 | M | Mes vacío: mensaje literal (leído del blob) | ⬜ |
| CA03 | AI | Archivo = pantalla, fila por fila | ⬜ |
| CA04 | R | Supervisor sin exportar | ⬜ |
| CA05 | S | Visible en FB4 | ⬜ |

---

## M09 — Auditoría — FB4

### HU-M09-01 · Registro de eventos

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | S | Visible en la auditoría | ✅ |
| CA02 | S | Antes y después en el detalle del evento | ✅ |
| CA03 | S | — | ⬜ |
| CA04 | S | `ACCESO_RECHAZADO` visible | ⬜ |
| CA05 | S | `RECONOCER` y `CORREGIR_DATO` visibles | ⬜ |
| CA06 | S | `EXPORTAR` con periodo o filtros (FB6, FB7) | ⬜ |
| CA07 | S | Motivo junto al cambio | ✅ |

### HU-M09-02 · Historial de un ingreso

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | Cronológico con autor | ✅ |
| CA02 | AI | Antes, después y motivo | ✅ |
| CA03 | AI | Eventos del lote incluidos (asignación, recorrido, etapas, cierre) | ✅ |
| CA04 | AI | El Supervisor lo ve igual | ✅ |
| CA05 | **I** | Sin enlace a la auditoría para quien no es Administrador | ✅ |

### HU-M09-03 · Auditoría del sistema

| CA | Tipo | Qué se revisa en la interfaz | Estado |
|---|---|---|---|
| CA01 | AI | Del más reciente al más antiguo, con entidad, referencia y autor | ✅ |
| CA02 | AI | Filtros de usuario, acción y referencia combinados | ⬜ |
| CA03 | AI | Antes, después y motivo en el detalle | ✅ |
| CA04 | M | Sin resultados: `mensaje` | ⬜ |
| CA05 | R | Solo el Administrador ve Auditoría | ✅ |

---

## Resumen por fase

| Fase | HU | Criterios | De ellos, **I** |
|---|---|---|---|
| FB1 | HU-M01-01 a 03 | 26 | 2 |
| FB2 | HU-M02-01 a 03 | 30 | 0 |
| FB3 | HU-M03-01 a 04, HU-M04-01 y 02, HU-M05-01 | 76 | 1 |
| FB4 | HU-M09-01 a 03 | 17 | 1 (+ HU-M07-02 CA12) |
| FB5 | HU-M06-01 a 05 | 65 | 0 |
| FB6 | HU-M07-01 a 04 | 48 | 1 |
| FB7 | HU-M08-01 y 02 | 15 | 0 |
| **Total** | 27 | **277** | **6** |

## Tareas de usabilidad (marco de tesis §6)

| Tarea | Fase en que queda posible | Pantallas | Referencia de tiempo anotada en |
|---|---|---|---|
| T01 Registrar un ingreso desde la imagen | FB3 | Registrar | Bitácora FB3 |
| T02 Corregir un dato reconocido | FB3 | Revisión (antes de confirmar) y Corregir | Bitácora FB3 |
| T03 Consultar un ingreso por placa y fecha | FB6 | Inicio → Consulta | Bitácora FB6 |
| T04 Vincular un ingreso con una etapa | FB5 | Detalle del lote → Siguiente paso | Bitácora FB5 |
| T05 Obtener el total mensual por producto | FB7 | Consolidación | Bitácora FB7 |
| T06 Exportar el total mensual | FB7 | Consolidación | Bitácora FB7 |
