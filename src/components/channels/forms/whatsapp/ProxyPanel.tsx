import { useEffect, useRef, useState } from 'react';
import { FormField } from '../../shared/FormField';
import { FormSection } from '../../shared/FormSection';
import EvolutionGoService from '@/services/channels/evolutionGoService';

type ProxyStatus =
  | 'inactive'
  | 'configured'
  | 'connected'
  | 'active'
  | 'slow'
  | 'error'
  | 'unavailable'
  | 'loading';

interface ProxyHealth {
  instanceId?: string;
  proxyAddress?: string;
  proxyUsername?: string;
  hasAuth?: boolean;
  status: ProxyStatus;
  lastCheck?: string;
  latencyMs?: number;
  error?: string;
  thresholdMs?: number;
}

interface ProxyForm {
  protocol: string;
  host: string;
  port: string;
  username: string;
  password: string;
}

interface ProxyPanelProps {
  instanceUuid: string;
}

const POLL_INTERVAL_MS = 30_000;

const STATUS_BADGE: Record<ProxyStatus, { label: string; color: string }> = {
  active: { label: 'Ativo', color: 'bg-green-500' },
  configured: { label: 'Configurado', color: 'bg-blue-500' },
  connected: { label: 'Em uso', color: 'bg-green-500' },
  slow: { label: 'Lento', color: 'bg-yellow-500' },
  error: { label: 'Erro', color: 'bg-red-500' },
  inactive: { label: 'Sem proxy', color: 'bg-slate-400' },
  unavailable: { label: 'Indisponível', color: 'bg-red-500' },
  loading: { label: 'Verificando…', color: 'bg-slate-300' },
};

function formatRelative(iso?: string): string {
  if (!iso) return '—';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `há ${diff}s`;
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  return `há ${Math.floor(diff / 3600)}h`;
}

export function ProxyPanel({ instanceUuid }: ProxyPanelProps) {
  const [health, setHealth] = useState<ProxyHealth>({ status: 'loading' });
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [form, setForm] = useState<ProxyForm>({
    protocol: 'http',
    host: '',
    port: '',
    username: '',
    password: '',
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = async () => {
    try {
      const data = await EvolutionGoService.getProxyStatus(instanceUuid);
      setHealth({ ...data, status: (data.status as ProxyStatus) || 'inactive' });

      // Pre-fill host/port from proxyAddress (protocol://host:port) — never pre-fill credentials
      if (data.proxyAddress && !form.host) {
        const match = data.proxyAddress.match(/^(?:(\w+):\/\/)?([^:]+):(\d+)$/);
        if (match) {
          setForm(f => ({
            ...f,
            protocol: match[1] || 'http',
            host: match[2] || '',
            port: match[3] || '',
            username: data.proxyUsername || f.username,
          }));
        }
      } else if (data.proxyUsername && !form.username) {
        setForm(f => ({ ...f, username: data.proxyUsername || f.username }));
      }
    } catch {
      setHealth({ status: 'unavailable', error: 'Não foi possível contatar o Evolution Go' });
    }
  };

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceUuid]);

  const handleSave = async () => {
    setSaveError('');
    if (!form.host || !form.port) {
      setSaveError('Host e porta são obrigatórios');
      return;
    }
    setSaving(true);
    try {
      await EvolutionGoService.setProxy(instanceUuid, {
        protocol: form.protocol || undefined,
        host: form.host,
        port: form.port,
        username: form.username || undefined,
        password: form.password || undefined,
      });
      setForm(f => ({ ...f, password: '' }));
      await fetchStatus();
    } catch (e: any) {
      setSaveError(e?.response?.data?.error || 'Erro ao salvar proxy');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await EvolutionGoService.deleteProxy(instanceUuid);
      setForm({ protocol: 'http', host: '', port: '', username: '', password: '' });
      await fetchStatus();
    } catch (e: any) {
      setSaveError(e?.response?.data?.error || 'Erro ao remover proxy');
    } finally {
      setRemoving(false);
    }
  };

  const badge = STATUS_BADGE[health.status];
  const hasProxy = health.status !== 'inactive' && health.status !== 'loading';

  return (
    <FormSection title="Proxy" className="bg-gray-50/10 border-gray-200/20">
      {/* Status bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${badge.color}`} />
          <span className="text-sm font-medium">{badge.label}</span>
          {health.proxyAddress && (
            <span className="text-xs text-muted-foreground font-mono">{health.proxyAddress}</span>
          )}
          {health.latencyMs != null && (
            <span className="text-xs text-muted-foreground">{health.latencyMs}ms</span>
          )}
          {health.lastCheck && (
            <span className="text-xs text-muted-foreground">
              {formatRelative(health.lastCheck)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={fetchStatus}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          title="Atualizar status"
        >
          ↺ Atualizar
        </button>
      </div>

      {health.error && health.status !== 'error' && (
        <p className="text-xs text-destructive mb-3">{health.error}</p>
      )}
      {health.status === 'error' && health.error && (
        <p className="text-xs text-destructive mb-3">Erro: {health.error}</p>
      )}

      {/* Config form */}
      <div className="space-y-3 border-t border-gray-200/20 pt-4" data-form-type="other">
        <input
          type="text"
          name="username"
          autoComplete="username"
          tabIndex={-1}
          className="hidden"
          aria-hidden="true"
        />
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          tabIndex={-1}
          className="hidden"
          aria-hidden="true"
        />
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Configurar Proxy
        </p>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium text-sidebar-foreground/80 block mb-1">
              Protocolo
            </label>
            <select
              value={form.protocol}
              onChange={e => setForm(f => ({ ...f, protocol: e.target.value }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="http">http</option>
              <option value="https">https</option>
              <option value="socks5">socks5</option>
              <option value="socks4">socks4</option>
            </select>
          </div>
          <div className="col-span-2">
            <FormField
              label="Host"
              value={form.host}
              onChange={v => setForm(f => ({ ...f, host: v }))}
              placeholder="proxy.exemplo.com"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Porta"
            value={form.port}
            onChange={v => setForm(f => ({ ...f, port: v }))}
            placeholder="8080"
            required
          />
          <FormField
            label="Usuário (opcional)"
            value={form.username}
            onChange={v => setForm(f => ({ ...f, username: v }))}
            placeholder=""
            autoComplete="off"
            name={`evolution_go_proxy_user_${instanceUuid}`}
            dataFormType="other"
          />
        </div>

        <FormField
          label="Senha (opcional)"
          value={form.password}
          onChange={v => setForm(f => ({ ...f, password: v }))}
          placeholder=""
          type="password"
          autoComplete="new-password"
          name={`evolution_go_proxy_secret_${instanceUuid}`}
          dataFormType="other"
        />

        {saveError && <p className="text-xs text-destructive">{saveError}</p>}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Salvando…' : 'Salvar Proxy'}
          </button>
          {hasProxy && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={removing}
              className="px-4 py-2 rounded-md border border-destructive text-destructive text-sm font-medium hover:bg-destructive/10 disabled:opacity-50 transition-colors"
            >
              {removing ? 'Removendo…' : 'Remover Proxy'}
            </button>
          )}
        </div>
      </div>
    </FormSection>
  );
}
