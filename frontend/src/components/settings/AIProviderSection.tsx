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

const fieldClass = 'input h-10 px-3 text-sm';
const labelClass = 'block text-sm font-medium text-gray-900 dark:text-white';
const hintClass = 'mt-1 text-xs text-gray-600 dark:text-gray-400';

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
              ? 'flex items-start gap-3 rounded-lg bg-gray-50 px-4 py-3 text-sm dark:bg-gray-950/60'
              : 'flex items-start gap-3 rounded-lg bg-gain-50 px-4 py-3 text-sm dark:bg-gain-700/15'
          }
        >
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" aria-hidden="true" />
          <p className="text-gray-800 dark:text-gray-200">{status.message}</p>
        </div>
      )}

      {!canStoreKeys && (
        <Alert variant="warning" title="Saving keys is turned off on this server">
          The server has no ENCRYPTION_KEY set, so personal keys can't be stored safely. You can still test a key.
        </Alert>
      )}

      {/* Saved key summary */}
      {settings && !editing && (
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-gray-500 dark:text-gray-400">Provider</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{settings.providerLabel}</dd>
              <dt className="text-gray-500 dark:text-gray-400">Model</dt>
              <dd className="break-all font-mono text-gray-900 dark:text-white">{settings.model}</dd>
              {settings.baseUrl && (
                <>
                  <dt className="text-gray-500 dark:text-gray-400">Base URL</dt>
                  <dd className="break-all font-mono text-gray-900 dark:text-white">{settings.baseUrl}</dd>
                </>
              )}
              <dt className="text-gray-500 dark:text-gray-400">Key</dt>
              <dd className="font-mono text-gray-900 dark:text-white">{settings.keyHint ?? 'None (not required)'}</dd>
              {settings.lastTestedAt && (
                <>
                  <dt className="text-gray-500 dark:text-gray-400">Last test</dt>
                  <dd className={settings.lastTestOk ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}>
                    {settings.lastTestOk ? 'Passed' : 'Failed'} {formatRelative(settings.lastTestedAt)}
                  </dd>
                </>
              )}
            </dl>
            <div className="sm:w-56">
              <Switch
                label="Use my own API key"
                description={settings.enabled ? 'On: AI requests use this key.' : 'Off: AI requests use the GitVanta key.'}
                checked={settings.enabled}
                disabled={busy === 'toggle'}
                onChange={toggle}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-200 pt-4 dark:border-gray-800">
            <Button size="sm" variant="outline" onClick={() => startEditing(true)}>
              Change key or model
            </Button>
            {!confirmDelete ? (
              <Button size="sm" variant="ghost" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmDelete(true)}>
                Remove key
              </Button>
            ) : (
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Confirm key removal">
                <span className="text-sm text-gray-700 dark:text-gray-300">Remove this key?</span>
                <Button size="sm" variant="danger" isLoading={busy === 'delete'} onClick={remove}>
                  Remove
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Keep it
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {!settings && !editing && (
        <Button leftIcon={<KeyRound className="h-4 w-4" />} onClick={() => startEditing(false)}>
          Use my own API key
        </Button>
      )}

      {/* Editor */}
      {editing && (
        <form onSubmit={save} className="space-y-5 rounded-lg border border-gray-200 p-4 sm:p-5 dark:border-gray-800" noValidate>
          <div>
            <label htmlFor={ids.provider} className={labelClass}>
              Provider
            </label>
            <select
              id={ids.provider}
              className={`${fieldClass} mt-1.5`}
              value={form.provider}
              onChange={(e) => changeProvider(e.target.value as AIProviderId)}
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            {info && (
              <p className={hintClass}>
                {info.description}{' '}
                {info.keyUrl && (
                  <a
                    href={info.keyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 font-medium text-primary-700 underline-offset-2 hover:underline dark:text-primary-400"
                  >
                    Get a key <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
              </p>
            )}
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
                className={`${fieldClass} mt-1.5 font-mono`}
                placeholder="https://api.together.xyz/v1"
                value={form.baseUrl}
                onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                autoComplete="off"
                spellCheck={false}
              />
              <p className={hintClass}>
                Any server with an OpenAI-style <span className="font-mono">/chat/completions</span> endpoint. Examples: Ollama{' '}
                <span className="font-mono">http://localhost:11434/v1</span>, LM Studio{' '}
                <span className="font-mono">http://localhost:1234/v1</span>. Local addresses work only when GitVanta runs on
                your own machine.
              </p>
            </div>
          )}

          <div>
            <label htmlFor={ids.key} className={labelClass}>
              API key{!info?.requiresKey && <span className="font-normal text-gray-500 dark:text-gray-400"> (optional)</span>}
            </label>
            <div className="relative mt-1.5">
              <input
                id={ids.key}
                type={showKey ? 'text' : 'password'}
                className={`${fieldClass} pr-11 font-mono`}
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
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
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
            <div className="flex items-end justify-between gap-3">
              <label htmlFor={ids.model} className={labelClass}>
                Model
              </label>
              <button
                type="button"
                onClick={loadModels}
                disabled={busy === 'models'}
                className="inline-flex items-center gap-1 rounded-md text-xs font-medium text-primary-700 hover:underline disabled:opacity-50 dark:text-primary-400"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${busy === 'models' ? 'animate-spin' : ''}`} aria-hidden="true" />
                {liveModels ? 'Reload models from provider' : 'Load models from provider'}
              </button>
            </div>
            <select
              id={ids.model}
              className={`${fieldClass} mt-1.5`}
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
                  className={`${fieldClass} font-mono`}
                  placeholder="Exact model ID, e.g. llama3.1:8b"
                  value={form.customModel}
                  onChange={(e) => setForm({ ...form, customModel: e.target.value })}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            )}
            <p className={hintClass}>
              {liveModels
                ? `${liveModels.length} models available to this key.`
                : 'Suggested models. Load the list from the provider to see every model your key can use.'}
            </p>
          </div>

          {formError && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {formError}
            </p>
          )}

          {testResult && (
            <div
              role="status"
              className={
                testResult.ok
                  ? 'flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                  : 'flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-900 dark:bg-red-950/40 dark:text-red-200'
              }
            >
              {testResult.ok ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span>
                {testResult.ok
                  ? `Connected to ${testResult.result.providerLabel} (${testResult.result.model}) in ${testResult.result.latencyMs} ms.${
                      testResult.result.warning ? ` ${testResult.result.warning}` : ''
                    }`
                  : testResult.message}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-4 dark:border-gray-800">
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

      <p className="text-sm text-gray-600 dark:text-gray-400">
        With your own key you pay your provider directly and get a higher limit: 500 AI requests an hour instead of 50.
      </p>
    </div>
  );
};

export default AIProviderSection;
