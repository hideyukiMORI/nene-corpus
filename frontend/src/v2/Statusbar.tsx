interface StatusbarProps {
  corpusStatus?: string;
  modelStatus?: 'ok' | 'warn' | 'bad';
  stats?: string;
}

export function Statusbar({
  corpusStatus = '3 / 4 取り込み済み',
  modelStatus = 'bad',
  stats = '86 セッション · 428 通 · 引用 91.8%',
}: StatusbarProps) {
  const modelInfo = {
    ok:   { cls: 'val ok',     dot: 'ok',  text: '稼働中' },
    warn: { cls: 'val danger', dot: 'bad', text: '要確認' },
    bad:  { cls: 'val danger', dot: 'bad', text: '未設定' },
  }[modelStatus];

  return (
    <div className="statusbar">
      <span className="chunk">
        <span className="dot ok" />
        <span className="lbl">corpus:</span>
        <span className="val ok">{corpusStatus}</span>
      </span>
      <span className="chunk">
        <span className={`dot ${modelInfo.dot}`} />
        <span className="lbl">model:</span>
        <span className={modelInfo.cls}>{modelInfo.text}</span>
      </span>
      <span className="chunk">
        <span className="lbl">7d:</span>
        <span className="val">{stats}</span>
      </span>
      <span className="chunk right">
        <span className="lbl">最終取得:</span>
        <span className="val">2026-05-28 14:38:12 JST</span>
      </span>
    </div>
  );
}
