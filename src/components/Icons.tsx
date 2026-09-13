import React from "react";

type IconProps = { size?: number; color?: string; style?: React.CSSProperties };

const icon = (path: React.ReactNode, viewBox = "0 0 24 24") =>
  ({ size = 16, color = "currentColor", style }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
    >
      {path}
    </svg>
  );

export const IconActivity      = icon(<><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /><line x1="22" y1="12" x2="2" y2="12" /></>);
export const IconCheck         = icon(<polyline points="20 6 9 17 4 12" />);
export const IconCopy          = icon(<><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>);
export const IconExternalLink  = icon(<><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>);
export const IconGlobe         = icon(<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>);
export const IconLayers        = icon(<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>);
export const IconServer        = icon(<><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></>);
export const IconShield        = icon(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>);
export const IconTrendingUp    = icon(<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>);
export const IconTrendingDown  = icon(<><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></>);
export const IconZap           = icon(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>);
export const IconBarChart      = icon(<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6"  y1="20" x2="6"  y2="14"/></>);
export const IconWifi          = icon(<><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor" stroke="none"/></>);
export const IconArrowRight    = icon(<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>);
export const IconSearch        = icon(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>);

// Live dot — Cloudflare-style minimal pulse
export const LiveDot = ({ color = "var(--fast)", size = 8 }: { color?: string; size?: number }) => (
  <span style={{ position: "relative", display: "inline-flex", width: size, height: size, flexShrink: 0 }}>
    <span style={{
      position: "absolute", inset: 0, borderRadius: "50%",
      background: color, animation: "pulse-ring 2s ease-out infinite", opacity: 0.5,
    }} />
    <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color }} />
  </span>
);
