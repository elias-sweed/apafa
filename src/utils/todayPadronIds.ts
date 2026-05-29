const STORAGE_KEY = 'apafa_padron_ids_hoy';

type TodayStore = {
  date: string;
  ids: number[];
};

function getLocalDateKey(): string {
  return new Date().toLocaleDateString('en-CA');
}

function readStore(): TodayStore {
  const today = getLocalDateKey();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: today, ids: [] };
    const parsed = JSON.parse(raw) as TodayStore;
    if (parsed.date !== today) return { date: today, ids: [] };
    return { date: today, ids: Array.isArray(parsed.ids) ? parsed.ids : [] };
  } catch {
    return { date: today, ids: [] };
  }
}

export function registerTodayPadronIds(ids: number[]) {
  const valid = ids.filter((id) => Number.isFinite(id));
  if (valid.length === 0) return;

  const store = readStore();
  store.ids = [...new Set([...store.ids, ...valid])];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getTodayPadronIds(): number[] {
  return readStore().ids;
}

export function getTodayPadronCount(): number {
  return getTodayPadronIds().length;
}

export function unregisterTodayPadronIds(ids: number[]) {
  const remove = new Set(ids.filter((id) => Number.isFinite(id)));
  if (remove.size === 0) return;

  const store = readStore();
  store.ids = store.ids.filter((id) => !remove.has(id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function clearTodayPadronIds() {
  localStorage.removeItem(STORAGE_KEY);
}
