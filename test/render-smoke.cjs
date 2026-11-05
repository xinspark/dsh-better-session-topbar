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

// ---- 场景一：宿主有 contextMenus → 行尾「⋯」挂上原生菜单目标 --------------
{
  const { registered, list } = boot({ withMenus: true, withData: true })
  const settings = registered.find((r) => r.options && r.options.name === 'plugins.row.config')
  if (!settings) throw new Error('settings slot not registered')
  if (!settings.Comp({ view: 'page' }) || !settings.Comp({ view: 'summary' })) {
    throw new Error('settings page returned nothing')
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
