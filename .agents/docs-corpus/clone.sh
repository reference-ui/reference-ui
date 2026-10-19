#!/usr/bin/env bash
# Sparse-clones other design systems' docs into vendor/docs for the docs-corpus reference.
# Takes optional source names (default: every source) and emits the clones, llms files, and manifest.json.
set -euo pipefail

# usage: bash .agents/docs-corpus/clone.sh [name ...]
#   no names: re-clone every source (the whole corpus)
#   names:    re-clone only those sources; trim, llms and manifest entries cover only them
# The script is tracked tooling; its clones and manifest.json are data in <repo>/vendor/docs (gitignored).
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
ROOT="$REPO/vendor/docs"
MANIFEST="$ROOT/manifest.json"
mkdir -p "$ROOT"

# One row per source:
#   name | GitHub owner/repo | docs patterns | extra patterns | llms base URL | llms files
# Patterns use sparse-checkout --no-cone syntax: "/dir/" takes a whole folder, "/file" one file,
# "*" and "**" are globs. Docs = every docs section, including blog/changelog inside the docs app.
# Extras = demo/example source the docs embed, plus nav/sidebar config. Shell app code is not taken.
SOURCES=(
  "panda|chakra-ui/panda|/website/content/|/website/source.config.ts /website/src/docs.config.tsx|https://panda-css.com|llms.txt llms-full.txt"
  "chakra|chakra-ui/chakra-ui|/apps/www/content/ /packages/codemod/docs/|/apps/www/docs.config.ts /apps/www/velite.config.ts /apps/compositions/src/examples/|https://chakra-ui.com|llms.txt llms-full.txt llms-components.txt llms-charts.txt llms-styling.txt llms-theming.txt llms-v3-migration.txt"
  "park-ui|chakra-ui/park-ui|/website/src/content/|/website/src/lib/docs.ts /website/src/lib/examples.ts /components/react/src/examples/||"
  "radix|radix-ui/website|/data/|/components/demos/ /utils/classNames.ts /utils/themes/props.ts /utils/primitivesRoutes.ts /utils/themesRoutes.ts /utils/colorsRoutes.ts||"
  "shadcn|shadcn-ui/ui|/apps/v4/content/|/apps/v4/examples/ /apps/v4/registry/new-york-v4/examples/ /apps/v4/registry/bases/*/examples/|https://ui.shadcn.com|llms.txt"
  "mantine|mantinedev/mantine|/apps/mantine.dev/src/pages/**/*.mdx /apps/help.mantine.dev/src/pages/q/|/packages/@docs/demos/ /packages/@docs/styles-api/ /apps/mantine.dev/src/mdx/ /apps/mantine.dev/src/app-shell-examples/ /apps/mantine.dev/src/combobox-examples/ /apps/help.mantine.dev/src/demos/|https://mantine.dev|llms.txt llms-full.txt"
  "stylex|facebook/stylex|/packages/docs/content/ /packages/docs/static/llm/|/packages/docs/source.config.ts|https://stylexjs.com|llms-full.txt"
  "vanilla-extract|vanilla-extract-css/vanilla-extract|/site/docs/ /docs/|/site/contents.mts||"
  "react-aria|adobe/react-spectrum|/packages/dev/s2-docs/pages/ /packages/dev/s2-docs/migration-references/ /packages/dev/docs/pages/ /packages/@adobe/react-spectrum/docs/ /packages/@internationalized/date/docs/ /packages/@internationalized/number/docs/ /.storybook-s2/docs/ /docs/|/packages/dev/s2-docs/src/getPages.ts /starters/hooks/src/ /starters/docs/src/ /starters/tailwind/src/ /packages/dev/s2-docs/tailwind/|https://react-spectrum.adobe.com|llms.txt"
  "tailwind|tailwindlabs/tailwindcss.com|/src/docs/ /src/blog/ /src/app/**/*.mdx /src/app/(docs)/docs/installation/|/src/app/(docs)/docs/index.tsx /src/components/color-palette.tsx /src/components/dynamic-viewport-example.tsx /src/components/multi-cursor/ /src/components/content.tsx||"
  "tamagui|tamagui/tamagui|/code/tamagui.dev/data/docs/ /code/tamagui.dev/data/blog/ /code/tamagui.dev/data/authors.ts|/code/demos/src/ /code/demos/types/ /code/tamagui.dev/features/docs/docsRoutes.tsx /code/tamagui.dev/features/docs/demos.tsx|https://tamagui.dev|llms.txt llms-full.txt"
  "ark-ui|chakra-ui/ark|/website/src/content/pages/ /website/src/content/blog/ /website/src/content/types/react/|/website/src/demos/ /packages/react/src/**/examples/ /templates/next-js/ /website/src/lib/sidebar-config.ts|https://ark-ui.com|llms.txt llms-react.txt"
  "base-ui|mui/base-ui|/docs/src/app/(docs)/**/*.mdx /docs/src/app/(docs)/**/*.md /docs/src/app/(docs)/**/types.ts /docs/src/app/(docs)/**/demos/ /docs/src/app/(website)/blog/posts/|/docs/src/app/(docs)/production-error/ /docs/src/app/sitemap/index.ts /docs/src/utils/sitemapPage.*|https://base-ui.com|llms.txt llms-full.txt"
  "primer-design|primer/design|/content/ /docs/|/src/@primer/gatsby-theme-doctocat/nav.yml /src/@primer/gatsby-theme-doctocat/live-code-scope.js||"
  "primer-react|primer/react|/packages/react/src/**/*.docs.json /packages/react/src/**/*.hookDocs.json /contributor-docs/ /migrating.md|/packages/react/src/**/*.stories.tsx /examples/codesandbox/||"
)

# Companion clones: a second repo whose files sit inside a source's clone folder (<parent>/<subdir>).
# Format: parent source | GitHub owner/repo | subdir | patterns (space-separated)
COMPANIONS=(
  "radix|radix-ui/themes|themes-src|/LICENSE* /packages/radix-ui-themes/src/components/**/*.props.ts /packages/radix-ui-themes/src/components/**/*.props.tsx /packages/radix-ui-themes/src/props/"
)

# row_for: the SOURCES row for one name; fails when the name is unknown.
row_for() {
  local entry nm rest
  for entry in "${SOURCES[@]}"; do
    IFS='|' read -r nm rest <<<"$entry"
    if [ "$nm" = "$1" ]; then
      printf '%s\n' "$entry"
      return 0
    fi
  done
  return 1
}

# clone_sparse: one shallow, blobless, sparse clone with no-cone patterns.
clone_sparse() {
  local url=$1
  local dest=$2
  shift 2
  local patterns=("$@")

  echo "cloning sparse $url → $dest"
  rm -rf "$dest"
  git clone --depth 1 --filter=blob:none --sparse "$url" "$dest"
  git -C "$dest" sparse-checkout set --no-cone "${patterns[@]}"
}

# clone_companions: a parent's companions live inside its folder, so they run after the parent clone.
clone_companions() {
  local parent=$1
  local entry cparent slug subdir pats_str
  local pats
  for entry in "${COMPANIONS[@]}"; do
    IFS='|' read -r cparent slug subdir pats_str <<<"$entry"
    if [ "$cparent" = "$parent" ]; then
      pats=()
      read -r -a pats <<<"$pats_str"
      clone_sparse "https://github.com/$slug.git" "$ROOT/$parent/$subdir" "${pats[@]}"
    fi
  done
}

# is_html: a docs host can answer a missing llms file with an HTML error page and status 200.
is_html() {
  local head
  head=$(head -c 256 "$1")
  case "$head" in
    *"<!DOCTYPE"* | *"<!doctype"* | *"<html"*) return 0 ;;
    *) return 1 ;;
  esac
}

# fetch_llms: first-party llms*.txt from the docs site, into <dest>/llms/.
# A missing file is reported and skipped, not fatal; the manifest lists only what arrived.
fetch_llms() {
  local dest=$1
  local base=$2
  shift 2
  local f
  mkdir -p "$dest/llms"
  for f in "$@"; do
    if curl -fsSL --max-time 300 -o "$dest/llms/$f" "$base/$f" && ! is_html "$dest/llms/$f"; then
      echo "  llms $base/$f"
    else
      rm -f "$dest/llms/$f"
      echo "  llms MISSING $base/$f (skipped)" >&2
    fi
  done
}

# trim: images, video and lockfiles are not needed for reading docs source.
# Walks only the sources in this run: vendor/docs also holds folders owned by other work.
trim() {
  local name
  echo "trimming images, video and lockfiles in: ${selected[*]}"
  for name in "${selected[@]}"; do
    find "$ROOT/$name" -type f -not -path '*/.git/*' \( \
      -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.webp' -o \
      -iname '*.gif' -o -iname '*.svg' -o -iname '*.avif' -o -iname '*.ico' -o \
      -iname '*.mp4' -o -iname '*.webm' -o -iname '*.mov' -o -iname '*.m4v' -o \
      -name 'pnpm-lock.yaml' -o -name 'yarn.lock' -o -name 'package-lock.json' -o \
      -name 'npm-shrinkwrap.json' -o -name 'bun.lock' -o -name 'bun.lockb' \
    \) -delete
  done
}

# spdx_for: SPDX id from the GitHub license API; a 404 means the repo declares no license.
spdx_for() {
  local slug=$1
  local out
  if out=$(gh api "repos/$slug/license" --jq '.license.spdx_id // "NOASSERTION"' 2>&1); then
    echo "$out"
  elif [[ "$out" == *"HTTP 404"* ]]; then
    echo "NONE"
  else
    echo "license lookup failed for $slug: $out" >&2
    return 1
  fi
}

# count_md: .md/.mdx files in one source's sparse checkout (LICENSE excluded); companion clones are skipped.
count_md() {
  local dest=$1
  local entry cparent slug subdir rest
  local prune
  prune=()
  for entry in "${COMPANIONS[@]}"; do
    IFS='|' read -r cparent slug subdir rest <<<"$entry"
    if [ "$dest" = "$ROOT/$cparent" ]; then
      prune+=(-path "$dest/$subdir" -prune -o)
    fi
  done
  find "$dest" ${prune[@]+"${prune[@]}"} -type f \( -name '*.md' -o -name '*.mdx' \) \
    -not -path '*/.git/*' -not -name 'LICENSE*' -print | wc -l | tr -d ' '
}

# json_array: plain strings as a JSON array.
json_array() {
  local out="" sep="" item
  if [ $# -gt 0 ]; then
    for item in "$@"; do
      out="$out$sep\"$item\""
      sep=", "
    done
  fi
  printf '[%s]' "$out"
}

# json_wrap: items that are already JSON text, as one JSON array.
json_wrap() {
  local out="" sep="" item
  if [ $# -gt 0 ]; then
    for item in "$@"; do
      out="$out$sep$item"
      sep=", "
    done
  fi
  printf '[%s]' "$out"
}

# companion_objects: one JSON object per companion clone of $1, each with its own commit and license.
companion_objects() {
  local parent=$1
  local entry cparent slug subdir pats_str commit lic
  local pats
  for entry in "${COMPANIONS[@]}"; do
    IFS='|' read -r cparent slug subdir pats_str <<<"$entry"
    if [ "$cparent" = "$parent" ]; then
      pats=()
      read -r -a pats <<<"$pats_str"
      commit=$(git -C "$ROOT/$parent/$subdir" rev-parse HEAD)
      lic=$(spdx_for "$slug")
      printf '{"repo": "https://github.com/%s", "commit": "%s", "dir": "%s/%s", "paths": %s, "license": "%s"}\n' \
        "$slug" "$commit" "$parent" "$subdir" "$(json_array "${pats[@]}")" "$lic"
    fi
  done
}

# entry_line: one manifest line for a source, in the shape the manifest has always had.
entry_line() {
  local name=$1
  local row nm slug docs_str extras_str llms_base llms_str
  local docs extras llms_files items
  local p f dest commit license files comp_out obj extras_json llms_json lsep
  docs=()
  extras=()
  llms_files=()
  items=()
  row=$(row_for "$name")
  IFS='|' read -r nm slug docs_str extras_str llms_base llms_str <<<"$row"
  read -r -a docs <<<"$docs_str"
  read -r -a extras <<<"$extras_str"
  if [ -n "$llms_str" ]; then
    read -r -a llms_files <<<"$llms_str"
  fi
  dest="$ROOT/$name"
  commit=$(git -C "$dest" rev-parse HEAD)
  license=$(spdx_for "$slug")
  files=$(count_md "$dest")
  if [ "$files" -le 0 ]; then
    echo "no .md/.mdx files found for $name" >&2
    return 1
  fi

  if [ "${#extras[@]}" -gt 0 ]; then
    for p in "${extras[@]}"; do
      items+=("\"$p\"")
    done
  fi
  comp_out=$(companion_objects "$name")
  while IFS= read -r obj; do
    if [ -n "$obj" ]; then
      items+=("$obj")
    fi
  done <<<"$comp_out"
  if [ "${#items[@]}" -gt 0 ]; then
    extras_json=$(json_wrap "${items[@]}")
  else
    extras_json="[]"
  fi

  llms_json="["
  lsep=""
  if [ "${#llms_files[@]}" -gt 0 ]; then
    for f in "${llms_files[@]}"; do
      if [ -s "$dest/llms/$f" ]; then
        llms_json="$llms_json$lsep{\"file\": \"llms/$f\", \"url\": \"$llms_base/$f\"}"
        lsep=", "
      fi
    done
  fi
  llms_json="$llms_json]"

  printf '  {"name": "%s", "repo": "https://github.com/%s", "commit": "%s", "paths": %s, "extras": %s, "llms": %s, "license": "%s", "files": %s}\n' \
    "$name" "$slug" "$commit" "$(json_array "${docs[@]}")" "$extras_json" "$llms_json" "$license" "$files"
}

# merge_manifest (run by node): replace only the entries named in the fragment; every other line is kept as it was.
read -r -d '' MERGE_JS <<'EOF' || true
const fs = require('fs');
const [manifestPath, fragmentPath, outPath] = process.argv.slice(1);
const entryLine = /^\s*\{"name": "([^"]+)"/;
const nameOf = (line) => entryLine.exec(line)[1];
const entriesOf = (text) => text.split('\n').filter((l) => entryLine.test(l)).map((l) => l.replace(/,\s*$/, ''));
const current = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, 'utf8') : '[\n]\n';
const fresh = entriesOf(fs.readFileSync(fragmentPath, 'utf8'));
const freshByName = new Map(fresh.map((line) => [nameOf(line), line]));
const merged = [];
const seen = new Set();
for (const line of entriesOf(current)) {
  const name = nameOf(line);
  if (freshByName.has(name)) {
    merged.push(freshByName.get(name));
    seen.add(name);
  } else {
    merged.push(line);
  }
}
for (const line of fresh) if (!seen.has(nameOf(line))) merged.push(line);
const text = '[\n' + merged.join(',\n') + '\n]\n';
JSON.parse(text);
fs.writeFileSync(outPath, text);
EOF

# ---- 0. which sources this run covers: every source, or only the names given
selected=()
if [ $# -eq 0 ]; then
  for entry in "${SOURCES[@]}"; do
    IFS='|' read -r nm rest <<<"$entry"
    selected+=("$nm")
  done
else
  for arg in "$@"; do
    if ! row_for "$arg" >/dev/null; then
      echo "unknown source: $arg" >&2
      exit 2
    fi
    case " ${selected[*]:-} " in
      *" $arg "*) ;;
      *) selected+=("$arg") ;;
    esac
  done
fi
echo "sources: ${selected[*]}"

# ---- 1. clone the selected sources in parallel (docs + extras + LICENSE), each followed by its companions
pids=()
for name in "${selected[@]}"; do
  row=$(row_for "$name")
  IFS='|' read -r nm slug docs_str extras_str llms_base llms_str <<<"$row"
  docs=()
  extras=()
  patterns=("/LICENSE*")
  read -r -a docs <<<"$docs_str"
  read -r -a extras <<<"$extras_str"
  patterns+=("${docs[@]}")
  if [ "${#extras[@]}" -gt 0 ]; then
    patterns+=("${extras[@]}")
  fi
  ( clone_sparse "https://github.com/$slug.git" "$ROOT/$name" "${patterns[@]}" && clone_companions "$name" ) &
  pids+=("$!")
done

failed=0
for pid in "${pids[@]}"; do
  wait "$pid" || failed=1
done
if [ "$failed" -ne 0 ]; then
  echo "one or more clones failed" >&2
  exit 1
fi

# ---- 2. remove images, video and lockfiles from the clones in this run
trim

# ---- 3. first-party llms files for the sources in this run
for name in "${selected[@]}"; do
  row=$(row_for "$name")
  IFS='|' read -r nm slug docs_str extras_str llms_base llms_str <<<"$row"
  if [ -n "$llms_base" ] && [ -n "$llms_str" ]; then
    llms_files=()
    read -r -a llms_files <<<"$llms_str"
    echo "fetching llms files for $name from $llms_base"
    fetch_llms "$ROOT/$name" "$llms_base" "${llms_files[@]}"
  fi
done

# ---- 4. manifest: fresh lines for the sources in this run, merged into the existing manifest
FRAG="$ROOT/.manifest-fragment.$$.tmp"
TMP_MANIFEST="$MANIFEST.tmp"
: >"$FRAG"
for name in "${selected[@]}"; do
  entry_line "$name" >>"$FRAG"
done
node -e "$MERGE_JS" "$MANIFEST" "$FRAG" "$TMP_MANIFEST"
rm -f "$FRAG"
mv "$TMP_MANIFEST" "$MANIFEST"
echo "wrote $MANIFEST entries for: ${selected[*]}"

echo "vendor docs clones ready in $ROOT"
for name in "${selected[@]}"; do
  du -sh "$ROOT/$name"
done
