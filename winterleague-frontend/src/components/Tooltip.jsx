import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Tooltip({ label, children }) {
  const id = useId();
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timerRef = useRef(null);
  const pointerFocusRef = useRef(false);
  const focusedRef = useRef(false);
  const pinnedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);

  const clearTimer = () => clearTimeout(timerRef.current);
  const dismiss = () => {
    clearTimer();
    pinnedRef.current = false;
    setOpen(false);
  };
  const leave = () => {
    clearTimer();
    if (!focusedRef.current && !pinnedRef.current) {
      // Allow the pointer to cross the small gap between trigger and tooltip.
      timerRef.current = setTimeout(() => setOpen(false), 120);
    }
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const trigger = triggerRef.current.getBoundingClientRect();
      const tooltip = tooltipRef.current.getBoundingClientRect();
      const margin = 16;
      const gap = 8;
      const left = Math.max(margin, Math.min(
        trigger.left + (trigger.width - tooltip.width) / 2,
        window.innerWidth - tooltip.width - margin,
      ));
      const below = trigger.bottom + gap;
      const top = below + tooltip.height <= window.innerHeight - margin
        ? below
        : Math.max(margin, trigger.top - tooltip.height - gap);
      setPosition({ left, top });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event) => {
      if (!triggerRef.current.contains(event.target) && !tooltipRef.current?.contains(event.target)) {
        dismiss();
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') dismiss();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-describedby={open ? id : undefined}
        className="inline-flex min-h-11 items-center gap-1 rounded text-left uppercase underline decoration-dotted underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        onPointerEnter={event => {
          if (event.pointerType !== 'mouse') return;
          clearTimer();
          timerRef.current = setTimeout(() => setOpen(true), 250);
        }}
        onPointerLeave={leave}
        onPointerDown={() => { pointerFocusRef.current = true; }}
        onFocus={() => {
          if (pointerFocusRef.current) return;
          focusedRef.current = true;
          clearTimer();
          setOpen(true);
        }}
        onBlur={() => {
          focusedRef.current = false;
          pointerFocusRef.current = false;
          dismiss();
        }}
        onClick={() => {
          pointerFocusRef.current = false;
          clearTimer();
          pinnedRef.current = !open;
          setOpen(!open);
        }}
      >
        {label}
        <span aria-hidden="true" className="text-sm">ⓘ</span>
      </button>
      {open && createPortal(
        <div
          ref={tooltipRef}
          id={id}
          role="tooltip"
          className="fixed z-50 w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-lg bg-gray-900 px-4 py-3 text-left text-sm font-normal normal-case leading-relaxed text-white shadow-lg"
          style={position ?? { left: 0, top: 0, visibility: 'hidden' }}
          onPointerEnter={clearTimer}
          onPointerLeave={leave}
        >
          {children}
        </div>,
        document.body,
      )}
    </>
  );
}
