import { defaultConfig as defaults } from "@tamagui/config/v4";
import { createTamagui } from "tamagui";
export const palette = {
  light: {
    background: "#f7f8fc",
    color: "#161a2b",
    surface: "#ffffff",
    soft: "#f1f3f9",
    muted: "#72788a",
    borderColor: "#e5e7ef",
    accent: "#5170ff",
    coral: "#ff5757",
    success: "#18a874",
    warning: "#f5a524",
    onAccent: "#0d0f17",
  },
  dark: {
    background: "#0d0f17",
    color: "#f2f4fa",
    surface: "#151821",
    soft: "#1d202b",
    muted: "#9298aa",
    borderColor: "#292d3a",
    accent: "#6f87ff",
    coral: "#ff7070",
    success: "#3bc995",
    warning: "#ffb84d",
    onAccent: "#0d0f17",
  },
};
const config = createTamagui({
  ...defaults,
  settings: {
    ...defaults.settings,
    onlyAllowShorthands: false,
    allowedStyleValues: "somewhat-strict",
  },
  themes: {
    light: { ...defaults.themes.light, ...palette.light },
    dark: { ...defaults.themes.dark, ...palette.dark },
  },
});
export type AppConfig = typeof config;
declare module "tamagui" {
  // Tamagui requires interface augmentation to register application tokens.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppConfig {}
}
export default config;
