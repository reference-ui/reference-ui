/**
 * Park UI adapter. The page list, titles, sections and order come from the
 * site's nav logic in `website/src/lib/docs.ts`: docs group by their frontmatter
 * `category`, groups sort with `CATEGORIES_ORDER` first and the rest by name,
 * and pages sort by `GETTING_STARTED_PRIORITY` or by title. The live sidebar
 * labels each group with that raw category, so it is the `section`, and the
 * live sitemap lists the same 65 docs URLs. The header tabs
 * (Docs | Blog | Changelog) link the blog and the changelog, so both are
 * included with types `blog` and `changelog`. The site's components have no
 * source in the clone: demos are inlined from `components/react/src/examples/`.
 * Props tables come from the Ark UI types of the component a page links to in
 * its frontmatter (`links.ark`), laid out as the Ark adapter lays out a part;
 * a bare `<PropsTable />` is the Root part, and every other element the site
 * builds from data outside the clone becomes a note.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, join, relative, sep } from 'node:path'
import { parseFrontmatter } from '../lib/frontmatter.mjs'
import { stringList } from '../lib/mdx.mjs'
import { prepareBody } from './park-ui/prose.mjs'

const SOURCE = 'park-ui'
/** The live origin. Its sitemap at /sitemap.xml lists every page under it. */
const SITE_URL = 'https://park-ui.com'
/** Repo-relative prefix of the content folder, for the `path` field. */
const REPO_CONTENT = 'vendor/docs/park-ui/website/src/content'
const GETTING_STARTED = 'getting-started'
const EXAMPLES = join('components', 'react', 'src', 'examples')
/** Ark UI's React types, one JSON per component keyed by part: each prop's type, default and description. */
const ARK_TYPES = join('ark-ui', 'website', 'src', 'content', 'types', 'react')
/** Ark's live origin, for root-relative links inside its descriptions. */
const ARK_SITE = 'https://ark-ui.com'

/** Types of the getting-started pages, by slug. Every other docs page is a `component`. */
const TYPE_BY_SLUG = {
  introduction: 'concept',
  installation: 'install',
  theming: 'theming',
  migration: 'migration',
  figma: 'guide',
  about: 'other',
}

/** Page title by absolute source file. collect() fills it; the hooks read it. */
const titleByFile = new Map()
/** The Ark types ({ id, types }) of each page that links to Ark, by source file. collect() fills it. */
const arkByFile = new Map()

const str = value => (typeof value === 'string' ? value : '')
const titleOf = file => titleByFile.get(file) ?? basename(file, '.mdx')
const componentOf = file => basename(file, '.mdx')

/** A fenced block whose fence is longer than any backtick run in the body, so the body cannot close it. */
function fenced(lang, body) {
  const longest = Math.max(2, ...[...body.matchAll(/`+/g)].map(m => m[0].length))
  const fence = '`'.repeat(longest + 1)
  return `${fence}${lang}\n${body}\n${fence}`
}

/**
 * The demo file behind `<ComponentExample name>`. The component's stories file
 * re-exports `App as <camelName>` from the demo file, as the examples index does.
 */
function demoPath(ctx, component, name) {
  const dir = join(ctx.root, EXAMPLES, component)
  const camel = name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
  const stories = ctx.readImport(join(dir, `${component}.stories.tsx`))
  const found = stories?.match(new RegExp(`export \\{ App as ${camel} \\} from '\\./([^']+)'`))
  const kebab = name.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)
  return join(dir, `${found ? found[1] : kebab}.tsx`)
}

/** The component's folder name, and a `name` as written in MDX (kebab or camelCase). */
const COMPONENT_PART = /^[a-z0-9-]+$/
const NAME_PART = /^[A-Za-z0-9-]+$/

/** Hooks for the site's components. A demo is inlined; anything else becomes a note. */
export const components = {
  ComponentExample(props, _children, ctx) {
    const component = str(props.component) || componentOf(ctx.file)
    const name = str(props.name)
    if (!COMPONENT_PART.test(component) || !NAME_PART.test(name)) return null
    const source = ctx.readImport(demoPath(ctx, component, name))
    return source === null ? null : fenced('tsx', source.replace(/\n$/, ''))
  },
  /**
   * The props of a part, from the Ark types of the component the page links to. A bare
   * `<PropsTable />` is the Root part, which is what the live pages show. A page with no
   * Ark link, or a part Ark does not have, keeps a one-line note.
   */
  PropsTable(props, _children, ctx) {
    const part = str(props.part) || 'Root'
    const ark = arkByFile.get(ctx.file)
    if (ark && Object.hasOwn(ark.types, part)) return partMarkdown(ark.types[part])
    const scope = str(props.part) ? `the ${part} part of ${titleOf(ctx.file)}` : titleOf(ctx.file)
    if (ark) {
      return `> Table: the props of ${scope}. The Ark types for ${ark.id} have no ${part} part, so the clone does not include this table.`
    }
    return `> Table: the props of ${scope}. The site renders this table from component data that the clone does not include.`
  },
  InstallationGuide(_props, _children, ctx) {
    return `> Installation: the site renders the install steps for ${titleOf(ctx.file)} here. The clone does not include them.`
  },
  Step(props, children) {
    const number = str(props.number)
    const label = `${number ? `${number}. ` : ''}${str(props.title)}`
    return children ? `### ${label}\n\n${children}` : `### ${label}`
  },
  VariantPreview(props) {
    return `> Preview: the ${str(props.variant)} variant, rendered by the site. The clone does not include it.`
  },
  FigmaKitPreview(props) {
    return `> Preview: the ${str(props.variant)} Figma Kit, rendered by the site. The clone does not include it.`
  },
  ColorGrid(props) {
    return `> Table: the ${str(props.type)} color scale, rendered by the site. The clone does not include its values.`
  },
  ShadowTokens: () => '> Table: the shadow tokens, rendered by the site. The clone does not include their values.',
  BorderRadiusTokens: () => '> Table: the border radius tokens, rendered by the site. The clone does not include their values.',
  ColorPairings: () => '> Table: the color pairings, rendered by the site. The clone does not include them.',
  ComponentSizing: () => '> Table: the component sizing, rendered by the site. The clone does not include it.',
  QuickstartGuide: () => '> Quickstart: the site renders its quickstart examples here. The clone does not include them.',
}

/** A top-level string array from docs.ts, such as CATEGORIES_ORDER. */
function constList(navSource, name) {
  const match = navSource.match(new RegExp(`const ${name} = \\[([^\\]]*)\\]`))
  if (!match) throw new Error(`website/src/lib/docs.ts has no ${name}; the nav logic changed`)
  return stringList(match[1])
}

/** docs.ts sortByCategory: CATEGORIES_ORDER first, the rest by name. */
function compareCategories(a, b, order) {
  const ai = order.indexOf(a)
  const bi = order.indexOf(b)
  if (ai === -1 && bi === -1) return a.localeCompare(b)
  if (ai === -1) return 1
  if (bi === -1) return -1
  return ai - bi
}

/** docs.ts order: by category, then GETTING_STARTED_PRIORITY for getting-started, else by title. */
function compareDocs(a, b, order, priority) {
  if (a.category !== b.category) return compareCategories(a.category, b.category, order)
  if (a.category === GETTING_STARTED) {
    const ai = priority.indexOf(basename(a.slug))
    const bi = priority.indexOf(basename(b.slug))
    if (ai !== -1 || bi !== -1) return ai - bi
  }
  return a.title.localeCompare(b.title)
}

/** Every .mdx file under dir, depth-first, names sorted. */
function mdxFiles(dir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out.push(...mdxFiles(full))
    else if (name.endsWith('.mdx')) out.push(full)
  }
  return out
}

/** One MDX file's frontmatter and body; a missing required field fails the run. */
function readEntry(file, root, required) {
  const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'))
  for (const field of required) {
    if (!data[field]) throw new Error(`${relative(root, file)} needs a ${field} in its frontmatter`)
  }
  return { file, data, body }
}

/**
 * The Ark component id a page links to, from `links.ark` in its frontmatter, or null.
 * parseFrontmatter folds the nested `links` keys into one string, so the URL is matched in it.
 */
function arkIdOf(data) {
  const url = typeof data.links === 'string' ? data.links.match(/\bark:\s*(\S+)/)?.[1] : undefined
  return url ? url.split('/').pop() : null
}

/** Table cell text: one line, pipes escaped. Same cell rule as the Ark adapter. */
function cell(text) {
  return String(text ?? '')
    .trim()
    .replace(/\r?\n/g, '<br>')
    .replace(/\|/g, '\\|')
}

/**
 * Description text: a bare `<tag>` outside inline code is wrapped in code, so Markdown does not
 * read it as HTML. Code spans are left as they are, and the type and default cells are already code.
 */
function descriptionText(text) {
  return String(text ?? '')
    .split(/(`[^`]*`)/)
    .map((part, i) => (i % 2 ? part : part.replace(/<(\/?[A-Za-z][\w.-]*)>/g, '`<$1>`')))
    .join('')
}

/** Ark's props table: Prop, Type, Required, Default, Description. Same columns as the Ark adapter. */
function propsTable(entries) {
  const rows = entries.map(([name, p]) => {
    const type = p.type ? `\`${cell(p.type)}\`` : ''
    const dflt = p.defaultValue !== undefined ? `\`${cell(p.defaultValue)}\`` : ''
    return `| \`${name}\` | ${type} | ${p.isRequired ? 'yes' : 'no'} | ${dflt} | ${cell(descriptionText(p.description))} |`
  })
  return ['| Prop | Type | Required | Default | Description |', '| --- | --- | --- | --- | --- |', ...rows].join('\n')
}

/** One Ark part as Markdown: the element it renders, then its props table (the Ark adapter's layout). */
function partMarkdown(body) {
  const out = []
  const renders = [body.tag && `\`<${body.tag}>\``, body.element && `\`${body.element}\``].filter(Boolean)
  if (renders.length) out.push(`Renders: ${renders.join(' (')}${renders.length > 1 ? ')' : ''}.`, '')
  const entries = Object.entries(body.props ?? {})
  if (entries.length) out.push(propsTable(entries))
  return out.join('\n').trim().replace(/\]\(\//g, `](${ARK_SITE}/`)
}

export default {
  source: SOURCE,

  async collect({ vendorDir }) {
    const root = join(vendorDir, SOURCE)
    const contentDir = join(root, 'website', 'src', 'content')
    const navSource = readFileSync(join(root, 'website', 'src', 'lib', 'docs.ts'), 'utf8')
    const order = constList(navSource, 'CATEGORIES_ORDER')
    const priority = constList(navSource, 'GETTING_STARTED_PRIORITY')

    const docsDir = join(contentDir, 'docs')
    const docs = mdxFiles(docsDir)
      .map(file => {
        const { data, body } = readEntry(file, root, ['title', 'category'])
        const slug = relative(docsDir, file).replace(/\.mdx$/, '').split(sep).join('/')
        const arkId = arkIdOf(data)
        return { file, slug, title: data.title, category: data.category, description: data.description ?? '', body, arkId }
      })
      .sort((a, b) => compareDocs(a, b, order, priority))
    if (!docs.length) throw new Error(`no docs pages under ${relative(vendorDir, docsDir)}`)

    // Ark types are read here, once; the hooks only see this map. A link whose types file is absent is reported.
    arkByFile.clear()
    const arkMissing = []
    const pages = []
    for (const doc of docs) {
      titleByFile.set(doc.file, doc.title)
      if (doc.arkId) {
        const typesFile = join(vendorDir, ARK_TYPES, `${doc.arkId}.types.json`)
        if (existsSync(typesFile)) {
          arkByFile.set(doc.file, { id: doc.arkId, types: JSON.parse(readFileSync(typesFile, 'utf8')) })
        } else {
          arkMissing.push(`${doc.slug} -> ${doc.arkId}`)
        }
      }
      pages.push({
        slug: doc.slug,
        title: doc.title,
        description: doc.description,
        url: `${SITE_URL}/docs/${doc.slug}`,
        section: doc.category,
        type: TYPE_BY_SLUG[doc.slug] ?? (doc.category === GETTING_STARTED ? 'other' : 'component'),
        path: `${REPO_CONTENT}/docs/${doc.slug}.mdx`,
        file: doc.file,
        format: 'mdx',
        text: prepareBody(doc.body),
      })
    }

    // Order follows the live /blog listing, which for the two current posts is ascending publishedAt.
    const posts = mdxFiles(join(contentDir, 'posts'))
      .map(file => {
        const { data, body } = readEntry(file, root, ['title', 'description', 'publishedAt'])
        return { file, name: basename(file, '.mdx'), data, body }
      })
      .sort((a, b) => String(a.data.publishedAt).localeCompare(String(b.data.publishedAt)))
    for (const post of posts) {
      titleByFile.set(post.file, post.data.title)
      pages.push({
        slug: `blog/${post.name}`,
        title: post.data.title,
        description: post.data.description,
        url: `${SITE_URL}/blog/${post.name}`,
        section: 'Blog',
        type: 'blog',
        path: `${REPO_CONTENT}/posts/${post.name}.mdx`,
        file: post.file,
        format: 'mdx',
        text: prepareBody(post.body),
      })
    }

    // /changelog is one live page, so every entry (newest first) becomes its body.
    const entries = mdxFiles(join(contentDir, 'changelog'))
      .map(file => readEntry(file, root, ['date']))
      .sort((a, b) => String(b.data.date).localeCompare(String(a.data.date)))
    if (entries.length) {
      const newest = entries[0]
      pages.push({
        slug: 'changelog',
        title: 'Changelog',
        description: String(newest.data.date),
        url: `${SITE_URL}/changelog`,
        section: 'Changelog',
        type: 'changelog',
        path: `${REPO_CONTENT}/changelog/${basename(newest.file)}`,
        file: newest.file,
        format: 'mdx',
        text: prepareBody(entries.map(entry => entry.body.trim()).join('\n\n')),
      })
    }

    const withArk = docs.filter(doc => doc.arkId).length
    const report = [
      `docs: ${docs.length} pages in ${new Set(docs.map(doc => doc.category)).size} sections; nav order from website/src/lib/docs.ts`,
      `props: Ark types for ${arkByFile.size} of ${withArk} pages that link to Ark (links.ark); ${docs.length - withArk} pages with no Ark link keep notes${arkMissing.length ? `; no types file for: ${arkMissing.join(', ')}` : ''}`,
      `blog: ${posts.length} posts from the header tab Blog; the /blog listing has no text of its own`,
      `changelog: ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} on one page, /changelog (header tab Changelog)`,
      'not emitted: / (home page, no docs content in the clone); /docs (redirects to /docs/introduction)',
    ]
    return { root, siteUrl: SITE_URL, pages, report }
  },
}
