import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** Shared Open Graph card: big title, a subtitle and a footer line. */
export function ogCard({
  eyebrow,
  title,
  subtitle,
  background = "#000000",
  color = "#f4f4f5",
  accent = "#f4f4f5",
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  background?: string;
  color?: string;
  accent?: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background,
          color,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 24, letterSpacing: 6, textTransform: "uppercase", opacity: 0.7 }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: accent }} />
          {eyebrow}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: title.length > 22 ? 84 : 112, fontWeight: 600, lineHeight: 1, letterSpacing: -3 }}>
            {title}
          </div>
          <div style={{ fontSize: 32, lineHeight: 1.35, opacity: 0.75, maxWidth: 960 }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, opacity: 0.6 }}>
          <span>Charles Collignon</span>
          <span>charlescollignon.com</span>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
