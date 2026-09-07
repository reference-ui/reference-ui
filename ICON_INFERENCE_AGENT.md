# Reference UI — Icon Inference Agent Guide & System Prompt

This document defines the instructions, tooling, and system prompt for an autonomous agent tasked with performing visual and semantic inference across all **3,857 icons** in `@reference-ui/icons`.

---

## 1. Context & Motivation

Reference UI packages the complete Google Material Symbols library (3,857 icons) as strongly-typed React components (`@reference-ui/icons`). To empower AI pair-programmers to select the ideal icon for any UI feature via the Reference MCP tool (`list_icons`), each icon requires:
1. **Accurate visual descriptions**: What glyph/motif is shown (shapes, objects, orientation).
2. **Contextual use cases**: Where and why a developer or designer would use it in an application.
3. **Rich keyword synonyms / aliases**: Terms a developer might query (e.g. searching "trash", "bin", "remove", "recycle" finds `DeleteIcon`).
4. **Categorization**: Primary functional group (Navigation, Media, Commerce, System, etc.).

Rather than processing 3,857 icons individually (which would consume millions of tokens and thousands of roundtrips), icons are batched into **labeled visual contact sheets of 20 icons each** via the Book harness story (`Icon.book.tsx`). An agent inspects 20 labeled icons in a single screenshot, inferring descriptions and metadata in parallel.

---

## 2. Infrastructure & Fixtures

### The Icon Contact Sheet (`Icon` -> `Batch`)
- **Location**: `packages/reference-lib/src/components/Icon/Icon.book.tsx` (Fixture: `Batch`)
- **Server**: Book dev server on `http://localhost:5000/`
- **Batch Size**: 20 icons per sheet (Total: $\lceil 3857 / 20 \rceil = 193$ batches)
- **Features**:
  - Each cell displays:
    - Global index: `#[0001]` to `#[3857]`
    - Prominent 80px icon glyph filling the tile space (`size={80}`) without background boxes
    - Exact Reference UI component export name on a single line in bold 14px typography: `IconName` (e.g. `AccountBalanceWalletIcon`)
  - Exposed window API: `window.setBatch(n)` (where `n` is `0` through `192`)

### Target Metadata Database
- **Path**: `packages/reference-mcp/src/data/icons-metadata.json`
- **Schema**:
```json
{
  "icons": [
    {
      "name": "AccountBalanceWalletIcon",
      "slug": "account-balance-wallet",
      "description": "A classic leather bifold wallet with a rounded flap and circular snap clasp. Used for digital wallets, billing methods, stored balance, and crypto accounts.",
      "keywords": ["wallet", "money", "balance", "purse", "funds", "billfold", "payment", "crypto", "cards"],
      "category": "Finance & Commerce"
    }
  ]
}
```

---

## 3. How to Run Visual Captures for a Batch

The built-in capture tool snapshots any batch index directly from the workspace root:

```bash
# Capture batch #0 (Icons #1 to #20):
pnpm capture Icon Batch -e "
  await frame.evaluate(() => window.setBatch(0));
  await wait(250);
  await capture('batch_000');
"

# Capture batch #42 (Icons #841 to #860):
pnpm capture Icon Batch -e "
  await frame.evaluate(() => window.setBatch(42));
  await wait(250);
  await capture('batch_042');
"
```

Captures are automatically padded and synced to the agent's brain directory (`.reference-ui/captures/`), rendering as high-resolution images in the agent's context.

### Programmatic Batch Runner Script
For continuous multi-batch processing, the agent can run a Node script importing the capture engine:

```javascript
// scratch/capture_range.mjs
import { captureFixture } from '../.agents/skills/tweak-component/scripts/capture.mjs';

async function captureBatches(startBatch, endBatch) {
  for (let b = startBatch; b <= endBatch; b++) {
    await captureFixture('Icon', 'Batch', {
      evalCode: `
        await frame.evaluate((idx) => window.setBatch(idx), ${b});
        await wait(250);
        await capture('batch_${String(b).padStart(3, '0')}');
      `
    });
  }
}

await captureBatches(0, 5);
```

---

## 4. Subagent System Prompt

When delegating icon inference to a subagent (e.g. via `invoke_subagent`), provide the prompt below:

````markdown
You are the **Reference UI Icon Inference Agent**.

### Your Mission
You are tasked with examining visual contact sheets of Material Symbols icons from `@reference-ui/icons` and generating rich, professional semantic metadata for each icon.

### Context & Tools
- Reference UI contains 3,857 icons.
- Book stories are running at `http://localhost:5000/`.
- The `Batch` story renders 20 icons per page (#1 to #20, #21 to #40, etc.).
- Target database: `packages/reference-mcp/src/data/icons-metadata.json`.

### Workflow per Batch
1. **Capture Contact Sheet**:
   Run:
   `pnpm capture Icon Batch -e "await frame.evaluate((b) => window.setBatch(b), <BATCH_NUM>); await wait(250); await capture('batch_<BATCH_NUM>');"`
2. **Inspect the 20 Icons**:
   Observe the screenshot image returned in chat. Note the index number, icon glyph, and component name for each of the 20 tiles.
3. **Generate Metadata**:
   For each icon, produce a JSON entry:
   - `name`: Exact component name ending in `Icon` (e.g. `SettingsIcon`).
   - `slug`: kebab-case name (e.g. `settings`).
   - `description`: 1–2 crisp sentences detailing:
     - The physical or symbolic visual appearance of the glyph.
     - The intended digital UI use cases (actions, statuses, domain concepts).
   - `keywords`: 6–12 search terms, synonyms, metaphors, and related concepts.
   - `category`: Functional category, chosen from:
     `Actions`, `Navigation`, `Communication`, `Content & Media`, `Commerce & Finance`, `Hardware & Devices`, `Editor & Formatting`, `Social & People`, `Maps & Places`, `Health & Wellness`, `Privacy & Security`, `System & Settings`, `Science & Math`.
4. **Update Metadata File**:
   Merge the 20 entries into `packages/reference-mcp/src/data/icons-metadata.json`.
   Preserve existing entries and update in place.
5. **Report & Repeat**:
   Report the batch completion summary and proceed to the next batch or await further range instructions.

### Quality Standards
- **No Hallucinations**: Base visual descriptions solely on the actual rendered glyph visible in the screenshot.
- **Concise & Direct**: Do not use fluff phrases like "This icon represents...". State the appearance and purpose directly: "A magnifying glass angled at 45 degrees. Used for search inputs, search action triggers, and record lookups."
- **Rich Aliases**: Include common colloquial synonyms (e.g. `["trash", "bin", "garbage", "rubbish", "remove", "clear", "discard"]` for `DeleteIcon`).
````

---

## 5. Verification Checklist

After any inference run:
1. Verify JSON syntax:
   `node -e "JSON.parse(fs.readFileSync('packages/reference-mcp/src/data/icons-metadata.json'))"`
2. Verify MCP unit tests:
   `pnpm --filter @reference-ui/mcp test`
3. Test search ranking:
   Query icons using `searchIcons` in `packages/reference-mcp/src/pipeline/icons-catalog.ts` to confirm new synonyms resolve expected components.
