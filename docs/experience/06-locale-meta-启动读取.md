# 06 · locale meta 启动读取

## 症状

给插件补了 `locale/ja.json`（`meta.title` / `meta.description`），界面切到日语、刷新页面后，
插件详情页与插件列表里的标题/描述仍是英文。

## 根因

包标题/描述是**宿主启动时**读取的包元数据，不是客户端 bundle 的一部分。刷新页面只重载客户端，
宿主不会重新扫描 `locale/*.json`。官方插件的 meta 在启动前就装好了，所以它们的对应区域能显示
本地语言。

## 证据

```
应用启动：2026-11-05 17:59:56（DSH NEXT.exe）
locale/ja.json 写入：2026-11-05 18:29:43
```

刷新页面后仍为英文；**完全重启 app 后**变为日文。`lib/client.js` 里的界面字典不受影响，
刷新即生效（那一层是客户端）。

## 结论

- 改 `locale/*.json` 的包标题/描述 → **重启 app**；
- 改 `lib/client.js` 的界面字典 → 刷新页面；
- 这条已写进 README 二次开发与 [配置项](../guide/configuration.md#生效方式)；
- 插件页面正文的语言是否生效，与这条无关：那一层是 `ctx.locale.register` 的字典。
