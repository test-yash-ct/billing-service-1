import test from "node:test";
import assert from "node:assert";
import express from "express";
import http from "node:http";
import { requestIdMiddleware } from "../src/middleware/requestId";
import { config } from "../src/config";

function listen(app: express.Express): Promise<{ server: http.Server; baseUrl: string }> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        reject(new Error("unable to bind test server"));
        return;
      }
      resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}` });
    });
  });
}

test("structured log includes requestId and service fields", async () => {
  const { log } = await import("../src/lib/logger");
  const chunks: string[] = [];
  const stdout = process.stdout as NodeJS.WriteStream & {
    write: (chunk: string | Uint8Array) => boolean;
  };
  const originalWrite = stdout.write.bind(stdout);
  stdout.write = (chunk: string | Uint8Array) => {
    chunks.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
    return true;
  };

  try {
    log("info", "test_event", { requestId: "rid-123" });
    const parsed = JSON.parse(chunks[0]) as Record<string, unknown>;
    assert.strictEqual(parsed.service, config.serviceName);
    assert.strictEqual(parsed.requestId, "rid-123");
    assert.strictEqual(parsed.message, "test_event");
  } finally {
    stdout.write = originalWrite;
  }
});

test("request id propagates through middleware chain", async () => {
  const app = express();
  app.use(requestIdMiddleware);
  app.use((req, _res, next) => {
    (req as { downstream?: string }).downstream = (
      req as { requestId?: string }
    ).requestId;
    next();
  });
  app.get("/chain", (req, res) => {
    res.json({
      requestId: (req as { requestId?: string }).requestId,
      downstream: (req as { downstream?: string }).downstream,
    });
  });

  const { server, baseUrl } = await listen(app);
  try {
    const url = new URL("/chain", baseUrl);
    const body = await new Promise<Record<string, unknown>>((resolve, reject) => {
      http
        .get(url, { headers: { [config.requestIdHeader]: "chain-id-99" } }, (res) => {
          let data = "";
          res.on("data", (c) => {
            data += c;
          });
          res.on("end", () => resolve(JSON.parse(data) as Record<string, unknown>));
        })
        .on("error", reject);
    });
    assert.strictEqual(body.requestId, "chain-id-99");
    assert.strictEqual(body.downstream, "chain-id-99");
  } finally {
    server.close();
  }
});
