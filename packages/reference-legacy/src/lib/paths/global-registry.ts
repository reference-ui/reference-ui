import { existsSync, mkdirSync, readFileSync, renameSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { resolveRefConfigFile } from './ref-config'

export interface ProjectEntry {
  configPath: string
  lastActive: string
}

export interface RegistryData {
  version: 1
  projects: Record<string, ProjectEntry>
}

export class GlobalProjectRegistry {
  private static overridePath: string | null = null

  static setRegistryPathForTesting(customPath: string | null): void {
    this.overridePath = customPath
  }

  static getRegistryPath(): string {
    return (
      this.overridePath ??
      process.env.REF_REGISTRY_PATH ??
      join(homedir(), '.reference-ui', 'registry.json')
    )
  }

  static read(): { projects: Record<string, ProjectEntry>; sanitizedCount: number } {
    const registryPath = this.getRegistryPath()
    if (!existsSync(registryPath)) {
      return { projects: {}, sanitizedCount: 0 }
    }

    try {
      const raw = JSON.parse(readFileSync(registryPath, 'utf8')) as RegistryData
      const projects: Record<string, ProjectEntry> = raw.projects ?? {}
      const valid: Record<string, ProjectEntry> = {}
      let sanitizedCount = 0

      for (const [projectPath, entry] of Object.entries(projects)) {
        if (entry && typeof entry.configPath === 'string' && existsSync(entry.configPath)) {
          valid[projectPath] = entry
        } else {
          sanitizedCount++
        }
      }

      if (sanitizedCount > 0) {
        this.write(valid)
      }

      return { projects: valid, sanitizedCount }
    } catch {
      // Corrupted file — back up and start fresh
      try {
        const backupPath = `${registryPath}.bak`
        renameSync(registryPath, backupPath)
      } catch {
        // backup is best-effort
      }
      return { projects: {}, sanitizedCount: 0 }
    }
  }

  static upsert(rawProjectPath: string): void {
    const configPath = resolveRefConfigFile(rawProjectPath)
    if (!configPath) return

    let projectPath = resolve(rawProjectPath)
    try {
      projectPath = realpathSync(projectPath)
    } catch {
      // Keep resolved path if realpathSync fails
    }

    const { projects } = this.read()
    projects[projectPath] = {
      configPath,
      lastActive: new Date().toISOString(),
    }

    this.write(projects)
  }

  private static write(projects: Record<string, ProjectEntry>): void {
    const registryPath = this.getRegistryPath()
    try {
      mkdirSync(dirname(registryPath), { recursive: true })
      const tmpPath = `${registryPath}.tmp.${process.pid}.${Date.now()}`
      writeFileSync(tmpPath, JSON.stringify({ version: 1, projects }, null, 2), 'utf8')
      renameSync(tmpPath, registryPath)
    } catch {
      // Non-fatal — registry writes must never break CLI commands
    }
  }
}
