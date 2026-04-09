import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/seo";

export const alt = "YJ TexLab";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #ffffff 0%, #f4f4f5 45%, #e5e7eb 100%)",
          color: "#111111",
          padding: "56px 64px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: "0.32em", textTransform: "uppercase" }}>
          Since 1962
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 88, fontWeight: 800, letterSpacing: "-0.06em" }}>
            {siteConfig.name}
          </div>
          <div style={{ maxWidth: 920, fontSize: 34, lineHeight: 1.25, color: "#374151" }}>
            Premium yarn-dyed cotton fabrics from Korea for buyers who care about process, quality,
            and archive depth.
          </div>
        </div>
        <div style={{ fontSize: 24, color: "#4b5563" }}>{siteConfig.url.replace("https://", "")}</div>
      </div>
    ),
    size,
  );
}
