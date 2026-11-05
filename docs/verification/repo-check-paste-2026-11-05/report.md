# “文件或链接…”表单粘贴 git 条目的仓库归属校验 · 桌面 UI 走查（2026-11-05）

树 `b626507`（分支 kanban/github-gitlab-1a9459，堆叠于 PR JasprW/flowly#83 分支之上）。验证方式：本地交换安装（备份 `~/.paseo/plugin-data/flowly` + `plugin-settings/flowly` 到 `/tmp/flowly-backup-paste-2026-11-05.tar.gz` 后 `paseo plugin remove flowly && paseo plugin install <本卡 worktree> --id flowly`，插件数据与本卡会话全程存活），Playwright + `docs/promo/shot-lib.mjs`（系统 Chrome）驱动 app.paseo.sh。走查后已恢复原安装（kanban-ui-22ac11）。

环境事实（同上一卡）：GitHub 连接（账户 HybridRbt）；flowly 项目 projectRepos = `HybridRbt/flowly`（origin）+ `JasprW/flowly`（upstream）；另一项目 "paseo sync" 的项目仓库含 `HybridRbt/paseo-sync`。被测卡：flowly 项目 Blocked 道 “Warn when a card's GitHub/GitLab item does not belong to the current project”（无运行中会话，安静）。入口：板卡会话行 → 宿主会话视图 → Flowly "Task · …" chip 打开卡片抽屉（板卡本体按 role 定位不稳定）。

| # | 用例 | 结果 | 证据 |
|---|------|------|------|
| F0 | 打开 flowly 看板与被测卡 Artifacts 区（初始无条目） | PASS | F0-board.png |
| F1 | “文件或链接…”表单粘贴 `https://github.com/HybridRbt/paseo-sync/pull/4`（foreign PR 链接），点 Add | PASS：表单整体替换为警告「HybridRbt/paseo-sync#4 does not belong to flowly's repositories. The card's workspace will not contain this repository. It belongs to paseo sync's repositories.」+ Cancel / Add anyway | F1-foreign-warning.png |
| F2 | 警告点 Cancel | PASS：回到表单，链接仍在中，未添加 | F1 txt / results.json |
| F3 | 重新 Add → Add anyway | PASS：条目作为 GitHub 外部条目 input 加入（daemon 识别路径 rpc.createArtifact → externalArtifact），模态关闭 | F3-added.png（行 “HybridRbt/paseo-sync#4 Skip dirty Git plugins at apply with disclosed repair guidance · Pull Request”） |
| F4 | 清理该测试条目 | PASS：Remove 后列表无残留 | results.json |
| F5 | 粘贴 `https://github.com/JasprW/flowly/pull/78`（upstream remote ∈ projectRepos，member） | PASS：无警告，直接加入为外部条目 | F5-member-silent.png |
| F6 | 粘贴 `https://example.com/paste-check`（非 git 链接） | PASS：无警告，作为普通链接条目加入（不识别、不发 repo-check） | F6-non-git-silent.png |
| F7 | 收尾 | PASS：三条测试条目全部移除，卡片无残留 | F7-clean.png / results.json |

自动化备注（非产品问题）：
- 抽屉离屏行会让 Playwright 的可见性判定偶发失败、宿主 toast（Dismiss）会拦截点击：脚本用滚动的 Artifacts 区 + 全量行标题（owner 前缀）断言规避；板面卡片的短 key chip（如 “paseo-sync#4 +1”）与前卡 workpad 里的示例句会误染裸 key 匹配。
- 误跑一轮开在了 "paseo sync" 看板（open() 的项目切换被宿主侧 “Flowly” 字样骗过），镜像用例（flowly PR 粘贴到 paseo sync 卡）同样出现警告并正确点名 “paseo sync” —— 反向印证了按卡片项目判定；该轮证据已清理。
- daemon 侧条目解析（GitHub API）偶发超过 20s 才完成（F3 首轮），加长等待后稳定；属既有 resolve 路径，非本卡改动。

未运行：非 git 连接族（Jira/Confluence/Azure/Shortcut）链接的粘贴沉默——该 daemon 只有 GitHub 连接，属结构性保证（客户端在族上先短路，不发 RPC）；手机端走查未做。

无副作用：未创建卡片；全部测试 artifact 已删除（F4/F5/F6/F7）；安装与插件数据已恢复。
