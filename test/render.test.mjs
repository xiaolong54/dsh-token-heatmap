/**
 * Client-half check: render the built client artifact with a small React
 * shim and a stubbed Host route, then assert the page carries the heatmap,
 * the totals and the model rows.
 *
 * Usage: node test/render.test.mjs
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

/** The Host's answer, taken from a real fold of this machine's sessions. */
const PAYLOAD = {
  updatedAt: 1795496706688,
  plans: [
    {
      id: 'plan-mini',
      provider: 'mini',
      label: 'MiniMax 套餐 · mini',
      windows: [
        // Far enough ahead that the "time left" text never empties.
        { key: 'interval', name: '5 小时窗口', remaining: 71, used: 29, resetsAt: 1900000000000 },
        { key: 'week', name: '周窗口', remaining: 87, used: 13, resetsAt: 1900000000000 },
      ],
    },
    {
      id: 'plan-minimaxtoken',
      provider: 'minimaxtoken',
      label: 'MiniMax 套餐 · minimaxtoken',
      windows: [
        { key: 'interval', name: '5 小时窗口', remaining: 33, used: 67, resetsAt: 1900000000000 },
      ],
    },
  ],
  days: [
    { day: '2026-09-01', models: { 'minimax/MiniMax-M2.7-highspeed': { input: 0, output: 45, cacheRead: 0, cacheWrite: 8102, calls: 1 } } },
    { day: '2026-09-05', models: { 'minimax/MiniMax-M3': { input: 293119, output: 91158, cacheRead: 12465590, cacheWrite: 0, calls: 138 } } },
    { day: '2026-11-15', models: { 'minimax-tokenplan/MiniMax-M3.1-Flash': { input: 4125420, output: 995953, cacheRead: 274464111, cacheWrite: 0, calls: 904 } } },
    { day: '2026-11-22', models: { 'deepseek-account/deepseek-flash': { input: 433732, output: 477509, cacheRead: 118420480, cacheWrite: 0, calls: 411 } } },
    { day: '2026-11-23', models: { 'deepseek-account/deepseek-flash': { input: 164708, output: 177530, cacheRead: 101965568, cacheWrite: 0, calls: 267 } } },
    { day: '2026-11-24', models: {
      'minimaxtoken/MiniMax-M3.1-Flash': { input: 2207770, output: 427619, cacheRead: 186480035, cacheWrite: 0, calls: 609 },
      'mini/MiniMax-M3.1-Flash': { input: 2982663, output: 1056300, cacheRead: 130642663, cacheWrite: 0, calls: 457 },
    } },
  ],
}

/** The React shim: enough of the hooks the page uses. */
function createReact() {
  const effects = []
  let current = null
  const React = {
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat() }),
    useState(initial) {
      const state = current
      const index = state.index++
      if (!(index in state.hooks)) state.hooks[index] = typeof initial === 'function' ? initial() : initial
      const set = (value) => {
        state.hooks[index] = typeof value === 'function' ? value(state.hooks[index]) : value
        state.dirty = true
      }
      return [state.hooks[index], set]
    },
    useEffect(effect, deps) {
      const state = current
      const index = state.index++
      const previous = state.hooks[index]
      const changed = previous === undefined || deps === undefined || deps.some((dep, key) => dep !== previous[key])
      if (changed) {
        state.hooks[index] = deps
        effects.push(effect)
      }
    },
    useMemo(factory, deps) {
      const state = current
      const index = state.index++
      const previous = state.hooks[index]
      if (previous === undefined || deps.some((dep, key) => dep !== previous.deps[key])) {
        state.hooks[index] = { deps, value: factory() }
      }
      return state.hooks[index].value
    },
    useCallback: callback => callback,
    /** Run the effects the last render queued. */
    flush() {
      while (effects.length > 0) {
        const effect = effects.shift()
        const cleanup = effect()
        if (typeof cleanup === 'function') cleanup()
      }
    },
  }
  return {
    React,
    /** The hook state of the component currently rendering. */
    currentState: () => current,
    setCurrentState: state => { current = state },
    effects,
  }
}

const shim = createReact()

/** Load the built artifact and take its plugin body. */
let captured = null
globalThis.window = { __ModuleLoader__: { load: definition => { captured = definition } } }
globalThis.fetch = async () => ({ ok: true, json: async () => PAYLOAD })
const artifact = readFileSync(join(root, 'client.js'), 'utf8')
// eslint-disable-next-line no-new-func
new Function('require', 'window', artifact)(id => {
  if (id === 'react') return shim.React
  throw new Error(`unexpected module ${id}`)
}, globalThis.window)
assert.ok(captured, 'the artifact registered itself')

const plugin = captured.factory(id => {
  if (id === 'react') return shim.React
  throw new Error(`unexpected module ${id}`)
})

/** The fake Client context: the slots and the locale service the page uses. */
const registrations = new Map()
const localeService = {
  getSnapshot: () => ({ active: 'zh' }),
  subscribe: () => () => {},
  register: () => () => {},
}
const ctx = {
  get: name => (name === 'locale' ? localeService : undefined),
  effect: effect => effect(),
  slots: {
    inject: (slot, register) => register(),
    register: (options, component) => {
      registrations.set(options.name, { options, component })
      return () => {}
    },
  },
}
plugin.apply(ctx)
assert.ok(registrations.has('settings.section'), 'the settings section registered')
assert.ok(registrations.has('sidebar.footer.action'), 'the sidebar card registered')
const registered = registrations.get('settings.section').component

/** Render a tree of function components and elements. */
function render(element, states, path) {
  if (element === null || element === undefined || typeof element === 'boolean') return null
  if (typeof element === 'string' || typeof element === 'number') return String(element)
  if (Array.isArray(element)) {
    return element.map((child, index) => render(child, states, `${path}.${index}`)).flat()
  }
  const { type, props, children } = element
  if (typeof type === 'function') {
    const state = states.get(path) ?? { hooks: [], index: 0 }
    states.set(path, state)
    state.index = 0
    const previous = shim.currentState()
    shim.setCurrentState(state)
    const rendered = type({ ...props, children })
    shim.setCurrentState(previous)
    return render(rendered, states, `${path}/`)
  }
  return {
    tag: type,
    props,
    children: children.map((child, index) => render(child, states, `${path}.${index}`)),
  }
}

/** Collect the class names of the rendered tree. */
function classNames(node, found = []) {
  if (node === null || node === undefined) return found
  if (typeof node === 'string') return found
  if (Array.isArray(node)) {
    node.forEach(child => classNames(child, found))
    return found
  }
  if (node.tag !== undefined && node.props?.className !== undefined) found.push(node.props.className)
  classNames(node.children, found)
  return found
}

/** Collect the text of the rendered tree. */
function text(node, found = []) {
  if (node === null || node === undefined) return found
  if (typeof node === 'string') {
    found.push(node)
    return found
  }
  if (Array.isArray(node)) {
    node.forEach(child => text(child, found))
    return found
  }
  text(node.children, found)
  return found
}

/** Render the page, running effects and re-rendering until it settles. */
const states = new Map()
let tree = null
for (let round = 0; round < 10; round += 1) {
  tree = render(h(registered, {}), states, 'root')
  shim.React.flush()
  // The stubbed route answers on a microtask; let the page pick it up.
  await new Promise(resolve => setTimeout(resolve, 0))
  const dirty = [...states.values()].some(state => state.dirty)
  if (!dirty) break
  for (const state of states.values()) state.dirty = false
}

// `h` is the createElement alias the artifact defines; the shim's version.
function h(type, props, ...children) {
  return shim.React.createElement(type, props, ...children)
}

const classes = classNames(tree)
const texts = text(tree)

assert.ok(classes.includes('thm-page'), 'the page rendered')
assert.ok(classes.some(name => name.startsWith('thm-cell')), 'the heatmap cells rendered')
assert.ok(classes.includes('thm-model'), 'the model rows rendered')
assert.ok(classes.includes('thm-month-grid'), 'one month grid rendered')
assert.ok(classes.includes('thm-switch'), 'the month switcher rendered')

const cells = classes.filter(name => name.startsWith('thm-cell')).length
assert.ok(cells >= 28 && cells <= 42, `one month carries its own days (${cells})`)

const levels = classes.filter(name => /^thm-cell l[1-4]$/.test(name)).length
assert.ok(levels > 0, 'some days carry an intensity level')

const empties = classes.filter(name => name === 'thm-cell empty').length
assert.ok(empties > 0, 'days without usage keep an empty cell')

const monthTitles = texts.filter(value => /月$/.test(value) || /^[A-Z][a-z]{2} \d{4}$/.test(value))
assert.ok(monthTitles.length >= 1, `the month is named (${monthTitles.join(', ')})`)

// The sidebar card: today's usage, the plan switcher and one bar per window.
const cardStates = new Map()
cardStates.set('root', { hooks: [], index: 0 })
let cardTree = null
for (let round = 0; round < 5; round += 1) {
  cardTree = render(h(registrations.get('sidebar.footer.action').component, { wide: true }), cardStates, 'card')
  shim.React.flush()
  await new Promise(resolve => setTimeout(resolve, 0))
  const dirty = [...cardStates.values()].some(state => state.dirty)
  if (!dirty) break
  for (const state of cardStates.values()) state.dirty = false
}

const cardClasses = classNames(cardTree)
const cardTexts = text(cardTree)
assert.ok(cardClasses.includes('thm-plan-toggle'), 'the plan switcher rendered')
assert.ok(cardClasses.includes('thm-window-bar'), 'the window bars rendered')
assert.ok(cardTexts.includes('5 小时窗口'), 'the interval window is named')
assert.ok(cardTexts.includes('周窗口'), 'the weekly window is named')
assert.ok(cardTexts.includes('MiniMax 套餐 · mini'), 'the shown plan is named')
assert.ok(cardTexts.some(value => /天后重置|小时后重置|分钟后重置/.test(value)), 'the windows say how long is left')

assert.ok(texts.some(value => value.includes('Token')), 'the totals are shown')
assert.ok(texts.some(value => value.includes('minimax-tokenplan/MiniMax-M3.1-Flash')), 'the model names are shown')

console.log(`render test passed (${cells} cells, ${levels} shaded, ${empties} empty, ${monthTitles.length} months, plan switcher + bars rendered)`)

// The page polls the Host, so the event loop still holds a timer.
process.exit(0)
