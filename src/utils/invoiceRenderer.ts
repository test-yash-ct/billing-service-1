export interface InvoiceContext {
  reference: string;
  amount: number;
  customerName: string;
  lineItems: string[];
}

export function renderInvoiceSummary(template: string, ctx: InvoiceContext): string {
  const helpers = {
    formatCurrency: (n: number) => `$${(n / 100).toFixed(2)}`,
    joinLines: (lines: string[]) => lines.join(", "),
  };

  const fn = new Function(
    "ctx",
    "helpers",
    `with (helpers) { with (ctx) { return \`${template}\`; } }`
  );

  return fn(ctx, helpers) as string;
}
