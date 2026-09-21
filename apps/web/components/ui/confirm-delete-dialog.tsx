"use client";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Button } from "./button";
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "¿Eliminar este registro?",
  description = "Esta acción no se puede deshacer. Los totales se actualizarán.",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm" />
        <AlertDialog.Content className="dialog">
          <AlertDialog.Title className="text-xl font-bold">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="muted my-4">
            {description}
          </AlertDialog.Description>
          <div className="flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button variant="outline">Cancelar</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button variant="destructive" onClick={onConfirm}>
                Confirmar
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
