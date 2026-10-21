import { ESignOutReason, endSession } from '@/app/auth/sign-out';
import { IQueryParams, TApiResult } from '@/app/utils/interfaces';

import { API_URL } from '@/app/utils/config';
import { buildQueryParams } from '@/app/utils/helpers';
import { copy } from '@/app/copy';
import { fetchAuthSession } from 'aws-amplify/auth';

export type THttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface IApiDeps {
  baseUrl: string;
  /** The access token: Amplify's (refreshed when due) in the app, fixed in tests. */
  getToken: () => Promise<string | undefined>;
  /** The session is over: no token, or the API rejected it. */
  onUnauthorized: () => void;
  fetch?: typeof fetch;
}

export interface IApiOptions {
  method?: THttpMethod;
  body?: unknown;
  query?: IQueryParams;
}

const HTTP_UNAUTHORIZED = 401;
const NETWORK_ERROR_STATUS = 0;

const unauthorized = {
  ok: false,
  status: HTTP_UNAUTHORIZED,
  message: copy.auth.sessionExpired,
} as const;

/**
 * The only way the app talks to the API. Never throws for API failures: they
 * come back as `{ ok: false, status, message }`. A missing or rejected token
 * also ends the session (Amplify has already tried a refresh).
 */
export const createApi = ({
  baseUrl,
  getToken,
  onUnauthorized,
  fetch: fetchFn = (...args) => fetch(...args),
}: IApiDeps) =>
  async function api<T = void>(
    path: string,
    { method = 'GET', body, query }: IApiOptions = {},
  ): Promise<TApiResult<T>> {
    const token = await getToken();
    if (!token) {
      onUnauthorized();
      return unauthorized;
    }

    let res: Response;
    try {
      res = await fetchFn(buildUrl(baseUrl, path, query), {
        method,
        headers: buildHeaders(token, body),
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        status: NETWORK_ERROR_STATUS,
        message: 'Could not reach the server',
      };
    }

    if (res.status === HTTP_UNAUTHORIZED) {
      onUnauthorized();
      return unauthorized;
    }

    if (!res.ok) {
      return { ok: false, status: res.status, message: await readError(res) };
    }

    // 204 and other empty bodies carry no data.
    const text = await res.text();
    return { ok: true, data: (text ? JSON.parse(text) : undefined) as T };
  };

/** For queries: returns the data, or throws so an error boundary renders. */
export const unwrap = <T>(result: TApiResult<T>): T => {
  if (!result.ok) throw new Error(result.message);
  return result.data;
};

const buildUrl = (baseUrl: string, path: string, query?: IQueryParams) => {
  const search = query ? buildQueryParams(query) : '';
  return `${baseUrl}/${path}${search ? `?${search}` : ''}`;
};

const buildHeaders = (token: string, body: unknown) => {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return headers;
};

const readError = async (res: Response): Promise<string> => {
  const fallback = `${res.status} ${res.statusText}`.trim();

  try {
    const { message, error } = await res.json();

    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string' && message) return message;
    if (typeof error === 'string' && error) return error;
  } catch {
    // Not JSON: fall back to the status line.
  }

  return fallback;
};

const accessToken = async () => {
  try {
    const { tokens } = await fetchAuthSession();
    return tokens?.accessToken.toString();
  } catch {
    return undefined;
  }
};

export const api = createApi({
  baseUrl: API_URL,
  getToken: accessToken,
  onUnauthorized: () => void endSession(ESignOutReason.EXPIRED),
});
