import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "YJ TexLab logo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const bytes = await readFile(path.join(process.cwd(), "public/brand/yjtexlab-logo.png"));
  const logo = `data:image/png;base64,${bytes.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{
        display: "flex", width: "100%", height: "100%", position: "relative",
        alignItems: "center", justifyContent: "center", background: "#fcfbf8",
      }}>
        {/* Preserve the exact wordmark used on the site. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src={logo} width={648} height={320} />
        <div style={{
          display: "flex", position: "absolute", left: 0, right: 0, bottom: 51,
          justifyContent: "center", color: "#64615b", fontSize: 21,
          letterSpacing: "0.12em",
        }}>
          yjtexlab.com
        </div>
      </div>
    ),
    size,
  );
}
