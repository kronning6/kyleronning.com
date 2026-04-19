import type { ReactNode } from "react";

type RapidLogProps = {
  children: ReactNode;
};

export function RapidLog({ children }: RapidLogProps) {
  return <div className="grid gap-4 leading-7 [&_p]:m-0">{children}</div>;
}
