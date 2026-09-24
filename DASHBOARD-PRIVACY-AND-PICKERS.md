# Dashboard privado y selectores móviles — 24 de septiembre de 2026

## Cambios

- Web y móvil: control Mostrar/Ocultar importes en el dashboard. Sustituye los montos por una máscara uniforme y oculta los gráficos monetarios y el texto de insights mientras está activo. Incluye movimientos recientes, metas y presupuesto cuando se muestran en el dashboard web. Porcentajes y fechas permanecen visibles.
- La preferencia se guarda por navegador/dispositivo (localStorage en web, SecureStore en móvil). Durante su lectura inicial los importes permanecen ocultos. No modifica datos financieros ni cambia la visualización en otras pantallas.
- Las etiquetas de accesibilidad de los movimientos recientes del móvil tampoco exponen el importe cuando está oculto.
- Selector compartido móvil: se sustituyó Tamagui Sheet por React Native Modal con lista desplazable, selección marcada, área segura, cierre, fondo pulsable y soporte de botón Atrás de Android. Se cierra el teclado antes de abrir las opciones. No requiere paquetes nativos nuevos.

## Verificación

- En el simulador iPhone 18 Pro / iOS 27: el toggle cambió los montos visibles por máscaras; el árbol de accesibilidad dejó de contener importes monetarios en tarjetas, movimientos e insights.
- En un formulario modal de nuevo movimiento: el selector de categorías mostró opciones; elegir Alimentación cerró el selector y actualizó el campo. También se abrió correctamente el selector de cuentas. No se envió ningún movimiento durante la prueba.
- TypeScript y lint aprobados; compilación de Next.js con Webpack aprobada.
- No se ha realizado una prueba interactiva en Android ni en un dispositivo físico durante este cambio.
