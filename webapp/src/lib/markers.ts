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
 *  a white centre dot, and the organizer's avatar as a badge on its bottom-right. */
export function eventPinIcon(event: EventProps, joined: boolean): L.DivIcon {
  const cat = getCategoryConfig(event.category);
  const [g0, g1] = cat.gradient;
  const initial = (event.organizer_username ?? event.name ?? "?").charAt(0).toUpperCase();
  const photo = event.organizer_photo_url ?? event.organizer_avatar_url ?? null;
  const gid = `pin${pinSeq++}`;

  // Teardrop body: 46-wide head, point at (23,53). White avatar disc sits in it.
  // NOTE: the drop-shadow lives on the parent container, NOT on this SVG. A
  // `filter` here promotes the SVG to its own compositing layer that, inside
  // Leaflet's GPU-composited marker pane, paints *over* the sibling avatar disc —
  // the pin then renders as a bare teardrop with no avatar. The avatar disc also
  // needs a high z-index (below) to win that same compositor ordering.
  const teardrop = `
    <svg width="46" height="54" viewBox="0 0 46 54" style="position:absolute;left:0;top:0;">
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

  // Organizer avatar — sits in the head (top) of the pin. Drop-shadow is on this
  // container (see teardrop note). The avatar disc + joined badge carry very high
  // z-index so Leaflet's compositor paints them above the teardrop SVG; the
  // z-index is scoped to this pin's stacking context, so it can't affect other
  // markers. (z-index:10 was too low and the avatar vanished behind the SVG.)
  const html = `
    <div style="position:relative;width:46px;height:54px;cursor:pointer;filter:drop-shadow(0 4px 6px rgba(124,58,237,0.35));">
      ${teardrop}
      <div style="position:absolute;left:-6px;width:33px;height:33px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#fff;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.25);z-index:9999;">
        ${avatarInner}
      </div>
      ${joined ? `<div style="position:absolute;top:0px;right:-1px;width:17px;height:17px;border-radius:99px;background:#10B981;border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(0,0,0,0.25);z-index:10000;"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>` : ""}
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
