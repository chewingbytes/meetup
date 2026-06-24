"use client";

import { useEffect, useState, type ReactNode } from "react";

type Variant = "responsive" | "bottom" | "right" | "center";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  variant?: Variant;
  children: ReactNode;
  /** Tailwind width class for right/center variants (e.g. "md:w-[400px]"). */
  widthClass?: string;
  /** Hide the dimmed backdrop (e.g. keep the map fully visible behind a side panel). */
  noBackdrop?: boolean;
  /** Stacking layer. Override (e.g. "z-[1100]") when nesting a sheet above
   *  another open sheet so it doesn't get painted underneath. */
  zClass?: string;
}

// Per-variant container positioning + hidden/visible transforms. "responsive"
// is a bottom sheet on mobile and a right-side panel from md up — so the desktop
// popup never obstructs the map.
const POS: Record<Variant, string> = {
  responsive:
    "inset-x-0 bottom-0 md:inset-y-0 md:left-auto md:right-0 md:bottom-0 md:max-w-[420px] md:p-4",
  bottom: "inset-x-0 bottom-0",
  right: "inset-y-0 right-0",
  center: "inset-0 flex items-center justify-center p-4",
};

const HIDDEN: Record<Variant, string> = {
  responsive: "translate-y-full md:translate-y-0 md:translate-x-[110%]",
  bottom: "translate-y-full",
  right: "translate-x-full",
  center: "opacity-0 scale-95",
};

const VISIBLE: Record<Variant, string> = {
  responsive: "translate-y-0 md:translate-x-0",
  bottom: "translate-y-0",
  right: "translate-x-0",
  center: "opacity-100 scale-100",
};

export function Sheet({
  open,
  onClose,
  variant = "responsive",
  children,
  widthClass,
  noBackdrop,
  zClass = "z-[1000]",
}: SheetProps) {
  const [render, setRender] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setRender(true);
      const r = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(r);
    }
    setVisible(false);
    const t = setTimeout(() => setRender(false), 300);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!render) return null;

  const isCenter = variant === "center";

  return (
    <div
      className={`fixed inset-0 ${zClass} ${noBackdrop ? "pointer-events-none" : ""}`}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      {!noBackdrop && (
        <div
          onClick={onClose}
          className={`absolute inset-0 bg-black/35 transition-opacity duration-300 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* Panel */}
      <div
        className={`absolute ${POS[variant]} ${
          isCenter ? "" : "pointer-events-none"
        }`}
      >
        <div
          className={`pointer-events-auto ${
            isCenter
              ? `w-full ${widthClass ?? "max-w-md"}`
              : variant === "right"
                ? `h-full ${widthClass ?? ""}`
                : (widthClass ?? "")
          } transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            visible ? VISIBLE[variant] : HIDDEN[variant]
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
