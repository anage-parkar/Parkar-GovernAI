import { useEffect, useState } from "react";
import { Box, Stack, Typography, LinearProgress, Chip } from "@mui/material";
import { AlertTriangle, Ban, ShieldAlert } from "lucide-react";
import { StatCard } from "../../../components/Cards/StatCard";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import { palette } from "../../../themes/palette";

interface Props {
  period: string;
  reloadKey?: number;
}

const cardSx = {
  border: `1px solid ${palette.border.light}`,
  borderRadius: 2,
  p: 2,
  background: palette.background.main,
};
const titleSx = { fontSize: 13, fontWeight: 600, color: palette.text.primary, mb: 1.5 };
const emptySx = { fontSize: 12, color: palette.text.accent };

const usd = (n: number) => `$${Number(n || 0).toFixed(4)}`;

/**
 * High-value operational insights for the AI Gateway, all computed from
 * already-captured data via GET /ai-gateway/spend/insights:
 *  1. Cost per client/agent   2. Budget utilization + alerts
 *  3. 429/402 rejection counts 4. PII detections by type
 *  5. Per-agent tool latency/blocked  6. Spend anomaly flag
 */
const GatewayInsights = ({ period, reloadKey }: Props) => {
  const [data, setData] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    apiServices
      .get<Record<string, any>>(`/ai-gateway/spend/insights?period=${period}`)
      .then((r) => setData((r as any)?.data ?? null))
      .catch(() => setData(null));
  }, [period, reloadKey]);

  if (!data) return null;

  const cost: any[] = data.cost_by_client || [];
  const budgets: any[] = data.budget_utilization || [];
  const rej = data.rejections || {};
  const pii: any[] = data.pii_by_type || [];
  const tools: any[] = data.tools_by_agent || [];
  const anomaly = data.anomaly || {};
  const maxCost = Math.max(1e-9, ...cost.map((c) => Number(c.total_cost) || 0));

  return (
    <Stack gap="16px" sx={{ mt: "8px" }}>
      <Typography sx={{ fontSize: 14, fontWeight: 700, color: palette.text.primary }}>
        Operational insights
      </Typography>

      {/* 6. Anomaly banner */}
      {anomaly.detected && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            p: 1.5,
            borderRadius: 2,
            background: palette.status.warning.bg,
            border: `1px solid ${palette.status.warning.border}`,
          }}
        >
          <AlertTriangle size={16} color={palette.status.warning.text} />
          <Typography sx={{ fontSize: 12, color: palette.status.warning.text }}>
            Spend anomaly on {anomaly.day}: {usd(anomaly.cost)} — {anomaly.ratio}× the{" "}
            {usd(anomaly.baseline)} daily baseline. Check for a runaway agent.
          </Typography>
        </Box>
      )}

      {/* 3. Rejection counts */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "16px" }}>
        <StatCard
          title="Rate-limited (429)"
          value={String(rej.rate_limited_429 ?? 0)}
          Icon={Ban}
          tooltip="Requests rejected for exceeding a per-key / per-endpoint rate limit. Rising = clients hitting caps (capacity / upsell signal)."
        />
        <StatCard
          title="Budget blocks (402)"
          value={String(rej.budget_exceeded_402 ?? 0)}
          Icon={ShieldAlert}
          tooltip="Requests blocked because the org/key budget was exhausted."
        />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: "16px" }}>
        {/* 1. Cost by client/agent */}
        <Box sx={cardSx}>
          <Typography sx={titleSx}>Cost by client / agent</Typography>
          {cost.length === 0 ? (
            <Typography sx={emptySx}>No tagged traffic yet (send x-vw-metadata tags).</Typography>
          ) : (
            <Stack gap="10px">
              {cost.map((c) => (
                <Box key={c.client}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography sx={{ fontSize: 12, color: palette.text.secondary }}>{c.client}</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: palette.text.primary }}>
                      {usd(c.total_cost)} · {c.total_requests} req
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(Number(c.total_cost) / maxCost) * 100}
                    sx={{
                      "height": 6,
                      "borderRadius": 3,
                      "backgroundColor": palette.background.hover,
                      "& .MuiLinearProgress-bar": { backgroundColor: palette.brand.primary, borderRadius: 3 },
                    }}
                  />
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        {/* 2. Budget utilization */}
        <Box sx={cardSx}>
          <Typography sx={titleSx}>Budget utilization</Typography>
          {budgets.length === 0 ? (
            <Typography sx={emptySx}>No budgets set on virtual keys.</Typography>
          ) : (
            <Stack gap="10px">
              {budgets.map((b) => {
                const over = b.utilization_pct >= 100;
                const warn = b.utilization_pct >= 80;
                const color = over
                  ? palette.status.error.text
                  : warn
                    ? palette.status.warning.text
                    : palette.brand.primary;
                return (
                  <Box key={b.name}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography sx={{ fontSize: 12, color: palette.text.secondary }}>{b.name}</Typography>
                      <Stack direction="row" gap="6px" alignItems="center">
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color }}>
                          {b.utilization_pct}%
                        </Typography>
                        {(warn || over) && (
                          <Chip
                            label={over ? "OVER" : "NEAR"}
                            size="small"
                            sx={{
                              fontSize: 9,
                              height: 18,
                              backgroundColor: over ? palette.status.error.bg : palette.status.warning.bg,
                              color,
                            }}
                          />
                        )}
                      </Stack>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, b.utilization_pct)}
                      sx={{
                        "height": 6,
                        "borderRadius": 3,
                        "backgroundColor": palette.background.hover,
                        "& .MuiLinearProgress-bar": { backgroundColor: color, borderRadius: 3 },
                      }}
                    />
                    <Typography sx={{ fontSize: 10, color: palette.text.muted, mt: 0.25 }}>
                      {usd(b.current_spend_usd)} / {usd(b.max_budget_usd)}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>

        {/* 4. PII detections by type */}
        <Box sx={cardSx}>
          <Typography sx={titleSx}>PII detections by type</Typography>
          {pii.length === 0 ? (
            <Typography sx={emptySx}>No PII detected (add a PII guardrail to track this).</Typography>
          ) : (
            <Stack direction="row" gap="8px" flexWrap="wrap">
              {pii.map((p) => (
                <Chip
                  key={p.entity_type}
                  label={`${p.entity_type}: ${p.count}`}
                  size="small"
                  sx={{
                    fontSize: 11,
                    backgroundColor: palette.status.error.bg,
                    color: palette.status.error.text,
                    border: `1px solid ${palette.status.error.border}`,
                  }}
                />
              ))}
            </Stack>
          )}
        </Box>

        {/* 5. Per-agent tool latency + blocked */}
        <Box sx={cardSx}>
          <Typography sx={titleSx}>Agent tool latency &amp; blocks</Typography>
          {tools.length === 0 ? (
            <Typography sx={emptySx}>No MCP tool calls yet.</Typography>
          ) : (
            <Stack gap="8px">
              {tools.map((t) => (
                <Stack key={t.agent} direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontSize: 12, color: palette.text.secondary }}>{t.agent}</Typography>
                  <Stack direction="row" gap="6px" alignItems="center">
                    <Typography sx={{ fontSize: 11, color: palette.text.muted }}>
                      {t.calls} calls · {t.avg_latency_ms}ms
                    </Typography>
                    {t.blocked > 0 && (
                      <Chip
                        label={`${t.blocked} blocked`}
                        size="small"
                        sx={{
                          fontSize: 9,
                          height: 18,
                          backgroundColor: palette.status.error.bg,
                          color: palette.status.error.text,
                        }}
                      />
                    )}
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    </Stack>
  );
};

export default GatewayInsights;
