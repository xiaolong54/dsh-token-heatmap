/**
 * Build the plugin market index for this bundle.
 *
 * The index lists one plugin whose install source is this Git repository at
 * the current commit, so a user who adds the index can install the exact
 * tree that was published. Run it after every commit:
 *
 *   node tools/build-market-index.mjs
 *
 * The result is `market/index.json` with `market/icons/` beside it; publish
 * the folder as a static site and point DSH's "Add index source" at the
 * index file.
 */

import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const manifest = JSON.parse(await import('node:fs').then(fs => fs.promises.readFile(join(root, 'package.json'), 'utf8')))

/** The repository's web address. */
const REPOSITORY = 'https://github.com/xiaolong54/dsh-token-heatmap'

/** The commit the index installs. */
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()

/** The publish time of that commit, in Unix seconds. */
const publishedAt = Math.floor(Date.parse(execFileSync('git', ['show', '-s', '--format=%cI', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()) / 1000)

/** The icon file name inside the index's icons folder. */
const iconFile = 'token-heatmap.svg'

mkdirSync(join(root, 'market', 'icons'), { recursive: true })
copyFileSync(join(root, 'icon.svg'), join(root, 'market', 'icons', iconFile))

const index = {
  format: 1,
  title: { en: 'xiaolong54 plugins', zh: 'xiaolong54 的插件' },
  description: {
    en: 'Personal plugin market of xiaolong54.',
    zh: 'xiaolong54 的个人插件市场。',
  },
  metadata: {
    categories: { personal: { title: { en: 'Personal', zh: '个人' } } },
    labels: { personal: { title: { en: 'Personal', zh: '个人' } } },
    sortKeys: {
      published: { title: { en: 'Publish date', zh: '发布日期' }, order: 'desc' },
    },
  },
  plugins: [
    {
      name: manifest.name,
      title: { en: 'Token heatmap', zh: 'Token 热力图' },
      description: {
        en: 'Daily model token consumption as a month-by-month heatmap, plus the remaining quota of every connected coding plan.',
        zh: '把每个模型每天的 Token 消耗按月排成热力图，并显示已连接的各个 coding 套餐的剩余额度。',
      },
      icon: `icons/${iconFile}`,
      author: 'xiaolong54',
      homepage: `${REPOSITORY}#readme`,
      repository: { url: REPOSITORY },
      metadata: {
        category: 'personal',
        labels: ['personal'],
        keywords: ['dsh', 'dsh-plugin', 'deepseek-harness', 'token', 'heatmap', 'usage', 'quota'],
      },
      versions: [
        {
          version: manifest.version,
          publishTimestamp: publishedAt,
          source: { type: 'git', url: REPOSITORY, commit },
          engines: manifest.engines?.dsh === undefined ? {} : { dsh: manifest.engines.dsh },
        },
      ],
    },
  ],
}

writeFileSync(join(root, 'market', 'index.json'), `${JSON.stringify(index, null, 2)}\n`, 'utf8')
console.log(`market/index.json written for ${manifest.name}@${manifest.version} at ${commit.slice(0, 12)}`)
