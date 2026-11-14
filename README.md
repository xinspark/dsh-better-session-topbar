<p align="center">
  <img src="docs/screenshots/workspace-dropdown.png" alt="更好的会话顶栏 工作区下拉展示" width="100%">
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/release/xinspark/dsh-better-session-topbar?style=flat&amp;label=release&amp;color=08C" alt="GitHub release">
  <img src="https://img.shields.io/badge/plugin-UI%20%E5%A2%9E%E5%BC%BA-47848F?style=flat" alt="UI enhancement plugin">
  <img src="https://img.shields.io/badge/DSH%20Web%20GUI-Windows%20%7C%20macOS%20%7C%20Linux-4493F8?style=flat" alt="Windows | macOS | Linux">
  <img src="https://img.shields.io/badge/license-MIT-2EA44F?style=flat" alt="MIT License">
  <a href="https://github.com/xinspark/dsh-better-session-topbar/actions/workflows/ci.yml"><img src="https://github.com/xinspark/dsh-better-session-topbar/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
</p>

<p align="center"><sub>简体中文 · <a href="README.en.md">English</a></sub></p>

<h3 align="center">把 DSH 顶栏的会话标题换成「工作区 / 会话」两级面包屑，切换入口直接放在顶栏</h3>

<p align="center"><a href="#安装"><ins><code>dsh plugin --profile web add dsh-better-session-topbar</code></ins></a></p>

更好的会话顶栏（包名与仓库名同为 `dsh-better-session-topbar`）是面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的**会话顶栏增强插件**——纯 UI 增强，不引入新能力，不改任何系统源码。DSH 原生顶栏中央只显示会话标题（层级面包屑），工作区/会话的切换入口在左侧边栏；侧边栏收起时，每次切换都要额外点击。本插件把切换入口直接放进顶栏：

- **工作区下拉** —— 展开可见全部工作区及其会话数，一键切换；可「添加工作区」（直接交给宿主的目录选择：native 桌面就是系统「选择文件夹」，browse 宿主是官方应用内面板）或删除。
- **会话下拉** —— 展开可见当前工作区全部会话及相对更新时间，一键切换；可「新建会话」。
- **顶栏三枚原生 chip 一并对齐** —— 子智能体 / 智能体团队 / 后台任务与面包屑用同一套度量（字号、内距、圆角、悬停、图标尺寸），并按固定次序让出宽度：chip 交数字 → 标题让位收成图标 → chip 收成图标。
- **窄屏二选一** —— 空间真的不够时，可以选「面包屑模式」（收成图标，层级与切换都还在）或「标题模式」（整行只留会话标题）；两种模式的取舍写在插件详情页的选项旁。

行内「更多」直接调用宿主的右键菜单服务：置顶 / 重命名 / 分支 / 复制 Session ID / 归档 / 删除工作区，权限门控、快捷键提示、重命名与删除对话框全部由 DSH 自己渲染 —— 与侧边栏右键菜单逐项一致，插件不再维护第二套。

支持 **Windows · macOS · Linux**（DSH Web GUI）——纯 JavaScript，无原生依赖，分发无需构建步骤。

> 验证基线：**DSH NEXT 2.0.23-next（内置 DeepSeek Harness 0.2.2-rc.3）** 与 `dsh web`。行内「更多」菜单依赖 0.2.2-rc.1 起的 `contextMenus` 服务；更早的内核（0.2.1-rc.4 / 0.2.1-rc.3 / 0.2.1-rc.2 / 0.2.0-rc.2）上面包屑与两个下拉照常工作，只是行尾不显示「⋯」（侧栏仍是完整入口）。其它版本未经验证。

## 安装

`dsh-better-session-topbar` 是一个**组合包（bundle）**——以包形式分发的配置补丁层（见 [DSH 官方插件发布文档](https://deepseek-harness.github.io/deepseek-harness/develop/basic/publish)）。用 `dsh plugin` 命令安装进 profile：它会自动链接包并追加到 `dsh.profile.bundles`：

```sh
# 从 npm 安装（推荐，最短；已发布到 registry.npmjs.org）
dsh plugin --profile web add dsh-better-session-topbar

# 从 GitHub 安装（等价；可锁 tag 或 commit）
dsh plugin --profile web add github:xinspark/dsh-better-session-topbar#v2.0.2
```

- **建议锁定 commit**：GitHub 安装拉取的是仓库源码，tag 之后的新推送不会自动影响已安装版本；如需把运行内容严格固定到某个提交，用 `github:xinspark/dsh-better-session-topbar#<commit-sha>`（官方文档推荐做法）。
- **本地目录 / tarball**（开发或离线环境；本地目录名与包名现在都是 `dsh-better-session-topbar`）：

  ```sh
  dsh plugin --profile web add ./dsh-better-session-topbar
  dsh plugin --profile web add ./dsh-better-session-topbar-2.0.2.tgz
  ```

然后启动 Web UI：`dsh web`（或 `dsh --profile web`）。首次 `add` 会自动用 `@deepseek-ai/dsh-base` 初始化 profile。

卸载：`dsh plugin --profile web remove dsh-better-session-topbar`（同时移除依赖与组合层；`dsh plugin` 认的是包名，不是仓库目录名）。

插件的 bundle 补丁（`cordis.patch.yml`）会自动注册 host 与 client 两半。客户端按请求加载：客户端改动刷新页面即可，host 改动需要重启。

## 主要功能

| 能力 | 说明 |
| --- | --- |
| 多级面包屑 | 顶栏左侧以「工作区 / 会话」展示当前位置，两侧各自展开下拉列表；进入子智能体会话时自动扩展为「工作区 / 父会话 / 子智能体会话」（祖先级可点跳回）。 |
| 逐级自适应图标态 | 某一级被挤到读不出内容（可见宽度 < 80px ≈ 5 个汉字）→ 只收这一级；整条溢出 → 全部收成图标（防止被窗口边缘裁掉）。图标按级取：工作区＝文件夹、普通会话级＝会话字形、子智能体级＝原生 switcher 的上下双箭头；完整标题仍在悬停提示与可访问名里。窗口宽、只是标题超过该级上限时保留截断文本（比一个图标信息量大）。`/` 分隔始终保留 —— 图标态下层级顺序靠它读出来。 |
| 逐级压缩 | 顶栏放不下时按固定次序让位：三枚原生 chip（子智能体 / 智能体团队 / 后台任务）先 `full → count`（文字换成 `(N)`）→ **面包屑整条收成图标**（统计数留着，长标题最不值钱）→ chip 再 `count → icon`。判据是实测的可用宽度，不记顶栏宽度做滞回 —— 标题变短、chip 消失后会自己展开回来。 |
| 窄屏显示方式 | 插件详情页二选一：**面包屑模式**（默认，保留「工作区 / 会话」层级，收成图标后仍可逐级点开切换，代价是最窄时只剩图标、标题全文要悬停或点开才看得到）或**标题模式**（整行只留当前会话标题，子智能体会话保留「父 / 当前」，长标题更完整，代价是工作区与切换收进下拉、极窄时父级变成上下箭头图标）。两种选择都在同一个折叠点上生效，切换即时预览。 |
| 三枚 chip 同构 | 子智能体 / 智能体团队 / 后台任务统一成「图标 · 文字 · (N) · 圆环 · 箭头」：12px/18 字号、`3px 7px` 内距、5px 间距、28px 高、14px 图标、12px 箭头、圆角与悬停填充一致；图标一律用官方的（0.2.2-rc.3 起官方两枚自带 14px 图标，插件不再自绘、也不挪动官方子节点顺序）；团队那枚的成员数与运行中圆环由插件补（圆环与官方 spinner 同相）。0.2.2-rc.3 起官方把智能体团队移出顶栏，顶栏里实际是同构的两枚（见「已知限制」）。 |
| 工作区下拉 | 工作区列表（含会话数元信息）、添加工作区（交给宿主目录选择，与侧栏 + 一致）、行内「更多」：重命名 / 删除工作区（宿主菜单，按权限显示）。 |
| 会话下拉 | 当前工作区的会话列表（含相对时间元信息）、新建会话、行内「更多」：置顶 / 重命名 / 分支 / 复制 Session ID / 归档会话（宿主菜单，按权限显示）。 |
| 原生一致的交互 | 下拉为自绘层，卡片沿用原生菜单 token（`--dsw-elevation-prominent`、`--dsw-radius-lg`、`--dsw-menu-surface-fill` + `--dsw-menu-backdrop-filter`、hover 填充 `--dsw-alias-interactive-bg-hover`）；行内度量为 min-height 40 / padding 8·10 / 14px·22px（与原生 `AccountMenu` 的 `[role=menuitem]` 一致；原生 `Menu.module.css` 更紧凑，本插件未跟随）。键盘/ARIA 与原生 `Menu` 同构：打开聚焦首行、`ArrowUp/Down`、`Home/End`、`Tab` 收起、`Esc` 收起并归还焦点。行内「更多」本体是**宿主的右键菜单**（`contextMenus` 服务）：条目、顺序、权限门控、快捷键键帽、重命名/删除对话框全由 ui-workspace 渲染；插件只传目标与坐标。 |
| 生命周期一致 | 宿主菜单跟随其所在下拉同生命周期：下拉关闭（点击外部 / Escape / 选择 / 切换）时一并收走，不残留孤立浮层。 |
| 插件详情页 | Plugins → 本插件 → 配置：**窄屏会话标题显示选择**（原生外观方块样式的二选一：面包屑模式 / 标题模式，每个选项旁写明优缺点）与**探针日志**开关。写入 profile 的 Cordis patch，即时生效。详情页底部一行「⭐ 用着顺手？给个 Star 支持一下」（在宿主市场来源行「查看仓库」上方；本行不重复造链接）。 |
| 多语言 | 插件自有文案全部跟随 DSH 的 8 种官方语言（中/英/日/德/西/法/葡/俄）实时切换，`locale/*.json` 的标题/描述也各备一份。**其中日/德/西/法/葡/俄为机器翻译**（人工粗校），见「已知限制」。 |

## 截图

**工作区下拉展开**——切换工作区、添加工作区：

![工作区下拉](docs/screenshots/workspace-dropdown.png)

**会话下拉展开**——切换会话、新建会话：

![会话下拉](docs/screenshots/session-dropdown.png)

**会话更多菜单**——悬停行尾的「⋯」打开宿主会话菜单（置顶 / 重命名 / 分支 / 复制 Session ID / 归档）：

![会话更多菜单](docs/screenshots/session-more-menu.png)

**子智能体层级面包屑**——进入子智能体会话时自动扩展为「工作区 / 父会话 / 子智能体会话」，祖先级可点跳回，末级点开是兄弟子智能体：

![子智能体面包屑](docs/screenshots/subagent-crumb.png)

**窄屏 · 标题模式**——顶栏放不下完整面包屑时，整行只留当前会话标题（点开仍是同一套会话列表与行内操作）：

![窄屏标题模式](docs/screenshots/narrow-title.png)

**插件详情页**——「窄屏会话标题显示选择」两个方块各带取舍说明，下面是探针日志开关：

![插件详情页](docs/screenshots/plugin-settings.png)

## 使用

安装后，打开任意会话，顶栏中央即显示「工作区 / 会话」面包屑：

- 点击**工作区**一侧：展开工作区下拉（顶部为「添加工作区」）。
- 点击**会话**一侧：展开会话下拉（顶部为「新建会话」）。
- 悬停列表行：行尾显示「⋯」—— 打开的是宿主自己的右键菜单（置顶 / 重命名 / 分支 / 复制 Session ID / 归档，按权限显示）。
- 选择行即切换；点击空白处或按 `Esc` 关闭下拉。
- 键盘：下拉打开后 `↑` / `↓`、`Home` / `End` 移动，`Tab` 收起，`Esc` 收起并把焦点还给触发按钮。
- 顶栏挤不下时按固定次序让位；想换窄屏的显示方式，去 Plugins → 更好的会话顶栏 → 配置。

## 文档

| 想看什么 | 去哪 |
| --- | --- |
| 全部文档导航 | [docs/README.md](docs/README.md) |
| 设计与取舍（折叠阶梯 / chip / 菜单委派） | [docs/design.md](docs/design.md) |
| 装配契约（三处同名 / 槽位 / 服务 / DOM 锚点） | [docs/reference/architecture.md](docs/reference/architecture.md) |
| 版本兼容与升级对账 | [docs/reference/compatibility.md](docs/reference/compatibility.md) |
| 配置项与生效方式 | [docs/guide/configuration.md](docs/guide/configuration.md) |
| 故障排查（症状 → 原因 → 处理） | [docs/guide/troubleshooting.md](docs/guide/troubleshooting.md) |
| 验收记录（自动化门 + 实机清单） | [docs/testing.md](docs/testing.md) |
| 踩过的坑（症状 → 根因 → 证据） | [docs/experience/](docs/experience/README.md) |
| 维护者手册（发版 / 审批 / 市场） | [MAINTAINING.md](MAINTAINING.md) |

## 与官方项目的关系

本项目基于官方 [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 构建，是一个**社区插件**，并非 DeepSeek 官方产品。它展示的都是 DSH 自己的数据与界面，只是重新组织；不修改任何系统源码。

## 二次开发

- **`index.js`** —— host 半：只声明两项配置的 schema（`narrowMode` / `probeLog`），所有界面逻辑在浏览器半。
- **`lib/client.js`** —— 浏览器半（UMD，注册进 DSH `clientModules`）。结构自上而下：
  1. 本地基础工具：样式注入 / 定时器。
  2. **字典**（`BST_ZH` / `BST_EN` / `BST_JA` / `BST_DE` / `BST_ES` / `BST_FR` / `BST_PT` / `BST_RU`，八本键集完全一致）—— 注册进 `ctx.locale`，跟随语言切换；`bstT()` 带 fallback。
  3. **自绘下拉列表** `BstList` —— 沿用原生菜单样式与 token；键盘/ARIA 与原生 `Menu` 同构（`role=menu` + 每行两个 `menuitem`、打开聚焦首行、`ArrowUp/Down`、`Home/End`、`Tab`/`Esc` 收起）；定位避让视口边缘；`click` 外部关闭（不用 mousedown/pointerdown：它们先于 `click` 派发，会先行卸载列表、吃掉行内 click）。
  4. `WorkspaceTitleBreadcrumb` —— 注册进 `conversation.session.header.actions`（`order: -40`，顶栏最左）；逐级自适应图标态（该级标签被挤到可见宽度 < `ICONIC_TEXT_FLOOR` 才换图标）+ 三枚原生 chip 的装饰与宽度阶梯（判据全部来自实测可用宽度 `avail()`，**不使用** header 宽度滞回 —— 折叠常由改名/新 chip 引起，按 header 宽度记基准会折下去解不开）；行内「更多」不渲染菜单本体，只把 `{kind, value}` 目标交给宿主的 `contextMenus.open(目标, 视口坐标)`，并在下拉全关时收走它。
  5. `apply(ctx)` —— 样式注入 + 槽位注册（顶栏面包屑 + 插件详情页）；`inject: ['slots','workspaces','uiWorkspace','locale']`（服务依赖必须声明，否则 apply 抢跑会把 `undefined` 永久固化进所有动作，表现为「界面正常、点了没反应」）；服务按官方写法**直接读** `ctx.<service>`。**可选**依赖一律走 `ctx.inject([...], …)` 子级：`configForms`（详情页）、`shortcuts`（`workspace.add` 探活）、`contextMenus`（行内「更多」）—— 缺了只少那一个入口，不影响面包屑。

- **改动后的最低验证** —— `npm test`：`test/render-smoke.cjs` 用桩 React/primitives 执行工厂与面包屑、设置页的渲染体，并强校验八本字典键集、`locale/*.json` meta 与求星行；`tools/check-docs.mjs` 校验文档链接与锚点。它不验外观，发布前仍要按「DSH 升级维护清单」实机点一遍。

扩展速查：

- **新增行操作** —— 不要在这里加：行内菜单由宿主菜单提供，条目在 ui-workspace 里按 `target` 注册。插件这边只决定「给哪个目标挂 `more`」（见 `wsListItems` / `ssListItems`）。
- **新增文案** —— 八本字典（`BST_ZH` / `BST_EN` / `BST_JA` / `BST_DE` / `BST_ES` / `BST_FR` / `BST_PT` / `BST_RU`）是同一套键，新增 key 必须同时补齐八本；`npm test` 会强校验键集，漏一本直接红。
- **详情页底部加一行求星提示（通用示范）** —— 注册官方 `plugins.detail.section`（`id: bst-star`、`order: 80`，小于市场来源行的 90），组件按 `subject.pkg.name` 自过滤、别的插件页返回 `null`；星形用 `⭐` 字符（不自绘图标），**不要**再画「查看仓库」链接（宿主页脚已有），侵入度最低。
- **调整下拉样式** —— 修改 `insertStyle` 中的 `.bst-item*` 规则（token 与原生 Menu 一致）。
- **诊断日志默认关闭，开关在插件详情页** —— 正常使用不往控制台写任何东西。在 Plugins → 本插件 → 配置 里打开「探针日志」即可（即时生效，不必刷新），三枚前缀分别是 `[bst-dom]`（结构探针）、`[bst-chip]`（chip 探测与阶梯结论）、`[bst-perf]`（单趟测量超过 60ms 才有的慢趟记录）。日志关着时连结构探针的测量都不跑。写在 profile 的 `cordis.patch.yml` 里，跟随 profile。
- **改完 host 半不用重启 app** —— 实机验证过的做法：客户端改动刷新页面即可；`index.js` 这类 host 改动在插件页把本行关掉再打开（`已关闭 → 运行中`）就会重新导入，新注册的 `Config` 立刻生效。
- **改了 `locale/*.json` 的包标题/描述要重启 app** —— 那是**宿主启动时**读取的包元数据（实测：应用 17:59 启动、18:29 新增 `locale/ja.json`，刷新页面仍显示英文；重启后变日文）。`lib/client.js` 里的界面字典不受影响，刷新页面即可。
- **schema 依赖 schemastery（peer）** —— host 半的 `Config` 用 `@deepseek-ai/schemastery` 构造，`package.json` 里声明为 peerDependencies。**以 junction/symlink 安装时**要注意：Node 按真实路径解析，插件会找不到 `node_modules/@deepseek-ai/schemastery` —— 需要在仓库自身或**上层目录**能解析到它（本机开发树的上一层 `plugins/node_modules` 就提供了它，所以仓库自己的 `node_modules/@deepseek-ai` 是空的也照常加载）；真目录安装（`dsh plugin add`）不需要这一步。
- **窄屏模式是枚举不是布尔** —— `narrowMode` 取 `'crumb' | 'title'`（host 端 `z.union([z.const(...), z.const(...)])`）。1.3.4 及更早存的是布尔 `narrowTitle`，字段改名后旧值会被 schema 丢弃，升级后回到默认「面包屑模式」，去详情页重选即可。
- **选择器为什么不用 SegmentedControl** —— 原生 `SegmentedControl` 是 tablist→panel 语义（每个选项带 `aria-controls` 指向面板），这里没有面板，用它就会产出悬空的 `aria-controls`。详情页的两选一改用与 DSH 设置页「外观」三选一同一套方块（thumbnail/cube）：`.5px` 描边、`--dsw-radius-xl`、选中换 `--dsw-alias-bg-module-platform` + `--dsw-static-neutral-bluish-400`，`aria-pressed` 表达选择。
- **窄屏标题态的几个不变量** —— ① 工作区级靠 `data-bst-level="ws"` 用 `display:none` 藏起，**不要**改成不渲染（`crumbNeed` 按 `.bst-crumb-btn` 数量推导，删掉会让阈值 285→151，出现「藏起来→放得下→再显示」的翻动）；② 这一态强制文本（`setIconic('')`），否则阶梯会把末级收成图标，与「标题」的语义冲突；③ 会话图标由 `span.bst-crumb-icon` 包着，只有标题态隐藏它，宽屏面包屑保留；④ 子智能体会话的「父 / 当前」在标题态还会再压一次：`per` 触底（=150）时父级变成原生上下箭头图标、宽度让给当前标题，`per` 回到 190 才展开 —— 图标是**例外**（`.bst-crumb-iconic .bst-crumb-icon` 在标题态要放回来），否则压缩后只剩一个空按钮。
- **包名只能 ASCII，且三处必须同名** —— `package.json` 的 `name`、`cordis.patch.yml` 的行 id、`lib/client.js` 里 `__ModuleLoader__.load({ id })` 的 id 是同一个字符串：宿主按包名解析 bundle 并把工厂投递给浏览器，浏览器再按同 key 等待，不一致就是「永远等不到 / 导入失败」。界面上的中文名（更好的会话顶栏）只走 `locale/*.json` 的 `meta.title` 与 host 半的 `name` 显示串。**中文包名走不通**：实测 `npm install` 直接 `EINVALIDPACKAGENAME`（`name can only contain URL-friendly characters`），而 profile 的每一次 `dsh plugin add/remove` 都要过 npm。
- **改包名后运行中的宿主不会自己收敛** —— profile 里 `dependencies` / `dsh.profile.bundles` / patch 行 id / `node_modules` 链接改完，磁盘状态就对了；但运行中的宿主仍组合着旧行（旧 bundle 的组合行不会因 `bundles` 移除而卸载），页面刷新会报「加载插件失败 / 1 条未激活 … 导入失败」，patch 里写 `disabled: true` 也压不住。**必须重启一次 app**（重启后旧行自然消失）。
- **加一个设置项要动两处** —— host 半 `index.js` 的 `Config` schema 里声明字段并标 `.volatile()`（**只有 volatile 字段会进表单**，一个都没有时整行不出现）；客户端半在 `BstSettingsPage` 里加控件，读 `configForms.get(行 id)` 的快照、写同一个实例的 `set(field, value)`。顶栏那边读的是共享的 `bstSettings`，设置一变就重算。
- **调整压缩阶梯** —— 阶梯是 `full → count → 图标 → icon`，阈值三个常量：`CRUMB_LEVEL_COST` / `CRUMB_SEP_COST`（按当前级数推出 `crumbNeed`，两级=285）、`CRUMB_ICON_NEED`（160，跌到它才把 chip 压成图标）、`CRUMB_TEXT_ADD`（136，展开的回差）。改字号 / padding / 图标尺寸要跟着重算，别写死某个整数。**不要**拿 `header.clientWidth` 做滞回：折叠往往由内容变化（改名、新 chip）引起，按 header 宽度记基准就再也解不开。三枚 chip 的度量在 `button[data-bst-chip]` 那组样式里，装饰（统计数、圆环、圆点的顺序）由 `data-bst-chip-*` 标记驱动。
- **调整图标态阈值** —— 阈值是 `ICONIC_TEXT_FLOOR`（≈5 个汉字宽）：某级文本被截断且可见宽度低于它、或整条面包屑溢出，才换图标。两个坑：① 别用「标题超过该级 `max-width`」当判据 —— 那在宽窗口下也会命中（长标题本来就超上限），界面会莫名其妙地到处变图标；② 别假设"文本一定会被挤" —— 顶栏容器默认不可收缩，溢出会表现为被窗口边缘裁掉（见 `has(.bst-crumbs)` 那条让容器可收缩的样式）。
- **给链上加一级** —— 只改 `bstSessionChain`（数据）即可；渲染端逐级同一段代码，图标按 `node.subagent` 取（子智能体级＝上下双箭头，其余＝会话字形），所以任何链长都不会出现「某级没有图标」的空洞。
- **下拉必须 portal 到 `document.body`** —— 原地渲染会落在顶栏槽位里，被应用外壳的层叠上下文压住：外壳/聊天内容（含第三方插件注入的「复制」按钮）会盖在下拉上面，列表首行也可能被侧栏网格盖住。原生 `Menu` 的 `portal: true` 就是同一个理由。
- **行动作行别用原生文案（当组合里有「手机口袋」类插件时）** —— 实测 `dsh-pocket` 2.11.0 的 `hideWsEntries` 会全局扫描 `[role=menuitem]/[role=option]/li/button/a`，按文本**精确匹配** `添加工作区` / `Add workspace` 后写 `display:none`，并挂 MutationObserver 让新插入的节点同样被隐藏；沿用原生文案的那一行会被一并吃掉，看起来就是「下拉里少了一行」。改自有文案（`新建工作区` / `New workspace`）即可避开。本机组合里没有该插件，所以当前刻意用回原生文案（用户要求）；若哪天装了它，把行动作行改成自有文案。
- **「添加工作区」完全交给宿主，插件不自绘面板** —— 侧栏 `WorkspacePickFlow` 是 `addOnly:true`，`open` 升起后直接展开 `sidebar.workspaces.directoryFlow`，由宿主的 occupant 决定交互：native 后端（win32/darwin 本地）是官方 renderless 的 `NativeDirectoryFlow`，直接弹系统「选择文件夹」；browse 后端是官方应用内面板。插件只调 `workspace.add`。槽空（极少见）时兜底：preload 桥 `__DSH_DIRECTORY_PICKER__` → `uiWorkspace.pickDirectory()` → 明确报错；不自绘面板、不降级成路径输入。1.5.0 起删除了旧的自绘面板与 `priority:-1` 接管。探针日志搜 `[bst-picker]` 能看到走的是宿主流程还是兜底。

## DSH 升级维护清单

本插件贴着 DSH 内部契约实现（没有稳定的第三方 API），升级 DSH 后按这张表逐项复核；详细契约与 10 类耦合点见 [装配契约](docs/reference/architecture.md)，升级流程见 [版本兼容](docs/reference/compatibility.md)。

| 检查项 | 位置 | 升级后怎么验 |
| --- | --- | --- |
| 包名三处一致 | `package.json` name / `cordis.patch.yml` 行 id / `__ModuleLoader__.load({id})` | 插件列表能加载、无「导入失败」 |
| 槽位名 | `conversation.session.header.actions`、`sidebar.workspaces.directoryFlow`、`conversation.hero.workspace.directoryFlow`、`plugins.row.config` | 先跑 `npm run check:instance`（直接读 asar 逐项核对），再用 `cordis_inspect_query` 看名字与 props；同槽原生项顺序会变（rc.3 / rc.4：team -20、preset -10、subagent-catalog 10、job-list 20，rc.3/rc.4 还有 cost-meter 1；0.2.2-rc.1 实测 cost-meter 已不在同槽），本插件只依赖自己的 -40 |
| 服务依赖 | 必需 `slots` / `workspaces` / `uiWorkspace` / `locale`；可选 `configForms` / `shortcuts` / `contextMenus` | 下拉动作可用、设置页存在；0.2.2+ 上「更多」能弹出宿主菜单 |
| 行内「更多」 | 宿主的 `contextMenus` 服务（`ui-context-menu` provide）+ ui-workspace 的 `registerSessionMenus`（置顶/重命名/分支/复制 ID/归档） | 点开任一行的「⋯」：应看到宿主菜单；`npm run check:instance` 里对应两项应 PASS |
| 目录选择交互 | 插件**不接管、不自绘**：`workspace.add` → 宿主 occupant（native = 官方 renderless → 系统选择器；browse = 官方应用内面板）；槽空时才兜底 preload 桥 `__DSH_DIRECTORY_PICKER__` / `pickDirectory()` | 四种组合各点一次「添加工作区」：native 宿主应直接见系统对话框，browse 宿主应见官方应用内面板 |
| 顶栏 DOM 锚点 | `header[data-window-drag]` + `nav:has(~ div .bst-crumbs)`（0.2.0 的 `data-conversation-*` 已移除） | 原生标题被隐藏、窄屏切换正常 |
| primitives 组件 | `Modal` / `Button` / `Switch` / `*Regular` 图标（`Menu` / `Input` 已随自建菜单移除） | 错误对话框与插件设置页各点开一次 |
| 原生 chip 识别 | 结构锚点 `CHIP_ANCHORS`（子智能体 = `aria-haspopup="dialog"`）+ 文案词表 `CHIP_HINTS` / `SWITCHER_HINTS`（8 语言）；team 的容器锚点 `[data-team-action]` 只对老内核有效 | `npm run check:instance` 的「chip 结构锚点」「chip 文案关键字」两项应 PASS；实机看三枚 chip 是否仍有图标 / 计数 / 圆环 |
| 文案键 | 插件自有文案（添加工作区 / 新会话）；行内菜单文案属于宿主命名空间 | 中英各看一次 |

## 已知限制

- **行内「⋯」需要 DSH 0.2.2-rc.1+**（`contextMenus` 服务）。更早的内核上面包屑与两个下拉照常工作，只是没有这个入口 —— 侧栏仍是完整入口，插件不保留第二套菜单。详情页求星行同样依赖 0.2.2-rc.1+ 的 `plugins.detail.section` 槽（旧内核只是少一行）。
- **插件自有文案**：8 种官方语言全量覆盖（中/英/日/德/西/法/葡/俄），跟随 DSH 语言实时切换。
- **6 种新增语言是机器翻译**（日/德/西/法/葡/俄，人工只做了粗校），个别措辞可能不自然或不符合你的术语习惯 —— 欢迎提 Issue 或 PR 纠正：文案在 `lib/client.js` 的 `BST_JA` / `BST_DE` / `BST_ES` / `BST_FR` / `BST_PT` / `BST_RU`，包标题与描述在 `locale/*.json`。中/英为人工撰写。
- **npm 包页面的 README 相对链接**：registry 渲染的 README 里，指向 `docs/` 与截图的相对路径可能 404（GitHub 上正常）；以 GitHub 仓库页为准。
- **原生 chip 的装饰分两层**：**结构锚点优先**（子智能体那枚认 `aria-haspopup="dialog"`，与语言无关；锚点命中不唯一时要求文案也对得上，宁可不装饰也不认错），**官方文案兜底**（后台任务那枚官方没给结构锚点，只能按 8 种语言的 `aria-label` 词干识别，官方新增语言时把词干补进 `CHIP_HINTS`，见 MAINTAINING §7）。面包屑本身与语言无关。
- **0.2.2-rc.3 起顶栏只剩两枚 chip**：官方把「智能体团队」搬到子智能体树下方的任务板（`conversation.session.header.actions.subagent.footer`），顶栏里不再有那枚；插件的团队装饰只对更早的内核生效（`check:instance` 会把「已移出顶栏」作为结论打出来）。

## 贡献

见 [CONTRIBUTING.md](CONTRIBUTING.md)；安全问题请按 [SECURITY.md](SECURITY.md) 私下报告。
提交前请跑 `npm test`（渲染冒烟 + 语言键集 + 文档链接）。

## 特别感谢

感谢 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 与 DeepSeek AI 团队——核心的智能体、模型、工具、会话、Web UI 与插件生态都来自这个项目；也感谢 [Cordis](https://github.com/cordiverse/cordis) 提供的插件化基础，以及 [Koishi.js](https://koishi.chat/) 社区长期积累的插件化实践、工具与经验。

## 许可证

[MIT](LICENSE) —— 完全开源免费。

更好的会话顶栏是 DeepSeek Harness 的社区插件，**并非 DeepSeek 官方产品**。
