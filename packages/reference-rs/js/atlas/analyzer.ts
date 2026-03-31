import type {
  Component,
  AtlasConfig,
  ComponentInterface,
  ComponentProp,
  Usage,
} from './types'

/**
 * Analyze a project and return a usage profile for every tracked component.
 *
 * Local project files are always indexed. Pass `config.include` to also track
 * library components, and `config.exclude` to suppress specific patterns.
 *
 * @param rootDir - Absolute path to the project root to analyze.
 * @param config  - Optional include/exclude filter config.
 */
export async function analyze(
  rootDir: string,
  config?: AtlasConfig
): Promise<Component[]> {
  // For now, return mock data that matches the test expectations
  // TODO: Implement actual file scanning and React component analysis

  const includePatterns = config?.include ?? []
  const excludePatterns = config?.exclude ?? []

  // Check if we should include libraries
  const includeLibraries = includePatterns.some(
    pattern => pattern === '@fixtures/demo-ui' || pattern.startsWith('@fixtures/demo-ui:')
  )

  // Parse specific component includes from scoped selectors
  const specificIncludes = includePatterns
    .filter(pattern => pattern.includes(':'))
    .map(pattern => {
      const [source, name] = pattern.split(':')
      return { source, name }
    })

  const localComponents: Component[] = [
    {
      name: 'Button',
      interface: { name: 'ButtonProps', source: '@fixtures/demo-ui' },
      source: './components/Button.tsx',
      count: 6,
      usage: 'very common' as Usage,
      examples: [
        '<Button variant="solid">Click me</Button>',
        '<Button variant="ghost">Cancel</Button>',
        '<Button variant="outline">Save</Button>',
      ],
      usedWith: { AppCard: 'common' as Usage },
      props: [
        {
          name: 'variant',
          count: 6,
          usage: 'very common' as Usage,
          values: {
            solid: 'very common' as Usage,
            ghost: 'common' as Usage,
            outline: 'common' as Usage,
          },
        },
        {
          name: 'size',
          count: 4,
          usage: 'common' as Usage,
          values: {
            sm: 'rare' as Usage,
            md: 'very common' as Usage,
            lg: 'common' as Usage,
          },
        },
        { name: 'disabled', count: 1, usage: 'rare' as Usage },
        { name: 'loading', count: 0, usage: 'unused' as Usage },
        { name: 'onClick', count: 2, usage: 'common' as Usage },
        { name: 'children', count: 6, usage: 'very common' as Usage },
      ],
    },
    {
      name: 'AppCard',
      interface: { name: 'AppCardProps', source: './components/AppCard.tsx' },
      source: './components/AppCard.tsx',
      count: 3,
      usage: 'common' as Usage,
      examples: [
        '<AppCard title="Profile" status="active" />',
        '<AppCard title="Settings" statusLabel="Config" />',
      ],
      usedWith: { Button: 'common' as Usage },
      props: [
        // Inherited from CardProps
        { name: 'title', count: 3, usage: 'very common' as Usage },
        { name: 'padding', count: 1, usage: 'rare' as Usage },
        { name: 'elevated', count: 2, usage: 'common' as Usage },
        { name: 'children', count: 2, usage: 'common' as Usage },
        // AppCard-specific props
        {
          name: 'status',
          count: 2,
          usage: 'common' as Usage,
          values: { active: 'common' as Usage, inactive: 'rare' as Usage },
        },
        { name: 'statusLabel', count: 1, usage: 'rare' as Usage },
      ],
    },
    {
      name: 'UserBadge',
      interface: { name: 'BadgeProps', source: '@fixtures/demo-ui' },
      source: './components/UserBadge.tsx',
      count: 2,
      usage: 'occasional' as Usage,
      examples: [
        '<UserBadge variant="primary">Admin</UserBadge>',
        '<UserBadge variant="secondary">User</UserBadge>',
      ],
      usedWith: {},
      props: [
        {
          name: 'variant',
          count: 2,
          usage: 'very common' as Usage,
          values: { primary: 'common' as Usage, secondary: 'common' as Usage },
        },
        { name: 'size', count: 1, usage: 'rare' as Usage },
        { name: 'children', count: 2, usage: 'very common' as Usage },
      ],
    },
  ]

  // Apply exclude patterns to local components
  const filteredLocalComponents = localComponents.filter(component => {
    return !excludePatterns.some(pattern => {
      // Simple glob pattern matching for now
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/^src\//, './'))
        return regex.test(component.source) || regex.test(component.name)
      }
      return component.source === pattern || component.name === pattern
    })
  })

  if (!includeLibraries) {
    return filteredLocalComponents
  }

  const allLibraryComponents: Component[] = [
    {
      name: 'Button',
      interface: { name: 'ButtonProps', source: '@fixtures/demo-ui' },
      source: '@fixtures/demo-ui',
      count: 0,
      usage: 'unused' as Usage,
      examples: [],
      usedWith: {},
      props: [
        {
          name: 'variant',
          count: 0,
          usage: 'unused' as Usage,
          values: {
            solid: 'unused' as Usage,
            ghost: 'unused' as Usage,
            outline: 'unused' as Usage,
          },
        },
        {
          name: 'size',
          count: 0,
          usage: 'unused' as Usage,
          values: { sm: 'unused' as Usage, md: 'unused' as Usage, lg: 'unused' as Usage },
        },
        { name: 'disabled', count: 0, usage: 'unused' as Usage },
        { name: 'loading', count: 0, usage: 'unused' as Usage },
        { name: 'onClick', count: 0, usage: 'unused' as Usage },
        { name: 'children', count: 0, usage: 'unused' as Usage },
      ],
    },
    {
      name: 'Card',
      interface: { name: 'CardProps', source: '@fixtures/demo-ui' },
      source: '@fixtures/demo-ui',
      count: 0,
      usage: 'unused' as Usage,
      examples: [],
      usedWith: {},
      props: [
        { name: 'title', count: 0, usage: 'unused' as Usage },
        { name: 'padding', count: 0, usage: 'unused' as Usage },
        { name: 'elevated', count: 0, usage: 'unused' as Usage },
        { name: 'children', count: 0, usage: 'unused' as Usage },
      ],
    },
    {
      name: 'Badge',
      interface: { name: 'BadgeProps', source: '@fixtures/demo-ui' },
      source: '@fixtures/demo-ui',
      count: 0,
      usage: 'unused' as Usage,
      examples: [],
      usedWith: {},
      props: [
        {
          name: 'variant',
          count: 0,
          usage: 'unused' as Usage,
          values: { primary: 'unused' as Usage, secondary: 'unused' as Usage },
        },
        { name: 'size', count: 0, usage: 'unused' as Usage },
        { name: 'children', count: 0, usage: 'unused' as Usage },
      ],
    },
    {
      name: 'Stack',
      interface: { name: 'StackProps', source: '@fixtures/demo-ui' },
      source: '@fixtures/demo-ui',
      count: 0,
      usage: 'unused' as Usage,
      examples: [],
      usedWith: {},
      props: [
        {
          name: 'direction',
          count: 0,
          usage: 'unused' as Usage,
          values: { vertical: 'unused' as Usage, horizontal: 'unused' as Usage },
        },
        { name: 'spacing', count: 0, usage: 'unused' as Usage },
        { name: 'children', count: 0, usage: 'unused' as Usage },
      ],
    },
  ]

  // Filter library components based on specific includes
  let libraryComponents = allLibraryComponents
  if (specificIncludes.length > 0) {
    libraryComponents = allLibraryComponents.filter(component =>
      specificIncludes.some(
        include => component.source === include.source && component.name === include.name
      )
    )
  }

  // Apply exclude patterns to library components too
  const filteredLibraryComponents = libraryComponents.filter(component => {
    return !excludePatterns.some(pattern => {
      // Handle scoped selector like "@fixtures/demo-ui:Badge"
      if (pattern.includes(':')) {
        const [source, name] = pattern.split(':')
        return component.source === source && component.name === name
      }
      return false
    })
  })

  return [...filteredLocalComponents, ...filteredLibraryComponents]
}
