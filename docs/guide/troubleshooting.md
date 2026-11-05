# 故障排查

> 每条都是「症状 → 原因 → 处理」。根因的证据与代码位置见 [项目经验](../experience/README.md)。

## 插件在列表里显示「导入失败」或整条不出现

- **原因**：`package.json` 的 `name` / `cordis.patch.yml` 的行 id / `lib/client.js` 的
  `__ModuleLoader__.load({id})` 三处不一致；或改了包名后运行中的宿主还组合着旧行。
- **处理**：核对三处同名；重启 app 一次（旧 bundle 的组合行不会自动卸载）。

## 界面正常，但下拉里的切换 / 新建点了没反应

- **原因**：`apply` 抢跑，`ctx.<service>` 在服务注册前取到 `undefined`，并被永久捕获进闭包。
- **处理**：确认这些服务在 `inject` 里声明（`slots` / `workspaces` / `uiWorkspace` / `locale`）；
  可选服务走 `ctx.inject` 子级，不要写进硬依赖。

## 行尾没有「⋯」

- **原因**：当前内核没有 `contextMenus` 服务（0.2.1 及更早）；这是**刻意的降级**，插件不为它保留
  第二套自绘菜单。
- **处理**：用侧边栏的行内操作；或升级到 0.2.2-rc.1+。

## 点「⋯」弹的不是宿主菜单

- **原因**：页面还在跑旧 bundle（客户端按请求读磁盘）。
- **处理**：刷新页面。宿主菜单的特征：有快捷键键帽、权限不足的条目会消失、支持右键打开。

## 顶栏挤窄后收成图标，窗口拉宽也不恢复

- **原因**：用了 header 宽度做滞回（历史 bug）；折叠由内容变化（改名、新 chip）引起时，
  按 header 宽度记基准会永远解不开。
- **处理**：判据必须只用实测可用宽度 `avail()`；展开门槛 = `crumbNeed + CRUMB_TEXT_ADD`。

## 三枚原生 chip 没有图标 / 统计数 / 圆环

- **原因**：插件靠 `aria-label` 关键字识别 chip；官方新增语言、或改了文案会导致识别失败。
- **处理**：把该语言词干补进 `CHIP_HINTS` / `SWITCHER_HINTS`；`npm run check:instance` 的
  「chip 文案关键字（8 语言）」一项会先红。

## 改了 `locale/*.json` 但标题/描述还是英文

- **原因**：包标题/描述是**宿主启动时**读取的；刷新页面只重载客户端。
- **处理**：重启 app。实测证据见 [经验 06](../experience/06-locale-meta-启动读取.md)。

## 下拉被页面内容盖住

- **原因**：没有 portal 到 `document.body`，留在顶栏槽位的层叠/裁剪上下文里。
- **处理**：确认下拉走 `createPortal(listEl, document.body)`。

## 点行内「更多」后下拉被提前关掉

- **原因**：外部关闭监听了 `pointerdown` / `mousedown`，它们先于 `click` 派发，列表被先行卸载，
  行内 click 丢失。
- **处理**：外部关闭只监听 `click`。

## 「添加工作区」选了目录后什么都没发生

- **原因**：服务未就绪或 `create` 返回空，被静默吞掉。
- **处理**：插件应走可见错误对话框；同时确认槽里有宿主 occupant（`workspace.add` 才有交互）。
  打开探针日志，看 `[bst-picker]` 走的是宿主流程还是兜底。
