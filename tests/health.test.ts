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

function get(
  baseUrl: string,
  path: string,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: Record<string, unknown>; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const req = http.request(
      url,
      { method: "GET", headers },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve({
            status: res.statusCode || 0,
            body: JSON.parse(data) as Record<string, unknown>,
            headers: res.headers,
          });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

test("health endpoint returns service, version, and requestId", async () => {
  const app = express();
  app.use(requestIdMiddleware);
  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      service: config.serviceName,
      version: config.version,
      requestId: (req as { requestId?: string }).requestId,
    });
  });

  const { server, baseUrl } = await listen(app);
  try {
    const resp = await get(baseUrl, "/health");
    assert.strictEqual(resp.status, 200);
    assert.strictEqual(resp.body.status, "ok");
    assert.strictEqual(resp.body.service, config.serviceName);
    assert.strictEqual(typeof resp.body.version, "string");
    assert.strictEqual(typeof resp.body.requestId, "string");
    assert.strictEqual(
      resp.headers[config.requestIdHeader.toLowerCase()],
      resp.body.requestId
    );
  } finally {
    server.close();
  }
});

test("request id middleware generates id when header is missing", async () => {
  const app = express();
  app.use(requestIdMiddleware);
  app.get("/probe", (req, res) => {
    res.json({ requestId: (req as { requestId?: string }).requestId });
  });

  const { server, baseUrl } = await listen(app);
  try {
    const resp = await get(baseUrl, "/probe");
    assert.match(String(resp.body.requestId), /^[0-9a-f-]{36}$/i);
    assert.strictEqual(
      resp.headers[config.requestIdHeader.toLowerCase()],
      resp.body.requestId
    );
  } finally {
    server.close();
  }
});

test("request id middleware echoes provided X-Request-Id header", async () => {
  const app = express();
  app.use(requestIdMiddleware);
  app.get("/probe", (req, res) => {
    res.json({ requestId: (req as { requestId?: string }).requestId });
  });

  const provided = "test-request-id-abc123";
  const { server, baseUrl } = await listen(app);
  try {
    const resp = await get(baseUrl, "/probe", { [config.requestIdHeader]: provided });
    assert.strictEqual(resp.body.requestId, provided);
    assert.strictEqual(resp.headers[config.requestIdHeader.toLowerCase()], provided);
  } finally {
    server.close();
  }
});
