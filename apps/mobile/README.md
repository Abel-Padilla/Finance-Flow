# Nexum móvil

Aplicación Expo / React Native dentro del monorepo Finance Flow. Reutiliza la API NestJS y la identidad Nexum de la web. No incorpora un backend ni datos financieros de demostración.

## Ejecutar

Desde la raíz `outputs/finance-flow`, con Node 24 y pnpm 10:

```sh
pnpm install --frozen-lockfile
cp apps/mobile/.env.example apps/mobile/.env
```

Configura `EXPO_PUBLIC_API_URL` en `apps/mobile/.env` antes de iniciar. Es la única variable pública necesaria; admite la raíz de la API o el sufijo `/api/v1`. Nunca pongas contraseñas, claves JWT ni la conexión de base de datos en variables `EXPO_PUBLIC_*`.

| Destino | Dirección de desarrollo |
| --- | --- |
| Simulador iOS | `http://localhost:4016` |
| Emulador Android de Android Studio | `http://10.0.2.2:4016` |
| Teléfono físico | `http://IP-LAN-DE-TU-MAC:4016` |
| Render / producción | URL HTTPS real de tu API desplegada |

En teléfono, `localhost` identifica al teléfono. Usa la misma red Wi-Fi y permite el acceso al puerto de la API. Expo Go proporciona el código móvil; no convierte la API local en un servicio público. La API existente escucha en `0.0.0.0`. Las compilaciones de producción rechazan HTTP.

Para la API local, conserva su `.env` y la base de datos del proyecto:

```sh
docker compose up -d db
pnpm db:migrate
PORT=4016 pnpm --filter api dev
```

No es necesario ejecutar el seed: puedes registrar una cuenta nueva. No vuelvas a sembrar una base con información que quieras conservar sin revisar su script.

En otra terminal, desde la raíz del monorepo:

```sh
# Expo Go: escanear el QR con el teléfono
pnpm --filter mobile start --go

# Simulador iOS; necesita Xcode y un simulador instalado
pnpm --filter mobile ios

# Emulador Android; necesita Android Studio y un emulador iniciado
pnpm --filter mobile android
```

Usa Expo Go compatible con SDK 57. Para un cliente de desarrollo propio, sigue el flujo oficial de Expo development builds y configura los identificadores de aplicación antes de distribuirlo. `expo export` genera JavaScript y recursos; no produce un APK, AAB ni IPA firmado.

En macOS, instala Watchman para evitar `EMFILE` al observar el monorepo. En este equipo no se pudo instalar por falta de permiso. Mientras tanto se puede arrancar sin observación automática:

```sh
CI=1 pnpm --filter mobile start --go --localhost --port 8082
```

Este modo sirve para validación local y no recarga cambios automáticamente. Para un teléfono, omite `--localhost` y configura la URL LAN de la API. El navegador no es un destino funcional de autenticación de esta app: SecureStore y el manejo nativo de cookies requieren iOS/Android; la aplicación web existente sigue en `apps/web`.

## Arquitectura

- `app/`: rutas Expo Router, grupos de autenticación y cinco pestañas, stacks de detalles y modales de edición. `Stack.Protected` separa sesión, onboarding y aplicación principal.
- `src/features/`: autenticación, onboarding, dashboard, movimientos, cuentas, categorías, metas, presupuesto y perfil.
- `src/components/`: formularios React Hook Form/Zod, tarjetas, botones, selectores en sheets, estados de carga/error/vacío y presentación financiera.
- `src/services/`: transporte `expo/fetch`, cliente de sesión y adaptador SecureStore.
- `src/store/`: sesión y apariencia clara/oscura/sistema. La selección manual de tema dura la sesión de la app; al reiniciar se sigue el dispositivo.
- `src/hooks/`: recarga al enfocar y pull-to-refresh, con protección contra respuestas fuera de orden.
- `src/types/`: contratos TypeScript de las respuestas y DTOs existentes. No existe un paquete compartido de contratos en el monorepo; una futura extracción debería incluir la validación del servidor y consumidores web/móvil conjuntamente.
- `src/utils/`: presentación de dinero y fechas. Los importes viajan como cadenas decimales; saldos, presupuestos, agregados y avance financiero se calculan en el backend.
- `tamagui.config.ts`: tokens Nexum, temas y tipografía nativa del sistema. Tamagui, config e iconos usan la misma versión estable 1.144.4; evita mezclar versiones incompatibles. Se usa ejecución en runtime sin el compilador opcional.

## Sesión y seguridad

El backend devuelve `accessToken` en JSON y el refresh exclusivamente en la cookie `ff_refresh` HttpOnly. El cliente nativo lee `Set-Cookie` con `expo/fetch`, desactiva el almacén automático de cookies y guarda ambos tokens juntos en SecureStore con `WHEN_UNLOCKED_THIS_DEVICE_ONLY`. No guarda contraseñas.

Solo `/auth/refresh` y `/auth/logout` reciben el encabezado Cookie. Las demás operaciones reciben Bearer. Se permite un reintento tras 401, con una única renovación concurrente y persistencia de la cookie rotada. Cambiar de API descarta la sesión anterior. Una falla transitoria de conexión conserva la sesión; un refresh inválido la elimina. El cierre espera una renovación en curso para revocar el token vigente y borra la sesión local aunque la API esté desconectada. El servidor conserva su política CORS/Origin para la web; no se relajó para el móvil.

## Contratos y límites del backend

- La moneda disponible es MXN. El perfil la muestra, pero no ofrece monedas que la API no acepta.
- `summary.balance` y `summary.available` son el mismo saldo disponible; el ahorro reservado llega aparte en `totalSaved`. No se inventa un segundo cálculo de saldo total.
- El refresh no llega en JSON. El proxy de producción debe conservar `Set-Cookie`; probarlo en dispositivo es obligatorio antes de distribuir.
- Las ediciones usan DTOs completos, incluso para PATCH.
- Los saldos de cuentas y agregados de metas llegan en las listas, no en el GET individual; los detalles consultan esas listas.
- Eliminar cuentas/categorías/metas con referencias puede responder 409. Se muestra el mensaje del servidor y se conserva el historial.
- Reabrir onboarding conserva registros existentes; el saldo inicial solo crea una cuenta cuando todavía no existe ninguna.
- No hay modo offline de escritura ni reintentos automáticos de mutaciones ante fallas de red: evita duplicar movimientos cuando el servidor pudo haberlos guardado.

## Verificar

```sh
pnpm --filter mobile typecheck
pnpm --filter mobile lint
pnpm --filter mobile test
# API y PostgreSQL locales en ejecución; crea y limpia solamente usuarios temporales
pnpm --filter mobile test:integration
pnpm --filter mobile exec expo install --check
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

Para exportar, establece la URL HTTPS real en `.env` y ejecuta:

```sh
pnpm --filter mobile export
```

Las pruebas de integración rechazan APIs y bases de datos no locales. Nunca uses credenciales de producción para pruebas. Consulta `../../MOBILE-VERIFICATION.md` para los resultados y límites de la validación de esta entrega.
