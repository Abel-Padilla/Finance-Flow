# Nexum

MVP funcional de finanzas personales en español (es-MX), con Next.js, NestJS y PostgreSQL. No usa datos simulados: cuentas, movimientos, presupuestos y metas se guardan en PostgreSQL.

## Ejecutar localmente

Requisitos: Node.js 22.12+ (probado con 24.12), pnpm 10 y Docker Compose.

```sh
pnpm install
cp apps/api/.env.example apps/api/.env
```

En `apps/api/.env`, reemplaza `JWT_ACCESS_SECRET` por un valor aleatorio de al menos 32 caracteres. Puedes generar uno con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. El archivo `.env` local de esta entrega ya está configurado y excluido de Git; no lo sobrescribas si quieres usarlo.

```sh
docker compose up -d db
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Abre **http://localhost:3001**. API: **http://localhost:4016/api/v1**. PostgreSQL: **localhost:54329**. Los puertos evitan otros servicios que estaban ejecutándose en esta computadora. El backend se compila al iniciar `pnpm dev`; después de editar su código reinicia el comando. Next.js sí recarga sus cambios automáticamente.

Registra tu propia cuenta y completa los tres pasos de configuración. Las cuentas empiezan vacías; las categorías predeterminadas se crean al registrarse. El comando de seed es idempotente y agrega las categorías faltantes a usuarios existentes, sin crear usuarios de demostración.

## Compilar, verificar y ejecutar producción

```sh
pnpm lint
pnpm typecheck
pnpm build
# Con la API y PostgreSQL en ejecución:
pnpm test
# En terminales separadas:
pnpm --filter api start
pnpm --filter web start
```

`pnpm test` incluye pruebas unitarias y de integración real. Usa la base configurada, crea usuarios con correos únicos `@example.test` y limpia exclusivamente esos usuarios y sus registros. `TEST_API_URL` permite usar otra instancia de la API. Las pruebas no borran registros de usuarios reales.

Para producción, configura `NODE_ENV=production`, un origen HTTPS en `FRONTEND_URL`, una base PostgreSQL protegida y un secreto propio. Usa un proxy inverso HTTPS delante de Next.js. La API escucha en loopback; no está pensada para exponerse directamente. `API_INTERNAL_URL` se resuelve en la compilación de Next.js: recompila si cambia. No reutilices la contraseña local de PostgreSQL en producción.

## Variables

| Variable            | Ubicación                           | Uso                                                                        |
| ------------------- | ----------------------------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`      | apps/api/.env                       | Conexión PostgreSQL                                                        |
| `JWT_ACCESS_SECRET` | apps/api/.env                       | Firma JWT; mínimo 32 caracteres aleatorios                                 |
| `FRONTEND_URL`      | apps/api/.env                       | Origen exacto para CORS y protección de solicitudes: http://localhost:3001 |
| `PORT`              | apps/api/.env                       | API: 4016                                                                  |
| `NODE_ENV`          | entorno/API                         | development o production; activa cookies Secure en producción              |
| `API_INTERNAL_URL`  | apps/web/.env.local, opcional       | http://localhost:4016; proxy de Next.js                                    |
| `POSTGRES_PASSWORD` | entorno de Docker Compose, opcional | Contraseña PostgreSQL; debe coincidir con DATABASE_URL                     |
| `TEST_API_URL`      | entorno de pruebas, opcional        | URL completa del prefijo de la API                                         |

Los access tokens duran 15 minutos. Los refresh tokens opacos duran 30 días; no necesitan `JWT_REFRESH_SECRET` porque no son JWT. Los plazos están centralizados en el servicio de autenticación.

## Estructura

```text
finance-flow/
├── apps/api/
│   ├── src/auth.ts             # JWT, Argon2, rotación y cookies
│   ├── src/controllers.ts      # Controladores REST protegidos
│   ├── src/finance.service.ts  # Propiedad, operaciones y agregaciones
│   ├── src/finance.ts          # Cálculos Decimal centralizados
│   ├── src/schema.ts           # Tablas Drizzle
│   ├── src/dto.ts              # Validación de entradas
│   ├── src/migrate.ts          # Migraciones versionadas y atómicas
│   ├── src/seed.ts             # Categorías por usuario
│   ├── migrations/
│   └── test/
├── apps/web/
│   ├── app/                   # App Router y todas las páginas
│   ├── components/ui/         # Componentes estilo shadcn/ui con Radix
│   ├── components/            # Formularios, gráficas y pantallas
│   └── lib/                   # Sesión, API y formatos
├── docker-compose.yml
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── eslint.config.mjs
```

## Decisiones de arquitectura y contabilidad

- Monolito modular: módulos de autenticación y finanzas; controladores por recurso, servicio central con inyección de dependencias y DTOs. Las consultas pasan por Drizzle y siempre incluyen el usuario autenticado.
- `NUMERIC(16,2)` en PostgreSQL y `decimal.js` para aritmética. Los montos viajan como cadenas. JavaScript `Number` se usa exclusivamente para presentar gráficas y valores, nunca para persistir operaciones monetarias.
- **Disponible = saldo inicial + ingresos − gastos − ahorro reservado.** El ahorro reservado se muestra por separado y no es consumo. El patrimonio líquido sería disponible + reservado. Editar o eliminar un ahorro recalcula ambos valores y el progreso de la meta.
- El saldo disponible abarca todos los movimientos registrados, incluidas fechas futuras si se introducen. El selector mensual afecta ingresos, gastos, ahorro, asignaciones e informes; no cambia el saldo total.
- El flujo del mes es ingresos menos gastos. La tasa de ahorro usa ahorro / ingresos y devuelve 0 cuando no hay ingresos. Las metas se derivan de sus movimientos SAVING; no hay un saldo editable duplicado.
- La distribución admite porcentajes enteros que suman 100. Usa ingresos reales del mes; en un mes sin ingresos usa la estimación del perfil. Cada asignación se redondea a dos decimales; por redondeo, su suma visual puede diferir un centavo de la base.
- Relaciones compuestas `(id, user_id)` impiden referencias cruzadas entre usuarios también en la base de datos. No hay borrados en cascada del historial. Para eliminar una cuenta/categoría/meta con movimientos, primero hay que reasignar o eliminar esos movimientos.
- Las sesiones usan access tokens solo en memoria y refresh tokens en cookies HttpOnly, SameSite=Strict y Secure en producción. Solo se guarda SHA-256 del refresh token aleatorio de alta entropía. Cada renovación consume el token anterior de forma atómica.
- Logout revoca el refresh token actual y elimina la credencial local. Un access token ya emitido expira en un máximo de 15 minutos. No hay revocación global de access tokens ni pantalla de dispositivos en este MVP.
- Next.js actúa como proxy del API, sin persistir credenciales en localStorage. La preferencia de tema es el único dato guardado allí. Sileo es el único sistema de notificaciones.
- La configuración inicial usa una actualización condicional atómica. Reabrirla desde configuración conserva el historial y no duplica la cuenta inicial.

## API

Prefijo `/api/v1`. Auth: register/login/refresh/logout/me. Recursos: accounts, categories, transactions, savings-goals con listado, lectura, creación, edición y eliminación. Budget: GET/PUT. Dashboard: summary/cash-flow/categories/insights. Users: onboarding/settings/reset-onboarding.

Los PATCH de recursos reciben su formulario completo; las claves opcionales pueden omitirse. Las transacciones admiten `page`, `limit` (1–100), `from`, `to`, `type`, `accountId`, `categoryId` y `search`. El dashboard admite `month=AAAA-MM`. Los errores devuelven `{success:false,statusCode,code,message}`.

## Alcance y límites

Incluye registro/login/logout, onboarding, cuentas múltiples, ingresos/gastos/ahorro, edición y borrado, categorías personalizadas NEED/WANT, presupuesto, metas, panel, seis meses de gráfica, filtros, modo oscuro, diseño adaptable y notificaciones Sileo.

El presupuesto de categorías es compartido por Necesidades/Deseos: no hay sobres independientes por cada categoría. Las alertas se calculan contra esas asignaciones. No hay recuperación de contraseña, verificación de correo, MFA, importación bancaria, transferencias entre cuentas, retiros parciales de ahorro, multimoneda ni asesoría con IA. Para liberar una reserva se edita o elimina el movimiento de ahorro correspondiente. Las agregaciones cargan el historial del usuario en memoria, apropiado para un MVP personal; para grandes volúmenes deben migrarse a agregaciones SQL.

Ver `VERIFICATION.md` para los resultados de las comprobaciones.

## Aplicación móvil Nexum

La app Expo está en `apps/mobile`. Consulta [su guía de ejecución](apps/mobile/README.md) y [la verificación móvil](MOBILE-VERIFICATION.md).
