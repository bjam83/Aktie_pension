"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const OPEN_MS = 260;
const CLOSE_MS = 200;

/**
 * The shared slide-up sheet (mobile) / right panel (desktop) primitive that
 * replaces inline <details> edit forms across the redesigned app. A plain
 * portal + CSS implementation (see .sheet* rules in globals.css) rather than
 * <dialog>, so backdrop, drag-to-close and the open/close timing are all in
 * our own control. On desktop this overlays from the right edge rather than
 * literally reflowing page content — a deliberate simplification of the
 * design spec's "not a centered modal" language that keeps this a drop-in
 * component usable from any page without a layout-level content gutter.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  // "closed" unmounts entirely; "entering"/"visible" drive the open transition;
  // "closing" plays the (shorter) exit transition before actually unmounting.
  const [phase, setPhase] = useState<"closed" | "entering" | "visible" | "closing">("closed");
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      restoreFocusRef.current = document.activeElement as HTMLElement | null;
      // Deliberate open-transition kickoff, not a render-loop: "entering" sets the
      // panel to its off-screen starting position, then the rAF flips it to
      // "visible" one frame later so the CSS transition actually animates.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("entering");
      const raf = requestAnimationFrame(() => setPhase("visible"));
      return () => cancelAnimationFrame(raf);
    }
    if (phase === "visible" || phase === "entering") {
      setPhase("closing");
      const t = setTimeout(() => {
        setPhase("closed");
        restoreFocusRef.current?.focus?.();
      }, CLOSE_MS);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (phase === "closed") return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "visible") return;
    panelRef.current?.focus();
  }, [phase]);

  useEffect(() => {
    if (phase === "closed") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, onClose]);

  if (phase === "closed") return null;

  const visible = phase === "visible";

  return createPortal(
    <>
      <div className="sheet-backdrop" data-visible={visible} onClick={onClose} style={{ transitionDuration: `${visible ? OPEN_MS : CLOSE_MS}ms` }} />
      <div
        ref={panelRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        data-visible={visible}
        style={{
          transitionDuration: `${visible ? OPEN_MS : CLOSE_MS}ms`,
          transform: dragOffset ? `translateY(${dragOffset}px)` : undefined,
        }}
      >
        <div
          className="sheet-handle"
          onTouchStart={(e) => {
            dragStartY.current = e.touches[0].clientY;
          }}
          onTouchMove={(e) => {
            if (dragStartY.current == null) return;
            const delta = e.touches[0].clientY - dragStartY.current;
            if (delta > 0) setDragOffset(delta);
          }}
          onTouchEnd={() => {
            if (dragOffset > 90) {
              onClose();
            }
            setDragOffset(0);
            dragStartY.current = null;
          }}
        />
        {title && (
          <div className="sheet-head">
            <div className="sheet-title">{title}</div>
            <button type="button" className="btn ghost tiny" onClick={onClose} aria-label="Luk">
              Luk
            </button>
          </div>
        )}
        <div className="sheet-body">{children}</div>
      </div>
    </>,
    document.body
  );
}
