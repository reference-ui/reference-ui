import * as React from 'react'
import { Calendar } from '@reference-ui/lib'

export function CalendarFixture() {
  const [value, setValue] = React.useState<string | null>('2026-08-15')

  return (
    <div data-testid="calendar-fixture-root">
      <h1>Calendar Fixture</h1>

      <div style={{ margin: '16px 0' }}>
        <Calendar
          data-testid="test-calendar"
          month="2026-08"
          value={value}
          onChange={setValue}
        />
      </div>

      <p data-testid="calendar-value-display">
        Selected Date: {value ?? 'None'}
      </p>
    </div>
  )
}
