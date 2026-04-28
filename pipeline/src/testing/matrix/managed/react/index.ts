import type { MatrixReactRuntime } from '../../discovery/index.js'

interface ManagedReactProfile {
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  mountElementId: string
}

const managedReactProfiles: Record<MatrixReactRuntime, ManagedReactProfile> = {
  react19: {
    dependencies: {
      react: '^19.2.0',
      'react-dom': '^19.2.0',
    },
    devDependencies: {
      '@types/react': '^19.2.2',
      '@types/react-dom': '^19.2.2',
    },
    mountElementId: 'root',
  },
}

export function getManagedReactProfile(runtime: MatrixReactRuntime): ManagedReactProfile {
  return managedReactProfiles[runtime]
}

export function createManagedReactMainSource(options: {
  entryImportPath: string
  runtime: MatrixReactRuntime
}): string {
  const reactProfile = getManagedReactProfile(options.runtime)

  return [
    "import React from 'react'",
    "import ReactDOM from 'react-dom/client'",
    "import '@reference-ui/react/styles.css'",
    `import { Index } from '${options.entryImportPath}'`,
    '',
    `ReactDOM.createRoot(document.getElementById('${reactProfile.mountElementId}')!).render(`,
    '  <React.StrictMode>',
    '    <Index />',
    '  </React.StrictMode>,',
    ')',
    '',
  ].join('\n')
}