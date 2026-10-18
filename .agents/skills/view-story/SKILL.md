---
name: view-story
description: Standard eyes for @reference-ui/lib. View a Book story as a user would — screenshot, CSS, click, console — via the built-in browser. Activate whenever an agent needs to see a component.
---

# Story Viewing Skill (`view-story`)

Use this skill whenever you need to SEE a component in `@reference-ui/lib`:
what it looks like, what CSS it computes, how it responds to input.
Seeing only — implementation belongs to the engineer, proof belongs
to `test-component` (`pnpm agentct`).

Eyes are the built-in browser: a real browser, no hand-rolled clients.
Never write ad-hoc Playwright scripts or one-liners — the built-in browser
covers `navigate`, `read_page`, `computer` screenshots and clicks, `javascript_tool`, and `read_console_messages`.

## 1. Ensure the Book server

The viewing loop owns its server lifecycle — never stop and ask the
developer to boot it. Single instance only.

1. Check `http://localhost:5000/`. If it responds, use it — never start
   a second instance.
2. If **not running**, start it in a managed background session:
   `pnpm dev:lib > /tmp/devlib.log 2>&1`
3. Wait for :5000 to return 200 (poll ~5s, up to ~3 min — startup pays
   two Core syncs plus Vite), then proceed.
4. If the server dies mid-loop, restart it and re-run. Report the flap;
   do not ask for permission.

## 2. View the story

Stories live at:
`http://localhost:5000/?book=<Component>&story=<Story>&theme=dark&chrome=0`

Discover components and stories by globbing
`packages/reference-lib/src/**/*.{book,fixture}.tsx` and reading the
book file — its exports are the story names.

Moves, in order: `navigate` → `read_page` (refs) →
`computer` screenshot → `javascript_tool` (computed CSS, boxes) →
`computer` click / type / key / hover → re-read the page →
`read_console_messages`.

Theme via `&theme=dark|light`. Viewport via `resize_window`. A story
that throws renders a lie — read the console section before trusting
pixels.

## 3. Report

Screenshots come back inline from the built-in browser — embed them in
chat. Note CSS and console findings. Hand off to `test-component`
for proof — seeing is not verifying.
