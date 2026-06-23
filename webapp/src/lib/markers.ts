import L from "leaflet";
import { getCategoryConfig } from "./categories";
import { grad } from "./theme";
import type { EventProps } from "./types";

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

// Unique gradient id per pin so multiple inline SVGs don't collide on url(#id).
let pinSeq = 0;

/** Event pin — a classic teardrop location marker (category-gradient fill) with
 *  the organizer's avatar set into the round head. */
export function eventPinIcon(event: EventProps, joined: boolean): L.DivIcon {
  const cat = getCategoryConfig(event.category);
  const [g0, g1] = cat.gradient;
  const initial = (event.organizer_username ?? event.name ?? "?").charAt(0).toUpperCase();
  const photo = event.organizer_photo_url ?? event.organizer_avatar_url ?? null;
  const gid = `pin${pinSeq++}`;

  // Teardrop body: 46×54 viewbox, head centred at (23,22), point at (23,53).
  const teardrop = `
    <svg width="46" height="54" viewBox="0 0 46 54" style="position:absolute;inset:0;filter:drop-shadow(0 4px 6px rgba(124,58,237,0.35));">
      <defs>
        <linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${g0}"/>
          <stop offset="1" stop-color="${g1}"/>
        </linearGradient>
      </defs>
      <path d="M23 1.5C11.7 1.5 2.5 10.7 2.5 22C2.5 35.5 23 52.5 23 52.5C23 52.5 43.5 35.5 43.5 22C43.5 10.7 34.3 1.5 23 1.5Z"
            fill="url(#${gid})" stroke="${joined ? "#10B981" : "rgba(255,255,255,0.7)"}" stroke-width="${joined ? 3 : 2}"/>
    </svg>`;

  const avatarInner = photo
    ? `<img src="${esc(photo)}" alt="" referrerpolicy="no-referrer" style="width:100%;height:100%;object-fit:cover;"/>`
    : `<span style="font-family:var(--font-dmsans);font-weight:800;font-size:13px;color:${g1};">${esc(initial)}</span>`;

  const html = `
    <div style="position:relative;width:46px;height:54px;cursor:pointer;will-change:transform;">
      ${teardrop}
      <div style="position:absolute;left:10px;top:9px;width:26px;height:26px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#fff;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.06);">
        ${avatarInner}
      </div>
      ${joined ? `<div style="position:absolute;top:-3px;right:-1px;width:18px;height:18px;border-radius:99px;background:#10B981;border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(0,0,0,0.25);"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>` : ""}
    </div>`;

  return L.divIcon({
    html,
    className: "soonest-marker",
    iconSize: [46, 54],
    iconAnchor: [23, 53],
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
