import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, LogOut, Trash2 } from 'lucide-react';
import { accountApi } from '../../api';
import { getApiError } from '../../api/client';
import { Button, Modal, ModalFooter } from '../ui';
import HoldButton from '../HoldButton';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';
import { downloadBlob } from '../../lib/errors';

const Row: React.FC<{ title: string; description: string; action: React.ReactNode }> = ({ title, description, action }) => (
  <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
    <div className="min-w-0">
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="mt-0.5 max-w-[60ch] text-sm text-muted">{description}</p>
    </div>
    <div className="shrink-0">{action}</div>
  </div>
);

const AccountSection: React.FC = () => {
  const { user, setToken, logout } = useAuthStore();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<'export' | 'signout' | 'delete' | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Bumped after a failed delete so the hold button resets to its idle state.
  const [holdKey, setHoldKey] = useState(0);

  const exportData = async () => {
    setBusy('export');
    try {
      const blob = await accountApi.exportData();
      downloadBlob(blob, `gitvanta-data-${user?.username ?? 'export'}.json`);
      toast.success('Data exported', 'Your download has started.');
    } catch (e) {
      toast.error('Export failed', (await getApiError(e)).message);
    } finally {
      setBusy(null);
    }
  };

  const signOutEverywhere = async () => {
    setBusy('signout');
    try {
      const token = await accountApi.signOutEverywhere();
      if (token) setToken(token);
      toast.success('Signed out of all other devices', 'This device stays signed in.');
    } catch (e) {
      toast.error('Could not sign out other devices', (await getApiError(e)).message);
    } finally {
      setBusy(null);
    }
  };

  // Runs once the user has typed their username and held the button for the full time.
  const deleteAccount = async () => {
    setBusy('delete');
    setDeleteError(null);
    try {
      await accountApi.deleteAccount(confirmText.trim());
      logout();
      toast.success('Account deleted', 'All of your GitVanta data has been removed.');
      navigate('/', { replace: true });
    } catch (err) {
      setDeleteError((await getApiError(err, 'Could not delete your account.')).message);
      setHoldKey((k) => k + 1);
    } finally {
      setBusy(null);
    }
  };

  const matches = !!user && confirmText.trim().toLowerCase() === user.username.toLowerCase();

  return (
    <div className="divide-y divide-rule">
      <Row
        title="Export your data"
        description="Download every analysis, insight and setting GitVanta stores about you, as JSON. Tokens and API keys are never included."
        action={
          <Button type="button" variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} isLoading={busy === 'export'} onClick={exportData}>
            Export data
          </Button>
        }
      />
      <Row
        title="Sign out of all other devices"
        description="Ends every other session, for example on a shared computer. You stay signed in here."
        action={
          <Button type="button" variant="outline" size="sm" leftIcon={<LogOut className="h-4 w-4" />} isLoading={busy === 'signout'} onClick={signOutEverywhere}>
            Sign out other devices
          </Button>
        }
      />
      <Row
        title="Delete account"
        description="Permanently removes your profile, every analysis and your saved API key, and revokes GitVanta’s access to GitHub."
        action={
          <Button type="button" variant="danger" size="sm" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteOpen(true)}>
            Delete account
          </Button>
        }
      />

      <Modal
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setConfirmText('');
          setDeleteError(null);
        }}
        title="Delete your GitVanta account?"
        size="md"
      >
        {/* Enter never deletes: the account goes only after the hold completes. */}
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <p className="text-sm text-ink-2">
            This can’t be undone. Your public profile link and README badge stop working straight away. Your GitHub account
            and repositories are not affected.
          </p>
          <div>
            <label htmlFor="delete-confirm" className="mb-1.5 block text-sm font-medium text-ink-2">
              Type <span className="measured text-ink">{user?.username}</span> to confirm
            </label>
            <input
              id="delete-confirm"
              className="input h-9 px-3 text-sm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              aria-invalid={deleteError ? true : undefined}
              aria-describedby={deleteError ? 'delete-confirm-error' : undefined}
            />
            <p id="delete-confirm-error" role="alert" className="mt-1.5 min-h-[1lh] text-sm text-bad">
              {deleteError}
            </p>
          </div>
          <ModalFooter>
            <Button type="button" variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <HoldButton
              key={holdKey}
              size="sm"
              textColor="var(--color-bad)"
              holdTime={2000}
              resetAfter={0}
              disabled={!matches}
              icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
              doneLabel="Deleting…"
              onHold={deleteAccount}
            >
              Hold to delete account
            </HoldButton>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};

export default AccountSection;
