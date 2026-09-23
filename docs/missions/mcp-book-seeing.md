# Seeing Book via Playwright MCP

Crew note for driving the `@reference-ui/lib` Book (component story server)
through Playwright MCP tools instead of the hand-rolled `pnpm capture` client.

## Config

Repo standard: [`.cursor/mcp.json`](../../.cursor/mcp.json) — the only MCP config
file in the repo, and the one the hosts in play read. It now carries a
`playwright` entry alongside `reference-ui`:

```json
"playwright": {
  "command": "npx",
  "args": ["-y", "@playwright/mcp@latest"]
}
```

Why that file and not a new root-level one: no verified root-level MCP filename
exists for the hosts running these crews (Muse Code reads user-level
`~/.config/muse/settings.json`, which already defines the same server), so a new
root file would risk being one nothing reads. Extending the file already in the
repo is the smallest cut that works tonight.

Inheritance: subagents arrive WITH the `browser_*` MCP tools already attached —
no per-agent setup needed. They are granted by the host's MCP config (user-level
settings on Muse hosts, `.cursor/mcp.json` on Cursor-family hosts), not by
anything in the mission prompt.

## Driving Book via MCP

Book URL shape (same as `capture.mjs` builds):

```
http://127.0.0.1:5000/?book=<Component>&story=<Fixture>&theme=dark&chrome=0
```

Discover stories with `pnpm capture --list` (read-only list, no browser needed).

Tool sequence for "see a component":

1. `browser_navigate` to the story URL. Wait for `data-book-ready="live"`.
2. `browser_snapshot` — accessibility tree with refs; find your element refs.
3. `browser_take_screenshot` — resting-state PNG (saved under `.playwright-mcp/`,
   which is gitignored scratch).
4. `browser_evaluate` on a ref — `getComputedStyle` / `getBoundingClientRect`
   replaces `capture --inspect-styles` for one-off checks.
5. `browser_click` / `browser_type` / `browser_press_key` — interact, then
   re-snapshot + re-screenshot to confirm the new state.
6. `browser_console_messages` — page errors/warnings (Book surfaces `css()` miss
   warnings here; a bare `favicon.ico` 404 is normal).

Proven 2026-09-22 against live Book: Toast/Basic — navigated, snapshotted
(`Show toast` button ref), screenshotted resting state, evaluated computed CSS
(color, background, border, radius, padding, font, outline + bounding box),
clicked the button (toast "Changes saved" appeared in re-snapshot), screenshotted
clicked state, read 8 console messages (1 favicon-404 error, 4 css() warnings).

## Server lifecycle

- Single instance only on port 5000. Check first:
  `curl -s -o /dev/null -w '%{http_code}' localhost:5000` (want `200`).
- Never start a second instance. If it is down, restart detached and wait:
  `pnpm dev:lib > /tmp/devlib.log 2>&1`, then poll until `:5000` returns 200.
- Stop only processes you started.

## Fallback

`pnpm capture` (`.agents/skills/view-story/scripts/capture.mjs`) is untouched
and remains the fallback until MCP seeing is proven on a real styling mission.
If MCP tools are ever absent, that alone means the host config regressed — say so
in the mission report and fall back to `pnpm capture`.
