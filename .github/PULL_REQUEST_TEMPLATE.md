## Qué cambia

<!-- Una frase. Fase (FBn) e historias que toca. -->

Fase: FB
Historias: HU-M

Closes #

## Puerta técnica

- [ ] `npm run format:check`, `npm run lint`, `npm run test:ci` y `npx ng build --configuration production` en verde, sin avisos de presupuesto
- [ ] Cada HU de la fase tiene su pantalla, su ruta y su entrada de menú por rol
- [ ] Criterios de la fase marcados en `docs/verificacion-criterios.md`
- [ ] Recorrido con las tres cuentas, en escritorio y a 360 px
- [ ] Ningún `ui/` ni `shared/` inyecta servicios; ningún feature importa de otro
- [ ] Ningún mensaje del dominio escrito en el cliente; nada asignado por el servidor se edita ni se envía
- [ ] Ningún `any`
- [ ] Opciones ocultas por rol = `apps/accounts/permissions.py` del backend
- [ ] `docs/estado-modulos.md` y `docs/bitacora-fases.md` actualizados

## Backend contra el que se probó

Commit o rama del backend:

## Evidencia

<!-- Capturas a 360 px y en escritorio, o la salida de las pruebas. -->

<!-- Destino: `staging` desde una rama feature/FBn-…; `main` solo desde `staging`. -->
