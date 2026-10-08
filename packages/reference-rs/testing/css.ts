/**
 * CSS grammar oracle for Reference RS compiler goldens and standing gauges.
 * Parses a stylesheet with css-tree, then matches each declaration against
 * that property's formal grammar. Takes a CSS string and emits syntax and
 * declaration problems. Other modules can reuse this; it has no atomic-specific
 * knowledge. Custom properties and var() values are skipped because they are
 * valid at parse time and cannot be checked until substitution.
 */
import * as csstree from 'css-tree'

export interface CssProblem {
  kind: 'syntax' | 'declaration'
  message: string
}

/**
 * Parses `sheet` once, then walks declarations against css-tree's lexer.
 * Syntax errors are collected via onParseError; declaration mismatches use
 * matchProperty. Returns every problem found, in encounter order.
 */
export function validateCss(sheet: string): CssProblem[] {
  const problems: CssProblem[] = []
  const ast = parseSheet(sheet, problems)
  if (ast) {
    collectDeclarationProblems(ast, problems)
  }
  return problems
}

/**
 * Problems that are not covered by an allowlist entry (substring match).
 * Used by standing gauges and the golden writer so quarantined defects stay
 * writable while new ones still fail the build.
 */
export function unexpectedCssProblems(
  problems: CssProblem[],
  allowed: readonly string[] = []
): CssProblem[] {
  return problems.filter(problem => !isAllowedCssProblem(problem, allowed))
}

/**
 * Allowlist entries that no longer appear in `problems`.
 * The quarantine meta-test uses this so a fixed compiler bug without an
 * emptied slot fails the build instead of rotting on the list.
 */
export function staleCssAllowlist(
  problems: CssProblem[],
  allowed: readonly string[]
): string[] {
  return allowed.filter(entry => !problems.some(problem => problem.message.includes(entry)))
}

/**
 * Throws if `sheet` has CSS problems outside `allowed`.
 * The golden writer calls this before touching disk so `--update-goldens`
 * cannot bless a stylesheet nobody semantically reviewed.
 */
export function assertWritableCss(
  sheet: string,
  fileName: string,
  allowed: readonly string[] = []
): void {
  const unexpected = unexpectedCssProblems(validateCss(sheet), allowed)
  if (unexpected.length === 0) {
    return
  }
  const details = unexpected.map(problem => `  ${problem.kind}: ${problem.message}`).join('\n')
  throw new Error(`Refusing to write ${fileName}: stylesheet is not valid CSS.\n${details}`)
}

function isAllowedCssProblem(problem: CssProblem, allowed: readonly string[]): boolean {
  return allowed.some(entry => problem.message.includes(entry))
}

function parseSheet(sheet: string, problems: CssProblem[]): csstree.CssNode | null {
  try {
    return csstree.parse(sheet, {
      positions: true,
      onParseError(error) {
        problems.push({ kind: 'syntax', message: formatParseError(error) })
      },
    })
  } catch (error) {
    problems.push({
      kind: 'syntax',
      message: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

function formatParseError(error: csstree.SyntaxParseError): string {
  return `${error.message} at ${error.line}:${error.column}`
}

function collectDeclarationProblems(ast: csstree.CssNode, problems: CssProblem[]): void {
  csstree.walk(ast, {
    visit: 'Declaration',
    enter(node) {
      if (node.type !== 'Declaration') {
        return
      }
      const problem = matchDeclaration(node, this.atrule)
      if (problem) {
        problems.push(problem)
      }
    },
  })
}

function matchDeclaration(
  node: csstree.Declaration,
  atrule?: csstree.Atrule | null
): CssProblem | null {
  if (node.property.startsWith('--')) {
    return null
  }
  const value = csstree.generate(node.value)
  // Per CSS Variables: a declaration containing var() is valid at parse time
  // and unvalidatable until substitution. matchProperty cannot resolve custom
  // properties, so it rejects `color: var(--colors-slate-50)` and
  // `padding: calc(4 * var(--spacing-root))`.
  if (value.includes('var(')) {
    return null
  }
  if (atrule?.name === 'font-face') {
    const match = csstree.lexer.matchAtruleDescriptor('font-face', node.property, value)
    if (!match.error) {
      return null
    }
    return { kind: 'declaration', message: `${node.property}: ${value}` }
  }
  const match = csstree.lexer.matchProperty(node.property, value)
  if (!match.error) {
    return null
  }
  return { kind: 'declaration', message: `${node.property}: ${value}` }
}
