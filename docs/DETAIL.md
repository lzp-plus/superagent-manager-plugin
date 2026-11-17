# Super-agent instances

在 DSH 桌面端侧栏管理多个 dsh-superagent 实例：实时状态、启停、面板直达、实例登记与销毁。

## 功能

- **状态总览**：每 10 秒轮询一次各实例的运行状态、工单负载（运行/排队/并发上限）、健康项、待配置问题与监听群
- **生命周期**：启动 / 停止 / 重启（调用各实例的包装命令 `sa-<id>`）
- **打开面板**：直达该实例的 Superagent 面板（自动携带最新 token，新标签页打开）
- **新建实例**：在面板里登记 `id / 显示名 / 仓库 / 端口`，插件创建独立的 `DSH_HOME` 并写入清单；置备步骤见下
- **销毁实例**：确认后停止服务、删除该实例的 DSH_HOME；**状态库（~/.dsh/state/…）与代码克隆保留**，可手工彻底清理

## 新实例置备步骤（创建后执行一次）

面板“新建”只完成登记与 HOME 创建；让实例真正跑起来还需（以 id 为 `demo` 为例）：

1. 克隆仓库：`git clone https://github.com/<owner>/<repo>.git ~/src/<repo>`
2. 建 profile：`DSH_HOME=~/.dsh-superagent-demo dsh superagent-demo --from-default-profile web --dump-config > /dev/null`
3. 写 `~/.dsh-superagent-demo/profiles/superagent-demo/cordis.patch.yml`（webserver 端口、stateDir、启用 `dsh-superagent-feishu`）
4. 安装 bundle：`DSH_HOME=… dsh plugin --profile superagent-demo add "link:$CHECKOUT"`
5. 复制 `.credentials.yaml`、`.env`、`llm-deepseek/` 到新 HOME（模型渠道凭据）
6. 写包装命令 `~/.local/bin/sa-demo`（带 DSH_HOME 与 no_proxy），参考 `sa-everroom`
7. 启动并在面板完成 Sources / Policy / Executor / Prompts 配置（参考主项目 docs/010-team-playbook.md）

## 数据与边界

- 实例清单：本包 `instances.json`（JSON；每实例含 profile、端口、HOME、脚本、DB、仓库、群）
- 管理路由：仅环回 + 同源（`/superagent-manager/api/*`，自定义头 `x-superagent-manager: 1`）
- 本插件只读实例状态与执行包装命令；不接触工单数据、不代管 GitHub/飞书凭据
- 看门狗（launchd）独立于本插件，实例增删后无需改看门狗（它按端口探测）
