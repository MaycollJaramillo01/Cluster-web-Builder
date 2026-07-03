import { renderSiteV2 } from "@/lib/site/v2-render";

type SitePreviewV2Props = {
  content: unknown;
  design: unknown;
  sections: unknown;
  leadEndpoint: string;
  showBranding?: boolean;
};

/** The public page, editor preview and ZIP all consume renderSiteV2. */
export function SitePreviewV2(props: SitePreviewV2Props) {
  const rendered = renderSiteV2(props);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: rendered.css }} />
      <div dangerouslySetInnerHTML={{ __html: rendered.body }} />
      <script dangerouslySetInnerHTML={{ __html: rendered.script }} />
    </>
  );
}
