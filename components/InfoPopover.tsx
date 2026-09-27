"use client";

import { useEffect, useRef, useState } from "react";

const INSPIRATION_URL = "https://www.youtube.com/watch?v=sW9npZVpiMI";

export function InfoPopover() {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="info" data-controls ref={container}>
      <button
        className="info-button"
        type="button"
        aria-label="About this project"
        aria-expanded={open}
        aria-controls="project-information"
        onClick={() => setOpen((current) => !current)}
      >
        ?
      </button>
      {open && (
        <aside className="info-popover" id="project-information">
          <p>
            Inspired by Joma Tech&apos;s video about the maths behind a rotating ASCII
            donut.
          </p>
          <a href={INSPIRATION_URL} target="_blank" rel="noreferrer">
            Watch the video ↗
          </a>
        </aside>
      )}
    </div>
  );
}
