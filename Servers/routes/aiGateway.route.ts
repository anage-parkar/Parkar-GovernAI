/**
 * AI Gateway Routes — thin proxy to FastAPI AIGateway service.
 *
 * All logic (CRUD, chat proxy, guardrails, spend, etc.) lives in the
 * AIGateway Python service. Express only handles JWT authentication and
 * forwards the request with tenant context headers.
 */

import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import authenticateJWT from "../middleware/auth.middleware";
import express, { Request, Router } from "express";

const AI_GATEWAY_URL = process.env.AI_GATEWAY_URL || "http://127.0.0.1:8100";
const AI_GATEWAY_KEY = process.env.AI_GATEWAY_INTERNAL_KEY || "";

const jsonParser = express.json({ limit: "50mb" });

// Inject the internal key + tenant context headers onto every proxied request.
function injectGatewayHeaders(proxyReq: any, req: Request) {
  proxyReq.setHeader("x-internal-key", AI_GATEWAY_KEY);
  if (req.organizationId) {
    proxyReq.setHeader("x-organization-id", req.organizationId.toString());
  }
  if (req.userId) {
    proxyReq.setHeader("x-user-id", req.userId.toString());
  }
  if (req.role) {
    proxyReq.setHeader("x-role", req.role);
  }
}

function aiGatewayRoutes() {
  const router = Router();

  const proxy = createProxyMiddleware({
    target: AI_GATEWAY_URL,
    changeOrigin: true,
    timeout: 30_000, // 30s — abort if AI Gateway doesn't respond
    proxyTimeout: 30_000, // 30s — abort if connection takes too long
    // /api/ai-gateway/* → /internal/*
    pathRewrite: { "^/": "/internal/" },
    on: {
      proxyReq: (proxyReq, req) => {
        injectGatewayHeaders(proxyReq, req as Request);
        // Re-stream parsed body to proxy target
        fixRequestBody(proxyReq, req as Request);
      },
      error: (err, req, res) => {
        const errAny = err as any;
        const isConnectionRefused = errAny.code === "ECONNREFUSED" || errAny.code === "ECONNRESET";

        // For read-only GET endpoints, return a graceful empty response when the
        // AI Gateway service is not running, so the UI degrades silently.
        if (isConnectionRefused && req.method === "GET" && res && "writeHead" in res) {
          (res as any).writeHead(200, { "Content-Type": "application/json" });
          (res as any).end(JSON.stringify({ data: [] }));
          return;
        }

        console.error(
          `[AI Gateway Proxy] Error for ${req.url}:`,
          errAny.message || errAny.code || errAny,
        );
        if (res && "writeHead" in res) {
          (res as any).writeHead(502, { "Content-Type": "application/json" });
          (res as any).end(
            JSON.stringify({
              error: "AI Gateway proxy error",
              message: errAny.message || errAny.code || "Unknown error",
            }),
          );
        }
      },
    },
  });

  // FlowTrace live stream (SSE) — long-lived, so it gets its own proxy with no
  // timeout and no body parser. Must be registered BEFORE the catch-all.
  const streamProxy = createProxyMiddleware({
    target: AI_GATEWAY_URL,
    changeOrigin: true,
    timeout: 0, // SSE: never time out the upstream connection
    proxyTimeout: 0,
    pathRewrite: { "^/": "/internal/" },
    on: {
      proxyReq: (proxyReq, req) => {
        injectGatewayHeaders(proxyReq, req as Request);
      },
      error: (err, _req, res) => {
        const e = err as any;
        if (res && "writeHead" in res && !(res as any).headersSent) {
          (res as any).writeHead(502, { "Content-Type": "application/json" });
          (res as any).end(JSON.stringify({ error: "AI Gateway stream error", message: e.message || e.code }));
        }
      },
    },
  });
  router.get("/flowtrace/traces/stream", authenticateJWT, streamProxy);

  // All other routes: authenticate JWT, parse body, forward to AIGateway
  router.use("/", authenticateJWT, jsonParser, proxy);

  return router;
}

export default aiGatewayRoutes;
