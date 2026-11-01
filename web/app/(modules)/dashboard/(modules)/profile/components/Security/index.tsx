'use client';

import ChangeEmail from '@/app/(modules)/dashboard/(modules)/profile/components/Security/ChangeEmail';
import ChangePassword from '@/app/(modules)/dashboard/(modules)/profile/components/Security/ChangePassword';
import { useUserContext } from '@/app/(modules)/dashboard/(modules)/_user/context';

/** A Google-only User has no password to change (nor can set a first one). */
const Security = () => {
  const { user } = useUserContext();

  return (
    <div className="flex flex-col">
      <ChangeEmail />
      {user.hasPassword !== false && <ChangePassword />}
    </div>
  );
};

export default Security;
