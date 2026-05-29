/**
 * HelpPage — v2 実装 (#292 / SPEC §5.7)
 *
 * 検索付き FAQ アコーディオン + カテゴリリンク + GitHub 連絡先。
 */
import { useMemo, useState, type ReactNode } from 'react';
import { Layout } from '../Layout';
import { useNavigate } from '../router';

interface HelpPageProps {
  onLogout?: () => void;
}

interface FaqItem {
  tag: string;
  keywords: string;
  question: string;
  answer: ReactNode;
}

const GITHUB_URL = 'https://github.com/hideyukiMORI/nene-corpus';

export function HelpPage({ onLogout }: HelpPageProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [openSet, setOpenSet] = useState<Set<number>>(() => new Set([0]));

  // FAQ 内リンク: SPA ルーターで遷移
  const go = (route: string) => (
    <button type="button" className="link" onClick={() => navigate(route)}>
      {route === '/settings' ? '設定' : route === '/sources' ? 'ソース' : route === '/conversations' ? '会話ログ' : route === '/analytics' ? '分析' : route}
    </button>
  );

  const faqs: FaqItem[] = useMemo(() => [
    {
      tag: 'START', keywords: 'はじめ 流れ 最初 セットアップ start',
      question: 'はじめての設定 — 3 ステップ',
      answer: <>① {go('/settings')}の「モデル」で Anthropic の API キーを登録 → ② {go('/sources')}に商品カタログ PDF や FAQ CSV をアップロード → ③ 「ウィジェット」タブのスニペットを自社サイトに貼り付け。これでチャットが使えるようになります。</>,
    },
    {
      tag: 'MODEL', keywords: 'api キー anthropic モデル llm 設定 key',
      question: 'API キーはどこで取得しますか？',
      answer: <><a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer">console.anthropic.com</a> にログインし、API キーを発行します。発行した <code>sk-ant-...</code> を {go('/settings')} &gt; モデルの「API キー」に貼り付けて保存してください。キーはサーバ上で暗号化して保存されます。</>,
    },
    {
      tag: 'SOURCE', keywords: 'ソース 取り込み アップロード csv pdf チャンク 失敗 source',
      question: 'ソースを追加したのに回答に使われません',
      answer: <>取り込み（チャンク化）が完了しているか {go('/sources')}画面の状態を確認してください。「取り込み中」のあいだは回答に使われません。CSV は 1 行＝1 レコードとして、PDF はテキスト抽出できる形式（画像 PDF は不可）が必要です。</>,
    },
    {
      tag: 'WIDGET', keywords: '埋め込み ウィジェット サイト スニペット 設置 widget',
      question: 'サイトにチャットを表示するには？',
      answer: <>{go('/settings')} &gt; ウィジェットのスニペットをコピーし、サイトの <code>&lt;/body&gt;</code> 直前に貼り付けます。WordPress の場合はテーマのフッターテンプレート、またはプラグインでフッターに挿入してください。色やあいさつ文は同じ「ウィジェット」タブの外観で変更できます。</>,
    },
    {
      tag: 'QUALITY', keywords: '引用 出典 回答できない 未回答 精度 品質 quality',
      question: '「資料に記載がありません」と返ってしまう',
      answer: <>その質問に対応する情報がソースに含まれていない可能性があります。{go('/analytics')}画面で引用率や質問の傾向を確認し、不足している情報を{go('/sources')}として追加してください。</>,
    },
    {
      tag: 'LOG', keywords: '会話 ログ 削除 クリーンアップ 容量 古い log cleanup',
      question: '古い会話ログを整理したい',
      answer: <>{go('/conversations')}画面の「古いログを整理」から、指定した期間より前のセッションを一括削除できます。レンタルサーバーの容量を圧迫しないよう、定期的な整理をおすすめします。</>,
    },
    {
      tag: 'ACCOUNT', keywords: 'パスワード ログイン 忘れた リセット アカウント password',
      question: 'パスワードを忘れました',
      answer: <>ログイン画面の「パスワードをお忘れの場合」から、登録メールアドレス宛に再設定リンクを送信できます。メールが届かない場合は迷惑メールフォルダもご確認ください。</>,
    },
    {
      tag: 'DATA', keywords: 'バックアップ エクスポート 移行 zip データ backup',
      question: 'データのバックアップはできますか？',
      answer: <>{go('/settings')} &gt; システム &gt; ホスティングから設定やデータを確認できます。会話ログは{go('/analytics')}画面から CSV でエクスポートできます。</>,
    },
  ], []);

  const filtered = useMemo(() => {
    const v = query.trim().toLowerCase();
    if (v === '') return faqs.map((_, i) => i);
    return faqs
      .map((f, i) => ({ f, i }))
      .filter(({ f }) => `${f.keywords} ${f.question}`.toLowerCase().includes(v))
      .map(({ i }) => i);
  }, [query, faqs]);

  function toggle(i: number): void {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  // カテゴリリンク: 実ページではなく、該当 FAQ を開いてスクロール
  function openFaqByTag(tag: string): void {
    const i = faqs.findIndex((f) => f.tag === tag);
    if (i === -1) return;
    setQuery('');
    setOpenSet((prev) => new Set(prev).add(i));
    // 再描画後にスクロール
    window.setTimeout(() => {
      document.getElementById(`faq-${String(i)}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  const searching = query.trim() !== '';

  return (
    <Layout active="help" crumb="ヘルプ" corpusStatus={undefined} modelStatus={undefined} onLogout={onLogout}>
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <span>Help</span>
            <span className="sep" />
            <span className="scope">使い方とよくある質問</span>
          </div>
          <h1>ヘルプ</h1>
          <div className="desc">設定から運用まで、つまずきやすいポイントをまとめています。</div>
        </div>
      </div>

      <div className="help-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="キーワードで検索 (例: API キー, 取り込み, 埋め込み)"
        />
      </div>

      <div className="help-layout">
        {/* FAQ アコーディオン */}
        <div className="panel" style={{ padding: '4px 18px' }}>
          {filtered.length === 0 ? (
            <p style={{ padding: '20px 4px', fontSize: 13, color: 'var(--ink-faint)' }}>
              該当する項目がありません。
            </p>
          ) : (
            filtered.map((i) => {
              const f = faqs[i]!;
              const isOpen = searching || openSet.has(i);
              return (
                <div key={i} id={`faq-${String(i)}`} className={isOpen ? 'faq-item open' : 'faq-item'}>
                  <button type="button" className="faq-q" onClick={() => toggle(i)} aria-expanded={isOpen}>
                    <span className="tag">{f.tag}</span>
                    {f.question}
                    <span className="chev">›</span>
                  </button>
                  {isOpen && <div className="faq-a">{f.answer}</div>}
                </div>
              );
            })
          )}
        </div>

        {/* サイド: カテゴリ + 連絡先 */}
        <div className="help-aside">
          <div className="card-box">
            <h4>カテゴリ</h4>
            <button type="button" className="qlink" onClick={() => openFaqByTag('MODEL')}>
              <span className="ic">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /></svg>
              </span>
              モデル設定<span className="arrow">→</span>
            </button>
            <button type="button" className="qlink" onClick={() => openFaqByTag('SOURCE')}>
              <span className="ic">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v6a9 3 0 0 0 18 0V5" /><path d="M3 11v6a9 3 0 0 0 18 0v-6" /></svg>
              </span>
              ソースの追加<span className="arrow">→</span>
            </button>
            <button type="button" className="qlink" onClick={() => openFaqByTag('WIDGET')}>
              <span className="ic">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
              </span>
              サイトへの埋め込み<span className="arrow">→</span>
            </button>
            <button type="button" className="qlink" onClick={() => openFaqByTag('QUALITY')}>
              <span className="ic">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
              </span>
              分析・品質<span className="arrow">→</span>
            </button>
          </div>

          <div className="card-box">
            <h4>解決しないときは</h4>
            <div className="contact-note">
              ドキュメントとイシューは GitHub で公開しています。<br />
              <span className="mono">github.com/hideyukiMORI/nene-corpus</span>
              <div style={{ marginTop: 12 }}>
                <a className="btn btn-ghost btn-sm" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85 0 1.71.11 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10.01 10.01 0 0 0 22 12c0-5.52-4.48-10-10-10z" /></svg>
                  GitHub で見る
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
