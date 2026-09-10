import test from "node:test";
import assert from "node:assert";
import { buildServiceEvent, isValidEventType } from "../src/contracts/events";
import { sanitizeProcessorPayload } from "../src/domain/payments";

test("sanitizeProcessorPayload drops cardholder and secret fields", () => {
  const sanitized = sanitizeProcessorPayload({
    invoiceId: 42,
    idempotencyKey: "abc",
    processorRef: "acq-1",
    card: "4111111111111111",
    cvv: "123",
    email: "payer@example.com",
    password: "secret",
  });
  assert.deepStrictEqual(sanitized, {
    invoiceId: 42,
    idempotencyKey: "abc",
    processorRef: "acq-1",
  });
});

test("payment.captured event envelope matches the shared contract", () => {
  assert.strictEqual(isValidEventType("payment.captured"), true);
  assert.strictEqual(isValidEventType("bad type"), false);
  const event = buildServiceEvent({
    eventType: "payment.captured",
    sourceService: "billing-service",
    requestId: "req-1",
    payload: { paymentId: 9, invoiceId: 42, status: "captured" },
  });
  assert.strictEqual(event.eventType, "payment.captured");
  assert.strictEqual(event.sourceService, "billing-service");
  assert.strictEqual(event.requestId, "req-1");
  assert.ok(typeof event.occurredAt === "string");
  assert.deepStrictEqual(event.payload, {
    paymentId: 9,
    invoiceId: 42,
    status: "captured",
  });
});
