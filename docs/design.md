# 设计说明

> 为什么这么实现、哪些约束不能破。装配细节见 [装配契约](reference/architecture.md)，
> 踩坑记录见 [项目经验](experience/README.md)。

## 目标与非目标

**目标**：把 DSH 顶栏中央的原生会话标题换成「工作区 / 会话」面包屑，切换入口直接放进顶栏；
复用宿主已有能力，不引入新能力、不改系统源码。

**非目标**：不替代侧边栏；不自建目录选择面板；不接管任何原生槽位；不维护第二套行内菜单。

## 1. 面包屑与折叠阶梯

顶栏只出现两种形态：**整条文本**或**整条图标**，不会一级文本一级图标。折叠判据是
**实测可用宽度** `avail()`，不是 `header.clientWidth`：

- `avail()` = 所在 flex 行右边缘 − 我们的左边缘 − 排在我们后面的兄弟（递归下钻
  `display:contents` 包裹层）；
- 阶梯：三枚原生 chip `full → count` → **整条面包屑收成图标**（统计数保留）→ chip
  `count → icon`；
- 展开需要额外回差 `CRUMB_TEXT_ADD`，避免「展开 → chip 升档变宽 → 又折叠」的 300ms 翻动。

**不要**用 header 宽度做滞回：折叠常由改名、新 chip 出现引起，按 header 宽度记基准会
折下去解不开（见 [经验 02](experience/02-折叠后解不开.md)）。

图标态下每级都必须有图标，`/` 分隔保留，每个按钮都有 `aria-label` / `title` —— 文本
`display:none` 时仍可读。

## 2. 原生 chip：装饰而非接管

子智能体 / 智能体团队 / 后台任务由别的插件渲染，插件**不接管、不隐藏**，只在测得的按钮上
写 `data-bst-chip` / `data-bst-chip-mode`，样式与档位都由这两个属性驱动。识别分两层：

1. **结构锚点优先**（`CHIP_ANCHORS`，与语言无关）：子智能体 trigger 在 0.2.2-rc.3 上是
   `aria-haspopup="dialog"` —— 该槽里只有它带这个属性。锚点命中**唯一**时直接认，不看文案；
   命中多个时必须文案也对得上，否则这一轮放弃装饰（同槽还有 `aria-haspopup="dialog"` 的
   反例：conversation 的 ContextMeter，宁可少装饰一枚，也不给别人的按钮套统计数）。
2. **文案兜底**（`CHIP_HINTS` / `SWITCHER_HINTS`，官方 8 种语言）：官方类名是哈希的、
   会随版本变，所以只能当兜底。后台任务那枚官方没给任何结构锚点（只有 `aria-expanded`
   与 i18n `aria-label`），至今仍只能靠文案 —— 官方加语言时把词干补进表里。

识别失败时退化为不装饰，而不是报错。

统计数从 aria-label 取数字（各语言位置不同，不能只认开头）；切换器形态先排除，避免把标题里的
数字当计数。团队那枚没有统计数与圆环，由插件补，圆环与官方 spinner 同相。
**0.2.2-rc.3 起**官方把「智能体团队」这枚 chip 搬出顶栏（挂到
`conversation.session.header.actions.subagent.footer`，渲染任务板），顶栏里只剩子智能体与
后台任务两枚；插件的团队装饰因此只对老内核生效，`check:instance` 会把「已移出顶栏」作为
一条结论打出来，而不是静默跳过。

## 3. 下拉与「更多」菜单

- 下拉是自绘层，必须 portal 到 `document.body`（否则被外壳/聊天内容盖住）；
- 外部关闭监听 `click` 而非 `pointerdown`/`mousedown`：后两者先于 `click` 派发，会先卸载列表、
  吃掉行内 click；
- 行内「更多」**不自绘**：调用宿主的 `contextMenus.open(target, point)`，条目、权限门控、
  快捷键键帽、重命名/删除对话框都由 ui-workspace 渲染。插件只传目标与视口坐标，并在自己的
  下拉全部关闭时显式 `close()`（我们的下拉根节点是 `role="menu"`，宿主的外部关闭会把它当成
  「菜单内部」，不显式收会留下浮层）。

## 4. 设置页与多语言

- 详情页注册在 `plugins.row.config`，键 `<包名>#<行 id>`；
- 唯一事实源是宿主的 `configForms`，`narrowMode` 是枚举（`'crumb' | 'title'`），两个字段都
  `.volatile()`；
- 插件自有文案覆盖官方 8 种语言（37 键 × 8 本字典，键集一致）；6 种新增语言为机器翻译，
  见 README「已知限制」；
- 包标题/描述在 `locale/*.json`，**宿主启动时读取**，改完要重启 app。

## 5. 不能破的不变量

| 不变量 | 原因 |
| --- | --- |
| 三处同名（package name / patch 行 id / `__ModuleLoader__.load({id})`） | 宿主按包名解析并投递工厂，不一致 = 插件静默不出现 |
| 硬依赖写 `inject`，可选服务走 `ctx.inject` 子级 | 可选服务缺席时只少一个入口，不能让整个插件不 apply |
| `.bst-crumbs` 是公开类名 | 第三方「隐藏顶栏重复元素」的规则按它豁免，改名会让它们转而隐藏本插件 |
| 窄屏标题态用 `display:none` 藏工作区级 | `crumbNeed` 按 `.bst-crumb-btn` 数量推导，删掉会让阈值跳变、来回翻 |
| 卸载时撤回写进官方 DOM 的一切 | 否则热更新/卸载后留下一排「坏掉的 chip」 |
