"use client";

import { ConciergeBell } from "lucide-react";
import { useEffect, RefObject, useRef, CSSProperties, useState } from "react";

interface UseOverlayProps {
  initialPopupWidth?: number;
}

export function useOverlay({
  initialPopupWidth = 160,
}: UseOverlayProps) {

  const [popupWidth, setPopupWidth] = useState<number>(initialPopupWidth || 160);
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<CSSProperties | null>(null);
  const btnRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on outside click 
   useEffect(() => {
      function onDocClick(e: MouseEvent) {
        console.log("Document click detected");
        const target = e.target as Node;
        if (btnRef?.current && btnRef.current.contains(target)) return;
        if (popupRef?.current && popupRef.current.contains(target)) return;
        setOpen(false);
      }
      document.addEventListener('mousedown', onDocClick);
      return () => document.removeEventListener('mousedown', onDocClick);
  }, [popupWidth]);

  useEffect(() => {
    if (!open) return;

    let rafId: number | null = null;

    const updateWidthAndPosition = () => {
      if (btnRef?.current) {
        const rect = btnRef.current.getBoundingClientRect();

      // Choose the widest between the button and the popup content
      let maxPopupWidth = rect.width;

      if (popupRef?.current) {
        // scrollWidth reflects the widest content inside the popup
        const contentWidth = popupRef.current.scrollWidth;
        // Add small fudge for borders/padding if needed

        maxPopupWidth = Math.max(rect.width, contentWidth);
        console.log('updateWidthAndPosition() -- maxPopupWidth:', maxPopupWidth);
      }

      setPopupWidth(maxPopupWidth);

      setStyle({ 
          position: 'fixed',
          top: rect.bottom + 2,
          left: rect.left,
          width: maxPopupWidth,
          zIndex: 9999,
        });
      }
    };

        // Run once after render to ensure popupRef is available, then keep in sync on resize
    const scheduleUpdate = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateWidthAndPosition);
      // fallback in case RAF didn't capture final layout
      setTimeout(updateWidthAndPosition, 0);
    };

    scheduleUpdate();

    const onScrollClose = (e?: Event) => {
      // If the scroll/wheel/touch event originated from inside the popup, ignore it.
      try {
        const target = e && (e.target as Node | null);
        if (popupRef?.current && target && popupRef.current.contains(target)) return;
      } catch (err) {
        // ignore DOM access errors and proceed to close
      }
     // Recalculate position in case of scroll-induced layout changes
      setOpen(false);
    };

    //updateWidthAndPosition(); // initial
    // Close on various user scroll interactions. Some containers dispatch scroll
    // on their own element (not window) and 'scroll' doesn't bubble, so also
    // listen for wheel/touchmove which do bubble.
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', onScrollClose, true);
    document.addEventListener('scroll', onScrollClose, true);
    document.addEventListener('wheel', onScrollClose as EventListener, { passive: true, capture: true } as any);
    document.addEventListener('touchmove', onScrollClose as EventListener, { passive: true, capture: true } as any);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', onScrollClose, true);
      document.removeEventListener('scroll', onScrollClose, true);
      document.removeEventListener('wheel', onScrollClose as EventListener, true as any);
      document.removeEventListener('touchmove', onScrollClose as EventListener, true as any);
    };
  }, [open]);

  return {
    open,
    setOpen,
    popupWidth,
    setPopupWidth,    
    style,
    setStyle,
    btnRef: btnRef as React.RefObject<HTMLInputElement>,
    popupRef: popupRef as React.RefObject<HTMLDivElement>,
  };
}
