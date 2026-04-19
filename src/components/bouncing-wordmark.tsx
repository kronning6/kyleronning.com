import type { RefObject } from "react";

type BouncingWordmarkProps = {
  fontClassName: string;
  isReady: boolean;
  isShrinking: boolean;
  position: {
    x: number;
    y: number;
  };
  scale: number;
  shellSize: {
    width: number;
    height: number;
  };
  textRef: RefObject<HTMLHeadingElement | null>;
  visualShellScale: number;
  wordmarkRef: RefObject<HTMLDivElement | null>;
};

export function BouncingWordmark({
  fontClassName,
  isReady,
  isShrinking,
  position,
  scale,
  shellSize,
  textRef,
  visualShellScale,
  wordmarkRef,
}: BouncingWordmarkProps) {
  return (
    <div
      className="absolute top-0 left-0 flex h-max w-max items-center justify-center overflow-hidden motion-reduce:static motion-reduce:transition-none"
      ref={wordmarkRef}
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
        className={`m-0 select-none whitespace-nowrap leading-[0.9] ${fontClassName}`}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        Kyle Ronning
      </h1>
    </div>
  );
}
