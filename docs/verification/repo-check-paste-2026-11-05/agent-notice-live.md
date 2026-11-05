# agent 挂接路径仓库归属 notice · 实机验证（2026-11-05）

树 `b12972e`（分支 kanban/github-gitlab-1a9459）。方式：本地交换安装后，用 flowly CLI 的 `artifact` 命令（与 `flowly_add_artifact` 同一条 AgentService.write 路径）在本卡上登记条目，读取工具结果里的 `notice`。走查后已恢复原安装（kanban-ui-22ac11）。

| # | 用例 | 结果 |
|---|------|------|
| A1 | agent 登记 `https://github.com/HybridRbt/paseo-sync/pull/4`（foreign） | PASS：结果带 notice `"HybridRbt/paseo-sync#4 does not belong to flowly's repositories; the card's workspace will not contain it. It belongs to paseo sync's repositories."`，登记不阻断 |
| A2 | agent 登记 `https://github.com/JasprW/flowly/pull/78`（member，upstream remote ∈ projectRepos） | PASS：结果无 notice，直接登记 |
| A3 | 清理 | PASS：两条测试条目均已 artifact-remove，卡片只剩交付物 |

补充：单元测试覆盖 outputs 交付路径（foreign 输出 notice 带 target 前缀）、非 git 条目沉默、拥有项目点名与归档项目不算拥有者（server/agent-service.test.ts、server/connectors/repos.test.ts）。
