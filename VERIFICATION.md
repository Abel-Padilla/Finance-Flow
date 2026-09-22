# Verificación de Nexum

Fecha: 21 de septiembre de 2026.

## Aplicación completa

- PostgreSQL 17 ejecutándose mediante Docker Compose; migración `0001_initial` aplicada y segunda ejecución idempotente verificada.
- `pnpm db:seed` ejecutado después de migrar. Agrega categorías a usuarios existentes; también se invoca al registrar usuarios. No crea movimientos ni usuarios de demostración.
- Backend NestJS: compilación satisfactoria y API en ejecución.
- Frontend Next.js: compilación de producción satisfactoria, con las diez rutas funcionales solicitadas.
- ESLint y TypeScript: sin errores.
- Pruebas automatizadas: **8 aprobadas, 0 fallidas**. Cubren aritmética decimal, ingresos cero, metas, autenticación, renovación y revocación, origen de solicitudes, onboarding único, presupuestos, edición/eliminación de movimientos, filtros, referencias e aislamiento de dos usuarios.
- Navegador: registro, onboarding, ingreso, gasto con centavos, ahorro asociado a una meta, sesión persistente tras recargar y cierre de sesión verificados con un usuario de prueba local.
- Caso comprobado en pantalla: saldo inicial 15,000 + ingreso 25,000 − gasto 1,250.50 − ahorro 5,000 = **33,749.50 disponibles**; **5,000 reservados**, tasa de ahorro **20%**, meta de 50,000 al **10%**.

Los usuarios creados por las pruebas automatizadas se eliminan al terminar. El usuario visual `visual-qa-20260921@example.test` conserva los datos introducidos por formularios únicamente para inspección local; no se incorpora al seed. Los usuarios nuevos empiezan sin movimientos.

## Refactor visual Nexum

- `pnpm exec eslint apps/web --max-warnings 0`: aprobado.
- `pnpm --filter web typecheck`: aprobado.
- `pnpm --filter web build`: aprobado. La primera descarga de Geist falló por falta de acceso de red; tras habilitarlo se compiló correctamente usando `next/font/google`, sin sustituciones.
- Geist: familia computada del navegador `Geist, "Geist Fallback", Inter, ...`; archivo WOFF2 precargado y servido por Next.js desde `/_next/static/media/`.
- Tema claro: `--accent: #5170ff`. Tema oscuro: `--accent: #6f87ff` y `--success: #3bc995` verificados en el navegador.
- Escritorio y móvil de 390 px: comprobados visualmente; sin desbordamiento horizontal del documento.
- Ingresos verdes, gastos coral, ahorro azul y gráficos semánticos verificados. Autenticación con degradado azul y acento coral revisada.
- Sin coincidencias en el código fuente para `emerald-`, `#087a5e`, `#0b9a77`, `#13a47e`, `#063f36`, `Arial` ni `Helvetica`.
- Sileo sigue siendo el único sistema de notificaciones; sus estados usan los nuevos tokens.

La revisión de marca no modifica backend, esquema, contratos, autenticación ni fórmulas financieras. Los límites funcionales del MVP están descritos en README.md.
