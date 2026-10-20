# docs-corpus normalizer

Turns each vendored source clone into plain Markdown that Memex reads as the `docs-corpus` collection, plus the records file the memex CLI reads for it. The tool is tracked here; the clones it reads and the output it writes are gitignored vendor state.

## Run

    node .agents/docs-corpus/normalize/normalize.mjs [source...]

No source runs every adapter. Each source is built, then swapped into the normalized output in one step, so Memex sees the old folder or the new one. Runs for different sources can go in parallel; never run the same source twice at once. A run prints a row per source (pages, sections, unresolved components) and a total.

## Output (normalized corpus)

- A page doc per live page: frontmatter, then `# <title>`, the description, and the converted body.
- A section doc per headed section (see Sections), with id `<source>:<slug>#<heading>`. Sections nest under their page, so a child page never shares a file with a parent's section.
- A per-source page index, one row per page.
- A combined page index over every source in source order, rebuilt at the end of every run.
- The records file the memex CLI reads for `docs-corpus` (`docs-corpus.json`, one flat record per page and section doc, body included), rebuilt by `lib/records.mjs` at the end of every run. The manifest `.memex/collections/docs-corpus.json` lists this gitignored folder as its root, so a stale or missing file means stale or empty search results.

Page frontmatter: `id`, `source`, `title`, `description`, `url`, `section`, `order`, `type`, `concepts`, `path`, `repo`, `commit`, `license`. Section frontmatter: `id`, `source`, `title` (`Page › H2 › H3`), `heading`, `page`, `url`, `section`, `order`, `type`, `concepts`, `path`, `repo`, `commit`, `license`. `repo`, `commit` and `license` come from the page when it overrides them, and otherwise from the source's manifest row.

## Adapter contract

An adapter is one module per source. Nothing else here needs editing.

    export default {
      source: '<source>',
      async collect({ vendorDir, entry }) {
        return { root, siteUrl, pages, report }
      },
    }
    export const components = { /* optional hooks, see Component hooks */ }

- `entry`: the source's manifest row. Read it; never write that file.
- `root`: the absolute path of the clone. Demo imports and hooks may read only inside it.
- `siteUrl`: the site's origin with no trailing slash, or `''`. Root-relative links (`/docs/x`) become `siteUrl/docs/x`; without it they stay as written.
- `report`: lines printed under the source's row.
- `pages`: one per live page, in nav order. The runner numbers `order` 1..n.
  - `slug`: relative and unique within the source, with no `..`. For example `theming/tokens`.
  - `title`; `description` (`''` if none); `url`, the live URL; `section`, the nav group, for example `Get Started / Installation`.
  - `type`: one of `install`, `guide`, `concept`, `component`, `api-reference`, `theming`, `migration`, `faq`, `changelog`, `blog`, `ai`, `other`.
  - `path`: the repo-relative path of the source file. `file`: its absolute path; demo imports resolve from it.
  - `format`: `mdx` converts JSX, imports and wrappers. `md` is Markdown, used as written; directives are still applied.
  - `text`: the body only. The adapter strips the frontmatter; the runner refuses a `text` that still has one.
  - `repo`, `commit`, `license` (optional): override the manifest row for this page, for pages pinned to another commit or licence.

The run writes nothing if the contract is broken: a repeated slug, a `type` outside the list, a relative `file`, frontmatter in `text`, a missing title or url, or two outputs on one path. Paths are compared case-insensitively, since macOS merges them. The error names both owners.

## Body rules

Fenced code is never converted. Everything outside it:

- A closer may sit anywhere on a line, and text after a closer is kept. Tags nest by name: a same-name child closes at its own closer.
- `{...}` attribute values arrive as their raw source, however deep. An unbalanced expression fails the run. Quoted, double-quoted and backtick strings all work.
- A top-level `import ... from '...'` or `export` statement is dropped, multi-line ones included. Prose that starts with "import" is kept.
- `{/* ... */}` comments are dropped, multi-line ones too.
- Steps are unwrapped, so their headings stay. Tabs become a bold label per tab, then its content. Callout becomes a blockquote: `Note`, `Warning` for `warning`, `Caution` for `danger` or `error`. Card and Cards become a list of links. Details become an H3 (its summary) and its body. Faq is unwrapped. FileTree becomes a text fence. RouteSwitch becomes bold labels taken from RouteSwitchTrigger.
- `:::note`, `:::info`, `:::tip`, `:::warning`, `:::caution` and `:::danger`, with an optional `[Title]`, become labelled blockquotes, in MDX and in Markdown alike. They nest, and a fence inside is kept, quoted.
- `import X from './demo'` plus `<X />` inlines the demo's source as a fenced block. Extensions tried: `.tsx .ts .jsx .js .mjs .css`.
- A leading `# ` in the body is dropped, because the runner writes the title as the H1.
- Blank lines collapse to one, except inside fenced code.
- Anything with no mapping becomes `<!-- unresolved: Name -->`. The run counts these per source. Nothing is dropped silently.

## Component hooks

    export const components = {
      UtilityTable(props, children, ctx) {
        return '> Table: lists every utility in the Background group.'
      },
    }

- `props`: the attributes. A `{...}` value arrives as its source text; `stringList(props.groups)` reads a string array. A bare attribute is `true`.
- `children`: the element's content as Markdown, blank runs collapsed (`''` if none).
- `ctx`: `{ file, siteUrl, readImport, root, inline }`. `inline` is true when the element sits inside a sentence; its return value goes into the sentence as it is. `readImport(absPath)` returns the text of a file inside `root`, or `null`.
- Return Markdown (several lines are fine), or `null` to leave the marker with the children kept. A throw fails the run and names the component.
- Hooks run before demo imports and the built-in renderers. `components` may be a named export or a property of the default export.

## Sections

- The page splits at its H2 headings. Text before the first H2 (the intro) belongs to the page doc alone and gets no section file. A page with no H2 has no sections.
- An H2 section over 400 words splits at its H3s. The text before its first H3 stays under the H2 entry; each H3 is its own entry, titled `Page › H2 › H3`. H4 and deeper stay inside their parent.
- Heading slugs are unique per page (`-2`, `-3`, and so on). A section's `url` is its page's URL, with no anchor.
- A heading's text is plain: a link keeps its label and drops its target (via `plainHeading`). So `[Light and Dark Mode](#light-and-dark-mode)` titles its section "Light and Dark Mode", and the slug is unchanged.

## Eval

`node .agents/docs-corpus/normalize/eval/eval.mjs` runs the eval query list (39 entries over 32 search intents) against `memex search --in docs-corpus`. The default is faceted, how a writer searches: each entry's `libs` item is checked per library (`source:<s> --limit 3`), and each intent gets one per-source check on its first phrasing (one `source:<s> --limit 1` search per library it names). `--strict` runs the old check instead: each entry's `expect` regexes against the top 10 of an unfiltered search. Both print a PASS or FAIL line per entry, the misses, and the latency over every CLI call. `EVAL_TOP=10` prints a full first page; `EVAL_CLI=<path>` scores another memex binary. Regexes match hit ids; `(#|$)` accepts the named page or one of its sections.

## Concepts

The concept map pairs each concept with keywords. A concept applies when a keyword appears in the heading text (title, description, headings), or appears in the prose at least `max(3, words/300)` times. Fenced code never counts. Tune by editing keyword lists only.

## Failures and recovery

Each source is written in one swap through a staging area, which holds sources in progress and is cleared after each swap. A run that fails part-way leaves the sources it already finished in place; the rest keep their last good output. The combined index and the memex records file are rebuilt at the end of every run that completes, so the next complete run heals any gap. A crashed run can leave a stale staging folder; it is safe to delete.
