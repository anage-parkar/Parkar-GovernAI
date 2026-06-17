"""Unit tests for FlowTrace — focus on the governance-critical redaction guard
(no secrets / PII / payloads ever land in span attrs) and the pure helpers.

Seeds dummy DB env before import so it runs standalone (no live DB needed —
importing the engine does not connect)."""

import os

os.environ.setdefault("DB_USER", "x")
os.environ.setdefault("DB_PASSWORD", "x")
os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_PORT", "5432")
os.environ.setdefault("DB_NAME", "x")
os.environ.setdefault("AI_GATEWAY_INTERNAL_KEY", "test-internal-key")

from services import trace_service as ts  # noqa: E402
from crud.traces import _status_from_flags, _PATH_ORDER  # noqa: E402


def test_safe_attrs_drops_forbidden_keys():
    """No raw content / PII / payloads may survive into a span."""
    dirty = {
        "content": "my SSN is 123-45-6789",
        "messages": [{"role": "user", "content": "secret"}],
        "arguments": {"api_key": "sk-secret"},
        "matched_text": "john@example.com",
        "prompt": "...",
        "response": "...",
        # allowed, summarised fields:
        "tokens": 2341,
        "cost_usd": 0.018,
        "status_code": 200,
        "server_id": 7,
        "action": "mask",
    }
    safe = ts._safe_attrs(dirty)
    for forbidden in ("content", "messages", "arguments", "matched_text", "prompt", "response"):
        assert forbidden not in safe
    assert safe["tokens"] == 2341
    assert safe["cost_usd"] == 0.018
    assert safe["status_code"] == 200
    assert safe["server_id"] == 7
    assert safe["action"] == "mask"


def test_safe_attrs_truncates_long_strings():
    safe = ts._safe_attrs({"note": "a" * 1000})
    assert len(safe["note"]) <= 160


def test_safe_attrs_caps_lists():
    safe = ts._safe_attrs({"masked": [f"e{i}" for i in range(50)]})
    assert len(safe["masked"]) <= 12


def test_status_severity_ordering():
    assert _status_from_flags(True, True, True) == "error"
    assert _status_from_flags(False, True, True) == "block"
    assert _status_from_flags(False, False, True) == "mask"
    assert _status_from_flags(False, False, False) == "ok"


def test_path_order_canonical():
    assert _PATH_ORDER == ["agent", "gateway", "guardrail", "llm", "mcp", "tool"]


def test_id_shapes():
    assert ts.new_trace_id().startswith("trc_")
    assert ts.new_span_id().startswith("spn_")


def test_read_trace_header_validation():
    class H:
        def __init__(self, v):
            self._v = v

        def get(self, _k, default=None):
            return self._v

    assert ts.read_trace_header(H("trc_abc123")) == "trc_abc123"
    assert ts.read_trace_header(H("")) is None
    assert ts.read_trace_header(H("bad id with spaces")) is None
    assert ts.read_trace_header(H("x" * 100)) is None
