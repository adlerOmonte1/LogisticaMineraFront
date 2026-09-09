# Cómo trabajar en este repositorio

Guía operativa paso a paso. Para el *por qué* de cada regla, ver `docs/decisiones.md` y las skills en `skills/`; esto es el *cómo*, en orden.

## 1. Antes de escribir código

1. Confirma el entorno: `docs/entorno.md`. Si es una máquina nueva, sigue su §3.
2. Revisa `docs/estado-modulos.md` para saber qué está hecho y qué falta.
3. Si vas a tocar un módulo (Mxx) por primera vez, lee su documentación en el repositorio del backend: `docs/modulos/M{nn}-*/` (historias, requerimientos, reglas de negocio). Este repositorio no las duplica.

## 2. Rama y convención de commits

Una rama por módulo, igual que en el backend:

```bash
git checkout -b feature/M03-ingresos
```

Commits con el código de módulo y la historia que cierran:

```
M03: registra hora de pesaje separada de hora de registro (HU-M03-01)
```

Esto es lo que permite reconstruir la cadena `indicador → requerimiento → módulo → historia → commit`, repartida entre los dos repositorios (backend y frontend), en caso de que se pregunte en sustentación.

## 3. Crear un feature nuevo

Sigue el orden de la skill `frontend-feature-nuevo`, resumido aquí:

1. **Modelo** en `frontend/src/app/models/{entidad}.model.ts` — espejo del serializer del backend, tipos union para los `enum`, nunca `string` genérico.
2. **Servicio** en `features/{modulo}/data-access/` — única puerta a `HttpClient` de ese feature.
3. **Rutas del feature** en `features/{modulo}/{modulo}.routes.ts`, con `loadComponent` o `loadChildren`.
4. **Enganche** en `frontend/src/app/app.routes.ts`, con los guards que la historia exige (`sesionGuard`, `rolGuard([...])`).
5. **Componentes**: primero el `pages/` que orquesta, después los `ui/` que extraigas cuando algo se repite.

No crees `ui/` por adelantado. No importes de otro feature — lo compartido sube a `shared/` o a `models/`.

## 4. Checklist antes de abrir un PR

- [ ] `cd frontend && npx ng build --configuration production` pasa sin advertencias de presupuesto.
- [ ] Cada historia del módulo tiene su pantalla y su ruta.
- [ ] Ningún control calculado usa `disabled` (usa `readonly`) — ver `frontend-formularios`.
- [ ] Los mensajes de error del servidor se muestran literales, sin reformular.
- [ ] El guard de rol en el frontend coincide con lo que `permissions.py` rechaza en el backend.
- [ ] Ningún componente de `ui/` inyecta un servicio.
- [ ] Ningún feature importa de otro feature.
- [ ] Si el feature toca M07 (offline), se probó con el procedimiento de `docs/entorno.md` §4 (build de producción + DevTools Offline), no solo con `ng serve`.
- [ ] `docs/estado-modulos.md` actualizado: el módulo pasa de estado (⬜ → 🟨 → 🟩 → ✅).

## 5. Actualizar `docs/estado-modulos.md`

Se actualiza **al cerrar trabajo relevante**, no en cada commit — evita que la tabla se vuelva ruido. Un feature pasa a:

- **🟨 En progreso** en el primer commit que agrega un archivo real dentro de `data-access/`, `pages/` o `ui/`.
- **🟩 Montado** cuando todas las pantallas de las historias del módulo existen y navegan desde `app.routes.ts`.
- **✅ Verificado** cuando además se probó contra un backend real (no mocks) y el checklist de la skill correspondiente (`frontend-formularios`, `frontend-offline-pwa`, etc.) está cumplido.

## 6. Registrar una decisión de implementación

Si tomas una decisión de "cómo construir" que otra persona podría cuestionar razonablemente (una librería, un patrón, una alternativa descartada), añádela a `docs/decisiones.md` con el formato de las existentes: fecha, alternativas descartadas, razón concreta, y cuándo se revisaría. No es para preferencias de estilo — es para decisiones que alguien en sustentación o en una auditoría de código podría preguntar "¿por qué así y no de otra forma?".

## 7. Qué NO hacer

- No dupliques documentación de la tesis (historias, requerimientos, diagramas, decisiones D-01 a D-11) en este repositorio. Enlaza al repo del backend.
- No agregues una librería (gráficos, componentes, fechas) sin revisar primero si Angular Material o CDK ya lo resuelven — ver D-F03 y D-F04 en `docs/decisiones.md`.
- No pruebes M07 (offline) solo con `ng serve` y des por buena la ausencia de errores — el service worker no está activo ahí.
