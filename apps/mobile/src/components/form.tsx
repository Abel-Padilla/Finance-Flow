import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { YStack, Text, Input } from "tamagui";
import { useState } from "react";
import { Action, Picker, type Option, ErrorBox } from "./ui";
export interface Field {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "money" | "date";
  options?: Option[];
  hint?: string;
}
// Zod transforms string inputs into the exact DTO shape; presentation never calculates balances.
export function Form({
  schema,
  initial,
  fields,
  onSubmit,
  label = "Guardar cambios",
}: {
  schema: z.ZodType<Record<string, unknown>, Record<string, unknown>>;
  initial: Record<string, unknown>;
  fields: Field[];
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  label?: string;
}) {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({ defaultValues: initial, resolver: zodResolver(schema) });
  const [error, setError] = useState("");
  return (
    <YStack gap="$4">
      {fields.map((f) => (
        <Controller
          key={f.name}
          name={f.name}
          control={control}
          render={({ field, fieldState }) => (
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="600" color="$color">
                {f.label}
              </Text>
              {f.options ? (
                <Picker
                  label={f.label}
                  options={f.options}
                  value={String(field.value ?? "")}
                  onChange={field.onChange}
                />
              ) : (
                <Input
                  accessibilityLabel={f.label}
                  value={String(field.value ?? "")}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  secureTextEntry={f.type === "password"}
                  autoCapitalize={
                    f.type === "email" || f.type === "password"
                      ? "none"
                      : "sentences"
                  }
                  autoCorrect={
                    f.type === "email" || f.type === "password"
                      ? false
                      : undefined
                  }
                  keyboardType={
                    f.type === "email"
                      ? "email-address"
                      : f.type === "money"
                        ? "decimal-pad"
                        : "default"
                  }
                  placeholder={f.type === "date" ? "AAAA-MM-DD" : undefined}
                  minHeight={50}
                  borderColor={fieldState.error ? "$coral" : "$borderColor"}
                  backgroundColor="$surface"
                  color="$color"
                />
              )}
              {f.hint && (
                <Text color="$muted" fontSize="$2">
                  {f.hint}
                </Text>
              )}
              {fieldState.error && (
                <Text color="$coral" fontSize="$2" accessibilityRole="alert">
                  {fieldState.error.message}
                </Text>
              )}
            </YStack>
          )}
        />
      ))}
      {error && <ErrorBox message={error} />}
      <Action
        disabled={isSubmitting}
        onPress={handleSubmit(async (values) => {
          setError("");
          try {
            await onSubmit(values);
          } catch (e) {
            setError((e as Error).message);
          }
        })}
      >
        {isSubmitting ? "Guardando…" : label}
      </Action>
    </YStack>
  );
}
