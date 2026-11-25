// Concurrent authorized requests may share a verified source read. This is not
// a cache: after completion every later request checks Drive again.
export function createInFlightReads<K, V>() {
  const reads = new Map<K, Promise<V>>();
  return (key: K, load: () => Promise<V>): Promise<V> => {
    const existing = reads.get(key);
    if (existing) return existing;
    const task = Promise.resolve().then(load).finally(() => reads.delete(key));
    reads.set(key, task);
    return task;
  };
}
