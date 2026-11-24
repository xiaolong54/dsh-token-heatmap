/**
 * Build the installed Client artifact.
 *
 * A browser artifact for an installed bundle is one plain-JavaScript file
 * registered into `window.__ModuleLoader__.load`. It cannot import sibling
 * modules, so this script concatenates the `src/` modules into one factory
 * body, strips their `import`/`export` syntax, and prepends the two symbols
 * the modules share (`React` and a createElement alias).
 *
 * Usage: node build.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

/** Concatenation order matters: helpers and tables come before their users. */
const MODULES = [
  'src/i18n.js',
  'src/styles.js',
  'src/format.js',
  'src/heatmap.js',
  'src/tooltip.js',
  'src/usage.js',
  'src/plans.js',
  'src/page.js',
  'src/sidebar.js',
  'src/index.js',
]

/** Remove module syntax so every module shares one function scope. */
function stripModuleSyntax(source, file) {
  if (/^export\s+default\s+/m.test(source)) {
    throw new Error(`${file}: default exports are not supported by this build`)
  }
  const withoutImports = source.replace(
    /^[ \t]*import\s+(?:[^;]*?\s+from\s+)?['"][^'"]+['"][ \t]*;?[ \t]*$/gm,
    '',
  )
  return withoutImports
    .split('\n')
    .filter(line => !/^export\s*\{/.test(line))
    .map(line => line.replace(/^export\s+/, ''))
    .join('\n')
}

const chunks = MODULES.map((relative) => {
  const source = readFileSync(join(root, relative), 'utf8')
  return `// ---- ${relative} ----\n${stripModuleSyntax(source, relative)}`
})

const body = chunks.join('\n\n')

const artifact = `/**
 * ${pkg.name} — generated Client module. Do not edit: run \`node build.mjs\`.
 */
window.__ModuleLoader__.load({
  id: ${JSON.stringify(pkg.name)},
  factory(require) {
    const React = require('react')
    const h = React.createElement

${body}

    return { inject: ['slots', 'locale'], apply }
  },
})
`

writeFileSync(join(root, 'client.js'), artifact, 'utf8')
console.log(`client.js written (${(artifact.length / 1024).toFixed(1)} KiB)`)
