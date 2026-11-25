/**
 * Formatter check: the time left until a window resets.
 *
 * Usage: node test/format.test.mjs
 */

import assert from 'node:assert/strict'
import { barWidth, remainingPercent, remainingSpan, spanText } from '../src/format.js'

const NOW = Date.parse('2026-11-24T12:00:00+08:00')
const DAY = 86_400_000
const HOUR = 3_600_000

/** A translate function that echoes the key, so the test reads the numbers. */
const t = (key, values) => `${key}:${values?.n ?? ''}`

assert.deepEqual(remainingSpan(NOW + 3 * DAY + 4 * HOUR, NOW), { days: 3, hours: 4, minutes: 0 })
assert.equal(spanText(remainingSpan(NOW + 3 * DAY + 4 * HOUR, NOW), t), 'span.days:3 span.hours:4')

assert.deepEqual(remainingSpan(NOW + 5 * HOUR + 30 * 60_000, NOW), { days: 0, hours: 5, minutes: 30 })
assert.equal(spanText(remainingSpan(NOW + 5 * HOUR + 30 * 60_000, NOW), t), 'span.hours:5')

assert.deepEqual(remainingSpan(NOW + 20 * 60_000, NOW), { days: 0, hours: 0, minutes: 20 })
assert.equal(spanText(remainingSpan(NOW + 20 * 60_000, NOW), t), 'span.minutes:20')

// A day with no hours left still reads as days.
assert.equal(spanText(remainingSpan(NOW + 2 * DAY, NOW), t), 'span.days:2')

// A window that has already reset, or has no reset time, has no span.
assert.equal(remainingSpan(NOW - 1000, NOW), null)
assert.equal(remainingSpan(undefined, NOW), null)
assert.equal(spanText(null, t), '')

// A window that was barely touched must not read as a full one.
assert.equal(remainingPercent(100), '100')
assert.equal(remainingPercent(0), '0')
assert.equal(remainingPercent(99.857), '99.9')
assert.equal(remainingPercent(99.999), '99.9')
assert.equal(remainingPercent(0.05), '<0.1')
assert.equal(remainingPercent(63.4), '63.4')

// A window that was used a little still shows a sliver of the bar.
assert.equal(barWidth(0), '0%')
assert.equal(barWidth(100), '100%')
assert.equal(barWidth(0.14), 'max(2px, 0.14%)')
assert.equal(barWidth(37.5), 'max(2px, 37.50%)')

console.log('format test passed')
