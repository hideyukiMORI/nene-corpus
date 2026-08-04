import { Msg, useMsg } from '@/shared/i18n';

export function ColumnMappingGuide() {
  const t = useMsg();

  return (
    <details className="group rounded-admin border border-accent-border bg-accent text-xs text-fg-muted">
      <summary className="cursor-pointer list-none px-3 py-2.5 font-medium text-fg marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block text-focus transition-transform group-open:rotate-90"
          >
            ▶
          </span>
          {t(Msg.admin.ingestion.columnMappingGuideTitle)}
        </span>
      </summary>
      <div className="space-y-3 border-t border-accent-border px-3 py-3 leading-relaxed">
        <p className="whitespace-pre-line">{t(Msg.admin.ingestion.columnMappingGuideIntro)}</p>
        <GuideSection title={t(Msg.admin.ingestion.columnMappingGuideTitleHeading)} body={t(Msg.admin.ingestion.columnMappingGuideTitleBody)} />
        <GuideSection title={t(Msg.admin.ingestion.columnMappingGuideContentHeading)} body={t(Msg.admin.ingestion.columnMappingGuideContentBody)} />
        <GuideSection title={t(Msg.admin.ingestion.columnMappingGuideMetadataHeading)} body={t(Msg.admin.ingestion.columnMappingGuideMetadataBody)} />
        <GuideSection title={t(Msg.admin.ingestion.columnMappingGuideExampleHeading)} body={t(Msg.admin.ingestion.columnMappingGuideExampleBody)} />
      </div>
    </details>
  );
}

interface GuideSectionProps {
  title: string;
  body: string;
}

function GuideSection({ title, body }: GuideSectionProps) {
  return (
    <section>
      <h4 className="font-medium text-fg">{title}</h4>
      <p className="mt-1 whitespace-pre-line nc-text-subtle">{body}</p>
    </section>
  );
}
