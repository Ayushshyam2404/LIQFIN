/**
 * Generic offline-first CRUD helpers for the Zustand finance store.
 * Eliminates the repeated pattern of:
 *   1. Generate tempId → save to Dexie → update Zustand state
 *   2. Try API call online → swap temp record with server record
 *   3. On failure, push to syncQueue for later replay
 *
 * Each resource (cards, goals, budgets) follows the exact same flow.
 */
import { api } from '../services/api';
import { db } from '../services/db';
import type { Table } from 'dexie';

/** Generate a local temporary ID */
export const generateTempId = (): string =>
  'local_' + Math.random().toString(36).substring(2);

/** Check whether an ID is a local (offline) temp ID */
export const isLocalId = (id: string): boolean => id.startsWith('local_');

interface CreateOptions<T> {
  table: Table<T>;
  apiPath: string;
  type: 'expense' | 'card' | 'budget' | 'goal';
  payload: Omit<T, 'id' | '_id'>;
  responseKey: string;
  isOnline: () => boolean;
}

/**
 * Perform an offline-first create operation.
 * Returns the saved record (local or remote).
 */
export async function offlineCreate<T extends { id?: string; _id?: string; isOfflinePending?: boolean }>({
  table,
  apiPath,
  type,
  payload,
  responseKey,
  isOnline
}: CreateOptions<T>): Promise<{ success: boolean; record: T }> {
  const tempId = generateTempId();
  const localRecord = { ...payload, id: tempId, isOfflinePending: true } as unknown as T;

  await table.add(localRecord);

  if (isOnline()) {
    try {
      const res = await api.post(apiPath, payload);
      if (res.data.success) {
        await table.delete(tempId);
        const saved = { ...res.data[responseKey], id: res.data[responseKey]._id } as T;
        await table.add(saved);
        return { success: true, record: saved };
      }
    } catch {
      // Fall through to queue
    }
  }

  await db.syncQueue.add({
    action: 'create',
    type,
    payload: { ...payload, tempId },
    createdAt: Date.now()
  });

  return { success: true, record: localRecord };
}

interface EditOptions<T> {
  table: Table<T>;
  apiPath: string;
  type: 'expense' | 'card' | 'budget' | 'goal';
  id: string;
  updates: Partial<T>;
  isOnline: () => boolean;
}

/**
 * Perform an offline-first update operation.
 */
export async function offlineEdit<T extends { id?: string; _id?: string }>({
  table,
  apiPath,
  type,
  id,
  updates,
  isOnline
}: EditOptions<T>): Promise<{ success: boolean; record: T | null }> {
  const existing = await table.get(id);
  if (!existing) return { success: false, record: null };

  const updated = { ...existing, ...updates } as T;
  await table.put(updated);

  if (isOnline() && !isLocalId(id)) {
    try {
      await api.put(`${apiPath}/${id}`, updates);
      return { success: true, record: updated };
    } catch {
      // Fall through to queue
    }
  }

  if (!isLocalId(id)) {
    await db.syncQueue.add({
      action: 'update',
      type,
      targetId: id,
      payload: updates,
      createdAt: Date.now()
    });
  }

  return { success: true, record: updated };
}

interface DeleteOptions<T> {
  table: Table<T>;
  apiPath: string;
  type: 'expense' | 'card' | 'budget' | 'goal';
  id: string;
  isOnline: () => boolean;
}

/**
 * Perform an offline-first delete operation.
 */
export async function offlineDelete<T>({
  table,
  apiPath,
  type,
  id,
  isOnline
}: DeleteOptions<T>): Promise<boolean> {
  await table.delete(id);

  if (isOnline() && !isLocalId(id)) {
    try {
      await api.delete(`${apiPath}/${id}`);
      return true;
    } catch {
      // Fall through to queue
    }
  }

  if (!isLocalId(id)) {
    await db.syncQueue.add({
      action: 'delete',
      type,
      targetId: id,
      createdAt: Date.now()
    });
  }

  return true;
}

interface FetchOptions<T> {
  table: Table<T>;
  apiPath: string;
  responseKey: string;
  isOnline: () => boolean;
  params?: Record<string, string>;
}

/**
 * Perform an offline-first fetch (list) operation.
 * Fetches from API if online, falls back to Dexie.
 */
export async function offlineFetch<T extends { _id?: string; id?: string }>({
  table,
  apiPath,
  responseKey,
  isOnline,
  params
}: FetchOptions<T>): Promise<T[]> {
  if (isOnline()) {
    try {
      const res = await api.get(apiPath, { params });
      if (res.data.success) {
        const mapped = res.data[responseKey].map((item: any) => ({ ...item, id: item._id }));
        await table.clear();
        for (const item of mapped) {
          await table.put(item);
        }
        return mapped;
      }
    } catch {
      // Fall through to local
    }
  }

  return table.toArray();
}
