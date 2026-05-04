/**
 * Managed tsconfig generation for matrix consumers.
 *
 * The synthetic matrix consumer only needs enough TypeScript configuration to
 * exercise `ref sync` and compile the selected fixture as a downstream app.
 */

import {
  createTemplateEntries,
  createTemplateValues,
  managedGeneratedNotice,
  renderManagedTemplate,
} from '../template.js'

export function createMatrixConsumerTsconfig(): string {
  return renderManagedTemplate(new URL('./templates/consumer-tsconfig.json.liquid', import.meta.url), {
    compilerOptions: createTemplateEntries({
      jsx: 'react-jsx',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      module: 'esnext',
      moduleResolution: 'bundler',
      types: [],
      target: 'es2022',
      strict: true,
      skipLibCheck: true,
    }),
    generatedNotice: JSON.stringify(managedGeneratedNotice),
    include: createTemplateValues(['src/**/*', 'tests/**/*', 'unit/**/*', 'component/**/*', 'ui.config.ts']),
  })
}
