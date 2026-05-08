import { formatDuration } from '../../lib/log/index.js'

export interface MatrixSetupMilestone {
  durationMs: number
  label: string
  summaryLabel: string
}

const ansiPattern = /\u001B(?:\][^\u0007]*(?:\u0007|\u001B\\)|\[[0-?]*[ -/]*[@-~]|[@-Z\\-_])/g
const refSyncLogPrefixPattern = /^ref\s+→\s+sync\s+/i

function stripAnsi(value: string): string {
  return value.replace(ansiPattern, '')
}

function durationMsFromSeconds(secondsText: string): number {
  return Math.round(Number.parseFloat(secondsText) * 1000)
}

export function parseRefSyncSetupMilestones(output: string): MatrixSetupMilestone[] {
  const milestones: MatrixSetupMilestone[] = []
  let packageBuildIndex = 0

  for (const rawLine of stripAnsi(output).split(/\r?\n/)) {
    const line = rawLine.trim().replace(refSyncLogPrefixPattern, '')

    if (line.length === 0) {
      continue
    }

    const builtPackagesMatch = line.match(/^Built (\d+) package\(s\) in ([0-9]+(?:\.[0-9]+)?)s$/)

    if (builtPackagesMatch) {
      packageBuildIndex += 1
      const packageCount = builtPackagesMatch[1]
      const labels = [
        {
          label: `Built runtime package(s) (${packageCount})`,
          summaryLabel: 'runtime-packages',
        },
        {
          label: `Built final package(s) (${packageCount})`,
          summaryLabel: 'final-packages',
        },
      ]
      const labelSet = labels[packageBuildIndex - 1] ?? {
        label: `Built package batch ${packageBuildIndex} (${packageCount})`,
        summaryLabel: `packages-${packageBuildIndex}`,
      }

      milestones.push({
        durationMs: durationMsFromSeconds(builtPackagesMatch[2]),
        label: labelSet.label,
        summaryLabel: labelSet.summaryLabel,
      })
      continue
    }

    const directMatches: Array<{
      label: string
      pattern: RegExp
      summaryLabel: string
    }> = [
      {
        label: 'Prepared virtual workspace',
        pattern: /^Prepared virtual workspace in ([0-9]+(?:\.[0-9]+)?)s$/,
        summaryLabel: 'virtual',
      },
      {
        label: 'Generated system config',
        pattern: /^Generated system config in ([0-9]+(?:\.[0-9]+)?)s$/,
        summaryLabel: 'system-config',
      },
      {
        label: 'Generated Panda output',
        pattern: /^Generated Panda output in ([0-9]+(?:\.[0-9]+)?)s$/,
        summaryLabel: 'panda',
      },
      {
        label: 'Generated runtime TypeScript declarations',
        pattern: /^Generated runtime TypeScript declarations in ([0-9]+(?:\.[0-9]+)?)s$/,
        summaryLabel: 'runtime-dts',
      },
      {
        label: 'Built reference',
        pattern: /^Built reference in ([0-9]+(?:\.[0-9]+)?)s$/,
        summaryLabel: 'reference',
      },
      {
        label: 'Generated library TypeScript declarations',
        pattern: /^Generated library TypeScript declarations in ([0-9]+(?:\.[0-9]+)?)s$/,
        summaryLabel: 'library-dts',
      },
      {
        label: 'Sync ready',
        pattern: /^Ready in ([0-9]+(?:\.[0-9]+)?)s$/,
        summaryLabel: 'ready',
      },
      {
        label: 'Sync complete',
        pattern: /^Sync complete in ([0-9]+(?:\.[0-9]+)?)s$/,
        summaryLabel: 'sync-total',
      },
    ]

    for (const candidate of directMatches) {
      const match = line.match(candidate.pattern)

      if (!match) {
        continue
      }

      milestones.push({
        durationMs: durationMsFromSeconds(match[1]),
        label: candidate.label,
        summaryLabel: candidate.summaryLabel,
      })
      break
    }
  }

  return milestones
}

export function formatRefSyncSetupMilestoneSummary(
  milestones: readonly MatrixSetupMilestone[],
): string {
  const summaryMilestones = milestones.filter(milestone => milestone.summaryLabel !== 'sync-total')
  const effectiveMilestones = summaryMilestones.length > 0 ? summaryMilestones : milestones

  return effectiveMilestones
    .map(milestone => `${milestone.summaryLabel}=${formatDuration(milestone.durationMs)}`)
    .join(', ')
}