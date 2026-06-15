"""add requester + virtual_key_id to guardrail logs (Tier-1 attribution)

Adds who-triggered-the-guardrail attribution: the requester identity (from the
x-vw-metadata `user` tag) and the virtual key used. Lets the Guardrails log answer
"which user/key keeps tripping the guardrails".

Revision ID: a0005
Revises: a0004
"""
from typing import Union

from alembic import op

revision: str = "a0005"
down_revision: Union[str, None] = "a0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE ai_gateway_guardrail_logs
            ADD COLUMN IF NOT EXISTS requester VARCHAR(320),
            ADD COLUMN IF NOT EXISTS virtual_key_id INTEGER
                REFERENCES ai_gateway_virtual_keys(id) ON DELETE SET NULL
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_gw_guardrail_log_requester "
        "ON ai_gateway_guardrail_logs(requester, created_at)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_gw_guardrail_log_requester")
    op.execute(
        """
        ALTER TABLE ai_gateway_guardrail_logs
            DROP COLUMN IF EXISTS requester,
            DROP COLUMN IF EXISTS virtual_key_id
        """
    )
