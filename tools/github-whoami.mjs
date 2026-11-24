// Check which GitHub account the stored credential belongs to.
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const store = join(homedir(), '.git-credentials')
const line = readFileSync(store, 'utf8').split('\n').find(entry => entry.includes('github.com'))
const match = line.match(/https:\/\/([^:]+):([^@]+)@github\.com/)
const [, user, token] = match

const response = await fetch('https://api.github.com/user', {
  headers: {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'user-agent': 'dsh-token-heatmap-publisher',
  },
})
const body = await response.json()
console.log(`credential user field: ${user}`)
console.log(`HTTP ${response.status}`)
if (response.ok) {
  console.log(`login: ${body.login}`)
  console.log(`scopes: ${response.headers.get('x-oauth-scopes') ?? '(none)'}`)
  console.log(`plan: ${body.plan?.name ?? 'unknown'}`)
} else {
  console.log(`message: ${body.message}`)
}
