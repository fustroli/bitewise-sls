import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApi } from '@/app/lib/api';

const BASE_URL = 'https://app.test/api';
const TOKEN = 'test-token';

const fakeFetch = vi.fn<typeof fetch>();
const onUnauthorized = vi.fn();

const api = ({ token }: { token?: string } = { token: TOKEN }) =>
  createApi({
    baseUrl: BASE_URL,
    getToken: async () => token,
    onUnauthorized,
    fetch: fakeFetch,
  });

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

const lastCall = () => {
  const [url, init] = fakeFetch.mock.calls.at(-1)!;
  return { url: String(url), init: init!, headers: init!.headers as any };
};

beforeEach(() => {
  fakeFetch.mockReset();
  onUnauthorized.mockReset();
});

describe('api', () => {
  it('returns parsed JSON on success', async () => {
    fakeFetch.mockResolvedValue(jsonResponse({ id: '01J', name: 'Oats' }));

    const result = await api()('ingredient/01J');

    expect(result).toEqual({ ok: true, data: { id: '01J', name: 'Oats' } });
    expect(lastCall().url).toBe(`${BASE_URL}/ingredient/01J`);
    expect(lastCall().headers.Authorization).toBe(`Bearer ${TOKEN}`);
  });

  it('returns ok with no data on 204', async () => {
    fakeFetch.mockResolvedValue(new Response(null, { status: 204 }));

    const result = await api()('ingredient/01J', { method: 'DELETE' });

    expect(result).toEqual({ ok: true, data: undefined });
  });

  it.each([
    ['a string message', { message: 'Name taken' }, 'Name taken'],
    [
      'an array message',
      { message: ['name is required', 'unit is invalid'] },
      'name is required, unit is invalid',
    ],
    ['an error field', { error: 'Bad Request' }, 'Bad Request'],
  ])('returns the API message given as %s', async (_, body, message) => {
    fakeFetch.mockResolvedValue(jsonResponse(body, 400));

    const result = await api()('ingredient', {
      method: 'POST',
      body: { name: 'x' },
    });

    expect(result).toEqual({ ok: false, status: 400, message });
  });

  it('falls back to the status line for a non-JSON error body', async () => {
    fakeFetch.mockResolvedValue(
      new Response('<html>oops</html>', {
        status: 502,
        statusText: 'Bad Gateway',
      }),
    );

    const result = await api()('ingredient');

    expect(result).toEqual({
      ok: false,
      status: 502,
      message: '502 Bad Gateway',
    });
  });

  it('reports a network failure as status 0', async () => {
    fakeFetch.mockRejectedValue(new TypeError('Failed to fetch'));

    const result = await api()('ingredient');

    expect(result).toMatchObject({ ok: false, status: 0 });
  });

  it('ends the session on 401', async () => {
    fakeFetch.mockResolvedValue(jsonResponse({ message: 'Unauthorized' }, 401));

    const result = await api()('users/me');

    expect(result).toMatchObject({ ok: false, status: 401 });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('ends the session without calling the API when there is no token', async () => {
    const result = await api({})('users/me');

    expect(result).toMatchObject({ ok: false, status: 401 });
    expect(onUnauthorized).toHaveBeenCalledOnce();
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  it('sends JSON with a JSON Content-Type', async () => {
    fakeFetch.mockResolvedValue(jsonResponse({}));

    await api()('meal', { method: 'POST', body: { name: 'Porridge' } });

    expect(lastCall().init.body).toBe(JSON.stringify({ name: 'Porridge' }));
    expect(lastCall().headers['Content-Type']).toBe('application/json');
  });

  it('sends no body or Content-Type without a body', async () => {
    fakeFetch.mockResolvedValue(jsonResponse({}));

    await api()('meal');

    expect(lastCall().init.body).toBeUndefined();
    expect(lastCall().headers).not.toHaveProperty('Content-Type');
  });

  it('builds the query string, skipping empty params', async () => {
    fakeFetch.mockResolvedValue(jsonResponse({ data: [], count: 0 }));

    await api()('meal', {
      query: { limit: 10, offset: 20, orderBy: undefined },
    });

    expect(lastCall().url).toBe(`${BASE_URL}/meal?limit=10&offset=20`);
  });

  it('adds no "?" when there are no params', async () => {
    fakeFetch.mockResolvedValue(jsonResponse({ data: [], count: 0 }));

    await api()('meal', { query: {} });

    expect(lastCall().url).toBe(`${BASE_URL}/meal`);
  });
});
