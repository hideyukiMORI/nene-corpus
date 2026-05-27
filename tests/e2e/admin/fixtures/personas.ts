/**
 * Persona definitions for UX scenario testing (#253).
 *
 * 200 personas = 20 industries × 10 behavior patterns.
 *
 * Each persona describes WHO the operator is and HOW they behave during the
 * full admin journey: login → LLM config → source upload → widget preview
 * → chat → conversation logs → logout.
 *
 * Behavior patterns are designed to probe specific UX pain points:
 *   happy_path          — correct inputs throughout, measures baseline success
 *   novice_validation   — leaves required fields empty, relies on validation messages
 *   wrong_file_type     — uploads .docx/.xlsx before discovering CSV/PDF constraint
 *   api_key_wrong_fmt   — enters malformed API key (too short, wrong prefix)
 *   skip_llm            — goes straight to ingest without touching LLM settings
 *   empty_source_chat   — tries to chat before uploading any source
 *   csv_no_column_map   — uploads CSV but never checks any content column
 *   long_content        — pastes 3000-char text (stress test for large inputs)
 *   special_chars       — source name contains special chars / emoji
 *   expert_fast         — rapid correct sequence, tests that fast flows don't break
 */

export type TechLevel = 'novice' | 'intermediate' | 'expert';
export type BehaviorPattern =
  | 'happy_path'
  | 'novice_validation'
  | 'wrong_file_type'
  | 'api_key_wrong_fmt'
  | 'skip_llm'
  | 'empty_source_chat'
  | 'csv_no_column_map'
  | 'long_content'
  | 'special_chars'
  | 'expert_fast';

export interface Persona {
  /** Unique test ID, e.g. "p001" */
  id: string;
  /** Human-readable label for test names */
  label: string;
  /** Industry / business context */
  industry: string;
  industryEn: string;
  /** Experience level with web admin tools */
  techLevel: TechLevel;
  /** Which UX pain-point this persona probes */
  behavior: BehaviorPattern;
  /** Source they plan to upload */
  sourceType: 'text' | 'csv' | 'pdf' | 'docx' | 'xlsx';
  sourceName: string;
  sourceContent: string;
  /** Credentials they use */
  email: string;
  password: string;
  /** Chat message they send */
  chatMessage: string;
  /** API key they enter (may be invalid) */
  apiKey: string;
  /**
   * Expected journey outcome:
   *  full    — completes login through logout
   *  partial — gets blocked at some step (explores error recovery)
   *  stuck   — intentionally blocked (reveals UX gap)
   */
  expectedOutcome: 'full' | 'partial' | 'stuck';
  /** Step where outcome changes (null for full success) */
  expectedStuckStep: string | null;
}

// ── Industry definitions ─────────────────────────────────────────────────────

const INDUSTRIES = [
  { id: 'retail',       ja: 'EC・小売',       sourceName: '商品FAQ',               chatMsg: '返品ポリシーを教えてください' },
  { id: 'restaurant',   ja: '飲食店',         sourceName: 'メニュー案内',           chatMsg: 'ランチの営業時間は何時ですか' },
  { id: 'hotel',        ja: 'ホテル・宿泊',   sourceName: 'ご宿泊案内',             chatMsg: 'チェックインは何時からですか' },
  { id: 'realestate',   ja: '不動産',         sourceName: '物件FAQ',               chatMsg: '初期費用はいくらかかりますか' },
  { id: 'clinic',       ja: '医療クリニック', sourceName: '診療案内',               chatMsg: '予約はどうすればできますか' },
  { id: 'dental',       ja: '歯科医院',       sourceName: '治療メニュー',           chatMsg: '保険は使えますか' },
  { id: 'legal',        ja: '法律事務所',     sourceName: '業務案内',               chatMsg: '無料相談はできますか' },
  { id: 'accounting',   ja: '会計事務所',     sourceName: '税務サービス案内',       chatMsg: '確定申告の期限はいつですか' },
  { id: 'consulting',   ja: 'コンサルティング', sourceName: 'サービス説明',         chatMsg: '契約期間はどのくらいですか' },
  { id: 'education',    ja: '教育・学習塾',   sourceName: 'コース案内',             chatMsg: '無料体験授業はありますか' },
  { id: 'itsupport',    ja: 'IT サポート',    sourceName: 'よくある質問',           chatMsg: 'パスワードを忘れた場合は' },
  { id: 'manufacturing',ja: '製造業',         sourceName: '製品仕様書',             chatMsg: '耐熱温度を教えてください' },
  { id: 'logistics',    ja: '物流・配送',     sourceName: '配送ガイド',             chatMsg: '翌日配送は可能ですか' },
  { id: 'beauty',       ja: '美容院・サロン', sourceName: 'メニュー・料金',         chatMsg: 'カラーの料金はいくらですか' },
  { id: 'fitness',      ja: 'フィットネス',   sourceName: 'プラン案内',             chatMsg: '月額料金を教えてください' },
  { id: 'travel',       ja: '旅行代理店',     sourceName: '旅行プラン案内',         chatMsg: 'キャンセル料はかかりますか' },
  { id: 'nonprofit',    ja: 'NPO・非営利',    sourceName: '活動案内',               chatMsg: 'ボランティアに参加するには' },
  { id: 'government',   ja: '行政・自治体',   sourceName: '手続き案内',             chatMsg: '住民票はどこで取れますか' },
  { id: 'media',        ja: 'メディア・出版', sourceName: 'コンテンツ案内',         chatMsg: '購読プランを教えてください' },
  { id: 'startup',      ja: 'スタートアップ', sourceName: 'プロダクトFAQ',          chatMsg: '料金プランを教えてください' },
] as const;

// ── Behavior parameter builders ──────────────────────────────────────────────

function behaviorParams(behavior: BehaviorPattern): {
  sourceType: Persona['sourceType'];
  apiKey: string;
  expectedOutcome: Persona['expectedOutcome'];
  expectedStuckStep: string | null;
} {
  switch (behavior) {
    case 'happy_path':
      return { sourceType: 'text', apiKey: 'sk-ant-test-valid-key-abcdef123456', expectedOutcome: 'full', expectedStuckStep: null };
    case 'novice_validation':
      return { sourceType: 'text', apiKey: 'sk-ant-test-valid-key-abcdef123456', expectedOutcome: 'partial', expectedStuckStep: 'source_upload' };
    case 'wrong_file_type':
      return { sourceType: 'docx', apiKey: 'sk-ant-test-valid-key-abcdef123456', expectedOutcome: 'partial', expectedStuckStep: 'source_upload' };
    case 'api_key_wrong_fmt':
      return { sourceType: 'text', apiKey: 'sk-invalid', expectedOutcome: 'partial', expectedStuckStep: 'llm_config' };
    case 'skip_llm':
      return { sourceType: 'text', apiKey: '', expectedOutcome: 'partial', expectedStuckStep: 'llm_config' };
    case 'empty_source_chat':
      return { sourceType: 'text', apiKey: 'sk-ant-test-valid-key-abcdef123456', expectedOutcome: 'partial', expectedStuckStep: 'chat' };
    case 'csv_no_column_map':
      return { sourceType: 'csv', apiKey: 'sk-ant-test-valid-key-abcdef123456', expectedOutcome: 'partial', expectedStuckStep: 'source_upload' };
    case 'long_content':
      return { sourceType: 'text', apiKey: 'sk-ant-test-valid-key-abcdef123456', expectedOutcome: 'full', expectedStuckStep: null };
    case 'special_chars':
      return { sourceType: 'text', apiKey: 'sk-ant-test-valid-key-abcdef123456', expectedOutcome: 'full', expectedStuckStep: null };
    case 'expert_fast':
      return { sourceType: 'pdf', apiKey: 'sk-ant-test-valid-key-abcdef123456', expectedOutcome: 'full', expectedStuckStep: null };
  }
}

function techLevel(behavior: BehaviorPattern): TechLevel {
  const expertBehaviors: BehaviorPattern[] = ['expert_fast', 'csv_no_column_map'];
  const noviceBehaviors: BehaviorPattern[] = ['novice_validation', 'wrong_file_type', 'skip_llm', 'empty_source_chat'];
  if (expertBehaviors.includes(behavior)) return 'expert';
  if (noviceBehaviors.includes(behavior)) return 'novice';
  return 'intermediate';
}

function sourceContent(ind: (typeof INDUSTRIES)[number], behavior: BehaviorPattern): string {
  if (behavior === 'long_content') {
    return `${ind.sourceName}に関する詳細情報です。\n\n`.repeat(80) +
      '以上が詳細情報です。ご不明な点はお問い合わせください。';
  }
  if (behavior === 'special_chars') {
    return `✨ ${ind.sourceName} 🎯\n\nよくある質問と回答をご案内します。\n© 2026 All Rights Reserved.`;
  }
  return `${ind.sourceName}に関するよくある質問と回答です。\n\nQ: お問い合わせはどこにすれば良いですか？\nA: お電話またはメールにてお問い合わせください。\n\nQ: 営業時間は何時ですか？\nA: 平日9時〜18時となっております。`;
}

function sourceName(ind: (typeof INDUSTRIES)[number], behavior: BehaviorPattern): string {
  if (behavior === 'special_chars') return `${ind.sourceName} ★2026★`;
  if (behavior === 'novice_validation') return ''; // intentionally empty first attempt
  return ind.sourceName;
}

// ── Generate 200 personas ────────────────────────────────────────────────────

const BEHAVIORS: BehaviorPattern[] = [
  'happy_path',
  'novice_validation',
  'wrong_file_type',
  'api_key_wrong_fmt',
  'skip_llm',
  'empty_source_chat',
  'csv_no_column_map',
  'long_content',
  'special_chars',
  'expert_fast',
];

let personaCounter = 0;

export const PERSONAS: Persona[] = INDUSTRIES.flatMap((ind, iIdx) =>
  BEHAVIORS.map((behavior, bIdx) => {
    personaCounter++;
    const num = String(personaCounter).padStart(3, '0');
    const params = behaviorParams(behavior);

    return {
      id: `p${num}`,
      label: `[${ind.ja}] ${behavior}`,
      industry: ind.ja,
      industryEn: ind.id,
      techLevel: techLevel(behavior),
      behavior,
      sourceType: params.sourceType,
      sourceName: sourceName(ind, behavior),
      sourceContent: sourceContent(ind, behavior),
      email: 'admin@example.com',
      password: 'password123',
      chatMessage: ind.chatMsg,
      apiKey: params.apiKey,
      expectedOutcome: params.expectedOutcome,
      expectedStuckStep: params.expectedStuckStep,
    } satisfies Persona;
  }),
);

// Sanity check: exactly 200 personas
if (PERSONAS.length !== 200) {
  throw new Error(`Expected 200 personas, got ${String(PERSONAS.length)}`);
}
