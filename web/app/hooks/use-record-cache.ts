'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import { MAX_IDS_PER_FETCH } from '@/app/utils/constants';
import { TApiResult } from '@/app/utils/interfaces';

type TEntry<T> =
  { status: 'pending' | 'missing' | 'failed' } | { status: 'ready'; record: T };

type TStatus = TEntry<unknown>['status'];

export interface IRecordCache<T> {
  /** The records fetched so far. */
  records: T[];
  /** Ids the fetch didn't return: deleted, or never the User's. */
  missing: number[];
  /** Ids whose fetch failed; `retry()` asks for them again. */
  failed: number[];
  /** Fetches the ids not fetched yet (or failed), in batches; 0 is skipped. */
  request: (ids: number[]) => void;
  retry: () => void;
}

const batches = (ids: number[]) =>
  Array.from({ length: Math.ceil(ids.length / MAX_IDS_PER_FETCH) }, (_, i) =>
    ids.slice(i * MAX_IDS_PER_FETCH, (i + 1) * MAX_IDS_PER_FETCH),
  );

/**
 * Full records fetched by id, kept for the component's life. Each id is
 * fetched once, however often it is requested: pending ones are not asked
 * for again, failed ones are. Pass a stable `fetchByIds` and `onFailure`.
 */
export const useRecordCache = <T extends { id: number }>(
  fetchByIds: (ids: number[]) => Promise<TApiResult<T[]>>,
  onFailure?: (result: TApiResult<T[]>) => void,
  /** Records already at hand, e.g. fetched on the server; read once. */
  initial?: T[],
): IRecordCache<T> => {
  const [entries, setEntries] = useState<ReadonlyMap<number, TEntry<T>>>(
    () =>
      new Map(
        initial?.map((record) => [record.id, { status: 'ready', record }]),
      ),
  );
  // Each id's status as of the last request, ahead of the next render, so
  // two requests before it don't both fetch an id.
  const statuses = useRef(
    new Map<number, TStatus>(initial?.map(({ id }) => [id, 'ready'])),
  );

  const update = useCallback((changes: [number, TEntry<T>][]) => {
    for (const [id, entry] of changes) statuses.current.set(id, entry.status);
    setEntries((current) => new Map([...current, ...changes]));
  }, []);

  const request = useCallback(
    (ids: number[]) => {
      const wanted = [...new Set(ids)].filter((id) => {
        const status = statuses.current.get(id);
        return id > 0 && (status === undefined || status === 'failed');
      });
      if (!wanted.length) return;

      update(wanted.map((id) => [id, { status: 'pending' }]));
      for (const batch of batches(wanted)) {
        void fetchByIds(batch).then((result) => {
          if (!result.ok) {
            update(batch.map((id) => [id, { status: 'failed' }]));
            onFailure?.(result);
            return;
          }
          const found = new Map(
            result.data.map((record) => [record.id, record]),
          );
          update(
            batch.map((id) => {
              const record = found.get(id);
              return [
                id,
                record ? { status: 'ready', record } : { status: 'missing' },
              ];
            }),
          );
        });
      }
    },
    [fetchByIds, onFailure, update],
  );

  const retry = useCallback(
    () =>
      request(
        [...statuses.current]
          .filter(([, status]) => status === 'failed')
          .map(([id]) => id),
      ),
    [request],
  );

  return useMemo(() => {
    const records: T[] = [];
    const missing: number[] = [];
    const failed: number[] = [];
    for (const [id, entry] of entries) {
      if (entry.status === 'ready') records.push(entry.record);
      else if (entry.status === 'missing') missing.push(id);
      else if (entry.status === 'failed') failed.push(id);
    }
    return { records, missing, failed, request, retry };
  }, [entries, request, retry]);
};
