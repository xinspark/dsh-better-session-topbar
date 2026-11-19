# 版本兼容

> 本插件跟随本地 DSH 实例升级。每次升级的结论与证据记在 [MAINTAINING.md](../../MAINTAINING.md) §6。

## 验证基线

| 项 | 值 |
| --- | --- |
| 插件版本 | **2.0.4**（2026-11-19 发布） |
| DSH NEXT | **2.0.24-next**（2026-11-19 实例更新；`versions/` 里的目录名仍是 `2.0.23-next`，属原地升级） |
| Harness 内核 | **0.2.2-rc.5** |
| 实机环境 | Windows · DSH NEXT 桌面 · profile 通过 junction 链接本仓库 |

> 认版本别看目录名：`app.asar!/package.json` 的 `version` 是**桌面壳**，内核在
> `dependencies["@deepseek-ai/dsh"]`。两者都从运行实例的 asar 读，不靠猜。

## 兼容矩阵

| DSH NEXT / 内核 | 面包屑与下拉 | 行内「⋯」 | 说明 |
| --- | --- | --- | --- |
| 2.0.24-next / 0.2.2-rc.5 | ✅ | ✅ | 当前验证基线；`check:instance` 19/19，`check:topbar` 结构零漂移（只有重建前缀变化） |
| 2.0.23-next / 0.2.2-rc.3 | ✅ | ✅ | 同一套契约；`check:instance` 19/19，「⋯」走原生 `getTriggerProps` |
| 2.0.22-next / 0.2.2-rc.1 | ✅ | ✅ | 同一套契约；无 `useContextMenu` 根 prop，走自绘手势回退 |
| 2.0.21-next / 0.2.1-rc.4 | ✅ | ❌ | 无 `contextMenus` 服务，不渲染「⋯」 |
| 2.0.20 / 0.2.1-rc.3 | ✅ | ❌ | 同上 |
| 0.2.1-rc.2 / 0.2.0-rc.2 | ✅ | ❌ | 同上；槽位顺序与 0.2.2 不同，插件不依赖它 |

**降级是刻意的**：没有 `contextMenus` 时插件不为「⋯」保留第二套自绘菜单，侧栏仍是完整入口。

## 官方顶栏自身的版本差异（影响被装饰的 chip）

| 内核 | 顶栏里的 chip | 插件怎么认 |
| --- | --- | --- |
| 0.2.2-rc.5 | 与 0.2.2-rc.3 **结构相同**（子智能体、后台任务；智能体团队在 `…subagent.footer` 的任务板）：接触面 16 个包逐文件 sha256 无差异，只有 CSS-Modules 前缀这类重建噪声 | 同 rc.3：子智能体用结构锚点 `aria-haspopup="dialog"`，后台任务用文案兜底 |
| 0.2.2-rc.3 | 子智能体、后台任务（**智能体团队已移出顶栏**，改挂 `conversation.session.header.actions.subagent.footer` 的任务板） | 子智能体优先用结构锚点 `aria-haspopup="dialog"`，后台任务用文案兜底 |
| 0.2.2-rc.1 及更早 | 子智能体、智能体团队、后台任务 | 团队用 `[data-team-action]` 容器锚点，其余文案兜底 |

团队包名也随版本变了（`dsh-experimental-client-ui-agent-team` → `dsh-client-ui-agent-team`），
`check:instance` 两个路径都试，并把「已移出顶栏」作为一条结论打出来 —— 不再是静默跳过。

## 只在新内核上才有的能力

| 能力 | 依赖 | 首次可用 |
| --- | --- | --- |
| 行内「更多」= 宿主菜单（权限门控 / 快捷键 / 官方对话框 / 复制提示 / 取消归档） | `contextMenus` 服务（ui-context-menu） | 0.2.2-rc.1 |
| 「⋯」/ 行的右键与 Shift+F10 走原生绑定（`getTriggerProps`） | 根 prop `useContextMenu` | 0.2.2-rc.3（更早走插件自绘回退） |
| 详情页求星行（独立详情区，位于市场「查看仓库」上方） | `plugins.detail.section` 槽 | 0.2.2-rc.1 |
| 下拉的键盘/ARIA 同原生 Menu | 无（插件自身实现） | 任何受支持版本 |

## DSH 升级对账流程

0. `npm run check:topbar` —— **先看「变了什么」**：它把官方顶栏相关面（槽位 / 谁注册进这些槽 /
   chip 的 `aria-haspopup` 与 activity 图标 / 计数节点标记 / DOM 锚点与哈希类名 / 用到的 primitives
   图标）与 `tools/baseline/topbar.json` 对比，输出 `+ / - / ~`。零差异可以直接跳到第 3 步；
   有差异则按差异去读对应官方包，改动确认后再 `-- --write` 推基线；
1. `npm run check:instance` —— 直接读当前实例的 `app.asar`，逐项 PASS/FAIL；
2. 按 [装配契约](architecture.md#6-10-类耦合点升级后逐项复核) 的 10 类耦合点逐项复核；
3. 实机点一遍：顶栏 / 两个下拉 / 添加工作区 / 详情页 / 行内「⋯」；
4. 把结论与证据写进 `MAINTAINING.md` §6（零迁移也要写依据）。

## 容易踩的两条

- **包标题/描述在宿主启动时读取**：改 `locale/*.json` 后必须重启 app，刷新页面只重载客户端；
- **改包名后运行中的宿主不会收敛**：磁盘状态改完仍要重启一次，旧 bundle 的组合行不会自动卸载。
