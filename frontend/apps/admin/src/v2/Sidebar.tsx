import { useNavigate } from './router';

export type ActivePage =
  | 'dashboard'
  | 'sources'
  | 'conversations'
  | 'analytics'
  | 'llm'
  | 'embeddings'
  | 'appearance'
  | 'settings'
  | 'help';

interface SidebarProps {
  active: ActivePage;
  corpusStatus?: string;
  modelStatus?: 'ok' | 'warn' | 'bad';
  onLogout?: () => void;
  /** モバイルドロワーを閉じる（ナビ遷移時に呼ばれる） */
  onNavigate?: () => void;
}

interface NavItemDef {
  id: ActivePage | 'logout';
  ja: string;
  route: string;
  icon: React.ReactNode;
  badge?: string;
  dot?: 'ok' | 'warn' | 'bad';
}

interface CorpusItem {
  ja: string;
  meta: string;
  status: 'ok' | 'bg';
  glyph: '▾' | '▸';
}

const CORPUS_TREE: CorpusItem[] = [
  { ja: '商品カタログ 2026 春',    meta: 'csv · 32 chunks',   status: 'ok', glyph: '▾' },
  { ja: 'FAQ and serving guide', meta: 'pdf · 12 chunks',   status: 'ok', glyph: '▾' },
  { ja: 'Seasonal campaign note', meta: '取り込み中…',         status: 'bg', glyph: '▸' },
];

export function Sidebar({ active, corpusStatus = '3 / 4 取り込み済み', modelStatus = 'bad', onLogout, onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const countStr = corpusStatus.split(' ')[0] ?? '';

  const navOperation: NavItemDef[] = [
    { id: 'dashboard',     ja: 'ダッシュボード', route: '/dashboard',     icon: <DashboardIcon /> },
    { id: 'sources',       ja: 'ソース',         route: '/sources',       icon: <SourcesIcon />, badge: '3' },
    { id: 'conversations', ja: '会話ログ',       route: '/conversations', icon: <ConversationsIcon />, badge: '86' },
    { id: 'analytics',     ja: '分析',           route: '/analytics',     icon: <AnalyticsIcon /> },
  ];

  const navModel: NavItemDef[] = [
    { id: 'llm',        ja: 'LLM',    route: '/settings',     icon: <LlmIcon />,        dot: modelStatus },
    { id: 'embeddings', ja: '埋め込み', route: '/settings',   icon: <EmbeddingsIcon /> },
    { id: 'appearance', ja: '外観',   route: '/settings',     icon: <AppearanceIcon /> },
  ];

  const navSystem: NavItemDef[] = [
    { id: 'settings', ja: '設定',      route: '/settings', icon: <SettingsIcon /> },
    { id: 'help',     ja: 'ヘルプ',     route: '/help',     icon: <HelpIcon /> },
    { id: 'logout',   ja: 'ログアウト', route: '/login',    icon: <LogoutIcon /> },
  ];

  function renderItem(item: NavItemDef) {
    const isActive = item.id === active;
    return (
      <button
        key={item.id}
        type="button"
        className={isActive ? 'nav-item active' : 'nav-item'}
        onClick={() => {
          if (item.id === 'logout') {
            onLogout?.();
            return;
          }
          navigate(item.route);
          onNavigate?.();
        }}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className="icon">{item.icon}</span>
        <span className="ja">{item.ja}</span>
        {item.badge && <span className="badge">{item.badge}</span>}
        {item.dot && <span className={`status-dot ${item.dot}`} />}
      </button>
    );
  }

  return (
    <aside className="side">
      <div className="side-section">
        運用 <span className="count">workspace</span>
      </div>
      {navOperation.map(renderItem)}

      <div className="side-section">
        モデル <span className="count">model</span>
      </div>
      {navModel.map(renderItem)}

      <div className="side-section">
        コーパス <span className="count">{countStr}</span>
      </div>
      {CORPUS_TREE.map((item, i) => (
        <div key={i} className="tree-item">
          <span className="glyph">{item.glyph}</span>
          <span className="lbl">
            <div className="ja">{item.ja}</div>
            <div className="meta">{item.meta}</div>
          </span>
          <span className={`dot ${item.status}`} />
        </div>
      ))}

      <div className="side-section">システム</div>
      {navSystem.map(renderItem)}
    </aside>
  );
}

/* ── Inline SVG icons ── */
function DashboardIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
    </svg>
  );
}

function SourcesIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v6a9 3 0 0 0 18 0V5" />
      <path d="M3 11v6a9 3 0 0 0 18 0v-6" />
    </svg>
  );
}

function ConversationsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function LlmIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="2" x2="9" y2="4" /><line x1="15" y1="2" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="22" /><line x1="15" y1="20" x2="15" y2="22" />
      <line x1="20" y1="9" x2="22" y2="9" /><line x1="20" y1="15" x2="22" y2="15" />
      <line x1="2" y1="9" x2="4" y2="9" /><line x1="2" y1="15" x2="4" y2="15" />
    </svg>
  );
}

function EmbeddingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="2" /><circle cx="18" cy="6" r="2" />
      <circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M8 6h8M8 18h8M6 8v8M18 8v8" />
    </svg>
  );
}

function AppearanceIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="8" cy="9" r="1.2" fill="currentColor" />
      <circle cx="15" cy="8" r="1.2" fill="currentColor" />
      <circle cx="16.5" cy="13" r="1.2" fill="currentColor" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
