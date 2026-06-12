/**
 * Parkar GovernAI — marketing landing page (v2: modern / AI-oriented pass).
 *
 * Same stack and section order as v1. What changed:
 *  - Hero: dot-grid + radial glow background, gradient headline accent,
 *    count-up metrics, soft glow behind the dashboard mock.
 *  - Signature element: LiveTrafficLog — a streaming log of governed requests
 *    (allowed / redacted / blocked / human review) in the dark band.
 *  - GatewayFlow: animated packet traveling the request lifecycle.
 *  - Integrations: seamless marquee strip.
 *  - Micro-interactions: card hover lift + accent border, nav blur.
 *  - All motion respects prefers-reduced-motion.
 */
import { useEffect, useRef, useState } from "react";
import { Box, Stack, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Router as RouterIcon,
  FlaskConical,
  ScrollText,
  Lock,
  ChevronDown,
  ArrowRight,
  CircleCheck,
  Layers,
  Eye,
  FileCheck2,
} from "lucide-react";

// ── Design tokens ───────────────────────────────────────────────────────────
const ink = "#0B1220";
const inkSoft = "#3B4454";
const surface = "#FFFFFF";
const surfaceAlt = "#F6F7F9";
const hairline = "#E3E6EA";
const accent = "#1B3A6B"; // Parkar navy
const accentHover = "#152E54";
const glow = "#5B8DEF"; // electric counterpart of the navy, used only on dark
const ok = "#16A34A";
const okDark = "#4ADE80";
const warn = "#D97706";
const warnDark = "#FBBF24";
const bad = "#DC2626";
const badDark = "#F87171";
const mono = '"JetBrains Mono", "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

const FRAMEWORKS = ["EU AI Act", "NIST AI RMF", "ISO 42001", "ISO 27001", "SOC 2", "GDPR"];
const DEMO_MAIL = "mailto:ap@parkar.digital?subject=Parkar%20GovernAI%20demo";

// ── Global keyframes (one injection, reduced-motion safe) ───────────────────
const Keyframes = () => (
  <style>{`
    @keyframes lpPacket { 0% { left: 0; opacity: 0; } 6% { opacity: 1; } 94% { opacity: 1; } 100% { left: calc(100% - 8px); opacity: 0; } }
    @keyframes lpRow { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
    @keyframes lpMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    @keyframes lpBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
    @media (prefers-reduced-motion: reduce) {
      .lp-anim, .lp-marquee { animation: none !important; }
    }
  `}</style>
);

// ── Tiny scroll-reveal (respects prefers-reduced-motion) ────────────────────
const Reveal = ({
  children,
  delay = 0,
  grow = false,
}: {
  children: React.ReactNode;
  delay?: number;
  grow?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(12px)",
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
        ...(grow ? { flex: "1 1 0%", minWidth: 0 } : {}),
      }}
    >
      {children}
    </div>
  );
};

// ── Count-up number (settles to final value, reduced-motion = instant) ──────
const CountUp = ({
  end,
  decimals = 0,
  suffix = "",
  duration = 1400,
}: {
  end: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
}) => {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setVal(end);
      return;
    }
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min((t - t0) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(end * eased);
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [end, duration]);
  return (
    <span ref={ref}>
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
};

// ── Shared bits ─────────────────────────────────────────────────────────────
const Eyebrow = ({ children, light = false }: { children: React.ReactNode; light?: boolean }) => (
  <Typography
    component="div"
    sx={{
      fontFamily: mono,
      fontSize: 11,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: light ? "rgba(255,255,255,0.55)" : accent,
      mb: 2,
    }}
  >
    {children}
  </Typography>
);

const Section = ({
  children,
  band = "white",
  id,
}: {
  children: React.ReactNode;
  band?: "white" | "alt" | "dark";
  id?: string;
}) => (
  <Box
    id={id}
    component="section"
    sx={{
      backgroundColor: band === "dark" ? ink : band === "alt" ? surfaceAlt : surface,
      py: { xs: "64px", md: "112px" },
      px: 3,
    }}
  >
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>{children}</Box>
  </Box>
);

const solidBtn = {
  backgroundColor: accent,
  color: "#fff",
  textTransform: "none",
  fontSize: 15,
  fontWeight: 600,
  px: 3.5,
  py: 1.25,
  borderRadius: "9px",
  boxShadow: "none",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: accentHover,
    boxShadow: `0 8px 24px -8px ${glow}66`,
    transform: "translateY(-1px)",
  },
  "&:focus-visible": { outline: `2px solid ${glow}`, outlineOffset: 2 },
} as const;

const ghostBtn = (light = false) =>
  ({
    color: light ? "#fff" : ink,
    border: `1px solid ${light ? "rgba(255,255,255,0.3)" : hairline}`,
    textTransform: "none",
    fontSize: 15,
    fontWeight: 600,
    px: 3.5,
    py: 1.25,
    borderRadius: "9px",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: light ? "rgba(255,255,255,0.08)" : surfaceAlt,
      border: `1px solid ${light ? "rgba(255,255,255,0.5)" : "#cfd4da"}`,
    },
    "&:focus-visible": { outline: `2px solid ${light ? glow : accent}`, outlineOffset: 2 },
  }) as const;

const hoverCard = {
  backgroundColor: surface,
  border: `1px solid ${hairline}`,
  borderRadius: "12px",
  transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
  "&:hover": {
    transform: "translateY(-3px)",
    borderColor: `${accent}55`,
    boxShadow: "0 12px 32px -16px rgba(11,18,32,0.25)",
  },
} as const;

// ── Product mocks (CSS-built — real product surfaces, no stock art) ─────────
const StatusRow = ({
  label,
  count,
  color,
  pct,
}: {
  label: string;
  count: number;
  color: string;
  pct: number;
}) => (
  <Box sx={{ mb: 1.5 }}>
    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
      <Typography sx={{ fontSize: 12, color: inkSoft }}>{label}</Typography>
      <Typography sx={{ fontFamily: mono, fontSize: 12, color: ink }}>{count}</Typography>
    </Stack>
    <Box sx={{ height: 6, borderRadius: 3, backgroundColor: "#EEF0F3", overflow: "hidden" }}>
      <Box
        sx={{
          height: 6,
          width: `${pct}%`,
          borderRadius: 3,
          backgroundColor: color,
          transition: "width 1s ease",
        }}
      />
    </Box>
  </Box>
);

const DashboardMock = () => (
  <Box sx={{ position: "relative" }}>
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: -48,
        background: `radial-gradient(closest-side, ${glow}33, transparent 70%)`,
        pointerEvents: "none",
      }}
    />
    <Box
      role="img"
      aria-label="Parkar GovernAI governance dashboard showing control status across frameworks"
      sx={{
        position: "relative",
        backgroundColor: surface,
        border: `1px solid ${hairline}`,
        borderRadius: "12px",
        p: 3,
        boxShadow: "0 24px 60px -24px rgba(11,18,32,0.55)",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: ink }}>
          Compliance posture — EU AI Act
        </Typography>
        <Stack direction="row" alignItems="center" gap={0.75}>
          <Box
            className="lp-anim"
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: ok,
              animation: "lpBlink 1.6s ease-in-out infinite",
            }}
          />
          <Typography sx={{ fontFamily: mono, fontSize: 11, color: ok }}>live</Typography>
        </Stack>
      </Stack>
      <Stack direction="row" gap={2.5} sx={{ mb: 3 }}>
        {[
          { node: <CountUp end={82} suffix="%" />, l: "controls covered" },
          { node: <CountUp end={1.2} decimals={1} suffix="M" />, l: "calls governed / mo" },
          { node: <CountUp end={0} />, l: "unlogged requests" },
        ].map((s) => (
          <Box key={s.l} sx={{ flex: 1, border: `1px solid ${hairline}`, borderRadius: "9px", p: 1.5 }}>
            <Typography sx={{ fontSize: 22, fontWeight: 600, color: ink, fontVariantNumeric: "tabular-nums" }}>
              {s.node}
            </Typography>
            <Typography sx={{ fontSize: 11, color: inkSoft }}>{s.l}</Typography>
          </Box>
        ))}
      </Stack>
      <StatusRow label="Implemented" count={64} color={ok} pct={64} />
      <StatusRow label="In progress" count={21} color={warn} pct={21} />
      <StatusRow label="Gap" count={9} color={bad} pct={9} />
    </Box>
  </Box>
);

const GATES = ["Agent", "Identity & policy", "Input guardrails", "Model", "Output guardrails", "Response"];

const GatewayFlow = ({ light = false }: { light?: boolean }) => (
  <Box>
    <Stack
      direction="row"
      alignItems="center"
      flexWrap="wrap"
      gap={1}
      role="img"
      aria-label="A request passing through the gateway: agent, identity and policy check, input guardrails, model, output guardrails, response"
    >
      {GATES.map((g, i) => (
        <Stack key={g} direction="row" alignItems="center" gap={1}>
          <Box
            sx={{
              fontFamily: mono,
              fontSize: 11,
              px: 1.5,
              py: 0.75,
              borderRadius: "999px",
              border: `1px solid ${light ? "rgba(255,255,255,0.25)" : hairline}`,
              color: light ? "rgba(255,255,255,0.85)" : ink,
              backgroundColor:
                i === 1 || i === 2 || i === 4
                  ? light
                    ? "rgba(91,141,239,0.28)"
                    : "#E7ECF5"
                  : "transparent",
              whiteSpace: "nowrap",
            }}
          >
            {g}
          </Box>
          {i < GATES.length - 1 && (
            <ArrowRight size={13} color={light ? "rgba(255,255,255,0.4)" : "#9AA1AB"} />
          )}
        </Stack>
      ))}
    </Stack>
    <Box
      aria-hidden
      sx={{
        position: "relative",
        mt: 2.5,
        height: "2px",
        borderRadius: 1,
        backgroundColor: light ? "rgba(255,255,255,0.12)" : "#EEF0F3",
      }}
    >
      <Box
        className="lp-anim"
        sx={{
          position: "absolute",
          top: -3,
          left: 0,
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: light ? glow : accent,
          boxShadow: light ? `0 0 12px ${glow}` : "none",
          animation: "lpPacket 3.4s linear infinite",
        }}
      />
    </Box>
  </Box>
);

// ── Signature: live governed-traffic log ────────────────────────────────────
type LogRow = { agent: string; model: string; verdict: "allowed" | "pii redacted" | "blocked" | "human review" };

const TRAFFIC: LogRow[] = [
  { agent: "support-agent", model: "claude-sonnet-4-6", verdict: "allowed" },
  { agent: "sales-copilot", model: "gpt-4o", verdict: "pii redacted" },
  { agent: "unknown-script", model: "mistral-large", verdict: "blocked" },
  { agent: "rag-pipeline", model: "claude-haiku-4-5", verdict: "allowed" },
  { agent: "finance-agent", model: "bedrock-titan", verdict: "human review" },
  { agent: "qa-evaluator", model: "claude-sonnet-4-6", verdict: "allowed" },
  { agent: "intern-notebook", model: "gpt-4o-mini", verdict: "blocked" },
  { agent: "kb-summarizer", model: "gemini-2.5-pro", verdict: "allowed" },
];

const verdictColor = (v: LogRow["verdict"]) =>
  v === "allowed" ? okDark : v === "pii redacted" ? warnDark : v === "blocked" ? badDark : glow;

const LiveTrafficLog = () => {
  const [rows, setRows] = useState<Array<LogRow & { ts: string; id: number }>>([]);
  const idx = useRef(0);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stamp = () => new Date().toLocaleTimeString("en-GB", { hour12: false });
    const push = () => {
      const r = TRAFFIC[idx.current % TRAFFIC.length];
      idx.current += 1;
      setRows((prev) => [...prev.slice(-5), { ...r, ts: stamp(), id: idx.current }]);
    };
    if (reduced) {
      setRows(TRAFFIC.slice(0, 6).map((r, i) => ({ ...r, ts: stamp(), id: i })));
      return;
    }
    push();
    const t = setInterval(push, 1700);
    return () => clearInterval(t);
  }, []);
  return (
    <Box
      role="log"
      aria-label="Live stream of governed AI requests and their gateway verdicts"
      aria-live="off"
      sx={{
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: "12px",
        backgroundColor: "rgba(255,255,255,0.03)",
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.1)" }}
      >
        <Typography sx={{ fontFamily: mono, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
          governed traffic — live
        </Typography>
        <Box
          className="lp-anim"
          sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            backgroundColor: okDark,
            animation: "lpBlink 1.6s ease-in-out infinite",
          }}
        />
      </Stack>
      <Box sx={{ p: 2.5, minHeight: 196 }}>
        {rows.map((r) => (
          <Stack
            key={r.id}
            className="lp-anim"
            direction="row"
            alignItems="center"
            gap={2}
            sx={{ py: 0.75, animation: "lpRow 0.35s ease both" }}
          >
            <Typography sx={{ fontFamily: mono, fontSize: 12, color: "rgba(255,255,255,0.35)", width: 64, flexShrink: 0 }}>
              {r.ts}
            </Typography>
            <Typography sx={{ fontFamily: mono, fontSize: 12, color: "rgba(255,255,255,0.85)", width: 140, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {r.agent}
            </Typography>
            <Typography sx={{ fontFamily: mono, fontSize: 12, color: "rgba(255,255,255,0.45)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {r.model}
            </Typography>
            <Typography
              sx={{
                fontFamily: mono,
                fontSize: 11,
                color: verdictColor(r.verdict),
                border: `1px solid ${verdictColor(r.verdict)}44`,
                borderRadius: "999px",
                px: 1.25,
                py: 0.25,
                whiteSpace: "nowrap",
              }}
            >
              {r.verdict}
            </Typography>
          </Stack>
        ))}
      </Box>
    </Box>
  );
};

// ── FAQ ─────────────────────────────────────────────────────────────────────
const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "How is this different from an observability tool?",
    a: "Observability tools show you what happened. Parkar GovernAI also controls it — policy is enforced on every call before the model is reached — and proves it, mapping every event to compliance controls and exportable audit evidence.",
  },
  {
    q: "Where does my data go?",
    a: "Parkar GovernAI deploys self-hosted in your VPC or cloud account. Prompts, responses, and logs stay inside your environment; nothing is required to leave your perimeter.",
  },
  {
    q: "Which frameworks are supported?",
    a: "Control mapping ships for EU AI Act, NIST AI RMF, ISO 42001, ISO 27001, SOC 2, and GDPR, with cross-framework synergies so one implemented control satisfies every framework that references it.",
  },
  {
    q: "Can I self-host?",
    a: "Yes — the platform runs as containers (Docker Compose or Kubernetes) in your own infrastructure, with SSO, RBAC, and encrypted secrets at rest.",
  },
  {
    q: "Does the gateway add latency to model calls?",
    a: "Policy checks and guardrails run in-line in milliseconds, and response caching can make repeated calls faster than going direct. Heavy analysis runs out of band.",
  },
  {
    q: "How do evals gate releases?",
    a: "Evaluation runs score correctness, faithfulness, hallucination, and bias against thresholds you set. Run them in CI; a failing score blocks the release and the result is filed as compliance evidence either way.",
  },
];

const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <Box sx={{ borderBottom: `1px solid ${hairline}` }}>
      <Box
        component="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        sx={{
          all: "unset",
          boxSizing: "border-box",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          py: 2.5,
          "&:focus-visible": { outline: `2px solid ${accent}`, outlineOffset: 2 },
        }}
      >
        <Typography sx={{ fontSize: 16, fontWeight: 600, color: ink }}>{q}</Typography>
        <ChevronDown
          size={18}
          color={inkSoft}
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        />
      </Box>
      {open && <Typography sx={{ fontSize: 15, color: inkSoft, lineHeight: 1.6, pb: 2.5 }}>{a}</Typography>}
    </Box>
  );
};

// ── Page ────────────────────────────────────────────────────────────────────
const Landing = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const pillars = [
    {
      icon: <RouterIcon size={20} color={accent} />,
      title: "AI Gateway",
      desc: "A single governed endpoint that all LLM and agent traffic routes through.",
      bullets: [
        "Policy enforcement on every request",
        "Inline guardrails: PII, injection, output validation",
        "Model allow-listing, budgets, and rate limits",
      ],
    },
    {
      icon: <ShieldCheck size={20} color={accent} />,
      title: "Governance",
      desc: "The system of record for every AI system, risk, and control in your company.",
      bullets: [
        "Model inventory and agent registry",
        "Compliance mapping across 6+ frameworks",
        "Risk register, incidents, immutable audit trail",
      ],
    },
    {
      icon: <FlaskConical size={20} color={accent} />,
      title: "LLM Evals",
      desc: "Automated quality and safety evaluation, wired into your release process.",
      bullets: [
        "Correctness, faithfulness, hallucination scoring",
        "Bias and fairness scans",
        "Release gating with results filed as evidence",
      ],
    },
  ];

  const deepDives = [
    {
      eyebrow: "ai gateway",
      title: "One governed endpoint for every model call",
      body: "Point your agents and apps at the gateway instead of the provider. Every request passes identity and policy checks, inline guardrails, and budget enforcement before a model is reached — and every prompt and response is logged.",
      bullets: [
        "Policy enforcement on every request",
        "PII masking, prompt-injection and jailbreak detection",
        "Per-team budgets, rate limits, model allow-lists",
        "Full prompt/response logging with cost attribution",
      ],
      visual: (
        <Box sx={{ border: `1px solid ${hairline}`, borderRadius: "12px", p: 3, backgroundColor: surface }}>
          <Typography sx={{ fontFamily: mono, fontSize: 11, color: inkSoft, mb: 2 }}>
            request lifecycle
          </Typography>
          <GatewayFlow />
        </Box>
      ),
    },
    {
      eyebrow: "governance",
      title: "The system of record for all your AI",
      body: "Inventory every model and agent, map controls to the frameworks your auditors care about, and keep risk, incidents, and evidence in one place — with an audit trail that writes itself from live traffic.",
      bullets: [
        "Model inventory and agent registry",
        "Compliance mapping: EU AI Act, NIST AI RMF, ISO 42001, SOC 2",
        "Risk register and incident management",
        "Immutable audit trail and evidence export",
      ],
      visual: <DashboardMock />,
    },
    {
      eyebrow: "llm evals",
      title: "Prove quality before you ship, and on every release",
      body: "Run correctness, faithfulness, hallucination, and bias evaluations against your own datasets. Gate releases on the results, and file every run as compliance evidence automatically.",
      bullets: [
        "Correctness, faithfulness and hallucination scoring",
        "Bias and fairness scans on real CSV data",
        "CI/CD release gating via SDK",
        "Results stored as audit evidence",
      ],
      visual: (
        <Box sx={{ border: `1px solid ${hairline}`, borderRadius: "12px", p: 3, backgroundColor: surface }}>
          <Typography sx={{ fontFamily: mono, fontSize: 11, color: inkSoft, mb: 2 }}>
            eval run — release 1.8.0
          </Typography>
          {[
            { m: "Correctness", v: "0.91", c: ok },
            { m: "Faithfulness", v: "0.88", c: ok },
            { m: "Hallucination", v: "0.04", c: ok },
            { m: "Bias (demographic parity)", v: "0.07", c: warn },
          ].map((r) => (
            <Stack key={r.m} direction="row" justifyContent="space-between" sx={{ py: 1, borderBottom: `1px solid ${hairline}` }}>
              <Typography sx={{ fontSize: 13, color: inkSoft }}>{r.m}</Typography>
              <Typography sx={{ fontFamily: mono, fontSize: 13, color: r.c }}>{r.v}</Typography>
            </Stack>
          ))}
          <Stack direction="row" gap={1} alignItems="center" sx={{ mt: 2 }}>
            <CircleCheck size={15} color={ok} />
            <Typography sx={{ fontSize: 12, color: inkSoft }}>
              Thresholds met — release unblocked, evidence filed
            </Typography>
          </Stack>
        </Box>
      ),
    },
  ];

  const integrations = [
    "Anthropic",
    "OpenAI",
    "Google Gemini",
    "Azure OpenAI",
    "AWS Bedrock",
    "Mistral",
    "OpenRouter",
    "MCP tools",
    "LangChain / LangGraph",
    "Google ADK",
    "SIEM export",
    "MLflow",
  ];

  return (
    <Box sx={{ backgroundColor: surface, color: ink, fontFamily: "Inter, sans-serif" }}>
      <Keyframes />

      {/* 1 — Sticky nav */}
      <Box
        component="nav"
        aria-label="Main"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(8px)" : "none",
          borderBottom: scrolled ? `1px solid ${hairline}` : "1px solid transparent",
          transition: "all 0.25s ease",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ maxWidth: 1200, mx: "auto", px: 3, py: scrolled ? 1.25 : 2 }}
        >
          <Stack direction="row" alignItems="center" gap={1.25}>
            <img src="/parkar-logo.png" alt="Parkar GovernAI" height={22} />
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: scrolled ? ink : "#fff", transition: "color 0.25s" }}>
              GovernAI
            </Typography>
          </Stack>
          <Stack direction="row" gap={3.5} sx={{ display: { xs: "none", md: "flex" } }}>
            {["Platform", "Compliance", "Security", "FAQ"].map((l) => (
              <Typography
                key={l}
                component="a"
                href={`#${l.toLowerCase()}`}
                sx={{
                  fontSize: 14,
                  color: scrolled ? inkSoft : "rgba(255,255,255,0.75)",
                  textDecoration: "none",
                  transition: "color 0.25s",
                  "&:hover": { color: scrolled ? ink : "#fff" },
                }}
              >
                {l}
              </Typography>
            ))}
          </Stack>
          <Stack direction="row" gap={1.5}>
            <Button sx={{ ...ghostBtn(!scrolled), px: 2.5, py: 0.75, fontSize: 14 }} onClick={() => navigate("/login")}>
              Sign in
            </Button>
            <Button sx={{ ...solidBtn, px: 2.5, py: 0.75, fontSize: 14 }} href={DEMO_MAIL}>
              Book a demo
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* 2 — Hero (dark, dot grid + radial glow) */}
      <Box
        component="header"
        sx={{
          backgroundColor: ink,
          backgroundImage: `radial-gradient(80% 70% at 75% 10%, ${glow}2E, transparent 60%), radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: "auto, 26px 26px",
          mt: { xs: "-56px", md: "-64px" },
          pt: { xs: "120px", md: "160px" },
          pb: { xs: "64px", md: "96px" },
          px: 3,
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: "auto" }}>
          <Stack direction={{ xs: "column", lg: "row" }} gap={8} alignItems="center">
            <Box sx={{ flex: 1 }}>
              <Eyebrow light>ai governance platform</Eyebrow>
              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: 38, md: 60 },
                  fontWeight: 600,
                  lineHeight: 1.08,
                  letterSpacing: "-0.02em",
                  color: "#fff",
                  mb: 3,
                }}
              >
                Govern every AI call.{" "}
                <Box
                  component="span"
                  sx={{
                    background: `linear-gradient(92deg, ${glow}, #8FD0FF 60%, #B7E3FF)`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  Prove every decision.
                </Box>
              </Typography>
              <Typography sx={{ fontSize: 18, lineHeight: 1.6, color: "rgba(255,255,255,0.7)", mb: 4, maxWidth: 560 }}>
                Route all LLM and agent traffic through one governed gateway. Enforce policy on
                every call, map controls to EU AI Act, NIST AI RMF, ISO 42001 and SOC 2, and
                generate audit evidence automatically.
              </Typography>
              <Stack direction="row" gap={2} sx={{ mb: 5 }}>
                <Button sx={solidBtn} href={DEMO_MAIL}>
                  Book a demo
                </Button>
                <Button sx={ghostBtn(true)} onClick={() => navigate("/login")}>
                  See the platform
                </Button>
              </Stack>
              <Stack direction="row" flexWrap="wrap" gap={2}>
                {FRAMEWORKS.map((f) => (
                  <Typography key={f} sx={{ fontFamily: mono, fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                    {f}
                  </Typography>
                ))}
              </Stack>
            </Box>
            <Box sx={{ flex: 1, width: "100%", maxWidth: 540 }}>
              <DashboardMock />
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* 3 — Trust bar */}
      <Box sx={{ backgroundColor: surfaceAlt, borderBottom: `1px solid ${hairline}`, py: 3, px: 3 }}>
        <Typography sx={{ textAlign: "center", fontSize: 13, color: inkSoft }}>
          Built for teams shipping AI in regulated environments
        </Typography>
      </Box>

      {/* 4 — Problem framing */}
      <Section>
        <Reveal>
          <Eyebrow>the problem</Eyebrow>
          <Typography component="h2" sx={{ fontSize: { xs: 28, md: 40 }, fontWeight: 600, letterSpacing: "-0.01em", mb: 2 }}>
            AI is already in production. The controls aren't.
          </Typography>
          <Typography sx={{ fontSize: 17, color: inkSoft, lineHeight: 1.6, maxWidth: 720, mb: 6 }}>
            Teams are calling models and shipping agents faster than security, legal, and finance
            can keep up: ungoverned traffic, no policy enforcement, shadow AI nobody catalogued,
            and no evidence when an auditor asks.
          </Typography>
        </Reveal>
        <Stack direction={{ xs: "column", md: "row" }} gap={3}>
          {[
            { icon: <Eye size={18} color={bad} />, t: "Shadow AI", d: "Unsanctioned tools and untracked model usage across the organization, invisible to security." },
            { icon: <ScrollText size={18} color={warn} />, t: "No audit trail", d: "When the auditor asks who called what model with whose data, there is no answer." },
            { icon: <Layers size={18} color={accent} />, t: "Runaway cost", d: "No per-team budgets, no rate limits, and no attribution of spend to products or clients." },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 80} grow>
              <Box sx={{ ...hoverCard, p: 3, height: "100%" }}>
                <Stack direction="row" gap={1.25} alignItems="center" sx={{ mb: 1.5 }}>
                  {c.icon}
                  <Typography sx={{ fontSize: 16, fontWeight: 600 }}>{c.t}</Typography>
                </Stack>
                <Typography sx={{ fontSize: 14, color: inkSoft, lineHeight: 1.6 }}>{c.d}</Typography>
              </Box>
            </Reveal>
          ))}
        </Stack>
      </Section>

      {/* 5 — Three pillars */}
      <Section band="alt" id="platform">
        <Reveal>
          <Eyebrow>platform</Eyebrow>
          <Typography component="h2" sx={{ fontSize: { xs: 28, md: 40 }, fontWeight: 600, mb: 6 }}>
            One control plane, three pillars
          </Typography>
        </Reveal>
        <Stack direction={{ xs: "column", md: "row" }} gap={3}>
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 80} grow>
              <Box sx={{ ...hoverCard, p: 3.5, height: "100%" }}>
                <Box sx={{ width: 40, height: 40, borderRadius: "9px", backgroundColor: "#E7ECF5", display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
                  {p.icon}
                </Box>
                <Typography sx={{ fontSize: 18, fontWeight: 600, mb: 1 }}>{p.title}</Typography>
                <Typography sx={{ fontSize: 14, color: inkSoft, lineHeight: 1.6, mb: 2 }}>{p.desc}</Typography>
                <Stack gap={1}>
                  {p.bullets.map((b) => (
                    <Stack key={b} direction="row" gap={1} alignItems="flex-start">
                      <CircleCheck size={14} color={ok} style={{ marginTop: 3, flexShrink: 0 }} />
                      <Typography sx={{ fontSize: 13.5, color: inkSoft }}>{b}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Reveal>
          ))}
        </Stack>
      </Section>

      {/* 6 — Deep dives */}
      {deepDives.map((d, i) => (
        <Section key={d.eyebrow} band={i % 2 ? "alt" : "white"}>
          <Stack direction={{ xs: "column", lg: i % 2 ? "row-reverse" : "row" }} gap={8} alignItems="center">
            <Box sx={{ flex: 1 }}>
              <Reveal>
                <Eyebrow>{d.eyebrow}</Eyebrow>
                <Typography component="h3" sx={{ fontSize: { xs: 24, md: 32 }, fontWeight: 600, mb: 2 }}>
                  {d.title}
                </Typography>
                <Typography sx={{ fontSize: 16, color: inkSoft, lineHeight: 1.65, mb: 3 }}>{d.body}</Typography>
                <Stack gap={1.25}>
                  {d.bullets.map((b) => (
                    <Stack key={b} direction="row" gap={1.25} alignItems="flex-start">
                      <CircleCheck size={15} color={ok} style={{ marginTop: 3, flexShrink: 0 }} />
                      <Typography sx={{ fontSize: 14.5, color: ink }}>{b}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Reveal>
            </Box>
            <Box sx={{ flex: 1, width: "100%" }}>
              <Reveal delay={120}>{d.visual}</Reveal>
            </Box>
          </Stack>
        </Section>
      ))}

      {/* 7 — How it works (dark band, flow + live traffic log) */}
      <Section band="dark">
        <Reveal>
          <Eyebrow light>how it works</Eyebrow>
          <Typography component="h2" sx={{ fontSize: { xs: 26, md: 36 }, fontWeight: 600, color: "#fff", mb: 2 }}>
            Governance is enforced around the model, not by it
          </Typography>
          <Typography sx={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, maxWidth: 680, mb: 5 }}>
            Every request — from any agent, SDK, or platform — passes through the same gates.
            Policy and guardrails run before and after the model call, and consequential tool
            actions can require human approval.
          </Typography>
          <Box sx={{ border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px", p: 3, mb: 3 }}>
            <GatewayFlow light />
          </Box>
          <LiveTrafficLog />
        </Reveal>
      </Section>

      {/* 8 — Compliance */}
      <Section id="compliance">
        <Reveal>
          <Eyebrow>compliance</Eyebrow>
          <Typography component="h2" sx={{ fontSize: { xs: 28, md: 40 }, fontWeight: 600, mb: 2 }}>
            Map once, comply across frameworks
          </Typography>
          <Typography sx={{ fontSize: 16, color: inkSoft, lineHeight: 1.6, maxWidth: 700, mb: 6 }}>
            Controls are mapped across frameworks with cross-framework synergies — one implemented
            control satisfies every framework that references it. Publish your posture to customers
            through a public Trust Center.
          </Typography>
        </Reveal>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2.5 }}>
          {[
            { f: "EU AI Act", d: "Risk classification, FRIA, post-market monitoring" },
            { f: "NIST AI RMF", d: "Govern, map, measure, manage functions" },
            { f: "ISO 42001", d: "AI management system clauses and annexes" },
            { f: "ISO 27001", d: "Information security controls" },
            { f: "SOC 2", d: "Trust service criteria evidence" },
            { f: "GDPR", d: "Data protection and PII safeguards" },
          ].map((t, i) => (
            <Reveal key={t.f} delay={i * 60}>
              <Box sx={{ ...hoverCard, p: 2.5, height: "100%" }}>
                <Typography sx={{ fontFamily: mono, fontSize: 12, color: accent, mb: 1 }}>{t.f}</Typography>
                <Typography sx={{ fontSize: 13.5, color: inkSoft, lineHeight: 1.55 }}>{t.d}</Typography>
              </Box>
            </Reveal>
          ))}
        </Box>
      </Section>

      {/* 9 — Security & deployment */}
      <Section band="alt" id="security">
        <Stack direction={{ xs: "column", lg: "row" }} gap={8}>
          <Box sx={{ flex: 1 }}>
            <Reveal>
              <Eyebrow>security &amp; deployment</Eyebrow>
              <Typography component="h2" sx={{ fontSize: { xs: 26, md: 36 }, fontWeight: 600, mb: 2 }}>
                Built to pass your security review
              </Typography>
              <Typography sx={{ fontSize: 16, color: inkSoft, lineHeight: 1.65 }}>
                Parkar GovernAI deploys in your own environment. Prompts, responses, keys, and audit
                logs never leave your perimeter.
              </Typography>
            </Reveal>
          </Box>
          <Box sx={{ flex: 1.2 }}>
            <Stack gap={2}>
              {[
                { icon: <Lock size={16} color={accent} />, t: "Self-hosted / VPC / your cloud", d: "Containers in your infrastructure — Docker Compose or Kubernetes. Data residency by construction." },
                { icon: <ShieldCheck size={16} color={accent} />, t: "SSO, RBAC, encrypted secrets", d: "Microsoft Entra ID single sign-on, role-based access (Admin / Reviewer / Editor / Auditor), AES-256 encryption for provider keys at rest." },
                { icon: <FileCheck2 size={16} color={accent} />, t: "Complete audit logging", d: "Every model call, tool call, guardrail event, and configuration change is logged and exportable to your SIEM." },
              ].map((r, i) => (
                <Reveal key={r.t} delay={i * 80}>
                  <Stack direction="row" gap={2} sx={{ ...hoverCard, p: 2.5 }}>
                    <Box sx={{ mt: 0.25 }}>{r.icon}</Box>
                    <Box>
                      <Typography sx={{ fontSize: 15, fontWeight: 600, mb: 0.5 }}>{r.t}</Typography>
                      <Typography sx={{ fontSize: 14, color: inkSoft, lineHeight: 1.55 }}>{r.d}</Typography>
                    </Box>
                  </Stack>
                </Reveal>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Section>

      {/* 10 — Integrations (marquee) */}
      <Section>
        <Reveal>
          <Eyebrow>integrations</Eyebrow>
          <Typography component="h2" sx={{ fontSize: { xs: 26, md: 36 }, fontWeight: 600, mb: 5 }}>
            Works with the models and tools you already run
          </Typography>
        </Reveal>
        <Box
          sx={{
            overflow: "hidden",
            position: "relative",
            "&::before, &::after": {
              content: '""',
              position: "absolute",
              top: 0,
              bottom: 0,
              width: 80,
              zIndex: 1,
              pointerEvents: "none",
            },
            "&::before": { left: 0, background: `linear-gradient(90deg, ${surface}, transparent)` },
            "&::after": { right: 0, background: `linear-gradient(270deg, ${surface}, transparent)` },
          }}
        >
          <Stack
            direction="row"
            gap={1.5}
            className="lp-marquee"
            sx={{ width: "max-content", animation: "lpMarquee 28s linear infinite", "&:hover": { animationPlayState: "paused" } }}
          >
            {[...integrations, ...integrations].map((l, i) => (
              <Box
                key={`${l}-${i}`}
                aria-hidden={i >= integrations.length}
                sx={{ fontFamily: mono, fontSize: 12, px: 2, py: 1, borderRadius: "999px", border: `1px solid ${hairline}`, color: inkSoft, whiteSpace: "nowrap" }}
              >
                {l}
              </Box>
            ))}
          </Stack>
        </Box>
      </Section>

      {/* 12 — Quote */}
      <Section band="alt">
        <Reveal>
          <Box sx={{ maxWidth: 760, mx: "auto", textAlign: "center" }}>
            <Typography sx={{ fontSize: { xs: 20, md: 24 }, fontWeight: 500, lineHeight: 1.5, color: ink, mb: 3 }}>
              "Observability tools showed us what our agents did. Parkar GovernAI is the first
              platform that also controls what they're allowed to do — and gives us the evidence
              trail our auditors actually asked for."
            </Typography>
            <Typography sx={{ fontFamily: mono, fontSize: 12, color: inkSoft }}>
              platform engineering lead · enterprise design partner
            </Typography>
          </Box>
        </Reveal>
      </Section>

      {/* 13 — Final CTA (dark, glow) */}
      <Box
        sx={{
          backgroundColor: ink,
          backgroundImage: `radial-gradient(60% 80% at 50% 0%, ${glow}26, transparent 65%)`,
          py: { xs: "64px", md: "96px" },
          px: 3,
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: "auto", textAlign: "center" }}>
          <Typography component="h2" sx={{ fontSize: { xs: 28, md: 44 }, fontWeight: 600, color: "#fff", mb: 2 }}>
            Bring AI to production without losing control
          </Typography>
          <Typography sx={{ fontSize: 17, color: "rgba(255,255,255,0.65)", mb: 4 }}>
            Governed traffic, mapped controls, automatic evidence.
          </Typography>
          <Stack direction="row" gap={2} justifyContent="center">
            <Button sx={solidBtn} href={DEMO_MAIL}>
              Book a demo
            </Button>
            <Button sx={ghostBtn(true)} onClick={() => navigate("/login")}>
              Sign in
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* 14 — FAQ */}
      <Section id="faq">
        <Reveal>
          <Eyebrow>faq</Eyebrow>
          <Typography component="h2" sx={{ fontSize: { xs: 26, md: 36 }, fontWeight: 600, mb: 4 }}>
            Common questions
          </Typography>
        </Reveal>
        <Box sx={{ maxWidth: 800 }}>
          {FAQS.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </Box>
      </Section>

      {/* 15 — Footer */}
      <Box component="footer" sx={{ borderTop: `1px solid ${hairline}`, py: 5, px: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center" gap={2} sx={{ maxWidth: 1200, mx: "auto" }}>
          <Stack direction="row" alignItems="center" gap={1.25}>
            <img src="/parkar-logo.png" alt="Parkar GovernAI" height={18} />
            <Typography sx={{ fontSize: 13, color: inkSoft }}>
              © {new Date().getFullYear()} Parkar Digital · GovernAI
            </Typography>
          </Stack>
          <Stack direction="row" gap={3}>
            {[
              { l: "Sign in", href: "/login" },
              { l: "Book a demo", href: DEMO_MAIL },
            ].map((x) => (
              <Typography key={x.l} component="a" href={x.href} sx={{ fontSize: 13, color: inkSoft, textDecoration: "none", "&:hover": { color: ink } }}>
                {x.l}
              </Typography>
            ))}
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

export default Landing;