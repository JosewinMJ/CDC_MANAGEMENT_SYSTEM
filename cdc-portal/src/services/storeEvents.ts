// In-memory pub/sub notifications so mounted portal views refresh from the Laravel 12 MySQL API after mutations.
type Listener = () => void;
const listeners: Record<string, Listener[]> = {};

export function subscribeToStore(key: string, callback: Listener): () => void {
  if (!listeners[key]) listeners[key] = [];
  listeners[key].push(callback);
  return () => {
    listeners[key] = listeners[key].filter(l => l !== callback);
  };
}

export function notifyStore(key: string): void {
  (listeners[key] ?? []).forEach(fn => fn());
}
