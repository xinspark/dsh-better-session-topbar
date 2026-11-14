# 装配契约

> 本插件贴着 DSH 内部契约实现，没有稳定的第三方 API。**DSH 升级后先跑
> `npm run check:instance`，再按本页 10 类耦合点实机复核。**

## 1. 三处同名（改错 = 插件直接不加载）

| 位置 | 值 |
| --- | --- |
| `package.json` `name` | `dsh-better-session-topbar` |
| `cordis.patch.yml` 行 `id` / `name` | 同上 |
| `lib/client.js` `__ModuleLoader__.load({ id })` | 同上 |
| host 半 `index.js` 的 `name` | 同上（中文标题只在 `locale/*.json` 的 `meta.title`） |

宿主按包名解析 bundle 并把工厂投递给浏览器，浏览器再按同一个 key 等待；不一致就是
「永远等不到 / 导入失败」。

## 2. 装配

| 层 | 文件 | 作用 |
| --- | --- | --- |
| bundle | `cordis.patch.yml` | `insert` 一行 host + client 双半插件（顶层 `- id/name` 是覆盖已有行，不能新增） |
| host | `index.js` | 只声明 `Config` schema（`narrowMode` / `probeLog`，均 `.volatile()`），并关闭按 schema 自动生成的表单 |
| client | `lib/client.js` | UMD，注册槽位与全部界面逻辑；宿主按请求提供，客户端改动刷新页面即可 |

## 3. 槽位

| 槽位 | 注册 | 说明 |
| --- | --- | --- |
| `conversation.session.header.actions` | `id: bst-breadcrumb`, `order: -40` | 顶栏最前；不依赖同槽其它项的具体数字 |
| `plugins.row.config` | `key: <包名>#<行 id>`, `locale: <包名>` | 详情页；键 = 插件管理器分发的键 |
| `plugins.detail.section` | `id: bst-star`, `order: 80` | 详情页底部求星行；按 `subject.pkg.name` 自过滤；`order` 必须小于市场来源行 `dsh-market-source` 的 90（该槽的注册 schema 只有 `id`/`order`/`label`，别传 `locale`/`registrant` 这类不认的字段） |
| `sidebar.workspaces.directoryFlow` | 只读 `slots.entries()` 判断占用者 | 「添加工作区」交给宿主 |
| `conversation.hero.workspace.directoryFlow` | 同上 | 同上 |

同槽原生项顺序会随版本变（0.2.1-rc.2：subagent-catalog -30 / team -20 / preset -10；
rc.3 与 rc.4：team -20 / preset -10 / cost-meter 1 / subagent-catalog 10 / job-list 20；
0.2.2-rc.1 实测 cost-meter 已不在同槽）——插件只依赖自己的 -40。

## 4. 服务依赖

| 类型 | 服务 | 缺席时 |
| --- | --- | --- |
| 硬依赖（`inject`） | `slots` / `workspaces` / `uiWorkspace` / `locale` | 不会 apply（由 cordis 保证） |
| 可选（`ctx.inject` 子级） | `configForms` | 少一个详情页 |
| 可选（`ctx.inject` 子级） | `shortcuts` | 少一处「添加工作区」探活 |
| 可选（`ctx.inject` 子级） | `contextMenus` | 少行尾「⋯」（0.2.1 及更早） |

### 行内「⋯」的触发绑定：原生 `getTriggerProps` 优先

0.2.2-rc.3 起宿主在根 props 里提供 `useContextMenu()`，返回 `{ getTriggerProps(target, handlers) }`：
它统一处理右键、`Shift+F10`、`ContextMenu` 键、打开前聚焦、键盘场景的坐标兜底与 `stopPropagation`。
插件把 `props.useContextMenu` 作为 `triggerProps` 传进下拉：行用 `triggerProps(target, { tabIndex: -1 })`
（行是容器，不该成为 Tab 停靠点），「⋯」用 `triggerProps(target, { onClick })`（原生会保留我们的 onClick）。
旧内核没有这个 prop → `triggerProps = null`，退回插件自绘的 `onContextMenu` 手势，行为不变。
冒烟测试覆盖两条路径：有该 prop 时按钮必须拿到 `onKeyDown`/`onContextMenu` 且保留 `onClick`，
没有时不得出现原生绑定。

**不要**把可选服务写进硬 `inject`：第三方发行版没装该服务时，整个插件（连面包屑）都不会 apply。

## 5. 顶栏 DOM 锚点

- 隐藏原生标题：`header[data-window-drag] nav:has(~ div .bst-crumbs)`（0.2.0 的
  `data-conversation-*` 已移除；`div[data-conversation-title-row]:has(.bst-crumbs) nav`
  作为老版本兜底保留）；
- 让容器可收缩：`header[data-window-drag] div:has(.bst-crumbs){min-width:0;flex-shrink:1}`；
- 只读原生 DOM 做定位/测量，绝不改 React 拥有的节点（chip 装饰是例外，见设计说明）。

## 6. 10 类耦合点（升级后逐项复核）

| # | 耦合点 | 怎么验 |
| --- | --- | --- |
| 1 | 包与装配契约 | 插件列表能加载、无「导入失败」 |
| 2 | 槽位名 | `npm run check:instance` + `cordis_inspect_query` |
| 3 | 服务名与语义 | 下拉动作可用、详情页存在 |
| 4 | 命令与快捷键 | 有目录流 occupant 时「添加工作区」走宿主 |
| 5 | 目录选择交互 | 四种组合各点一次「添加工作区」 |
| 6 | 顶栏 DOM 锚点 | 原生标题被隐藏、窄屏切换正常 |
| 7 | primitives 组件 | 错误对话框与详情页各点开一次 |
| 8 | 文案与错误 | 中英各看一次 |
| 9 | 行内「更多」 | 点「⋯」弹出宿主菜单 |
| 10 | 打包与本地安装 | junction 安装时能解析 schemastery |

## 7. `check:instance` 覆盖的对账项

primitives 导出、四个槽位名、三个顶栏 DOM 锚点与 lineage 槽、`workspaces` 方法（按代码实际
调用抽取）、`uiWorkspace` 方法、`contextMenus` 服务、原生行内菜单注册（会话 · 工作区两组
target）、`workspace.add`、`locale` 入口、8 语言 chip 文案关键字、**chip 结构锚点**、宿主目录
选择 occupant、preload 桥 `__DSH_DIRECTORY_PICKER__`。期望值从 `lib/client.js` 自己抽取
（含 `CHIP_ANCHORS`），不抄第二份；**项数以脚本输出为准**（随清单增删，当前 19 项），
文档里只记「核对了哪几类」，不维护第二份计数。
