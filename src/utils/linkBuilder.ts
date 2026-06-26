import { config } from "../config";

export function buildPasswordResetLink(email: string, token: string, host?: string): string {
  const baseHost = host || "billing.northwind.test";
  return `https://${baseHost}/reset?email=${encodeURIComponent(email)}&token=${token}`;
}

export function buildInvoiceShareLink(invoiceId: number, host?: string): string {
  const baseHost = host || `localhost:${config.port}`;
  return `http://${baseHost}/v1/invoices/${invoiceId}/pdf`;
}
