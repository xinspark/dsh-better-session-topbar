# 文档导航

> 面向使用者与贡献者的公开文档。维护者的作业手册在 [MAINTAINING.md](../MAINTAINING.md)，
> 私有材料（路线图 / 决策 / 调研 / 发版清单）在 [docs-private/README.md](../docs-private/README.md)
> —— 该目录只有 README 入库，其余内容留在本机。

## 公开与私有的分工

| 层 | 位置 | 入库 | 读者 |
| --- | --- | --- | --- |
| 公开 | `README.md` / `README.en.md` / `docs/` | ✅ | 使用者、贡献者 |
| 维护者 | `MAINTAINING.md` | ✅ | 维护者（作业流程与发版记录） |
| 私有 | `docs-private/` | 仅入口 README | 维护者（计划、决策过程、本机环境） |

规则：**公开文档只记已发生的事实**；面向未来的计划、未定稿的取舍、本机信息留在私有，
结论稳定后再按 [升级路径](../docs-private/README.md) 提升为公开文档。

## 我想先用起来

| 文档 | 内容 |
| --- | --- |
| [项目 README](../README.md) | 是什么、怎么安装、功能与截图 |
| [配置项](guide/configuration.md) | 详情页的两个设置、存储位置、生效方式 |
| [故障排查](guide/troubleshooting.md) | 常见症状 → 原因 → 处理 |

## 我想理解它怎么工作

| 文档 | 内容 |
| --- | --- |
| [设计说明](design.md) | 目标与取舍：折叠阶梯、chip 同构、菜单委派、多语言 |
| [装配契约](reference/architecture.md) | 三处同名、槽位、服务依赖、DOM 锚点、10 类耦合点 |
| [版本兼容](reference/compatibility.md) | 验证基线、降级矩阵、DSH 升级对账流程 |

## 我想确认它可靠

| 文档 | 内容 |
| --- | --- |
| [验收记录](testing.md) | `npm test`、`check:instance`、发布前实机清单 |

## 我想知道踩过哪些坑

| 文档 | 内容 |
| --- | --- |
| [项目经验](experience/README.md) | 症状 → 根因 → 证据，按条目编号 |

## 我想参与

- [贡献指南](../CONTRIBUTING.md)
- [安全策略](../SECURITY.md)
- [更新日志](../CHANGELOG.md)
- [维护者手册](../MAINTAINING.md)
- [历史存档：1.2.0 发布清单](archive/release-1.2.0.md)
