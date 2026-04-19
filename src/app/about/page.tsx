import { PageFrame } from "~/components/page-frame";
import { RapidLog } from "~/components/rapid-log";

export default function AboutPage() {
  return (
    <PageFrame title="about">
      <RapidLog>
        <p>
          This page is ready for content to move over from Notion once the
          source model is set.
        </p>
        <p>
          For now, treat it as the stable route for biography, work history, and
          the site&apos;s overall context.
        </p>
      </RapidLog>
    </PageFrame>
  );
}
