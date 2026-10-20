import { createHash } from 'node:crypto';
import { TransactionCanceledException } from '@aws-sdk/client-dynamodb';
import { BatchGetCommand, type BatchGetCommandOutput, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DEFAULT_PAGE_LIMIT, type OrderDirection } from '@bitewise/shared';
import { ddb, TABLE_NAME } from './ddb';
import { notFound } from './http';

// Owned-resource access on the single table (docs/plan.md, Data model). Every key starts with the
// Owner's partition, so another Owner's id is simply not found.

/** Sort key prefix per Owned resource. */
export type Kind = 'ING' | 'MEAL' | 'PLAN';

export interface OwnedItem {
  PK: string;
  SK: string;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  // Ids of the parents using this item (Meals for an Ingredient, Meal plans for a Meal)
  usedBy?: Set<string>;
}

export const ownerKey = (owner: string) => `USER#${owner}`;
export const itemKey = (kind: Kind, id: string) => `${kind}#${id}`;
export const nameSentinelKey = (kind: Kind, name: string) => `NAME#${kind}#${nameKey(name)}`;

/**
 * Names compare like the EC2 app's utf8mb4_0900_ai_ci column: case- and accent-insensitive.
 * Very long multi-byte names are hashed to stay under DynamoDB's 1024-byte sort key limit.
 */
export function nameKey(name: string): string {
  const key = fold(name).trim();
  return Buffer.byteLength(key) > 900 ? `sha256:${createHash('sha256').update(key).digest('hex')}` : key;
}

/** Lowercase without accents, for comparing and searching names. */
export function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/** The `#n` placeholders of a projection: several attribute names (e.g. `name`) are reserved words. */
function projection(attributes?: readonly string[]) {
  if (!attributes) return {};
  return {
    ProjectionExpression: attributes.map((_, i) => `#p${i}`).join(', '),
    ExpressionAttributeNames: Object.fromEntries(attributes.map((attribute, i) => [`#p${i}`, attribute])),
  };
}

/** Every item of one kind the Owner has. A User's data is small, so lists filter in memory. */
export async function queryAll<T extends object>(owner: string, kind: Kind, attributes?: readonly string[]): Promise<T[]> {
  const items: T[] = [];
  let start: Record<string, unknown> | undefined;
  do {
    const { ExpressionAttributeNames, ProjectionExpression } = projection(attributes);
    const page = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :prefix)',
        ExpressionAttributeNames: { '#pk': 'PK', '#sk': 'SK', ...ExpressionAttributeNames },
        ExpressionAttributeValues: { ':pk': ownerKey(owner), ':prefix': `${kind}#` },
        ProjectionExpression,
        ExclusiveStartKey: start,
      }),
    );
    items.push(...((page.Items ?? []) as T[]));
    start = page.LastEvaluatedKey;
  } while (start);
  return items;
}

export async function getOwned<T extends OwnedItem>(owner: string, kind: Kind, id: string, label: string): Promise<T> {
  const { Item } = await ddb.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { PK: ownerKey(owner), SK: itemKey(kind, id) } }),
  );
  if (!Item) throw notFound(`No ${label} found with the provided id.`);
  return Item as T;
}

/** The Owner's items with these ids; unknown or foreign ids are left out. */
export async function batchGetOwned<T extends object>(
  owner: string,
  kind: Kind,
  ids: readonly string[],
  attributes?: readonly string[],
): Promise<T[]> {
  const unique = [...new Set(ids)];
  const items: T[] = [];
  // BatchGetItem takes at most 100 keys per call
  for (let i = 0; i < unique.length; i += 100) {
    let keys: Record<string, unknown>[] | undefined = unique
      .slice(i, i + 100)
      .map((id) => ({ PK: ownerKey(owner), SK: itemKey(kind, id) }));
    for (let attempt = 0; keys?.length; attempt++) {
      if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 50 * 2 ** attempt));
      const result: BatchGetCommandOutput = await ddb.send(
        new BatchGetCommand({ RequestItems: { [TABLE_NAME]: { Keys: keys, ...projection(attributes) } } }),
      );
      items.push(...((result.Responses?.[TABLE_NAME] ?? []) as T[]));
      // Throttled keys come back unprocessed; retry them with backoff
      keys = result.UnprocessedKeys?.[TABLE_NAME]?.Keys;
    }
  }
  return items;
}

// List requests sort by the EC2 app's response names; items store createdAt/updatedAt.
export const TIMESTAMP_SORT_FIELDS = { createTimeStamp: 'createdAt', updateTimeStamp: 'updatedAt' } as const;

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

function compare(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return collator.compare(String(a ?? ''), String(b ?? ''));
}

/** Sorts by `value`, ties by id (creation order). */
export function sortItems<T extends { id: string }>(items: T[], value: (item: T) => unknown, direction: OrderDirection = 'asc'): T[] {
  const sign = direction === 'desc' ? -1 : 1;
  return items.sort((a, b) => sign * compare(value(a), value(b)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export interface ListOptions<T> {
  limit?: number;
  offset?: number;
  search?: string;
  // Set when the client asked for specific ids: every match comes back, limit and offset are ignored
  ids?: string[];
  orderDirection?: OrderDirection;
  // Value to sort by; undefined keeps creation order
  sortBy?: (item: T) => unknown;
}

/** `{ data, count }` of a list request: accent-insensitive name search, sort, then a page. */
export function listPage<T extends { id: string; name: string }>(items: T[], options: ListOptions<T>) {
  const term = options.search ? fold(options.search) : undefined;
  const matches = term ? items.filter((item) => fold(item.name).includes(term)) : items;
  const sorted = sortItems(matches, options.sortBy ?? ((item) => item.id), options.orderDirection);
  const offset = options.offset ?? 0;
  const data = options.ids ? sorted : sorted.slice(offset, offset + (options.limit ?? DEFAULT_PAGE_LIMIT));
  return { data, count: matches.length };
}

/**
 * Per-item cancellation reasons of a failed TransactWriteItems (`'ConditionalCheckFailed'`,
 * `'None'`, ...), in the order the items were sent; null for any other error.
 */
export function cancellationReasons(error: unknown): (string | undefined)[] | null {
  if (!(error instanceof TransactionCanceledException)) return null;
  return (error.CancellationReasons ?? []).map((reason) => reason.Code);
}
