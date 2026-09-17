/**
 * Agent-facing fix tips for every rule the Neo quality gate enforces.
 * Each entry says what the rule means and what to do, agent-rs lint-table style. run.ts
 * prints the matching tip under each violation so the fix always sits next to the fault.
 * Rule IDs are the exact strings the gate emits: Biome categories plus the neo/ family.
 */
const SUPPRESS = 'biome-' + 'ignore';
const TS_IGNORE = '@ts-' + 'ignore';
const TS_EXPECT = '@ts-expect-' + 'error';

export const TIPS: Record<string, string> = {
  'lint/suspicious/noExplicitAny':
    'Explicit any switches the type checker off for that value, which defeats the gate. Name the real shape with an interface or union, narrow unknown at the boundary, and let inference carry the rest.',
  'lint/complexity/noExcessiveCognitiveComplexity':
    'Cognitive complexity punishes nesting and tangled control flow more than plain branches. Flatten the scopes, extract nested blocks into named helpers, and prefer one level of logic per function.',
  'lint/style/noRestrictedImports':
    'Neo is self-contained: it never imports from reference-core or reference-lib paths. Copy the solved code into a Neo-owned module instead, and keep the boundary closed.',
  'neo/cyclomatic':
    'Cyclomatic complexity counts the branching paths a reader must hold at once. Flatten with early returns, replace nested conditionals with lookup tables or helpers, and extract one branch family per helper.',
  'neo/params':
    'The type is missing: those parameters are one session of pass state. Introduce a small context object that carries the related values together, and keep the subject of the call as the explicit argument.',
  'neo/depth':
    'Deep nesting means the happy path is buried under guards. Invert the conditions with early returns or continue statements so the main flow reads at the left margin.',
  'neo/function-lines':
    'The function is several steps wearing one name. Split it into helpers named after real steps of the work, not fooPart2, and let each helper do one thing.',
  'neo/file-lines':
    'The file is several modules wearing one name. Split it into cohesive units with real boundaries, one idea per file, and keep each new file comfortably under the warn line.',
  'neo/suppression':
    `You ignored a rule we set up (${SUPPRESS}, ${TS_IGNORE}, or a bare ${TS_EXPECT}), so the gate fails the file rather than the rule. Remove the suppression and fix the underlying violation; a dump cannot land by switching the gate off.`,
  'neo/header':
    'Every source file opens with a short header comment saying what the file is, takes, and emits. Write two to six complete sentences: not a one-liner label, and not an essay that belongs in a README.',
  'neo/readme':
    'READMEs describe architecture in prose; filename tables rot and duplicate the file headers. Delete the table, describe what the module achieves and where its boundaries are, and let each file introduce itself.',
  'neo/tsc':
    'The strict type check failed, which means a type error the linter cannot see. Read the reported error, fix the types without widening anything toward any, and rerun the gate.',
  'lint/*':
    'A recommended Biome rule fired. Read the message, apply the fix it suggests, and if the rule genuinely lies about honest gate code, say so: the rule gets turned off in the config, never suppressed in the file.',
};

export function tipFor(ruleId: string | undefined): string | undefined {
  if (ruleId && TIPS[ruleId]) return TIPS[ruleId];
  if (ruleId && ruleId.startsWith('lint/')) return TIPS['lint/*'];
  return undefined;
}
