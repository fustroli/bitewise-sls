'use client';

import { Button } from '@/app/components/ui/button';
import SettingsRow from '@/app/(modules)/dashboard/(modules)/profile/components/SettingsRow';
import UserAvatar from '@/app/(modules)/dashboard/(modules)/_user/components/UserAvatar';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useUserContext } from '@/app/(modules)/dashboard/(modules)/_user/context';

/**
 * The avatar and sign-in email. Changing the photo waits for avatar uploads
 * (runbook section 6), so its button is disabled.
 */
const BasicInfo = () => {
  const { profile } = useDictionary();
  const { user } = useUserContext();

  return (
    <SettingsRow
      title={profile.basic.title}
      description={profile.basic.description}
    >
      <div className="flex flex-wrap items-center gap-5 rounded-lg border bg-card p-4 md:p-6">
        <UserAvatar user={user} className="size-16 rounded-full text-2xl" />
        <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-1">
          <span className="text-[13px] font-bold text-muted-foreground">
            {profile.basic.email}
          </span>
          <span className="break-all text-base font-bold">{user.email}</span>
          <p className="text-sm text-muted-foreground">
            {profile.basic.avatarSoon}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-10 px-3.5 text-[13px]"
          type="button"
          disabled
        >
          {profile.basic.changePhoto}
        </Button>
      </div>
    </SettingsRow>
  );
};

export default BasicInfo;
