import { Pressable } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { router } from "expo-router";
import { Card, ProgressBar } from "./ui";
import type { Transaction, Goal } from "../types/api";
import { money, dateLabel, typeLabels } from "../utils/format";
import { useSession } from "../store/session";
export function Money({
  value,
  type,
  size = "$6",
  hidden = false,
}: {
  value: string;
  hidden?: boolean;
  type?: string;
  size?: "$4" | "$6" | "$8";
}) {
  const { user } = useSession();
  return (
    <Text
      fontSize={size}
      fontWeight="700"
      fontVariant={["tabular-nums"]}
      color={
        type === "INCOME"
          ? "$success"
          : type === "EXPENSE"
            ? "$coral"
            : type === "SAVING"
              ? "$accent"
              : "$color"
      }
    >
      {hidden ? "••••••" : money(value, user?.currency)}
    </Text>
  );
}
export function TransactionRow({
  item: t,
  hideAmounts = false,
}: {
  item: Transaction;
  hideAmounts?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${typeLabels[t.type]} ${t.description} ${hideAmounts ? "Importe oculto" : t.amount}`}
      onPress={() =>
        router.push({ pathname: "/transaction/[id]", params: { id: t.id } })
      }
    >
      <Card>
        <XStack justifyContent="space-between" gap="$3">
          <YStack flex={1} gap="$2">
            <Text fontWeight="600">{t.description || typeLabels[t.type]}</Text>
            <Text fontSize="$2" color="$muted">
              {typeLabels[t.type]} · {dateLabel(t.transactionDate)}
            </Text>
          </YStack>
          <Money
            value={t.amount}
            type={t.type}
            size="$4"
            hidden={hideAmounts}
          />
        </XStack>
      </Card>
    </Pressable>
  );
}
export function GoalCard({ goal: g }: { goal: Goal }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({ pathname: "/goal/[id]", params: { id: g.id } })
      }
    >
      <Card>
        <XStack justifyContent="space-between" gap="$2">
          <Text fontWeight="700" flex={1}>
            {g.name}
          </Text>
          <Text color="$accent">{Number(g.progress || 0).toFixed(0)}%</Text>
        </XStack>
        <ProgressBar value={g.progress || 0} />
        <XStack justifyContent="space-between">
          <Money type="SAVING" value={g.saved || "0"} size="$4" />
          <Text color="$muted">de {money(g.targetAmount)}</Text>
        </XStack>
        <Text color="$muted" fontSize="$2">
          {Number(g.progress) >= 100
            ? "¡Meta alcanzada!"
            : g.targetDate
              ? "Para el " + dateLabel(g.targetDate)
              : "A tu ritmo"}
        </Text>
      </Card>
    </Pressable>
  );
}
