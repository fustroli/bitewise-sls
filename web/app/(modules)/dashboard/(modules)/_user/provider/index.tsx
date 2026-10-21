'use client';

import * as userQueries from '@/app/(modules)/dashboard/(modules)/_user/queries';

import {
  ITargets,
  IUser,
} from '@/app/(modules)/dashboard/(modules)/_user/interfaces';
import {
  IUserActions,
  IUserContext,
  UserContext,
} from '@/app/(modules)/dashboard/(modules)/_user/context';
import { PropsWithChildren, useCallback, useMemo } from 'react';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

import { TApiResult } from '@/app/utils/interfaces';

interface IProps extends PropsWithChildren {
  /** The API calls to make; tests pass fakes. */
  actions?: IUserActions;
}

const { ME_KEY, meQuery } = userQueries;

/**
 * The signed-in User from the `['me']` query (suspends until loaded), and
 * the calls that change them, which write the result back to that query.
 */
export const UserProvider: React.FC<IProps> = ({
  actions = userQueries,
  children,
}) => {
  const queryClient = useQueryClient();
  const { data: user } = useSuspenseQuery(meQuery);

  const setUser = useCallback(
    (update: (current: IUser) => IUser) =>
      queryClient.setQueryData<IUser>(
        ME_KEY,
        (current) => current && update(current),
      ),
    [queryClient],
  );

  const apply = useCallback(
    (result: TApiResult<IUser>) => {
      if (result.ok) queryClient.setQueryData(ME_KEY, result.data);
      return result;
    },
    [queryClient],
  );

  const updateTargets = useCallback(
    async (change: Partial<ITargets>) => {
      const before = user.targets;
      const withTargets = (current: IUser, targets: Partial<ITargets>) => ({
        ...current,
        targets: {
          calorieTarget: null,
          macroPlan: null,
          ...current.targets,
          ...targets,
        },
      });

      setUser((current) => withTargets(current, change));
      const result = await actions.updateUser({ targets: change });
      if (!result.ok) {
        // Only the fields still showing this pick, so a later pick stays.
        setUser((current) => {
          const keys = (Object.keys(change) as (keyof ITargets)[]).filter(
            (key) => current.targets?.[key] === change[key],
          );
          return withTargets(
            current,
            Object.fromEntries(keys.map((key) => [key, before?.[key] ?? null])),
          );
        });
      }
      return result;
    },
    [user.targets, actions, setUser],
  );

  const value = useMemo<IUserContext>(
    () => ({
      user,
      updateUser: async (change) => apply(await actions.updateUser(change)),
      updateTargets,
    }),
    [user, actions, apply, updateTargets],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
