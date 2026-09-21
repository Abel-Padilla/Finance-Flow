import { TransactionEditor } from "../../../../components/transaction-editor";
export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1>Nuevo movimiento</h1>
        <p className="muted mt-2">
          Cada registro te ayuda a ver el panorama completo.
        </p>
      </div>
      <TransactionEditor />
    </div>
  );
}
