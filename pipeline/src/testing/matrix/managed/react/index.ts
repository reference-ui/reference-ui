import type { MatrixReactRuntime } from '../../discovery/index.js'
import { managedGeneratedNotice, renderManagedTemplate } from '../template.js'

interface ManagedReactProfile {
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  mountApi: 'createRoot' | 'render'
  mountElementId: string
}

const managedReactProfiles: Record<MatrixReactRuntime, ManagedReactProfile> = {
  react17: {
    dependencies: {
      react: '^17.0.2',
      'react-dom': '^17.0.2',
    },
    devDependencies: {
      '@types/react': '^17.0.83',
      '@types/react-dom': '^17.0.26',
    },
    mountApi: 'render',
    mountElementId: 'root',
  },
  react18: {
    dependencies: {
      react: '^18.3.1',
      'react-dom': '^18.3.1',
    },
    devDependencies: {
      '@types/react': '^18.3.18',
      '@types/react-dom': '^18.3.5',
    },
    mountApi: 'createRoot',
    mountElementId: 'root',
  },
  react19: {
    dependencies: {
      react: '^19.2.0',
      'react-dom': '^19.2.0',
    },
    devDependencies: {
      '@types/react': '^19.2.2',
      '@types/react-dom': '^19.2.2',
    },
    mountApi: 'createRoot',
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

  return renderManagedTemplate(new URL('./templates/main.tsx.liquid', import.meta.url), {
    entryImportPath: options.entryImportPath,
    generatedNotice: managedGeneratedNotice,
    mountApi: reactProfile.mountApi,
    mountElementId: reactProfile.mountElementId,
  })
}