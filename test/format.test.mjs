/**
 * Formatter check: the time left until a window resets.
 *
 * Usage: node test/format.test.mjs
 */

import assert from 'node:assert/strict'
import { remainingSpan, spanText } from '../src/format.js'

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

console.log('format test passed')
