# 验收记录

> 自动化门 + 发布前实机清单。每次发版把结果补进文末的验收表。

## 自动化门

| 命令 | 覆盖 | 不覆盖 |
| --- | --- | --- |
| `npm test` | 用桩 React/primitives 执行工厂与组件渲染体；覆盖「有/无 `contextMenus`」两种场景；八本字典键集一致、值非空、`en` 无 CJK、`locale/*.json` meta 完整；求星行注册在 `plugins.detail.section`（`order < 90`）且按 `subject.pkg.name` 过滤 | 外观、真实宿主行为 |
| `npm run check:instance` | 直接读当前实例 `app.asar`（路径优先级：`--asar` → `DSH_APP_ASAR` → `DSH_INSTALL_DIR` → 各平台常见安装路径）：primitives 导出、四个槽位名、三个顶栏 DOM 锚点与 lineage 槽、`workspaces` / `uiWorkspace` 方法（按代码实际调用抽取）、`contextMenus` 服务、原生会话菜单注册、`workspace.add`、`locale` 入口、8 语言 chip 关键字、目录选择 occupant、preload 桥 | 运行时交互 |
| `node tools/check-docs.mjs` | 文档相对链接与锚点（CI 里随 `npm test` 一起跑） | 文档内容正确性 |

## 发布前实机清单

| # | 项 | 判据 |
| --- | --- | --- |
| 1 | 顶栏面包屑 | 普通会话两级、子智能体会话三级；祖先级可点跳回 |
| 2 | 折叠阶梯 | 收窄窗口：chip 先交数字 → 标题让位收图标 → chip 收图标；拉宽自动展开 |
| 3 | 窄屏两模式 | 详情页切换 `crumb` / `title`，顶栏即时变化 |
| 4 | 工作区下拉 | 切换工作区；「添加工作区」走宿主（native=系统对话框，browse=官方面板）；行内「⋯」弹宿主菜单 |
| 5 | 会话下拉 | 切换、新建；行内「⋯」/右键弹宿主菜单；置顶、复制 ID（有「已复制」提示）、归档 |
| 6 | 键盘 | 打开后焦点在首行；`↑↓`、`Home/End`、`Tab` 收起、`Esc` 归还焦点 |
| 7 | 详情页 | 两个设置即时生效；底部求星行（`⭐` 字符，位于市场「查看仓库」上方）；切换 8 种语言后文案跟随 |
| 8 | 清理 | 插件行关掉后，原生 chip 的文本/属性恢复、样式标签移除 |
| 9 | 老内核降级 | 0.2.1 及更早：面包屑与下拉可用、无「⋯」、无报错 |

## 验收表

| 版本 | 内核 | 自动化 | 实机 | 记录 |
| --- | --- | --- | --- | --- |
| 1.5.4 | 2.0.21-next / 0.2.1-rc.4 | `check:instance` 16/16 | 干净 profile 实装 + rc.3 点检（所有者执行） | `MAINTAINING.md` §6 |
| 2.0.0（2026-11-05） | 2.0.22-next / 0.2.2-rc.1 | `npm test` 通过；`check:instance` 18/18 | 四侧取证完成（本地 / GitHub / npm / 市场），见 `MAINTAINING.md` §6 | 本页 + `CHANGELOG.md` |
| 2.0.1（2026-11-06） | 2.0.22-next / 0.2.2-rc.1 | `npm test` 通过；`check:instance` 18/18 | 求星行改挂 `plugins.detail.section`（order 80 < 市场 90）；四侧取证见 `MAINTAINING.md` §6 | 本页 + `CHANGELOG.md` |
| 2.0.2（2026-11-14） | 2.0.23-next / 0.2.2-rc.3 | `npm test` 通过（含原生触发绑定场景）；`check:instance` **18/18** | 「⋯」走原生 `getTriggerProps`；实例更新零兼容性迁移，实时 Slots 两项 active | 本页 + `CHANGELOG.md` |
