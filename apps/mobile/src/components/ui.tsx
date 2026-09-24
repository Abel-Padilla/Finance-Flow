import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Alert,
  Pressable,
  Modal,
  View,
  Text as NativeText,
  FlatList,
  Keyboard,
  StyleSheet,
} from "react-native";
import { YStack, XStack, Text, Button, Spinner } from "tamagui";
import { ChevronDown } from "@tamagui/lucide-icons";
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
  const insets = useSafeAreaInsets();
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        accessibilityValue={{
          text: options.find((o) => o.value === value)?.label || "Seleccionar",
        }}
        onPress={() => {
          Keyboard.dismiss();
          setOpen(true);
        }}
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
      <Modal
        visible={open}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        onRequestClose={() => setOpen(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar opciones"
            onPress={() => setOpen(false)}
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(0,0,0,0.45)" },
            ]}
          />
          <View
            accessibilityViewIsModal
            onAccessibilityEscape={() => setOpen(false)}
            style={{
              height: "65%",
              padding: 20,
              paddingBottom: Math.max(insets.bottom, 16),
              paddingHorizontal: Math.max(insets.left, insets.right, 20),
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              backgroundColor: colors.surface,
            }}
          >
            <NativeText
              accessibilityRole="header"
              style={{
                color: colors.color,
                fontSize: 20,
                fontWeight: "700",
                marginBottom: 16,
              }}
            >
              {label}
            </NativeText>
            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              extraData={value}
              style={{ flex: 1 }}
              keyboardShouldPersistTaps="always"
              ListEmptyComponent={
                <NativeText
                  style={{ color: colors.muted, paddingVertical: 20 }}
                >
                  No hay opciones disponibles.
                </NativeText>
              }
              renderItem={({ item: o }) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: o.value === value }}
                  accessibilityLabel={o.label}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  style={({ pressed }) => ({
                    minHeight: 52,
                    padding: 14,
                    marginBottom: 8,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    backgroundColor:
                      o.value === value || pressed
                        ? colors.soft
                        : colors.surface,
                  })}
                >
                  <NativeText
                    style={{ flex: 1, color: colors.color, fontSize: 16 }}
                  >
                    {o.label}
                  </NativeText>
                  {o.value === value && (
                    <NativeText
                      accessible={false}
                      style={{ color: colors.accent, fontSize: 20 }}
                    >
                      ✓
                    </NativeText>
                  )}
                </Pressable>
              )}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar opciones"
              onPress={() => setOpen(false)}
              style={{
                minHeight: 48,
                marginTop: 12,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
                backgroundColor: colors.soft,
              }}
            >
              <NativeText
                style={{ color: colors.color, fontSize: 16, fontWeight: "600" }}
              >
                Cerrar
              </NativeText>
            </Pressable>
          </View>
        </View>
      </Modal>
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
