import { Msg, useMsg } from '@nene-corpus/i18n';

export function ColumnMappingGuide() {
  const t = useMsg();

  return (
    <details className="group rounded-md border border-sky-200 bg-sky-50/60 text-sm text-slate-700">
      <summary className="cursor-pointer list-none px-3 py-2.5 font-medium text-sky-950 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block text-sky-600 transition-transform group-open:rotate-90"
          >
            ▶
          </span>
          {t(Msg.admin.ingestion.columnMappingGuideTitle)}
        </span>
      </summary>
      <div className="space-y-3 border-t border-sky-200 px-3 py-3 leading-relaxed">
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
      <h4 className="font-medium text-slate-900">{title}</h4>
      <p className="mt-1 whitespace-pre-line text-slate-600">{body}</p>
    </section>
  );
}
