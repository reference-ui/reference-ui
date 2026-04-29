import type { MatrixReactRuntime } from '../../discovery/index.js'
import { managedGeneratedNotice, renderManagedTemplate } from '../template.js'

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

  return renderManagedTemplate(new URL('./templates/main.tsx.liquid', import.meta.url), {
    entryImportPath: options.entryImportPath,
    generatedNotice: managedGeneratedNotice,
    mountElementId: reactProfile.mountElementId,
  })
}