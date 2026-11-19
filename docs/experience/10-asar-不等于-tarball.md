# 10 · asar 里的包不等于 npm tarball

## 症状

做实例升级对账（`0.2.2-rc.3` → `0.2.2-rc.5`）时，先读了运行实例 asar 里的
`node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js`，再拿 npm 上同版本 tarball 比，
得到"两个版本都不同"的结论 —— 差点据此判定"官方改了顶栏实现、插件要跟着改"。

真实情况：**这一轮官方源码零变化**，两侧 tarball 逐字节相同。

## 根因

桌面壳的 asar 与 npm 上的包是**两条构建流水线**的产物：

- CSS-Modules 前缀每次重建都换（`aB2X2W` → `KK6qrW`），它进了产物字符串，字节数随之改变；
- 构建期注入的 commit 常量不同（`dsh-client-modules/lib/index.js`：`6b729fe` → `3f85d88`）；
- 结果是同一版本号下 asar 与 tarball 逐字节不同（实测 conversation：704,499 vs 704,183 字节）。

## 取证

```
# 双侧都取 tarball（rc.3 vs rc.5），跳过 package.json，逐文件 sha256
npm pack @deepseek-ai/dsh-client-ui-conversation@0.2.2-rc.3 --pack-destination old
npm pack @deepseek-ai/dsh-client-ui-conversation@0.2.2-rc.5 --pack-destination new
```

16 个接触面包的结果：**只有 `dsh-client-modules/lib/index.js` 一个文件不同**，且 diff 只有一行
（commit 常量）。`dsh-client-ui-conversation` / `subagent` / `primitives` / `locale` / `theme` 等
15 包逐字节相同。

对照：asar 侧 `client.js` 与 tarball 侧 sha256 全都不同（`67761fa0…` vs `3d166eab…`）。

## 结论

1. **对账的基准两侧必须是同一流水线**：tarball ↔ tarball 能回答"官方改了什么"；
   asar ↔ tarball 只能回答"这台机器的产物和 npm 上不一样"（永远不一样）。
2. **asar 是运行时的权威，但不是变化的证据源** —— 旧 asar 被原地覆盖后就再也取不到了，
   而 npm 保留每个 rc 的 tarball。所以"变没变"用 tarball 判，"现在跑的是什么"用 asar 判。
3. **CSS-Modules 前缀不是契约**：插件按类名**片段**匹配（`[class*="_headerActions"]`），
   抄整串前缀会在每次重建后静默不匹配。这一轮漂移工具报的两处前缀变化正是重建噪声。
4. 结构性事实用 `check:topbar`（槽位注册者、chip 锚点、i18n 键、图标导出）+ `check:instance`
   （硬契约 19 项）判，两者都不依赖前缀字符串。
