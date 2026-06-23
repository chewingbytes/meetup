import L from "leaflet";
import { getCategoryConfig } from "./categories";
import { grad } from "./theme";
import type { EventProps } from "./types";

// Raw Lucide SVG paths (the React components can't render into a Leaflet
// divIcon HTML string, so we inline the same icon geometry).
const ICON_SVG: Record<string, string> = {
  network:
    '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  fitness:
    '<path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>',
  chill:
    '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 0 1 0 8h-1"/><path d="M6 2v2"/>',
};

function svgIcon(catId: string): string {
  const paths = ICON_SVG[catId] ?? ICON_SVG.chill;
  return `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

/** Event pin — gradient rounded square + category icon + organizer badge + tail. */
export function eventPinIcon(event: EventProps, joined: boolean): L.DivIcon {
  const cat = getCategoryConfig(event.category);
  const [g0, g1] = cat.gradient;
  const initial = (event.organizer_username ?? "?").charAt(0).toUpperCase();
  const photo = event.organizer_photo_url ?? event.organizer_avatar_url ?? null;

  const joinedRing = joined
    ? `box-shadow:0 0 0 3px #10B981, 0 0 0 6px rgba(16,185,129,0.28), 0 4px 8px rgba(124,58,237,0.28);`
    : `box-shadow:0 4px 8px rgba(124,58,237,0.28);`;

  const avatarInner = photo
    ? `<img src="${esc(photo)}" alt="" referrerpolicy="no-referrer" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"/>`
    : `<span style="font-family:var(--font-dmsans);font-weight:700;font-size:9px;color:#fff;">${esc(initial)}</span>`;

  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;will-change:transform;">
      <div style="position:relative;width:55px;height:55px;">
        <div style="width:55px;height:55px;border-radius:20px;display:flex;align-items:center;justify-content:center;background:${grad(
          cat.gradient,
        )};border:2px solid rgba(255,255,255,0.45);${joinedRing}">
          ${svgIcon(cat.id)}
        </div>
        <div style="position:absolute;bottom:-6px;right:-3px;width:28px;height:28px;border-radius:99px;border:1.5px solid #fff;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#7C3AED;box-shadow:0 1px 2px rgba(0,0,0,0.22);">
          ${avatarInner}
        </div>
        ${joined ? `<div style="position:absolute;top:-6px;left:-6px;width:18px;height:18px;border-radius:99px;background:#10B981;border:2px solid #fff;display:flex;align-items:center;justify-content:center;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>` : ""}
      </div>
      <div style="width:4px;height:8px;border-radius:2px;margin-top:1px;opacity:0.7;background:${g1};"></div>
    </div>`;

  return L.divIcon({
    html,
    className: "soonest-marker",
    iconSize: [55, 63],
    iconAnchor: [27, 63],
  });
}

/** Cluster bubble — gradient circle with count, white ring, violet halo. */
export function clusterIcon(count: number): L.DivIcon {
  const size = count < 10 ? 44 : count < 30 ? 54 : count < 60 ? 64 : 74;
  const inner = size - 6;
  const fontSize = size <= 44 ? 15 : size <= 54 ? 17 : 20;
  const halo = size + 16;

  const html = `
    <div style="position:relative;display:flex;align-items:center;justify-content:center;width:${halo}px;height:${halo}px;cursor:pointer;">
      <div style="position:absolute;width:${halo}px;height:${halo}px;border-radius:50%;background:rgba(124,58,237,0.16);"></div>
      <div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:#fff;box-shadow:0 4px 8px rgba(124,58,237,0.35);">
        <div style="display:flex;align-items:center;justify-content:center;width:${inner}px;height:${inner}px;border-radius:50%;background:${grad(
          ["#A78BFA", "#7C3AED"],
        )};">
          <span style="font-family:var(--font-nunito);font-weight:800;color:#fff;font-size:${fontSize}px;letter-spacing:0.2px;">${count}</span>
        </div>
      </div>
    </div>`;

  return L.divIcon({
    html,
    className: "soonest-marker",
    iconSize: [halo, halo],
    iconAnchor: [halo / 2, halo / 2],
  });
}
