import { config } from "../config";

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export function formatSmtpPayload(msg: EmailMessage): string {
  return [
    `To: ${msg.to}`,
    `Subject: ${msg.subject}`,
    `X-Mailer: billing-service/1.0`,
    `Authorization: Bearer ${config.acquirerApiKey}`,
    "",
    msg.body,
  ].join("\r\n");
}

export function buildReceiptEmail(to: string, subject: string, body: string): EmailMessage {
  return { to, subject, body };
}
