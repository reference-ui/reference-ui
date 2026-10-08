export type ISODate = `${number}-${number}-${number}`
export type ISOMonth = `${number}-${number}`
export type ISOYear = `${number}`
export type CalendarWeekday =
  | 'sun'
  | 'mon'
  | 'tue'
  | 'wed'
  | 'thu'
  | 'fri'
  | 'sat'
export type CalendarMode = 'day' | 'range' | 'month' | 'year'
export interface CalendarDateRange {
  start: ISODate
  end: ISODate | null
}

const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/
const ISO_MONTH_REGEX = /^(\d{4})-(\d{2})$/
const ISO_YEAR_REGEX = /^(\d{4})$/

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export function getDaysInMonth(year: number, month: number): number {
  switch (month) {
    case 1:
      return 31
    case 2:
      return isLeapYear(year) ? 29 : 28
    case 3:
      return 31
    case 4:
      return 30
    case 5:
      return 31
    case 6:
      return 30
    case 7:
      return 31
    case 8:
      return 31
    case 9:
      return 30
    case 10:
      return 31
    case 11:
      return 30
    case 12:
      return 31
    default:
      return 0
  }
}

export function isValidISODate(str: unknown): str is ISODate {
  if (typeof str !== 'string') return false
  const match = ISO_DATE_REGEX.exec(str)
  if (!match) return false
  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  const day = parseInt(match[3], 10)
  if (year < 1 || year > 9999) return false
  if (month < 1 || month > 12) return false
  const maxDay = getDaysInMonth(year, month)
  if (day < 1 || day > maxDay) return false
  return true
}

export function isValidISOMonth(str: unknown): str is ISOMonth {
  if (typeof str !== 'string') return false
  const match = ISO_MONTH_REGEX.exec(str)
  if (!match) return false
  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  if (year < 1 || year > 9999) return false
  if (month < 1 || month > 12) return false
  return true
}

export function isValidISOYear(str: unknown): str is ISOYear {
  if (typeof str !== 'string') return false
  const match = ISO_YEAR_REGEX.exec(str)
  if (!match) return false
  const year = parseInt(match[1], 10)
  if (year < 1 || year > 9999) return false
  return true
}

export function parseISODate(str: string): { year: number; month: number; day: number } {
  if (!isValidISODate(str)) {
    throw new Error(
      `Invalid ISO calendar date: "${str}". Expected canonical YYYY-MM-DD within 0001-01-01 to 9999-12-31.`
    )
  }
  const parts = str.split('-')
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10),
    day: parseInt(parts[2], 10),
  }
}

export function parseISOMonth(str: string): { year: number; month: number } {
  if (!isValidISOMonth(str)) {
    throw new Error(
      `Invalid ISO month: "${str}". Expected canonical YYYY-MM within 0001-01 to 9999-12.`
    )
  }
  const parts = str.split('-')
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10),
  }
}

export function parseISOYear(str: string): { year: number } {
  if (!isValidISOYear(str)) {
    throw new Error(
      `Invalid ISO year: "${str}". Expected canonical YYYY within 0001 to 9999.`
    )
  }
  return {
    year: parseInt(str, 10),
  }
}

export function formatISODate(year: number, month: number, day: number): ISODate {
  const y = String(year).padStart(4, '0')
  const m = String(month).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${y}-${m}-${d}` as ISODate
}

export function formatISOMonth(year: number, month: number): ISOMonth {
  const y = String(year).padStart(4, '0')
  const m = String(month).padStart(2, '0')
  return `${y}-${m}` as ISOMonth
}

export function formatISOYear(year: number): ISOYear {
  return String(year).padStart(4, '0') as ISOYear
}

// Sakamoto algorithm: returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday
export function getDayOfWeek(year: number, month: number, day: number): number {
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]
  let y = year
  if (month < 3) {
    y -= 1
  }
  return (
    (y +
      Math.floor(y / 4) -
      Math.floor(y / 100) +
      Math.floor(y / 400) +
      t[month - 1] +
      day) %
    7
  )
}

export function addCalendarDays(date: ISODate, days: number): ISODate {
  const { year, month, day } = parseISODate(date)
  let y = year
  let m = month
  let d = day + days

  if (d > 0) {
    let daysInM = getDaysInMonth(y, m)
    while (d > daysInM) {
      d -= daysInM
      m += 1
      if (m > 12) {
        m = 1
        y += 1
      }
      daysInM = getDaysInMonth(y, m)
    }
  } else {
    while (d <= 0) {
      m -= 1
      if (m < 1) {
        m = 12
        y -= 1
      }
      d += getDaysInMonth(y, m)
    }
  }

  if (y < 1 || y > 9999) {
    throw new Error(
      `Calendar day arithmetic overflow/underflow outside 0001-01-01 to 9999-12-31 (result year ${y})`
    )
  }

  return formatISODate(y, m, d)
}

export function addCalendarMonths(date: ISODate, months: number): ISODate
export function addCalendarMonths(month: ISOMonth, amount: number): ISOMonth
export function addCalendarMonths(
  dateOrMonth: ISODate | ISOMonth,
  amount: number
): ISODate | ISOMonth {
  if (isValidISODate(dateOrMonth)) {
    const { year, month, day } = parseISODate(dateOrMonth)
    const totalMonths = (year - 1) * 12 + (month - 1) + amount
    const newYear = Math.floor(totalMonths / 12) + 1
    const newMonth = ((totalMonths % 12) + 12) % 12 + 1
    if (newYear < 1 || newYear > 9999) {
      throw new Error(
        `Calendar month arithmetic overflow/underflow outside 0001 to 9999 (result year ${newYear})`
      )
    }
    const maxDays = getDaysInMonth(newYear, newMonth)
    const newDay = Math.min(day, maxDays)
    return formatISODate(newYear, newMonth, newDay)
  }

  if (isValidISOMonth(dateOrMonth)) {
    const { year, month } = parseISOMonth(dateOrMonth)
    const totalMonths = (year - 1) * 12 + (month - 1) + amount
    const newYear = Math.floor(totalMonths / 12) + 1
    const newMonth = ((totalMonths % 12) + 12) % 12 + 1
    if (newYear < 1 || newYear > 9999) {
      throw new Error(
        `Calendar month arithmetic overflow/underflow outside 0001 to 9999 (result year ${newYear})`
      )
    }
    return formatISOMonth(newYear, newMonth)
  }

  throw new Error(
    `Invalid ISO date or month: "${dateOrMonth}". Expected canonical YYYY-MM-DD or YYYY-MM.`
  )
}

export function calendarMonth(value: ISODate | ISOMonth | ISOYear): ISOMonth {
  if (isValidISODate(value)) {
    return value.slice(0, 7) as ISOMonth
  }
  if (isValidISOMonth(value)) {
    return value
  }
  if (isValidISOYear(value)) {
    return `${value}-01` as ISOMonth
  }
  throw new Error(
    `Invalid calendar value: "${value}". Expected canonical YYYY-MM-DD, YYYY-MM, or YYYY.`
  )
}

export function startOfCalendarMonth(date: ISODate): ISODate {
  const { year, month } = parseISODate(date)
  return formatISODate(year, month, 1)
}

export function endOfCalendarMonth(date: ISODate): ISODate {
  const { year, month } = parseISODate(date)
  const lastDay = getDaysInMonth(year, month)
  return formatISODate(year, month, lastDay)
}

export function startOfCalendarYear(date: ISODate): ISODate {
  const { year } = parseISODate(date)
  return formatISODate(year, 1, 1)
}

export function endOfCalendarYear(date: ISODate): ISODate {
  const { year } = parseISODate(date)
  return formatISODate(year, 12, 31)
}

export function compareISODate(a: ISODate, b: ISODate): number {
  if (!isValidISODate(a) || !isValidISODate(b)) {
    throw new Error(
      `Cannot compare invalid ISO dates: "${a}" and "${b}". Both must be canonical YYYY-MM-DD.`
    )
  }
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

export function normalizeDateRange(range: CalendarDateRange): CalendarDateRange {
  if (!range.end) return range
  if (compareISODate(range.start, range.end) > 0) {
    return { start: range.end, end: range.start }
  }
  return range
}

export function isDateInRange(
  date: ISODate,
  start: ISODate,
  end: ISODate | null
): boolean {
  if (!end) return date === start
  const norm = normalizeDateRange({ start, end })
  return date >= norm.start && date <= (norm.end as ISODate)
}
