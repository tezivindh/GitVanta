import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Eye, EyeOff, KeyRound, PlugZap, RefreshCw, Trash2, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import { settingsApi } from '../../api';
import { getApiError } from '../../api/client';
import { AIProviderId, AIProviderInfo, AISettings, AIStatus, AITestResult } from '../../types';
import { Alert, Button, ErrorState, LoadingRegion, Skeleton, Switch } from '../ui';
import { toast } from '../../store/toastStore';
import { formatRelative } from '../../lib/errors';

const CUSTOM_MODEL = '__custom__';

interface FormState {
  provider: AIProviderId;
  model: string;
  customModel: string;
  baseUrl: string;
  apiKey: string;
}

const fieldClass = 'input h-9 px-3 text-sm';
const labelClass = 'mb-1.5 block text-sm font-medium text-ink-2';
const hintClass = 'mt-1.5 min-h-[1lh] text-xs text-muted';
const linkClass =
  'text-ink underline decoration-rule-2 underline-offset-[0.16em] transition-colors duration-[120ms] ease-out hover:text-accent active:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

const AIProviderSection: React.FC = () => {
  const ids = { provider: useId(), model: useId(), custom: useId(), key: useId(), url: useId() };

  const [providers, setProviders] = useState<AIProviderInfo[]>([]);
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [canStoreKeys, setCanStoreKeys] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>({ provider: 'openai', model: '', customModel: '', baseUrl: '', apiKey: '' });
  const [showKey, setShowKey] = useState(false);
  const [liveModels, setLiveModels] = useState<string[] | null>(null);
  const [busy, setBusy] = useState<'save' | 'test' | 'models' | 'toggle' | 'delete' | null>(null);
  const [testResult, setTestResult] = useState<{ ok: true; result: AITestResult } | { ok: false; message: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [catalog, current] = await Promise.all([settingsApi.getProviders(), settingsApi.getAI()]);
      setProviders(catalog.providers);
      setSettings(current.settings);
      setStatus(current.status);
      setCanStoreKeys(current.canStoreKeys);
    } catch (e) {
      setLoadError((await getApiError(e, 'Could not load AI settings.')).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const info = useMemo(() => providers.find((p) => p.id === form.provider), [providers, form.provider]);
  const modelOptions = useMemo(() => {
    const base = liveModels ?? info?.models ?? [];
    // Keep the saved model selectable even if the provider stopped listing it.
    return form.model && form.model !== CUSTOM_MODEL && !base.includes(form.model) ? [form.model, ...base] : base;
  }, [liveModels, info, form.model]);

  const sameAsSaved = settings?.provider === form.provider && settings.hasKey;

  const startEditing = (fromSaved: boolean) => {
    const provider = (fromSaved && settings?.provider) || providers[0]?.id || 'openai';
    const p = providers.find((x) => x.id === provider);
    const savedModel = fromSaved ? settings?.model ?? '' : '';
    const known = p?.models.includes(savedModel);
    setForm({
      provider,
      model: savedModel ? (known ? savedModel : CUSTOM_MODEL) : p?.defaultModel || CUSTOM_MODEL,
      customModel: savedModel && !known ? savedModel : '',
      baseUrl: fromSaved ? settings?.baseUrl ?? '' : '',
      apiKey: '',
    });
    setLiveModels(null);
    setTestResult(null);
    setFormError(null);
    setShowKey(false);
    setEditing(true);
  };

  const changeProvider = (id: AIProviderId) => {
    const p = providers.find((x) => x.id === id);
    setForm((f) => ({
      ...f,
      provider: id,
      model: p?.defaultModel || CUSTOM_MODEL,
      customModel: '',
      baseUrl: id === 'custom' ? f.baseUrl : '',
      apiKey: '',
    }));
    setLiveModels(null);
    setTestResult(null);
    setFormError(null);
  };

  const payload = () => ({
    provider: form.provider,
    model: (form.model === CUSTOM_MODEL ? form.customModel : form.model).trim() || undefined,
    baseUrl: form.provider === 'custom' ? form.baseUrl.trim() || undefined : undefined,
    apiKey: form.apiKey.trim() || undefined,
  });

  const validate = (): string | null => {
    if (info?.requiresBaseUrl && !form.baseUrl.trim()) return 'Enter the base URL of your server.';
    if (info?.requiresKey && !form.apiKey.trim() && !sameAsSaved) return `Enter your ${info.label} API key.`;
    if (form.model === CUSTOM_MODEL && !form.customModel.trim()) return 'Type the model name.';
    return null;
  };

  const runTest = async () => {
    const problem = validate();
    if (problem) return setFormError(problem);
    setFormError(null);
    setBusy('test');
    setTestResult(null);
    try {
      const result = await settingsApi.testAI(payload());
      setTestResult({ ok: true, result });
    } catch (e) {
      setTestResult({ ok: false, message: (await getApiError(e, 'Connection test failed.')).message });
    } finally {
      setBusy(null);
    }
  };

  const loadModels = async () => {
    const problem = info?.requiresBaseUrl && !form.baseUrl.trim()
      ? 'Enter the base URL first.'
      : info?.requiresKey && !form.apiKey.trim() && !sameAsSaved
        ? `Enter your ${info.label} API key first.`
        : null;
    if (problem) return setFormError(problem);
    setFormError(null);
    setBusy('models');
    try {
      const models = await settingsApi.listModels(payload());
      setLiveModels(models);
      if (models.length === 0) toast.info('No models found', 'The provider returned an empty list. Type a model name instead.');
      else toast.success(`Found ${models.length} models`);
    } catch (e) {
      setFormError((await getApiError(e, 'Could not load models.')).message);
    } finally {
      setBusy(null);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) return setFormError(problem);
    setFormError(null);
    setBusy('save');
    try {
      const saved = await settingsApi.saveAI({ ...payload(), enabled: true });
      setSettings(saved);
      setEditing(false);
      toast.success('AI provider saved', `AI features now use your ${saved.providerLabel} key.`);
      const current = await settingsApi.getAI();
      setStatus(current.status);
    } catch (e2) {
      setFormError((await getApiError(e2, 'Could not save your AI settings.')).message);
    } finally {
      setBusy(null);
    }
  };

  const toggle = async (enabled: boolean) => {
    setBusy('toggle');
    try {
      const saved = await settingsApi.toggleAI(enabled);
      setSettings(saved);
      const current = await settingsApi.getAI();
      setStatus(current.status);
      toast.success(enabled ? 'Using your API key' : 'Using the GitVanta key');
    } catch (e) {
      toast.error('Could not change the setting', (await getApiError(e)).message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy('delete');
    try {
      await settingsApi.deleteAI();
      setSettings(null);
      setConfirmDelete(false);
      const current = await settingsApi.getAI();
      setStatus(current.status);
      toast.success('API key removed');
    } catch (e) {
      toast.error('Could not remove the key', (await getApiError(e)).message);
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <LoadingRegion label="Loading AI settings" className="space-y-3">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-24" />
      </LoadingRegion>
    );
  }
  if (loadError) return <ErrorState message={loadError} onRetry={load} />;

  return (
    <div className="space-y-5">
      {status && (
        <div
          className={
            status.available
              ? 'flex items-start gap-3 rounded-pill bg-paper-3 px-3.5 py-2.5 text-sm text-ink-2'
              : 'flex items-start gap-3 rounded-pill bg-bad-soft px-3.5 py-2.5 text-sm text-ink'
          }
        >
          <KeyRound className={`mt-0.5 h-4 w-4 shrink-0 ${status.available ? 'text-muted' : 'text-bad'}`} aria-hidden="true" />
          <p>{status.message}</p>
        </div>
      )}

      {!canStoreKeys && (
        <Alert variant="warning" title="Saving keys is turned off on this server">
          The server has no <span className="measured">ENCRYPTION_KEY</span> set, so personal keys can’t be stored safely. You can
          still test a key.
        </Alert>
      )}

      {/* Saved key summary */}
      {settings && !editing && (
        <div>
          <div className="flex flex-col gap-5 min-[60rem]:flex-row min-[60rem]:items-start min-[60rem]:justify-between">
            <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted">Provider</dt>
              <dd className="text-ink">{settings.providerLabel}</dd>
              <dt className="text-muted">Model</dt>
              <dd className="measured break-all text-ink">{settings.model}</dd>
              {settings.baseUrl && (
                <>
                  <dt className="text-muted">Base URL</dt>
                  <dd className="measured break-all text-ink">{settings.baseUrl}</dd>
                </>
              )}
              <dt className="text-muted">Key</dt>
              <dd className={settings.keyHint ? 'measured text-ink' : 'text-ink'}>{settings.keyHint ?? 'None (not required)'}</dd>
              {settings.lastTestedAt && (
                <>
                  <dt className="text-muted">Last test</dt>
                  <dd className={settings.lastTestOk ? 'text-ok' : 'text-bad'}>
                    {settings.lastTestOk ? 'Passed' : 'Failed'}{' '}
                    <span className="measured">{formatRelative(settings.lastTestedAt)}</span>
                  </dd>
                </>
              )}
            </dl>
            <div className="min-[60rem]:w-64">
              <Switch
                label="Use my own API key"
                description={settings.enabled ? 'On: AI requests use this key.' : 'Off: AI requests use the GitVanta key.'}
                checked={settings.enabled}
                disabled={busy === 'toggle'}
                onChange={toggle}
              />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-rule pt-4">
            <Button type="button" size="sm" variant="outline" onClick={() => startEditing(true)}>
              Change key or model
            </Button>
            {!confirmDelete ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                leftIcon={<Trash2 className="h-4 w-4" />}
                onClick={() => setConfirmDelete(true)}
              >
                Remove key
              </Button>
            ) : (
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Confirm key removal">
                <span className="text-sm text-ink-2">Remove this key?</span>
                <Button type="button" size="sm" variant="danger" isLoading={busy === 'delete'} onClick={remove}>
                  Remove
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Keep it
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {!settings && !editing && (
        <Button type="button" variant="outline" leftIcon={<KeyRound className="h-4 w-4" />} onClick={() => startEditing(false)}>
          Use my own API key
        </Button>
      )}

      {/* Editor */}
      {editing && (
        <form onSubmit={save} className="max-w-xl space-y-4" noValidate>
          <div>
            <label htmlFor={ids.provider} className={labelClass}>
              Provider
            </label>
            <select
              id={ids.provider}
              className={fieldClass}
              value={form.provider}
              onChange={(e) => changeProvider(e.target.value as AIProviderId)}
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <p className={hintClass}>
              {info && (
                <>
                  {info.description}{' '}
                  {info.keyUrl && (
                    <a href={info.keyUrl} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-0.5 ${linkClass}`}>
                      Get a key <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  )}
                </>
              )}
            </p>
          </div>

          {info?.requiresBaseUrl && (
            <div>
              <label htmlFor={ids.url} className={labelClass}>
                Base URL
              </label>
              <input
                id={ids.url}
                type="url"
                inputMode="url"
                className={`${fieldClass} measured`}
                placeholder="https://api.together.xyz/v1"
                value={form.baseUrl}
                onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                autoComplete="off"
                spellCheck={false}
              />
              <p className={hintClass}>
                Any server with an OpenAI-style <span className="measured">/chat/completions</span> endpoint. Examples: Ollama{' '}
                <span className="measured">http://localhost:11434/v1</span>, LM Studio{' '}
                <span className="measured">http://localhost:1234/v1</span>. Local addresses work only when GitVanta runs on
                your own machine.
              </p>
            </div>
          )}

          <div>
            <label htmlFor={ids.key} className={labelClass}>
              API key{!info?.requiresKey && <span className="font-normal text-muted"> (optional)</span>}
            </label>
            <div className="relative">
              <input
                id={ids.key}
                type={showKey ? 'text' : 'password'}
                className={`${fieldClass} measured pr-11`}
                placeholder={sameAsSaved ? `Saved: ${settings?.keyHint}. Leave blank to keep it.` : info?.keyPlaceholder}
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                autoComplete="off"
                spellCheck={false}
                aria-describedby={`${ids.key}-hint`}
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-pill text-muted transition-colors duration-[120ms] ease-out hover:text-ink active:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
                aria-pressed={showKey}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p id={`${ids.key}-hint`} className={hintClass}>
              Stored encrypted. After saving, only the last four characters are ever shown.
            </p>
          </div>

          <div>
            <div className="mb-1.5 flex items-end justify-between gap-3">
              <label htmlFor={ids.model} className="block text-sm font-medium text-ink-2">
                Model
              </label>
              <button
                type="button"
                onClick={loadModels}
                disabled={busy === 'models'}
                className="inline-flex items-center gap-1 rounded-chip text-xs text-ink underline decoration-rule-2 underline-offset-[0.16em] transition-colors duration-[120ms] ease-out hover:text-accent disabled:cursor-not-allowed disabled:opacity-55"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${busy === 'models' ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
                {liveModels ? 'Reload models from provider' : 'Load models from provider'}
              </button>
            </div>
            <select
              id={ids.model}
              className={`${fieldClass} measured`}
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            >
              {modelOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                  {m === info?.defaultModel ? ' (recommended)' : ''}
                </option>
              ))}
              <option value={CUSTOM_MODEL}>Other model…</option>
            </select>
            {form.model === CUSTOM_MODEL && (
              <div className="mt-2">
                <label htmlFor={ids.custom} className="sr-only">
                  Model name
                </label>
                <input
                  id={ids.custom}
                  className={`${fieldClass} measured`}
                  placeholder="Exact model ID, e.g. llama3.1:8b"
                  value={form.customModel}
                  onChange={(e) => setForm({ ...form, customModel: e.target.value })}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            )}
            <p className={hintClass}>
              {liveModels ? (
                <>
                  <span className="measured">{liveModels.length}</span> models available to this key.
                </>
              ) : (
                'Suggested models. Load the list from the provider to see every model your key can use.'
              )}
            </p>
          </div>

          {formError && (
            <p role="alert" className="text-sm text-bad">
              {formError}
            </p>
          )}

          {testResult && (
            <div
              role="status"
              className={
                testResult.ok
                  ? 'flex items-start gap-2 rounded-pill bg-ok-soft px-3 py-2.5 text-sm text-ink'
                  : 'flex items-start gap-2 rounded-pill bg-bad-soft px-3 py-2.5 text-sm text-ink'
              }
            >
              {testResult.ok ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-hidden="true" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-bad" aria-hidden="true" />
              )}
              <span>
                {testResult.ok ? (
                  <>
                    Connected to {testResult.result.providerLabel} (
                    <span className="measured">{testResult.result.model}</span>) in{' '}
                    <span className="measured">{testResult.result.latencyMs}&nbsp;ms</span>.
                    {testResult.result.warning ? ` ${testResult.result.warning}` : ''}
                  </>
                ) : (
                  testResult.message
                )}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-rule pt-4">
            <Button type="submit" isLoading={busy === 'save'} disabled={!canStoreKeys || (busy !== null && busy !== 'save')}>
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              leftIcon={<PlugZap className="h-4 w-4" />}
              isLoading={busy === 'test'}
              disabled={busy !== null && busy !== 'test'}
              onClick={runTest}
            >
              Test connection
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(false)} disabled={busy === 'save'}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-4 gap-y-1.5 border-t border-rule pt-4 text-xs">
        <dt className="text-muted">Encryption</dt>
        <dd className="text-ink-2">
          <span className="measured">AES-256-GCM</span> at rest
        </dd>
        <dt className="text-muted">Shown</dt>
        <dd className="text-ink-2">The last four characters only, never the full key</dd>
        <dt className="text-muted">Billing</dt>
        <dd className="text-ink-2">With your own key you pay your provider directly</dd>
        <dt className="text-muted">Limit</dt>
        <dd className="text-ink-2">
          <span className="measured">500</span> AI requests an hour instead of <span className="measured">50</span>
        </dd>
      </dl>
    </div>
  );
};

export default AIProviderSection;
