// Create a public GitHub repository with the stored credential, then report it.
// The token is read from the credential store and never printed.
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const store = join(homedir(), '.git-credentials')
const line = readFileSync(store, 'utf8').split('\n').find(entry => entry.includes('github.com'))
const match = line.match(/https:\/\/([^:]+):([^@]+)@github\.com/)
if (match === null) {
  console.log('no github credential found')
  process.exit(1)
}
const [, user, token] = match

const name = process.argv[2]
const description = process.argv[3] ?? ''

const response = await fetch('https://api.github.com/user/repos', {
  method: 'POST',
  headers: {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'content-type': 'application/json',
    'user-agent': 'dsh-token-heatmap-publisher',
  },
  body: JSON.stringify({
    name,
    description,
    private: false,
    auto_init: false,
    has_issues: true,
    has_wiki: false,
  }),
})

const body = await response.json()
if (response.status === 201) {
  console.log(`created: ${body.html_url} (public)`)
} else if (response.status === 422 && Array.isArray(body.errors) && body.errors.some(error => error.code === 'name_exists')) {
  console.log(`exists: ${body.errors[0].message}`)
} else {
  console.log(`HTTP ${response.status}: ${body.message ?? JSON.stringify(body).slice(0, 300)}`)
  process.exit(1)
}
