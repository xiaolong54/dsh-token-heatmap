/**
 * Host-half check: the usage route folds a fake session corpus into the
 * per-day, per-model buckets the page expects.
 *
 * Usage: node test/fold.test.mjs
 */

import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { apply } from '../index.js'

// The ledger is written next to the profile state; keep the test off the
// real profile.
process.env.DSH_PROFILE_DIR = mkdtempSync(join(tmpdir(), 'dsh-token-heatmap-'))

/** One fake session with two assistant messages on two days. */
const events = [
  { type: 'request/header', time: Date.parse('2026-11-23T09:00:00+08:00'), data: { header: { config: { provider: 'mini', model: 'MiniMax-M3.1-Flash' } } } },
  { type: 'assistant/message', time: Date.parse('2026-11-23T09:00:05+08:00'), data: { usage: { inputTokens: 100, outputTokens: 20, cacheReadTokens: 900, cacheWriteTokens: 0 }, message: { source: { kind: 'model', provider: 'mini', model: 'MiniMax-M3.1-Flash' } } } },
  { type: 'assistant/message', time: Date.parse('2026-11-24T10:00:05+08:00'), data: { usage: { inputTokens: 5, outputTokens: 1 }, message: { source: { kind: 'model', provider: 'mini', model: 'MiniMax-M3.1-Flash' } } } },
  { type: 'assistant/message', time: Date.parse('2026-11-24T11:00:05+08:00'), data: { usage: { inputTokens: 7, outputTokens: 3 }, message: { source: { kind: 'model', provider: 'deepseek', model: 'deepseek-chat' } } } },
  { type: 'assistant/message', time: Date.parse('2026-11-24T12:00:05+08:00'), data: { message: { source: { kind: 'model', provider: 'mini', model: 'MiniMax-M3.1-Flash' } } } },
]

/** The fake corpus: one readable session and one broken one. */
const sessionQuery = {
  async listSessions() {
    return [{ header: { id: 'a' } }, { header: { id: 'broken' } }]
  },
  async readSession(id) {
    if (id === 'broken') throw new Error('corrupt log')
    return { inheritedEventCount: 0, events }
  },
}

/** Capture the registered route handler. */
let handler
const ctx = {
  sessionQuery,
  connection: { requestRejection: () => undefined },
  webServer: { register: route => { handler = route.handler } },
  effect: fn => fn(),
}

apply(ctx)
assert.equal(typeof handler, 'function', 'the route handler was registered')

/** A minimal response double. */
const response = {
  statusCode: 0,
  headers: {},
  body: '',
  setHeader(name, value) { this.headers[name] = value },
  end(text) { this.body = text ?? '' },
}

// The fold runs in the background; give it a moment to land.
await new Promise(resolve => setTimeout(resolve, 50))

await handler({ method: 'GET', url: '/token-heatmap/usage' }, response)

assert.equal(response.statusCode, 200)
const payload = JSON.parse(response.body)
assert.equal(payload.days.length, 2, 'two days carry usage')

const [first, second] = payload.days
assert.equal(first.day, '2026-11-23')
assert.equal(first.models['mini/MiniMax-M3.1-Flash'].input, 100)
assert.equal(first.models['mini/MiniMax-M3.1-Flash'].output, 20)
assert.equal(first.models['mini/MiniMax-M3.1-Flash'].cacheRead, 900)
assert.equal(first.models['mini/MiniMax-M3.1-Flash'].calls, 1)

assert.equal(second.day, '2026-11-24')
assert.equal(second.models['mini/MiniMax-M3.1-Flash'].input, 5)
assert.equal(second.models['deepseek/deepseek-chat'].input, 7)
assert.equal(second.models['deepseek/deepseek-chat'].calls, 1)

console.log('fold test passed')

// The plugin's background refresh keeps a timer alive.
process.exit(0)
