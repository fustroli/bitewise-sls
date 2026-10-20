import { TransactWriteCommand, type TransactWriteCommandInput } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLE_NAME } from './ddb';
import { conflict } from './http';
import { batchGetOwned, itemKey, type Kind, nameSentinelKey, type OwnedItem, ownerKey, sortItems } from './owned';

// TransactWriteItems building blocks for Owned resources. A transaction takes at most 100 items,
// which is what caps a Meal / Meal plan at 48 members (docs/plan.md, Composition).

export type TransactItem = NonNullable<TransactWriteCommandInput['TransactItems']>[number];

export function transact(items: TransactItem[]) {
  return ddb.send(new TransactWriteCommand({ TransactItems: items }));
}

export function putNew(item: object): TransactItem {
  return { Put: { TableName: TABLE_NAME, Item: { ...item }, ConditionExpression: 'attribute_not_exists(PK)' } };
}

/** The name sentinel: fails the transaction when the Owner already has this name (case/accents ignored). */
export function claimName(owner: string, kind: Kind, name: string, id: string): TransactItem {
  return putNew({ PK: ownerKey(owner), SK: nameSentinelKey(kind, name), id });
}

export function releaseName(owner: string, kind: Kind, name: string): TransactItem {
  return { Delete: { TableName: TABLE_NAME, Key: { PK: ownerKey(owner), SK: nameSentinelKey(kind, name) } } };
}

/**
 * SETs only these fields and `updatedAt`, so attributes written by others (usedBy) survive.
 * With `expectUpdatedAt`, fails if the item changed since it was read.
 */
export function setFields(
  item: Pick<OwnedItem, 'PK' | 'SK'>,
  fields: Record<string, unknown>,
  now: string,
  expectUpdatedAt?: string,
) {
  const entries = Object.entries(fields).filter(([, value]) => value !== undefined);
  return {
    TableName: TABLE_NAME,
    Key: { PK: item.PK, SK: item.SK },
    UpdateExpression: `SET ${[...entries.map((_, i) => `#f${i} = :v${i}`), '#updatedAt = :now'].join(', ')}`,
    ConditionExpression: expectUpdatedAt ? 'attribute_exists(PK) AND #updatedAt = :prev' : 'attribute_exists(PK)',
    ExpressionAttributeNames: { ...Object.fromEntries(entries.map(([key], i) => [`#f${i}`, key])), '#updatedAt': 'updatedAt' },
    ExpressionAttributeValues: {
      ...Object.fromEntries(entries.map(([, value], i) => [`:v${i}`, value])),
      ':now': now,
      ...(expectUpdatedAt ? { ':prev': expectUpdatedAt } : {}),
    },
  };
}

/**
 * Adds or removes `parentId` in each member's `usedBy` set. Fails when a member doesn't exist, so a
 * Meal can't point at a deleted Ingredient. DynamoDB drops a set once it's empty.
 */
export function updateUsedBy(owner: string, kind: Kind, memberIds: Iterable<string>, parentId: string, action: 'ADD' | 'DELETE'): TransactItem[] {
  return [...memberIds].map((id) => ({
    Update: {
      TableName: TABLE_NAME,
      Key: { PK: ownerKey(owner), SK: itemKey(kind, id) },
      UpdateExpression: `${action} #usedBy :parent`,
      ConditionExpression: 'attribute_exists(PK)',
      ExpressionAttributeNames: { '#usedBy': 'usedBy' },
      ExpressionAttributeValues: { ':parent': new Set([parentId]) },
    },
  }));
}

/** "You already have an ingredient named X." */
export function nameTaken(label: string, name: string) {
  const article = /^[aeiou]/i.test(label) ? 'an' : 'a';
  return conflict(`You already have ${article} ${label} named ${name}.`);
}

/** 409 naming the parents that still use the item, e.g. "This ingredient is used in meals: A, B." */
export async function assertUnused(owner: string, item: OwnedItem, parentKind: Kind, message: string): Promise<void> {
  if (!item.usedBy?.size) return;
  const parents = await batchGetOwned<{ id: string; name: string }>(owner, parentKind, [...item.usedBy], ['id', 'name']);
  throw conflict(`${message} ${sortItems(parents, (parent) => parent.id).map((parent) => parent.name).join(', ')}.`);
}
