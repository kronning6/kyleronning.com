"use client";

import { useEffect, useRef, useState } from "react";

const FONT_OPTIONS = [
  {
    fontClassName: "[font-family:var(--font-ibm-plex-mono)]",
    sizeClassName: "dvd-logo-standard",
  },
  {
    fontClassName: "[font-family:var(--font-vt323)]",
    sizeClassName: "dvd-logo-vt323",
  },
  {
    fontClassName: "[font-family:var(--font-doto)]",
    sizeClassName: "dvd-logo-standard",
  },
  {
    fontClassName: "[font-family:var(--font-space-mono)]",
    sizeClassName: "dvd-logo-standard",
  },
  {
    fontClassName: "[font-family:var(--font-rubik-pixels)]",
    sizeClassName: "dvd-logo-standard",
  },
  {
    fontClassName: "[font-family:var(--font-workbench)]",
    sizeClassName: "dvd-logo-standard",
  },
];

export default function Home() {
  const stageRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 135, y: 95 });
  const frameRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const sizeRef = useRef({
    width: 0,
    height: 0,
    stageWidth: 0,
    stageHeight: 0,
  });

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [fontIndex, setFontIndex] = useState(0);
  const activeFont = FONT_OPTIONS[fontIndex];

  useEffect(() => {
    const updateMeasurements = () => {
      const stage = stageRef.current;
      const logo = logoRef.current;

      if (!stage || !logo) {
        return;
      }

      const stageRect = stage.getBoundingClientRect();
      const logoRect = logo.getBoundingClientRect();
      const nextSize = {
        width: logoRect.width,
        height: logoRect.height,
        stageWidth: stageRect.width,
        stageHeight: stageRect.height,
      };

      sizeRef.current = nextSize;

      const maxX = Math.max(0, nextSize.stageWidth - nextSize.width);
      const maxY = Math.max(0, nextSize.stageHeight - nextSize.height);
      const centered = {
        x: maxX / 2,
        y: maxY / 2,
      };

      const constrained = {
        x:
          positionRef.current.x === 0 && positionRef.current.y === 0
            ? centered.x
            : Math.min(Math.max(positionRef.current.x, 0), maxX),
        y:
          positionRef.current.x === 0 && positionRef.current.y === 0
            ? centered.y
            : Math.min(Math.max(positionRef.current.y, 0), maxY),
      };

      positionRef.current = constrained;
      setPosition(constrained);
    };

    updateMeasurements();

    const resizeObserver = new ResizeObserver(() => {
      updateMeasurements();
    });

    if (stageRef.current) {
      resizeObserver.observe(stageRef.current);
    }

    if (logoRef.current) {
      resizeObserver.observe(logoRef.current);
    }

    const step = (timestamp: number) => {
      if (previousTimeRef.current === null) {
        previousTimeRef.current = timestamp;
      }

      const deltaSeconds = Math.min(
        (timestamp - previousTimeRef.current) / 1000,
        0.05,
      );
      previousTimeRef.current = timestamp;

      const { width, height, stageWidth, stageHeight } = sizeRef.current;
      const maxX = Math.max(0, stageWidth - width);
      const maxY = Math.max(0, stageHeight - height);

      let nextX = positionRef.current.x + velocityRef.current.x * deltaSeconds;
      let nextY = positionRef.current.y + velocityRef.current.y * deltaSeconds;
      let hits = 0;

      if (nextX <= 0 || nextX >= maxX) {
        velocityRef.current.x *= -1;
        nextX = Math.min(Math.max(nextX, 0), maxX);
        hits += 1;
      }

      if (nextY <= 0 || nextY >= maxY) {
        velocityRef.current.y *= -1;
        nextY = Math.min(Math.max(nextY, 0), maxY);
        hits += 1;
      }

      const nextPosition = { x: nextX, y: nextY };
      positionRef.current = nextPosition;
      setPosition(nextPosition);

      if (hits > 0) {
        setFontIndex((current) => (current + hits) % FONT_OPTIONS.length);
      }

      frameRef.current = window.requestAnimationFrame(step);
    };

    frameRef.current = window.requestAnimationFrame(step);

    return () => {
      resizeObserver.disconnect();
      previousTimeRef.current = null;

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <main className="dvd-stage" ref={stageRef}>
      <div
        className="dvd-logo-shell"
        ref={logoRef}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        }}
      >
        <h1
          className={`dvd-logo ${activeFont.fontClassName} ${activeFont.sizeClassName}`}
        >
          Kyle Ronning
        </h1>
      </div>
    </main>
  );
}
