/**
 * The six content fragments from src/components/content.tsx, rendered as text.
 * Each function mirrors one component: the same prop defaults, the same
 * branches, and the same strings built from the props, with JSX whitespace
 * (`{" "}`, line breaks) producing the same spaces. The TSX is read, never run.
 * Props arrive decoded from the MDX header (see markup.mjs).
 */

import { codeFence } from './markup.mjs'

const SCREENS = { sm: 'small', md: 'medium', lg: 'large' }
const VOWELS = ['a', 'e', 'i', 'o', 'u']
const SPACING_CSS = '@theme {\n  --spacing: 1px; /* [!code highlight] */\n}'

const startsWithVowel = text => VOWELS.includes(String(text)[0])

/** The `.map` in the TSX: each item in backticks, with the and/comma joins it places between items. */
function joinedItems(names, render) {
  const last = names.length - 1
  return names
    .map((name, index) => {
      const lead = names.length > 1 && index === last ? ' and ' : ''
      const tail = index === last || names.length < 3 ? '' : ','
      return `${lead}${render(name)}${tail}`
    })
    .join('')
}

const code = text => `\`${text}\``

/** The TSX `htmlSnippet`: the annotated element with its attributes and placeholder content. */
export function htmlSnippet({ elementName, attributes, featuredClass }) {
  const parts = [`<!-- [!code classes:${featuredClass}] -->\n`]
  const attributesString = Object.entries(attributes)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ')
  parts.push(`<${elementName} ${attributesString}`)
  if (elementName === 'img' || elementName === 'input') {
    parts.push(' />')
  } else if (elementName === 'textarea') {
    parts.push('></textarea>')
  } else if (elementName === 'iframe') {
    parts.push('></iframe>')
  } else {
    parts.push('>\n')
    parts.push(elementName === 'p' ? '  Lorem ipsum dolor sit amet...\n' : '  <!-- ... -->\n')
    parts.push(`</${elementName}>`)
  }
  return parts.join('')
}

/** Paragraphs as strings, code as `{ lang, code }`, and any child Markdown as a string, in order. */
function render(blocks) {
  return blocks
    .filter(block => block !== undefined && block !== '')
    .map(block => (typeof block === 'string' ? block : codeFence(block.lang, block.code)))
    .join('\n\n')
}

/** UsingACustomValue: a custom value, then the CSS-variable form, then the shorthand note. */
export function usingACustomValue(props, children) {
  const element = props.element ?? 'div'
  const elementAttributes = props.elementAttributes ?? {}
  let property = `--my-${props.variable || props.utility || props.utilities[0]}`
  if (props.dataType) property = `${props.dataType}:${property}`
  const utility = props.utility || props.utilities[0]
  const plural = Boolean(props.utilities)
  const intro = plural
    ? `Use utilities like ${joinedItems(props.utilities, name => code(`${name}-[<value>]`))} to set the ${props.name || utility} based on a completely custom value:`
    : `Use the ${code(`${utility}-[<value>]`)} syntax to set the ${props.name || utility} based on a completely custom value:`
  const dataPrefix = props.dataType ? `${props.dataType}:` : ''
  return render([
    intro,
    children || {
      lang: 'html',
      code: htmlSnippet({
        elementName: element,
        attributes: { class: `${utility}-[${props.value}] ...`, ...elementAttributes },
        featuredClass: `${utility}-[${props.value}]`,
      }),
    },
    `For CSS variables, you can also use the ${code(`${utility}-(${dataPrefix}<custom-property>)`)} syntax:`,
    {
      lang: 'html',
      code: htmlSnippet({
        elementName: element,
        attributes: { class: `${utility}-(${property}) ...`, ...elementAttributes },
        featuredClass: `${utility}-(${property})`,
      }),
    },
    `This is just a shorthand for ${code(`${utility}-[${dataPrefix}var(<custom-property>)]`)} that adds the ${code('var()')} function for you automatically.`,
  ])
}

/** ResponsiveDesign: a breakpoint variant, with `children` in place of the default snippet. */
export function responsiveDesign(props, children, siteUrl) {
  const breakpoint = props.breakpoint ?? 'md'
  const element = props.element ?? 'div'
  const elementAttributes = props.elementAttributes ?? {}
  const screen = SCREENS[breakpoint] ?? ''
  const intro = props.properties
    ? `Prefix ${joinedItems(props.properties, name => code(name))} utilities with a breakpoint variant like ${code(`${breakpoint}:`)} to only apply the utility at ${screen} screen sizes and above:`
    : `Prefix ${startsWithVowel(props.property) ? 'an' : 'a'} ${code(props.property)} utility with a breakpoint variant like ${code(`${breakpoint}:`)} to only apply the utility at ${screen} screen sizes and above:`
  return render([
    intro,
    children || {
      lang: 'html',
      code: htmlSnippet({
        elementName: element,
        attributes: { class: `${props.defaultClass} ${breakpoint}:${props.featuredClass} ...`, ...elementAttributes },
        featuredClass: `${breakpoint}:${props.featuredClass}`,
      }),
    },
    `Learn more about using variants in the [variants documentation](${siteUrl}/docs/hover-focus-and-other-states).`,
  ])
}

/** TargetingSpecificStates: a state variant (hover by default), with `children` in place of the snippet. */
export function targetingSpecificStates(props, children, siteUrl) {
  const variant = props.variant ?? 'hover'
  const element = props.element ?? 'div'
  const elementAttributes = props.elementAttributes ?? {}
  return render([
    `Prefix ${startsWithVowel(props.property) ? 'an' : 'a'} ${code(props.property)} utility with a variant like ${code(`${variant}:*`)} to only apply the utility in that state:`,
    children || {
      lang: 'html',
      code: htmlSnippet({
        elementName: element,
        attributes: { class: `${props.defaultClass} ${variant}:${props.featuredClass} ...`, ...elementAttributes },
        featuredClass: `${variant}:${props.featuredClass}`,
      }),
    },
    `Learn more about using variants in the [variants documentation](${siteUrl}/docs/hover-focus-and-other-states).`,
  ])
}

/** CustomizingYourTheme: the theme variable, the utility it creates, and optional spacing note and children. */
export function customizingYourTheme(props, children, siteUrl) {
  const element = props.element ?? 'div'
  const elementAttributes = props.elementAttributes ?? {}
  const includeSpacingNote = props.includeSpacingNote === true
  const themeName = props.themeKey || props.utility || props.utilities[0]
  const first = `Use the ${code(`--${themeName}-*`)} theme variables to customize the ${props.name} utilities in your project:`
  const css =
    props.customCSS || `@theme {\n  --${props.themeKey || props.utility}-${props.customName}: ${props.customValue}; /* [!code highlight] */\n}`
  const second = props.utilities
    ? `Now utilities like ${joinedItems(props.utilities, name => code(`${name}-${props.customName}`))} can be used in your markup:`
    : `Now the ${code(`${props.utility}-${props.customName}`)} utility can be used in your markup:`
  const created = props.utility || props.utilities[0]
  return render([
    first,
    { lang: 'css', code: css },
    second,
    {
      lang: 'html',
      code: htmlSnippet({
        elementName: element,
        attributes: { class: `${created}-${props.customName}`, ...elementAttributes },
        featuredClass: `${created}-${props.customName}`,
      }),
    },
    includeSpacingNote
      ? `The ${code(`${props.utility}-<number>`)} utilities are driven by the ${code('--spacing')} theme variable, which you can also customize:`
      : '',
    includeSpacingNote ? { lang: 'css', code: SPACING_CSS } : '',
    children,
    includeSpacingNote
      ? `Learn more about customizing the spacing scale in the [theme documentation](${siteUrl}/docs/theme#customizing-your-theme).`
      : `Learn more about customizing your theme in the [theme documentation](${siteUrl}/docs/theme#customizing-your-theme).`,
  ])
}

/** CustomizingYourSpacingScale: the spacing scale behind the utilities, with its CSS. */
export function customizingYourSpacingScale(props, siteUrl) {
  const names = props.utilities || [props.utility]
  return render([
    `The ${joinedItems(names, name => code(`${name}-<number>`))} utilities are driven by the ${code('--spacing')} theme variable, which can be customized in your own theme:`,
    { lang: 'css', code: SPACING_CSS },
    `Learn more about customizing the spacing scale in the [theme variable documentation](${siteUrl}/docs/theme).`,
  ])
}

/** CustomizingYourThemeColors: CustomizingYourTheme with the color theme and a fixed custom name. */
export function customizingYourThemeColors(props, siteUrl) {
  return customizingYourTheme(
    {
      themeKey: 'color',
      name: 'color',
      utility: props.utility,
      utilities: props.utilities,
      customName: 'regal-blue',
      customValue: '#243c5a',
      element: props.element,
      elementAttributes: props.elementAttributes,
    },
    undefined,
    siteUrl
  )
}
