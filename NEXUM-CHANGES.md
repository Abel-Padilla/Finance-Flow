# Identidad visual Nexum

El frontend conserva su estructura, comportamiento, espacios y componentes existentes. La paleta global preexistente se conectó a todos los componentes que todavía usaban estilos emerald o colores anteriores.

## Archivos modificados

| Archivo dentro de apps/web        | Cambio                                                                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| app/globals.css                   | Tokens semánticos, contrastes para texto, Geist, estilos compartidos, estados Sileo; eliminación del sistema alternativo de botones sin uso |
| app/layout.tsx                    | Geist mediante next/font/google, subset latin, variable --font-geist y display swap                                                         |
| app/onboarding/page.tsx           | Indicadores de pasos en azul Nexum                                                                                                          |
| components/ui/button.tsx          | Botones primarios, hover/active/focus y destructivos conectados a tokens                                                                    |
| components/shell.tsx              | Marca, navegación, avatar e iconos de marca en azul                                                                                         |
| components/auth-page.tsx          | Texto del panel de autenticación y enlaces coherentes con Nexum                                                                             |
| components/dashboard.tsx          | KPI, metas, importes, badges, gráficas, leyendas y tooltips semánticos                                                                      |
| components/transactions.tsx       | Importes y badges por tipo; eliminación en coral                                                                                            |
| components/transaction-editor.tsx | Enlace del estado vacío en azul                                                                                                             |
| components/resources.tsx          | Acciones destructivas en coral                                                                                                              |
| components/planning.tsx           | Presupuesto excedido en coral                                                                                                               |
| lib/financial-style.ts (nuevo)    | Mapeo compartido de estilos de ingresos, gastos y ahorro                                                                                    |

## Clasificación de colores

- Marca, enlaces, navegación activa, selección y ahorro: `--accent` y sus variantes.
- Ingresos y flujo positivo: `--success`; el verde se conserva exclusivamente con esta semántica.
- Gastos, errores y eliminación: `--coral` y sus variantes.
- Avisos: `--warning`.
- Los gráficos de categorías de gasto utilizan tonos derivados de coral y azul, sin verdes que sugieran ingresos.
- Texto pequeño: variantes derivadas `--accent-text`, `--coral-text`, `--success-text` y `--warning-text` para mejorar el contraste sin agregar una paleta independiente.
- Se utiliza texto oscuro sobre botones azul/coral para mantener contraste con los colores exactos solicitados.

No quedan clases emerald ni colores verdes de la marca anterior. Los únicos verdes son los tokens de éxito/ingreso especificados. Los fallbacks tipográficos son Inter y fuentes de sistema; Geist se descarga durante la compilación y se sirve localmente a los visitantes.

Resultados completos de lint, tipos, compilación y revisión visual: VERIFICATION.md.
