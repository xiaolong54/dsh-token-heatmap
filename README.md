# @local/dsh-token-heatmap

A local dsh bundle that shows how many tokens the models on this machine
spent, day by day, as a month-by-month heatmap.

## What it does

- **Host half** (`index.js`): folds every session in the corpus into per-day,
  per-model token buckets. Each `assistant/message` event carries the
  provider usage of that call and the route (`provider` and `model`) that
  produced it, so the totals cover history that predates the plugin. The
  fold runs in the background and its per-session result is kept in a
  ledger file in the profile state; the browser reads the merged totals
  from `GET /token-heatmap/usage`, behind the composition's connection trust
  fence, so the page never waits for a fold.
- **Client half** (`client.js`): two surfaces — a settings page with the
  month-by-month heatmap, the totals, the per-model breakdown and every
  connected plan, and a small card above the account row that shows what
  today cost and the plan the user picked.
- **Vendor registry** (`plans.js`): one entry per coding-plan vendor, with
  the endpoint, the authentication and the parsing. Covered today: MiniMax,
  Kimi For Coding, GLM / Z.ai, OpenCode Go and Codex / ChatGPT.

## Layout

| Path | Role |
| --- | --- |
| `index.js` | Host half: the usage route and the background session fold |
| `plans.js` | The vendor registry: where to ask each provider and how to read it |
| `src/heatmap.js` | Pure grid, intensity and summary helpers |
| `src/page.js` | The settings page |
| `src/plans.js` | The plan card on the settings page |
| `src/sidebar.js` | The card above the account row |
| `src/usage.js` | The shared read of the Host route |
| `src/format.js` | The shared formatters |
| `src/tooltip.js` | The shared hover bubble |
| `src/i18n.js` | Chinese and English copy |
| `src/styles.js` | The stylesheet of both surfaces |
| `src/index.js` | Client registration |
| `build.mjs` | Builds `client.js` from `src/` |

## Build

```bash
node build.mjs
```

## Install

In the profile (`~/.dsh/profiles/desktop`):

```json
"dependencies": { "@local/dsh-token-heatmap": "link:D:/dsh_ws/token-heatmap" }
```

and add `"@local/dsh-token-heatmap"` to `dsh.profile.bundles` in
`package.json`, then insert the row in `cordis.patch.yml`:

```yaml
- insert:
    - id: token-heatmap
      name: '@local/dsh-token-heatmap'
```
