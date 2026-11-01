'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/app/components/ui/alert-dialog';
import { ESignOutReason, endSession } from '@/app/auth/sign-out';

import { Button } from '@/app/components/ui/button';
import SettingsRow from '@/app/(modules)/dashboard/(modules)/profile/components/SettingsRow';
import { api } from '@/app/lib/api';
import { toast } from '@/app/hooks/use-toast';
import { useDictionary } from '@/app/providers/dictionary-provider';

const DeleteAccount = () => {
  const { common, profile } = useDictionary();

  // Deletes the data and the Cognito user; the token is dead afterwards, so
  // only this device's tokens are left to clear.
  const handleDeleteUser = async () => {
    const result = await api('users/me', { method: 'DELETE' });

    if (result.ok) await endSession(ESignOutReason.ACCOUNT_DELETED);
    else toast({ variant: 'error', description: result.message });
  };

  return (
    <SettingsRow
      title={profile.deleteAccount.title}
      description={profile.deleteAccount.rowDescription}
    >
      <div className="flex justify-end rounded-lg border bg-card p-4 md:p-6">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              {profile.deleteAccount.title}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {profile.deleteAccount.verification}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {profile.deleteAccount.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{common.cancel}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteUser}>
                {common.continue}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SettingsRow>
  );
};

export default DeleteAccount;
