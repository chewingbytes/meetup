"use client";

import { useEffect, useState } from "react";
import { X, MapPin, Instagram, Vote, Lock, Smartphone, type LucideIcon } from "lucide-react";
import { grad, Gradients } from "@/lib/theme";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * "What is Soonest?" — a bento-grid splash shown to brand-new / signed-out
 * visitors (and re-openable any time from the logo pill). It's purely
 * informational: a tap *anywhere* dismisses it. Center modal, mobile-first, and
 * it expands into a proper bento on bigger screens.
 */
export function WhatIsSoonest({ open, onClose }: Props) {
  // Mount + visibility flags so we get a smooth enter/exit (mirrors Sheet.tsx).
  const [render, setRender] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setRender(true);
      const r = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(r);
    }
    setVisible(false);
    const t = setTimeout(() => setRender(false), 250);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!render) return null;

  return (
    // Tap anywhere (backdrop, panel, or any tile) dismisses — clicks bubble here.
    <div
      role="dialog"
      aria-modal="true"
      aria-label="What is Soonest"
      onClick={onClose}
      className={`fixed inset-0 z-[1200] flex cursor-pointer items-center justify-center p-4 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className={`relative max-h-[92dvh] w-full max-w-4xl select-none overflow-y-auto no-scrollbar transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0"
        }`}
      >
        <div className="grid grid-cols-2 gap-3 md:h-[600px] md:grid-cols-3 md:auto-rows-fr">
          {/* Hero — what Soonest is */}
          <div
            className="relative col-span-2 flex flex-col justify-between overflow-hidden rounded-[28px] p-6 text-white md:row-span-2 md:p-7"
            style={{ background: grad(Gradients.primary) }}
          >
            <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-14 -left-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/30"
            >
              <X size={16} strokeWidth={2.6} />
            </button>

            <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/transparentlogo.png" alt="" className="h-7 w-7" />
            </span>

            <div className="relative mt-5 md:mt-0">
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">Welcome to</p>
              <h2 className="font-heading text-4xl font-extrabold leading-none md:text-5xl">soonest</h2>
              <p className="mt-3 max-w-xs text-[15px] font-medium leading-relaxed text-white/90">
                A live map for meeting people <span className="font-extrabold text-white">in real life</span> — see
                what&apos;s happening near you and just go.
              </p>
            </div>
          </div>

          <Tile
            icon={MapPin}
            gradient={Gradients.green}
            title="Create & join activities"
            body="Drop a pin for anything — coffee, a run, a jam — or hop into plans happening nearby."
          />
          <Tile
            icon={Instagram}
            gradient={Gradients.pink}
            title="Link your Instagram"
            body="Connect your IG so the group knows who's coming — and you can check out theirs."
          />
          <Tile
            icon={Vote}
            gradient={Gradients.blue}
            title="Vote to remove people"
            body="Groups keep themselves safe — members can vote out anyone who shouldn't be there."
          />
          <Tile
            icon={Lock}
            gradient={Gradients.amber}
            title="Private activities"
            body="Make an activity private and personally choose which applicants get to join."
          />
          <Tile
            icon={Smartphone}
            gradient={Gradients.coral}
            title="App coming soon"
            body="Landing on an App Store & Google Play Store near you."
            badge="Coming soon"
            className="col-span-2 md:col-span-1"
          />
        </div>

        <p className="mt-4 text-center text-[13px] font-semibold text-white/80">Tap anywhere to continue</p>
      </div>
    </div>
  );
}

function Tile({
  icon: Icon,
  gradient,
  title,
  body,
  badge,
  className,
}: {
  icon: LucideIcon;
  gradient: readonly [string, string];
  title: string;
  body: string;
  badge?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col justify-center gap-2.5 rounded-[24px] bg-white p-5 shadow-clayCard ${
        className ?? ""
      }`}
    >
      <span
        className="flex h-11 w-11 items-center justify-center rounded-2xl"
        style={{ background: grad(gradient) }}
      >
        <Icon size={20} color="#fff" strokeWidth={2.4} />
      </span>
      <h3 className="font-heading text-base font-extrabold leading-tight text-textPrimary">{title}</h3>
      <p className="text-[13px] leading-relaxed text-textSecondary">{body}</p>
    </div>
  );
}
