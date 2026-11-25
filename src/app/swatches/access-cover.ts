// The login is successful as soon as the bounded metadata line arrives. A
// missing, short or invalid image affects only its speculative delivery.
export async function readAccessCover(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Missing access response");
  let buffer = new Uint8Array(0);
  async function line(limit: number) {
    for (;;) {
      const end = buffer.indexOf(10);
      if (end >= 0 && end <= limit) {
        const value = new TextDecoder().decode(buffer.subarray(0, end));
        buffer = buffer.subarray(end + 1);
        return value;
      }
      if (buffer.length > limit) throw new Error("Invalid access frame");
      const { done, value } = await reader!.read();
      if (done) throw new Error("Short access frame");
      const joined = new Uint8Array(buffer.length + value.length);
      joined.set(buffer);
      joined.set(value, buffer.length);
      buffer = joined;
    }
  }
  try {
    const result = JSON.parse(await line(2048));
    const image = (async (): Promise<Blob | undefined> => {
      try {
        const size = Number(await line(8));
        if (!Number.isSafeInteger(size) || size < 1 || size > 768 * 1024) return;
        const bytes = new Uint8Array(size);
        let used = buffer.length;
        if (used > size) return;
        bytes.set(buffer);
        while (used < size) {
          const part = await reader.read();
          if (part.done || used + part.value.length > size) return;
          bytes.set(part.value, used);
          used += part.value.length;
        }
        // Read the closing frame too. Canceling immediately after the last
        // image byte makes Chrome report a successfully delivered login as aborted.
        const end = await reader.read();
        return end.done ? new Blob([bytes]) : undefined;
      } catch { return; }
      finally { await reader.cancel().catch(() => undefined); }
    })();
    return { result, image, cancel: () => { void reader.cancel().catch(() => undefined); } };
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
}
