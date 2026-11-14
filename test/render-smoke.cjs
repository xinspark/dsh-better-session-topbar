// 渲染冒烟：用桩 React / primitives 执行工厂与组件渲染体。
// 目的不是验证外观，而是让「删了代码但还有悬空引用」在提交前就炸出来：
// 真实的 primitives / React 在宿主里才有，所以这里只做最小的执行环境。
// 用法：npm test（或 node test/render-smoke.cjs）
'use strict'
const fs = require('node:fs')
const path = require('node:path')

const file = path.join(__dirname, '..', 'lib', 'client.js')
const src = fs.readFileSync(file, 'utf8')

// 捕获模块定义（每个场景重新调用一次 factory，拿到独立的一份闭包状态）
let definition = null
const win = { __ModuleLoader__: { load: (def) => { definition = def } } }
new Function('window', src)(win)
if (!definition || typeof definition.factory !== 'function') throw new Error('factory not captured')

const ReactStub = {
  createElement: (type, props, ...kids) => ({ type, props: props || {}, kids }),
  Fragment: Symbol('Fragment'),
  useState: (init) => [typeof init === 'function' ? init() : init, () => {}],
  useRef: (init) => ({ current: init }),
  useMemo: (fn) => fn(),
  useCallback: (fn) => fn,
  useEffect: () => {},
  useLayoutEffect: () => {},
  useSyncExternalStore: (sub, get) => get(),
  useReducer: (reducer, init) => [init, () => {}],
}

function boot({ withMenus, withData }) {
  const primitives = new Proxy({}, { get: () => (props) => ({ type: 'stub', props }) })
  const modules = {
    react: ReactStub,
    'react-dom': { createPortal: (el) => el },
    '@deepseek-ai/dsh-client-ui-primitives': primitives,
  }
  const exportsObj = definition.factory((name) => {
    if (name in modules) return modules[name]
    throw new Error('unexpected require: ' + name)
  })

  const menuCalls = { open: [], close: 0 }
  const contextMenus = {
    active: { getSnapshot: () => null },
    open: (target, point) => { menuCalls.open.push({ target, point }) },
    close: () => { menuCalls.close += 1 },
  }
  const byId = withData
    ? { s1: { id: 's1', displayTitle: 'Session One', origin: 'user', updatedAt: Date.UTC(2026, 10, 5) } }
    : {}
  const list = {
    items: withData
      ? [{ workspaceId: 'w1', title: 'Workspace One', path: 'E:/tmp/w1', sessionIds: ['s1'], createdAt: new Date().toISOString() }]
      : [],
    archivedSessionIds: [],
    pinnedSessionIds: [],
    byId,
  }
  const registered = []
  const slots = {
    register: (options, Comp) => { registered.push({ options, Comp }); return () => {} },
    inject: (key, cb) => { cb(); return () => {} },
    entries: () => [],
    subscribe: () => () => {},
  }
  const locale = { register: () => {}, subscribe: () => () => {}, bind: () => (key) => key }
  const shortcuts = { invoke: () => {}, catalog: { subscribe: () => () => {}, getSnapshot: () => [] } }
  const configForms = {
    get: () => ({
      subscribe: () => () => {},
      getSnapshot: () => ({ status: 'ready', writable: true, value: { narrowMode: 'crumb', probeLog: false } }),
      set: async () => true,
    }),
  }
  const services = {
    slots,
    workspaces: {},
    uiWorkspace: { pickDirectory: async () => null },
    locale,
    shortcuts,
    configForms,
    contextMenus: withMenus ? contextMenus : undefined,
  }
  // 官方客户端插件直接读 ctx.<service>（硬依赖由 cordis inject 保证），
  // 这里把服务摊到 ctx 上，和真实运行期一致。
  const ctx = {
    ...services,
    effect: (fn) => { const c = fn(); return typeof c === 'function' ? c : () => {} },
    inject: (names, cb) => { cb(ctx); return () => {} },
  }
  exportsObj.apply(ctx)
  return { registered, list, menuCalls }
}

// 找到返回树里所有「列表」元素（props.items 是数组的 BstList）
function collectLists(node, out = []) {
  if (node === null || typeof node !== 'object') return out
  if (Array.isArray(node)) {
    for (const kid of node) collectLists(kid, out)
    return out
  }
  if (node.props && Array.isArray(node.props.items)) out.push(node)
  if (Array.isArray(node.kids)) {
    for (const kid of node.kids) collectLists(kid, out)
  }
  return out
}

function renderCrumb(registered, list, extraProps) {
  const crumb = registered.find((r) => r.options && r.options.name === 'conversation.session.header.actions')
  if (!crumb) throw new Error('breadcrumb slot not registered')
  const props = {
    sessionId: 's1',
    useWorkspaces: (sel) => sel(list),
    useSessions: (sel) => sel({ byId: list.byId, projectionsBySession: {} }),
    ...(extraProps || {}),
  }
  const tree = crumb.Comp(props)
  if (!tree || typeof tree !== 'object') throw new Error('breadcrumb returned nothing')
  return tree
}

// 0.2.2-rc.3 的根 prop：useContextMenu() → { getTriggerProps(target, handlers) }。
// 这里按官方实现返回一组可识别的 props，用来断言插件确实走了原生绑定。
function nativeTriggers() {
  const calls = []
  return {
    calls,
    useContextMenu: () => ({
      getTriggerProps: (target, handlers = {}) => {
        calls.push({ target, handlers })
        return {
          ...handlers,
          'data-native-trigger': target && target.kind ? target.kind : 'unknown',
          tabIndex: handlers.tabIndex === undefined ? 0 : handlers.tabIndex,
          onContextMenu: () => {},
          onKeyDown: () => {},
        }
      },
    }),
  }
}

function itemsOf(lists, firstId) {
  const found = lists.find((l) => l.props.items.some((it) => it && it.id === firstId))
  if (!found) throw new Error('dropdown not found: ' + firstId)
  return found
}

// 找返回树里指定 type 的元素（用于设置页的求星提示行）
function collectType(node, type, out = []) {
  if (node === null || typeof node !== 'object') return out
  if (Array.isArray(node)) {
    for (const kid of node) collectType(kid, type, out)
    return out
  }
  if (node.type === type) out.push(node)
  if (Array.isArray(node.kids)) {
    for (const kid of node.kids) collectType(kid, type, out)
  }
  return out
}

// 收集返回树里的文本节点（断言求星提示确实带文案）
function collectText(node, out = []) {
  if (typeof node === 'string') {
    if (node.trim() !== '') out.push(node)
    return out
  }
  if (node === null || typeof node !== 'object') return out
  if (Array.isArray(node)) {
    for (const kid of node) collectText(kid, out)
    return out
  }
  if (Array.isArray(node.kids)) {
    for (const kid of node.kids) collectText(kid, out)
  }
  return out
}

// ---- 语言字典一致性（工程门：键集、值非空、页面覆盖、meta 文件） ----------------
function dictEntries(source, name) {
  const start = source.indexOf('const ' + name + ' = {')
  if (start < 0) throw new Error('dictionary not found: ' + name)
  const end = source.indexOf('\n    }', start)
  if (end < 0) throw new Error('dictionary not terminated: ' + name)
  const block = source.slice(start, end)
  return [...block.matchAll(/'([\w.]+)':\s*(?:'([^']*)'|"([^"]*)")/g)]
    .map((m) => ({ key: m[1], value: m[2] !== undefined ? m[2] : m[3] }))
}
function dictKeys(source, name) {
  return new Set(dictEntries(source, name).map((entry) => entry.key))
}

const sameKeys = (a, b) => a.size === b.size && [...a].every((key) => b.has(key))
{
  const languages = ['BST_ZH', 'BST_EN', 'BST_JA', 'BST_DE', 'BST_ES', 'BST_FR', 'BST_PT', 'BST_RU']
  const zh = dictKeys(src, 'BST_ZH')
  const en = dictKeys(src, 'BST_EN')
  if (!sameKeys(zh, en)) throw new Error('BST_ZH / BST_EN key sets diverge')
  // 设置页引用的每一个 settings.* 键都必须在 zh/en 里存在
  const pageKeys = new Set([...src.matchAll(/'(settings\.[A-Za-z]+)'/g)].map((m) => m[1]))
  for (const key of pageKeys) {
    if (!zh.has(key)) throw new Error('settings page key missing from BST_ZH: ' + key)
  }
  // 8 本字典键集完全一致（官方包的约定：每种语言同一套键）
  for (const name of languages.slice(2)) {
    if (!sameKeys(dictKeys(src, name), zh)) {
      throw new Error(name + ' must carry the same key set as BST_ZH')
    }
  }
  // 任何一本字典都不允许空值；en 字典不得含 CJK（官方约定）
  for (const name of languages) {
    for (const entry of dictEntries(src, name)) {
      if (entry.value.trim() === '') throw new Error(name + ' has an empty value: ' + entry.key)
    }
  }
  const enText = dictEntries(src, 'BST_EN').map((entry) => entry.value).join('\n')
  if (/[\u3400-\u9fff]/.test(enText)) throw new Error('BST_EN must not contain CJK')
  // 每种语言的包 meta（插件列表/详情页标题与描述）都要存在且非空
  const locales = ['zh', 'en', 'ja', 'de', 'es', 'fr', 'pt', 'ru']
  let enMeta = null
  for (const lang of locales) {
    const file = path.join(__dirname, '..', 'locale', lang + '.json')
    const meta = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (!meta.meta || typeof meta.meta.title !== 'string' || meta.meta.title.trim() === '') {
      throw new Error('locale meta title missing: ' + lang)
    }
    if (typeof meta.meta.description !== 'string' || meta.meta.description.trim() === '') {
      throw new Error('locale meta description missing: ' + lang)
    }
    if (lang === 'en') enMeta = meta
  }
  if (/[\u3400-\u9fff]/.test(enMeta.meta.title + enMeta.meta.description)) {
    throw new Error('en locale meta must not contain CJK')
  }
}

// ---- 场景一：宿主有 contextMenus → 行尾「⋯」挂上原生菜单目标 --------------
{
  const { registered, list } = boot({ withMenus: true, withData: true })
  const settings = registered.find((r) => r.options && r.options.name === 'plugins.row.config')
  if (!settings) throw new Error('settings slot not registered')
  const page = settings.Comp({ view: 'page' })
  const summary = settings.Comp({ view: 'summary' })
  if (!page || !summary) throw new Error('settings page returned nothing')
  // 求星行不在配置页里：它挂在官方 plugins.detail.section（见下）
  if (collectType(page, 'p').some((node) => node.props.className === 'bst-star-line')) {
    throw new Error('star line must not live inside the config page')
  }
  const detail = registered.find((r) => r.options && r.options.name === 'plugins.detail.section')
  if (!detail) throw new Error('detail section not registered')
  if (detail.options.id !== 'bst-star') throw new Error('star section id changed')
  if (!(typeof detail.options.order === 'number' && detail.options.order < 90)) {
    throw new Error('star section must sort before the market source row (order 90)')
  }
  const detailOurs = detail.Comp({ subject: { kind: 'row', pkg: { name: 'dsh-better-session-topbar' }, row: { rowId: 'x' } } })
  const starLine = detailOurs && collectType(detailOurs, 'p').find((node) => node.props.className === 'bst-star-line')
  if (!starLine) throw new Error('star section lost the star line')
  if (collectText(starLine).join(' ').trim() === '') throw new Error('star line has no text')
  if (starLine.props['data-bst-star'] !== 'detail') throw new Error('star line lost its detail marker')
  for (const subject of [{ kind: 'bundle', pkg: { name: 'other-plugin' } }, { kind: 'item', id: 'x' }, undefined]) {
    if (detail.Comp({ subject }) !== null) throw new Error('star section must filter by subject.pkg.name')
  }
  const lists = collectLists(renderCrumb(registered, list))
  const ws = itemsOf(lists, 'add')
  const ss = itemsOf(lists, 'new')
  if (typeof ws.props.onMore !== 'function' || typeof ss.props.onMore !== 'function') {
    throw new Error('onMore not wired while contextMenus is available')
  }
  const wsRow = ws.props.items.find((it) => it && it.id === 'w1')
  const ssRow = ss.props.items.find((it) => it && it.id === 's1')
  if (!wsRow || !wsRow.more || wsRow.more.kind !== 'workspace' || wsRow.more.value.workspaceId !== 'w1') {
    throw new Error('workspace row lost its native menu target')
  }
  if (!ssRow || !ssRow.more || ssRow.more.kind !== 'session' || ssRow.more.value.sessionId !== 's1') {
    throw new Error('session row lost its native menu target')
  }
  for (const it of [...ws.props.items, ...ss.props.items]) {
    if (it && it.actions !== undefined) throw new Error('self-built menu actions still present')
  }
}

// ---- 场景三：rc.3 的根 prop useContextMenu → 「⋯」与行都挂原生触发绑定 --------
{
  const { registered, list } = boot({ withMenus: true, withData: true })
  const native = nativeTriggers()
  const tree = renderCrumb(registered, list, { useContextMenu: native.useContextMenu })
  const lists = collectLists(tree)
  const ws = itemsOf(lists, 'add')
  const ss = itemsOf(lists, 'new')
  // ① 接线：组件把根 prop 的 getTriggerProps 传给了两个下拉
  if (typeof ws.props.triggerProps !== 'function' || typeof ss.props.triggerProps !== 'function') {
    throw new Error('native getTriggerProps not forwarded to the dropdowns')
  }
  // ② 行为：真的渲染一次列表，断言「⋯」与行都用了原生绑定。
  //    BstList 用 useState 存定位结果，桩里把 null 换成坐标让它进入渲染分支。
  const originalUseState = ReactStub.useState
  ReactStub.useState = (init) => [init === null ? { left: 0, top: 0 } : init, () => {}]
  let listNode = null
  const originalDocument = globalThis.document
  globalThis.document = { body: { nodeType: 1 } }
  try {
    listNode = ws.type({ ...ws.props, open: true })
  } finally {
    ReactStub.useState = originalUseState
    globalThis.document = originalDocument
  }
  if (!listNode) throw new Error('dropdown did not render for the native-trigger check')
  if (native.calls.length === 0) throw new Error('native getTriggerProps never used')
  const targets = native.calls.map((call) => call.target && call.target.kind)
  if (!targets.includes('workspace')) throw new Error('native trigger not bound to the workspace target')
  const rowCall = native.calls.find((call) => call.handlers && call.handlers.tabIndex === -1)
  if (!rowCall) throw new Error('row lost its tabIndex -1 on the native trigger')
  const buttons = collectType(listNode, 'button').filter((node) => node.props.className === 'bst-item-more')
  if (buttons.length === 0) throw new Error('more button missing under the native path')
  for (const button of buttons) {
    if (button.props['data-native-trigger'] === undefined) {
      throw new Error('more button did not take the native trigger props')
    }
    if (typeof button.props.onClick !== 'function') throw new Error('native trigger dropped our onClick')
    if (typeof button.props.onKeyDown !== 'function') throw new Error('native trigger lost onKeyDown (Shift+F10)')
    if (button.props['aria-haspopup'] !== 'menu') throw new Error('more button lost aria-haspopup')
  }
}

// ---- 场景二：老内核没有 contextMenus → 不渲染「更多」（不留死按钮） --------
{
  const { registered, list } = boot({ withMenus: false, withData: true })
  const lists = collectLists(renderCrumb(registered, list))
  const ws = itemsOf(lists, 'add')
  const ss = itemsOf(lists, 'new')
  if (ws.props.onMore !== undefined || ss.props.onMore !== undefined) {
    throw new Error('onMore should be undefined without contextMenus')
  }
}

// ---- 场景四：chip 识别的静态契约（渲染体跑不到测量 effect，只能查源码） --------
// 这一趟防的是「改了名但残留旧引用」这类错误：`CHIP_SELECTORS[key]` 在 effect 里执行，
// 冒烟执行的渲染体根本走不到，等到实机才炸。所以直接对着源码断言。
{
  // 归一化换行再断言：仓库约定 LF，万一被写成 CRLF（见 docs/experience/08），
  // 按行尾写的正则在本地会失配、git 还会把整文件算成改动。
  // 第一条断言就是这个约定本身：混进 CRLF 立刻红。
  if (src.includes('\r\n')) {
    throw new Error('lib/client.js must use LF line endings (see docs/experience/08)')
  }
  const flat = src.replace(/\r\n?/g, '\n')
  const anchorsAt = flat.indexOf('const CHIP_ANCHORS = {')
  if (anchorsAt < 0) throw new Error('CHIP_ANCHORS is gone')
  const anchorsBlock = flat.slice(anchorsAt, flat.indexOf('\n            }', anchorsAt))
  if (!/sub:\s*\{\s*selector:\s*'[^']*aria-haspopup="dialog"/.test(anchorsBlock)) {
    throw new Error('subagent chip must keep its structural anchor (aria-haspopup="dialog")')
  }
  if (!/trustUnique:\s*true/.test(anchorsBlock)) {
    throw new Error('the subagent anchor must be trusted when unique')
  }
  if (/CHIP_SELECTORS/.test(src)) throw new Error('stale CHIP_SELECTORS reference left behind')
  if (!/findChip\(key,\s*CHIP_HINTS\[key\],\s*CHIP_ANCHORS\[key\]\)/.test(src)) {
    throw new Error('findChip must be fed the anchor map, not a hand-picked selector')
  }
}

console.log('smoke OK: header breadcrumb + settings rendered; native menu targets wired')
