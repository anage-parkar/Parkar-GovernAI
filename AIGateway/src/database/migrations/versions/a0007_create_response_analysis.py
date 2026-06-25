"""create Response Analysis stores — captures + quality scores

Adds the async agent-quality pipeline (out-of-band scoring of agent responses):

  * ai_gateway_response_captures — the (sampled, opt-in) prompt+response text a
    background worker scores. Short retention; stored separately from FlowTrace
    spans (which deliberately drop response content via _safe_attrs). The prompt
    is post-guardrail (PII already masked on the input hop).

  * ai_gateway_response_scores — one row per (capture, metric): accuracy,
    faithfulness, hallucination, bias, etc. — keyed by trace_id + agent_key so a
    score links back to the exact FlowTrace request and rolls up per agent.

Revision ID: a0007
Revises: a0006
"""
from typing import Union
from alembic import op

revision: str = "a0007"
down_revision: Union[str, None] = "a0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Captured prompt/response awaiting (or done with) scoring.
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS ai_gateway_response_captures (
            id              SERIAL PRIMARY KEY,
            organization_id INTEGER NOT NULL,
            trace_id        VARCHAR(40),
            agent_key       VARCHAR(255),
            requester       VARCHAR(320),
            model           VARCHAR(255),
            prompt          TEXT,
            response        TEXT,
            total_tokens    INTEGER,
            cost_usd        DECIMAL(12, 8),
            scored          BOOLEAN NOT NULL DEFAULT FALSE,
            created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_gw_resp_cap_org "
        "ON ai_gateway_response_captures(organization_id, created_at)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_gw_resp_cap_scored "
        "ON ai_gateway_response_captures(scored)"
    )

    # Per-metric quality scores (the rollup surface).
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS ai_gateway_response_scores (
            id              SERIAL PRIMARY KEY,
            organization_id INTEGER NOT NULL,
            capture_id      INTEGER,
            trace_id        VARCHAR(40),
            agent_key       VARCHAR(255),
            requester       VARCHAR(320),
            model           VARCHAR(255),
            metric          VARCHAR(40) NOT NULL,
            score           DECIMAL(5, 4) NOT NULL,
            verdict         VARCHAR(10),
            detail          JSONB,
            scored_by       VARCHAR(20),
            created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_gw_resp_scores_agent "
        "ON ai_gateway_response_scores(organization_id, agent_key, created_at)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_gw_resp_scores_metric "
        "ON ai_gateway_response_scores(organization_id, metric, created_at)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_gw_resp_scores_metric")
    op.execute("DROP INDEX IF EXISTS idx_gw_resp_scores_agent")
    op.execute("DROP TABLE IF EXISTS ai_gateway_response_scores")
    op.execute("DROP INDEX IF EXISTS idx_gw_resp_cap_scored")
    op.execute("DROP INDEX IF EXISTS idx_gw_resp_cap_org")
    op.execute("DROP TABLE IF EXISTS ai_gateway_response_captures")
