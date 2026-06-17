/**
 * FlowTrace styles — ported from docs/design/flowtrace.html, scoped under
 * `.ft-root` so the dark theme doesn't leak into the rest of the (light) app.
 */
export const FLOWTRACE_CSS = `
.ft-root{
  --bg:#0A0C16; --panel:#0F1320; --panel-2:#131829; --elevated:#171D2E;
  --border:#222840; --border-soft:#1a2034;
  --text:#E7EAF4; --dim:#8B93AC; --faint:#646C88;
  --agent:#A78BFA; --gateway:#818CF8; --guardrail:#FBBF24; --llm:#22D3EE;
  --mcp:#2DD4BF; --tool:#4ADE80; --block:#FB7185; --accent:#6366F1;
  --mono:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
  --disp:"Space Grotesk",system-ui,sans-serif; --body:"Inter",system-ui,sans-serif;
  color:var(--text); font-family:var(--body);
  border-radius:14px; overflow:hidden; border:1px solid var(--border-soft);
  background:radial-gradient(1100px 520px at 78% -10%,rgba(99,102,241,.10),transparent 60%),radial-gradient(900px 460px at 12% 110%,rgba(45,212,191,.06),transparent 60%),var(--bg);
}
.ft-root *{box-sizing:border-box}
.ft-root .eyebrow{font-family:var(--mono);font-size:10px;letter-spacing:.2em;color:var(--faint);text-transform:uppercase}

.ft-root .ft-top{display:flex;align-items:center;gap:18px;padding:0 18px;height:54px;border-bottom:1px solid var(--border-soft);background:linear-gradient(180deg,rgba(255,255,255,.02),transparent)}
.ft-root .ft-brand{display:flex;align-items:center;gap:10px}
.ft-root .ft-mark{width:28px;height:28px;border-radius:9px;position:relative;flex:0 0 auto;background:conic-gradient(from 140deg,var(--gateway),var(--mcp),var(--agent),var(--gateway));display:grid;place-items:center;box-shadow:0 0 22px -6px var(--gateway)}
.ft-root .ft-mark::after{content:"";position:absolute;inset:6px;border-radius:5px;background:var(--bg)}
.ft-root .ft-mark svg{position:relative;z-index:1;width:14px;height:14px;color:var(--text)}
.ft-root .ft-brand h1{font-family:var(--disp);font-size:14px;font-weight:700;letter-spacing:.04em;margin:0;line-height:1}
.ft-root .ft-brand span{display:block;font-family:var(--mono);font-size:9px;letter-spacing:.18em;color:var(--faint);margin-top:3px;text-transform:uppercase}
.ft-root .ft-spacer{flex:1}
.ft-root .ft-live{display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:11px;letter-spacing:.14em;color:var(--tool)}
.ft-root .ft-live.off{color:var(--faint)}
.ft-root .ft-live .ping{width:8px;height:8px;border-radius:50%;background:var(--tool);animation:ftping 1.8s ease-out infinite}
.ft-root .ft-live.off .ping{background:var(--faint);animation:none}
@keyframes ftping{0%{box-shadow:0 0 0 0 rgba(74,222,128,.6)}70%{box-shadow:0 0 0 7px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}

.ft-root .ft-layout{display:grid;grid-template-columns:230px 1fr 300px;height:640px}
.ft-root aside,.ft-root .ft-center{min-height:0;min-width:0}

.ft-root .ft-rail{border-right:1px solid var(--border-soft);padding:14px 12px;display:flex;flex-direction:column;gap:10px;overflow-y:auto}
.ft-root .ft-rail-head{display:flex;align-items:baseline;justify-content:space-between;padding:0 2px 2px}
.ft-root .ft-rail-head b{font-family:var(--mono);font-size:11px;color:var(--dim);font-weight:500}
.ft-root .ft-agent{border:1px solid var(--border-soft);border-radius:12px;padding:10px 11px;background:var(--panel);cursor:pointer;transition:border-color .25s,background .25s,box-shadow .25s;position:relative;overflow:hidden}
.ft-root .ft-agent::before{content:"";position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--agent);opacity:0;transition:opacity .25s}
.ft-root .ft-agent.sel{border-color:#2c3454;background:var(--panel-2);box-shadow:0 0 24px -14px var(--agent)}
.ft-root .ft-agent.sel::before{opacity:.9}
.ft-root .ft-agent .row1{display:flex;align-items:center;gap:8px}
.ft-root .ft-agent .dot{width:7px;height:7px;border-radius:50%;background:var(--tool);flex:0 0 auto;box-shadow:0 0 8px var(--tool)}
.ft-root .ft-agent.warn .dot{background:var(--guardrail);box-shadow:0 0 8px var(--guardrail)}
.ft-root .ft-agent .name{font-family:var(--disp);font-size:12.5px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ft-root .ft-agent .model{font-family:var(--mono);font-size:10px;color:var(--llm);margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ft-root .ft-agent .meta{display:flex;gap:10px;margin-top:7px;font-family:var(--mono);font-size:10px;color:var(--faint)}
.ft-root .ft-agent .meta .v{color:var(--dim)}
.ft-root .ft-empty{font-family:var(--mono);font-size:11px;color:var(--faint);padding:14px 6px;line-height:1.6}

.ft-root .ft-center{display:flex;flex-direction:column}
.ft-root .ft-canvas{flex:1;display:flex;flex-direction:column;padding:16px 18px 4px;min-height:0;overflow:hidden}
.ft-root .ft-chead{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
.ft-root .ft-chl{display:flex;flex-direction:column;gap:6px}
.ft-root .ft-traceline{display:flex;align-items:center;gap:11px}
.ft-root .ft-tid{font-family:var(--mono);font-size:14px;color:var(--text)}
.ft-root .ft-badge{font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:4px 8px;border-radius:6px;border:1px solid}
.ft-root .ft-badge.idle{color:var(--faint);border-color:var(--border);background:var(--panel-2)}
.ft-root .ft-badge.running{color:#9fb4ff;border-color:#33406a;background:rgba(129,140,248,.12)}
.ft-root .ft-badge.ok{color:var(--tool);border-color:#2c5a3e;background:rgba(74,222,128,.10)}
.ft-root .ft-badge.mask{color:var(--guardrail);border-color:#5a4a1d;background:rgba(251,191,36,.10)}
.ft-root .ft-badge.block,.ft-root .ft-badge.error{color:var(--block);border-color:#5e2c38;background:rgba(251,113,133,.12)}
.ft-root .ft-stats{display:flex;gap:16px}
.ft-root .ft-stat{display:flex;flex-direction:column;gap:3px;text-align:right}
.ft-root .ft-stat .n{font-family:var(--mono);font-size:15px;color:var(--text)}
.ft-root .ft-stat .l{font-family:var(--mono);font-size:9px;letter-spacing:.14em;color:var(--faint);text-transform:uppercase}

.ft-root .graph-wrap{position:relative;width:100%;max-width:1000px;margin:10px auto 0}
.ft-root .graph-inner{position:absolute;top:0;left:0;width:1000px;height:560px;transform-origin:top left}
.ft-root #ft-gsvg{position:absolute;inset:0;width:1000px;height:560px;overflow:visible;z-index:1}
.ft-root .edge{fill:none;stroke:var(--border);stroke-width:1.4;stroke-dasharray:4 9;opacity:.7;animation:ftdash 1.7s linear infinite}
@keyframes ftdash{to{stroke-dashoffset:-13}}
.ft-root .edge.lit{stroke-width:2.1;opacity:1}
.ft-root .pkt{filter:drop-shadow(0 0 6px currentColor)}
.ft-root .gr-ring{fill:rgba(129,140,248,.035);stroke:var(--gateway);stroke-width:1.5;stroke-dasharray:5 8;opacity:.45;transform-box:fill-box;transform-origin:center;animation:ftspin 16s linear infinite}
@keyframes ftspin{to{transform:rotate(360deg)}}
.ft-root .gr-ring.active{opacity:.85}
.ft-root .gr-ring.mask{stroke:var(--guardrail);fill:rgba(251,191,36,.05);opacity:.9}
.ft-root .gr-ring.block{stroke:var(--block);fill:rgba(251,113,133,.06);opacity:1}

.ft-root .gnode{position:absolute;transform:translate(-50%,-50%);z-index:3;text-align:center}
.ft-root .gnode .chip{border:1px solid var(--border);background:var(--panel-2);border-radius:13px;padding:8px 11px;display:flex;flex-direction:column;align-items:center;gap:5px;transition:border-color .3s,box-shadow .3s,transform .3s}
.ft-root .gnode .gi{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;color:var(--c);background:color-mix(in srgb,var(--c) 14%,transparent);transition:box-shadow .3s}
.ft-root .gnode .gi svg{width:16px;height:16px}
.ft-root .gnode .glabel{font-family:var(--disp);font-size:11.5px;font-weight:600;color:var(--text);white-space:nowrap}
.ft-root .gnode .gsub{font-family:var(--mono);font-size:8px;color:var(--faint);white-space:nowrap}
.ft-root .gnode .gmet{font-family:var(--mono);font-size:8.5px;color:var(--dim);min-height:10px;white-space:nowrap;transition:color .3s}
.ft-root .gnode.lit .chip{border-color:var(--c);box-shadow:0 0 0 1px var(--c),0 9px 32px -14px var(--c);transform:translateY(-1px)}
.ft-root .gnode.lit .gi{box-shadow:0 0 16px -2px var(--c)}
.ft-root .gnode.lit .gmet{color:var(--text)}
.ft-root .gnode.core .chip{width:74px;height:74px;border-radius:50%;justify-content:center;padding:0;gap:0}
.ft-root .gnode.core .gi{width:34px;height:34px;background:transparent;box-shadow:none}
.ft-root .gnode.core .gi svg{width:20px;height:20px}
.ft-root .gnode.core .cap{position:absolute;top:80px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:2px}
.ft-root .gnode.core .glabel{margin-top:0}
.ft-root .gnode.core.lit .chip{box-shadow:0 0 0 1px var(--c),0 0 38px -8px var(--c)}
.ft-root .gnode.tool .chip{flex-direction:row;gap:7px;padding:5px 10px;border-radius:22px}
.ft-root .gnode.tool .gi{width:15px;height:15px;border-radius:5px}
.ft-root .gnode.tool .gi svg{width:10px;height:10px}
.ft-root .gnode.tool .glabel{font-size:10px;font-weight:500}
.ft-root .gnode.tool .gmet{display:none}
.ft-root .gnode.tool .gsub{display:none}

.ft-root .gr-pill{position:absolute;z-index:4;transform:translate(-50%,-50%);display:flex;align-items:center;gap:6px;background:var(--panel);border:1px solid var(--border);border-radius:20px;padding:4px 10px;white-space:nowrap}
.ft-root .gr-pill .grdot{width:6px;height:6px;border-radius:50%;background:var(--gateway);box-shadow:0 0 7px var(--gateway)}
.ft-root .gr-pill.mask .grdot{background:var(--guardrail);box-shadow:0 0 7px var(--guardrail)}
.ft-root .gr-pill.block .grdot{background:var(--block);box-shadow:0 0 7px var(--block)}
.ft-root .gr-pill b{font-family:var(--mono);font-size:9px;letter-spacing:.16em;color:var(--dim)}
.ft-root .gr-pill .grtxt{font-family:var(--mono);font-size:9px;color:var(--faint)}
.ft-root .gr-pill.mask .grtxt{color:var(--guardrail)} .ft-root .gr-pill.block .grtxt{color:var(--block)} .ft-root .gr-pill.pass .grtxt{color:var(--mcp)}

.ft-root .legend{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;padding:8px 8px 4px;font-family:var(--mono);font-size:10px;color:var(--dim)}
.ft-root .legend span{display:flex;align-items:center;gap:7px}
.ft-root .legend i{width:9px;height:9px;border-radius:3px;display:inline-block}
.ft-root .legend .ring-key i{border-radius:50%;background:transparent;border:1.5px dashed var(--gateway)}

.ft-root .ft-stream{flex:0 0 168px;border-top:1px solid var(--border-soft);display:flex;flex-direction:column;min-height:0}
.ft-root .ft-stream-head{display:flex;align-items:center;gap:12px;padding:9px 18px 7px}
.ft-root .ft-log{flex:1;overflow-y:auto;padding:0 18px 10px;font-family:var(--mono);font-size:11px}
.ft-root .log-row{display:flex;align-items:center;gap:12px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.03);animation:ftrow .3s ease}
@keyframes ftrow{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}
.ft-root .log-row .t{color:#6b7390;flex:0 0 auto}
.ft-root .log-row .tag{flex:0 0 58px;font-weight:700;font-size:10px}
.ft-root .log-row .msg{color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ft-root .log-row .msg b{color:var(--text);font-weight:500}
.ft-root .tag.agent{color:var(--agent)} .ft-root .tag.gateway{color:var(--gateway)} .ft-root .tag.guardrail{color:var(--guardrail)}
.ft-root .tag.llm{color:var(--llm)} .ft-root .tag.mcp{color:var(--mcp)} .ft-root .tag.tool{color:var(--tool)}
.ft-root .tag.block{color:var(--block)} .ft-root .tag.error{color:var(--block)} .ft-root .tag.sys{color:var(--faint)}

.ft-root .ft-panel{border-left:1px solid var(--border-soft);padding:14px;display:flex;flex-direction:column;gap:13px;overflow-y:auto}
.ft-root .insight{border:1px solid var(--border);border-radius:13px;padding:12px;position:relative;background:linear-gradient(180deg,rgba(99,102,241,.10),rgba(99,102,241,.02))}
.ft-root .insight .ih{display:flex;align-items:center;gap:8px;margin-bottom:9px}
.ft-root .insight .ih .ai{width:22px;height:22px;border-radius:7px;display:grid;place-items:center;color:#fff;background:linear-gradient(140deg,var(--accent),var(--mcp));box-shadow:0 0 14px -4px var(--accent)}
.ft-root .insight .ih .ai svg{width:13px;height:13px}
.ft-root .insight .ih b{font-family:var(--disp);font-size:12.5px;font-weight:600}
.ft-root .insight .ih .live-tag{margin-left:auto;font-family:var(--mono);font-size:9px;letter-spacing:.12em;color:var(--mcp)}
.ft-root .insight p{margin:0;font-family:var(--body);font-size:12.5px;line-height:1.55;color:#c3cae0}
.ft-root .anomaly{margin-top:10px;border-radius:9px;border:1px solid #5a4a1d;background:rgba(251,191,36,.08);padding:9px 10px;display:flex;gap:9px;align-items:flex-start}
.ft-root .anomaly svg{width:14px;height:14px;color:var(--guardrail);flex:0 0 auto;margin-top:1px}
.ft-root .anomaly span{font-family:var(--mono);font-size:11px;line-height:1.5;color:#e4c98a}
.ft-root .section-l{font-family:var(--mono);font-size:10px;letter-spacing:.18em;color:var(--faint);text-transform:uppercase;margin:2px 2px 0}
.ft-root .waterfall{display:flex;flex-direction:column;gap:7px;margin-top:10px}
.ft-root .wf{display:grid;grid-template-columns:62px 1fr 50px;align-items:center;gap:9px}
.ft-root .wf .wl{font-family:var(--mono);font-size:10px;color:var(--dim)}
.ft-root .wf .track{height:7px;border-radius:4px;background:rgba(255,255,255,.05);overflow:hidden}
.ft-root .wf .fill{height:100%;border-radius:4px;background:var(--c);width:0;transition:width .5s ease;box-shadow:0 0 10px -2px var(--c)}
.ft-root .wf .wv{font-family:var(--mono);font-size:10px;color:var(--text);text-align:right}
.ft-root .totals{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
.ft-root .tot{border:1px solid var(--border-soft);border-radius:11px;padding:10px 9px;background:var(--panel)}
.ft-root .tot .tn{font-family:var(--mono);font-size:14px;color:var(--text)}
.ft-root .tot .tl{font-family:var(--mono);font-size:9px;letter-spacing:.1em;color:var(--faint);text-transform:uppercase;margin-top:5px}

.ft-root ::-webkit-scrollbar{width:9px;height:9px}
.ft-root ::-webkit-scrollbar-thumb{background:#222a42;border-radius:6px;border:2px solid var(--bg)}

@media (max-width:1080px){ .ft-root .ft-layout{grid-template-columns:1fr;height:auto} .ft-root .ft-rail,.ft-root .ft-panel{border:0;border-bottom:1px solid var(--border-soft)} }
@media (prefers-reduced-motion: reduce){ .ft-root *{animation:none !important;transition:none !important} }
`;
