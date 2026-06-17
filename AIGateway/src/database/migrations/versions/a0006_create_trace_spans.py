"""create FlowTrace span store + trace_id cross-references

Adds request tracing ("FlowTrace"): one row per hop/span, correlated by
trace_id, so the LLM call, guardrail checks and MCP tool calls of a single
logical agent request can be reconstructed and animated as one graph.

A nullable trace_id is also added to the existing spend / mcp-audit /
guardrail log tables so a span can be cross-referenced back to its full log row
without duplicating the heavy payload columns into the span store.

Span attrs hold ONLY masked/summarised values — never raw PII or full payloads.

Revision ID: a0006
Revises: a0005
"""
from typing import Union

from alembic import op

revision: str = "a0006"
down_revision: Union[str, None] = "a0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS ai_gateway_trace_spans (
            id              SERIAL PRIMARY KEY,
            trace_id        VARCHAR(40) NOT NULL,
            span_id         VARCHAR(40) NOT NULL,
            parent_span_id  VARCHAR(40),
            organization_id INTEGER NOT NULL,
            agent_key       VARCHAR(320),
            type            VARCHAR(20) NOT NULL,      -- agent|gateway|guardrail|llm|mcp|tool
            name            VARCHAR(255) NOT NULL,
            status          VARCHAR(20) NOT NULL DEFAULT 'ok',  -- ok|mask|block|error|running
            ts_start        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            ts_end          TIMESTAMP WITH TIME ZONE,
            latency_ms      INTEGER,
            attrs           JSONB NOT NULL DEFAULT '{}',
            created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
        """
    )
    # "recent traces for an agent" + per-trace reconstruction
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_gw_trace_spans_agent "
        "ON ai_gateway_trace_spans(organization_id, agent_key, ts_start DESC)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_gw_trace_spans_trace "
        "ON ai_gateway_trace_spans(trace_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_gw_trace_spans_recent "
        "ON ai_gateway_trace_spans(organization_id, ts_start DESC)"
    )

    # Cross-reference trace_id onto the existing log tables (best-effort link).
    op.execute("ALTER TABLE ai_gateway_spend_logs ADD COLUMN IF NOT EXISTS trace_id VARCHAR(40)")
    op.execute("ALTER TABLE ai_gateway_mcp_audit_logs ADD COLUMN IF NOT EXISTS trace_id VARCHAR(40)")
    op.execute("ALTER TABLE ai_gateway_guardrail_logs ADD COLUMN IF NOT EXISTS trace_id VARCHAR(40)")


def downgrade() -> None:
    op.execute("ALTER TABLE ai_gateway_guardrail_logs DROP COLUMN IF EXISTS trace_id")
    op.execute("ALTER TABLE ai_gateway_mcp_audit_logs DROP COLUMN IF EXISTS trace_id")
    op.execute("ALTER TABLE ai_gateway_spend_logs DROP COLUMN IF EXISTS trace_id")
    op.execute("DROP INDEX IF EXISTS idx_gw_trace_spans_recent")
    op.execute("DROP INDEX IF EXISTS idx_gw_trace_spans_trace")
    op.execute("DROP INDEX IF EXISTS idx_gw_trace_spans_agent")
    op.execute("DROP TABLE IF EXISTS ai_gateway_trace_spans")
