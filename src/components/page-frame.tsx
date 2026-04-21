import type { ReactNode } from "react";
import { PageContainer } from "~/components/page-container";
import { SiteNav } from "~/components/site-nav";

type PageFrameProps = {
  title: string;
  children: ReactNode;
};

export function PageFrame({ title, children }: PageFrameProps) {
  return (
    <main className="min-h-screen px-6 pt-12 pb-16 md:px-6 md:pt-12 md:pb-16 max-md:p-5">
      <PageContainer>
        <SiteNav />
        <section className="grid gap-6">
          <h1 className="m-0 text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] font-normal">
            {title}
          </h1>
          {children}
        </section>
      </PageContainer>
    </main>
  );
}
