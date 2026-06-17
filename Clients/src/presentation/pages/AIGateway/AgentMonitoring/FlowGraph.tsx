/**
 * FlowGraph — the live agent topology + animated request path.
 *
 * Faithful port of docs/design/flowtrace.html: hand-rolled SVG bezier edges,
 * a spinning guardrail ring around the gateway core, and packets animated with
 * <animateMotion> along each edge. Topology comes from the real backend; the
 * parent drives it imperatively as spans arrive over SSE.
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { Bot, Hexagon, Sparkles, Server, Wrench } from "lucide-react";

export interface GraphServer {
  id: number;
  name: string;
  tools: string[];
}
export interface GraphTopology {
  agent: { id: string; name: string; model: string | null };
  servers: GraphServer[];
}
export interface Span {
  trace_id: string;
  span_id: string;
  parent_span_id?: string | null;
  agent_key?: string | null;
  type: "agent" | "gateway" | "guardrail" | "llm" | "mcp" | "tool" | string;
  name: string;
  status: "ok" | "mask" | "block" | "error" | "running" | string;
  latency_ms?: number;
  attrs?: Record<string, any>;
}

export interface FlowGraphHandle {
  reset: () => void;
  applySpan: (span: Span) => void;
}

interface Node {
  id: string;
  type: "agent" | "core" | "node" | "server" | "tool";
  label: string;
  sub?: string;
  x: number;
  y: number;
  r: number;
  colorVar: string;
  icon: "agent" | "gateway" | "llm" | "server" | "tool";
}

const W = 1000;
const H = 560;
const NS = "http://www.w3.org/2000/svg";
const XL = "http://www.w3.org/1999/xlink";

const ICONS = {
  agent: <Bot strokeWidth={1.7} />,
  gateway: <Hexagon strokeWidth={1.6} />,
  llm: <Sparkles strokeWidth={1.7} />,
  server: <Server strokeWidth={1.7} />,
  tool: <Wrench strokeWidth={1.8} />,
};

function buildLayout(topo: GraphTopology): { nodes: Node[]; edges: [string, string][] } {
  const nodes: Node[] = [];
  const edges: [string, string][] = [];

  nodes.push({ id: "agent", type: "agent", label: topo.agent.name, sub: "agent", x: 96, y: 280, r: 46, colorVar: "--agent", icon: "agent" });
  nodes.push({ id: "gateway", type: "core", label: "Gateway", x: 300, y: 280, r: 44, colorVar: "--gateway", icon: "gateway" });
  nodes.push({ id: "llm", type: "node", label: "LLM", sub: topo.agent.model || "model", x: 300, y: 92, r: 44, colorVar: "--llm", icon: "llm" });
  edges.push(["agent", "gateway"]);
  edges.push(["gateway", "llm"]);

  const servers = topo.servers || [];
  // Flatten tools to spread them evenly down the right edge; each server sits
  // beside the mean y of its own tools.
  const flat: { sid: number; tool: string }[] = [];
  servers.forEach((s) => s.tools.forEach((t) => flat.push({ sid: s.id, tool: t })));
  const top = 56;
  const bottom = 524;
  const n = Math.max(flat.length, 1);
  const toolY = new Map<string, number>();
  flat.forEach((ft, i) => {
    const y = n === 1 ? (top + bottom) / 2 : top + ((bottom - top) * i) / (n - 1);
    const tid = `tl-${ft.sid}-${ft.tool}`;
    toolY.set(tid, y);
  });

  servers.forEach((s, si) => {
    const myTools = s.tools.map((t) => `tl-${s.id}-${t}`);
    const ys = myTools.map((tid) => toolY.get(tid)).filter((v): v is number => v != null);
    const sy = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : top + ((bottom - top) * si) / Math.max(servers.length - 1, 1);
    const sid = `srv-${s.id}`;
    nodes.push({ id: sid, type: "server", label: s.name, sub: `MCP · ${s.tools.length} tools`, x: 585, y: sy, r: 48, colorVar: "--mcp", icon: "server" });
    edges.push(["gateway", sid]);
    s.tools.forEach((t) => {
      const tid = `tl-${s.id}-${t}`;
      nodes.push({ id: tid, type: "tool", label: t, x: 842, y: toolY.get(tid) ?? sy, r: 50, colorVar: "--tool", icon: "tool" });
      edges.push([sid, tid]);
    });
  });

  return { nodes, edges };
}

function edgePath(a: Node, b: Node): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const ax = a.x + ux * a.r;
  const ay = a.y + uy * a.r;
  const bx = b.x - ux * b.r;
  const by = b.y - uy * b.r;
  if (Math.abs(bx - ax) >= Math.abs(by - ay)) {
    const c = (bx - ax) * 0.45;
    return `M ${ax} ${ay} C ${ax + c} ${ay}, ${bx - c} ${by}, ${bx} ${by}`;
  }
  const c = (by - ay) * 0.45;
  return `M ${ax} ${ay} C ${ax} ${ay + c}, ${bx} ${by - c}, ${bx} ${by}`;
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#fff";
}

const FlowGraph = forwardRef<FlowGraphHandle, { topology: GraphTopology }>(({ topology }, ref) => {
  const { nodes, edges } = useMemo(() => buildLayout(topology), [topology]);
  const nodeById = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const packetsRef = useRef<SVGGElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const pillTxtRef = useRef<HTMLSpanElement>(null);
  const nodeEls = useRef<Map<string, HTMLDivElement>>(new Map());
  const pathEls = useRef<Map<string, SVGPathElement>>(new Map());
  const pathIds = useRef<Map<string, string>>(new Map());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Responsive scale (the inner board is a fixed 1000×560 canvas).
  useEffect(() => {
    const scale = () => {
      const wrap = wrapRef.current;
      const inner = innerRef.current;
      if (!wrap || !inner) return;
      const s = Math.min(1, wrap.clientWidth / W);
      inner.style.transform = `scale(${s})`;
      wrap.style.height = `${H * s}px`;
    };
    scale();
    const ro = new ResizeObserver(scale);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [nodes]);

  const litEdge = useCallback((key: string, colorVar: string) => {
    const p = pathEls.current.get(key);
    if (!p) return;
    p.style.setProperty("--c", `var(${colorVar})`);
    p.style.stroke = `var(${colorVar})`;
    p.style.filter = `drop-shadow(0 0 5px var(${colorVar}))`;
    p.classList.add("lit");
    const t = setTimeout(() => {
      p.classList.remove("lit");
      p.style.stroke = "";
      p.style.filter = "";
    }, 780);
    timers.current.push(t);
  }, []);

  const packet = useCallback((from: string, to: string) => {
    const fk = `${from}__${to}`;
    const rk = `${to}__${from}`;
    let key = fk;
    let rev = false;
    if (pathIds.current.has(fk)) { key = fk; rev = false; }
    else if (pathIds.current.has(rk)) { key = rk; rev = true; }
    else return;
    const pid = pathIds.current.get(key)!;
    const toNode = nodeById[to];
    const col = toNode ? cssVar(toNode.colorVar) : "#fff";
    const g = packetsRef.current;
    if (!g) return;
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("r", "4.6");
    c.setAttribute("class", "pkt");
    c.setAttribute("fill", col);
    c.style.color = col;
    const m = document.createElementNS(NS, "animateMotion");
    m.setAttribute("dur", "0.6s");
    m.setAttribute("fill", "freeze");
    m.setAttribute("keyPoints", rev ? "1;0" : "0;1");
    m.setAttribute("keyTimes", "0;1");
    m.setAttribute("calcMode", "linear");
    const mp = document.createElementNS(NS, "mpath");
    mp.setAttributeNS(XL, "xlink:href", `#${pid}`);
    mp.setAttribute("href", `#${pid}`);
    m.appendChild(mp);
    c.appendChild(m);
    g.appendChild(c);
    const anyM = m as any;
    if (anyM.beginElement) { try { anyM.beginElement(); } catch { /* no-op */ } }
    litEdge(key, toNode ? toNode.colorVar : "--gateway");
    const t = setTimeout(() => c.remove(), 900);
    timers.current.push(t);
  }, [nodeById, litEdge]);

  const litNode = useCallback((id: string, met?: string) => {
    const el = nodeEls.current.get(id);
    if (!el) return;
    el.classList.add("lit");
    if (met != null) {
      const m = el.querySelector("[data-met]");
      if (m) m.textContent = met;
    }
  }, []);

  const setRing = useCallback((state: "pass" | "mask" | "block", txt?: string) => {
    const ring = ringRef.current;
    if (ring) ring.setAttribute("class", `gr-ring ${state} active`);
    const pill = pillRef.current;
    if (pill) pill.className = `gr-pill ${state}`;
    if (pillTxtRef.current && txt != null) pillTxtRef.current.textContent = txt;
  }, []);

  const reset = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    nodeEls.current.forEach((el) => {
      el.classList.remove("lit");
      const m = el.querySelector("[data-met]");
      if (m) m.textContent = "";
    });
    pathEls.current.forEach((p) => {
      p.classList.remove("lit");
      p.style.stroke = "";
      p.style.filter = "";
    });
    if (ringRef.current) ringRef.current.setAttribute("class", "gr-ring pass");
    if (pillRef.current) pillRef.current.className = "gr-pill pass";
    if (pillTxtRef.current) pillTxtRef.current.textContent = "idle";
    if (packetsRef.current) packetsRef.current.innerHTML = "";
  }, []);

  const applySpan = useCallback((span: Span) => {
    const a = span.attrs || {};
    switch (span.type) {
      case "agent":
        litNode("agent", "issued");
        break;
      case "gateway":
        packet("agent", "gateway");
        litNode("gateway", "routed");
        break;
      case "guardrail": {
        const st = span.status === "block" ? "block" : span.status === "mask" ? "mask" : "pass";
        const txt = st === "block" ? "BLOCKED" : st === "mask" ? "masked" : "clean";
        setRing(st, txt);
        break;
      }
      case "llm": {
        packet("gateway", "llm");
        const tok = a.tokens ? `${Number(a.tokens).toLocaleString()} tok` : "ok";
        litNode("llm", tok);
        const t = setTimeout(() => packet("llm", "gateway"), 620);
        timers.current.push(t);
        break;
      }
      case "mcp": {
        const sid = `srv-${a.server_id}`;
        packet("gateway", sid);
        litNode(sid, "authorized");
        break;
      }
      case "tool": {
        const sid = `srv-${a.server_id}`;
        const tid = `tl-${a.server_id}-${a.tool || span.name}`;
        packet(sid, tid);
        litNode(tid);
        break;
      }
      default:
        break;
    }
  }, [litNode, packet, setRing]);

  useImperativeHandle(ref, () => ({ reset, applySpan }), [reset, applySpan]);

  return (
    <div className="graph-wrap" ref={wrapRef}>
      <div className="graph-inner" ref={innerRef}>
        <svg id="ft-gsvg" viewBox={`0 0 ${W} ${H}`} xmlns={NS}>
          <g>
            {edges.map(([f, t], i) => {
              const key = `${f}__${t}`;
              const pid = `ftp_${i}`;
              pathIds.current.set(key, pid);
              const af = nodeById[f];
              const at = nodeById[t];
              if (!af || !at) return null;
              return (
                <path
                  key={key}
                  id={pid}
                  className="edge"
                  d={edgePath(af, at)}
                  ref={(el) => {
                    if (el) pathEls.current.set(key, el);
                  }}
                />
              );
            })}
          </g>
          <circle ref={ringRef} className="gr-ring pass" cx={300} cy={280} r={54} />
          <g ref={packetsRef} />
        </svg>

        {nodes.map((n) => {
          const cls = `gnode ${n.type === "core" ? "core" : n.type === "tool" ? "tool" : ""}`;
          return (
            <div
              key={n.id}
              className={cls}
              style={{ left: n.x, top: n.y, "--c": `var(${n.colorVar})` } as any}
              ref={(el) => {
                if (el) nodeEls.current.set(n.id, el);
              }}
            >
              {n.type === "core" ? (
                <>
                  <div className="chip"><div className="gi">{ICONS[n.icon]}</div></div>
                  <div className="cap">
                    <div className="glabel">{n.label}</div>
                    <div className="gmet" data-met />
                  </div>
                </>
              ) : n.type === "tool" ? (
                <div className="chip"><div className="gi">{ICONS[n.icon]}</div><div className="glabel">{n.label}</div></div>
              ) : (
                <div className="chip">
                  <div className="gi">{ICONS[n.icon]}</div>
                  <div className="glabel">{n.label}</div>
                  {n.sub ? <div className="gsub">{n.sub}</div> : null}
                  <div className="gmet" data-met />
                </div>
              )}
            </div>
          );
        })}

        <div className="gr-pill pass" ref={pillRef} style={{ left: 300, top: 198 }}>
          <span className="grdot" />
          <b>GUARDRAIL</b>
          <span className="grtxt" ref={pillTxtRef}>idle</span>
        </div>
      </div>
    </div>
  );
});

FlowGraph.displayName = "FlowGraph";
export default FlowGraph;
