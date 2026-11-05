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

function renderCrumb(registered, list) {
  const crumb = registered.find((r) => r.options && r.options.name === 'conversation.session.header.actions')
  if (!crumb) throw new Error('breadcrumb slot not registered')
  const props = {
    sessionId: 's1',
    useWorkspaces: (sel) => sel(list),
    useSessions: (sel) => sel({ byId: list.byId, projectionsBySession: {} }),
  }
  const tree = crumb.Comp(props)
  if (!tree || typeof tree !== 'object') throw new Error('breadcrumb returned nothing')
  return tree
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
  const starLine = collectType(page, 'p').find((node) => node.props.className === 'bst-star-line')
  if (!starLine) throw new Error('settings page lost the star line')
  if (collectText(starLine).join(' ').trim() === '') {
    throw new Error('star line has no text')
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

console.log('smoke OK: header breadcrumb + settings rendered; native menu targets wired')
