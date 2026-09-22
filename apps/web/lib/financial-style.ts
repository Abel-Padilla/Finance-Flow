export const financialStyle = {
  INCOME: {
    amount: "amount-income",
    pill: "pill success",
    icon: "icon-tile income",
  },
  EXPENSE: {
    amount: "amount-expense",
    pill: "pill expense",
    icon: "icon-tile expense",
  },
  SAVING: { amount: "amount-saving", pill: "pill primary", icon: "icon-tile" },
} as const;
export function transactionStyle(type: string) {
  return (
    financialStyle[type as keyof typeof financialStyle] || financialStyle.SAVING
  );
}
