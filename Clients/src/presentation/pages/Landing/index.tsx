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
// import { useEffect, useRef, useState } from "react";
// import { Box, Stack, Typography, Button } from "@mui/material";
// import { useNavigate } from "react-router-dom";
// import {
//   ShieldCheck,
//   Router as RouterIcon,
//   FlaskConical,
//   ScrollText,
//   Lock,
//   ChevronDown,
//   ArrowRight,
//   CircleCheck,
//   Layers,
//   Eye,
//   FileCheck2,
// } from "lucide-react";

// // ── Design tokens ───────────────────────────────────────────────────────────
// const ink = "#0B1220";
// const inkSoft = "#3B4454";
// const surface = "#FFFFFF";
// const surfaceAlt = "#F6F7F9";
// const hairline = "#E3E6EA";
// const accent = "#1B3A6B"; // Parkar navy
// const accentHover = "#152E54";
// const glow = "#5B8DEF"; // electric counterpart of the navy, used only on dark
// const ok = "#16A34A";
// const okDark = "#4ADE80";
// const warn = "#D97706";
// const warnDark = "#FBBF24";
// const bad = "#DC2626";
// const badDark = "#F87171";
// const mono = '"JetBrains Mono", "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

// const FRAMEWORKS = ["EU AI Act", "NIST AI RMF", "ISO 42001", "ISO 27001", "SOC 2", "GDPR"];
// const DEMO_MAIL = "mailto:ap@parkar.digital?subject=Parkar%20GovernAI%20demo";

// // ── Global keyframes (one injection, reduced-motion safe) ───────────────────
// const Keyframes = () => (
//   <style>{`
//     @keyframes lpPacket { 0% { left: 0; opacity: 0; } 6% { opacity: 1; } 94% { opacity: 1; } 100% { left: calc(100% - 8px); opacity: 0; } }
//     @keyframes lpRow { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
//     @keyframes lpMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
//     @keyframes lpBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
//     @media (prefers-reduced-motion: reduce) {
//       .lp-anim, .lp-marquee { animation: none !important; }
//     }
//   `}</style>
// );

// // ── Tiny scroll-reveal (respects prefers-reduced-motion) ────────────────────
// const Reveal = ({
//   children,
//   delay = 0,
//   grow = false,
// }: {
//   children: React.ReactNode;
//   delay?: number;
//   grow?: boolean;
// }) => {
//   const ref = useRef<HTMLDivElement>(null);
//   const [shown, setShown] = useState(false);
//   useEffect(() => {
//     const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
//     if (reduced) {
//       setShown(true);
//       return;
//     }
//     const el = ref.current;
//     if (!el) return;
//     const io = new IntersectionObserver(
//       ([e]) => {
//         if (e.isIntersecting) {
//           setShown(true);
//           io.disconnect();
//         }
//       },
//       { threshold: 0.15 },
//     );
//     io.observe(el);
//     return () => io.disconnect();
//   }, []);
//   return (
//     <div
//       ref={ref}
//       style={{
//         opacity: shown ? 1 : 0,
//         transform: shown ? "none" : "translateY(12px)",
//         transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
//         ...(grow ? { flex: "1 1 0%", minWidth: 0 } : {}),
//       }}
//     >
//       {children}
//     </div>
//   );
// };

// // ── Count-up number (settles to final value, reduced-motion = instant) ──────
// const CountUp = ({
//   end,
//   decimals = 0,
//   suffix = "",
//   duration = 1400,
// }: {
//   end: number;
//   decimals?: number;
//   suffix?: string;
//   duration?: number;
// }) => {
//   const [val, setVal] = useState(0);
//   const ref = useRef<HTMLSpanElement>(null);
//   useEffect(() => {
//     const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
//     if (reduced) {
//       setVal(end);
//       return;
//     }
//     const el = ref.current;
//     if (!el) return;
//     let raf = 0;
//     const io = new IntersectionObserver(
//       ([e]) => {
//         if (!e.isIntersecting) return;
//         io.disconnect();
//         const t0 = performance.now();
//         const tick = (t: number) => {
//           const p = Math.min((t - t0) / duration, 1);
//           const eased = 1 - Math.pow(1 - p, 3);
//           setVal(end * eased);
//           if (p < 1) raf = requestAnimationFrame(tick);
//         };
//         raf = requestAnimationFrame(tick);
//       },
//       { threshold: 0.4 },
//     );
//     io.observe(el);
//     return () => {
//       io.disconnect();
//       cancelAnimationFrame(raf);
//     };
//   }, [end, duration]);
//   return (
//     <span ref={ref}>
//       {val.toFixed(decimals)}
//       {suffix}
//     </span>
//   );
// };

// // ── Shared bits ─────────────────────────────────────────────────────────────
// const Eyebrow = ({ children, light = false }: { children: React.ReactNode; light?: boolean }) => (
//   <Typography
//     component="div"
//     sx={{
//       fontFamily: mono,
//       fontSize: 11,
//       letterSpacing: "0.14em",
//       textTransform: "uppercase",
//       color: light ? "rgba(255,255,255,0.55)" : accent,
//       mb: 2,
//     }}
//   >
//     {children}
//   </Typography>
// );

// const Section = ({
//   children,
//   band = "white",
//   id,
// }: {
//   children: React.ReactNode;
//   band?: "white" | "alt" | "dark";
//   id?: string;
// }) => (
//   <Box
//     id={id}
//     component="section"
//     sx={{
//       backgroundColor: band === "dark" ? ink : band === "alt" ? surfaceAlt : surface,
//       py: { xs: "64px", md: "112px" },
//       px: 3,
//     }}
//   >
//     <Box sx={{ maxWidth: 1200, mx: "auto" }}>{children}</Box>
//   </Box>
// );

// const solidBtn = {
//   backgroundColor: accent,
//   color: "#fff",
//   textTransform: "none",
//   fontSize: 15,
//   fontWeight: 600,
//   px: 3.5,
//   py: 1.25,
//   borderRadius: "9px",
//   boxShadow: "none",
//   transition: "all 0.2s ease",
//   "&:hover": {
//     backgroundColor: accentHover,
//     boxShadow: `0 8px 24px -8px ${glow}66`,
//     transform: "translateY(-1px)",
//   },
//   "&:focus-visible": { outline: `2px solid ${glow}`, outlineOffset: 2 },
// } as const;

// const ghostBtn = (light = false) =>
//   ({
//     color: light ? "#fff" : ink,
//     border: `1px solid ${light ? "rgba(255,255,255,0.3)" : hairline}`,
//     textTransform: "none",
//     fontSize: 15,
//     fontWeight: 600,
//     px: 3.5,
//     py: 1.25,
//     borderRadius: "9px",
//     transition: "all 0.2s ease",
//     "&:hover": {
//       backgroundColor: light ? "rgba(255,255,255,0.08)" : surfaceAlt,
//       border: `1px solid ${light ? "rgba(255,255,255,0.5)" : "#cfd4da"}`,
//     },
//     "&:focus-visible": { outline: `2px solid ${light ? glow : accent}`, outlineOffset: 2 },
//   }) as const;

// const hoverCard = {
//   backgroundColor: surface,
//   border: `1px solid ${hairline}`,
//   borderRadius: "12px",
//   transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
//   "&:hover": {
//     transform: "translateY(-3px)",
//     borderColor: `${accent}55`,
//     boxShadow: "0 12px 32px -16px rgba(11,18,32,0.25)",
//   },
// } as const;

// // ── Product mocks (CSS-built — real product surfaces, no stock art) ─────────
// const StatusRow = ({
//   label,
//   count,
//   color,
//   pct,
// }: {
//   label: string;
//   count: number;
//   color: string;
//   pct: number;
// }) => (
//   <Box sx={{ mb: 1.5 }}>
//     <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
//       <Typography sx={{ fontSize: 12, color: inkSoft }}>{label}</Typography>
//       <Typography sx={{ fontFamily: mono, fontSize: 12, color: ink }}>{count}</Typography>
//     </Stack>
//     <Box sx={{ height: 6, borderRadius: 3, backgroundColor: "#EEF0F3", overflow: "hidden" }}>
//       <Box
//         sx={{
//           height: 6,
//           width: `${pct}%`,
//           borderRadius: 3,
//           backgroundColor: color,
//           transition: "width 1s ease",
//         }}
//       />
//     </Box>
//   </Box>
// );

// const DashboardMock = () => (
//   <Box sx={{ position: "relative" }}>
//     <Box
//       aria-hidden
//       sx={{
//         position: "absolute",
//         inset: -48,
//         background: `radial-gradient(closest-side, ${glow}33, transparent 70%)`,
//         pointerEvents: "none",
//       }}
//     />
//     <Box
//       role="img"
//       aria-label="Parkar GovernAI governance dashboard showing control status across frameworks"
//       sx={{
//         position: "relative",
//         backgroundColor: surface,
//         border: `1px solid ${hairline}`,
//         borderRadius: "12px",
//         p: 3,
//         boxShadow: "0 24px 60px -24px rgba(11,18,32,0.55)",
//       }}
//     >
//       <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
//         <Typography sx={{ fontSize: 13, fontWeight: 600, color: ink }}>
//           Compliance posture — EU AI Act
//         </Typography>
//         <Stack direction="row" alignItems="center" gap={0.75}>
//           <Box
//             className="lp-anim"
//             sx={{
//               width: 7,
//               height: 7,
//               borderRadius: "50%",
//               backgroundColor: ok,
//               animation: "lpBlink 1.6s ease-in-out infinite",
//             }}
//           />
//           <Typography sx={{ fontFamily: mono, fontSize: 11, color: ok }}>live</Typography>
//         </Stack>
//       </Stack>
//       <Stack direction="row" gap={2.5} sx={{ mb: 3 }}>
//         {[
//           { node: <CountUp end={82} suffix="%" />, l: "controls covered" },
//           { node: <CountUp end={1.2} decimals={1} suffix="M" />, l: "calls governed / mo" },
//           { node: <CountUp end={0} />, l: "unlogged requests" },
//         ].map((s) => (
//           <Box key={s.l} sx={{ flex: 1, border: `1px solid ${hairline}`, borderRadius: "9px", p: 1.5 }}>
//             <Typography sx={{ fontSize: 22, fontWeight: 600, color: ink, fontVariantNumeric: "tabular-nums" }}>
//               {s.node}
//             </Typography>
//             <Typography sx={{ fontSize: 11, color: inkSoft }}>{s.l}</Typography>
//           </Box>
//         ))}
//       </Stack>
//       <StatusRow label="Implemented" count={64} color={ok} pct={64} />
//       <StatusRow label="In progress" count={21} color={warn} pct={21} />
//       <StatusRow label="Gap" count={9} color={bad} pct={9} />
//     </Box>
//   </Box>
// );

// const GATES = ["Agent", "Identity & policy", "Input guardrails", "Model", "Output guardrails", "Response"];

// const GatewayFlow = ({ light = false }: { light?: boolean }) => (
//   <Box>
//     <Stack
//       direction="row"
//       alignItems="center"
//       flexWrap="wrap"
//       gap={1}
//       role="img"
//       aria-label="A request passing through the gateway: agent, identity and policy check, input guardrails, model, output guardrails, response"
//     >
//       {GATES.map((g, i) => (
//         <Stack key={g} direction="row" alignItems="center" gap={1}>
//           <Box
//             sx={{
//               fontFamily: mono,
//               fontSize: 11,
//               px: 1.5,
//               py: 0.75,
//               borderRadius: "999px",
//               border: `1px solid ${light ? "rgba(255,255,255,0.25)" : hairline}`,
//               color: light ? "rgba(255,255,255,0.85)" : ink,
//               backgroundColor:
//                 i === 1 || i === 2 || i === 4
//                   ? light
//                     ? "rgba(91,141,239,0.28)"
//                     : "#E7ECF5"
//                   : "transparent",
//               whiteSpace: "nowrap",
//             }}
//           >
//             {g}
//           </Box>
//           {i < GATES.length - 1 && (
//             <ArrowRight size={13} color={light ? "rgba(255,255,255,0.4)" : "#9AA1AB"} />
//           )}
//         </Stack>
//       ))}
//     </Stack>
//     <Box
//       aria-hidden
//       sx={{
//         position: "relative",
//         mt: 2.5,
//         height: "2px",
//         borderRadius: 1,
//         backgroundColor: light ? "rgba(255,255,255,0.12)" : "#EEF0F3",
//       }}
//     >
//       <Box
//         className="lp-anim"
//         sx={{
//           position: "absolute",
//           top: -3,
//           left: 0,
//           width: 8,
//           height: 8,
//           borderRadius: "50%",
//           backgroundColor: light ? glow : accent,
//           boxShadow: light ? `0 0 12px ${glow}` : "none",
//           animation: "lpPacket 3.4s linear infinite",
//         }}
//       />
//     </Box>
//   </Box>
// );

// // ── Signature: live governed-traffic log ────────────────────────────────────
// type LogRow = { agent: string; model: string; verdict: "allowed" | "pii redacted" | "blocked" | "human review" };

// const TRAFFIC: LogRow[] = [
//   { agent: "support-agent", model: "claude-sonnet-4-6", verdict: "allowed" },
//   { agent: "sales-copilot", model: "gpt-4o", verdict: "pii redacted" },
//   { agent: "unknown-script", model: "mistral-large", verdict: "blocked" },
//   { agent: "rag-pipeline", model: "claude-haiku-4-5", verdict: "allowed" },
//   { agent: "finance-agent", model: "bedrock-titan", verdict: "human review" },
//   { agent: "qa-evaluator", model: "claude-sonnet-4-6", verdict: "allowed" },
//   { agent: "intern-notebook", model: "gpt-4o-mini", verdict: "blocked" },
//   { agent: "kb-summarizer", model: "gemini-2.5-pro", verdict: "allowed" },
// ];

// const verdictColor = (v: LogRow["verdict"]) =>
//   v === "allowed" ? okDark : v === "pii redacted" ? warnDark : v === "blocked" ? badDark : glow;

// const LiveTrafficLog = () => {
//   const [rows, setRows] = useState<Array<LogRow & { ts: string; id: number }>>([]);
//   const idx = useRef(0);
//   useEffect(() => {
//     const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
//     const stamp = () => new Date().toLocaleTimeString("en-GB", { hour12: false });
//     const push = () => {
//       const r = TRAFFIC[idx.current % TRAFFIC.length];
//       idx.current += 1;
//       setRows((prev) => [...prev.slice(-5), { ...r, ts: stamp(), id: idx.current }]);
//     };
//     if (reduced) {
//       setRows(TRAFFIC.slice(0, 6).map((r, i) => ({ ...r, ts: stamp(), id: i })));
//       return;
//     }
//     push();
//     const t = setInterval(push, 1700);
//     return () => clearInterval(t);
//   }, []);
//   return (
//     <Box
//       role="log"
//       aria-label="Live stream of governed AI requests and their gateway verdicts"
//       aria-live="off"
//       sx={{
//         border: "1px solid rgba(255,255,255,0.14)",
//         borderRadius: "12px",
//         backgroundColor: "rgba(255,255,255,0.03)",
//         overflow: "hidden",
//       }}
//     >
//       <Stack
//         direction="row"
//         alignItems="center"
//         justifyContent="space-between"
//         sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.1)" }}
//       >
//         <Typography sx={{ fontFamily: mono, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
//           governed traffic — live
//         </Typography>
//         <Box
//           className="lp-anim"
//           sx={{
//             width: 7,
//             height: 7,
//             borderRadius: "50%",
//             backgroundColor: okDark,
//             animation: "lpBlink 1.6s ease-in-out infinite",
//           }}
//         />
//       </Stack>
//       <Box sx={{ p: 2.5, minHeight: 196 }}>
//         {rows.map((r) => (
//           <Stack
//             key={r.id}
//             className="lp-anim"
//             direction="row"
//             alignItems="center"
//             gap={2}
//             sx={{ py: 0.75, animation: "lpRow 0.35s ease both" }}
//           >
//             <Typography sx={{ fontFamily: mono, fontSize: 12, color: "rgba(255,255,255,0.35)", width: 64, flexShrink: 0 }}>
//               {r.ts}
//             </Typography>
//             <Typography sx={{ fontFamily: mono, fontSize: 12, color: "rgba(255,255,255,0.85)", width: 140, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
//               {r.agent}
//             </Typography>
//             <Typography sx={{ fontFamily: mono, fontSize: 12, color: "rgba(255,255,255,0.45)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
//               {r.model}
//             </Typography>
//             <Typography
//               sx={{
//                 fontFamily: mono,
//                 fontSize: 11,
//                 color: verdictColor(r.verdict),
//                 border: `1px solid ${verdictColor(r.verdict)}44`,
//                 borderRadius: "999px",
//                 px: 1.25,
//                 py: 0.25,
//                 whiteSpace: "nowrap",
//               }}
//             >
//               {r.verdict}
//             </Typography>
//           </Stack>
//         ))}
//       </Box>
//     </Box>
//   );
// };

// // ── FAQ ─────────────────────────────────────────────────────────────────────
// const FAQS: Array<{ q: string; a: string }> = [
//   {
//     q: "How is this different from an observability tool?",
//     a: "Observability tools show you what happened. Parkar GovernAI also controls it — policy is enforced on every call before the model is reached — and proves it, mapping every event to compliance controls and exportable audit evidence.",
//   },
//   {
//     q: "Where does my data go?",
//     a: "Parkar GovernAI deploys self-hosted in your VPC or cloud account. Prompts, responses, and logs stay inside your environment; nothing is required to leave your perimeter.",
//   },
//   {
//     q: "Which frameworks are supported?",
//     a: "Control mapping ships for EU AI Act, NIST AI RMF, ISO 42001, ISO 27001, SOC 2, and GDPR, with cross-framework synergies so one implemented control satisfies every framework that references it.",
//   },
//   {
//     q: "Can I self-host?",
//     a: "Yes — the platform runs as containers (Docker Compose or Kubernetes) in your own infrastructure, with SSO, RBAC, and encrypted secrets at rest.",
//   },
//   {
//     q: "Does the gateway add latency to model calls?",
//     a: "Policy checks and guardrails run in-line in milliseconds, and response caching can make repeated calls faster than going direct. Heavy analysis runs out of band.",
//   },
//   {
//     q: "How do evals gate releases?",
//     a: "Evaluation runs score correctness, faithfulness, hallucination, and bias against thresholds you set. Run them in CI; a failing score blocks the release and the result is filed as compliance evidence either way.",
//   },
// ];

// const FaqItem = ({ q, a }: { q: string; a: string }) => {
//   const [open, setOpen] = useState(false);
//   return (
//     <Box sx={{ borderBottom: `1px solid ${hairline}` }}>
//       <Box
//         component="button"
//         onClick={() => setOpen(!open)}
//         aria-expanded={open}
//         sx={{
//           all: "unset",
//           boxSizing: "border-box",
//           cursor: "pointer",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           width: "100%",
//           py: 2.5,
//           "&:focus-visible": { outline: `2px solid ${accent}`, outlineOffset: 2 },
//         }}
//       >
//         <Typography sx={{ fontSize: 16, fontWeight: 600, color: ink }}>{q}</Typography>
//         <ChevronDown
//           size={18}
//           color={inkSoft}
//           style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
//         />
//       </Box>
//       {open && <Typography sx={{ fontSize: 15, color: inkSoft, lineHeight: 1.6, pb: 2.5 }}>{a}</Typography>}
//     </Box>
//   );
// };

// // ── Page ────────────────────────────────────────────────────────────────────
// const Landing = () => {
//   const navigate = useNavigate();
//   const [scrolled, setScrolled] = useState(false);
//   useEffect(() => {
//     const onScroll = () => setScrolled(window.scrollY > 24);
//     window.addEventListener("scroll", onScroll, { passive: true });
//     return () => window.removeEventListener("scroll", onScroll);
//   }, []);

//   const pillars = [
//     {
//       icon: <RouterIcon size={20} color={accent} />,
//       title: "AI Gateway",
//       desc: "A single governed endpoint that all LLM and agent traffic routes through.",
//       bullets: [
//         "Policy enforcement on every request",
//         "Inline guardrails: PII, injection, output validation",
//         "Model allow-listing, budgets, and rate limits",
//       ],
//     },
//     {
//       icon: <ShieldCheck size={20} color={accent} />,
//       title: "Governance",
//       desc: "The system of record for every AI system, risk, and control in your company.",
//       bullets: [
//         "Model inventory and agent registry",
//         "Compliance mapping across 6+ frameworks",
//         "Risk register, incidents, immutable audit trail",
//       ],
//     },
//     {
//       icon: <FlaskConical size={20} color={accent} />,
//       title: "LLM Evals",
//       desc: "Automated quality and safety evaluation, wired into your release process.",
//       bullets: [
//         "Correctness, faithfulness, hallucination scoring",
//         "Bias and fairness scans",
//         "Release gating with results filed as evidence",
//       ],
//     },
//   ];

//   const deepDives = [
//     {
//       eyebrow: "ai gateway",
//       title: "One governed endpoint for every model call",
//       body: "Point your agents and apps at the gateway instead of the provider. Every request passes identity and policy checks, inline guardrails, and budget enforcement before a model is reached — and every prompt and response is logged.",
//       bullets: [
//         "Policy enforcement on every request",
//         "PII masking, prompt-injection and jailbreak detection",
//         "Per-team budgets, rate limits, model allow-lists",
//         "Full prompt/response logging with cost attribution",
//       ],
//       visual: (
//         <Box sx={{ border: `1px solid ${hairline}`, borderRadius: "12px", p: 3, backgroundColor: surface }}>
//           <Typography sx={{ fontFamily: mono, fontSize: 11, color: inkSoft, mb: 2 }}>
//             request lifecycle
//           </Typography>
//           <GatewayFlow />
//         </Box>
//       ),
//     },
//     {
//       eyebrow: "governance",
//       title: "The system of record for all your AI",
//       body: "Inventory every model and agent, map controls to the frameworks your auditors care about, and keep risk, incidents, and evidence in one place — with an audit trail that writes itself from live traffic.",
//       bullets: [
//         "Model inventory and agent registry",
//         "Compliance mapping: EU AI Act, NIST AI RMF, ISO 42001, SOC 2",
//         "Risk register and incident management",
//         "Immutable audit trail and evidence export",
//       ],
//       visual: <DashboardMock />,
//     },
//     {
//       eyebrow: "llm evals",
//       title: "Prove quality before you ship, and on every release",
//       body: "Run correctness, faithfulness, hallucination, and bias evaluations against your own datasets. Gate releases on the results, and file every run as compliance evidence automatically.",
//       bullets: [
//         "Correctness, faithfulness and hallucination scoring",
//         "Bias and fairness scans on real CSV data",
//         "CI/CD release gating via SDK",
//         "Results stored as audit evidence",
//       ],
//       visual: (
//         <Box sx={{ border: `1px solid ${hairline}`, borderRadius: "12px", p: 3, backgroundColor: surface }}>
//           <Typography sx={{ fontFamily: mono, fontSize: 11, color: inkSoft, mb: 2 }}>
//             eval run — release 1.8.0
//           </Typography>
//           {[
//             { m: "Correctness", v: "0.91", c: ok },
//             { m: "Faithfulness", v: "0.88", c: ok },
//             { m: "Hallucination", v: "0.04", c: ok },
//             { m: "Bias (demographic parity)", v: "0.07", c: warn },
//           ].map((r) => (
//             <Stack key={r.m} direction="row" justifyContent="space-between" sx={{ py: 1, borderBottom: `1px solid ${hairline}` }}>
//               <Typography sx={{ fontSize: 13, color: inkSoft }}>{r.m}</Typography>
//               <Typography sx={{ fontFamily: mono, fontSize: 13, color: r.c }}>{r.v}</Typography>
//             </Stack>
//           ))}
//           <Stack direction="row" gap={1} alignItems="center" sx={{ mt: 2 }}>
//             <CircleCheck size={15} color={ok} />
//             <Typography sx={{ fontSize: 12, color: inkSoft }}>
//               Thresholds met — release unblocked, evidence filed
//             </Typography>
//           </Stack>
//         </Box>
//       ),
//     },
//   ];

//   const integrations = [
//     "Anthropic",
//     "OpenAI",
//     "Google Gemini",
//     "Azure OpenAI",
//     "AWS Bedrock",
//     "Mistral",
//     "OpenRouter",
//     "MCP tools",
//     "LangChain / LangGraph",
//     "Google ADK",
//     "SIEM export",
//     "MLflow",
//   ];

//   return (
//     <Box sx={{ backgroundColor: surface, color: ink, fontFamily: "Inter, sans-serif" }}>
//       <Keyframes />

//       {/* 1 — Sticky nav */}
//       <Box
//         component="nav"
//         aria-label="Main"
//         sx={{
//           position: "sticky",
//           top: 0,
//           zIndex: 100,
//           backgroundColor: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
//           backdropFilter: scrolled ? "blur(8px)" : "none",
//           borderBottom: scrolled ? `1px solid ${hairline}` : "1px solid transparent",
//           transition: "all 0.25s ease",
//         }}
//       >
//         <Stack
//           direction="row"
//           alignItems="center"
//           justifyContent="space-between"
//           sx={{ maxWidth: 1200, mx: "auto", px: 3, py: scrolled ? 1.25 : 2 }}
//         >
//           <Stack direction="row" alignItems="center" gap={1.25}>
//             <img src="/parkar-logo.png" alt="Parkar GovernAI" height={22} />
//             <Typography sx={{ fontSize: 15, fontWeight: 600, color: scrolled ? ink : "#fff", transition: "color 0.25s" }}>
//               GovernAI
//             </Typography>
//           </Stack>
//           <Stack direction="row" gap={3.5} sx={{ display: { xs: "none", md: "flex" } }}>
//             {["Platform", "Compliance", "Security", "FAQ"].map((l) => (
//               <Typography
//                 key={l}
//                 component="a"
//                 href={`#${l.toLowerCase()}`}
//                 sx={{
//                   fontSize: 14,
//                   color: scrolled ? inkSoft : "rgba(255,255,255,0.75)",
//                   textDecoration: "none",
//                   transition: "color 0.25s",
//                   "&:hover": { color: scrolled ? ink : "#fff" },
//                 }}
//               >
//                 {l}
//               </Typography>
//             ))}
//           </Stack>
//           <Stack direction="row" gap={1.5}>
//             <Button sx={{ ...ghostBtn(!scrolled), px: 2.5, py: 0.75, fontSize: 14 }} onClick={() => navigate("/login")}>
//               Sign in
//             </Button>
//             <Button sx={{ ...solidBtn, px: 2.5, py: 0.75, fontSize: 14 }} href={DEMO_MAIL}>
//               Book a demo
//             </Button>
//           </Stack>
//         </Stack>
//       </Box>

//       {/* 2 — Hero (dark, dot grid + radial glow) */}
//       <Box
//         component="header"
//         sx={{
//           backgroundColor: ink,
//           backgroundImage: `radial-gradient(80% 70% at 75% 10%, ${glow}2E, transparent 60%), radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)`,
//           backgroundSize: "auto, 26px 26px",
//           mt: { xs: "-56px", md: "-64px" },
//           pt: { xs: "120px", md: "160px" },
//           pb: { xs: "64px", md: "96px" },
//           px: 3,
//         }}
//       >
//         <Box sx={{ maxWidth: 1200, mx: "auto" }}>
//           <Stack direction={{ xs: "column", lg: "row" }} gap={8} alignItems="center">
//             <Box sx={{ flex: 1 }}>
//               <Eyebrow light>ai governance platform</Eyebrow>
//               <Typography
//                 component="h1"
//                 sx={{
//                   fontSize: { xs: 38, md: 60 },
//                   fontWeight: 600,
//                   lineHeight: 1.08,
//                   letterSpacing: "-0.02em",
//                   color: "#fff",
//                   mb: 3,
//                 }}
//               >
//                 Govern every AI call.{" "}
//                 <Box
//                   component="span"
//                   sx={{
//                     background: `linear-gradient(92deg, ${glow}, #8FD0FF 60%, #B7E3FF)`,
//                     WebkitBackgroundClip: "text",
//                     backgroundClip: "text",
//                     color: "transparent",
//                   }}
//                 >
//                   Prove every decision.
//                 </Box>
//               </Typography>
//               <Typography sx={{ fontSize: 18, lineHeight: 1.6, color: "rgba(255,255,255,0.7)", mb: 4, maxWidth: 560 }}>
//                 Route all LLM and agent traffic through one governed gateway. Enforce policy on
//                 every call, map controls to EU AI Act, NIST AI RMF, ISO 42001 and SOC 2, and
//                 generate audit evidence automatically.
//               </Typography>
//               <Stack direction="row" gap={2} sx={{ mb: 5 }}>
//                 <Button sx={solidBtn} href={DEMO_MAIL}>
//                   Book a demo
//                 </Button>
//                 <Button sx={ghostBtn(true)} onClick={() => navigate("/login")}>
//                   See the platform
//                 </Button>
//               </Stack>
//               <Stack direction="row" flexWrap="wrap" gap={2}>
//                 {FRAMEWORKS.map((f) => (
//                   <Typography key={f} sx={{ fontFamily: mono, fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
//                     {f}
//                   </Typography>
//                 ))}
//               </Stack>
//             </Box>
//             <Box sx={{ flex: 1, width: "100%", maxWidth: 540 }}>
//               <DashboardMock />
//             </Box>
//           </Stack>
//         </Box>
//       </Box>

//       {/* 3 — Trust bar */}
//       <Box sx={{ backgroundColor: surfaceAlt, borderBottom: `1px solid ${hairline}`, py: 3, px: 3 }}>
//         <Typography sx={{ textAlign: "center", fontSize: 13, color: inkSoft }}>
//           Built for teams shipping AI in regulated environments
//         </Typography>
//       </Box>

//       {/* 4 — Problem framing */}
//       <Section>
//         <Reveal>
//           <Eyebrow>the problem</Eyebrow>
//           <Typography component="h2" sx={{ fontSize: { xs: 28, md: 40 }, fontWeight: 600, letterSpacing: "-0.01em", mb: 2 }}>
//             AI is already in production. The controls aren't.
//           </Typography>
//           <Typography sx={{ fontSize: 17, color: inkSoft, lineHeight: 1.6, maxWidth: 720, mb: 6 }}>
//             Teams are calling models and shipping agents faster than security, legal, and finance
//             can keep up: ungoverned traffic, no policy enforcement, shadow AI nobody catalogued,
//             and no evidence when an auditor asks.
//           </Typography>
//         </Reveal>
//         <Stack direction={{ xs: "column", md: "row" }} gap={3}>
//           {[
//             { icon: <Eye size={18} color={bad} />, t: "Shadow AI", d: "Unsanctioned tools and untracked model usage across the organization, invisible to security." },
//             { icon: <ScrollText size={18} color={warn} />, t: "No audit trail", d: "When the auditor asks who called what model with whose data, there is no answer." },
//             { icon: <Layers size={18} color={accent} />, t: "Runaway cost", d: "No per-team budgets, no rate limits, and no attribution of spend to products or clients." },
//           ].map((c, i) => (
//             <Reveal key={c.t} delay={i * 80} grow>
//               <Box sx={{ ...hoverCard, p: 3, height: "100%" }}>
//                 <Stack direction="row" gap={1.25} alignItems="center" sx={{ mb: 1.5 }}>
//                   {c.icon}
//                   <Typography sx={{ fontSize: 16, fontWeight: 600 }}>{c.t}</Typography>
//                 </Stack>
//                 <Typography sx={{ fontSize: 14, color: inkSoft, lineHeight: 1.6 }}>{c.d}</Typography>
//               </Box>
//             </Reveal>
//           ))}
//         </Stack>
//       </Section>

//       {/* 5 — Three pillars */}
//       <Section band="alt" id="platform">
//         <Reveal>
//           <Eyebrow>platform</Eyebrow>
//           <Typography component="h2" sx={{ fontSize: { xs: 28, md: 40 }, fontWeight: 600, mb: 6 }}>
//             One control plane, three pillars
//           </Typography>
//         </Reveal>
//         <Stack direction={{ xs: "column", md: "row" }} gap={3}>
//           {pillars.map((p, i) => (
//             <Reveal key={p.title} delay={i * 80} grow>
//               <Box sx={{ ...hoverCard, p: 3.5, height: "100%" }}>
//                 <Box sx={{ width: 40, height: 40, borderRadius: "9px", backgroundColor: "#E7ECF5", display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
//                   {p.icon}
//                 </Box>
//                 <Typography sx={{ fontSize: 18, fontWeight: 600, mb: 1 }}>{p.title}</Typography>
//                 <Typography sx={{ fontSize: 14, color: inkSoft, lineHeight: 1.6, mb: 2 }}>{p.desc}</Typography>
//                 <Stack gap={1}>
//                   {p.bullets.map((b) => (
//                     <Stack key={b} direction="row" gap={1} alignItems="flex-start">
//                       <CircleCheck size={14} color={ok} style={{ marginTop: 3, flexShrink: 0 }} />
//                       <Typography sx={{ fontSize: 13.5, color: inkSoft }}>{b}</Typography>
//                     </Stack>
//                   ))}
//                 </Stack>
//               </Box>
//             </Reveal>
//           ))}
//         </Stack>
//       </Section>

//       {/* 6 — Deep dives */}
//       {deepDives.map((d, i) => (
//         <Section key={d.eyebrow} band={i % 2 ? "alt" : "white"}>
//           <Stack direction={{ xs: "column", lg: i % 2 ? "row-reverse" : "row" }} gap={8} alignItems="center">
//             <Box sx={{ flex: 1 }}>
//               <Reveal>
//                 <Eyebrow>{d.eyebrow}</Eyebrow>
//                 <Typography component="h3" sx={{ fontSize: { xs: 24, md: 32 }, fontWeight: 600, mb: 2 }}>
//                   {d.title}
//                 </Typography>
//                 <Typography sx={{ fontSize: 16, color: inkSoft, lineHeight: 1.65, mb: 3 }}>{d.body}</Typography>
//                 <Stack gap={1.25}>
//                   {d.bullets.map((b) => (
//                     <Stack key={b} direction="row" gap={1.25} alignItems="flex-start">
//                       <CircleCheck size={15} color={ok} style={{ marginTop: 3, flexShrink: 0 }} />
//                       <Typography sx={{ fontSize: 14.5, color: ink }}>{b}</Typography>
//                     </Stack>
//                   ))}
//                 </Stack>
//               </Reveal>
//             </Box>
//             <Box sx={{ flex: 1, width: "100%" }}>
//               <Reveal delay={120}>{d.visual}</Reveal>
//             </Box>
//           </Stack>
//         </Section>
//       ))}

//       {/* 7 — How it works (dark band, flow + live traffic log) */}
//       <Section band="dark">
//         <Reveal>
//           <Eyebrow light>how it works</Eyebrow>
//           <Typography component="h2" sx={{ fontSize: { xs: 26, md: 36 }, fontWeight: 600, color: "#fff", mb: 2 }}>
//             Governance is enforced around the model, not by it
//           </Typography>
//           <Typography sx={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, maxWidth: 680, mb: 5 }}>
//             Every request — from any agent, SDK, or platform — passes through the same gates.
//             Policy and guardrails run before and after the model call, and consequential tool
//             actions can require human approval.
//           </Typography>
//           <Box sx={{ border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px", p: 3, mb: 3 }}>
//             <GatewayFlow light />
//           </Box>
//           <LiveTrafficLog />
//         </Reveal>
//       </Section>

//       {/* 8 — Compliance */}
//       <Section id="compliance">
//         <Reveal>
//           <Eyebrow>compliance</Eyebrow>
//           <Typography component="h2" sx={{ fontSize: { xs: 28, md: 40 }, fontWeight: 600, mb: 2 }}>
//             Map once, comply across frameworks
//           </Typography>
//           <Typography sx={{ fontSize: 16, color: inkSoft, lineHeight: 1.6, maxWidth: 700, mb: 6 }}>
//             Controls are mapped across frameworks with cross-framework synergies — one implemented
//             control satisfies every framework that references it. Publish your posture to customers
//             through a public Trust Center.
//           </Typography>
//         </Reveal>
//         <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2.5 }}>
//           {[
//             { f: "EU AI Act", d: "Risk classification, FRIA, post-market monitoring" },
//             { f: "NIST AI RMF", d: "Govern, map, measure, manage functions" },
//             { f: "ISO 42001", d: "AI management system clauses and annexes" },
//             { f: "ISO 27001", d: "Information security controls" },
//             { f: "SOC 2", d: "Trust service criteria evidence" },
//             { f: "GDPR", d: "Data protection and PII safeguards" },
//           ].map((t, i) => (
//             <Reveal key={t.f} delay={i * 60}>
//               <Box sx={{ ...hoverCard, p: 2.5, height: "100%" }}>
//                 <Typography sx={{ fontFamily: mono, fontSize: 12, color: accent, mb: 1 }}>{t.f}</Typography>
//                 <Typography sx={{ fontSize: 13.5, color: inkSoft, lineHeight: 1.55 }}>{t.d}</Typography>
//               </Box>
//             </Reveal>
//           ))}
//         </Box>
//       </Section>

//       {/* 9 — Security & deployment */}
//       <Section band="alt" id="security">
//         <Stack direction={{ xs: "column", lg: "row" }} gap={8}>
//           <Box sx={{ flex: 1 }}>
//             <Reveal>
//               <Eyebrow>security &amp; deployment</Eyebrow>
//               <Typography component="h2" sx={{ fontSize: { xs: 26, md: 36 }, fontWeight: 600, mb: 2 }}>
//                 Built to pass your security review
//               </Typography>
//               <Typography sx={{ fontSize: 16, color: inkSoft, lineHeight: 1.65 }}>
//                 Parkar GovernAI deploys in your own environment. Prompts, responses, keys, and audit
//                 logs never leave your perimeter.
//               </Typography>
//             </Reveal>
//           </Box>
//           <Box sx={{ flex: 1.2 }}>
//             <Stack gap={2}>
//               {[
//                 { icon: <Lock size={16} color={accent} />, t: "Self-hosted / VPC / your cloud", d: "Containers in your infrastructure — Docker Compose or Kubernetes. Data residency by construction." },
//                 { icon: <ShieldCheck size={16} color={accent} />, t: "SSO, RBAC, encrypted secrets", d: "Microsoft Entra ID single sign-on, role-based access (Admin / Reviewer / Editor / Auditor), AES-256 encryption for provider keys at rest." },
//                 { icon: <FileCheck2 size={16} color={accent} />, t: "Complete audit logging", d: "Every model call, tool call, guardrail event, and configuration change is logged and exportable to your SIEM." },
//               ].map((r, i) => (
//                 <Reveal key={r.t} delay={i * 80}>
//                   <Stack direction="row" gap={2} sx={{ ...hoverCard, p: 2.5 }}>
//                     <Box sx={{ mt: 0.25 }}>{r.icon}</Box>
//                     <Box>
//                       <Typography sx={{ fontSize: 15, fontWeight: 600, mb: 0.5 }}>{r.t}</Typography>
//                       <Typography sx={{ fontSize: 14, color: inkSoft, lineHeight: 1.55 }}>{r.d}</Typography>
//                     </Box>
//                   </Stack>
//                 </Reveal>
//               ))}
//             </Stack>
//           </Box>
//         </Stack>
//       </Section>

//       {/* 10 — Integrations (marquee) */}
//       <Section>
//         <Reveal>
//           <Eyebrow>integrations</Eyebrow>
//           <Typography component="h2" sx={{ fontSize: { xs: 26, md: 36 }, fontWeight: 600, mb: 5 }}>
//             Works with the models and tools you already run
//           </Typography>
//         </Reveal>
//         <Box
//           sx={{
//             overflow: "hidden",
//             position: "relative",
//             "&::before, &::after": {
//               content: '""',
//               position: "absolute",
//               top: 0,
//               bottom: 0,
//               width: 80,
//               zIndex: 1,
//               pointerEvents: "none",
//             },
//             "&::before": { left: 0, background: `linear-gradient(90deg, ${surface}, transparent)` },
//             "&::after": { right: 0, background: `linear-gradient(270deg, ${surface}, transparent)` },
//           }}
//         >
//           <Stack
//             direction="row"
//             gap={1.5}
//             className="lp-marquee"
//             sx={{ width: "max-content", animation: "lpMarquee 28s linear infinite", "&:hover": { animationPlayState: "paused" } }}
//           >
//             {[...integrations, ...integrations].map((l, i) => (
//               <Box
//                 key={`${l}-${i}`}
//                 aria-hidden={i >= integrations.length}
//                 sx={{ fontFamily: mono, fontSize: 12, px: 2, py: 1, borderRadius: "999px", border: `1px solid ${hairline}`, color: inkSoft, whiteSpace: "nowrap" }}
//               >
//                 {l}
//               </Box>
//             ))}
//           </Stack>
//         </Box>
//       </Section>

//       {/* 12 — Quote */}
//       <Section band="alt">
//         <Reveal>
//           <Box sx={{ maxWidth: 760, mx: "auto", textAlign: "center" }}>
//             <Typography sx={{ fontSize: { xs: 20, md: 24 }, fontWeight: 500, lineHeight: 1.5, color: ink, mb: 3 }}>
//               "Observability tools showed us what our agents did. Parkar GovernAI is the first
//               platform that also controls what they're allowed to do — and gives us the evidence
//               trail our auditors actually asked for."
//             </Typography>
//             <Typography sx={{ fontFamily: mono, fontSize: 12, color: inkSoft }}>
//               platform engineering lead · enterprise design partner
//             </Typography>
//           </Box>
//         </Reveal>
//       </Section>

//       {/* 13 — Final CTA (dark, glow) */}
//       <Box
//         sx={{
//           backgroundColor: ink,
//           backgroundImage: `radial-gradient(60% 80% at 50% 0%, ${glow}26, transparent 65%)`,
//           py: { xs: "64px", md: "96px" },
//           px: 3,
//         }}
//       >
//         <Box sx={{ maxWidth: 1200, mx: "auto", textAlign: "center" }}>
//           <Typography component="h2" sx={{ fontSize: { xs: 28, md: 44 }, fontWeight: 600, color: "#fff", mb: 2 }}>
//             Bring AI to production without losing control
//           </Typography>
//           <Typography sx={{ fontSize: 17, color: "rgba(255,255,255,0.65)", mb: 4 }}>
//             Governed traffic, mapped controls, automatic evidence.
//           </Typography>
//           <Stack direction="row" gap={2} justifyContent="center">
//             <Button sx={solidBtn} href={DEMO_MAIL}>
//               Book a demo
//             </Button>
//             <Button sx={ghostBtn(true)} onClick={() => navigate("/login")}>
//               Sign in
//             </Button>
//           </Stack>
//         </Box>
//       </Box>

//       {/* 14 — FAQ */}
//       <Section id="faq">
//         <Reveal>
//           <Eyebrow>faq</Eyebrow>
//           <Typography component="h2" sx={{ fontSize: { xs: 26, md: 36 }, fontWeight: 600, mb: 4 }}>
//             Common questions
//           </Typography>
//         </Reveal>
//         <Box sx={{ maxWidth: 800 }}>
//           {FAQS.map((f) => (
//             <FaqItem key={f.q} q={f.q} a={f.a} />
//           ))}
//         </Box>
//       </Section>

//       {/* 15 — Footer */}
//       <Box component="footer" sx={{ borderTop: `1px solid ${hairline}`, py: 5, px: 3 }}>
//         <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center" gap={2} sx={{ maxWidth: 1200, mx: "auto" }}>
//           <Stack direction="row" alignItems="center" gap={1.25}>
//             <img src="/parkar-logo.png" alt="Parkar GovernAI" height={18} />
//             <Typography sx={{ fontSize: 13, color: inkSoft }}>
//               © {new Date().getFullYear()} Parkar Digital · GovernAI
//             </Typography>
//           </Stack>
//           <Stack direction="row" gap={3}>
//             {[
//               { l: "Sign in", href: "/login" },
//               { l: "Book a demo", href: DEMO_MAIL },
//             ].map((x) => (
//               <Typography key={x.l} component="a" href={x.href} sx={{ fontSize: 13, color: inkSoft, textDecoration: "none", "&:hover": { color: ink } }}>
//                 {x.l}
//               </Typography>
//             ))}
//           </Stack>
//         </Stack>
//       </Box>
//     </Box>
//   );
// };

// export default Landing;

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Bot,
  Brain,
  Terminal,
  Wrench,
  Search,
  Database,
  Webhook,
  Cpu,
  Send,
  UserCheck,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Activity,
  Gauge,
  Coins,
  DollarSign,
  ScrollText,
  FileCheck2,
  Lock,
  Boxes,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";

/**
 * FlowTrace — AI Agent Graph Intelligence
 * Single-file React landing page. No external CSS, no router, no UI kit.
 * Signature element: a live agent-decision graph (FlowTrace Engine core +
 * orbiting glass nodes + traveling light packets) docked with a streaming
 * activity log. Everything respects prefers-reduced-motion.
 */

// ── Design tokens ────────────────────────────────────────────────────────────
// Surface/text tokens resolve to CSS variables so a single [data-theme] flag on
// the root flips the whole page between dark and light. Brand accents below stay
// constant across both themes.
const BG = "var(--ft-bg)";
const BG2 = "var(--ft-bg2)";
const PANEL = "var(--ft-panel)";
const PANEL2 = "var(--ft-panel2)";
const LINE = "var(--ft-line)";
const TEXT = "var(--ft-text)";
const MUT = "var(--ft-mut)";
const MUT2 = "var(--ft-mut2)";
const CHIP = "var(--ft-chip)"; // floating glass panels (graph nodes, activity log, banner)
const BLUE = "#4F8CFF";
const CYAN = "#38E0FF";
const VIOLET = "#A78BFA";
const GREEN = "#34D399";
const AMBER = "#FBBF24";
const RED = "#F87171";
const GRAD = `linear-gradient(100deg, ${BLUE}, ${CYAN} 46%, ${VIOLET})`;
const DISPLAY = `'Space Grotesk', 'Inter', system-ui, sans-serif`;
const BODY = `'Inter', system-ui, -apple-system, sans-serif`;
const MONO = `'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace`;

const useReduced = () => {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(m.matches);
    const h = (e) => setR(e.matches);
    m.addEventListener?.("change", h);
    return () => m.removeEventListener?.("change", h);
  }, []);
  return r;
};

// ── Global styles (fonts, keyframes, pseudo-states) ──────────────────────────
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');

    .ft-root {
      --ft-bg: #050816; --ft-bg2: #070E1C;
      --ft-panel: rgba(255,255,255,0.035); --ft-panel2: rgba(255,255,255,0.055);
      --ft-line: rgba(255,255,255,0.09);
      --ft-text: #E9EEFA; --ft-mut: rgba(233,238,250,0.60); --ft-mut2: rgba(233,238,250,0.38);
      --ft-chip: rgba(8,16,30,0.85);
      scrollbar-color: rgba(255,255,255,0.18) transparent;
      transition: background .4s ease, color .4s ease;
    }
    .ft-root[data-theme="light"] {
      --ft-bg: #F6F9FE; --ft-bg2: #ECF1F8;
      --ft-panel: rgba(13,28,58,0.045); --ft-panel2: rgba(13,28,58,0.07);
      --ft-line: rgba(13,28,58,0.12);
      --ft-text: #0B1220; --ft-mut: rgba(11,18,32,0.66); --ft-mut2: rgba(11,18,32,0.42);
      --ft-chip: rgba(255,255,255,0.88);
      scrollbar-color: rgba(13,28,58,0.25) transparent;
    }
    .ft-root *::selection { background: ${CYAN}33; }

    @keyframes ftSpin { to { transform: rotate(360deg); } }
    @keyframes ftDash { to { stroke-dashoffset: -34; } }
    @keyframes ftRing {
      0% { transform: scale(.55); opacity: .55; }
      100% { transform: scale(2.5); opacity: 0; }
    }
    @keyframes ftBlink { 0%,100% { opacity: 1; } 50% { opacity: .25; } }
    @keyframes ftPulseGlow {
      0%,100% { opacity: .5; transform: scale(1); }
      50% { opacity: .9; transform: scale(1.06); }
    }
    @keyframes ftRowIn { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: none; } }
    @keyframes ftMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    @keyframes ftMarqueeRev { from { transform: translateX(-50%); } to { transform: translateX(0); } }
    @keyframes ftFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    @keyframes ftShimmer { to { background-position: 200% center; } }
    @keyframes ftSpinePacket { 0% { top: -2%; opacity: 0; } 8% { opacity: 1; } 92% { opacity: 1; } 100% { top: 102%; opacity: 0; } }

    .ft-grad-text {
      background: linear-gradient(100deg, ${BLUE}, ${CYAN} 40%, ${VIOLET} 75%, ${BLUE});
      background-size: 200% auto;
      -webkit-background-clip: text; background-clip: text;
      color: transparent;
      animation: ftShimmer 6s linear infinite;
    }
    .ft-flow { animation: ftDash 1.05s linear infinite; }
    .ft-ring { transform-box: fill-box; transform-origin: center; animation: ftRing 3.4s ease-out infinite; }
    .ft-blink { animation: ftBlink 1.5s ease-in-out infinite; }
    .ft-glow-pulse { animation: ftPulseGlow 4s ease-in-out infinite; }

    .ft-card {
      transition: transform .26s cubic-bezier(.2,.7,.3,1), border-color .26s ease, box-shadow .26s ease, background .26s ease;
      will-change: transform;
    }
    .ft-card:hover {
      transform: translateY(-5px);
      border-color: rgba(120,180,255,0.45) !important;
      box-shadow: 0 22px 60px -30px ${CYAN}55, 0 0 0 1px rgba(120,180,255,0.10) inset;
      background: ${PANEL2} !important;
    }

    .ft-node { transition: transform .25s cubic-bezier(.2,.7,.3,1), box-shadow .25s ease; }
    .ft-node:hover { transform: translate(-50%,-50%) scale(1.13); z-index: 6 !important; }
    .ft-node:hover .ft-tip { opacity: 1; transform: translateX(-50%) translateY(0); }
    .ft-tip {
      opacity: 0; transform: translateX(-50%) translateY(4px);
      transition: opacity .2s ease, transform .2s ease; pointer-events: none;
    }

    .ft-magnet { transition: transform .18s cubic-bezier(.2,.7,.3,1), box-shadow .25s ease, background .25s ease, border-color .25s ease; }
    .ft-btn-primary:hover { box-shadow: 0 16px 44px -18px ${CYAN}88, 0 0 0 1px ${CYAN}55 inset; filter: brightness(1.05); }
    .ft-btn-ghost:hover { background: rgba(255,255,255,0.07) !important; border-color: rgba(255,255,255,0.34) !important; }

    .ft-link { transition: color .2s ease; }
    .ft-link:hover { color: ${TEXT} !important; }

    .ft-step { transition: border-color .25s ease, background .25s ease, box-shadow .25s ease; }
    .ft-step:hover { border-color: rgba(120,180,255,0.4) !important; }

    .ft-chip { transition: border-color .2s ease, color .2s ease, background .2s ease; }
    .ft-chip:hover { color: ${TEXT} !important; border-color: rgba(120,180,255,0.45) !important; background: rgba(120,180,255,0.07) !important; }

    .ft-reveal { opacity: 0; transform: translateY(16px); transition: opacity .6s ease, transform .6s ease; }
    .ft-reveal.ft-in { opacity: 1; transform: none; }

    a:focus-visible, button:focus-visible, [tabindex]:focus-visible {
      outline: 2px solid ${CYAN}; outline-offset: 3px; border-radius: 8px;
    }

    @media (prefers-reduced-motion: reduce) {
      .ft-flow, .ft-ring, .ft-blink, .ft-glow-pulse, .ft-grad-text,
      .ft-marquee, .ft-marquee-rev, .ft-float, .ft-spine-packet { animation: none !important; }
      .ft-reveal { opacity: 1 !important; transform: none !important; }
    }
  `}</style>
);

// ── Scroll reveal ────────────────────────────────────────────────────────────
const Reveal = ({ children, delay = 0, as: Tag = "div", style }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("ft-in");
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("ft-in");
          io.disconnect();
        }
      },
      { threshold: 0.16 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className="ft-reveal" style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </Tag>
  );
};

// ── Count-up ─────────────────────────────────────────────────────────────────
const CountUp = ({ end, decimals = 0, prefix = "", suffix = "", dur = 1500 }) => {
  const [v, setV] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setV(end);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (t) => {
          const p = Math.min((t - t0) / dur, 1);
          setV(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [end, dur]);
  return (
    <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}
      {v.toFixed(decimals)}
      {suffix}
    </span>
  );
};

// ── Magnetic button ──────────────────────────────────────────────────────────
const MagButton = ({ children, primary = false, href = "#", reduced }) => {
  const ref = useRef(null);
  const onMove = (e) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * 0.28;
    const y = (e.clientY - r.top - r.height / 2) * 0.42;
    ref.current.style.transform = `translate(${x}px, ${y}px)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = "translate(0,0)";
  };
  const base = {
    fontFamily: DISPLAY,
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    padding: "13px 24px",
    borderRadius: 12,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
    cursor: "pointer",
  };
  const style = primary
    ? {
        ...base,
        color: "#05101f",
        background: `linear-gradient(100deg, ${CYAN}, ${BLUE})`,
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: `0 10px 30px -16px ${CYAN}88`,
      }
    : {
        ...base,
        color: TEXT,
        background: PANEL,
        border: `1px solid ${LINE}`,
        backdropFilter: "blur(10px)",
      };
  return (
    <a
      ref={ref}
      href={href}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={`ft-magnet ${primary ? "ft-btn-primary" : "ft-btn-ghost"}`}
      style={style}
    >
      {children}
    </a>
  );
};

// ── Shared layout bits ───────────────────────────────────────────────────────
const Eyebrow = ({ children, dot = CYAN }) => (
  <div
    style={{
      fontFamily: MONO,
      fontSize: 11.5,
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      color: MUT,
      marginBottom: 18,
      display: "inline-flex",
      alignItems: "center",
      gap: 9,
    }}
  >
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, boxShadow: `0 0 10px ${dot}` }} />
    {children}
  </div>
);

const Section = ({ children, id, style }) => (
  <section id={id} style={{ position: "relative", padding: "clamp(72px, 9vw, 132px) 24px", ...style }}>
    <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 2 }}>{children}</div>
  </section>
);

const SectionGlow = ({ color = BLUE, top = "10%", left = "50%", size = 620, opacity = 0.1 }) => (
  <div
    aria-hidden
    style={{
      position: "absolute",
      top,
      left,
      width: size,
      height: size,
      transform: "translate(-50%,-50%)",
      background: `radial-gradient(circle, ${color}, transparent 62%)`,
      opacity,
      filter: "blur(20px)",
      pointerEvents: "none",
      zIndex: 0,
    }}
  />
);

const GlassCard = ({ children, style, className = "" }) => (
  <div
    className={`ft-card ${className}`}
    style={{
      background: PANEL,
      border: `1px solid ${LINE}`,
      borderRadius: 16,
      backdropFilter: "blur(12px)",
      ...style,
    }}
  >
    {children}
  </div>
);

// ── Neural particle background (canvas) ──────────────────────────────────────
const NeuralBG = ({ reduced, mode }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (reduced) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf, w = 0, h = 0, dpr = 1;
    const N = 52;
    const pts = [];
    const seed = () => {
      pts.length = 0;
      for (let i = 0; i < N; i++)
        pts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
        });
    };
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!pts.length) seed();
    };
    resize();
    seed();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = pts[i], b = pts[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 132) {
            ctx.strokeStyle = mode === "light"
              ? `rgba(40,90,180,${(1 - d / 132) * 0.18})`
              : `rgba(90,160,255,${(1 - d / 132) * 0.20})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx.fillStyle = mode === "light" ? "rgba(40,90,180,0.42)" : "rgba(130,205,255,0.45)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [reduced, mode]);
  return <canvas ref={ref} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
};

// ── The signature: live FlowTrace agent graph ────────────────────────────────
const GRAPH_NODES = [
  { key: "Agent", Icon: Bot, tone: CYAN, meta: "12 active" },
  { key: "Prompt", Icon: Terminal, tone: CYAN, meta: "342 tok" },
  { key: "Memory", Icon: Brain, tone: BLUE, meta: "1.2k reads" },
  { key: "Retrieval", Icon: Search, tone: BLUE, meta: "8 sources" },
  { key: "Vector DB", Icon: Database, tone: BLUE, meta: "0.91 sim" },
  { key: "Model", Icon: Cpu, tone: "#6AA8FF", meta: "GPT-4 · 42ms" },
  { key: "Tool Call", Icon: Wrench, tone: CYAN, meta: "API · 28ms" },
  { key: "API", Icon: Webhook, tone: CYAN, meta: "200 OK" },
  { key: "Output", Icon: Send, tone: GREEN, meta: "streaming" },
  { key: "Human Review", Icon: UserCheck, tone: VIOLET, meta: "1 pending" },
  { key: "Risk", Icon: AlertTriangle, tone: RED, meta: "2 flagged" },
  { key: "Policy Engine", Icon: ShieldCheck, tone: AMBER, meta: "enforced" },
];

const FlowGraph = ({ reduced }) => {
  const C = 500;
  const nodes = GRAPH_NODES.map((n, i) => {
    const ang = (-90 + i * (360 / GRAPH_NODES.length)) * (Math.PI / 180);
    const r = 372 + (i % 2 ? 8 : -10);
    return { ...n, i, x: C + Math.cos(ang) * r, y: C + Math.sin(ang) * r };
  });
  const edge = (n) => {
    const mx = (C + n.x) / 2,
      my = (C + n.y) / 2;
    const dx = n.x - C,
      dy = n.y - C;
    const len = Math.hypot(dx, dy) || 1;
    const off = (n.i % 2 ? 22 : -22);
    const cx = mx + (-dy / len) * off;
    const cy = my + (dx / len) * off;
    return `M${C},${C} Q ${cx.toFixed(1)},${cy.toFixed(1)} ${n.x.toFixed(1)},${n.y.toFixed(1)}`;
  };

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 560, aspectRatio: "1 / 1", margin: "0 auto" }}>
      <svg viewBox="0 0 1000 1000" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
        <defs>
          <radialGradient id="ftCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={CYAN} stopOpacity="0.42" />
            <stop offset="55%" stopColor={BLUE} stopOpacity="0.14" />
            <stop offset="100%" stopColor={BLUE} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ftCoreFill" cx="42%" cy="38%" r="70%">
            <stop offset="0%" stopColor="#BEEBFF" />
            <stop offset="45%" stopColor={CYAN} />
            <stop offset="100%" stopColor={BLUE} />
          </radialGradient>
        </defs>

        <circle cx={C} cy={C} r={185} fill="url(#ftCoreGlow)" className={reduced ? "" : "ft-glow-pulse"} style={{ transformBox: "fill-box", transformOrigin: "center" }} />

        {nodes.map((n) => {
          const d = edge(n);
          return (
            <g key={n.key}>
              <path d={d} fill="none" stroke={n.tone} strokeOpacity={0.16} strokeWidth={1.4} />
              {!reduced && (
                <path d={d} fill="none" stroke={n.tone} strokeOpacity={0.55} strokeWidth={1.6} strokeDasharray="5 12" className="ft-flow" style={{ animationDelay: `${(n.i % 6) * 0.12}s` }} />
              )}
              {!reduced && (
                <circle r={4} cx={0} cy={0} fill={n.tone}>
                  <animateMotion path={d} dur={`${2.6 + (n.i % 5) * 0.32}s`} begin={`${(n.i * 0.27).toFixed(2)}s`} repeatCount="indefinite" calcMode="linear" />
                </circle>
              )}
            </g>
          );
        })}

        {!reduced &&
          [0, 1, 2].map((k) => (
            <circle key={k} cx={C} cy={C} r={66} fill="none" stroke={CYAN} strokeOpacity={0.4} strokeWidth={1.2} className="ft-ring" style={{ animationDelay: `${k * 1.13}s` }} />
          ))}
        <circle cx={C} cy={C} r={64} fill="url(#ftCoreFill)" />
        <circle cx={C} cy={C} r={64} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1} />
      </svg>

      {/* Core label overlay */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
          width: 128,
          height: 128,
          borderRadius: "50%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          zIndex: 5,
          pointerEvents: "none",
        }}
      >
        <Sparkles size={22} color="#06121f" strokeWidth={2.2} style={{ marginBottom: 3 }} />
        <div style={{ fontFamily: DISPLAY, fontSize: 12.5, fontWeight: 700, color: "#06121f", lineHeight: 1.1 }}>FlowTrace</div>
        <div style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.14em", color: "rgba(6,18,31,0.7)", textTransform: "uppercase" }}>engine</div>
      </div>

      {/* HTML node cards */}
      {nodes.map((n) => (
        <div
          key={n.key}
          className="ft-node"
          tabIndex={0}
          aria-label={`${n.key}: ${n.meta}`}
          style={{
            position: "absolute",
            left: `${n.x / 10}%`,
            top: `${n.y / 10}%`,
            transform: "translate(-50%,-50%)",
            zIndex: 4,
            cursor: "default",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "7px 11px",
              borderRadius: 11,
              background: CHIP,
              border: `1px solid ${n.tone}55`,
              backdropFilter: "blur(8px)",
              boxShadow: `0 6px 22px -10px ${n.tone}66, 0 0 0 3px ${n.tone}12`,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ position: "relative", display: "flex" }}>
              <n.Icon size={13.5} color={n.tone} strokeWidth={2.1} />
            </span>
            <span style={{ fontFamily: DISPLAY, fontSize: 11.5, fontWeight: 600, color: TEXT }}>{n.key}</span>
            <span className={reduced ? "" : "ft-blink"} style={{ width: 5, height: 5, borderRadius: "50%", background: n.tone, boxShadow: `0 0 7px ${n.tone}`, animationDelay: `${(n.i % 5) * 0.3}s` }} />
          </div>
          <div
            className="ft-tip"
            style={{
              position: "absolute",
              left: "50%",
              top: "calc(100% + 7px)",
              fontFamily: MONO,
              fontSize: 10,
              color: n.tone,
              background: CHIP,
              border: `1px solid ${n.tone}44`,
              borderRadius: 7,
              padding: "3px 8px",
              whiteSpace: "nowrap",
            }}
          >
            {n.meta}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Live activity stream ─────────────────────────────────────────────────────
const ACTIVITY = [
  { a: "CustomerAgent → GPT-4", t: "Prompt processed", tone: CYAN },
  { a: "Policy Engine", t: "Sensitive data detected", tone: AMBER },
  { a: "Memory Retrieval", t: "Knowledge source matched", tone: BLUE },
  { a: "Human Approval", t: "Required", tone: VIOLET },
  { a: "Tool · search_db", t: "Executed · 28ms", tone: CYAN },
  { a: "Risk Monitor", t: "Threshold cleared", tone: RED },
  { a: "Response", t: "Delivered to user", tone: GREEN },
];

const LiveActivity = ({ reduced }) => {
  const [rows, setRows] = useState([]);
  const idx = useRef(0);
  useEffect(() => {
    const stamp = () => new Date().toLocaleTimeString("en-GB", { hour12: false });
    if (reduced) {
      setRows(ACTIVITY.slice(0, 5).map((r, i) => ({ ...r, ts: stamp(), id: i })));
      return;
    }
    const push = () => {
      const r = ACTIVITY[idx.current % ACTIVITY.length];
      idx.current += 1;
      setRows((p) => [...p.slice(-4), { ...r, ts: stamp(), id: idx.current }]);
    };
    push();
    const t = setInterval(push, 1700);
    return () => clearInterval(t);
  }, [reduced]);

  return (
    <div
      role="log"
      aria-label="Live AI activity stream"
      style={{
        position: "absolute",
        left: -6,
        bottom: -8,
        width: 290,
        maxWidth: "78%",
        background: CHIP,
        border: `1px solid ${LINE}`,
        borderRadius: 14,
        backdropFilter: "blur(16px)",
        boxShadow: "0 30px 70px -30px rgba(0,0,0,0.8)",
        overflow: "hidden",
        zIndex: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: `1px solid ${LINE}` }}>
        <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: MUT }}>Live AI activity</span>
        <span className={reduced ? "" : "ft-blink"} style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
      </div>
      <div style={{ padding: "8px 14px 12px", minHeight: 132 }}>
        {rows.map((r) => (
          <div key={r.id} style={{ display: "flex", gap: 9, padding: "5px 0", animation: reduced ? "none" : "ftRowIn .35s ease both" }}>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: MUT2, flexShrink: 0, width: 52 }}>{r.ts}</span>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: r.tone, boxShadow: `0 0 6px ${r.tone}`, marginTop: 4, flexShrink: 0 }} />
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: MONO, fontSize: 11, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.a}</span>
              <span style={{ display: "block", fontSize: 11, color: MUT }}>{r.t}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Sparkline ────────────────────────────────────────────────────────────────
const Sparkline = ({ data, color, w = 132, h = 38 }) => {
  const max = Math.max(...data), min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((d, i) => [(i / (data.length - 1)) * w, h - ((d - min) / span) * (h - 6) - 3]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = `sp-${color.replace("#", "")}-${Math.round(data[0] * 100)}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.4} fill={color} />
    </svg>
  );
};

// ── Decision timeline ────────────────────────────────────────────────────────
const TIMELINE = [
  { step: "User Request", Icon: Send, tone: CYAN, meta: [["channel", "chat"], ["tokens", "128"], ["latency", "—"]] },
  { step: "Agent Selection", Icon: Bot, tone: CYAN, meta: [["agent", "support-v3"], ["confidence", "0.94"], ["latency", "6ms"]] },
  { step: "Memory Search", Icon: Brain, tone: BLUE, meta: [["store", "vector-db"], ["matches", "8"], ["latency", "14ms"]] },
  { step: "Reasoning", Icon: Activity, tone: BLUE, meta: [["model", "gpt-4"], ["steps", "5"], ["latency", "42ms"]] },
  { step: "Tool Calls", Icon: Wrench, tone: CYAN, meta: [["tool", "search_db"], ["calls", "2"], ["latency", "28ms"]] },
  { step: "Policy Validation", Icon: ShieldCheck, tone: AMBER, meta: [["rules", "12"], ["result", "pii redacted"], ["latency", "3ms"]] },
  { step: "Human Approval", Icon: UserCheck, tone: VIOLET, meta: [["reviewer", "ops-team"], ["status", "approved"], ["latency", "—"]] },
  { step: "Final Response", Icon: FileCheck2, tone: GREEN, meta: [["status", "delivered"], ["tokens", "312"], ["total", "93ms"]] },
];

const TimelineRow = ({ item, i, open, onToggle, reduced }) => (
  <div style={{ position: "relative", paddingLeft: 64 }}>
    <div style={{ position: "absolute", left: 19, top: 6, width: 26, height: 26, borderRadius: "50%", background: CHIP, border: `1px solid ${item.tone}66`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, boxShadow: `0 0 16px ${item.tone}44` }}>
      <item.Icon size={13} color={item.tone} strokeWidth={2.1} />
    </div>
    <div
      className="ft-step"
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onClick={onToggle}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onToggle())}
      style={{ background: open ? PANEL2 : PANEL, border: `1px solid ${open ? item.tone + "55" : LINE}`, borderRadius: 13, padding: "13px 16px", marginBottom: 12, cursor: "pointer", backdropFilter: "blur(8px)" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: MONO, fontSize: 11, color: MUT2 }}>{String(i + 1).padStart(2, "0")}</span>
          <span style={{ fontFamily: DISPLAY, fontSize: 15.5, fontWeight: 600, color: TEXT }}>{item.step}</span>
        </div>
        <ChevronDown size={16} color={MUT} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </div>
      {open && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {item.meta.map(([k, v]) => (
            <span key={k} style={{ fontFamily: MONO, fontSize: 11, color: MUT, background: "rgba(255,255,255,0.04)", border: `1px solid ${LINE}`, borderRadius: 999, padding: "3px 10px" }}>
              {k}: <span style={{ color: item.tone }}>{v}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  </div>
);

// ── Page ─────────────────────────────────────────────────────────────────────
export default function FlowTrace() {
  const reduced = useReduced();
  const [scrolled, setScrolled] = useState(false);
  const [openStep, setOpenStep] = useState(0);
  const [mode, setMode] = useState("dark");
  const cursorRef = useRef(null);
  const heroRef = useRef(null);
  const graphWrapRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Theme: saved preference wins, else follow the OS color scheme.
  useEffect(() => {
    let saved = null;
    try { saved = localStorage.getItem("ft-theme"); } catch { /* ignore */ }
    if (saved === "light" || saved === "dark") setMode(saved);
    else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) setMode("light");
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((m) => {
      const next = m === "dark" ? "light" : "dark";
      try { localStorage.setItem("ft-theme", next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Cursor-follow light + hero parallax (ref-based, no re-render)
  const onHeroMove = useCallback(
    (e) => {
      if (reduced) return;
      const cur = cursorRef.current;
      if (cur) {
        cur.style.background = `radial-gradient(420px circle at ${e.clientX}px ${e.clientY}px, rgba(80,150,255,0.10), transparent 70%)`;
      }
      const wrap = graphWrapRef.current;
      const hero = heroRef.current;
      if (wrap && hero) {
        const r = hero.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) / r.width;
        const dy = (e.clientY - r.top - r.height / 2) / r.height;
        wrap.style.transform = `translate(${dx * 14}px, ${dy * 14}px)`;
      }
    },
    [reduced],
  );

  // Live-jittered analytics (the memory-accuracy sparkline ticks)
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => setTick((n) => n + 1), 2200);
    return () => clearInterval(t);
  }, [reduced]);

  const analytics = [
    { label: "Agent Success Rate", Icon: Activity, tone: GREEN, end: 98.6, dec: 1, suffix: "%", delta: "+1.2", spark: [88, 90, 89, 92, 94, 93, 96, 97, 98.6] },
    { label: "Response Latency", Icon: Gauge, tone: CYAN, end: 93, dec: 0, suffix: "ms", delta: "-12", spark: [140, 132, 120, 118, 110, 104, 99, 96, 93] },
    { label: "Token Usage", Icon: Coins, tone: BLUE, end: 4.2, dec: 1, suffix: "M", delta: "+0.4", spark: [2.6, 2.9, 3.1, 3.4, 3.6, 3.8, 3.9, 4.0, 4.2] },
    { label: "Model Cost", Icon: DollarSign, tone: VIOLET, end: 1.8, dec: 1, prefix: "$", suffix: "k", delta: "-6%", spark: [2.5, 2.4, 2.3, 2.1, 2.0, 1.95, 1.9, 1.85, 1.8] },
    { label: "Risk Events", Icon: AlertTriangle, tone: RED, end: 7, dec: 0, delta: "-3", spark: [18, 16, 14, 13, 11, 10, 9, 8, 7] },
    { label: "Tool Usage", Icon: Wrench, tone: CYAN, end: 1.1, dec: 1, suffix: "k/d", delta: "+9%", spark: [0.6, 0.7, 0.75, 0.8, 0.9, 0.95, 1.0, 1.05, 1.1] },
    { label: "Memory Accuracy", Icon: Brain, tone: GREEN, end: 96.4, dec: 1, suffix: "%", delta: "+0.8", spark: [90, 91, 92, 93, 94, 95, 95.4, 96, 96.4] },
  ];

  const systemCards = [
    { t: "Prompt Tracing", d: "Every prompt, system message and variable captured end to end.", Icon: Terminal },
    { t: "Model Observability", d: "Latency, tokens, cost and version for every model interaction.", Icon: Cpu },
    { t: "Memory Tracking", d: "What was retrieved, from where, and how it shaped the answer.", Icon: Brain },
    { t: "Agent Behavior Analysis", d: "Decision paths, retries and loops across multi-agent runs.", Icon: Bot },
    { t: "Tool Execution Mapping", d: "Inputs, outputs and timing for every tool and API call.", Icon: Wrench },
    { t: "Human Approval Tracking", d: "Where humans stepped in, what they saw, what they decided.", Icon: UserCheck },
  ];

  const controlCards = [
    { t: "Security Policies", d: "Per-agent rules for data, models and tools — enforced inline on every call.", Icon: Lock },
    { t: "Compliance Automation", d: "Map activity to EU AI Act, NIST AI RMF, ISO 42001 and SOC 2, automatically.", Icon: FileCheck2 },
    { t: "Human Approval Chains", d: "Require sign-off before consequential actions reach the outside world.", Icon: UserCheck },
    { t: "Audit Trails", d: "An immutable, exportable record of every decision and who made it.", Icon: ScrollText },
    { t: "Model Governance", d: "Allow-lists, budgets and version pinning across every provider you run.", Icon: ShieldCheck },
    { t: "Risk Detection", d: "Real-time scoring for PII, jailbreaks, drift and anomalous behavior.", Icon: AlertTriangle },
  ];

  const stack = [
    { t: "Applications", d: "Products, copilots and workflows your users touch", tone: MUT, glow: false },
    { t: "AI Agents", d: "Autonomous and assisted agents making decisions", tone: BLUE, glow: false },
    { t: "FlowTrace · Graph Intelligence", d: "The orchestration layer that sees, traces and governs every decision", tone: CYAN, glow: true },
    { t: "Models", d: "OpenAI, Anthropic, Gemini, Bedrock, open-weight", tone: BLUE, glow: false },
    { t: "Infrastructure", d: "Vector stores, queues, gateways and compute", tone: MUT, glow: false },
  ];

  const integ1 = ["OpenAI", "Anthropic", "Gemini", "LangGraph", "LangChain", "CrewAI", "AutoGen", "AWS Bedrock"];
  const integ2 = ["Azure OpenAI", "Pinecone", "Weaviate", "MCP", "n8n", "Slack", "GitHub", "MLflow"];

  return (
    <div className="ft-root" data-theme={mode} style={{ background: BG, color: TEXT, fontFamily: BODY, minHeight: "100vh", overflowX: "hidden", position: "relative" }}>
      <Styles />

      {/* Cursor-follow light (fixed, full viewport) */}
      <div ref={cursorRef} aria-hidden style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none", mixBlendMode: "screen" }} />

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav
        aria-label="Main"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: scrolled ? (mode === "light" ? "rgba(246,249,254,0.82)" : "rgba(5,8,22,0.72)") : "transparent",
          backdropFilter: scrolled ? "blur(14px)" : "none",
          borderBottom: `1px solid ${scrolled ? LINE : "transparent"}`,
          transition: "all .3s ease",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: scrolled ? "12px 24px" : "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "padding .3s ease" }}>
          <a href="#top" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <img src="/parkar-logo.png" alt="Parkar" style={{ height: 26, display: "block" }} />
            <span style={{ width: 1, height: 20, background: LINE }} />
            <span style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", color: TEXT }}>GovernAI</span>
          </a>
          <div style={{ display: "flex", gap: 30, alignItems: "center" }} className="ft-navlinks">
            {[["Platform", "#platform"], ["Graph", "#graph"], ["Compliance", "#compliance"], ["Security", "#security"], ["FAQ", "#faq"]].map(([l, h]) => (
              <a key={l} href={h} className="ft-link" style={{ fontSize: 14, color: MUT, textDecoration: "none", display: "none" }} data-nav>
                {l}
              </a>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              onClick={toggleTheme}
              aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={mode === "dark" ? "Light mode" : "Dark mode"}
              className="ft-magnet ft-btn-ghost"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 10, background: PANEL, border: `1px solid ${LINE}`, color: TEXT, cursor: "pointer", backdropFilter: "blur(10px)" }}
            >
              {mode === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <a href="/login" className="ft-link" style={{ fontSize: 14, fontWeight: 600, color: MUT, textDecoration: "none" }}>
              Sign in
            </a>
            <a
              href="/login"
              style={{ fontFamily: DISPLAY, fontSize: 14, fontWeight: 600, color: "#06121f", background: `linear-gradient(100deg, ${CYAN}, ${BLUE})`, padding: "9px 17px", borderRadius: 10, textDecoration: "none", boxShadow: `0 8px 24px -12px ${CYAN}99` }}
            >
              Start monitoring
            </a>
          </div>
        </div>
        <style>{`@media (min-width: 940px){ nav a[data-nav]{ display: inline !important; } }`}</style>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <header
        id="top"
        ref={heroRef}
        onMouseMove={onHeroMove}
        style={{
          position: "relative",
          paddingTop: "clamp(120px, 16vw, 168px)",
          paddingBottom: "clamp(72px, 9vw, 112px)",
          paddingLeft: 24,
          paddingRight: 24,
          background: `radial-gradient(120% 90% at 78% 4%, ${BLUE}1f, transparent 55%), radial-gradient(90% 80% at 8% 30%, ${VIOLET}14, transparent 55%), ${BG}`,
          overflow: "hidden",
        }}
      >
        <NeuralBG reduced={reduced} mode={mode} />
        <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "30px 30px", maskImage: "radial-gradient(120% 90% at 70% 10%, black, transparent 70%)", WebkitMaskImage: "radial-gradient(120% 90% at 70% 10%, black, transparent 70%)" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 3 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 56, alignItems: "center" }} className="ft-hero-grid">
            {/* Left */}
            <div>
              <Eyebrow>Parkar GovernAI · AI governance platform</Eyebrow>
              <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 6.2vw, 66px)", fontWeight: 700, lineHeight: 1.04, letterSpacing: "-0.03em", margin: "0 0 22px" }}>
                See, understand and control{" "}
                <span className="ft-grad-text">every AI agent decision</span>.
              </h1>
              <p style={{ fontSize: "clamp(16px, 1.6vw, 19px)", lineHeight: 1.62, color: MUT, maxWidth: 560, margin: "0 0 34px" }}>
                Visualize every prompt, model interaction, memory retrieval, tool call and reasoning path across your AI systems — in real time.
              </p>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 40 }}>
                <MagButton primary href="/login" reduced={reduced}>
                  Start monitoring <ArrowRight size={17} />
                </MagButton>
                <MagButton href="#graph" reduced={reduced}>
                  Explore FlowTrace <ArrowUpRight size={16} />
                </MagButton>
              </div>
              <div style={{ display: "flex", gap: 0, flexWrap: "wrap", borderTop: `1px solid ${LINE}`, paddingTop: 22 }}>
                {[
                  { v: <CountUp end={10} suffix="M+" />, l: "AI events monitored" },
                  { v: (<><span>{"<"}</span><CountUp end={50} suffix="ms" /></>), l: "tracing latency" },
                  { v: <CountUp end={99.99} decimals={2} suffix="%" />, l: "reliability" },
                ].map((s, i) => (
                  <div key={i} style={{ paddingRight: 28, marginRight: 28, borderRight: i < 2 ? `1px solid ${LINE}` : "none" }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: TEXT }}>{s.v}</div>
                    <div style={{ fontSize: 12.5, color: MUT2, marginTop: 3 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — the live graph */}
            <div style={{ position: "relative" }}>
              <div ref={graphWrapRef} style={{ transition: "transform .25s ease-out", position: "relative" }}>
                <FlowGraph reduced={reduced} />
                <LiveActivity reduced={reduced} />
              </div>
            </div>
          </div>
        </div>
        <style>{`@media (min-width: 1000px){ .ft-hero-grid{ grid-template-columns: 1.05fr 1fr !important; } }`}</style>
      </header>

      {/* ── Platform: three pillars ───────────────────────────────────────── */}
      <Section id="platform">
        <SectionGlow color={BLUE} top="4%" opacity={0.08} />
        <Reveal>
          <Eyebrow>platform</Eyebrow>
          <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 16px", maxWidth: 760 }}>
            One control plane, three pillars
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: MUT, maxWidth: 680, margin: "0 0 48px" }}>
            Parkar GovernAI unifies the gateway every model call flows through, the system of record for all your AI, and the evals that gate every release.
          </p>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
          {[
            { Icon: Webhook, t: "AI Gateway", d: "A single governed endpoint all LLM and agent traffic routes through.", b: ["Policy enforcement on every request", "Inline guardrails: PII, injection, output validation", "Model allow-listing, budgets and rate limits"] },
            { Icon: ShieldCheck, t: "Governance", d: "The system of record for every AI system, risk and control.", b: ["Model inventory and agent registry", "Compliance mapping across 6+ frameworks", "Risk register, incidents, immutable audit trail"] },
            { Icon: Gauge, t: "LLM Evals", d: "Automated quality and safety evaluation, wired into releases.", b: ["Correctness, faithfulness, hallucination scoring", "Bias and fairness scans", "Release gating with results filed as evidence"] },
          ].map((p, i) => (
            <Reveal key={p.t} delay={i * 60}>
              <GlassCard style={{ padding: 26, height: "100%" }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(120,180,255,0.10)", border: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <p.Icon size={19} color={CYAN} strokeWidth={2} />
                </div>
                <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{p.t}</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: MUT, marginBottom: 14 }}>{p.d}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {p.b.map((x) => (
                    <div key={x} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: CYAN, marginTop: 7, flexShrink: 0, boxShadow: `0 0 7px ${CYAN}` }} />
                      <span style={{ fontSize: 13.5, color: MUT }}>{x}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── See the entire AI system ──────────────────────────────────────── */}
      <Section id="graph">
        <SectionGlow color={BLUE} top="0%" opacity={0.09} />
        <Reveal>
          <Eyebrow>system view</Eyebrow>
          <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 16px", maxWidth: 760 }}>
            See the entire AI system at once
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: MUT, maxWidth: 660, margin: "0 0 48px" }}>
            FlowTrace renders your agents, models, memory and tools as one living graph — so the path a decision took is never a mystery.
          </p>
        </Reveal>

        {/* Wide constellation banner */}
        <Reveal delay={80}>
          <SystemBanner reduced={reduced} />
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, marginTop: 28 }}>
          {systemCards.map((c, i) => (
            <Reveal key={c.t} delay={i * 60}>
              <GlassCard style={{ padding: 24, height: "100%" }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(120,180,255,0.10)", border: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <c.Icon size={19} color={CYAN} strokeWidth={2} />
                </div>
                <div style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 600, marginBottom: 8 }}>{c.t}</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: MUT }}>{c.d}</div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── Follow every decision (timeline) ──────────────────────────────── */}
      <Section id="decisions" style={{ background: BG2 }}>
        <SectionGlow color={VIOLET} top="20%" left="80%" opacity={0.08} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 48 }} className="ft-tl-grid">
          <div>
            <Reveal>
              <Eyebrow dot={VIOLET}>decision trace</Eyebrow>
              <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 16px" }}>
                Follow every AI decision, step by step
              </h2>
              <p style={{ fontSize: 17, lineHeight: 1.6, color: MUT, marginBottom: 24 }}>
                Replay any request as a typed sequence — from the moment it arrives to the response that ships. Expand any step to see the model, tokens, latency and policy verdict behind it.
              </p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: MONO, fontSize: 12, color: MUT, border: `1px solid ${LINE}`, borderRadius: 999, padding: "7px 14px", background: PANEL }}>
                <span className={reduced ? "" : "ft-blink"} style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN }} /> trace · req_7af3 · 8 steps · 93ms total
              </div>
            </Reveal>
          </div>

          <div style={{ position: "relative" }}>
            {/* spine */}
            <div aria-hidden style={{ position: "absolute", left: 31, top: 4, bottom: 4, width: 2, background: `linear-gradient(${CYAN}, ${VIOLET}, ${GREEN})`, opacity: 0.4, borderRadius: 2, overflow: "hidden" }}>
              {!reduced && <div className="ft-spine-packet" style={{ position: "absolute", left: -2, width: 6, height: 6, borderRadius: "50%", background: "#fff", boxShadow: `0 0 12px ${CYAN}`, animation: "ftSpinePacket 4.5s linear infinite" }} />}
            </div>
            {TIMELINE.map((item, i) => (
              <Reveal key={item.step} delay={i * 40}>
                <TimelineRow item={item} i={i} open={openStep === i} onToggle={() => setOpenStep(openStep === i ? -1 : i)} reduced={reduced} />
              </Reveal>
            ))}
          </div>
        </div>
        <style>{`@media (min-width: 920px){ .ft-tl-grid{ grid-template-columns: 0.85fr 1fr !important; align-items: start; } .ft-tl-grid > div:first-child{ position: sticky; top: 110px; } }`}</style>
      </Section>

      {/* ── Analytics dashboard ───────────────────────────────────────────── */}
      <Section id="analytics">
        <SectionGlow color={CYAN} top="6%" opacity={0.08} />
        <Reveal>
          <Eyebrow>analytics</Eyebrow>
          <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 16px" }}>
            AI agent analytics, live
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: MUT, maxWidth: 640, margin: "0 0 44px" }}>
            Success, latency, spend and risk for every agent — updating as traffic flows through the graph.
          </p>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 }}>
          {analytics.map((m, i) => {
            const spark = m.label === "Memory Accuracy" && !reduced ? [...m.spark.slice(0, -1), Math.min(99.5, m.spark[m.spark.length - 1] + ((tick % 3) - 1) * 0.3)] : m.spark;
            const down = m.delta.startsWith("-");
            const goodDown = m.label === "Response Latency" || m.label === "Model Cost" || m.label === "Risk Events";
            const deltaColor = (down && goodDown) || (!down && !goodDown) ? GREEN : down ? RED : GREEN;
            return (
              <Reveal key={m.label} delay={i * 50}>
                <GlassCard style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <m.Icon size={15} color={m.tone} strokeWidth={2} />
                      <span style={{ fontSize: 12.5, color: MUT }}>{m.label}</span>
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: deltaColor, background: deltaColor + "18", borderRadius: 999, padding: "2px 8px" }}>{m.delta}</span>
                  </div>
                  <div style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 10 }}>
                    <CountUp end={m.end} decimals={m.dec} prefix={m.prefix || ""} suffix={m.suffix || ""} />
                  </div>
                  <Sparkline data={spark} color={m.tone} />
                </GlassCard>
              </Reveal>
            );
          })}
          {/* one wide summary tile */}
          <Reveal delay={analytics.length * 50}>
            <GlassCard style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "center", gridColumn: "span 1" }}>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: MUT2, marginBottom: 10 }}>System health</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className={reduced ? "" : "ft-blink"} style={{ width: 9, height: 9, borderRadius: "50%", background: GREEN, boxShadow: `0 0 12px ${GREEN}` }} />
                <span style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 700 }}>All systems nominal</span>
              </div>
              <div style={{ fontSize: 13, color: MUT, marginTop: 8 }}>14 agents · 3 models · 0 incidents</div>
            </GlassCard>
          </Reveal>
        </div>
      </Section>

      {/* ── Intelligence layer stack ──────────────────────────────────────── */}
      <Section id="layer" style={{ background: BG2 }}>
        <SectionGlow color={CYAN} top="50%" opacity={0.09} size={720} />
        <Reveal>
          <div style={{ textAlign: "center", maxWidth: 700, margin: "0 auto 52px" }}>
            <Eyebrow>intelligence layer</Eyebrow>
            <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 16px" }}>
              The orchestration layer for your AI stack
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: MUT, margin: 0 }}>
              Parkar GovernAI sits between your agents and your models — the one plane every decision passes through, sees and is governed by.
            </p>
          </div>
        </Reveal>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
          {stack.map((s, i) => (
            <React.Fragment key={s.t}>
              <Reveal delay={i * 70}>
                <div
                  className={s.glow ? "" : "ft-card"}
                  style={{
                    position: "relative",
                    borderRadius: 16,
                    padding: s.glow ? "2px" : 0,
                    background: s.glow ? GRAD : "transparent",
                    boxShadow: s.glow ? `0 24px 70px -28px ${CYAN}77` : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      padding: "20px 24px",
                      borderRadius: 14,
                      background: s.glow ? CHIP : PANEL,
                      border: s.glow ? "none" : `1px solid ${LINE}`,
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {s.glow && <Sparkles size={16} color={CYAN} />}
                        <span style={{ fontFamily: DISPLAY, fontSize: s.glow ? 18 : 16, fontWeight: s.glow ? 700 : 600, color: s.glow ? TEXT : "rgba(233,238,250,0.9)" }}>{s.t}</span>
                        {s.glow && <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#06121f", background: CYAN, borderRadius: 999, padding: "2px 8px" }}>core</span>}
                      </div>
                      <div style={{ fontSize: 13.5, color: MUT, marginTop: 5, maxWidth: 460 }}>{s.d}</div>
                    </div>
                    <Boxes size={20} color={s.glow ? CYAN : MUT2} style={{ flexShrink: 0 }} />
                  </div>
                </div>
              </Reveal>
              {i < stack.length - 1 && (
                <div aria-hidden style={{ display: "flex", justifyContent: "center" }}>
                  <ChevronDown size={18} color={MUT2} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </Section>

      {/* ── Enterprise control ────────────────────────────────────────────── */}
      <Section id="control">
        <SectionGlow color={AMBER} top="8%" left="20%" opacity={0.06} />
        <Reveal>
          <Eyebrow dot={AMBER}>enterprise control</Eyebrow>
          <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 16px" }}>
            Control, not just observability
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: MUT, maxWidth: 660, margin: "0 0 44px" }}>
            Seeing what an agent did is the start. Parkar GovernAI also decides what it's allowed to do — and proves it to your auditors.
          </p>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 18 }}>
          {controlCards.map((c, i) => (
            <Reveal key={c.t} delay={i * 60}>
              <GlassCard style={{ padding: 26, height: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(120,180,255,0.10)", border: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <c.Icon size={18} color={CYAN} strokeWidth={2} />
                  </span>
                  <span style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 600 }}>{c.t}</span>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: MUT }}>{c.d}</div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── Integrations marquee ──────────────────────────────────────────── */}
      <Section style={{ background: BG2, paddingTop: "clamp(56px,7vw,88px)", paddingBottom: "clamp(56px,7vw,88px)" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <Eyebrow>ecosystem</Eyebrow>
            <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(24px, 3.4vw, 38px)", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
              Works across your entire AI ecosystem
            </h2>
          </div>
        </Reveal>
        <MarqueeRow items={integ1} reduced={reduced} dur={34} reverse={false} />
        <div style={{ height: 14 }} />
        <MarqueeRow items={integ2} reduced={reduced} dur={40} reverse={true} />
      </Section>

      {/* ── Compliance ────────────────────────────────────────────────────── */}
      <Section id="compliance">
        <SectionGlow color={GREEN} top="6%" opacity={0.07} />
        <Reveal>
          <Eyebrow dot={GREEN}>compliance</Eyebrow>
          <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 16px" }}>
            Map once, comply across frameworks
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: MUT, maxWidth: 700, margin: "0 0 44px" }}>
            Controls are mapped across frameworks with cross-framework synergies — one implemented control satisfies every framework that references it.
          </p>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {[
            { f: "EU AI Act", d: "Risk classification, FRIA, post-market monitoring" },
            { f: "NIST AI RMF", d: "Govern, map, measure, manage functions" },
            { f: "ISO 42001", d: "AI management system clauses and annexes" },
            { f: "ISO 27001", d: "Information security controls" },
            { f: "SOC 2", d: "Trust service criteria evidence" },
            { f: "GDPR", d: "Data protection and PII safeguards" },
          ].map((t, i) => (
            <Reveal key={t.f} delay={i * 50}>
              <GlassCard style={{ padding: 22, height: "100%" }}>
                <div style={{ fontFamily: MONO, fontSize: 12.5, color: CYAN, marginBottom: 8 }}>{t.f}</div>
                <div style={{ fontSize: 13.5, color: MUT, lineHeight: 1.55 }}>{t.d}</div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── Security & deployment ──────────────────────────────────────────── */}
      <Section id="security" style={{ background: BG2 }}>
        <SectionGlow color={VIOLET} top="14%" left="78%" opacity={0.07} />
        <Reveal>
          <Eyebrow dot={VIOLET}>security &amp; deployment</Eyebrow>
          <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 16px" }}>
            Built to pass your security review
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: MUT, maxWidth: 680, margin: "0 0 44px" }}>
            Parkar GovernAI deploys in your own environment. Prompts, responses, keys and audit logs never leave your perimeter.
          </p>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 18 }}>
          {[
            { Icon: Lock, t: "Self-hosted / VPC / your cloud", d: "Containers in your infrastructure — Docker Compose or Kubernetes. Data residency by construction." },
            { Icon: ShieldCheck, t: "SSO, RBAC, encrypted secrets", d: "Microsoft Entra ID single sign-on, role-based access (Admin / Reviewer / Editor / Auditor), AES-256 encryption for provider keys at rest." },
            { Icon: FileCheck2, t: "Complete audit logging", d: "Every model call, tool call, guardrail event and config change is logged and exportable to your SIEM." },
          ].map((r, i) => (
            <Reveal key={r.t} delay={i * 60}>
              <GlassCard style={{ padding: 24, height: "100%" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(120,180,255,0.10)", border: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <r.Icon size={18} color={CYAN} strokeWidth={2} />
                </div>
                <div style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 600, marginBottom: 7 }}>{r.t}</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: MUT }}>{r.d}</div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <Section id="faq">
        <SectionGlow color={BLUE} top="4%" opacity={0.06} />
        <Reveal>
          <Eyebrow>faq</Eyebrow>
          <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(26px, 3.6vw, 40px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 36px" }}>
            Common questions
          </h2>
        </Reveal>
        <div style={{ maxWidth: 840 }}>
          {[
            { q: "How is this different from an observability tool?", a: "Observability tools show you what happened. Parkar GovernAI also controls it — policy is enforced on every call before the model is reached — and proves it, mapping every event to compliance controls and exportable audit evidence." },
            { q: "Where does my data go?", a: "Parkar GovernAI deploys self-hosted in your VPC or cloud account. Prompts, responses and logs stay inside your environment; nothing is required to leave your perimeter." },
            { q: "Which frameworks are supported?", a: "Control mapping ships for EU AI Act, NIST AI RMF, ISO 42001, ISO 27001, SOC 2 and GDPR, with cross-framework synergies so one implemented control satisfies every framework that references it." },
            { q: "Can I self-host?", a: "Yes — the platform runs as containers (Docker Compose or Kubernetes) in your own infrastructure, with SSO, RBAC and encrypted secrets at rest." },
            { q: "Does the gateway add latency to model calls?", a: "Policy checks and guardrails run in-line in milliseconds, and response caching can make repeated calls faster than going direct. Heavy analysis runs out of band." },
            { q: "Which agent frameworks can I onboard?", a: "Any framework that targets an OpenAI-compatible endpoint or MCP — LangChain, LangGraph, CrewAI, AutoGen, Google ADK, OpenAI Agents SDK, LlamaIndex and more. Point the agent's base URL at the gateway and it's governed automatically." },
          ].map((f) => (
            <Reveal key={f.q}>
              <details style={{ borderBottom: `1px solid ${LINE}` }}>
                <summary style={{ cursor: "pointer", listStyle: "none", padding: "20px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, fontFamily: DISPLAY, fontSize: 16.5, fontWeight: 600, color: TEXT }}>
                  {f.q}
                  <ChevronDown size={18} color={MUT} style={{ flexShrink: 0 }} />
                </summary>
                <p style={{ fontSize: 15, color: MUT, lineHeight: 1.65, margin: "0 0 20px", maxWidth: 760 }}>{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section id="start" style={{ position: "relative", padding: "clamp(80px,10vw,128px) 24px", textAlign: "center", overflow: "hidden", background: `radial-gradient(70% 120% at 50% 0%, ${BLUE}24, transparent 60%), ${BG}` }}>
        <SectionGlow color={CYAN} top="0%" opacity={0.14} size={760} />
        <div style={{ maxWidth: 760, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <Reveal>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: MONO, fontSize: 11.5, letterSpacing: "0.16em", textTransform: "uppercase", color: MUT, border: `1px solid ${LINE}`, borderRadius: 999, padding: "8px 16px", marginBottom: 28, background: PANEL }}>
              <Sparkles size={13} color={CYAN} /> the operating system for AI agents
            </div>
            <h2 style={{ fontFamily: DISPLAY, fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.06, margin: "0 0 20px" }}>
              Put every AI decision <span className="ft-grad-text">on the graph</span>
            </h2>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: MUT, margin: "0 0 36px" }}>
              Start tracing in minutes. See, understand and control every agent, prompt, model and tool — from one live command center.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <MagButton primary href="/login" reduced={reduced}>
                Start monitoring <ArrowRight size={17} />
              </MagButton>
              <MagButton href="#graph" reduced={reduced}>
                Explore FlowTrace
              </MagButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${LINE}`, padding: "40px 24px", background: BG }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/parkar-logo.png" alt="Parkar" style={{ height: 20, display: "block" }} />
            <span style={{ fontSize: 13, color: MUT }}>© {new Date().getFullYear()} Parkar Digital · GovernAI</span>
          </div>
          <div style={{ display: "flex", gap: 26 }}>
            {["Graph", "Decisions", "Analytics", "Control"].map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="ft-link" style={{ fontSize: 13, color: MUT2, textDecoration: "none" }}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Wide system constellation banner (distinct from hero radial graph) ───────
const SystemBanner = ({ reduced }) => {
  // Three clusters routed through a central FlowTrace bus, left→right.
  const W = 1000, H = 300;
  const bus = { x: 500, y: 150 };
  const left = [
    { x: 90, y: 70, label: "Agents", Icon: Bot, tone: CYAN },
    { x: 70, y: 150, label: "Prompts", Icon: Terminal, tone: CYAN },
    { x: 90, y: 230, label: "Memory", Icon: Brain, tone: BLUE },
  ];
  const right = [
    { x: 910, y: 70, label: "Models", Icon: Cpu, tone: "#6AA8FF" },
    { x: 930, y: 150, label: "Tools", Icon: Wrench, tone: CYAN },
    { x: 910, y: 230, label: "Output", Icon: Send, tone: GREEN },
  ];
  const all = [...left, ...right];
  const path = (n) => {
    const midx = (n.x + bus.x) / 2;
    return `M${n.x},${n.y} C ${midx},${n.y} ${midx},${bus.y} ${bus.x},${bus.y}`;
  };
  return (
    <div style={{ position: "relative", width: "100%", borderRadius: 18, border: `1px solid ${LINE}`, background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))", overflow: "hidden", padding: 4 }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", position: "relative" }} aria-label="System map: agents, prompts and memory routed through the FlowTrace bus to models, tools and output">
        {all.map((n, i) => {
          const d = path(n);
          return (
            <g key={n.label}>
              <path d={d} fill="none" stroke={n.tone} strokeOpacity={0.18} strokeWidth={1.4} />
              {!reduced && <path d={d} fill="none" stroke={n.tone} strokeOpacity={0.5} strokeWidth={1.5} strokeDasharray="4 11" className="ft-flow" style={{ animationDelay: `${i * 0.15}s` }} />}
              {!reduced && (
                <circle r={3.4} cx={0} cy={0} fill={n.tone}>
                  <animateMotion path={d} dur={`${2.8 + i * 0.3}s`} begin={`${i * 0.35}s`} repeatCount="indefinite" calcMode="linear" />
                </circle>
              )}
            </g>
          );
        })}
        {/* central bus */}
        <rect x={448} y={120} width={104} height={60} rx={14} style={{ fill: CHIP }} stroke={CYAN} strokeOpacity={0.5} />
        {!reduced && <rect x={448} y={120} width={104} height={60} rx={14} fill="none" stroke={CYAN} strokeOpacity={0.25} strokeWidth={6} className="ft-glow-pulse" style={{ transformBox: "fill-box", transformOrigin: "center" }} />}
        <text x={500} y={146} textAnchor="middle" fontFamily={DISPLAY} fontSize={15} fontWeight="700" style={{ fill: TEXT }}>FlowTrace</text>
        <text x={500} y={164} textAnchor="middle" fontFamily={MONO} fontSize={9} letterSpacing="1.5" style={{ fill: MUT }}>GRAPH BUS</text>
      </svg>
      {/* node labels overlaid as HTML for crisp text */}
      {all.map((n) => (
        <div key={n.label} style={{ position: "absolute", left: `${(n.x / W) * 100}%`, top: `${(n.y / H) * 100}%`, transform: "translate(-50%,-50%)", display: "flex", alignItems: "center", gap: 6, padding: "5px 9px", borderRadius: 9, background: CHIP, border: `1px solid ${n.tone}44`, backdropFilter: "blur(6px)", whiteSpace: "nowrap" }}>
          <n.Icon size={12} color={n.tone} strokeWidth={2.1} />
          <span style={{ fontFamily: DISPLAY, fontSize: 11, fontWeight: 600, color: TEXT }}>{n.label}</span>
        </div>
      ))}
    </div>
  );
};

// ── Marquee row ──────────────────────────────────────────────────────────────
const MarqueeRow = ({ items, reduced, dur = 34, reverse = false }) => {
  const doubled = [...items, ...items];
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        maskImage: "linear-gradient(90deg, transparent, black 9%, black 91%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, black 9%, black 91%, transparent)",
      }}
    >
      <div
        className={reverse ? "ft-marquee-rev" : "ft-marquee"}
        style={{
          display: "flex",
          gap: 14,
          width: "max-content",
          animation: reduced ? "none" : `${reverse ? "ftMarqueeRev" : "ftMarquee"} ${dur}s linear infinite`,
          flexWrap: reduced ? "wrap" : "nowrap",
          justifyContent: reduced ? "center" : "flex-start",
        }}
      >
        {doubled.map((l, i) => (
          <span
            key={`${l}-${i}`}
            className="ft-chip"
            aria-hidden={i >= items.length}
            style={{ fontFamily: MONO, fontSize: 13, color: MUT, border: `1px solid ${LINE}`, borderRadius: 999, padding: "10px 18px", whiteSpace: "nowrap", background: PANEL }}
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
};