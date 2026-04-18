import type { ReactNode } from "react";
import { SiteNav } from "~/components/site-nav";

type PageFrameProps = {
  title: string;
  children: ReactNode;
};

export function PageFrame({ title, children }: PageFrameProps) {
  return (
    <main className="page-shell">
      <div className="page-frame">
        <SiteNav />
        <section className="journal-block">
          <h1 className="journal-title">{title}</h1>
          {children}
        </section>
      </div>
    </main>
  );
}
