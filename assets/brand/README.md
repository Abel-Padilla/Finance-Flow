# Nexum — identidad de las aplicaciones

Fuentes vectoriales: `nexum-logo.svg` (horizontal) y `nexum-icon.svg` (símbolo). Colores originales: azul #5170ff, coral #ff5757, letras #545454. Las letras se muestran en #f2f4fa sobre fondos oscuros; las formas y los colores del símbolo se conservan.

Web: componente `apps/web/components/brand-logo.tsx`, navegación, login/registro y onboarding a través de Brand; recursos públicos en `apps/web/public/brand`. Favicon SVG y apple-touch-icon PNG configurados en los metadatos.

Móvil: `BrandLogo` utiliza react-native-svg y los trazados de `brand-assets.ts`, sin descargar imágenes ni requerir fuentes. Se muestra en acceso, onboarding e inicio. `apps/mobile/assets/brand` contiene los PNG derivados para el sistema operativo: icono opaco de 1024 px, primer plano adaptativo transparente de Android, pantalla de arranque y favicon. Expo los referencia desde `app.json`.

Los cambios en el icono del sistema y la pantalla de arranque requieren reconstruir e instalar el binario nativo; una recarga de JavaScript o Expo Go no sustituye esa comprobación. No se generó ni instaló un binario firmado durante esta integración.
