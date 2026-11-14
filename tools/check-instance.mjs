#!/usr/bin/env node
// ============================================================================
// 实例对账 —— 把「DSH 升级后要人工核对的 10 类耦合点」变成一条命令
// ----------------------------------------------------------------------------
// 本插件贴着原生内部契约（槽位名 / 组件导出 / DOM 锚点 / 服务方法），这些都没有
// 稳定性承诺，升级后可能静默改名 —— 改名不会抛错，只会「插件不出现」或「对话框炸开」。
// 这个脚本直接读当前安装实例的 `app.asar`，逐项核对本插件真正依赖的那几个名字，
// 一项一条 PASS/FAIL，全过才退出 0。
//
// 用法：
//   node tools/check-instance.mjs                 # 自动找 app.asar
//   node tools/check-instance.mjs --asar <path>   # 指定 app.asar
//   DSH_APP_ASAR=<path> node tools/check-instance.mjs
//
// 它不是 `npm test` 的一部分：CI 上没有安装实例，也没有 asar。`npm test` 负责
// 「代码自身没坏」，这个脚本负责「代码还对得上这台机器上的原生实现」。
// ============================================================================
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// ---- 1. 找到 app.asar ------------------------------------------------------
function resolveAsar() {
  const argv = process.argv.slice(2)
  const flag = argv.indexOf('--asar')
  const explicit = flag >= 0 ? argv[flag + 1] : process.env.DSH_APP_ASAR
  if (explicit !== undefined && explicit !== '') {
    if (!fs.existsSync(explicit)) fail(`app.asar not found: ${explicit}`)
    return path.resolve(explicit)
  }
  const local = process.env.LOCALAPPDATA ?? ''
  const candidates = [
    path.join(local, 'Programs', 'DSH NEXT', 'resources', 'app.asar'),
    path.join(local, 'Programs', 'dsh-desktop-next', 'resources', 'app.asar'),
    'C:/Program Files/DSH NEXT/resources/app.asar',
    '/Applications/DSH NEXT.app/Contents/Resources/app.asar',
    '/opt/DSH NEXT/resources/app.asar',
  ].filter((entry) => entry !== '')
  for (const candidate of candidates) if (fs.existsSync(candidate)) return candidate
  fail('no app.asar found — pass --asar <path> or set DSH_APP_ASAR')
}

function fail(message) {
  console.error(`check-instance: ${message}`)
  process.exit(2)
}

// ---- 2. 最小 asar 读取器（无依赖）-----------------------------------------
// 布局：[0..3]=4 · [4..7]=pickleSize · [8..11]=headerPayload · [12..15]=jsonLen
//       [16..] JSON 目录树（文件 = {offset,size}）· 数据区从 8+payload+4 开始。
function openAsar(asarPath) {
  const fd = fs.openSync(asarPath, 'r')
  const head = Buffer.alloc(16)
  fs.readSync(fd, head, 0, 16, 0)
  const jsonLen = head.readUInt32LE(12)
  const headerBuf = Buffer.alloc(jsonLen)
  fs.readSync(fd, headerBuf, 0, jsonLen, 16)
  const tree = JSON.parse(headerBuf.toString('utf8'))
  const dataStart = 8 + head.readUInt32LE(8) + 4

  const node = (relPath) => {
    let cur = tree
    for (const part of relPath.split('/').filter(Boolean)) {
      if (!cur || !cur.files || !cur.files[part]) return undefined
      cur = cur.files[part]
    }
    return cur
  }

  return {
    read(relPath) {
      const entry = node(relPath)
      if (!entry || entry.files) return undefined
      const buf = Buffer.alloc(Number(entry.size))
      fs.readSync(fd, buf, 0, Number(entry.size), dataStart + Number(entry.offset))
      return buf.toString('utf8')
    },
    readJSON(relPath) {
      const text = this.read(relPath)
      return text === undefined ? undefined : JSON.parse(text)
    },
    close() {
      fs.closeSync(fd)
    },
  }
}

// ---- 3. 期望值从插件自己身上抽取，不在脚本里抄第二份 ---------------------
// 图标与组件：解析 lib/client.js 里 `require('...ui-primitives')` 的解构块。
function pluginPrimitivesImports() {
  const source = fs.readFileSync(path.join(ROOT, 'lib', 'client.js'), 'utf8')
  const at = source.indexOf("require('@deepseek-ai/dsh-client-ui-primitives')")
  if (at < 0) fail('lib/client.js no longer requires the primitives package')
  const open = source.lastIndexOf('{', at)
  const close = source.lastIndexOf('}', at)
  if (open < 0 || close < open) fail('cannot read the primitives destructuring block')
  return source
    .slice(open + 1, close)
    .split(',')
    .map((piece) => piece.replace(/\/\/.*$/gm, '').trim())
    .filter((name) => /^[A-Za-z_$][\w$]*$/.test(name))
}

function primitivesExports(bundle) {
  const names = new Set()
  for (const match of bundle.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const piece of match[1].split(',')) {
      const name = piece.trim().split(/\s+as\s+/).pop()
      if (name && /^[A-Za-z_$][\w$]*$/.test(name)) names.add(name)
    }
  }
  return names
}

// 服务方法：抽取插件源码里**真正调用**的 `workspaces.xxx(` / `uiWorkspace.xxx(`，
// 先剔除注释（`http://` 里的 `//` 用「前一字符不是冒号」保护），
// 于是删掉一处调用，对账表自动跟着缩，不会留下过期期望。
function pluginServiceCalls() {
  const source = fs.readFileSync(path.join(ROOT, 'lib', 'client.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
  const pick = (owner) => {
    const names = new Set()
    const re = new RegExp(`\\b${owner}\\.([A-Za-z_$][\\w$]*)\\s*\\(`, 'g')
    for (const match of source.matchAll(re)) names.add(match[1])
    return [...names].sort()
  }
  return { workspaces: pick('workspaces'), uiWorkspace: pick('uiWorkspace') }
}

// chip 文案关键字：直接读 lib/client.js 的 CHIP_HINTS / SWITCHER_HINTS 字面量。
// 官方改译文时这里会先红，而不是等到界面上三枚 chip 突然不被装饰。
function pluginChipHints() {
  const source = fs.readFileSync(path.join(ROOT, 'lib', 'client.js'), 'utf8')
  const block = source.match(/const CHIP_HINTS = \{([\s\S]*?)\}/)
  if (!block) fail('lib/client.js no longer declares CHIP_HINTS')
  const groups = {}
  for (const line of block[1].split('\n')) {
    const hit = line.match(/(\w+):\s*\[([^\]]*)\]/)
    if (!hit) continue
    groups[hit[1]] = hit[2].split(',')
      .map((piece) => piece.trim())
      .filter((piece) => piece !== '')
      .map((piece) => {
        const double = piece.match(/^"([\s\S]*)"$/)
        const single = piece.match(/^'([\s\S]*)'$/)
        return double ? double[1] : (single ? single[1] : piece)
      })
  }
  const switcher = source.match(/const SWITCHER_HINTS = \[([^\]]*)\]/)
  const switcherHints = switcher
    ? switcher[1].split(',').map((piece) => piece.trim().replace(/^["']|["']$/g, '')).filter((piece) => piece !== '')
    : []
  return { groups, switcherHints }
}

// ---- 4. 对账表 -------------------------------------------------------------
const P = 'node_modules/@deepseek-ai/'
const results = []
const record = (ok, title, detail) => results.push({ ok, title, detail })

function main() {
  const asarPath = resolveAsar()
  const asar = openAsar(asarPath)
  const shell = asar.readJSON('package.json')
  const kernel = shell?.dependencies?.['@deepseek-ai/dsh'] ?? '?'

  const convPath = `${P}dsh-client-ui-conversation/lib/client.js`
  const conv = asar.read(convPath) ?? ''
  const primPath = `${P}dsh-client-ui-primitives/lib/index.js`
  const prim = asar.read(primPath) ?? ''
  const uiWsPath = `${P}dsh-client-ui-workspace/lib/client.js`
  const uiWs = asar.read(uiWsPath) ?? ''
  // 客户端拿到的 workspaces / uiWorkspace 是 api-controller 与 ui-workspace 实现的门面：
  // `workspaces.create` 这类方法不在 dsh-workspace 的宿主类里 —— 对账要对插件真正调用的
  // 那一层，不是宿主那一层（这一条写错，脚本会把对的实现报成缺失）。
  const wsApiPath = `${P}dsh-api-workspace-controller/lib/client.js`
  const wsApi = asar.read(wsApiPath) ?? ''
  const cmPath = `${P}dsh-client-ui-context-menu/lib/client.js`
  const cm = asar.read(cmPath) ?? ''
  const pmPath = `${P}dsh-client-ui-plugin-manager/lib/client.js`
  const pm = asar.read(pmPath) ?? ''
  const localePath = `${P}dsh-client-locale/lib/client.js`
  const locale = asar.read(localePath) ?? ''
  const preload = asar.read('lib/preload-app.cjs') ?? ''
  const picker = asar.read(`${P}dsh-host-directory-picker-auto/lib/index.js`) ?? ''

  // ① 组件与图标：解构出来的每一个名字都必须在 primitives 的导出表里。
  const wanted = pluginPrimitivesImports()
  const exported = primitivesExports(prim)
  const missing = wanted.filter((name) => !exported.has(name))
  record(
    prim !== '' && exported.size > 0 && missing.length === 0,
    'primitives 导出',
    missing.length === 0
      ? `${wanted.length}/${wanted.length}（${primPath}，导出表 ${exported.size} 个）`
      : `缺失 ${missing.length} 个：${missing.join('、')}`,
  )

  // ② 槽位名：我们注册的四个槽，必须在各自的原生包里还叫这个名字。
  const slots = [
    ['conversation.session.header.actions', conv, convPath],
    ['plugins.row.config', pm, pmPath],
    ['sidebar.workspaces.directoryFlow', uiWs, uiWsPath],
    ['conversation.hero.workspace.directoryFlow', uiWs, uiWsPath],
  ]
  for (const [slot, bundle, from] of slots) {
    record(bundle.includes(`"${slot}"`), `槽位 ${slot}`, from)
  }

  // ③ 顶栏 DOM 锚点：隐藏原生标题与「让容器可收缩」都靠它们。
  record(conv.includes('"data-window-drag"'), '锚点 header[data-window-drag]', convPath)
  record(/_headerActions\{/.test(conv), '样式类 …_headerActions（承载面包屑的 flex 行）', convPath)
  record(/_crumbs\{/.test(conv), '样式类 …_crumbs（原生面包屑 nav）', convPath)
  record(conv.includes('"conversation.session.header.lineage"'), '槽位 conversation.session.header.lineage', convPath)

  // ④ 服务方法：期望值来自插件源码里真正调用的那几条（注释已剔除），
  //    行内「更多」菜单已交给宿主，所以这里核对的是 contextMenus 与原生会话菜单注册。
  const calls = pluginServiceCalls()
  const wsMissing = calls.workspaces.filter((name) => !new RegExp(`\\b${name}\\(`).test(wsApi))
  record(
    wsApi !== '' && calls.workspaces.length > 0 && wsMissing.length === 0,
    'workspaces 方法（代码实际调用）',
    wsMissing.length === 0
      ? `${calls.workspaces.join(' · ')}（${wsApiPath}）`
      : `缺失：${wsMissing.join('、')}`,
  )
  const uiMissing = calls.uiWorkspace.filter((name) => !uiWs.includes(name + '('))
  record(
    uiWs !== '' && calls.uiWorkspace.length > 0 && uiMissing.length === 0,
    'uiWorkspace 方法（代码实际调用）',
    uiMissing.length === 0 ? calls.uiWorkspace.join(' · ') : `缺失：${uiMissing.join('、')}`,
  )
  // 判据绑「符号」不绑引号风格：0.2.2-rc.1 用 `provide("contextMenus")`，
  // rc.3 改成模板反引号 `provide(\`contextMenus\`)` —— 只认一种引号会让门假阳（经验：自己的对账脚本也会假阳）。
  record(
    /provide\(\s*[`"']contextMenus[`"']\s*,/.test(cm) && /open\s*:\s*\(?\s*target\s*,\s*point/.test(cm),
    '服务 contextMenus（open(target, point)）',
    `${cmPath}（active / open / close 由该包 provide）`,
  )
  record(
    /registerSessionMenus/.test(uiWs) && /target\s*:\s*[`"']session[`"']/.test(uiWs),
    '原生会话菜单注册（置顶/重命名/分支/复制/归档）',
    uiWsPath,
  )
  record(uiWs.includes('workspace.add'), '命令 workspace.add', uiWsPath)
  record(
    locale.includes('translate') || locale.includes('register'),
    'locale 取词/注册入口',
    `${localePath}（translate=${locale.includes('translate')} register=${locale.includes('register')}）`,
  )

  // ⑤ chip 文案关键字：8 种语言的词干必须在对应的官方包里还找得到。
  //    真实字符串是从官方字典里抽的，这里只做「包含」核对（大小写不敏感）。
  const hints = pluginChipHints()
  const subagentPath = `${P}dsh-client-ui-subagent/lib/client.js`
  const jobsPath = `${P}dsh-client-ui-jobs/lib/client.js`
  const teamPath = `${P}dsh-experimental-client-ui-agent-team/lib/client.js`
  const chipSources = {
    sub: (asar.read(subagentPath) ?? '').toLowerCase(),
    jobs: (asar.read(jobsPath) ?? '').toLowerCase(),
    team: (asar.read(teamPath) ?? '').toLowerCase(),
  }
  const missingHints = []
  const skippedChips = []
  for (const key of Object.keys(hints.groups)) {
    const source = chipSources[key]
    if (source === undefined) { missingHints.push(`${key}: 未知 chip`); continue }
    // 该 chip 的原生包没装（例如没启 agent-team）：跳过，不把「不存在的 UI」算成失败
    if (source === '') { skippedChips.push(key); continue }
    for (const hint of hints.groups[key]) {
      if (!source.includes(hint.toLowerCase())) missingHints.push(`${key}: ${hint}`)
    }
  }
  const switcherSource = chipSources.sub
  for (const hint of hints.switcherHints) {
    if (!switcherSource.includes(hint.toLowerCase())) missingHints.push(`switcher: ${hint}`)
  }
  const hintCount = Object.values(hints.groups).reduce((sum, list) => sum + list.length, 0)
  const skippedNote = skippedChips.length === 0 ? '' : `；未安装跳过：${skippedChips.join('、')}`
  record(
    missingHints.length === 0,
    'chip 文案关键字（8 语言）',
    missingHints.length === 0
      ? `${hintCount} 个 chip 词干 + ${hints.switcherHints.length} 个切换器词干，均在官方包里命中${skippedNote}`
      : `未命中：${missingHints.join('、')}${skippedNote}`,
  )

  // ⑥ 「添加工作区」交给宿主的两条前提：
  //    目录流占用者（dsh-host-directory-picker-auto）+ 桌面壳的目录选择 preload 桥。
  record(picker !== '', '宿主目录选择 occupant', `${P}dsh-host-directory-picker-auto/lib/index.js`)
  record(preload.includes('__DSH_DIRECTORY_PICKER__'), 'preload 桥 __DSH_DIRECTORY_PICKER__', 'lib/preload-app.cjs')

  asar.close()

  // ---- 5. 输出 -------------------------------------------------------------
  const width = results.reduce((max, r) => Math.max(max, r.title.length), 0)
  console.log(`instance: ${shell?.name ?? '?'} ${shell?.version ?? '?'} · harness ${kernel}`)
  console.log(`asar    : ${asarPath}`)
  console.log('')
  for (const r of results) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.title.padEnd(width)}  ${r.detail}`)
  }
  const bad = results.filter((r) => !r.ok)
  console.log('')
  if (bad.length === 0) {
    console.log(`OK: ${results.length}/${results.length} 项对账通过（零迁移不代表零核对：本脚本核对的就是那几条硬契约）`)
    return 0
  }
  console.log(`FAILED: ${bad.length}/${results.length} 项对不上 —— 按 MAINTAINING §3.2 的清单逐项修，别只改报错的那一条`)
  return 1
}

process.exit(main())
