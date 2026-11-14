# 维护规范（MAINTAINING）

> 本文件是维护者的作业手册。规则由仓库所有者（xinspark）制定，维护者按此执行。

## 1. 角色与范围

维护者负责 **更好的会话顶栏 / Better Session Topbar**（包名与仓库名同为 `dsh-better-session-topbar`）的三件事：

1. **GitHub 运维**：`xinspark/dsh-better-session-topbar` 的 Issues 与 PR——分诊、复现、给结论、写回复草稿、按批准执行回复/关闭/合并。
2. **跟随 DSH 版本**：本地 DSH 实例（DSH NEXT / DSH 原生桌面 / `dsh` CLI）升级后，判断插件是否需要适配或升版本，按 `lib/client.js` 顶部的「DSH 升级维护清单」逐类核对。
3. **插件市场提交**：插件发版后同步市场条目。

**私有材料**：路线图 / 待办 / 决策记录 / 调研 / 本机环境 / 发版清单放 `docs-private/`（只有 `README.md` 入库，其余被 `.gitignore` 排除）；结论稳定后升级为 `docs/` 的公开文档。公开目录见 [docs/README.md](docs/README.md)。

## 2. 硬规则

- **维护窗口：每天 21:00（Asia/Shanghai）**。窗口外只做本地准备，不做对外动作。
- **所有对外部有影响的动作，必须先获得所有者逐项批准**，批准前只准备草稿。对外动作包括但不限于：
  - `git push`（含 `--force-with-lease`）、打 tag、创建 GitHub Release、改仓库设置/仓库名；
  - 创建/回复/关闭 Issue、创建/合并/评论 PR、请求 review；
  - 向插件市场（`awesome-dsh-plugin/awesome-dsh-plugin`）提 PR 或改条目；
  - 任何第三方仓库上的写操作。
- **不需要批准的本地动作**：读代码与远端资料、跑校验、改代码、本地 commit、本地 tag、写草稿/报告。
- **文档门**：`npm test` 里包含 `tools/check-docs.mjs`（公开文档的相对链接与锚点）；新增/移动文档必须让门通过。公开文档结构见 [docs/README.md](docs/README.md)，本文件是维护者手册。
- **已记录的授权**：2026-10-28 所有者明确指示「完全改名」，据此执行了 `gh repo rename`（`dsh-better-session-title` → `dsh-better-session-topbar`）及随之的推送与 Release；其余对外动作仍逐项批准。

## 3. 每日 21:00 检查清单

1. **GitHub**：列出 open Issues / PRs，每条给：现象、是否可复现、建议处置（修复 / 需要信息 / 关闭）、回复草稿。
2. **DSH 版本**：记录当前实例版本（DSH NEXT 版本、runtime `@deepseek-ai/dsh` 版本、客户端包版本）；与插件上次适配的版本比对；先跑 `npm run check:instance`（读 `app.asar` 逐项核对槽位名 / 组件导出 / DOM 锚点 / 服务方法，逐项 PASS/FAIL，项数以脚本输出为准），再按「DSH 升级维护清单」10 类耦合点给出「本次升级是否影响」的结论。
3. **待发布**：本地未推送提交、未发布 tag、版本号与 CHANGELOG 是否一致。
4. **市场**：`awesome-dsh-plugin/awesome-dsh-plugin` 的 `data/plugins/xinspark__dsh-better-session-topbar.yml` 与 README 列表条目，是否与最新版本/功能一致；只输出 diff 草稿。
5. **汇总**：把「今晚可执行的外部动作」逐项列出，等批准。

## 4. 发版流程

1. 改代码与档（CHANGELOG 新开一节、README 的安装 tag 与 tarball 名）。
2. `package.json` 版本号 + 本地 commit + 本地 annotated tag。
3. **请求批准**后：`git push`（远端分叉时用 `--force-with-lease`，并说明被替换的历史）+ 推 tag。
4. 建 GitHub Release（附 CHANGELOG 摘要），再按需更新市场条目。
5. **发到 npm**：走 **Trusted Publishing（GitHub Actions + OIDC）**，**不需要任何 npm token**。
   - 触发：发布 Release（`published`）或 Actions → `publish` → Run workflow；CI 先跑 `npm test`，再 `npm publish --provenance`。
   - 一次性配置（已完成，2026-10-29）：npm 包页面 → Settings → Trusted Publisher → GitHub Actions，`xinspark` / `dsh-better-session-topbar` / `publish.yml`，并勾选「Allow npm publish」。
   - **发完要复核** `dist-tags.latest`：registry 有约 1–2 分钟处理延迟，CI 打出 `+ pkg@version` 不等于立刻可查。
   - 历史遗留：`0.0.0-stage` 占位版本（staged publishing 产物），不影响 `latest`。
   - 旧的命令行 token 发布已停用（账号安全策略不允许），发版一律走 Trusted Publishing。

## 5. 插件市场说明

- `dsh-market/dsh-market` 是**市场应用本体（TypeScript）**，不是插件目录；它的 README 明确写着「要收录插件请去 awesome-dsh-plugin 提 PR」。
- 真正的目录是 **`awesome-dsh-plugin/awesome-dsh-plugin`**：
  - 单条数据：`data/plugins/xinspark__dsh-better-session-topbar.yml`（`url` / `name` / `category` / `description.en|zh`）；
  - 列表条目：`README.md` 与 `README.zh.md` 的 UI 分类下一条链接。
- 只在**功能描述或仓库地址变化**时改它；纯版本号升级（目录里不含 version 字段）不需要动。

## 6. 当前待办（2026-10-30）

- [x] **v1.4.0 发布**（2026-10-27）：tag `v1.4.0` → `a9ab1fe`，GitHub Release 已建，远端 `main` = `1738c3d`（含 MAINTAINING 本文）。
- [x] **v1.5.0 发布**（2026-10-28）：tag `v1.5.0` → `e3ba1d9`（快进自 `1738c3d`，无需 force），远端 `main` = `e3ba1d9`；Release <https://github.com/xinspark/dsh-better-session-topbar/releases/tag/v1.5.0>（非 draft / 非 prerelease，正文取 CHANGELOG 1.5.0 节）。内容：跟随 DSH NEXT 2.0.20 / Harness 0.2.1-rc.3，「添加工作区」完全交给宿主，删除自绘面板与目录流接管；新增 `npm test` 渲染冒烟。
- [x] **v1.5.1 发布**（2026-10-28）：**仓库改名完成** —— `dsh-better-session-title` → `dsh-better-session-topbar`，包名与仓库名终于一致；代码零改动。tag `v1.5.1` → `378ac0a`，Release <https://github.com/xinspark/dsh-better-session-topbar/releases/tag/v1.5.1>；旧仓库地址由 GitHub 重定向保持可用（实测 `git ls-remote` 旧串仍能解析到同一 tag）。
- [x] **npm 上架**（2026-10-28）：`dsh-better-session-topbar@1.5.1` 首次发布到 `registry.npmjs.org`，tarball shasum `6f0073dd…` 与本地打包一致；`dsh plugin add dsh-better-session-topbar` 从此无需 GitHub 前缀。
- [x] **v1.5.2 发布**（2026-10-29）：**纯文档版**，代码零改动。tag `v1.5.2` → `56255d8`，Release <https://github.com/xinspark/dsh-better-session-topbar/releases/tag/v1.5.2>；npm 上 `dist-tags.latest = 1.5.2`，包内 README 已含「npm 优先」安装段（1.5.1 的包内 README 停留在只写 GitHub 的旧稿）。
- [x] **市场条目改名的 PR**：分支 `update/dsh-better-session-topbar`（提交 `671daae`）——条目文件改名为 `xinspark__dsh-better-session-topbar.yml` 并更新 `url` / `name` / 描述（去掉 1.5.0 已删除的「同度量对话框」措辞）。**已合并：[#10090](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/10090)**（`fkysly` 于 2026-10-28T17:09:54Z 合并，merge commit `2d548a9`）。
- [ ] **市场条目描述加产品名前缀**（2026-10-29）：搜索「更好的会话顶栏 / Better Session Topbar」找不到条目——原描述以「把会话顶栏标题换成…」开头，从没出现过产品名。已把中英描述都加上前缀（`更好的会话顶栏：` / `Better Session Topbar: `），两个 README 用 `generate-readme.mjs` 重新生成，只动本条目。分支 `update/topbar-description-prefix`（提交 `09aecdb`）已推到 fork，**PR 已开：[#10234](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/10234)**（`gh pr create` 仍 403，用浏览器代开）。等上游合并即可。
- [x] **npm 页面 README 已刷新**（2026-10-29，随 1.5.2）：包内 README 现在写的是「npm 优先、GitHub 等价」，CHANGELOG 也补上了「上架 npm」那条。1.5.1 的包内快照是发布早于文档更新造成的，已随新版本自然消解。
- [x] **v1.5.3 发布**（2026-10-29）：**修复三级面包屑**在窄顶栏下的三处显示问题（文字溢出、分隔符被压没、末级箭头被裁），代码层面只动 CSS 约束。tag `v1.5.3` → `2e8463e`；Release <https://github.com/xinspark/dsh-better-session-topbar/releases/tag/v1.5.3>；**npm 由 GitHub Actions 首次以 Trusted Publishing 完成发布**（run 40782810320，success，带 provenance），`dist-tags.latest = 1.5.3`。
- [x] **npm 改为 Trusted Publishing**（2026-10-29）：新增 `.github/workflows/publish.yml`（`release: published` + `workflow_dispatch`，`id-token: write`，跑 `npm test` 后 `npm publish --provenance`）；npm 包页面已配好 Trusted Publisher（细节见私有环境记录）。**从此发版不再需要任何 token**。
- [x] **npm 令牌清理 + 2FA 恢复**（2026-10-29）：发布用的旧 token 已删除，账号级「写入操作要求 2FA」已勾回；发版走 Trusted Publishing，不再依赖命令行 token。**具体令牌名、账号操作与恢复步骤属运维细节，记录在本机私有文档（`docs-private/env/accounts.md`），不写进公开文档。**
- [x] **`0.0.0-stage` 占位版本 —— 已知遗留，决定不处理**（2026-10-29，所有者决定）：staged publishing 首次发布留下的空壳，不在 `latest` 上、`dsh plugin add` 永远装到稳定版，**不影响安装与运行**。清理需要临时调整 2FA 与令牌，属高风险运维操作；**清理步骤见私有记录**，在所有者明确要求前不动。
- [x] **实机验收**（2026-10-29，所有者本人执行）：干净 profile 实装 tag 版 + rc.3 界面点检（顶栏 / 两个下拉 / 添加工作区 / 插件详情页）已跑完，**无问题**。维护者未逐项复核，本条以所有者确认为准。
- [x] **实例同步：2.0.20 / rc.3 → 2.0.21-next / rc.4**（2026-10-30，本地提交 `1.5.4`）：**结论零迁移**。逐包 sha256 比对 npm tarball（rc.3 vs rc.4）：`primitives` 的 `lib/index.js` **540,800 字节逐字相同**；`conversation` 只有会话视图标签 tooltip（去掉 `session.moreViewsCurrent`）与顶栏无关；`ui-workspace` / `slots` / `locale` / `layout` / `dsh-workspace` / `host-directory-picker-auto` 只改 `package.json`。桌面壳 2.0.21-next 的更新说明里没有顶栏/标题栏改动（上游 rc.4 + 启动与窗口状态恢复 + 恢复助手 + Agents Anywhere 2.1.0）。运行期用 `cordis_inspect_query`（client Slots）复核：`conversation.session.header.actions` 仍是 session 作用域 list 槽，`bst-breadcrumb -40`（active）排最前，其余五个原生项顺序与 rc.3 相同；`plugins.row.config` 的键仍 active。**代码零改动，只改注释与文档**。
- [x] **新增实例对账命令**（2026-10-30）：`tools/check-instance.mjs` + `npm run check:instance` —— 直接读当前实例的 `app.asar`，核对 16 项硬契约（primitives 21 个具名导出、四个槽位名、四个顶栏 DOM 锚点、`workspaces` / `sessions` 门面方法、`uiWorkspace` 五个方法、`workspace.add`、`locale` 入口、宿主目录选择 occupant、preload 桥）。期望值从 `lib/client.js` 自己抽取，不在脚本里抄第二份；`tools/` 不在 npm `files` 白名单，不随包发布。本机实测 16/16 PASS。（2026-11-05 起：服务方法改为从代码**实际调用**处抽取，并新增 `contextMenus`、原生会话菜单注册、8 语言 chip 文案关键字三项；2026-11-15 又加入「chip 结构锚点」并把会话/工作区菜单合成一项，**现为 19 项**，项数以脚本输出为准；见 §7。）
- [x] **v1.5.4 发布**（2026-10-30/31）：四侧完成。远端 `main` = `b28097a`；tag `v1.5.4`（annotated，peel 到 `b28097a`）；Release <https://github.com/xinspark/dsh-better-session-topbar/releases/tag/v1.5.4>（非 draft / 非 prerelease，`publishedAt` 2026-10-30T19:57:05Z）；Actions run `41119390181` success → `npm publish --provenance`，registry.npmjs.org `dist-tags.latest = 1.5.4`（`2026-10-30T19:58:22.797Z`，带 SLSA provenance + sigstore 签名），镜像 npmmirror 随后同步到 1.5.4。内容核对：发布包里的 `lib/client.js` 与提交 `b28097a` 的 blob **逐字节相同**（174,193 B）。市场条目**未动**（目录无 version 字段，功能描述未变；描述前缀 PR #10234 已于 2026-10-28T23:20:11Z 合并）。本地：相关 profile 的软链均解析到 1.5.4，运行实例里 `bst-breadcrumb -40` active。
- [x] **v2.0.0 发布（四侧取证，2026-11-05）**：
  - **本地**：`package.json` = 2.0.0；`npm test` 通过（渲染冒烟 + 八本字典 + 23 个文档链接）；`check:instance` 18/18；annotated tag `v2.0.0` → 发布提交 `7d21d75`；profile 链接解析到 2.0.0。本地 `npm pack` 的 `lib/client.js` 因 Windows 工作树 CRLF 与发布包不同，**以 git blob 比对为准**（见 npm 侧）。
  - **GitHub**：发布提交 `7d21d75` 已推送；tag object `63e3cc0` → commit `7d21d75`；Release <https://github.com/xinspark/dsh-better-session-topbar/releases/tag/v2.0.0>（非 draft / 非 prerelease，`publishedAt` 2026-11-05T12:15:29Z）；Actions run `42025607757` success，日志含 `+ dsh-better-session-topbar@2.0.0`，provenance 写入 sigstore（`logIndex=3693436082`）。
  - **npm**：`dist-tags.latest = 2.0.0`；`dist.shasum = 2e9b71b1675d8251a79d00fa293ce7d2b538b37b`，`dist.integrity = sha512-p5wwLpJmKoz0w5lhCoxlIGai3YHb6EoC6NRXfTPZx1oumx3vPUFi69lyIQd6SOciaLMqzPm7sg+/DGiyqdCvJw==`，`dist.attestations = true`。下载 tarball 核对：**17/17 文件**与 tag blob 逐字节一致（`lib/client.js` sha256 `39133fabc0298f741e896b6b851ab40f281f35a90e7067bc62208f4ead8bc5e8`）。
  - **插件市场**：目录条目 `data/plugins/xinspark__dsh-better-session-topbar.yml` 的 `url` / `name` / `category` 未变，目录**没有 version 字段**；描述仍与 2.0.0 功能一致，**本轮不改**，无需 PR。
- [x] **v2.0.2 发布（四侧取证，2026-11-14）**：
  - **本地**：`package.json` = 2.0.2；`npm test` 通过（渲染冒烟含原生触发绑定场景 + 23 个文档链接）；`check:instance` 18/18；`npm pack` 2.0.2（17 files，111.5 kB → 112.5 kB tarball）；annotated tag `v2.0.2` → 发布提交 `5bae4e9`；profile 链接解析到 2.0.2。
  - **GitHub**：`main` = `5bae4e9`；tag object `989ea65` → commit `5bae4e9`；Release <https://github.com/xinspark/dsh-better-session-topbar/releases/tag/v2.0.2>（非 draft / 非 prerelease，`publishedAt` 2026-11-14T09:33:30Z）；Actions run `43581119610` success，日志含 `+ dsh-better-session-topbar@2.0.2`，provenance `logIndex=3874906703`。
  - **npm**：`dist-tags.latest = 2.0.2`；`dist.shasum = a868ce0c63c282f605b109565aa1ec38d8cf638d`，`dist.integrity = sha512-kDhk2yzmrgiLs+YK+Wwk4ZZ0ztgVZ9q1fZIJg9IHkdStO9C7sj+JQg5TovNJpCr/nfg0q4Hk1fAgGWSIjAVEEg==`，`dist.attestations = true`；下载 tarball 核对 **17/17 文件**与 tag blob 逐字节一致。
  - **插件市场**：条目 `url` / `name` / `category` 未变，目录无 version 字段，描述仍准确；**本轮不改**，无需 PR。
- [x] **实例更新对账：0.2.2-rc.1 → 0.2.2-rc.3（壳 2.0.22-next → 2.0.23-next，2026-11-14）**：结论 **零兼容性迁移**，另做一处原生对齐。
  - 认版本：运行实例的 `app.asar!/package.json` = 壳 `2.0.23-next`、`dependencies["@deepseek-ai/dsh"]` = `0.2.2-rc.3`；版本目录名仍是 `2.0.22-next`（原地升级，别拿目录名当版本）。两份 asar（壳自带与 `E:\FXS\APP\DSH NEXT\resources\app.asar`）sha256 相同（`003B66E8…`），host 进程实际加载后者。
  - `check:instance` 首轮 **16/18**：两项 FAIL 均为**校验脚本的字符串精确匹配过期**（rc.3 把 `provide("contextMenus")` 改成模板反引号、`target: "session"` 同）→ 判据改符号级正则后 **18/18 PASS**。**契约本身没变**：`contextMenus` 仍是 `active/register/resolve/close/open(target,point,options?)`，`registerSessionMenus` 仍注册 `session.*`（target `session`）。
  - 实时 Slots 佐证：`conversation.session.header.actions` 里 `bst-breadcrumb`(-40, active)；`plugins.detail.section` 里 `bst-star`(80, active)，市场来源行 `dsh-market-source`(90) 仍在后面。rc.3 该槽新增 `agent-terminals`(0) 与 `agent-preset`(-10) 等，插件不依赖它们的数字。
  - 服务面复核：`configForms` 仍在（`dsh-client-locale` 的 `inject=[slots,remote,configForms]` 且 `ctx.configForms.get(...)`）；`shortcuts.invoke(id, {modal})` 签名未变（`context.modal !== null` 判断兼容我们的 `{modal:null}`）；`workspaces.create({path})`、`uiWorkspace.pickDirectory()`、`locale.bind/register` 全部在。
  - 顺带对齐（rc.3 新能力）：「⋯」改用根 prop `useContextMenu().getTriggerProps(target, handlers)`；`plugins.row.config` 注册去掉槽不认的 `locale`。均为**带旧内核回退**的改动，`npm test` 增一条场景覆盖两条路径。
- [x] **v2.0.1 发布（四侧取证，2026-11-06）**：
  - **本地**：`package.json` = 2.0.1；`npm test` 通过（渲染冒烟 + 23 个文档链接）；`check:instance` 18/18；`npm pack` 2.0.1（17 files）；annotated tag `v2.0.1` → 发布提交 `537d706`；profile 链接解析到 2.0.1。
  - **GitHub**：`main` = `537d706`；tag object `306b172` → commit `537d706`；Release <https://github.com/xinspark/dsh-better-session-topbar/releases/tag/v2.0.1>（非 draft / 非 prerelease，`publishedAt` 2026-11-05T16:11:26Z）；Actions run `42061976596` success，日志含 `+ dsh-better-session-topbar@2.0.1`，provenance 写入 sigstore（`logIndex=3695938951`）。
  - **npm**：`dist-tags.latest = 2.0.1`；`dist.shasum = 333b29599936d7769a25b40939ae6dac82dfe4e0`，`dist.integrity = sha512-ziwdCctsXSwrRDfX4ccbC9RK1zFg8f6jZ3IobqWnoxmapCPXsChzp2qmRqW0Uhxub0k8SBJ0bsrTgv6SgHHThQ==`，`dist.attestations = true`。下载 tarball 核对：**17/17 文件**与 tag blob 逐字节一致。
  - **插件市场**：条目 `url` / `name` / `category` 未变，目录无 version 字段，描述仍准确，**本轮不改**，无需 PR。

- [x] **工具与元数据校正（2026-11-15，本地改动，未发版）**：三处与实际情况脱钩的地方对齐，代码零行为变化。
  - **`check:instance` 能开箱跑**：实例发现加 `DSH_INSTALL_DIR`（DSH 托管环境注入的当前实例 `app.asar`），优先级 `--asar` → `DSH_APP_ASAR` → `DSH_INSTALL_DIR` → 各平台候选路径，并接受 asar 文件或安装目录两种形态。根因：本机实例在多版本启动器目录 `E:\FXS\APP\DSH NEXT\resources\app.asar` 下，不在硬编码候选里，此前必须先手填 `--asar`。现在 `npm run check:instance` 直接 **PASS**（当时 18 项；`dsh-desktop-next 2.0.23-next · harness 0.2.2-rc.3`）。
  - **`dsh.verifiedAgainst` 从 `0.2.2-rc.1` 抬到 `0.2.2-rc.3`**：与 2.0.2 的对账基线（§6 上一条 / `docs/reference/compatibility.md`）一致；README 中英「验证基线」行同步为 2.0.23-next / 0.2.2-rc.3。
  - **Issue 模板占位版本号**：插件 `1.5.4` → `2.0.2`，DSH `2.0.22-next / 0.2.2-rc.1` → `2.0.23-next / 0.2.2-rc.3`。
  - 门：`npm test`（渲染冒烟 + 23 个文档链接）通过；`check:instance` 全 PASS（当时 18 项）。**`package.json` 版本号未动（仍 2.0.2），这批改动进 CHANGELOG `[Unreleased]`，随下个版本发布**；`tools/` 不在 npm `files` 白名单，脚本改动本身不改变发布包内容。

- [x] **chip 识别改结构锚点优先（2026-11-15，本地改动，未发版）**：本轮把「三枚 chip 靠 8 语言文案识别」这条最脆的路收窄，同时抓出对账脚本两处假绿。
  - **取证**（逐包读实例 `app.asar` 的官方 client.js）：子智能体 trigger 带 `aria-haspopup="dialog"`，而 `conversation.session.header.actions` 槽里另外三枚（agent-preset / agent-terminals / job-list）都没有 → 用它作锚点，语言无关；后台任务 trigger 只有 `aria-expanded` + i18n `aria-label`，**没有**结构锚点，仍走文案；`role="tree"` 在弹层内部而非 trigger 上（拿它当锚点会认错人）。
  - **实现**：新增 `CHIP_ANCHORS`；锚点命中唯一才直接采信，命中多个必须文案也对得上（conversation 的 ContextMeter 同样 `aria-haspopup="dialog"`，宁可少装饰）；缓存复用条件放宽为「文案匹配或仍命中锚点」。
  - **抓到的两处假绿**：① agent-team 包在 rc.3 改名 `dsh-client-ui-agent-team`，旧脚本只认 `dsh-experimental-…`，把「契约变了」写成「未安装跳过：team」；而且那枚 chip 已被官方移出顶栏（改挂 `…header.actions.subagent.footer` 渲染任务板），插件的团队装饰只对老内核生效。② `lib/client.js` 的行尾曾被写成 CRLF（仓库约定 LF），按行尾写的正则因此在本地失配，同时 git 把整个文件算成改动；现在读源码统一走归一化入口（去 BOM + CRLF→LF），并加了一条门：`lib/client.js` 里出现 `\r\n` 即红。
  - **门与文档**：`check:instance` 新增「chip 结构锚点」（期望值从 `CHIP_ANCHORS` 抽取）、「原生会话菜单注册」并成「原生行内菜单注册（会话 · 工作区）」，现 **19/19**；`docs/design.md` §2、`docs/reference/compatibility.md`（新增官方顶栏版本差异表）、README 中英、新增经验 07 / 08 同步。
  - **实机 DOM 复核（2026-11-15，出于所有者的浏览器 session，带 token 的 Web GUI）**：顶栏实测 —— 面包屑三级/两级都正常收缩为图标态（886px 窗口下 `.bst-crumb-btn.bst-crumb-iconic`），子智能体 chip 同时带 `data-bst-chip="sub"`、`data-bst-chip-mode="count"`、`aria-label="3 个子智能体"` 与 `aria-haspopup="dialog"`；同排 `分享` / `更多操作` / 视图页签 / `更多会话视图` 全部 `popup=menu` 或空，**header 里 `aria-haspopup="dialog"` 只有那一个命中** → 锚点唯一性成立；顶栏里没有 team chip（与 rc.3 移出顶栏一致），也没有 jobs chip（该会话没有后台任务）。截图存 `docs-private/topbar-live-2026-11-15.png`。

> **发版通用纪律**：四侧一律以官方源直查为准（npm 用 `registry.npmjs.org`，不要用镜像的 404 判「没发出去」；GitHub 用 API 读 ref/tag/Release/run，别靠页面缓存）。本机镜像与代理配置见私有环境记录。

## 7. 计划与决策的归属

- **公开文档只记已发生的事实**：行为见 README / `docs/`，版本变化见 `CHANGELOG.md`，升级对账见 §6。
- **面向未来的材料放私有**：路线图、待办、决策记录（ADR）、调研、本机环境、发版清单放在本机 `docs-private/`——[结构说明](docs-private/README.md)入库，内容不入库。
- 维护者查计划看 `docs-private/roadmap.md` / `todo.md`，查「当时为什么这么定」看 `docs-private/decisions/`；结论稳定后按 `docs-private/README.md` 的升级路径变成公开文档。
