"use client";

import { useEffect, useRef, useState } from "react";
import { BouncingWordmark } from "~/components/bouncing-wordmark";
import { PageContainer } from "~/components/page-container";
import { SiteNav } from "~/components/site-nav";

const FONT_OPTIONS = [
  {
    fontClassName:
      "[font-family:var(--font-ibm-plex-mono)] text-[clamp(2.2rem,8vw,5.5rem)] pb-[0.08em]",
  },
  {
    fontClassName:
      "[font-family:var(--font-vt323)] text-[clamp(2.6rem,9.4vw,6.75rem)]",
  },
  {
    fontClassName:
      "[font-family:var(--font-doto)] text-[clamp(2.2rem,8vw,5.5rem)]",
  },
  {
    fontClassName:
      "[font-family:var(--font-space-mono)] text-[clamp(2.2rem,8vw,5.5rem)] pb-[0.08em]",
  },
  {
    fontClassName:
      "[font-family:var(--font-rubik-pixels)] text-[clamp(2.2rem,8vw,5.5rem)]",
  },
  {
    fontClassName:
      "[font-family:var(--font-workbench)] text-[clamp(2.2rem,8vw,5.5rem)]",
  },
];

const WORDMARK_HEIGHT_BUFFER = 8;

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
      const naturalHeight = text.offsetHeight + WORDMARK_HEIGHT_BUFFER;
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
    <main className="relative min-h-screen">
      <div className="absolute inset-x-0 top-0 z-10 px-6 pt-12 max-md:p-5 max-md:pt-5">
        <PageContainer>
          <SiteNav />
        </PageContainer>
      </div>
      <section className="h-screen w-screen">
        <div
          className="relative h-full w-full overflow-hidden motion-reduce:flex motion-reduce:items-center motion-reduce:justify-center"
          ref={stageRef}
        >
          <BouncingWordmark
            fontClassName={activeFont.fontClassName}
            isReady={isReady}
            isShrinking={isShrinking}
            position={position}
            scale={scale}
            shellSize={shellSize}
            textRef={textRef}
            visualShellScale={visualShellScale}
            wordmarkRef={logoRef}
          />
        </div>
      </section>
    </main>
  );
}
