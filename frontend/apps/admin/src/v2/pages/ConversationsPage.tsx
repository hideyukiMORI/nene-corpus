/**
 * ConversationsPage — v2 placeholder
 * 実装は #263 で行う。
 */
import { Layout } from '../Layout';

export function ConversationsPage() {
  return (
    <Layout
      active="conversations"
      crumb="会話ログ"
      corpusStatus="3 / 4 取り込み済み"
      modelStatus="bad"
      stats="86 セッション · 428 通 · 引用 91.8%"
    >
      <div className="page-head">
        <div>
          <div className="eyebrow">// conversations</div>
          <h1>会話ログ</h1>
        </div>
      </div>
      <PlaceholderNotice name="ConversationsPage" issue={263} />
    </Layout>
  );
}

function PlaceholderNotice({ name, issue }: { name: string; issue: number }) {
  return (
    <div style={{
      background: 'var(--primary-soft)',
      border: '1px dashed var(--primary-border)',
      borderRadius: 8,
      padding: '24px 28px',
    }}>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--primary)',
        marginBottom: 8,
      }}>
        // placeholder
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-strong)', marginBottom: 4 }}>
        {name}
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
        {name} placeholder — implementing in #{issue}
      </div>
    </div>
  );
}
