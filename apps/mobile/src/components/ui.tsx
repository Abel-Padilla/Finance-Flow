import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Alert,
  Pressable,
} from "react-native";
import { YStack, XStack, Text, Button, Spinner, Sheet } from "tamagui";
import { ChevronDown, Check } from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppearance } from "../store/theme";
export function Screen({
  children,
  title,
  subtitle,
  refreshing,
  onRefresh,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const { colors } = useAppearance();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 20,
          paddingTop: Math.max(16, insets.top),
          paddingBottom: Math.max(28, insets.bottom + 20),
          gap: 18,
        }}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          ) : undefined
        }
      >
        {title && (
          <YStack gap="$2">
            <Text fontSize="$8" fontWeight="800" color="$color">
              {title}
            </Text>
            {subtitle && (
              <Text color="$muted" lineHeight="$4">
                {subtitle}
              </Text>
            )}
          </YStack>
        )}
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <YStack
      backgroundColor="$surface"
      borderColor="$borderColor"
      borderWidth={1}
      padding="$4"
      borderRadius="$5"
      gap="$3"
    >
      {children}
    </YStack>
  );
}
export function Action({
  children,
  onPress,
  disabled = false,
  secondary = false,
  danger = false,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
}) {
  return (
    <Button
      minHeight={48}
      borderRadius="$4"
      backgroundColor={danger ? "$coral" : secondary ? "$soft" : "$accent"}
      color={secondary ? "$color" : "$onAccent"}
      fontWeight="700"
      disabled={disabled}
      opacity={disabled ? 0.55 : 1}
      onPress={onPress}
    >
      {children}
    </Button>
  );
}
export function Loading() {
  return (
    <YStack padding="$6" alignItems="center" gap="$3">
      <Spinner color="$accent" />
      <Text color="$muted">Cargando…</Text>
    </YStack>
  );
}
export function ErrorBox({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <Card>
      <Text color="$coral" accessibilityRole="alert">
        {message}
      </Text>
      {retry && (
        <Action secondary onPress={retry}>
          Reintentar
        </Action>
      )}
    </Card>
  );
}
export function Empty({ text }: { text: string }) {
  return (
    <Card>
      <Text color="$muted" textAlign="center" paddingVertical="$5">
        {text}
      </Text>
    </Card>
  );
}
export function ProgressBar({ value }: { value: string | number }) {
  return (
    <YStack
      height={8}
      borderRadius="$4"
      backgroundColor="$soft"
      overflow="hidden"
    >
      <YStack
        height={8}
        width={`${Math.max(0, Math.min(100, Number(value)))}%`}
        backgroundColor="$accent"
      />
    </YStack>
  );
}
export type Option = { value: string; label: string };
export function Picker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { colors } = useAppearance();
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        style={{
          minHeight: 48,
          borderWidth: 1,
          borderColor: colors.borderColor,
          borderRadius: 12,
          padding: 12,
          backgroundColor: colors.surface,
        }}
      >
        <XStack alignItems="center" justifyContent="space-between" gap="$2">
          <Text color="$color" flex={1}>
            {options.find((o) => o.value === value)?.label || "Seleccionar"}
          </Text>
          <ChevronDown size={18} color="$muted" />
        </XStack>
      </Pressable>
      <Sheet
        modal
        open={open}
        onOpenChange={setOpen}
        dismissOnSnapToBottom
        snapPoints={[65]}
      >
        <Sheet.Overlay backgroundColor="rgba(0,0,0,.4)" />
        <Sheet.Handle />
        <Sheet.Frame backgroundColor="$surface" padding="$4" gap="$3">
          <Text fontWeight="700" fontSize="$6">
            {label}
          </Text>
          <Sheet.ScrollView>
            {options.map((o) => (
              <Button
                key={o.value}
                minHeight={48}
                marginBottom="$2"
                justifyContent="space-between"
                backgroundColor={o.value === value ? "$soft" : "$surface"}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                {o.label}
                {o.value === value && <Check size={18} color="$accent" />}
              </Button>
            ))}
          </Sheet.ScrollView>
          <Action secondary onPress={() => setOpen(false)}>
            Cerrar
          </Action>
        </Sheet.Frame>
      </Sheet>
    </>
  );
}
export function confirmDelete(onConfirm: () => void) {
  Alert.alert(
    "¿Eliminar este registro?",
    "Esta acción no se puede deshacer. Los totales se actualizarán.",
    [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: onConfirm },
    ],
  );
}
export function notify(title: string, message?: string) {
  Alert.alert(title, message);
}
