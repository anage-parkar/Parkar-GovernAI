/**
 * useTraceStream — subscribe to the FlowTrace live SSE stream.
 *
 * Uses fetch() + ReadableStream (not EventSource) so we can send the JWT in the
 * Authorization header, mirroring the app's existing useNotifications hook.
 * Auto-reconnects with backoff. Emits parsed { event, data } messages.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState, store } from "../../../../application/redux/store";
import { ENV_VARs } from "../../../../../env.vars";

export interface TraceStreamMessage {
  event: "span" | "trace.completed" | string;
  data: any;
}

const RECONNECT_MS = 3000;

export function useTraceStream(
  onMessage: (msg: TraceStreamMessage) => void,
  opts: { agent?: string | null; enabled?: boolean } = {},
) {
  const { agent = null, enabled = true } = opts;
  const authToken = useSelector((s: RootState) => s.auth.authToken);
  const [connected, setConnected] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualCloseRef = useRef(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(async () => {
    if (!enabled || !authToken) return;
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }

    try {
      const qs = agent ? `?agent=${encodeURIComponent(agent)}` : "";
      const url = `${ENV_VARs.URL}/api/ai-gateway/flowtrace/traces/stream${qs}`;
      const abort = new AbortController();
      abortRef.current = abort;
      manualCloseRef.current = false;

      const headers: Record<string, string> = {
        Authorization: `Bearer ${authToken}`,
        Accept: "text/event-stream",
      };
      const activeOrgId = store.getState().auth.activeOrganizationId;
      if (activeOrgId) headers["X-Organization-Id"] = String(activeOrgId);

      const res = await fetch(url, { method: "GET", headers, signal: abort.signal });
      if (!res.ok || !res.body) throw new Error(`stream failed: ${res.status}`);

      setConnected(true);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() || "";
        for (const frame of frames) {
          let event = "span";
          let dataLine = "";
          for (const line of frame.split("\n")) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            else if (line.startsWith("data:")) dataLine += line.slice(5).trim();
          }
          if (!dataLine) continue;
          try {
            const parsed = JSON.parse(dataLine);
            // gateway wraps as { event, data }; unwrap to the inner payload
            const inner = parsed?.data !== undefined ? parsed.data : parsed;
            onMessageRef.current({ event: parsed?.event || event, data: inner });
          } catch {
            /* ignore malformed frame */
          }
        }
      }
    } catch (e: any) {
      if (e?.name === "AbortError") return;
    } finally {
      setConnected(false);
      if (!manualCloseRef.current && enabled) {
        reconnectRef.current = setTimeout(() => connect(), RECONNECT_MS);
      }
    }
  }, [agent, authToken, enabled]);

  useEffect(() => {
    connect();
    return () => {
      manualCloseRef.current = true;
      if (abortRef.current) abortRef.current.abort();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connect]);

  return { connected };
}
