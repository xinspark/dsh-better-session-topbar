# 贡献指南

感谢你愿意参与。这是一个 **DSH Web GUI 的纯前端插件**：没有构建步骤，`lib/client.js` 就是浏览器实际执行的代码；
配套的 host 半 `index.js` 只声明两项配置的 schema。

## 环境要求

| 依赖 | 版本 | 说明 |
| --- | --- | --- |
| Node.js | ≥ 20 | 跑 `npm test` 与 `tools/` 下的校验脚本，不需要安装依赖 |
| DSH（Web GUI） | 见 [版本兼容](docs/reference/compatibility.md) | 行内「更多」需要 0.2.2-rc.1+ |
| PowerShell | 7+ | Windows 上跑脚本；其它平台用等价 shell |

## 本地开发

插件通过 profile 的 `node_modules` 链接加载。推荐用 junction/symlink 指向工作树
（本仓库开发机的布局是 `plugins/dsh-better-session-topbar/current → main`）：

```sh
dsh plugin --profile web add ./dsh-better-session-topbar
dsh web                       # 或 dsh --profile web
```

开发循环：

| 改动 | 生效 |
| --- | --- |
| `lib/client.js` | 刷新页面 |
| `index.js`（host 半） | 插件页把本行关掉再打开 |
| `locale/*.json` 的包标题/描述 | **重启 app**（宿主启动时读取） |
| `cordis.patch.yml` / 包名 | 重启 app（旧组合行不会自动卸载） |

## 常用命令

```sh
npm test                      # 渲染冒烟 + 语言键集 + 文档链接（CI 同款）
npm run check:instance        # 读当前实例 app.asar，逐项核对 18 项硬契约
npm run check:instance -- --asar "<path>/app.asar"   # 指定实例
npm pack --dry-run            # 看发布包含哪些文件
```

`check:instance` 需要本机装有 DSH；CI 上没有实例，所以它不在 `npm test` 里。

## 目录约定

| 目录 | 用途 |
| --- | --- |
| `index.js` | host 半：`Config` schema + 关闭自动表单 |
| `lib/client.js` | 浏览器半：全部界面逻辑（UMD） |
| `locale/*.json` | 包标题/描述（8 种官方语言） |
| `test/` | 渲染冒烟与语言校验（不验外观） |
| `tools/` | 实例对账、文档链接校验（不随包发布） |
| `docs/` | 公开文档，入口见 [docs/README.md](docs/README.md) |
| `docs-private/` | 私有文档（路线图/决策/调研/发版清单）；只有 `README.md` 入库，其余在本机 |
| `MAINTAINING.md` | 维护者作业手册（发版、审批、市场） |

## 代码风格

- **没有构建**：写进 `lib/client.js` 的代码会原样在浏览器执行；不引入依赖，不写只在打包器里成立的语法；
- **注释解释「为什么」**：阈值、回差、避让顺序这类决定必须写清依据与实测证据，否则下一个人会当成 bug 改掉；
- **三处同名**：`package.json` name / `cordis.patch.yml` 行 id / `__ModuleLoader__.load({id})`
  必须逐字一致（见 [经验 01](docs/experience/01-三处同名.md)）；
- **八本字典同一套键**：新增文案要同时补 `BST_ZH` / `BST_EN` / `BST_JA` / `BST_DE` / `BST_ES` /
  `BST_FR` / `BST_PT` / `BST_RU`；`npm test` 会拦；
- **中文注释可以，界面文案不行**：界面文案一律走 `bstT()` / locale，`en` 字典不得含 CJK（测试会拦）；
- **不改 React 拥有的节点**：需要装饰原生 chip 时只写 `data-bst-*`，卸载时撤回。

## 提交与 PR

- 第一行写清「做了什么」，正文写「为什么」；一个 PR 只做一件事；
- 行为改动需补测试（渲染冒烟/语言门）或说明实机验证步骤；
- 破坏性改动同时更新 `CHANGELOG.md` 的 `[Unreleased]`；
- UI 改动请附截图；文档改动请跑 `node tools/check-docs.mjs`（`npm test` 已包含）。

## 报告问题

用 Issue 模板（Bug / Feature）。Bug 报告请附：

1. 插件版本（Plugins 页可见）与 DSH NEXT / Harness 内核版本；
2. 安装方式（npm / GitHub tag / 本地目录）与 profile；
3. 复现步骤、期望与实际；
4. 探针日志：[配置](docs/guide/configuration.md) 里打开「探针日志」，贴 `[bst-dom]` / `[bst-chip]` /
   `[bst-perf]` / `[bst-picker]` 相关行（脱敏后）。

## 许可证

提交即表示你同意以 [MIT](./LICENSE) 许可证授权你的贡献。
