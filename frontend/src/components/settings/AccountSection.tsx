import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, LogOut, Trash2 } from 'lucide-react';
import { accountApi } from '../../api';
import { getApiError } from '../../api/client';
import { Button, Modal, ModalFooter } from '../ui';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';
import { downloadBlob } from '../../lib/errors';

const Row: React.FC<{ title: string; description: string; action: React.ReactNode }> = ({ title, description, action }) => (
  <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
      <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{description}</p>
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

  const deleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('delete');
    setDeleteError(null);
    try {
      await accountApi.deleteAccount(confirmText.trim());
      logout();
      toast.success('Account deleted', 'All of your GitVanta data has been removed.');
      navigate('/', { replace: true });
    } catch (err) {
      setDeleteError((await getApiError(err, 'Could not delete your account.')).message);
    } finally {
      setBusy(null);
    }
  };

  const matches = !!user && confirmText.trim().toLowerCase() === user.username.toLowerCase();

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-800">
      <Row
        title="Export your data"
        description="Download every analysis, insight and setting GitVanta stores about you, as JSON. Tokens and API keys are never included."
        action={
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} isLoading={busy === 'export'} onClick={exportData}>
            Export data
          </Button>
        }
      />
      <Row
        title="Sign out of all other devices"
        description="Ends every other session, for example on a shared computer. You stay signed in here."
        action={
          <Button variant="outline" size="sm" leftIcon={<LogOut className="h-4 w-4" />} isLoading={busy === 'signout'} onClick={signOutEverywhere}>
            Sign out other devices
          </Button>
        }
      />
      <Row
        title="Delete account"
        description="Permanently removes your profile, every analysis and your saved API key, and revokes GitVanta's access to GitHub."
        action={
          <Button variant="danger" size="sm" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteOpen(true)}>
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
        <form onSubmit={deleteAccount} className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            This can't be undone. Your public profile link and README badge stop working straight away. Your GitHub account
            and repositories are not affected.
          </p>
          <div>
            <label htmlFor="delete-confirm" className="block text-sm font-medium text-gray-900 dark:text-white">
              Type <span className="font-mono">{user?.username}</span> to confirm
            </label>
            <input
              id="delete-confirm"
              className="input mt-1.5 h-10 px-3 text-sm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          {deleteError && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {deleteError}
            </p>
          )}
          <ModalFooter>
            <Button type="button" variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={!matches} isLoading={busy === 'delete'}>
              Delete account
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};

export default AccountSection;
