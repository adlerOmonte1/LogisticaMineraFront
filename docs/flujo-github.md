# Flujo de trabajo en GitHub — frontend

**Documento:** propio de este repositorio. Es el espejo del flujo del backend (`LogisticaMinera`):
mismas etiquetas, mismos issues por historia, ramas `feature/…` → `staging` → `main`.
**No duplica:** el *cómo construir* una fase está en [`../CONTRIBUTING.md`](../CONTRIBUTING.md); el
*qué y cuándo*, en [`plan-implementacion.md`](plan-implementacion.md).

## 1. Ramas

```
main        Fase aprobada por el supervisor. Se etiqueta FBn-aprobada
staging     Integración: aquí se fusiona cada fase y corre el CI completo
feature/Mnn-nombre        Una rama por fase, con el nombre de la rama del backend (tabla en CONTRIBUTING §2)
chore/…  docs/…  fix/…    Cambios fuera de una fase
```

- Nada entra a `staging` ni a `main` sin pull request con el CI en verde.
- `main` solo recibe PR desde `staging`, después de la puerta de supervisión.
- Una fase = una rama = un PR a `staging`. Dentro, una historia por commit cuando se pueda.
- FB0 a FB3 se integraron en `main` con un único PR (#1), antes de existir `staging`. Es historia:
  no se reescribe. Desde FB4 se aplica el flujo completo.

## 2. Issues

| Tipo | Título | Etiquetas | Hito |
|---|---|---|---|
| Fase | `FBn · Nombre de la fase` | `fase` | FBn |
| Historia | `HU-M03-01 · Nombre` (el mismo del backend) | `historia`, `Mxx`, `prioridad:*`, `moscow:*`, `frontend` | FBn |
| Incidencia | `DEF-Fnnn · Resumen` | `incidencia`, `severidad:*` | FBn |
| Observación de puerta | `FBn · obs. k · Resumen` | `observacion` | FBn |

- Las historias **enlazan** a su issue del backend; no copian criterios (D-F10).
- Un issue de fase queda abierto con `pendiente-supervision` hasta que la bitácora diga **Aprobada**.
- Los issues de FB0 a FB3 llevan `registro-retroactivo`: se crearon después del trabajo.

## 3. Ciclo de una fase

1. Hito FBn con sus issues de historia.
2. `git switch staging && git switch -c feature/M09-auditoria` (el nombre de la tabla de CONTRIBUTING §2).
3. Commits `M03: descripcion (HU-M03-01)`.
4. PR a `staging` con la plantilla; `Closes #n` por cada historia. CI en verde.
5. Puerta técnica → fila «Pendiente de supervisión» en [`bitacora-fases.md`](bitacora-fases.md).
6. Supervisión. **Observada**: un issue `observacion` y un commit `fix(FBn): obs. k — …` por cada una.
   **Aprobada**: PR de `staging` a `main` y `git tag FBn-aprobada`.
7. Se cierran los issues de la fase y se marca el ítem «Interfaz Angular» en el issue de la HU del
   backend.

## 4. Protección de ramas

`main` y `staging` exigen pull request y rechazan el empuje forzado y el borrado. No exigen
aprobación de revisor (el repositorio tiene un único autor; la revisión humana de la fase es la
puerta de supervisión) y no se aplican al administrador.

**El CI no es un check obligatorio de la rama** porque `frontend.yml` y `docs.yml` se disparan por
rutas (`frontend/**` y `docs/**`): exigir uno de los dos bloquearía para siempre los PR que no lo
disparan. La regla se cumple por la plantilla de PR: no se fusiona con un check en rojo. Si se
quita el filtro de rutas, o se añade un job final que siempre corra, pasa a ser obligatorio.

## 5. Tablero

Los issues se añaden al proyecto «Logistica Minera CONSMIN», el mismo del backend, con el campo
**Módulo** y el hito de la fase.
