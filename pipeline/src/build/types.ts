/**
 * Shared package model for the pipeline workspace.
 *
 * The pipeline only needs a small subset of package.json metadata, so this
 * module keeps that contract in one place instead of re-declaring it across
 * build, registry, and CLI modules.
 */

export interface WorkspacePackage {
  dependencies: Record<string, string>
  dir: string
  name: string
  private: boolean
  scripts: Record<string, string>
  version: string
}