import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={["mx-auto grid max-w-[600px] gap-8", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
