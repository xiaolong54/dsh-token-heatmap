/**
 * Plan-parsing check: the providers' answers become windows with a used
 * percentage and a reset time.
 *
 * Usage: node test/plans.test.mjs
 */

import assert from 'node:assert/strict'
import {
  parseCodexWindows,
  parseGlmWindows,
  parseKimiWindows,
  parseMinimaxWindows,
  parseOpencodeWindows,
  planFamily,
  windowLabel,
} from '../plans.js'

/** The answer the MiniMax coding-plan endpoint returns. */
const minimax = {
  base_resp: { status_code: 0, status_msg: 'success' },
  model_remains: [
    {
      start_time: 1795485600000,
      end_time: 1795503600000,
      model_name: 'general',
      current_interval_status: 1,
      current_interval_remaining_percent: 31,
      current_weekly_status: 1,
      current_weekly_remaining_percent: 69,
      weekly_start_time: 1795363200000,
      weekly_end_time: 1795968000000,
    },
    { model_name: 'video', current_interval_remaining_percent: 100, current_weekly_remaining_percent: 100 },
  ],
}

const minimaxWindows = parseMinimaxWindows(minimax)
assert.equal(minimaxWindows.length, 2, 'the interval and the weekly window were read')
assert.equal(minimaxWindows[0].key, 'interval')
assert.equal(minimaxWindows[0].remaining, 31)
assert.equal(minimaxWindows[0].used, 69)
assert.equal(minimaxWindows[0].name, '5 小时窗口')
assert.equal(minimaxWindows[0].resetsAt, 1795503600000)
assert.equal(minimaxWindows[1].key, 'week')
assert.equal(minimaxWindows[1].name, '周窗口')
assert.equal(minimaxWindows[1].remaining, 69)
assert.equal(minimaxWindows[1].resetsAt, 1795968000000)

assert.deepEqual(parseMinimaxWindows({ base_resp: { status_code: 1004, status_msg: 'cookie is missing' } }), [])
assert.deepEqual(parseMinimaxWindows(null), [])
assert.deepEqual(parseMinimaxWindows({}), [])

// The Kimi answer: one limit per window plus the weekly summary.
const kimi = {
  limits: [
    { detail: { used: 25, remaining: 75, limit: 100, name: 'coding', resetTime: 1795500000 }, window: { duration: 300, timeUnit: 'TIME_UNIT_MINUTE' } },
  ],
  usage: { used: 200, remaining: 800, limit: 1000, resetTime: 1795600000 },
}
const kimiWindows = parseKimiWindows(kimi)
assert.equal(kimiWindows.length, 2, 'the limit row and the weekly summary were read')
assert.equal(kimiWindows[0].remaining, 75)
assert.equal(kimiWindows[0].used, 25)
assert.equal(kimiWindows[0].name, '5 小时窗口')
assert.equal(kimiWindows[1].key, 'week')
assert.equal(kimiWindows[1].remaining, 80)

// The GLM answer: a percentage per unit code, and a credit row with a ratio.
const glm = {
  success: true,
  data: {
    level: 'coding',
    limits: [
      { type: 'TOKENS_LIMIT', unit: 3, percentage: 40, nextResetTime: 1795500000 },
      { type: 'TOKENS_LIMIT', unit: 6, percentage: 12, nextResetTime: 1795900000 },
      { type: 'CREDIT_LIMIT', unit: 5, currentValue: 30, usage: 100 },
      { type: 'TIME_LIMIT', unit: 6, percentage: 90 },
    ],
  },
}
const glmWindows = parseGlmWindows(glm)
assert.equal(glmWindows.length, 3, 'the request cap is not a plan window')
assert.equal(glmWindows[0].key, '5h')
assert.equal(glmWindows[0].used, 40)
assert.equal(glmWindows[1].key, 'week')
assert.equal(glmWindows[1].used, 12)
assert.equal(glmWindows[2].key, 'month')
assert.equal(glmWindows[2].used, 30)
assert.deepEqual(parseGlmWindows({ success: false, data: { limits: [] } }), [])

// The OpenCode Go answer: a used percentage per window.
const opencode = { usage: { rolling: { percent: 30, resetsAt: 1795500000 }, weekly: { percent: 55 } } }
const opencodeWindows = parseOpencodeWindows(opencode)
assert.equal(opencodeWindows.length, 2)
assert.equal(opencodeWindows[0].used, 30)
assert.equal(opencodeWindows[0].remaining, 70)
assert.equal(opencodeWindows[1].used, 55)

// The Codex answer: a used percentage per rate-limit window.
const codex = {
  rate_limit: {
    primary_window: { used_percent: 20, limit_window_seconds: 18000, reset_at: 1795500000 },
    secondary_window: { used_percent: 70, limit_window_seconds: 604800, reset_at: 1795900000 },
  },
}
const codexWindows = parseCodexWindows(codex)
assert.equal(codexWindows.length, 2)
assert.equal(codexWindows[0].name, '5 小时窗口')
assert.equal(codexWindows[0].used, 20)
assert.equal(codexWindows[1].name, '周窗口')
assert.equal(codexWindows[1].used, 70)

// The family follows the route id, or the vendor endpoint behind a custom id.
assert.equal(planFamily({ id: 'minimax-cn', baseURL: 'https://api.minimaxi.com/anthropic' })?.id, 'minimax')
assert.equal(planFamily({ id: 'kimi-coding', baseURL: 'https://api.kimi.com/coding/v1' })?.id, 'kimi')
assert.equal(planFamily({ id: 'zai-coding-cn', baseURL: 'https://open.bigmodel.cn/api/coding/paas/v4' })?.id, 'glm')
assert.equal(planFamily({ id: 'openai-codex', baseURL: 'https://chatgpt.com/backend-api' })?.id, 'codex')
assert.equal(planFamily({ id: 'my-mini', baseURL: 'https://api.minimax.cn/v1' })?.id, 'minimax')
assert.equal(planFamily({ id: 'my-mini', baseURL: 'https://api.minimax.cn/v1' })?.id, 'minimax')
assert.equal(planFamily({ id: 'kimi-2', baseURL: 'https://api.kimi.com/coding/v1' })?.id, 'kimi')
assert.equal(planFamily({ id: 'qwen', baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1' }), null)
assert.equal(planFamily({ id: 'deepseek', baseURL: 'https://api.deepseek.com' }), null)

assert.equal(windowLabel('week'), '周窗口')
assert.equal(windowLabel('month'), '月窗口')
assert.equal(windowLabel('', 86400), '日窗口')
assert.equal(windowLabel('', 18000), '5 小时窗口')

console.log('plans test passed')
