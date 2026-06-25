/**
 * Agent Monitor (FlowTrace) — live agent graph + request tracing.
 *
 * For a selected agent we render its topology (agent → gateway[guardrail ring]
 * → llm + connected MCP servers → tools) and animate the real path each request
 * takes, live over SSE. Visual language matches docs/design/flowtrace.html.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box } from "@mui/material";
import { Sparkles, AlertTriangle } from "lucide-react";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import FlowGraph, { FlowGraphHandle, GraphTopology, Span } from "./FlowGraph";
import { useTraceStream, TraceStreamMessage } from "./useTraceStream";
import { FLOWTRACE_CSS } from "./styles";

interface AgentRow {
  key: string;
  name: string;
  model: string | null;
  traces: number;
  users: number;
  last_ts: string | null;
}
interface TraceRow {
  trace_id: string;
  agent_key: string;
  requester?: string | null;
  status: string;
  path: string[];
  totals: { latency_ms: number; tokens: number; cost_usd: number };
}
interface LogRow {
  id: string;
  tag: string;
  msg: string;
  trace: string;
}

const HOP_ORDER = ["agent", "gateway", "guardrail", "llm", "mcp", "tool"];
const HOP_COLOR: Record<string, string> = {
  agent: "--agent", gateway: "--gateway", guardrail: "--guardrail",
  llm: "--llm", mcp: "--mcp", tool: "--tool",
};

function ts(): string {
  const d = new Date();
  return d.toTimeString().slice(0, 8) + "." + String(d.getMilliseconds()).padStart(3, "0");
}

function spanLog(span: Span): { tag: string; msg: string } {
  const a = span.attrs || {};
  switch (span.type) {
    case "agent":
      return { tag: "agent", msg: `<b>${a.requester || span.name}</b> issued request` };
    case "gateway":
      return { tag: "gateway", msg: `routed · <b>${a.endpoint || a.model || "endpoint"}</b>` };
    case "guardrail":
      if (span.status === "block") return { tag: "block", msg: `<b>BLOCKED</b> · policy violation` };
      if (span.status === "mask") return { tag: "guardrail", msg: `<b>masked</b> · PII entities` };
      return { tag: "guardrail", msg: `checks · <b>no matches</b>` };
    case "llm":
      return { tag: "llm", msg: `completion · <b>${(a.tokens || 0).toLocaleString()} tok</b> · $${Number(a.cost_usd || 0).toFixed(3)}` };
    case "mcp":
      return { tag: "mcp", msg: `server · tool call <b>authorized</b>` };
    case "tool":
      return { tag: span.status === "error" ? "error" : "tool", msg: `${span.name} → <b>${a.status_code || span.status}</b>` };
    default:
      return { tag: "sys", msg: span.type };
  }
}

function localInsight(t: TraceRow): string {
  if (t.status === "block")
    return "A guardrail blocked this request before it reached the model or any MCP server — nothing sensitive left the gateway.";
  if (t.status === "mask")
    return "The guardrail masked PII in the prompt before the model saw it, then the agent completed normally. No raw identifiers left the gateway.";
  if (t.status === "error")
    return "This trace ended in an error downstream. Latency and the failing hop are shown in the waterfall.";
  const hops = t.path.join(" → ");
  return `Normal trace: ${hops}. ${t.totals.tokens.toLocaleString()} tokens, $${t.totals.cost_usd.toFixed(3)}, ${(t.totals.latency_ms / 1000).toFixed(2)}s end to end — within this agent's baseline.`;
}

export default function AgentMonitoring() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [topology, setTopology] = useState<GraphTopology | null>(null);
  const [recent, setRecent] = useState<TraceRow[]>([]);
  const [log, setLog] = useState<LogRow[]>([]);
  const [traceId, setTraceId] = useState<string>("trc_—");
  const [badge, setBadge] = useState<string>("idle");
  const [hops, setHops] = useState<Record<string, number>>({});
  const [totals, setTotals] = useState<{ latency_ms: number; tokens: number; cost_usd: number } | null>(null);
  const [insight, setInsight] = useState<string>("Waiting for the next request through this agent…");
  const [reqUser, setReqUser] = useState<string | null>(null);
  // Anomaly callout is populated by the Phase 4 insight layer; null for now.
  const [anomaly] = useState<string | null>(null);
  const [quality, setQuality] = useState<
    Record<string, { avg: number | null; scored: number; failed: number }>
  >({});

  const graphRef = useRef<FlowGraphHandle>(null);
  const curTrace = useRef<string | null>(null);

  // Inject the scoped dark stylesheet once.
  useEffect(() => {
    const styleId = "flowtrace-styles";
    if (!document.getElementById(styleId)) {
      const el = document.createElement("style");
      el.id = styleId;
      el.textContent = FLOWTRACE_CSS;
      document.head.appendChild(el);
    }
  }, []);

  // Load agents (rail).
  useEffect(() => {
    (async () => {
      try {
        const res = await apiServices.get<any>("/ai-gateway/flowtrace/agents");
        const list: AgentRow[] = res?.data?.agents || [];
        setAgents(list);
        if (list.length && !selected) setSelected(list[0].key);
      } catch {
        /* degrade silently */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Response Analysis quality rollup for the selected agent (independent of the
  // graph load so a missing/empty scores table never breaks the topology view).
  useEffect(() => {
    if (!selected) {
      setQuality({});
      return;
    }
    (async () => {
      try {
        const q = await apiServices.get<any>(
          `/ai-gateway/flowtrace/agents/${encodeURIComponent(selected)}/quality?period=7`,
        );
        setQuality(q?.data?.metrics || {});
      } catch {
        setQuality({});
      }
    })();
  }, [selected]);

  // Load topology + recent traces for the selected agent.
  useEffect(() => {
    if (!selected) return;
    (async () => {
      try {
        const [g, r] = await Promise.all([
          apiServices.get<any>(`/ai-gateway/flowtrace/agents/${encodeURIComponent(selected)}/graph`),
          apiServices.get<any>(`/ai-gateway/flowtrace/traces?agent=${encodeURIComponent(selected)}&limit=20`),
        ]);
        setTopology(g?.data || null);
        const traces: TraceRow[] = r?.data?.traces || [];
        setRecent(traces);
        if (traces.length) {
          const latest = traces[0];
          setTraceId(latest.trace_id);
          setBadge(latest.status);
          setTotals(latest.totals);
          setReqUser(latest.requester || null);
          setInsight(localInsight(latest));
          // populate waterfall from the latest trace detail
          try {
            const d = await apiServices.get<any>(`/ai-gateway/flowtrace/traces/${latest.trace_id}`);
            const spans: Span[] = d?.data?.trace?.spans || [];
            const h: Record<string, number> = {};
            spans.forEach((s) => { h[s.type] = s.latency_ms || 0; });
            setHops(h);
          } catch { /* ignore */ }
        } else {
          setTraceId("trc_—");
          setBadge("idle");
          setTotals(null);
          setHops({});
          setInsight("No traces yet for this agent. Run a request through the gateway to see it light up here.");
        }
        graphRef.current?.reset();
      } catch {
        /* degrade silently */
      }
    })();
  }, [selected]);

  // Live stream.
  const onMessage = useCallback((m: TraceStreamMessage) => {
    if (m.event === "trace.completed") {
      const d = m.data || {};
      if (selected && d.agent_key && d.agent_key !== selected) return;
      if (curTrace.current && d.trace_id !== curTrace.current) return;
      setBadge(d.status || "ok");
      if (d.requester) setReqUser(d.requester);
      if (d.totals) setTotals(d.totals);
      setInsight(localInsight({ trace_id: d.trace_id, agent_key: d.agent_key, status: d.status, path: d.path || [], totals: d.totals || { latency_ms: 0, tokens: 0, cost_usd: 0 } }));
      // refresh recent list
      if (selected) {
        apiServices
          .get<any>(`/ai-gateway/flowtrace/traces?agent=${encodeURIComponent(selected)}&limit=20`)
          .then((r) => setRecent(r?.data?.traces || []))
          .catch(() => {});
      }
      return;
    }
    // span event
    const span: Span = m.data;
    if (!span || !span.type) return;
    if (selected && span.agent_key && span.agent_key !== selected) return;

    // New trace → reset the board.
    if (span.trace_id !== curTrace.current) {
      curTrace.current = span.trace_id;
      setTraceId(span.trace_id);
      setBadge("running");
      setHops({});
      graphRef.current?.reset();
    }
    if (span.type === "agent" && span.attrs?.requester) setReqUser(span.attrs.requester);
    graphRef.current?.applySpan(span);
    setHops((prev) => ({ ...prev, [span.type]: span.latency_ms || prev[span.type] || 0 }));
    const l = spanLog(span);
    setLog((prev) => [{ id: span.span_id, tag: l.tag, msg: l.msg, trace: span.trace_id }, ...prev].slice(0, 16));
  }, [selected]);

  const { connected } = useTraceStream(onMessage, { agent: selected, enabled: !!selected });

  // Header stats from recent traces.
  const stats = useMemo(() => {
    const lat = recent.map((t) => t.totals.latency_ms).filter((n) => n > 0).sort((a, b) => a - b);
    const p50 = lat.length ? lat[Math.floor(lat.length / 2)] : 0;
    const blocked = recent.filter((t) => t.status === "block").length;
    return { count: recent.length, p50, blocked };
  }, [recent]);

  const maxHop = Math.max(1, ...HOP_ORDER.filter((k) => hops[k]).map((k) => hops[k]));

  return (
    <Box>
      <PageHeaderExtended
        title="Agent Monitor"
        description="Live agent graph & request tracing — watch every request flow through the gateway in real time."
      />

      <div className="ft-root">
        <div className="ft-top">
          <div className="ft-brand">
            <div className="ft-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 12h6l2-4 2 8 2-4h4" /></svg>
            </div>
            <div>
              <h1>FlowTrace</h1>
              <span>AI Gateway · agent graph</span>
            </div>
          </div>
          <div className="ft-spacer" />
          <div className={`ft-live ${connected ? "" : "off"}`}>
            <span className="ping" />
            {connected ? "LIVE" : "OFFLINE"}
          </div>
        </div>

        <div className="ft-layout">
          {/* rail */}
          <aside className="ft-rail">
            <div className="ft-rail-head">
              <span className="eyebrow">Agents</span>
              <b>{agents.length}</b>
            </div>
            {agents.length === 0 ? (
              <div className="ft-empty">
                No agents seen yet. Send a request through the gateway (LLM or MCP tool) and the agent will appear here.
              </div>
            ) : (
              agents.map((a) => (
                <div
                  key={a.key}
                  className={`ft-agent ${a.key === selected ? "sel" : ""} ${anomaly && a.key === selected ? "warn" : ""}`}
                  onClick={() => { curTrace.current = null; setLog([]); setReqUser(null); setSelected(a.key); }}
                >
                  <div className="row1">
                    <span className="dot" />
                    <span className="name">{a.name}</span>
                  </div>
                  {a.model ? <div className="model">{a.model}</div> : null}
                  <div className="meta">
                    <span>traces <span className="v">{a.traces}</span></span>
                    <span>users <span className="v">{a.users}</span></span>
                  </div>
                </div>
              ))
            )}
          </aside>

          {/* center */}
          <main className="ft-center">
            <section className="ft-canvas">
              <div className="ft-chead">
                <div className="ft-chl">
                  <span className="eyebrow">Live trace · {selected || "—"}{reqUser ? ` · ${reqUser}` : ""}</span>
                  <div className="ft-traceline">
                    <span className="ft-tid">{traceId}</span>
                    <span className={`ft-badge ${badge}`}>{badge === "ok" ? "completed" : badge}</span>
                  </div>
                </div>
                <div className="ft-stats">
                  <div className="ft-stat"><span className="n">{stats.count}</span><span className="l">recent traces</span></div>
                  <div className="ft-stat"><span className="n">{stats.p50}<small style={{ fontSize: 10, color: "var(--faint)" }}>ms</small></span><span className="l">p50 latency</span></div>
                  <div className="ft-stat"><span className="n" style={{ color: "var(--block)" }}>{stats.blocked}</span><span className="l">blocked</span></div>
                </div>
              </div>

              {topology ? <FlowGraph ref={graphRef} topology={topology} /> : null}

              <div className="legend">
                <span><i style={{ background: "var(--agent)" }} />Agent</span>
                <span><i style={{ background: "var(--gateway)" }} />Gateway</span>
                <span className="ring-key"><i />Guardrail · ring = every hop inspected</span>
                <span><i style={{ background: "var(--llm)" }} />LLM</span>
                <span><i style={{ background: "var(--mcp)" }} />MCP server</span>
                <span><i style={{ background: "var(--tool)" }} />Tool</span>
              </div>
            </section>

            <section className="ft-stream">
              <div className="ft-stream-head"><span className="eyebrow">Live events</span></div>
              <div className="ft-log">
                {log.length === 0 ? (
                  <div className="log-row"><span className="t">--:--:--</span><span className="tag sys">SYS</span><span className="msg"><b>Waiting for live events…</b></span></div>
                ) : (
                  log.map((r) => (
                    <div className="log-row" key={r.id}>
                      <span className="t">{ts()}</span>
                      <span className={`tag ${r.tag}`}>{r.tag.toUpperCase()}</span>
                      <span className="msg" dangerouslySetInnerHTML={{ __html: `${r.msg} · <span style="color:var(--faint)">${r.trace}</span>` }} />
                    </div>
                  ))
                )}
              </div>
            </section>
          </main>

          {/* panel */}
          <aside className="ft-panel">
            <div className="insight">
              <div className="ih">
                <span className="ai"><Sparkles size={13} /></span>
                <b>AI insight</b>
                <span className="live-tag">AUTO</span>
              </div>
              <p>{insight}</p>
              {anomaly ? (
                <div className="anomaly">
                  <AlertTriangle size={14} />
                  <span>{anomaly}</span>
                </div>
              ) : null}
            </div>

            <div>
              <div className="section-l">Hop latency</div>
              <div className="waterfall">
                {HOP_ORDER.filter((k) => hops[k] != null).map((k) => (
                  <div className="wf" key={k}>
                    <span className="wl">{k}</span>
                    <span className="track">
                      <span className="fill" style={{ "--c": `var(${HOP_COLOR[k]})`, width: `${Math.max(6, (hops[k] / maxHop) * 100)}%` } as any} />
                    </span>
                    <span className="wv">{hops[k]}ms</span>
                  </div>
                ))}
                {Object.keys(hops).length === 0 ? <div className="ft-empty" style={{ padding: "6px 2px" }}>—</div> : null}
              </div>
            </div>

            <div>
              <div className="section-l" style={{ marginBottom: 9 }}>Totals</div>
              <div className="totals">
                <div className="tot"><div className="tn">{totals ? `${(totals.latency_ms / 1000).toFixed(2)}s` : "—"}</div><div className="tl">latency</div></div>
                <div className="tot"><div className="tn">{totals ? totals.tokens.toLocaleString() : "—"}</div><div className="tl">tokens</div></div>
                <div className="tot"><div className="tn">{totals ? `$${totals.cost_usd.toFixed(3)}` : "—"}</div><div className="tl">cost</div></div>
              </div>
            </div>

            <div>
              <div className="section-l" style={{ marginBottom: 9 }}>
                Agent quality <span className="qhint">7d avg</span>
              </div>
              <div className="quality">
                {[
                  { k: "accuracy", label: "accuracy", lowerBetter: false },
                  { k: "faithfulness", label: "faithful", lowerBetter: false },
                  { k: "hallucination", label: "hallucin.", lowerBetter: true },
                  { k: "bias", label: "bias", lowerBetter: true },
                ].map((m) => {
                  const q = quality[m.k];
                  const avg = q && q.avg != null ? q.avg : null;
                  const pct = avg != null ? Math.round(avg * 100) : null;
                  const good = avg == null ? null : m.lowerBetter ? avg <= 0.3 : avg >= 0.7;
                  return (
                    <div key={m.k} className={`qcard ${good == null ? "" : good ? "ok" : "bad"}`}>
                      <div className="qv">{pct != null ? `${pct}%` : "—"}</div>
                      <div className="ql">{m.label}</div>
                    </div>
                  );
                })}
              </div>
              {!Object.keys(quality).length && (
                <div className="qempty">No scored responses yet — enable Response Analysis to populate.</div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </Box>
  );
}
