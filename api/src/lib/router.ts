import type { Logger } from '@aws-lambda-powertools/logger';
import { type ApiEvent, type ApiResult, errorResult, json, ownerOf } from './http';

export interface Request {
  event: ApiEvent;
  owner: string;
  params: Record<string, string>;
}

export type Route = (request: Request) => Promise<ApiResult>;

/**
 * One Lambda per resource: dispatches `'<METHOD> /path/:param'` routes, first match wins, so list
 * literal segments (`/options`) before parameters (`/:id`). Unknown routes get NestJS's 404.
 */
export function router(routes: Record<string, Route>, logger: Logger) {
  const table = Object.entries(routes).map(([key, route]) => {
    const [method, path = ''] = key.split(' ');
    return { method, segments: split(path), route };
  });

  return async (event: ApiEvent): Promise<ApiResult> => {
    const method = event.requestContext.http.method;
    const segments = split(event.rawPath);
    try {
      for (const entry of table) {
        if (entry.method !== method) continue;
        const params = match(entry.segments, segments);
        if (params) return await entry.route({ event, owner: ownerOf(event), params });
      }
      return json(404, { statusCode: 404, message: `Cannot ${method} ${event.rawPath}`, error: 'Not Found' });
    } catch (error) {
      return errorResult(error, logger);
    }
  };
}

function split(path: string): string[] {
  return path.split('/').filter(Boolean);
}

function match(pattern: string[], segments: string[]): Record<string, string> | null {
  if (pattern.length !== segments.length) return null;
  const params: Record<string, string> = {};
  for (const [i, part] of pattern.entries()) {
    const segment = segments[i]!;
    if (part.startsWith(':')) params[part.slice(1)] = decodeURIComponent(segment);
    else if (part !== segment) return null;
  }
  return params;
}
