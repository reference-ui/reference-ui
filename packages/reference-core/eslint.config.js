import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import sonarjs from 'eslint-plugin-sonarjs'

export default [
  { ignores: ['node_modules/**', 'dist/**', '**/*.config.ts', 'src/system/styled/**'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    plugins: { sonarjs },
    rules: {
      ...sonarjs.configs.recommended.rules,

      // Complexity thresholds – adjust freely
      'sonarjs/cognitive-complexity': ['warn', 15],
      complexity: ['warn', { max: 10 }],
      'max-depth': ['warn', 4],
      'max-params': ['warn', 4],
      'max-statements': ['warn', 20],

      // Optional extras
      'sonarjs/no-duplicate-string': 'warn',
      'sonarjs/no-ignored-return': 'warn',
    },
  },
  // Relax SonarJS in tests: duplicate strings and temp dirs are normal there
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/publicly-writable-directories': 'off',
    },
  },
]
