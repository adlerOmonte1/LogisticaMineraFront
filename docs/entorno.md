# Entorno de desarrollo

**Documento:** operativo, propio de este repositorio.
**No duplica:** `ARQ-02_Arquitectura_Tecnica.md` del backend, que fija el stack del sistema. Esto es
lo que hace falta para que una máquina nueva trabaje con los dos repositorios.

---

## 1. Versiones

| Herramienta | Objetivo | Estado al 2026-11-03 |
|---|---|---|
| Node.js | **20 LTS** (Angular 17 soporta 18.x y 20.x) | 24.13.1 instalado — fuera de la matriz; se corrige en FB0 |
| npm | El que trae Node 20 | 11.8.0 |
| Angular CLI | 17.3.x local, en `frontend/package.json` | 17.3.17 |
| TypeScript | 5.4 | 5.4.2 |
| Navegadores de prueba | Chrome y Safari móviles, Chrome y Edge de escritorio | — |

### Node 20

`ng version` marca Node 24 como «Unsupported». Compila hoy, pero Angular 17 no se prueba contra
Node 24 y un `npm install` futuro puede traer una dependencia que choque, para descubrirse en la
estabilización. Se fija Node 20 en FB0:

```bash
nvm install 20
nvm alias default 20
echo "20" > frontend/.nvmrc
```

## 2. El CLI, siempre local

Para todo lo que termina en un commit (`generate`, `build`, `add`, `lint`, `test`) se usa `npx ng`
dentro de `frontend/`, que respeta la versión del proyecto. Un CLI global solo para curiosear.

## 3. Arranque de los dos repositorios

Los dos se clonan lado a lado (D-F10):

```
TesisConsmin/
├── LogisticaMinera/        backend, docs y maqueta
└── LogisticaMineraFront/   este repositorio
```

### 3.1 Backend

Desde `LogisticaMinera/`:

```bash
docker compose up -d --build
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py cargar_datos_prueba
```

`cargar_datos_prueba` crea —o devuelve a su estado inicial— una cuenta por rol, el catálogo
provisional y datos de ejemplo. Las credenciales de las tres cuentas están en
`postman/entornos/local.postman_environment.json` del backend; no se copian a este repositorio.

La API queda en `http://localhost:8000/api/v1/` y su documentación en
`http://localhost:8000/api/v1/docs/`.

Para repetir una revisión desde cero:

```bash
docker compose exec backend python manage.py flush --no-input
docker compose exec backend python manage.py cargar_datos_prueba
```

### 3.2 Frontend

```bash
cd LogisticaMineraFront/frontend
npm install
npm start           # http://localhost:4200, proxy /api → localhost:8000
```

Con el proxy el navegador ve un solo origen y CORS no interviene. En preproducción y producción el
backend debe declarar el origen del frontend en `CORS_ALLOWED_ORIGINS`.

### 3.3 Ajustes del backend útiles para revisar

| Para probar | Variable del backend (`.env`) | Valor de prueba |
|---|---|---|
| Sesión expirada (HU-M01-01 CA06) | `JWT_ACCESS_MINUTES`, `JWT_REFRESH_DAYS` | `1` y `0` (luego restaurar) |
| Motor caído (HU-M04-01 CA05) | `RECONOCEDOR_ACTIVO` | un valor inexistente |
| Lectura determinista | `RECONOCEDOR_ACTIVO` | `determinista` |
| Placa con otro patrón | `PATRON_PLACA` | ver `.env.example` |

Tickets de prueba: `LogisticaMinera/postman/archivos/ticket_legible.jpg`, `ticket_ilegible.png` y
`documento.pdf` (formato no admitido).

## 4. Probar en un teléfono

1. Teléfono y computadora en la misma red.
2. `npx ng serve --host 0.0.0.0` dentro de `frontend/`.
3. Abrir `http://<ip-de-la-computadora>:4200` en el teléfono.
4. La cámara del navegador (`capture="environment"`) exige contexto seguro en algunos navegadores:
   si no abre la cámara, usar `npx ng serve --host 0.0.0.0 --ssl` y aceptar el certificado, o elegir
   la foto desde la galería.
5. Para la conservación del borrador (RNF-M03-05): modo avión a mitad de la revisión, recargar,
   comprobar que todo vuelve, salir del modo avión y confirmar.

En DevTools: dispositivo de 360 × 740 y, para red móvil, el perfil «Fast 4G».

## 5. Verificación antes de un commit

```bash
cd frontend
npm run format:check
npx ng lint
npm run test:ci                 # ChromeHeadless + cobertura mínima, igual que el CI
npx ng build --configuration production
```

El build de producción avisa a 500 kB y falla a 1 MB de bundle inicial. Si algún día avisa, la
respuesta es quitar peso, no subir el presupuesto.

## 6. `environment.*.ts`

Angular no lee `.env` en tiempo de ejecución: lo que el cliente necesita saber va en
`src/environments/`, seleccionado por `fileReplacements`.

| Configuración | Archivo | `apiUrl` |
|---|---|---|
| `development` (por defecto en `ng serve`) | `environment.development.ts` | `/api/v1` vía proxy |
| `preproduction` | `environment.preproduction.ts` | `https://pre.<dominio>/api/v1` |
| `production` (por defecto en `ng build`) | `environment.ts` | `https://api.<dominio>/api/v1` |
