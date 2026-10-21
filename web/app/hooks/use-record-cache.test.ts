// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MAX_IDS_PER_FETCH } from '@/app/utils/constants';
import { TApiResult } from '@/app/utils/interfaces';
import { useRecordCache } from '@/app/hooks/use-record-cache';

interface IRecord {
  id: number;
}

/** A backend holding records 1–999 except `gone`. */
const backend = (gone: number[] = []) =>
  vi.fn(async (ids: number[]): Promise<TApiResult<IRecord[]>> => ({
    ok: true,
    data: ids.filter((id) => !gone.includes(id)).map((id) => ({ id })),
  }));

const FAILURE = { ok: false as const, status: 500, message: 'Boom' };

describe('useRecordCache', () => {
  it('fetches the requested records, and marks the ones not returned missing', async () => {
    const fetchByIds = backend([3]);
    const { result } = renderHook(() => useRecordCache(fetchByIds));

    act(() => result.current.request([1, 3]));

    await waitFor(() => expect(result.current.records).toEqual([{ id: 1 }]));
    expect(result.current.missing).toEqual([3]);
    expect(fetchByIds).toHaveBeenCalledWith([1, 3]);
  });

  it('fetches each id once, however often and soon it is requested', async () => {
    const fetchByIds = backend();
    const { result } = renderHook(() => useRecordCache(fetchByIds));

    act(() => {
      result.current.request([1, 2, 2, 0]);
      result.current.request([2, 1]);
    });
    await waitFor(() => expect(result.current.records).toHaveLength(2));
    act(() => result.current.request([1, 2, 4]));
    await waitFor(() => expect(result.current.records).toHaveLength(3));

    expect(fetchByIds.mock.calls).toEqual([[[1, 2]], [[4]]]);
  });

  it(`fetches at most ${MAX_IDS_PER_FETCH} ids at a time`, async () => {
    const fetchByIds = backend();
    const { result } = renderHook(() => useRecordCache(fetchByIds));
    const ids = Array.from({ length: MAX_IDS_PER_FETCH + 1 }, (_, i) => i + 1);

    act(() => result.current.request(ids));

    await waitFor(() =>
      expect(result.current.records).toHaveLength(ids.length),
    );
    expect(fetchByIds.mock.calls.map(([batch]) => batch.length)).toEqual([
      MAX_IDS_PER_FETCH,
      1,
    ]);
  });

  it('reports a failure, and fetches the failed ids again on retry', async () => {
    const fetchByIds = backend();
    fetchByIds.mockResolvedValueOnce(FAILURE);
    const onFailure = vi.fn();
    const { result } = renderHook(() => useRecordCache(fetchByIds, onFailure));

    act(() => result.current.request([1, 2]));

    await waitFor(() => expect(result.current.failed).toEqual([1, 2]));
    expect(onFailure).toHaveBeenCalledWith(FAILURE);
    expect(result.current.missing).toEqual([]);

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.records).toHaveLength(2));
    expect(result.current.failed).toEqual([]);
    expect(fetchByIds).toHaveBeenCalledTimes(2);
  });
});
