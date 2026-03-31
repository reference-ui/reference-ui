import type { Conditions as StyledConditions } from '@reference-ui/styled/types/conditions'

type ViewportConditionKey =
  | 'sm'
  | 'smOnly'
  | 'smDown'
  | 'md'
  | 'mdOnly'
  | 'mdDown'
  | 'lg'
  | 'lgOnly'
  | 'lgDown'
  | 'xl'
  | 'xlOnly'
  | 'xlDown'
  | '2xl'
  | '2xlOnly'
  | '2xlDown'
  | 'smToMd'
  | 'smToLg'
  | 'smToXl'
  | 'smTo2xl'
  | 'mdToLg'
  | 'mdToXl'
  | 'mdTo2xl'
  | 'lgToXl'
  | 'lgTo2xl'
  | 'xlTo2xl'

export type FilteredConditionKey =
  | 'base'
  | ViewportConditionKey

export type StyleConditionKey = Exclude<
  keyof StyledConditions,
  FilteredConditionKey
>

export type StyleConditions = Pick<
  StyledConditions,
  StyleConditionKey
>
