// Enable GitHub Pages for one folder of a repository, then report the URL.
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const store = join(homedir(), '.git-credentials')
const line = readFileSync(store, 'utf8').split('\n').find(entry => entry.includes('github.com'))
const [, , token] = line.match(/https:\/\/([^:]+):([^@]+)@github\.com/)

const repo = process.argv[2]
const path = process.argv[3] ?? '/market'

const headers = {
  authorization: `Bearer ${token}`,
  accept: 'application/vnd.github+json',
  'content-type': 'application/json',
  'user-agent': 'dsh-token-heatmap-publisher',
}

const created = await fetch(`https://api.github.com/repos/xiaolong54/${repo}/pages`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ source: { branch: 'main', path } }),
})
const body = await created.json()
if (created.ok) {
  console.log(`pages created: ${body.html_url} -> ${body.html_url}/index.json`)
} else if (created.status === 409) {
  console.log('pages already exist')
} else {
  console.log(`HTTP ${created.status}: ${body.message ?? JSON.stringify(body).slice(0, 200)}`)
}

const info = await fetch(`https://api.github.com/repos/xiaolong54/${repo}/pages`, { headers })
const state = await info.json()
console.log(`state: ${state.status ?? 'unknown'} ${state.html_url ?? ''}`)
