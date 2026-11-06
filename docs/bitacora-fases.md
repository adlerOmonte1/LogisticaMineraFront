# Bitácora de puertas de fase — frontend

**Documento:** vivo, propio de este repositorio. Una fila por intento de puerta, nunca se borra una
fila: una puerta observada y luego aprobada deja dos filas. Espejo de
`docs/03-pruebas/bitacora_puertas.md` del backend.
**Cómo se usa:** [`plan-implementacion.md`](plan-implementacion.md) §3.5 y §3.6.

## Registro

| Fase | Fecha | Commit frontend | Commit backend revisado | Build y presupuesto | Lint y pruebas | Criterios ([verificación](verificacion-criterios.md)) | Revisión en dispositivo | Estado | Supervisor | Observaciones |
|---|---|---|---|---|---|---|---|---|---|---|
| FB0 | 2026-11-03 | Integrado en `main` por el PR #1 (`33a116f`) | `60d0c31` (`feature/M03-registro-ingresos`) | 367 kB, sin avisos | Prettier y lint 0 · 130 pruebas 0 fallos · cobertura 89,6 % | No aplica | Chrome escritorio y 360 × 740 (DevTools) | Pendiente de supervisión | — | Sin PWA, Node 20 fijado, núcleo y armazón. Pendiente 0.14 (esquema del backend). Bundle bajó de 826 a 367 kB (D-F21) |
| FB1 | 2026-11-03 | Integrado en `main` por el PR #1 (`33a116f`) | Ídem | Ídem | Ídem | 26 criterios; los 2 de interfaz verificados | Chrome escritorio y 360 × 740 | Pendiente de supervisión | — | Verificado contra el backend: credenciales erróneas, menú del Supervisor, ruta forzada, sesión persistida al recargar, cierre de sesión y sesión expirada por inactividad con su mensaje (CA06) |
| FB2 | 2026-11-03 | Integrado en `main` por el PR #1 (`33a116f`) | Ídem | Ídem | Ídem | 30 criterios | Chrome escritorio y 360 × 740 | Pendiente de supervisión | — | Verificado contra el backend: listado real, alta de vehículo externo sin transportista (mensaje literal de CA04), alta propia, búsqueda por placa, baja con confirmación. Corregido en la revisión: la coma decimal del teclado y la tara ofrecida a un vehículo pendiente de destare |
| FB3 | 2026-11-03 | Integrado en `main` por el PR #1 (`33a116f`), rama `feature/M03-registro-ingresos` | `60d0c31` (`feature/M07-consulta`), código servido en vivo por el contenedor | 368 kB, sin avisos | Prettier y lint 0 · 290 pruebas 0 fallos · cobertura 93,6 % | 76 criterios; el de interfaz HU-M04-01 CA02 verificado | Chrome escritorio; **pendiente teléfono real** | Pendiente de supervisión | — | Verificado contra el backend: ticket legible (placa dudosa al 74 %), formato no admitido, registro sin foto, placa nueva con alta del vehículo en la misma pantalla, ingreso En proceso, V4 con justificación, destare (tara ≥ bruto y neto fuera de rango), borrador recuperado tras recargar, corrección, reversión y anulación, ticket autenticado. Defectos encontrados y corregidos al probar: coma decimal sin normalizar, `mat-icon` sin inicializar dentro de `*appSiPuede`, cajas de justificación sin dibujar (D-F29, D-F31). T01 y T02 sin cronometrar |
| FB4 | 2026-11-03 | Rama `feature/M09-auditoria`, sin integrar | `a755736` (`backlog/plan-ejecucion`), servido por Docker | 368,7 kB, sin avisos | Prettier y lint 0 · 503 pruebas 0 fallos · cobertura 94,0 % | HU-M09-02 y HU-M07-02 CA12 (los dos de interfaz verificados) | Chrome escritorio 1024 × 768 y teléfono emulado 375 × 812; **pendiente teléfono real** | Pendiente de supervisión | — | M09 Auditoría: Historial del ingreso (Supervisor sin enlace, Administrador con enlace ya filtrado) y auditoría con filtro por referencia y detalle del evento. Sin recorrer: filtros de usuario y de acción, auditoría sin resultados, eventos de acceso rechazado y de reconocimiento. Defectos hallados y corregidos al recorrer: cifras del inicio solapadas; tablas que desbordaban o cortaban columnas; cabecera 6 px más ancha que la pantalla; avisos de la campana con título y detalle en una línea y contador sobre un icono oculto; «Noviembre De 2026»; fecha «ahora» enviada y rechazada en el mismo minuto del inicio (D-F43); `null` en «Cerrar lote» y «Agregar mineral» que daba «Datos inválidos» (D-F43); historial con nombres de campo y fechas en crudo. Observado y no corregido (es de FB1): en teléfono el icono del candado tapa la etiqueta «Contraseña» del inicio de sesión. Recorrido adicional 2026-11-04: filtros combinados de usuario y acción, y auditoría sin resultados con el mensaje del servidor. |
| FB5 | 2026-11-03 | Rama `feature/M09-auditoria`, sin integrar | `a755736` (`backlog/plan-ejecucion`), servido por Docker | 368,7 kB, sin avisos | Prettier y lint 0 · 503 pruebas 0 fallos · cobertura 94,0 % | HU-M06-01 a 03 y 05, parcial (ver los criterios marcados) | Chrome escritorio 1024 × 768 y teléfono emulado 375 × 812; **pendiente teléfono real** | Pendiente de supervisión | — | M06 Trazabilidad: abrir lote (campos obligatorios), asignar con otro mineral (autorización pedida antes de enviar y rechazo literal), iniciar recorrido, secado en **2 toques** y ruta en 3 en teléfono emulado, fecha anterior al inicio rechazada, molienda con 0 horas rechazada y con coma decimal aceptada, ensacado con 12 bigbags (peso como estimación), cierre con resumen (estimación) y lote cerrado sin acciones, pestaña Trazabilidad. Sin recorrer: dividir, tardíos, traslado entre lotes, retirar, y cerrar sin destino tras la corrección. Defectos hallados y corregidos al recorrer: cifras del inicio solapadas; tablas que desbordaban o cortaban columnas; cabecera 6 px más ancha que la pantalla; avisos de la campana con título y detalle en una línea y contador sobre un icono oculto; «Noviembre De 2026»; fecha «ahora» enviada y rechazada en el mismo minuto del inicio (D-F43); `null` en «Cerrar lote» y «Agregar mineral» que daba «Datos inválidos» (D-F43); historial con nombres de campo y fechas en crudo. Observado y no corregido (es de FB1): en teléfono el icono del candado tapa la etiqueta «Contraseña» del inicio de sesión. Recorrido adicional 2026-11-04: cerrar sin destino devuelve «Debe indicar el destino del lote» (corrección D-F43 confirmada) y con pendientes, el mensaje con la lista. |
| FB6 | 2026-11-03 | Rama `feature/M09-auditoria`, sin integrar | `a755736` (`backlog/plan-ejecucion`), servido por Docker | 368,7 kB, sin avisos | Prettier y lint 0 · 503 pruebas 0 fallos · cobertura 94,0 % | HU-M07-01 a 04, parcial (ver los criterios marcados) | Chrome escritorio 1024 × 768 y teléfono emulado 375 × 812; **pendiente teléfono real** | Pendiente de supervisión | — | M07 Consulta: inicio con cifras reales, consulta por placa con el ticket junto a los datos (**CA03, de interfaz**), sin criterios, rango inverso y sin resultados con su mensaje, búsqueda de la cabecera por dígitos finales, listado con totales y el mes en curso, exportar y exportar vacío, calendario con En proceso y anulados, campana de avisos por rol. Sin recorrer: T03 cronometrada, Supervisor sin Exportar, búsqueda de la cabecera por placa, día vacío y mes anterior del calendario, y el aviso que desaparece tras un destare. Defectos hallados y corregidos al recorrer: cifras del inicio solapadas; tablas que desbordaban o cortaban columnas; cabecera 6 px más ancha que la pantalla; avisos de la campana con título y detalle en una línea y contador sobre un icono oculto; «Noviembre De 2026»; fecha «ahora» enviada y rechazada en el mismo minuto del inicio (D-F43); `null` en «Cerrar lote» y «Agregar mineral» que daba «Datos inválidos» (D-F43); historial con nombres de campo y fechas en crudo. Observado y no corregido (es de FB1): en teléfono el icono del candado tapa la etiqueta «Contraseña» del inicio de sesión. Recorrido adicional 2026-11-04: Supervisor sin «Exportar» y sin enlace en las toneladas del inicio; avisos del Supervisor sin cierre ni «sin lote»; búsqueda de la cabecera por placa; día vacío y mes anterior del calendario. Corregido: la placa que llega por la URL se mostraba en minúsculas. |
| FB7 | 2026-11-04 | Rama `feature/M09-auditoria`, sin integrar | `a755736` (`main`), servido por Docker | 368,7 kB, sin avisos; la consolidación es un chunk diferido | Prettier y lint 0 · 526 pruebas 0 fallos · cobertura 94,1 % | HU-M08-01 (8 de 10) y HU-M08-02 (4 de 5), más HU-M07-03 CA08 | Chrome escritorio; **pendiente teléfono real** | Pendiente de supervisión | — | M08 Consolidación con Administrativo: noviembre 2026 con MOA 3 · 49,20 t · 58,02 % y MOB 2 · 35,60 t · 41,98 %, total 5 · 84,80 t; «Total al corte de hoy, 04/11/2026»; aviso de En proceso con ING-2026-00005; «1 ingreso anulado excluido del total»; flecha «siguiente» deshabilitada en el mes en curso. Exportado `consolidado_2026_11.xlsx` y leído fila por fila: coincide con la pantalla, y el resumen del calendario de noviembre da las mismas 84,80 t (HU-M07-03 CA08). Octubre vacío: «No hay ingresos registrados para el periodo indicado» en pantalla y, al exportar, el mismo mensaje leído del blob. `?anio=2027&mes=1` forzado en la URL: «No se puede consolidar un periodo futuro». Supervisor: sin `CONSOLIDAR` en su sesión, el servidor responde 403 a la consolidación y a la exportación, y el menú y la ruta dependen de ese permiso. Sin recorrer: T05 y T06 cronometradas, y el total que cambia tras corregir un peso (CA05). Observado en el backend, no corregido aquí: el mensaje «Hay 1 ingresos en proceso…» no concuerda en número con un solo ingreso; se muestra literal. |

**Estados:** Pendiente de supervisión · Aprobada · Observada.

## Tiempos de las tareas de usabilidad

Referencia de desarrollo, no medición de la tesis: la medición la hacen los instrumentos con
usuarios reales. Sirve para detectar a tiempo una pantalla que cuesta demasiados pasos.

| Fecha | Tarea | Dispositivo | Cuenta | Intento 1 | Intento 2 | Intento 3 | Nota |
|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — |

## Diferencias anotadas entre la maqueta y la documentación

| Fecha | Pantalla | Maqueta | Documentación (gana) | Qué se hizo |
|---|---|---|---|---|
| 2026-11-03 | Rutas | `#/destare`, `#/altas`, `#/calendario` | El backend fabrica `/ingresos/destares`, `/lotes/{id}/cerrar`, `/consulta/calendario` en sus enlaces | Se usan las rutas del backend (D-F13) |

---

## Plantilla de una fila

```
| FB3 | 2026-12-01 | abc1234 | def5678 (feature/M03-registro-ingresos) | 412 kB, sin avisos | lint 0 · 58 pruebas 0 fallos | 76/76 ✅ (1 I) | Moto G (Android 13), iPhone 12 | Pendiente de supervisión | — | T01 media 48 s |
```

## Plantilla de observaciones

```
FB3 · 2026-12-02 · Observada
1. La hora propuesta no se distingue de la fecha en 360 px.
2. El panel del vehículo pierde el tipo de mineral elegido al cerrarse.
Commits de corrección: fix(FB3): obs. 1 — …, fix(FB3): obs. 2 — …
```
