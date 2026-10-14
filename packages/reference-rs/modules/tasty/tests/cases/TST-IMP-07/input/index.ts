import * as diagnostics from './diagnostics'

declare namespace Shapes {
  export interface Circle {
    radius: number
  }
}

import Span = diagnostics.ByteSpan
import Round = Shapes.Circle
export import Ring = Shapes.Circle

declare namespace Reports {
  import Mark = diagnostics.ByteSpan

  export interface Report {
    mark: Mark
  }
}

export interface UsesAliases {
  span: Span
  round: Round
  ring: Ring
  report: Reports.Report
}
