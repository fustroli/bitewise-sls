import {
  ITargets,
  IUser,
  IUserChange,
} from '@/app/(modules)/dashboard/(modules)/_user/interfaces';
import React, { useContext } from 'react';

import { TApiResult } from '@/app/utils/interfaces';

export interface IUserActions {
  updateUser: (change: IUserChange) => Promise<TApiResult<IUser>>;
  /** Resolves once the new avatar is live (the API re-encodes it). */
  uploadAvatar: (
    file: File,
    currentUrl: string | null,
  ) => Promise<TApiResult<IUser>>;
}

/** On a successful update, `user` becomes the updated User. */
export interface IUserContext {
  user: IUser;
  updateUser: IUserActions['updateUser'];
  uploadAvatar: (file: File) => Promise<TApiResult<IUser>>;
  /**
   * Saves a pick of targets, applied to `user` at once and undone if the
   * save fails.
   */
  updateTargets: (change: Partial<ITargets>) => Promise<TApiResult<IUser>>;
}

export const UserContext = React.createContext<IUserContext | null>(null);

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};
