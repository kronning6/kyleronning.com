"use client";

import { useEffect, useRef, useState } from "react";
import { SiteNav } from "~/components/site-nav";

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
  const textRef = useRef<HTMLHeadingElement>(null);
  const readyRef = useRef(false);
  const positionRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 135, y: 95 });
  const frameRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const startTimeoutRef = useRef<number | null>(null);
  const moveTimeoutRef = useRef<number | null>(null);
  const preserveCenterRef = useRef(false);
  const fitScaleRef = useRef(1);
  const shellScaleRef = useRef(1);
  const visualShellScaleRef = useRef(2);
  const sizeRef = useRef({
    width: 0,
    height: 0,
    effectiveWidth: 0,
    effectiveHeight: 0,
    stageWidth: 0,
    stageHeight: 0,
  });

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [shellSize, setShellSize] = useState({ width: 0, height: 0 });
  const [fontIndex, setFontIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isShrinking, setIsShrinking] = useState(false);
  const [scale, setScale] = useState(1);
  const [visualShellScale, setVisualShellScale] = useState(2);
  const activeFont = FONT_OPTIONS[fontIndex];

  useEffect(() => {
    const updateMeasurements = () => {
      const stage = stageRef.current;
      const text = textRef.current;

      if (!stage || !text) {
        return;
      }

      const stageRect = stage.getBoundingClientRect();
      const naturalWidth = text.offsetWidth;
      const naturalHeight = text.offsetHeight;
      const targetWidth = Math.max(0, Math.min(300, stageRect.width - 48));
      const fitScale = naturalWidth > 0 ? targetWidth / naturalWidth : 1;

      fitScaleRef.current = fitScale;
      setScale(fitScale * shellScaleRef.current);

      const width = naturalWidth * fitScale * shellScaleRef.current;
      const height = naturalHeight * fitScale * shellScaleRef.current;
      const effectiveWidth = width * visualShellScaleRef.current;
      const effectiveHeight = height * visualShellScaleRef.current;

      const nextSize = {
        width,
        height,
        effectiveWidth,
        effectiveHeight,
        stageWidth: stageRect.width,
        stageHeight: stageRect.height,
      };

      sizeRef.current = nextSize;
      setShellSize({ width: nextSize.width, height: nextSize.height });

      const minX = -(nextSize.width - nextSize.effectiveWidth) / 2;
      const minY = -(nextSize.height - nextSize.effectiveHeight) / 2;
      const maxX = nextSize.stageWidth - nextSize.width - minX;
      const maxY = nextSize.stageHeight - nextSize.height - minY;
      const centered = {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
      };

      const preservedCenter = {
        x: positionRef.current.x + sizeRef.current.width / 2,
        y: positionRef.current.y + sizeRef.current.height / 2,
      };

      const constrained = {
        x: preserveCenterRef.current
          ? Math.min(
              Math.max(preservedCenter.x - nextSize.width / 2, minX),
              maxX,
            )
          : positionRef.current.x === 0 && positionRef.current.y === 0
            ? centered.x
            : Math.min(Math.max(positionRef.current.x, minX), maxX),
        y: preserveCenterRef.current
          ? Math.min(
              Math.max(preservedCenter.y - nextSize.height / 2, minY),
              maxY,
            )
          : positionRef.current.x === 0 && positionRef.current.y === 0
            ? centered.y
            : Math.min(Math.max(positionRef.current.y, minY), maxY),
      };

      preserveCenterRef.current = false;

      positionRef.current = constrained;
      setPosition(constrained);

      if (!readyRef.current) {
        readyRef.current = true;
        setIsReady(true);
      }
    };

    updateMeasurements();

    const resizeObserver = new ResizeObserver(() => {
      updateMeasurements();
    });

    if (stageRef.current) {
      resizeObserver.observe(stageRef.current);
    }

    if (textRef.current) {
      resizeObserver.observe(textRef.current);
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

      const {
        width,
        height,
        effectiveWidth,
        effectiveHeight,
        stageWidth,
        stageHeight,
      } = sizeRef.current;
      const minX = -(width - effectiveWidth) / 2;
      const minY = -(height - effectiveHeight) / 2;
      const maxX = stageWidth - width - minX;
      const maxY = stageHeight - height - minY;

      let nextX = positionRef.current.x + velocityRef.current.x * deltaSeconds;
      let nextY = positionRef.current.y + velocityRef.current.y * deltaSeconds;
      let hits = 0;

      if (nextX <= minX || nextX >= maxX) {
        velocityRef.current.x *= -1;
        nextX = Math.min(Math.max(nextX, minX), maxX);
        hits += 1;
      }

      if (nextY <= minY || nextY >= maxY) {
        velocityRef.current.y *= -1;
        nextY = Math.min(Math.max(nextY, minY), maxY);
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

    startTimeoutRef.current = window.setTimeout(() => {
      setIsShrinking(true);
      visualShellScaleRef.current = 1;
      setVisualShellScale(1);

      moveTimeoutRef.current = window.setTimeout(() => {
        preserveCenterRef.current = true;
        updateMeasurements();

        frameRef.current = window.requestAnimationFrame(() => {
          setIsShrinking(false);
          previousTimeRef.current = null;
          frameRef.current = window.requestAnimationFrame(step);
        });
      }, 1_200);
    }, 6_000);

    return () => {
      resizeObserver.disconnect();
      previousTimeRef.current = null;

      if (startTimeoutRef.current !== null) {
        window.clearTimeout(startTimeoutRef.current);
      }

      if (moveTimeoutRef.current !== null) {
        window.clearTimeout(moveTimeoutRef.current);
      }

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <main className="home-shell">
      <div className="home-nav-bar">
        <div className="page-frame">
          <SiteNav />
        </div>
      </div>
      <section className="home-stage">
        <div className="dvd-stage" ref={stageRef}>
          <div
            className="dvd-logo-shell"
            ref={logoRef}
            style={{
              height: `${shellSize.height}px`,
              left: `${position.x}px`,
              top: `${position.y}px`,
              transform: `scale(${visualShellScale})`,
              transformOrigin: "center center",
              transition: isShrinking ? "transform 1200ms ease" : undefined,
              visibility: isReady ? "visible" : "hidden",
              width: `${shellSize.width}px`,
            }}
          >
            <h1
              ref={textRef}
              className={`dvd-logo ${activeFont.fontClassName} ${activeFont.sizeClassName}`}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "center center",
              }}
            >
              Kyle Ronning
            </h1>
          </div>
        </div>
      </section>
    </main>
  );
}
