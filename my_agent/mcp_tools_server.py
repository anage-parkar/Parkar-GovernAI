"""
Minimal MCP tool server for the VerifyWise MCP Gateway demo.

Exposes two tools (web_search, calculator) over Streamable HTTP so the
VerifyWise MCP Gateway can proxy + audit the agent's tool calls.

Run:  python my_agent/mcp_tools_server.py
URL:  http://localhost:3001/mcp   (gateway reaches it via host.docker.internal:3001)
"""

import json
import urllib.parse
import urllib.request

from mcp.server.fastmcp import FastMCP

mcp = FastMCP(name="AIONIQ Tools", host="0.0.0.0", port=3001)


@mcp.tool()
def web_search(query: str) -> str:
    """Search the web for up-to-date information about a topic or question.

    Use this when the user asks about current events, facts, or anything that
    benefits from looking it up online.
    """
    try:
        url = "https://api.duckduckgo.com/?" + urllib.parse.urlencode(
            {"q": query, "format": "json", "no_html": 1, "skip_disambig": 1}
        )
        req = urllib.request.Request(url, headers={"User-Agent": "aioniq-agent/1.0"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        abstract = (data.get("AbstractText") or "").strip()
        if abstract:
            src = data.get("AbstractURL") or "DuckDuckGo"
            return f"{abstract}\n\nSource: {src}"

        topics = []
        for t in data.get("RelatedTopics", [])[:5]:
            text = t.get("Text") if isinstance(t, dict) else None
            if text:
                topics.append(f"- {text}")
        if topics:
            return f"Top results for '{query}':\n" + "\n".join(topics)

        return f"No concise answer found for '{query}'. Try rephrasing the query."
    except Exception as e:  # never fail the tool call — keep the demo robust
        return f"Web search for '{query}' is temporarily unavailable ({e})."


@mcp.tool()
def calculator(expression: str) -> str:
    """Evaluate a basic arithmetic expression (e.g. '12*7 + 3').

    Supports + - * / ** % and parentheses on numbers only.
    """
    allowed = set("0123456789.+-*/%() ")
    if not expression or any(c not in allowed for c in expression):
        return "Error: only numbers and + - * / % ( ) are allowed."
    try:
        result = eval(expression, {"__builtins__": {}}, {})  # safe: chars whitelisted above
        return f"{expression} = {result}"
    except Exception as e:
        return f"Error evaluating '{expression}': {e}"


if __name__ == "__main__":
    mcp.run(transport="streamable-http")
