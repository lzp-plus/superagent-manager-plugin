# superagent-manager-plugin

A [DeepSeek Harness](https://github.com/deepseek-ai) (DSH) plugin that manages multiple `dsh-superagent` instances from the desktop sidebar: live status, lifecycle (start / stop / restart), one-click panel links, and instance registration with destroy.

## Features

- **Status overview** — polls each instance every 10s: running state, ticket load (running / queued / max workers), health items, setup problems, and monitored chat groups
- **Lifecycle** — start / stop / restart via each instance's wrapper command (`sa-<id>`)
- **Open panel** — deep link to the instance's Super-agent panel (carries the latest token, opens a new tab)
- **New instance** — register `id / display name / repository / port` in the panel; the plugin creates the isolated `DSH_HOME` and writes the manifest; provisioning steps below
- **Destroy** — after confirmation, stops the service and removes that instance's `DSH_HOME`; the state DB (`~/.dsh/state/…`) and code clones are kept

## Install

Requires DSH Desktop with a profile. Install as a local bundle from this directory (**Plugins → Add plugin**), or from an agent with `plugin_manager`:

```
plugin_manager install_bundle /path/to/superagent-manager-plugin
```

The package is picked up as `@local/superagent-manager` and enabled in the profile's bundle list.

## Provisioning a new instance (once, after registering it)

Taking id `demo` as the example:

1. Clone the repository: `git clone https://github.com/<owner>/<repo>.git ~/src/<repo>`
2. Create the profile: `DSH_HOME=~/.dsh-superagent-demo dsh superagent-demo --from-default-profile web --dump-config > /dev/null`
3. Write `~/.dsh-superagent-demo/profiles/superagent-demo/cordis.patch.yml` (webserver port, stateDir, enable `dsh-superagent-feishu`)
4. Install the bundle: `DSH_HOME=… dsh plugin --profile superagent-demo add "link:$CHECKOUT"`
5. Copy `.credentials.yaml`, `.env`, `llm-deepseek/` into the new HOME (model channel credentials)
6. Write the wrapper command `~/.local/bin/sa-demo` (with `DSH_HOME` and `no_proxy`), modeled on `sa-everroom`
7. Start it and finish Sources / Policy / Executor / Prompts configuration in the panel (see the main project's docs/010-team-playbook.md)

## Data & boundaries

- Instance manifest: `instances.json` in this package (JSON; each instance carries profile, port, HOME, script, DB, repository, chats)
- Management routes: loopback + same-origin only (`/superagent-manager/api/*`, custom header `x-superagent-manager: 1`)
- The plugin only reads instance state and invokes wrapper commands; it never touches ticket data or GitHub/Feishu credentials
- The watchdog (launchd) is independent of this plugin; adding/removing instances needs no watchdog change (it probes by port)

## Structure

- `index.js` — Host half: registers loopback management routes under `/superagent-manager/api/` and proxies lifecycle operations to wrapper scripts, plus live state from each instance's orchestrator API
- `client.js` — Client half: the sidebar panel UI (DeepSeek-style brand visual: blue gradient, whale mark, status pills, load bars)
- `cordis.patch.yml` — loader patch inserting the plugin row
- `locale/` — plugin manager metadata (title/description per locale)
- `docs/DETAIL.md` — the plugin detail page document

## License

MIT
