# chrome-devtools-lite
High-level wrapper for Chrome DevTools MCP (Helium Browser)

## Tools (use these first):
- `explore_and_summarize(url)` → navigate + compact text + interactive elements
- `debug_console_network()` → console errors + failed requests only
- `performance_audit(url)` → Lighthouse + LCP/CLS + trace summary
- `interact_click_type(selector, action)` → safe click/type + immediate feedback

Only fall back to raw MCP tools (list_network_requests, take_full_snapshot, etc.) when explicitly needed for deep debugging.
Always return concise summaries. Never dump full DOM unless asked.
