# Bitácora de puertas de fase — frontend

**Documento:** vivo, propio de este repositorio. Una fila por intento de puerta, nunca se borra una
fila: una puerta observada y luego aprobada deja dos filas. Espejo de
`docs/03-pruebas/bitacora_puertas.md` del backend.
**Cómo se usa:** [`plan-implementacion.md`](plan-implementacion.md) §3.5 y §3.6.

## Registro

| Fase | Fecha | Commit frontend | Commit backend revisado | Build y presupuesto | Lint y pruebas | Criterios ([verificación](verificacion-criterios.md)) | Revisión en dispositivo | Estado | Supervisor | Observaciones |
|---|---|---|---|---|---|---|---|---|---|---|
| FB0 | 2026-11-03 | Sin commit | `60d0c31` (`feature/M03-registro-ingresos`) | 367 kB, sin avisos | Prettier y lint 0 · 130 pruebas 0 fallos · cobertura 89,6 % | No aplica | Chrome escritorio y 360 × 740 (DevTools) | Pendiente de supervisión | — | Sin PWA, Node 20 fijado, núcleo y armazón. Pendiente 0.14 (esquema del backend). Bundle bajó de 826 a 367 kB (D-F21) |
| FB1 | 2026-11-03 | Sin commit | Ídem | Ídem | Ídem | 26 criterios; los 2 de interfaz verificados | Chrome escritorio y 360 × 740 | Pendiente de supervisión | — | Verificado contra el backend: credenciales erróneas, menú del Supervisor, ruta forzada, sesión persistida al recargar, cierre de sesión y sesión expirada por inactividad con su mensaje (CA06) |
| FB2 | 2026-11-03 | Sin commit | Ídem | Ídem | Ídem | 30 criterios | Chrome escritorio y 360 × 740 | Pendiente de supervisión | — | Verificado contra el backend: listado real, alta de vehículo externo sin transportista (mensaje literal de CA04), alta propia, búsqueda por placa, baja con confirmación. Corregido en la revisión: la coma decimal del teclado y la tara ofrecida a un vehículo pendiente de destare |

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
