# Validación móvil — 22 de septiembre de 2026

## Implementado

`apps/mobile` forma parte del workspace pnpm existente. Expo SDK 57, React Native 0.86.3, React 19.2.3, TypeScript estricto 6.0.x, Expo Router, Tamagui 1.144.4, React Hook Form, Zod, SecureStore e iconos Lucide. Se actualizó el lockfile existente y se excluyeron los archivos generados `.expo` del lint. No se creó un repositorio Git anidado ni un segundo backend. La implementación móvil no modificó el código de la API ni de la web.

Incluye autenticación y restauración de sesión, configuración inicial, cinco pestañas, dashboard, CRUD de cuentas/movimientos/categorías/metas, filtros por tipo/cuenta/categoría/fechas/texto y paginación, presupuesto, perfil, tema, confirmaciones de eliminación, formularios y estados de red.

## Evidencia

- 12 pruebas unitarias del móvil: configuración HTTPS, lectura de cookie HttpOnly, aislamiento de headers, rotación concurrente y respuestas atrasadas, restauración simultánea, revocación/errores transitorios, cierre durante renovación, aislamiento entre APIs, dinero decimal, fechas, referencias y porcentajes.
- 1 prueba de integración del cliente móvil contra la API y PostgreSQL locales: registro, onboarding, restauración con rotación de cookie, cuentas, categorías, movimientos, edición, agregados exactos de dashboard/metas, presupuesto, conflicto 409, borrados, perfil y revocación. Limpieza limitada a su usuario temporal.
- 8 pruebas existentes de la API aprobadas, incluidas finanzas decimales, autenticación y aislamiento entre usuarios.
- Typecheck de API/web/móvil aprobado; lint del monorepo aprobado.
- Compilación de API y Next.js aprobada.
- `expo install --check`: dependencias actualizadas y compatibles con la versión instalada.
- Expo Doctor: 21/21 comprobaciones aprobadas.
- Exportación de bundles JavaScript y recursos para iOS y Android realizada. No equivale a un binario nativo firmado.
- Metro iniciado en modo CI en el puerto 8082. `/status` respondió `packager-status:running`.

## Pendientes de entorno y validación en dispositivo

No hay simulador Xcode funcional ni Android SDK/adb disponible. No se afirma haber probado visualmente navegación, teclado, sheets, temas, almacenamiento en Keychain/Keystore ni cookies nativas en un teléfono. Las pruebas del cliente usan el transporte fetch de Node y un adaptador de almacenamiento en memoria; validan el protocolo real del backend, no sustituyen la prueba de SecureStore y expo/fetch en dispositivo.

El modo interactivo de Metro encontró `EMFILE` por el límite de observadores de macOS. No se concedieron permisos para instalar Watchman. Metro funciona en modo CI sin recarga automática. El instalador opcional de React Native DevTools también informó un error en este entorno; no impidió que el servidor en modo CI respondiera.

Tamagui 1.144.4 contiene una referencia opcional al antiguo renderer `ReactNative` que ya no existe en RN 0.86. Metro emite una advertencia de resolución y completa la exportación. El código de Tamagui selecciona ReactFabric en la arquitectura nueva. Esta compatibilidad debe comprobarse en dispositivo antes de distribuir la app; no se modificaron dependencias internamente ni se ocultó el aviso.

La URL real de Render no fue proporcionada. La exportación de validación utiliza una dirección HTTPS reservada de ejemplo y se guarda fuera de los entregables, en `work/mobile-native-export`; no debe publicarse. Configura la URL real antes de generar un artefacto de distribución.

## Recorrido de aceptación en dispositivo

1. Configurar `EXPO_PUBLIC_API_URL` con una API alcanzable y abrir en Expo Go compatible con SDK 57.
2. Registrar usuario, completar onboarding y entrar en las cinco pestañas; cerrar/abrir la app y verificar sesión.
3. Crear ingresos, gastos y ahorros; editar y eliminar; comparar saldos y metas con la web.
4. Probar categorías, cuentas, filtros, paginación, presupuesto y ajustes de perfil.
5. Cambiar claro/oscuro; probar teclado y sheets en pantalla pequeña y pull-to-refresh.
6. Desconectar la red, reconectar, comprobar errores y reintentos. Dejar vencer el acceso, renovar y cerrar sesión; comprobar que la cookie revocada ya no funciona.
