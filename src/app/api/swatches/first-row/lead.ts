import { driveListThumbnail } from "../design/drive-list-thumbnails";
import { swatchPhotoResponse } from "../design/photos";

// Only call with a URL selected from the immutable design by rowImages().
export function coverResponse(src: string) {
  const url = new URL(src, "http://localhost");
  const sku = url.searchParams.get("sku");
  return url.pathname === "/api/swatches/thumbnail"
    ? driveListThumbnail(sku) : swatchPhotoResponse(sku);
}

export function imageSize(response: Response) {
  const size = Number(response.headers.get("content-length"));
  return response.ok && ["image/webp", "image/png"].includes(response.headers.get("content-type") ?? "")
    && Number.isSafeInteger(size) && size > 0 && size <= 768 * 1024 ? size : 0;
}

// First line confirms access. The second line gives the exact length of the
// independently verified lead, followed by its bytes. Neither waits for the tail.
export function leadStream(metadata: { welcomeName: string; visitKey: string; images: string[] }) {
  const encoder = new TextEncoder();
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let canceled = false;
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(JSON.stringify(metadata) + "\n"));
      try {
        const response = await coverResponse(metadata.images[0]);
        reader = response.body?.getReader();
        const size = imageSize(response);
        if (canceled || !reader || !size) return;
        controller.enqueue(encoder.encode(size + "\n"));
        let count = 0;
        while (!canceled) {
          const chunk = await reader.read();
          if (chunk.done) break;
          count += chunk.value.length;
          if (count > size) break;
          controller.enqueue(chunk.value);
        }
      } catch { /* An incomplete image falls back to its authenticated GET. */ }
      finally {
        if (reader) await reader.cancel().catch(() => undefined);
        if (!canceled) controller.close();
      }
    },
    cancel() { canceled = true; return reader?.cancel().catch(() => undefined); },
  });
}
