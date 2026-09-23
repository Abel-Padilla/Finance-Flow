import { Tabs } from "expo-router";
import {
  House,
  ArrowLeftRight,
  ChartPie,
  Target,
  UserRound,
} from "@tamagui/lucide-icons";
import { useAppearance } from "../../src/store/theme";
export default function Layout() {
  const { colors } = useAppearance();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderColor,
        },
        tabBarLabelStyle: { fontSize: 10 },
      }}
    >
      {[
        { name: "index", title: "Inicio", Icon: House },
        { name: "transactions", title: "Movimientos", Icon: ArrowLeftRight },
        { name: "planning", title: "Planificación", Icon: ChartPie },
        { name: "goals", title: "Metas", Icon: Target },
        { name: "profile", title: "Perfil", Icon: UserRound },
      ].map(({ name, title, Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ focused, size }) => (
              <Icon color={focused ? "$accent" : "$muted"} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
