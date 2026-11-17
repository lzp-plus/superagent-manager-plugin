/**
 * Super-agent manager — Host half.
 * Registers loopback management routes under /superagent-manager/api/ and proxies
 * lifecycle operations (status/start/stop/restart, create, destroy) to the wrapper
 * scripts and instance homes this deployment uses, plus live state from each
 * instance's orchestrator API.
 */
import { execFile } from 'node:child_process'
import { readFile, writeFile, mkdir, rm, access, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgDir = path.dirname(fileURLToPath(import.meta.url))
const INSTANCES_FILE = path.join(pkgDir, 'instances.json')
const WATCHDOG = path.join(process.env.HOME ?? '', '.local/bin/superagent-watchdog')
const ARTIFACTS = '/Users/xjwang/Documents/deepseek-harness/default-workspace/dsh-superagent-prototype/.artifacts'

const exists = async (p) => access(p).then(() => true, () => false)

async function readInstances() {
  const text = await readFile(INSTANCES_FILE, 'utf8')
  const data = JSON.parse(text)
  const list = Array.isArray(data.instances) ? data.instances : []
  const seen = new Set()
  for (const item of list) {
    if (!item.id || seen.has(item.id)) throw new Error(`Instance id missing or duplicated: ${item.id}`)
    seen.add(item.id)
  }
  return list
}

async function writeInstances(list) {
  await writeFile(INSTANCES_FILE, JSON.stringify({ instances: list }, null, 2) + '\n', 'utf8')
}

function run(script, args, timeoutMs = 120000) {
  return new Promise((resolve) => {
    execFile(script, args, { timeout: timeoutMs, env: { ...process.env, no_proxy: '127.0.0.1,localhost', NO_PROXY: '127.0.0.1,localhost' } },
      (error, stdout, stderr) => resolve({ code: error ? (error.code ?? 1) : 0, stdout: String(stdout), stderr: String(stderr) }))
  })
}

async function apiState(port) {
  const response = await fetch(`http://127.0.0.1:${port}/orchestrator/api/state`,
    { headers: { 'x-orchestrator-request': '1' }, signal: AbortSignal.timeout(5000) })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

/** Status of one instance: wrapper verdict + orchestrator state. */
async function statusOf(instance) {
  const result = { id: instance.id, name: instance.name, port: instance.port, profile: instance.profile,
    repository: instance.repository ?? null, chats: instance.chats ?? [], running: false, verdict: 'unknown',
    detail: null, load: null, health: null, setup: null }
  if (!(await exists(instance.script))) { result.detail = `wrapper script not found: ${instance.script}`; return result }
  const status = await run(instance.script, ['status'], 30000)
  result.verdict = status.code
  if (status.code === 1) {
    const stopped = /"manually_stopped":\s*true/.test(status.stdout)
    result.running = false
    result.detail = stopped ? 'manually stopped' : 'not answering'
    return result
  }
  result.running = true
  try {
    const state = await apiState(instance.port)
    result.load = state.load ?? null
    result.health = Object.fromEntries(Object.entries(state.health ?? {}).map(([key, value]) => [key, value?.state ?? value]))
    const problem = state.setup?.problem
    result.setup = problem ? { code: problem.code ?? null, detail: problem.detail ?? null } : null
  } catch (error) { result.detail = `state unavailable: ${error instanceof Error ? error.message : String(error)}` }
  return result
}

/** Panel URL with token, read from the instance's newest startup log.
 * Log names are `dsh-superagent-<profile>-<timestamp>-<pid>.log`; the timestamp
 * field must be delimited on both sides by '-', otherwise profile `superagent`
 * would also match profile `superagent-everoffice`'s logs. */
async function panelOf(instance) {
  const names = (await readdir(ARTIFACTS).catch(() => []))
    .filter((name) => new RegExp(`^dsh-superagent-${instance.profile}-\\d{8}-\\d{6}-\\d+\\.log$`).test(name)).sort()
  for (let index = names.length - 1; index >= 0; index -= 1) {
    const text = await readFile(`${ARTIFACTS}/${names[index]}`, 'utf8').catch(() => '')
    const token = /dsh web: http:\/\/127\.0\.0\.1:\d+\/\?token=([A-Za-z0-9_-]+)/.exec(text)?.[1]
    if (token) return `http://127.0.0.1:${instance.port}/?token=${token}`
  }
  return `http://127.0.0.1:${instance.port}/`
}

export const apply = (ctx) => {
  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: '/superagent-manager', handler: async (req, res) => {
    const reply = (status, value) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(value)) }
    const sameOrigin = req.headers['x-superagent-manager'] === '1'
      && (req.headers.origin === undefined || req.headers.origin === `http://${req.headers.host}`)
    if (!sameOrigin) { reply(403, { error: 'same-origin request required' }); return }
    const url = new URL(req.url ?? '/', 'http://localhost')
    const parts = url.pathname.replace(/^\/superagent-manager\/api\/?/, '').split('/').filter(Boolean)
    const readBody = async () => { const chunks = []; for await (const chunk of req) chunks.push(chunk); try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { return {} } }
    try {
      if (req.method === 'GET' && parts[0] === 'instances' && parts.length === 1) {
        const list = await readInstances()
        const states = await Promise.all(list.map(statusOf))
        reply(200, { instances: states, watchdogInstalled: await exists(WATCHDOG) })
        return
      }
      if (req.method === 'POST' && parts[0] === 'instances' && parts.length === 1) {
        const body = await readBody()
        if (!/^[a-z][a-z0-9-]*$/.test(String(body.id ?? ''))) { reply(400, { error: 'id must be lowercase letters, digits and dashes' }); return }
        if (!/^[\w.\-/]+\/[\w.\-]+$/.test(String(body.repository ?? ''))) { reply(400, { error: 'repository must be owner/name' }); return }
        const list = await readInstances()
        if (list.some((item) => item.id === body.id)) { reply(409, { error: `instance ${body.id} already exists` }); return }
        const port = Number(body.port)
        if (!Number.isInteger(port) || port < 1024 || port > 65535) { reply(400, { error: 'port must be 1024-65535' }); return }
        const home = String(body.home ?? `${process.env.HOME}/.dsh-superagent-${body.id}`)
        const profile = `superagent-${body.id}`
        const created = { id: body.id, name: String(body.name ?? body.id), profile, port, home,
          script: `${process.env.HOME}/.local/bin/sa-${body.id}`,
          db: `${process.env.HOME}/.dsh/state/${profile}/orchestrator.sqlite`,
          repository: String(body.repository), chats: Array.isArray(body.chats) ? body.chats.map(String) : [] }
        await mkdir(home, { recursive: true })
        list.push(created)
        await writeInstances(list)
        reply(200, { created, note: 'instance registered; run the provisioning steps from docs/DETAIL.md (clone, profile, bundle, settings, wrapper) to make it operational' })
        return
      }
      if (req.method === 'DELETE' && parts[0] === 'instances' && parts.length === 2) {
        const list = await readInstances()
        const instance = list.find((item) => item.id === parts[1])
        if (!instance) { reply(404, { error: `unknown instance ${parts[1]}` }); return }
        const state = await statusOf(instance)
        if (state.running) {
          const stop = await run(instance.script, ['stop'], 300000)
          if (stop.code !== 0) { reply(500, { error: `stop failed: ${stop.stderr || stop.stdout}` }); return }
        }
        await rm(instance.home, { recursive: true, force: true }).catch(() => {})
        await writeInstances(list.filter((item) => item.id !== instance.id))
        reply(200, { destroyed: instance.id, note: 'home removed; state dir and clones left in place for safety' })
        return
      }
      if (req.method === 'POST' && parts[0] === 'instances' && parts.length === 3 && ['start', 'stop', 'restart'].includes(parts[2])) {
        const list = await readInstances()
        const instance = list.find((item) => item.id === parts[1])
        if (!instance) { reply(404, { error: `unknown instance ${parts[1]}` }); return }
        const result = await run(instance.script, [parts[2]], 300000)
        reply(result.code === 0 ? 200 : 500, { id: instance.id, action: parts[2], exitCode: result.code,
          output: result.stdout.trim().slice(-4000), error: result.code === 0 ? undefined : (result.stderr || result.stdout).slice(-2000) })
        return
      }
      if (req.method === 'GET' && parts[0] === 'panel' && parts.length === 2) {
        const list = await readInstances()
        const instance = list.find((item) => item.id === parts[1])
        if (!instance) { reply(404, { error: 'unknown instance' }); return }
        reply(200, { id: instance.id, url: await panelOf(instance) })
        return
      }
      reply(404, { error: 'unknown operation' })
    } catch (error) {
      reply(500, { error: error instanceof Error ? error.message : String(error) })
    }
  } }), 'superagent-manager: routes')
}

export const inject = ['webServer']
