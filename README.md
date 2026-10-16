# VectorBank — Sistema Bancario

Sistema bancario full-stack con autenticación segura, gestión de cuentas, transacciones en tiempo real y autenticación por huella dactilar.

## Descripción

Plataforma bancaria compuesta por tres servicios:

- **Frontend** (`appBankSystem/`): SPA en Angular 17 con dashboard, gráficas (Chart.js) y notificaciones en tiempo real vía Socket.IO.
- **Backend** (`server/`): API REST en Express + TypeScript con MongoDB, JWT (access + refresh tokens), validación con Zod y documentación Swagger.
- **Microservicio de huellas** (`server/fingerprint-server.py`): API en Flask que integra un sensor biométrico (ZFM-20) para login por huella dactilar.

## Funcionalidades

- **Autenticación**: registro con verificación de correo por código, login (contraseña o huella), recuperación y cambio de contraseña, refresh tokens.
- **Cuentas**: creación, consulta, desactivación, límites de transferencia y resúmenes de gastos/mensual.
- **Transacciones**: depósitos, retiros, transferencias, cancelación, búsqueda, comprobantes PDF y exportación de estados de cuenta (CSV/PDF).
- **Pagos recurrentes**: programación y gestión de pagos automáticos.
- **Beneficiarios**: CRUD de beneficiarios de transferencias.
- **Divisas (Forex)**: consulta de tasas y conversión de monedas.
- **Notificaciones**: en tiempo real con Socket.IO e historial de notificaciones.
- **Panel de administración**: gestión de usuarios, verificación de cuentas, roles, estadísticas y logs de auditoría.
- **Seguridad**: Helmet, rate limiting, sanitización de entradas, validación con Zod y CORS restringido.

## Stack tecnológico

| Capa | Tecnologías |
|------|-------------|
| Frontend | Angular 17, TypeScript, SCSS, Chart.js, Socket.IO Client |
| Backend | Node.js, Express 5, TypeScript, Mongoose, Zod, JWT, Socket.IO |
| Base de datos | MongoDB 7 |
| Biométrico | Python, Flask, pyfingerprint |
| Infraestructura | Docker Compose, Nginx |
| Testing | Vitest + Supertest (API), Karma/Jasmine (frontend) |

## Requisitos

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 9
- [MongoDB](https://www.mongodb.com/) >= 7 (o Docker)
- [Python](https://www.python.org/) >= 3.10 (solo para el servicio de huellas)
- [Docker](https://www.docker.com/) y Docker Compose (opcional, para despliegue)

## Instalación

```bash
# 1. Instalar dependencias
pnpm install
pnpm --prefix server install
pnpm --prefix appBankSystem install

# 2. Configurar variables de entorno del backend
# Crea el archivo server/.env con las variables de la tabla siguiente
```

### Variables de entorno (`server/.env`)

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor API | `3000` |
| `MONGODB_URI` | URI de conexión a MongoDB | — (requerida) |
| `JWT_SECRET` | Secreto para tokens JWT | — (requerida) |
| `JWT_EXPIRES` | Duración del access token | `15m` |
| `JWT_REFRESH_EXPIRES` | Duración del refresh token | `7d` |
| `CORS_ORIGINS` | Orígenes permitidos (separados por coma) | `http://localhost:4200,...` |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASS` | Servidor SMTP para correos de verificación | Gmail SMTP |
| `ABSTRACT_API_KEY` | API key de AbstractAPI (validación de correos) | vacío |

## Ejecución

### Desarrollo

```bash
pnpm dev            # MongoDB + API + Frontend en paralelo
pnpm dev:api        # solo backend (http://localhost:3000)
pnpm dev:web        # solo frontend (http://localhost:4200)
```

### Producción (Docker)

```bash
docker compose up -d
```

| Servicio | Puerto |
|----------|--------|
| Frontend (Nginx) | `4200` |
| API REST | `3000` |
| MongoDB | `27017` |

### Servicio de huellas (opcional)

```bash
cd server
pip install -r requirements.txt
python fingerprint-server.py
```

## Documentación de la API

Al iniciar el backend, la documentación Swagger está disponible en:

```
http://localhost:3000/api-docs
```

## Tests

```bash
pnpm --prefix server test          # tests de la API (Vitest)
pnpm --prefix appBankSystem test   # tests del frontend (Karma/Jasmine)
```

## Estructura del proyecto

```
bank-system/
├── appBankSystem/          # Frontend Angular
│   └── src/app/
│       ├── components/     # Componentes reutilizables
│       ├── guards/         # Guards de autenticación y roles
│       ├── interceptors/   # Interceptors HTTP (auth, error, loading)
│       ├── pages/          # Login, registro, dashboard, transacciones, perfil, admin
│       └── services/       # Servicios de comunicación con la API
├── server/                 # Backend Express
│   ├── src/
│   │   ├── config/         # Env, Swagger
│   │   ├── controllers/    # Lógica de endpoints
│   │   ├── middleware/     # Auth, validación, sanitización, errores
│   │   ├── models/         # Modelos Mongoose (User, Account, Transaction, ...)
│   │   ├── routes/         # Rutas de la API
│   │   ├── services/       # Auth, email, notificaciones, auditoría, forex
│   │   └── validations/    # Schemas Zod
│   ├── tests/              # Tests de la API
│   ├── scripts/            # Scripts CLI (make-admin, reset-pass, ...)
│   └── fingerprint-server.py  # Microservicio biométrico (Flask)
└── docker-compose.yml      # Orquestación de servicios
```

## Licencia

ISC
