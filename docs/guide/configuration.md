# 配置项

插件只有两项配置，都在 **Plugins → 更好的会话顶栏 → 配置** 里。

| 字段 | 取值 | 默认 | 含义 |
| --- | --- | --- | --- |
| `narrowMode` | `'crumb'` \| `'title'` | `crumb` | 窄屏（面包屑文本放不下）时：面包屑收成图标，还是整行只留会话标题 |
| `probeLog` | 布尔 | `false` | 是否向控制台输出 `[bst-dom]` / `[bst-chip]` / `[bst-perf]` / `[bst-picker]` 诊断日志 |

## 存储位置

- schema 在 host 半 `index.js` 的 `Config`；两个字段都标了 `.volatile()`（**只有 volatile 字段
  会进表单**）；
- 值写在当前 profile 的 Cordis patch（`profiles/<name>/cordis.patch.yml`），跟随 profile；
- 客户端与详情页读同一份共享缓存 `bstSettings`，唯一事实源是宿主的 `configForms` 服务。

## 生效方式

| 改动 | 生效 |
| --- | --- |
| 两个设置项 | 即时（volatile 字段下一次读取即生效，无需重启） |
| 客户端 `lib/client.js` | 刷新页面 |
| host 半 `index.js` | 在插件页把本行关掉再打开（`已关闭 → 运行中`） |
| `locale/*.json` 的包标题/描述 | **重启 app**（宿主启动时读取） |

## 诊断日志

默认关闭，正常使用不往控制台写任何东西。打开后可在开发者工具里按前缀筛选：

| 前缀 | 内容 |
| --- | --- |
| `[bst-dom]` | 一次性的顶栏结构探针（祖先链、兄弟宽度） |
| `[bst-chip]` | 三枚 chip 的探测结果与折叠阶梯结论 |
| `[bst-perf]` | 单趟测量超过 60ms 的慢趟记录（限流 5s） |
| `[bst-picker]` | 「添加工作区」走宿主流程还是兜底 |
