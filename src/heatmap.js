/**
 * Pure layout helpers for the token heatmap.
 *
 * The grid is laid out month by month: every month is its own block of the
 * month's days, one cell per day, so a month reads as the roughly thirty
 * cells it has. Everything here is pure so the page can recompute the grid
 * whenever the selected model or the fetched data changes.
 */

/** Weekday index of a `Date`, with Monday as 0. */
function weekdayIndex(date) {
  return (date.getDay() + 6) % 7
}

/** Format a `Date` as `YYYY-MM-DD` in local time. */
export function formatDay(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Shift a date by whole days. */
export function addDays(date, amount) {
  const next = new Date(date.getTime())
  next.setDate(next.getDate() + amount)
  return next
}

/** First day of the month that holds `date`. */
export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/** Shift a month offset, always on the first of a month. */
function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

/** The number of days in the month that holds `date`. */
export function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

/**
 * Build the month blocks that cover the visible window.
 *
 * @param {Map<string, { total: number, calls: number }>} values - day totals.
 * @param {object} options - the window options.
 * @param {number} options.months - how many calendar months to show.
 * @param {Date} options.today - the last day of the window.
 * @returns {object[]} the month blocks, oldest first.
 */
export function monthBlocks(values, { months = 12, today = new Date() } = {}) {
  const blocks = []
  const last = startOfMonth(today)
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const monthStart = addMonths(last, -offset)
    const year = monthStart.getFullYear()
    const month = monthStart.getMonth()
    const total = daysInMonth(monthStart)
    const cells = []
    for (let day = 1; day <= total; day += 1) {
      const date = new Date(year, month, day)
      const text = formatDay(date)
      const value = values.get(text)
      cells.push({
        day,
        date,
        text,
        future: date > today,
        today: text === formatDay(today),
        total: value ? value.total : 0,
        calls: value ? value.calls : 0,
      })
    }
    blocks.push({
      key: `${year}-${month + 1}`,
      year,
      month,
      leading: weekdayIndex(monthStart),
      cells,
    })
  }
  return blocks
}

/**
 * The months of the visible window, newest first.
 *
 * @param {object} options - the window options.
 * @param {number} options.months - how many calendar months to offer.
 * @param {Date} options.today - the last day of the window.
 * @returns {object[]} the months, newest first.
 */
export function monthList({ months = 12, today = new Date() } = {}) {
  const list = []
  const last = startOfMonth(today)
  for (let offset = 0; offset < months; offset += 1) {
    const monthStart = addMonths(last, -offset)
    list.push({ key: `${monthStart.getFullYear()}-${monthStart.getMonth() + 1}`, year: monthStart.getFullYear(), month: monthStart.getMonth() })
  }
  return list
}

/**
 * Build the month block of one month.
 *
 * @param {Map<string, { total: number, calls: number }>} values - day totals.
 * @param {object} options - the month options.
 * @param {number} options.year - the month's year.
 * @param {number} options.month - the month's zero-based month.
 * @param {Date} options.today - the current day.
 * @returns {object} the month block.
 */
export function monthBlock(values, { year, month, today = new Date() } = {}) {
  const monthStart = new Date(year, month, 1)
  const total = daysInMonth(monthStart)
  const cells = []
  for (let day = 1; day <= total; day += 1) {
    const date = new Date(year, month, day)
    const text = formatDay(date)
    const value = values.get(text)
    cells.push({
      day,
      date,
      text,
      future: date > today,
      today: text === formatDay(today),
      total: value ? value.total : 0,
      calls: value ? value.calls : 0,
    })
  }
  return { key: `${year}-${month + 1}`, year, month, leading: weekdayIndex(monthStart), cells }
}

/**
 * The totals of one month.
 *
 * @param {Map<string, { total: number, calls: number }>} values - day totals.
 * @param {object} options - the month options.
 * @param {number} options.year - the month's year.
 * @param {number} options.month - the month's zero-based month.
 * @returns {object} the month's total, calls and active days.
 */
export function monthTotals(values, { year, month }) {
  let total = 0
  let calls = 0
  let activeDays = 0
  const days = daysInMonth(new Date(year, month, 1))
  for (let day = 1; day <= days; day += 1) {
    const entry = values.get(formatDay(new Date(year, month, day)))
    if (entry === undefined) continue
    total += entry.total
    calls += entry.calls
    if (entry.total > 0) activeDays += 1
  }
  return { total, calls, activeDays }
}

/**
 * Pick the four intensity cut points the cells are drawn with.
 *
 * The cut points follow the contribution-graph convention: the thresholds are
 * the quartiles of the days that carry usage, so a calm month does not look
 * busy and a heavy day still reads as the peak.
 *
 * @param {number[]} values - the non-zero daily totals in range.
 * @returns {number[]} four ascending cut points.
 */
export function intensityThresholds(values) {
  if (values.length === 0) return [0, 0, 0, 0]
  const sorted = [...values].sort((left, right) => left - right)
  const at = (fraction) => sorted[Math.min(sorted.length - 1, Math.floor(fraction * sorted.length))]
  return [at(0.25), at(0.5), at(0.75), sorted[sorted.length - 1]]
}

/**
 * Map one daily total onto an intensity level from 0 (empty) to 4 (peak).
 *
 * @param {number} total - the day's total.
 * @param {number[]} thresholds - the ascending cut points.
 * @returns {number} the level.
 */
export function intensityLevel(total, thresholds) {
  if (!total || total <= 0) return 0
  let level = 1
  for (const threshold of thresholds) {
    if (total > threshold) level += 1
  }
  return Math.min(4, level)
}

/**
 * Aggregate the fetched day rows into the numbers the page shows.
 *
 * @param {object[]} days - the day rows from the host.
 * @param {string | undefined} model - the selected model key, if any.
 * @returns {object} the totals, the day map and the per-model rows.
 */
export function summarize(days, model) {
  const values = new Map()
  const models = new Map()
  let total = 0
  let calls = 0
  let input = 0
  let output = 0
  let cacheRead = 0
  let cacheWrite = 0
  let activeDays = 0

  for (const day of days) {
    let dayTotal = 0
    let dayCalls = 0
    for (const [key, entry] of Object.entries(day.models ?? {})) {
      const entryTotal = (entry.input ?? 0) + (entry.output ?? 0) + (entry.cacheRead ?? 0) + (entry.cacheWrite ?? 0)
      const row = models.get(key) ?? { key, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, calls: 0, total: 0 }
      row.input += entry.input ?? 0
      row.output += entry.output ?? 0
      row.cacheRead += entry.cacheRead ?? 0
      row.cacheWrite += entry.cacheWrite ?? 0
      row.calls += entry.calls ?? 0
      row.total += entryTotal
      models.set(key, row)

      if (model === undefined || key === model) {
        dayTotal += entryTotal
        dayCalls += entry.calls ?? 0
      }
    }
    values.set(day.day, { total: dayTotal, calls: dayCalls })
    if (dayTotal > 0) activeDays += 1
    total += dayTotal
    calls += dayCalls
  }

  const modelRows = [...models.values()].sort((left, right) => right.total - left.total)
  for (const row of modelRows) {
    if (model === undefined || row.key === model) {
      input += row.input
      output += row.output
      cacheRead += row.cacheRead
      cacheWrite += row.cacheWrite
    }
  }

  const context = input + cacheRead + cacheWrite
  const cacheHitRate = context > 0 ? cacheRead / context : 0

  let peak = { day: '', total: 0, calls: 0 }
  for (const [day, entry] of values) {
    if (entry.total > peak.total) peak = { day, total: entry.total, calls: entry.calls }
  }

  return {
    values,
    models: modelRows,
    total,
    calls,
    input,
    output,
    cacheRead,
    cacheWrite,
    activeDays,
    peak,
    cacheHitRate,
  }
}
