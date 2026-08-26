import { api } from "./api";
import type { Location } from "../types/Location";
import type { Measurement } from "../types/Measurement";

// Единая офлайн-очередь для локаций и замеров. Изменения копятся в IndexedDB,
// пока нет сети или пользователь не залогинен, а затем отправляются одним
// запросом на /Sync/push, как только соединение появляется снова.

const DB = "eco-monitor-offline";
const LOCATIONS = "locations";
const MEASUREMENTS = "measurements";
const QUEUE = "queue";

type PendingChange = {
  clientId: string;
  entityType: 0 | 1; // 0 = Location, 1 = Measurement
  operation: 0 | 1 | 2; // 0 = Create, 1 = Change, 2 = Delete
  updatedAt: string;

  // Location fields
  name?: string;
  latitude?: number;
  longitude?: number;

  // Measurement fields
  locationClientId?: string;
  sensorName?: string;
  comment?: string | null;
  o2?: number | null;
  co?: number | null;
  so2?: number | null;
  no?: number | null;
  ch?: number | null;
  co2?: number | null;
  no2?: number | null;
  h2co?: number | null;
  pm25?: number | null;
  pm10?: number | null;
  tvoc?: number | null;
  windSpeed?: number | null;
  windDirection?: string | null;
  measurementTime?: string | null;
  humidity?: number | null;
  atmosphericPressure?: number | null;
  precipitation?: number | null;
  precipitationPerHour?: number | null;
  airTemperature?: number | null;
};

export interface MeasurementPayload {
  sensorName: string;
  comment: string | null;
  o2: number | null;
  co: number | null;
  so2: number | null;
  no: number | null;
  ch: number | null;
  co2: number | null;
  no2: number | null;
  h2co: number | null;
  pm25: number | null;
  pm10: number | null;
  tvoc: number | null;
  windSpeed: number | null;
  windDirection: string | null;
  measurementTime: string | null;
  humidity: number | null;
  atmosphericPressure: number | null;
  precipitation: number | null;
  precipitationPerHour: number | null;
  airTemperature: number | null;
}

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(LOCATIONS)) db.createObjectStore(LOCATIONS, { keyPath: "clientId" });
      if (!db.objectStoreNames.contains(MEASUREMENTS)) db.createObjectStore(MEASUREMENTS, { keyPath: "clientId" });
      if (!db.objectStoreNames.contains(QUEUE)) db.createObjectStore(QUEUE, { keyPath: "clientId" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function readAll<T>(store: string): Promise<T[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const r = db.transaction(store, "readonly").objectStore(store).getAll();
    r.onsuccess = () => resolve(r.result as T[]);
    r.onerror = () => reject(r.error);
  });
}
async function getOne<T>(store: string, key: string): Promise<T | undefined> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const r = db.transaction(store, "readonly").objectStore(store).get(key);
    r.onsuccess = () => resolve(r.result as T | undefined);
    r.onerror = () => reject(r.error);
  });
}
async function put(store: string, value: unknown) {
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const r = db.transaction(store, "readwrite").objectStore(store).put(value);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}
async function remove(store: string, key: string) {
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const r = db.transaction(store, "readwrite").objectStore(store).delete(key);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}
const uuid = () => crypto.randomUUID();

// Складывает новое изменение в очередь. Если для этого clientId уже лежит
// ещё не отправленное создание (operation 0), оно просто обновляется новыми
// данными — так на сервер в итоге уйдёт один запрос "создать" с финальными
// значениями. Удаление ещё не отправленного создания вообще ничего не
// отправляет: сущность никогда не существовала на сервере.
async function enqueueChange(clientId: string, patch: Omit<PendingChange, "clientId">): Promise<void> {
  const existing = await getOne<PendingChange>(QUEUE, clientId);
  if (patch.operation === 2 && existing?.operation === 0) {
    await remove(QUEUE, clientId);
    return;
  }
  const operation = existing?.operation === 0 ? 0 : patch.operation;
  await put(QUEUE, { ...existing, ...patch, clientId, operation } satisfies PendingChange);
}

// --- Локации ---------------------------------------------------------------

export async function cachedLocations() {
  return (await readAll<Location>(LOCATIONS)).filter((x) => !x.deletedAt);
}
async function cacheLocations(locations: Location[]) {
  await Promise.all(locations.map((location) => put(LOCATIONS, { ...location, clientId: location.clientId ?? String(location.id) })));
}

export async function loadLocations(): Promise<Location[]> {
  try {
    const response = await api.get<Location[]>("/Location");
    await cacheLocations(response.data);
    return response.data;
  } catch {
    return cachedLocations();
  }
}

export async function createLocation(name: string, latitude: number, longitude: number, userId?: number): Promise<Location> {
  const clientId = uuid();
  const updatedAt = new Date().toISOString();
  // userId проставляется локально, чтобы владелец сразу видел кнопки
  // редактирования/удаления, не дожидаясь синхронизации с сервером.
  const local: Location = { id: -Date.now(), clientId, name, latitude, longitude, updatedAt, userId };
  await put(LOCATIONS, local);
  await enqueueChange(clientId, { entityType: 0, operation: 0, updatedAt, name, latitude, longitude });
  await synchronize();
  return (await readAll<Location>(LOCATIONS)).find((item) => item.clientId === clientId) ?? local;
}

export async function updateLocation(location: Location, name: string, latitude: number, longitude: number): Promise<Location> {
  const clientId = location.clientId ?? String(location.id);
  const updatedAt = new Date().toISOString();
  const local: Location = { ...location, clientId, name, latitude, longitude, updatedAt };
  await put(LOCATIONS, local);
  await enqueueChange(clientId, { entityType: 0, operation: 1, updatedAt, name, latitude, longitude });
  await synchronize();
  return (await readAll<Location>(LOCATIONS)).find((item) => item.clientId === clientId) ?? local;
}

export async function deleteLocation(location: Location): Promise<void> {
  const clientId = location.clientId ?? String(location.id);
  const updatedAt = new Date().toISOString();

  await remove(LOCATIONS, clientId);

  // Заодно убираем из локального кэша все замеры этой локации.
  const measurements = await readAll<Measurement>(MEASUREMENTS);
  await Promise.all(
    measurements
      .filter((m) => (m.locationClientId ?? String(m.locationId)) === clientId)
      .map((m) => remove(MEASUREMENTS, m.clientId ?? String(m.id)))
  );

  await enqueueChange(clientId, { entityType: 0, operation: 2, updatedAt });
  await synchronize();
}

// --- Замеры ------------------------------------------------------------------

function payloadToLocalFields(payload: MeasurementPayload) {
  return {
    sensorName: payload.sensorName,
    comment: payload.comment,
    o2: payload.o2,
    co: payload.co,
    sO2: payload.so2,
    no: payload.no,
    ch: payload.ch,
    cO2: payload.co2,
    nO2: payload.no2,
    h2CO: payload.h2co,
    pM25: payload.pm25,
    pM10: payload.pm10,
    tvoc: payload.tvoc,
    windSpeed: payload.windSpeed,
    windDirection: payload.windDirection,
    measurementTime: payload.measurementTime,
    humidity: payload.humidity,
    atmosphericPressure: payload.atmosphericPressure,
    precipitation: payload.precipitation,
    precipitationPerHour: payload.precipitationPerHour,
    airTemperature: payload.airTemperature,
  };
}

export async function cachedMeasurements(location: Location): Promise<Measurement[]> {
  const locationKey = location.clientId ?? String(location.id);
  return (await readAll<Measurement>(MEASUREMENTS)).filter(
    (m) => !m.deletedAt && (m.locationClientId ?? String(m.locationId)) === locationKey
  );
}
async function cacheMeasurements(location: Location, measurements: Measurement[]) {
  const locationClientId = location.clientId ?? String(location.id);
  await Promise.all(
    measurements.map((m) => put(MEASUREMENTS, { ...m, clientId: m.clientId ?? String(m.id), locationClientId }))
  );
}

export async function loadMeasurements(location: Location): Promise<Measurement[]> {
  try {
    const response = await api.get<Measurement[]>(`/Measurement/location/${location.id}`);
    await cacheMeasurements(location, response.data);
    return response.data;
  } catch {
    return cachedMeasurements(location);
  }
}

export async function createMeasurement(location: Location, payload: MeasurementPayload): Promise<Measurement> {
  const clientId = uuid();
  const updatedAt = new Date().toISOString();
  const locationClientId = location.clientId ?? String(location.id);
  const local: Measurement = {
    id: -Date.now(),
    clientId,
    locationId: location.id,
    locationClientId,
    creationDate: updatedAt,
    updatedAt,
    ...payloadToLocalFields(payload),
  };
  await put(MEASUREMENTS, local);
  await enqueueChange(clientId, { entityType: 1, operation: 0, updatedAt, locationClientId, ...payload });
  await synchronize();
  return (await readAll<Measurement>(MEASUREMENTS)).find((item) => item.clientId === clientId) ?? local;
}

export async function updateMeasurement(location: Location, measurement: Measurement, payload: MeasurementPayload): Promise<Measurement> {
  const clientId = measurement.clientId ?? String(measurement.id);
  const updatedAt = new Date().toISOString();
  const locationClientId = location.clientId ?? String(location.id);
  const local: Measurement = { ...measurement, clientId, locationClientId, updatedAt, ...payloadToLocalFields(payload) };
  await put(MEASUREMENTS, local);
  await enqueueChange(clientId, { entityType: 1, operation: 1, updatedAt, locationClientId, ...payload });
  await synchronize();
  return (await readAll<Measurement>(MEASUREMENTS)).find((item) => item.clientId === clientId) ?? local;
}

export async function deleteMeasurement(measurement: Measurement): Promise<void> {
  const clientId = measurement.clientId ?? String(measurement.id);
  const updatedAt = new Date().toISOString();
  await remove(MEASUREMENTS, clientId);
  await enqueueChange(clientId, { entityType: 1, operation: 2, updatedAt });
  await synchronize();
}

// --- Синхронизация -----------------------------------------------------------

async function cacheSyncedMeasurements(locations: Location[], measurements: Measurement[]) {
  if (!measurements.length) return;
  const idToClientId = new Map(locations.map((l) => [l.id, l.clientId]));
  const existing = await readAll<Measurement>(MEASUREMENTS);
  const existingByClientId = new Map(existing.map((m) => [m.clientId ?? String(m.id), m]));
  await Promise.all(
    measurements.map((m) => {
      const clientId = m.clientId ?? String(m.id);
      const locationClientId =
        idToClientId.get(m.locationId) ?? existingByClientId.get(clientId)?.locationClientId ?? String(m.locationId);
      return put(MEASUREMENTS, { ...m, clientId, locationClientId });
    })
  );
}

export async function synchronize(): Promise<void> {
  if (!navigator.onLine || !sessionStorage.getItem("token")) return;
  const changes = await readAll<PendingChange>(QUEUE);
  if (!changes.length) return;
  try {
    const response = await api.post<{ locations: Location[]; measurements: Measurement[] }>("/Sync/push", { changes });
    await cacheLocations(response.data.locations ?? []);
    await cacheSyncedMeasurements(response.data.locations ?? [], response.data.measurements ?? []);
    await Promise.all(changes.map((change) => remove(QUEUE, change.clientId)));
  } catch (error) {
    // DevTools' offline mode may reject a request before navigator.onLine is
    // updated. Keep the queue intact; the next online event retries it.
    console.info("Синхронизация будет повторена при подключении к сети.", error);
  }
}

export function startSync(onChange: () => void) {
  const sync = async () => {
    await synchronize();
    onChange();
  };
  window.addEventListener("online", sync);
  void sync();
  return () => window.removeEventListener("online", sync);
}
