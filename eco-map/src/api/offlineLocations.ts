import { api } from "./api";
import type { Location } from "../types/Location";

type PendingChange = { clientId: string; entityType: 0; operation: 0 | 1 | 2; updatedAt: string; name?: string; latitude?: number; longitude?: number };
const DB = "eco-monitor-offline";
const STORE = "locations";
const QUEUE = "location-queue";

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => { const db = request.result; db.createObjectStore(STORE, { keyPath: "clientId" }); db.createObjectStore(QUEUE, { keyPath: "clientId" }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function readAll<T>(store: string): Promise<T[]> { const db = await database(); return new Promise((resolve, reject) => { const r = db.transaction(store, "readonly").objectStore(store).getAll(); r.onsuccess = () => resolve(r.result as T[]); r.onerror = () => reject(r.error); }); }
async function put(store: string, value: unknown) { const db = await database(); return new Promise<void>((resolve, reject) => { const r = db.transaction(store, "readwrite").objectStore(store).put(value); r.onsuccess = () => resolve(); r.onerror = () => reject(r.error); }); }
async function remove(store: string, key: string) { const db = await database(); return new Promise<void>((resolve, reject) => { const r = db.transaction(store, "readwrite").objectStore(store).delete(key); r.onsuccess = () => resolve(); r.onerror = () => reject(r.error); }); }
const uuid = () => crypto.randomUUID();

export async function cachedLocations() { return (await readAll<Location>(STORE)).filter(x => !x.deletedAt); }
async function cache(locations: Location[]) { await Promise.all(locations.map(location => put(STORE, { ...location, clientId: location.clientId ?? String(location.id) }))); }

export async function loadLocations(): Promise<Location[]> {
  try { const response = await api.get<Location[]>("/Location"); await cache(response.data); return response.data; }
  catch { return cachedLocations(); }
}

export async function createLocation(name: string, latitude: number, longitude: number): Promise<Location> {
  const clientId = uuid(); const updatedAt = new Date().toISOString();
  const local: Location = { id: -Date.now(), clientId, name, latitude, longitude, updatedAt };
  await put(STORE, local);
  await put(QUEUE, { clientId, entityType: 0, operation: 0, updatedAt, name, latitude, longitude } satisfies PendingChange);
  await synchronize();
  return (await readAll<Location>(STORE)).find(item => item.clientId === clientId) ?? local;
}

export async function synchronize(): Promise<void> {
  if (!navigator.onLine || !localStorage.getItem("token")) return;
  const changes = await readAll<PendingChange>(QUEUE);
  if (!changes.length) return;
  try {
    const response = await api.post<{ locations: Location[] }>("/Sync/push", { changes });
    await cache(response.data.locations);
    await Promise.all(changes.map(change => remove(QUEUE, change.clientId)));
  } catch (error) {
    // DevTools' offline mode may reject a request before navigator.onLine is
    // updated. Keep the queue intact; the next online event retries it.
    console.info("Синхронизация будет повторена при подключении к сети.", error);
  }
}

export function startSync(onChange: () => void) {
  const sync = async () => { await synchronize(); onChange(); };
  window.addEventListener("online", sync);
  void sync();
  return () => window.removeEventListener("online", sync);
}
