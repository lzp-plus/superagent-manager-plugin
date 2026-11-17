window.__ModuleLoader__.load({
  id: '@local/superagent-manager',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useCallback, useEffect, useRef, useState } = React;

    const NS = 'superagentManager';
    const PANEL_ID = 'superagent-manager';

    /* DeepSeek-inspired design tokens. The app supplies --dsw-* aliases; the
     * literal fallbacks below reproduce the brand palette (official #4D6BFE)
     * so the panel keeps its character even where aliases are absent. */
    const C = {
      brand: '#4D6BFE',
      brandDark: '#3D5AF1',
      brandDeep: '#2B3FCC',
      ink: '#1E2A44',
      sub: '#5E6B85',
      line: 'rgba(77, 107, 254, 0.18)',
      surface: 'rgba(255, 255, 255, 0.86)',
      surfaceHover: 'rgba(255, 255, 255, 0.95)',
      ok: '#16A34A',
      warn: '#D97706',
      bad: '#DC2626',
    };

    const WhaleMark = ({ size = 22, color = '#FFFFFF' }) =>
      h('svg', { width: size, height: size, viewBox: '0 0 48 48', fill: 'none', 'aria-hidden': true },
        h('path', {
          d: 'M6 28c0-9.9 8.1-18 18-18 8.5 0 15.6 5.9 17.5 13.8.2.9 1.4 1 1.7.1l1.6-4.6c.3-.9 1.6-.9 1.9 0C47.6 21.7 48 23.3 48 25c0 8.8-7.2 16-16 16-2.4 0-4.7-.5-6.8-1.5-.6-.3-1.3-.1-1.7.3-2.6 2.6-6.2 4.2-10.1 4.2-1.1 0-2.2-.1-3.2-.4-1-.2-1.3-1.5-.5-2.2l3.4-3.1c.5-.5.6-1.3.1-1.8C9.1 33.7 6 31.2 6 28z',
          fill: color,
        }),
        h('circle', { cx: '33', cy: '22', r: '2.2', fill: C.brand }));

    const BotIcon = ({ size }) =>
      h('span', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' } },
        h(WhaleMark, { size: size * 0.9, color: 'currentColor' }));

    async function api(path, options) {
      const response = await fetch(`/superagent-manager/api/${path}`, {
        ...options,
        headers: { 'x-superagent-manager': '1', ...(options && options.body ? { 'content-type': 'application/json' } : {}) },
      });
      const value = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(value.error || `HTTP ${response.status}`);
      return value;
    }

    function useInstances() {
      const [state, setState] = useState({ data: undefined, error: undefined });
      const alive = useRef(true);
      useEffect(() => {
        alive.current = true;
        const load = () => api('instances')
          .then((value) => { if (alive.current) setState({ data: value }); })
          .catch((error) => { if (alive.current) setState((current) => ({ ...current, error: String(error.message || error) })); });
        load();
        const timer = setInterval(load, 10000);
        return () => { alive.current = false; clearInterval(timer); };
      }, []);
      return state;
    }

    /* --- shared primitives --------------------------------------------- */

    const Button = ({ variant = 'ghost', disabled, onClick, children }) => {
      const base = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8,
        fontSize: 13, fontWeight: 500, cursor: disabled ? 'default' : 'pointer', transition: 'all .15s ease',
        opacity: disabled ? 0.55 : 1, border: '1px solid transparent', lineHeight: 1.4 };
      const styles = {
        primary: { ...base, background: C.brand, color: '#fff' },
        ghost: { ...base, background: 'transparent', color: C.brand, borderColor: C.line },
        danger: { ...base, background: 'transparent', color: C.bad, borderColor: 'rgba(220,38,38,.25)' },
      };
      const hover = !disabled && {
        primary: { boxShadow: `0 4px 14px rgba(77,107,254,.35)` },
        ghost: { background: 'rgba(77,107,254,.08)' },
        danger: { background: 'rgba(220,38,38,.07)' },
      }[variant];
      const rest = { ...styles[variant], ...(hover || {}) };
      return h('button', { disabled, onClick, style: rest,
        onMouseEnter: (e) => { if (!disabled) Object.assign(e.currentTarget.style, hover); },
        onMouseLeave: (e) => { Object.assign(e.currentTarget.style, rest); } }, children);
    };

    const Dot = ({ tone }) => h('span', { style: {
      width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
      background: tone === 'ok' ? C.ok : tone === 'warn' ? C.warn : C.bad,
      boxShadow: `0 0 0 3px ${tone === 'ok' ? 'rgba(22,163,74,.15)' : tone === 'warn' ? 'rgba(217,119,6,.15)' : 'rgba(220,38,38,.15)'}`,
    } });

    const Pill = ({ tone, children }) => h('span', { style: {
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999,
      fontSize: 12, fontWeight: 600, letterSpacing: 0.2,
      background: tone === 'ok' ? 'rgba(22,163,74,.1)' : tone === 'warn' ? 'rgba(217,119,6,.1)' : 'rgba(220,38,38,.08)',
      color: tone === 'ok' ? C.ok : tone === 'warn' ? C.warn : C.bad,
    } }, children);

    const LoadBar = ({ running, queued, max }) => {
      const max0 = Math.max(1, max || 1);
      const rpct = Math.min(100, Math.round(((running || 0) / max0) * 100));
      const qpct = Math.min(100 - rpct, Math.round(((queued || 0) / max0) * 100));
      return h('div', null,
        h('div', { style: { display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: 'rgba(77,107,254,.12)' } },
          h('div', { style: { width: `${rpct}%`, background: `linear-gradient(90deg, ${C.brand}, ${C.brandDark})`, transition: 'width .4s ease' } }),
          h('div', { style: { width: `${qpct}%`, background: 'rgba(77,107,254,.3)', transition: 'width .4s ease' } })),
        h('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11.5, color: C.sub } },
          h('span', null, `${running} running · ${queued} queued`),
          h('span', null, `max ${max}`)));
    };

    /* --- instance card -------------------------------------------------- */

    function InstanceCard({ instance, t, onAction }) {
      const [busy, setBusy] = useState(false);
      const [note, setNote] = useState(null);
      const act = async (action) => {
        setBusy(true); setNote(null);
        try {
          const result = await api(`instances/${instance.id}/${action}`, { method: 'POST' });
          setNote(result.exitCode === 0 ? null : (result.error || `exit ${result.exitCode}`));
        } catch (error) { setNote(String(error.message || error)); }
        finally { setBusy(false); onAction(); }
      };
      const openPanel = async () => {
        try {
          const result = await api(`panel/${instance.id}`);
          window.open(result.url, '_blank', 'noopener');
        } catch (error) { setNote(String(error.message || error)); }
      };
      const running = instance.running;
      const healthValues = Object.values(instance.health || {});
      const tone = !running ? 'bad'
        : healthValues.some((v) => v === 'error') ? 'bad'
        : healthValues.some((v) => v === 'paused' || v === 'starting') ? 'warn' : 'ok';
      const statusText = !running ? (instance.detail || t('stateStopped'))
        : tone === 'ok' ? t('stateHealthy') : tone === 'warn' ? t('stateDegraded') : t('stateError');
      return h('article', { style: {
        borderRadius: 14, border: `1px solid ${C.line}`, background: C.surface, padding: '18px 20px',
        display: 'grid', gap: 12, backdropFilter: 'blur(6px)',
        boxShadow: '0 1px 3px rgba(30,42,68,.06), 0 8px 24px rgba(77,107,254,.06)',
        transition: 'box-shadow .2s ease, transform .2s ease',
      } },
        h('header', { style: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } },
          h('div', { style: {
            width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(135deg, ${C.brand}, ${C.brandDeep})`, color: '#fff',
            boxShadow: '0 3px 10px rgba(77,107,254,.3)',
          } }, h(WhaleMark, { size: 22 })),
          h('div', { style: { flexGrow: 1, minWidth: 140 } },
            h('h3', { style: { margin: 0, fontSize: 15.5, fontWeight: 700, color: C.ink } }, instance.name),
            h('div', { style: { fontSize: 12, color: C.sub, marginTop: 2 } },
              `:${instance.port} · ${instance.repository || ''}`)),
        h(Pill, { tone }, h(Dot, { tone }), statusText),
        instance.load ? h(LoadBar, { running: instance.load.running, queued: instance.load.queued, max: instance.load.maxWorkers }) : null,
        instance.setup ? h('div', { style: {
          fontSize: 12.5, color: C.warn, background: 'rgba(217,119,6,.08)', border: '1px solid rgba(217,119,6,.2)',
          borderRadius: 8, padding: '8px 12px',
        } }, `${t('setupProblem')}: ${instance.setup.detail || instance.setup.code}`) : null,
        (instance.chats && instance.chats.length) ? h('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } },
          instance.chats.map((chat) => h('span', { key: chat, style: {
            fontSize: 11.5, color: C.brandDark, background: 'rgba(77,107,254,.08)',
            borderRadius: 6, padding: '2px 8px',
          } }, chat))) : null,
        note ? h('div', { style: { fontSize: 12.5, color: C.bad, whiteSpace: 'pre-wrap',
          background: 'rgba(220,38,38,.06)', borderRadius: 8, padding: '8px 12px' } }, note) : null,
        h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 2, borderTop: `1px solid rgba(77,107,254,.1)`, marginTop: 2 } },
          running ? h(Button, { variant: 'primary', onClick: openPanel }, t('openPanel')) : null,
          h(Button, { disabled: busy, onClick: () => act('restart') }, t('restart')),
          h(Button, { disabled: busy, onClick: () => act(running ? 'stop' : 'start') }, running ? t('stop') : t('start')),
          h(Button, { variant: 'danger', disabled: busy, onClick: async () => {
            if (!window.confirm(t('confirmDestroy').replace('{name}', instance.name))) return;
            setBusy(true);
            try { await api(`instances/${instance.id}`, { method: 'DELETE' }); } catch (error) { setNote(String(error.message || error)); }
            finally { setBusy(false); onAction(); }
          } }, t('destroy')))));
    }

    /* --- create form ----------------------------------------------------- */

    const fieldStyle = { padding: '8px 12px', borderRadius: 8, fontSize: 13.5, width: '100%', boxSizing: 'border-box',
      border: `1px solid ${C.line}`, background: 'rgba(255,255,255,.9)', color: C.ink, outline: 'none',
      transition: 'border-color .15s ease, box-shadow .15s ease' };

    function CreateForm({ t, onCreated }) {
      const [open, setOpen] = useState(false);
      const [form, setForm] = useState({ id: '', name: '', repository: '', port: '' });
      const [error, setError] = useState(null);
      const [note, setNote] = useState(null);
      const [busy, setBusy] = useState(false);
      const field = (key, label) => h('label', { style: { display: 'grid', gap: 5, fontSize: 12.5, color: C.sub, fontWeight: 500 } },
        label,
        h('input', { value: form[key], onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })),
          style: fieldStyle, onFocus: (e) => { e.currentTarget.style.borderColor = C.brand; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(77,107,254,.15)`; },
          onBlur: (e) => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.boxShadow = 'none'; } }));
      const submit = async () => {
        setBusy(true); setError(null); setNote(null);
        try {
          const result = await api('instances', { method: 'POST', body: JSON.stringify({
            id: form.id, name: form.name || form.id, repository: form.repository, port: Number(form.port) || undefined }) });
          setNote(result.note || t('created'));
          setForm({ id: '', name: '', repository: '', port: '' });
          onCreated();
        } catch (submitError) { setError(String(submitError.message || submitError)); }
        finally { setBusy(false); }
      };
      if (!open) return h(Button, { variant: 'primary', onClick: () => setOpen(true) },
        h('span', { style: { fontSize: 15, lineHeight: 1 } }, '+'), ' ', t('newInstance'));
      return h('section', { style: {
        borderRadius: 14, border: `1px dashed ${C.line}`, background: C.surface, padding: 18, display: 'grid', gap: 10,
        backdropFilter: 'blur(6px)',
      } },
        h('strong', { style: { fontSize: 14, color: C.ink } }, t('newInstance')),
        h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 } },
          field('id', t('fieldId')), field('name', t('fieldName')), field('repository', t('fieldRepository')), field('port', t('fieldPort'))),
        error ? h('div', { style: { color: C.bad, fontSize: 12.5, background: 'rgba(220,38,38,.06)', borderRadius: 8, padding: '8px 12px' } }, error) : null,
        note ? h('div', { style: { color: C.ok, fontSize: 12.5, background: 'rgba(22,163,74,.07)', borderRadius: 8, padding: '8px 12px' } }, note) : null,
        h('div', { style: { display: 'flex', gap: 8 } },
          h(Button, { variant: 'primary', disabled: busy || !form.id || !form.repository, onClick: submit }, t('create')),
          h(Button, { onClick: () => setOpen(false) }, t('cancel'))));
    }

    /* --- page ------------------------------------------------------------ */

    function Manager({ t }) {
      const { data, error } = useInstances();
      const refresh = useCallback(() => { void api('instances'); }, []);
      return h('div', { style: {
        minHeight: '100%', padding: '28px 28px 48px', boxSizing: 'border-box', position: 'relative',
        background: `radial-gradient(1100px 500px at 85% -10%, rgba(77,107,254,.22), transparent 60%),
                     radial-gradient(800px 400px at -10% 110%, rgba(61,90,241,.14), transparent 55%),
                     linear-gradient(180deg, #F6F8FF 0%, #EEF2FE 100%)`,
        color: C.ink, fontFamily: 'inherit',
      } },
        h('div', { style: { 'aria-hidden': true, position: 'absolute', right: 34, top: 24, opacity: 0.1, pointerEvents: 'none' } },
          h(WhaleMark, { size: 150, color: C.brand })),
        h('div', { style: { maxWidth: 820, margin: '0 auto', display: 'grid', gap: 18, position: 'relative' } },
          h('header', { style: { display: 'flex', alignItems: 'center', gap: 14 } },
            h('div', { style: {
              width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(135deg, ${C.brand}, ${C.brandDeep})`, color: '#fff',
              boxShadow: '0 6px 18px rgba(77,107,254,.35)',
            } }, h(WhaleMark, { size: 26 })),
            h('div', null,
              h('h1', { style: { margin: 0, fontSize: 21, fontWeight: 800, letterSpacing: -0.3, color: C.ink } }, t('panel')),
              h('p', { style: { color: C.sub, fontSize: 13, margin: '3px 0 0' } }, t('panelHint')))),
          error && (!data || !data.instances) ? h('div', { style: {
            color: C.bad, background: 'rgba(220,38,38,.07)', border: '1px solid rgba(220,38,38,.2)',
            borderRadius: 12, padding: '14px 18px', fontSize: 13.5,
          } }, `${t('offline')}: ${error}`) : null,
          data && data.instances
            ? data.instances.map((instance) => h(InstanceCard, { key: instance.id, instance, t, onAction: refresh }))
            : null,
          data && data.instances && data.instances.length === 0 ? h('div', { style: {
            textAlign: 'center', padding: '48px 20px', color: C.sub, fontSize: 13.5,
            borderRadius: 14, border: `1px dashed ${C.line}`,
          } }, t('empty')) : null,
          h(CreateForm, { t, onCreated: refresh })));
    }

    /* --- dictionaries ----------------------------------------------------- */

    const dictionaries = {
      zh: {
        panel: 'Super-agent 实例',
        panelHint: '管理各 dsh-superagent 实例：查看状态、启停、创建与销毁',
        stateHealthy: '运行中',
        stateDegraded: '部分降级',
        stateError: '异常',
        stateStopped: '已停止',
        loadLine: '工单：{running} 运行 / {queued} 排队（并发上限 {max}）',
        setupProblem: '待配置',
        chats: '监听群',
        openPanel: '打开面板',
        restart: '重启',
        stop: '停止',
        start: '启动',
        destroy: '销毁',
        confirmDestroy: '确定销毁实例 {name}？将停止服务并删除其 DSH_HOME（状态库与代码克隆保留）。',
        newInstance: '新建实例',
        fieldId: '实例 id（小写字母/数字/连字符）',
        fieldName: '显示名',
        fieldRepository: 'GitHub 仓库（owner/name）',
        fieldPort: '端口（默认自动分配）',
        create: '创建',
        cancel: '取消',
        created: '已登记。请按 docs/DETAIL.md 完成置备步骤。',
        empty: '还没有实例。',
        offline: '管理接口不可用',
      },
      en: {
        panel: 'Super-agent instances',
        panelHint: 'Manage dsh-superagent instances: status, lifecycle, create and destroy',
        stateHealthy: 'Running',
        stateDegraded: 'Degraded',
        stateError: 'Error',
        stateStopped: 'Stopped',
        loadLine: 'Tickets: {running} running / {queued} queued (max {max})',
        setupProblem: 'Setup needed',
        chats: 'Chats',
        openPanel: 'Open panel',
        restart: 'Restart',
        stop: 'Stop',
        start: 'Start',
        destroy: 'Destroy',
        confirmDestroy: 'Destroy instance {name}? The service stops and its DSH_HOME is removed (state DB and clones are kept).',
        newInstance: 'New instance',
        fieldId: 'Instance id (lowercase letters, digits, dashes)',
        fieldName: 'Display name',
        fieldRepository: 'GitHub repository (owner/name)',
        fieldPort: 'Port (auto-assigned when empty)',
        create: 'Create',
        cancel: 'Cancel',
        created: 'Registered. Complete the provisioning steps in docs/DETAIL.md.',
        empty: 'No instances yet.',
        offline: 'Management API unavailable',
      },
    };

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, dictionaries), 'superagent-manager: locale');
        // bind() returns the stable translate function for the namespace; the
        // framework also injects `t` into registered components via `locale: NS`.
        const t = ctx.locale.bind(NS);
        ctx.effect(() => ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main', key: PANEL_ID, locale: NS,
        }, (props) => h(Manager, { t: props.t || t }))), 'superagent-manager: main panel');
        ctx.effect(() => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist', id: PANEL_ID, order: 11, locale: NS, label: () => t('panel'),
        }, BotIcon)), 'superagent-manager: sidebar entry');
      },
    };
  },
});
