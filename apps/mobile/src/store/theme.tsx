import { createContext, useContext, useState } from "react";
import { useColorScheme } from "react-native";
import { TamaguiProvider } from "tamagui";
import config, { palette } from "../../tamagui.config";
type Preference = "system" | "light" | "dark";
const Context = createContext({
  mode: "light" as "light" | "dark",
  preference: "system" as Preference,
  setPreference: (_v: Preference) => {},
  colors: palette.light,
});
export const useAppearance = () => useContext(Context);
export function AppearanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const system = useColorScheme(),
    [preference, setPreference] = useState<Preference>("system");
  const mode =
    preference === "system"
      ? system === "dark"
        ? "dark"
        : "light"
      : preference;
  return (
    <Context.Provider
      value={{ mode, preference, setPreference, colors: palette[mode] }}
    >
      <TamaguiProvider config={config} defaultTheme={mode}>
        {children}
      </TamaguiProvider>
    </Context.Provider>
  );
}
