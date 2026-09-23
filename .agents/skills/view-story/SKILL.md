---
name: view-story
description: Standard eyes for @reference-ui/lib. View a Book story as a user would — screenshot, CSS, click, console — via Playwright MCP, with pnpm capture as fallback. Activate whenever an agent needs to see a component.
---

# Story Viewing Skill (`view-story`)

Use this skill whenever you need to SEE a component in `@reference-ui/lib`:
what it looks like, what CSS it computes, how it responds to input.
Seeing only — implementation belongs to engineer crews, proof belongs
to `test-component` (`pnpm agentct`).

## 1. Ensure the Book server (autonomous)

The viewing loop owns its server lifecycle — never stop and ask the
developer to boot it. Single instance only.

1. Check `http://localhost:5000/`. If it responds, use it — never start
   a second instance.
2. If **not running**, start it in a managed background session:
   `pnpm dev:lib > /tmp/devlib.log 2>&1`
3. Wait for :5000 to return 200 (poll ~5s, up to ~3 min — startup pays
   two Neo syncs plus Vite), then proceed.
4. If the server dies mid-loop, restart it and re-run. Report the flap;
   do not ask for permission.

## 2. View the story (standard: Playwright MCP)

Stories live at:
`http://localhost:5000/?book=<Component>&story=<Story>&theme=dark&chrome=0`
Discover components and stories with `pnpm capture --list` (discovery
only; viewing goes through MCP).

Moves, in order: navigate → snapshot (a11y tree + refs) → screenshot →
evaluate (computed CSS, boxes) → click/type/hover → re-snapshot →
console messages. Full crew manual:
[docs/missions/mcp-book-seeing.md](../../../docs/missions/mcp-book-seeing.md).

## 3. Fallback: pnpm capture

If MCP cannot reach the story, use the capture client against the same
server (`pnpm capture <Component> [Fixture]`, states via `--states`).
Same screenshots, narrower pipe. Report that you fell back and why.

## 4. Report

Embed screenshots in chat. Note CSS and console findings. Hand off to
`test-component` for proof — seeing is not verifying.
