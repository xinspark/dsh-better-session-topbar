#!/usr/bin/env node
// ============================================================================
// 官方顶栏漂移检测 —— 回答「这一版原生顶栏变了什么」，而不是「我的对账还成立吗」
// ----------------------------------------------------------------------------
// 背景：本插件贴着官方内部契约实现。`check:instance` 只能验证**已知的**那些断言；
// 官方改名/搬槽/换图标/加一项时，它是「全 PASS」，变化要靠人读 asar 才发现
//（0.2.2-rc.3 把「智能体团队」从顶栏 chip 搬进 subagent.footer，就是这么人工挖出来的）。
//
// 本工具把与顶栏有关的那一薄层**指纹化**：槽位、谁注册进这些槽、chip 的结构锚点与
// 图标、顶栏 DOM 锚点、我们用到的 primitives 图标。基线存一份 JSON，下次跑就给出
// `+ 新增 / - 移除 / ~ 变化` 的差异清单 —— 人只看差异，不用重读 13MB 源码。
//
// 用法：
//   node tools/topbar-drift.mjs                 # 与基线对比（无基线时提示先 --write）
//   node tools/topbar-drift.mjs --write         # 把当前实例写进基线
//   node tools/topbar-drift.mjs --fail-on-drift # 有差异时退出码 1（给 CI/定时任务用）
//   node tools/topbar-drift.mjs --json          # 输出机器可读的 { current, baseline, diff }
//   node tools/topbar-drift.mjs --asar <path>   # 指定实例
//
// 它不是 `npm test` 的一部分：CI 上没有安装实例。日常在维护窗口里跑。
// ============================================================================
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { openAsar, resolveAsar } from './asar.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASELINE = path.join(ROOT, 'tools', 'baseline', 'topbar.json')

// ---- 我们关心的面 ---------------------------------------------------------
// 顶栏本身（我们占的那个槽 + 它周围的几个坑位）—— 官方搬走任何一项都会在这里露出来。
const WATCHED_SLOTS = [
  'conversation.session.header.actions',
  'conversation.session.header.actions.subagent.footer',
  'conversation.session.header.lineage',
  'conversation.session.header.utilities',
  'conversation.session.header.corner',
  'conversation.session.header',
  'plugins.row.config',
  'plugins.detail.section',
  'sidebar.workspaces.directoryFlow',
  'conversation.hero.workspace.directoryFlow',
]
// 插件实际用到的 primitives 图标 / 组件（消失即红）。
const WATCHED_PRIMITIVES = [
  'IconFolderCloseRegular', 'IconChevronDownOutlineRegular', 'IconChevronUpOutlineRegular',
  'IconNewChatOutlineRegular', 'IconProjectAddOutlineRegular', 'IconEllipsisOutlineRegular',
  'IconQueueOutlineRegular', 'IconUsersOutlineRegular', 'IconChevronsUpDownOutlineRegular',
  'IconFolderOpenOutlineRegular', 'IconListPenOutlineRegular', 'IconLayersOutlineRegular',
  'Modal', 'Button', 'Switch',
]
const P = 'node_modules/@deepseek-ai/'
// 占位/示例注册：`dsh-cordis-client-runner` 会往一堆槽里注册一个 `my-entry` 演示项，
// 与本插件无关，留着只会让每次对比多出几条噪声。
const IGNORED_IDS = new Set(['my-entry'])

// ---- 抽取 -----------------------------------------------------------------
const argOf = (flags, name) => {
  const at = flags.indexOf(name)
  return at >= 0 ? flags[at + 1] : undefined
}
const uniq = (list) => [...new Set(list)].sort()

function textOf(asar, relPath) {
  const src = asar.read(relPath)
  return src === null ? null : src.replace(/\r\n?/g, '\n')
}

// 从 provider 源码里抽注册信息：`slots.register({name:`X`,id:`Y`,order:N,…})`
// 压缩后的对象字面量在 300 字符窗口内够用；抽不到 id/order 就只记槽位。
function registrationsOf(src) {
  const out = []
  for (const m of src.matchAll(/slots\.(?:register|inject)\([^)]{0,24}\{\s*name:\s*[`'"]([\w.]+)[`'"]/g)) {
    const window = src.slice(m.index, m.index + 320)
    const id = window.match(/id:\s*[`'"]([^`'"]+)[`'"]/)
    const order = window.match(/order:\s*(-?\d+)/)
    out.push({ slot: m[1], id: id === null ? null : id[1], order: order === null ? null : Number(order[1]) })
  }
  // `slots.inject(\`slot\`, …)` 也算「这个包关心这个槽」
  for (const m of src.matchAll(/slots\.inject\(\s*[`'"]([\w.]+)[`'"]/g)) {
    out.push({ slot: m[1], id: null, order: null })
  }
  return out
}

// chip 的结构指纹：官方 trigger 上的语义锚点、activity 图标、计数节点标记。
function chipSignature(src) {
  const popups = uniq([...src.matchAll(/"aria-haspopup":\s*[`'"]([\w]+)[`'"]/g)].map((m) => m[1]))
  const activityIcons = []
  for (const m of src.matchAll(/activitySlot/g)) {
    const slice = src.slice(m.index, m.index + 500)
    for (const icon of slice.matchAll(/\.(Icon[A-Za-z]+)/g)) activityIcons.push(icon[1])
  }
  const dataMarkers = uniq([...src.matchAll(/data-([a-z][\w-]*count[a-z-]*)/g)].map((m) => m[1]))
  // i18n 里与 chip 文案相关的键（官方改文案时这里会变）
  const i18nKeys = uniq([...src.matchAll(/[`'"]((?:count|switcher|trigger|row|activity)[\w.]*)[`'"]\s*:/g)].map((m) => m[1]))
  return {
    popups,
    activityIcons: uniq(activityIcons),
    hasActivitySlot: src.includes('activitySlot'),
    hasStateDot: src.includes('StateDot'),
    countDataMarkers: dataMarkers,
    i18nKeys,
  }
}

function fingerprint(asar) {
  const shell = asar.readJSON('package.json')
  const prim = textOf(asar, `${P}dsh-client-ui-primitives/lib/index.js`) ?? ''
  const conv = textOf(asar, `${P}dsh-client-ui-conversation/lib/client.js`) ?? ''

  const packages = {}
  const slotOwners = {}
  const slotDeclaredBy = {}
  for (const relPath of asar.paths()) {
    const m = relPath.match(/^node_modules\/@deepseek-ai\/([^/]+)\/lib\/client\.js$/)
    if (m === null) continue
    const src = textOf(asar, relPath)
    if (src === null) continue
    const regs = registrationsOf(src).filter((r) => !IGNORED_IDS.has(r.id ?? ''))
    if (regs.length === 0) continue
    const watched = regs.filter((r) => WATCHED_SLOTS.includes(r.slot))
    if (watched.length === 0) continue
    packages[m[1]] = {
      slots: uniq(watched.map((r) => r.slot)),
      registrations: watched
        .map((r) => `${r.slot}#${r.id ?? '-'}@${r.order ?? '-'}`)
        .sort(),
      chip: chipSignature(src),
    }
    for (const r of watched) {
      if (r.id !== null) (slotOwners[r.slot] ??= []).push(`${m[1]}#${r.id}@${r.order ?? '-'}`)
      slotDeclaredBy[r.slot] ??= []
      slotDeclaredBy[r.slot].push(m[1])
    }
  }

  const slots = {}
  for (const slot of WATCHED_SLOTS) {
    slots[slot] = {
      owners: uniq(slotOwners[slot] ?? []),
      mentionedBy: uniq(slotDeclaredBy[slot] ?? []),
    }
  }

  const icons = {}
  for (const name of WATCHED_PRIMITIVES) icons[name] = prim.includes(`const ${name} `)

  const headerDom = {
    windowDrag: conv.includes('"data-window-drag"'),
    headerActionsClass: (conv.match(/([A-Za-z0-9]+)_headerActions\{/) ?? [])[1] ?? null,
    crumbsClass: (conv.match(/([A-Za-z0-9]+)_crumbs\{/) ?? [])[1] ?? null,
  }

  const asarSha = crypto.createHash('sha256').update(fs.readFileSync(asar.path)).digest('hex').slice(0, 16)
  return {
    instance: {
      shell: shell?.version ?? '?',
      kernel: shell?.dependencies?.['@deepseek-ai/dsh'] ?? '?',
      asarSha,
    },
    headerDom,
    slots,
    packages,
    icons,
  }
}

// ---- 差异 -----------------------------------------------------------------
function diff(before, after, at, out) {
  if (before === undefined) { out.push(`+ ${at}`); return }
  if (after === undefined) { out.push(`- ${at}`); return }
  const isObj = (v) => v !== null && typeof v === 'object'
  if (!isObj(before) || !isObj(after)) {
    if (JSON.stringify(before) !== JSON.stringify(after)) out.push(`~ ${at}: ${JSON.stringify(before)} → ${JSON.stringify(after)}`)
    return
  }
  const keys = uniq([...Object.keys(before), ...Object.keys(after)])
  for (const key of keys) diff(before[key], after[key], at === '' ? key : `${at}.${key}`, out)
}

// ---- 主流程 ---------------------------------------------------------------
function main() {
  const flags = process.argv.slice(2)
  const wantJson = flags.includes('--json')
  const failOnDrift = flags.includes('--fail-on-drift')
  const write = flags.includes('--write')
  const asarPath = resolveAsar({ argv: flags, onFail: (m) => { console.error(`topbar-drift: ${m}`); process.exit(2) } })

  const asar = openAsar(asarPath)
  const current = fingerprint(asar)
  asar.close()

  if (write) {
    fs.mkdirSync(path.dirname(BASELINE), { recursive: true })
    fs.writeFileSync(BASELINE, JSON.stringify(current, null, 2) + '\n')
    const rel = path.relative(ROOT, BASELINE)
    console.log(`baseline written: ${rel}`)
    console.log(`instance: ${current.instance.shell} · harness ${current.instance.kernel} · asar ${current.instance.asarSha}`)
    console.log(`watched: ${Object.keys(current.packages).length} official packages · ${WATCHED_SLOTS.length} slots · ${WATCHED_PRIMITIVES.length} primitives`)
    return 0
  }

  if (!fs.existsSync(BASELINE)) {
    console.error('topbar-drift: no baseline yet — run `npm run check:topbar -- --write` once')
    return 2
  }
  const baseline = JSON.parse(fs.readFileSync(BASELINE, 'utf8'))
  const drift = []
  diff(baseline, current, '', drift)

  if (wantJson) {
    console.log(JSON.stringify({ current, baseline, diff: drift }, null, 2))
    return failOnDrift && drift.length > 0 ? 1 : 0
  }

  const moved = baseline.instance.asarSha !== current.instance.asarSha
  console.log(`instance: ${current.instance.shell} · harness ${current.instance.kernel} · asar ${current.instance.asarSha}`)
  console.log(`baseline: ${baseline.instance.shell} · harness ${baseline.instance.kernel} · asar ${baseline.instance.asarSha}${moved ? '  ← 实例已更新' : ''}`)
  console.log('')
  if (drift.length === 0) {
    console.log('顶栏相关面无差异（槽位 / 注册者 / chip 锚点 / DOM 锚点 / primitives 图标）')
    return 0
  }
  for (const line of drift) console.log(line)
  console.log('')
  console.log(`${drift.length} 处差异 —— 逐条判断是否影响本插件；确认后跑 \`npm run check:instance\` 复核既有断言，再把新基线与结论一起提交。`)
  return failOnDrift ? 1 : 0
}

process.exit(main())
