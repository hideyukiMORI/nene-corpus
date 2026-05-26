#!/usr/bin/env node
/**
 * build-guide.mjs
 * チュートリアル LP を 6 か国語で生成して public_html/guide/ に出力する。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const OUT       = path.join(ROOT, 'public_html', 'guide');
const GH_URL    = 'https://github.com/hideyukiMORI/nene-corpus';

const LOCALES = [
  { id: 'ja',      lang: 'ja',    label: '日本語' },
  { id: 'en',      lang: 'en',    label: 'English' },
  { id: 'de',      lang: 'de',    label: 'Deutsch' },
  { id: 'fr',      lang: 'fr',    label: 'Français' },
  { id: 'zh-hans', lang: 'zh-Hans', label: '中文' },
  { id: 'pt-br',   lang: 'pt-BR', label: 'Português' },
];

// ── SVG イラスト ────────────────────────────────────────────────────────────

const SVG = {
  corpus: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none" aria-hidden="true">
    <rect x="28" y="42" width="72" height="88" rx="6" fill="#ede9fe" stroke="#7c3aed" stroke-width="2"/>
    <rect x="38" y="30" width="72" height="88" rx="6" fill="#f5f3ff" stroke="#7c3aed" stroke-width="2"/>
    <rect x="48" y="18" width="72" height="88" rx="6" fill="white" stroke="#7c3aed" stroke-width="2.5"/>
    <line x1="62" y1="40" x2="106" y2="40" stroke="#c4b5fd" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="62" y1="52" x2="106" y2="52" stroke="#c4b5fd" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="62" y1="64" x2="94"  y2="64" stroke="#c4b5fd" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="62" y1="76" x2="106" y2="76" stroke="#c4b5fd" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="62" y1="88" x2="88"  y2="88" stroke="#c4b5fd" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="112" cy="108" r="22" fill="#7c3aed"/>
    <circle cx="109" cy="105" r="10" fill="none" stroke="white" stroke-width="2.5"/>
    <line x1="116" y1="112" x2="124" y2="120" stroke="white" stroke-width="3" stroke-linecap="round"/>
  </svg>`,

  chat: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none" aria-hidden="true">
    <rect x="12" y="18" width="100" height="52" rx="16" fill="#7c3aed"/>
    <path d="M28 70 L16 88 L40 70Z" fill="#7c3aed"/>
    <line x1="28" y1="38" x2="96" y2="38" stroke="white" stroke-width="3" stroke-linecap="round"/>
    <line x1="28" y1="52" x2="80" y2="52" stroke="white" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
    <rect x="110" y="14" width="38" height="38" rx="19" fill="#f59e0b"/>
    <text x="129" y="39" text-anchor="middle" fill="white" font-size="18" font-weight="700" font-family="sans-serif">[1]</text>
    <rect x="50" y="96" width="100" height="46" rx="16" fill="#e5e7eb"/>
    <path d="M134 142 L148 158 L120 142Z" fill="#e5e7eb"/>
    <line x1="66" y1="114" x2="134" y2="114" stroke="#9ca3af" stroke-width="3" stroke-linecap="round"/>
    <line x1="66" y1="128" x2="110" y2="128" stroke="#9ca3af" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
  </svg>`,

  embed: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none" aria-hidden="true">
    <rect x="8"  y="14" width="144" height="108" rx="8" fill="#f9fafb" stroke="#e5e7eb" stroke-width="2"/>
    <rect x="8"  y="14" width="144" height="28"  rx="8" fill="#e5e7eb"/>
    <rect x="8"  y="34" width="144" height="8"   fill="#e5e7eb"/>
    <circle cx="26" cy="28" r="4" fill="#ef4444" opacity="0.7"/>
    <circle cx="40" cy="28" r="4" fill="#f59e0b" opacity="0.7"/>
    <circle cx="54" cy="28" r="4" fill="#22c55e" opacity="0.7"/>
    <line x1="24" y1="60"  x2="92"  y2="60"  stroke="#d1d5db" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="24" y1="74"  x2="76"  y2="74"  stroke="#d1d5db" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="24" y1="88"  x2="88"  y2="88"  stroke="#d1d5db" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="24" y1="102" x2="64"  y2="102" stroke="#d1d5db" stroke-width="2.5" stroke-linecap="round"/>
    <rect x="92" y="62" width="52" height="58" rx="10" fill="#7c3aed" filter="url(#shadow)"/>
    <defs><filter id="shadow"><feDropShadow dx="-2" dy="2" stdDeviation="3" flood-color="#7c3aed" flood-opacity="0.4"/></filter></defs>
    <rect x="98" y="96" width="40" height="16" rx="5" fill="white" opacity="0.25"/>
    <line x1="100" y1="76" x2="136" y2="76" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.9"/>
    <line x1="100" y1="87" x2="126" y2="87" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
    <circle cx="118" cy="57" r="11" fill="#7c3aed" stroke="white" stroke-width="2.5"/>
    <path d="M113 57 Q118 52 123 57 Q118 62 113 57Z" fill="white"/>
  </svg>`,

  widgetPreview: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 360" fill="none" aria-hidden="true">
    <rect width="280" height="360" rx="16" fill="#1e1b4b"/>
    <rect x="1" y="1" width="278" height="358" rx="15" fill="white" stroke="#e5e7eb" stroke-width="1"/>
    <rect x="0" y="0" width="280" height="52" rx="16" fill="#7c3aed"/>
    <rect x="0" y="38" width="280" height="14" fill="#7c3aed"/>
    <circle cx="30" cy="26" r="14" fill="white" opacity="0.2"/>
    <text x="52" y="22" fill="white" font-size="13" font-weight="600" font-family="sans-serif">NeNe Corpus</text>
    <text x="52" y="36" fill="white" font-size="10" font-family="sans-serif" opacity="0.8">How can we help?</text>
    <rect x="16" y="68" width="168" height="56" rx="10" fill="#f3f4f6"/>
    <text x="28" y="88"  fill="#374151" font-size="10" font-family="sans-serif">Based on the documentation,</text>
    <text x="28" y="102" fill="#374151" font-size="10" font-family="sans-serif">NeNe Corpus supports PDF,</text>
    <text x="28" y="116" fill="#374151" font-size="10" font-family="sans-serif">CSV, and plain text. <tspan fill="#7c3aed" font-weight="600">[1]</tspan></text>
    <rect x="96" y="136" width="168" height="40" rx="10" fill="#ede9fe"/>
    <text x="108" y="152" fill="#4c1d95" font-size="10" font-family="sans-serif">Which formats does it</text>
    <text x="108" y="166" fill="#4c1d95" font-size="10" font-family="sans-serif">support?</text>
    <rect x="16" y="188" width="180" height="56" rx="10" fill="#f3f4f6"/>
    <text x="28" y="208" fill="#374151" font-size="10" font-family="sans-serif">You can install it on shared</text>
    <text x="28" y="222" fill="#374151" font-size="10" font-family="sans-serif">hosting with PHP 8.2+ and</text>
    <text x="28" y="236" fill="#374151" font-size="10" font-family="sans-serif">MySQL. No SSH needed. <tspan fill="#7c3aed" font-weight="600">[2]</tspan></text>
    <line x1="16" y1="260" x2="264" y2="260" stroke="#e5e7eb" stroke-width="1"/>
    <rect x="12" y="272" width="222" height="36" rx="8" fill="#f9fafb" stroke="#e5e7eb" stroke-width="1"/>
    <text x="24" y="294" fill="#9ca3af" font-size="10" font-family="sans-serif">Type your question…</text>
    <rect x="244" y="272" width="24" height="36" rx="8" fill="#7c3aed"/>
    <path d="M251 290 L262 290 M258 286 L262 290 L258 294" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="12" y="316" width="256" height="32" rx="6" fill="#faf5ff"/>
    <text x="20" y="330" fill="#7c3aed" font-size="8" font-family="sans-serif" font-weight="600">[1] Installation Guide p.3</text>
    <text x="20" y="342" fill="#7c3aed" font-size="8" font-family="sans-serif" font-weight="600">[2] Deployment Guide p.7</text>
  </svg>`,
};

// ── 免責事項（言語別） ───────────────────────────────────────────────────────

const DISCLAIMER = {
  ja: `
<div class="space-y-6 text-sm text-gray-700 leading-relaxed">
  <p class="text-base font-medium text-gray-900">本ページをお読みになる前に、以下の免責事項および利用規約（以下「本規約」）をご確認ください。本ソフトウェアを利用した場合、本規約に同意したものとみなします。</p>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">1. ソフトウェアの無保証（MIT ライセンス条項）</h3>
    <p>本ソフトウェア「NeNe Corpus」（以下「本ソフトウェア」）は、<strong>MIT ライセンス</strong>のもとで提供されるオープンソースソフトウェアです。本ソフトウェアは<strong>「現状有姿（AS IS）」</strong>で提供され、明示的または黙示的な一切の保証を行いません。商品性、特定目的への適合性、権利不侵害の保証を含む、あらゆる明示的・黙示的保証を明示的に否認します。</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">2. 責任の制限</h3>
    <p>著作権者および貢献者は、本ソフトウェアの使用または使用不能に起因するいかなる直接的・間接的・偶発的・特別・懲罰的・結果的損害（代替品またはサービスの調達コスト、利用機会の喪失、データの喪失または破損、利益の喪失、業務の中断などを含むがこれに限らない）に対しても、損害発生の可能性を事前に告知されていた場合であっても、いかなる責任理論（契約責任、厳格責任、不法行為責任を含む）においても、一切責任を負いません。</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">3. AI による回答の正確性に関する免責</h3>
    <p>本ソフトウェアのチャット機能は、大規模言語モデル（LLM）による自動生成回答を返します。AI が生成する回答は、事実誤認・不完全情報・古い情報を含む可能性があります（いわゆる「ハルシネーション」）。本ソフトウェアの回答を、<strong>医療・法律・財務・投資・安全保障その他の専門的意思決定の根拠</strong>として単独で使用しないでください。重要な判断には必ず一次資料または専門家にご確認ください。</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">4. 第三者サービス（Anthropic Claude API）への依存</h3>
    <p>本ソフトウェアは、Anthropic, Inc.（以下「Anthropic」）が提供する Claude API を使用します。以下の事項について、本ソフトウェアの著作権者は一切責任を負いません。</p>
    <ul class="list-disc list-inside space-y-1 mt-2 ml-4">
      <li>Anthropic サービスの可用性、応答速度、品質の変動または停止</li>
      <li>Anthropic API の価格改定</li>
      <li>Claude モデルの回答内容の変更・品質劣化</li>
      <li>Anthropic 利用規約の変更に伴う制限</li>
    </ul>
    <p class="mt-2">Claude API の利用には、Anthropic の <a href="https://www.anthropic.com/legal/usage-policy" target="_blank" rel="noopener" class="text-violet-700 underline">利用ポリシー</a> および <a href="https://www.anthropic.com/legal/consumer-terms" target="_blank" rel="noopener" class="text-violet-700 underline">利用規約</a> が別途適用されます。</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">5. データの取り扱いと個人情報保護</h3>
    <p>本ソフトウェアはセルフホスト型であり、コーパスデータおよびチャット履歴は<strong>オペレーター（本ソフトウェアを設置・運用する者）のサーバー上の MySQL データベース</strong>に保存されます。ただし、チャットの問い合わせ内容は AI 推論のため Anthropic の API サーバーに送信されます。</p>
    <p class="mt-2">オペレーターは、自らのデプロイメントにおいて以下の義務を負います。</p>
    <ul class="list-disc list-inside space-y-1 mt-2 ml-4">
      <li>個人情報の保護に関する法律（個人情報保護法）の遵守</li>
      <li>EU 一般データ保護規則（GDPR）等、適用されるデータ保護法令への準拠</li>
      <li>エンドユーザーへのプライバシーポリシーの提示および同意取得</li>
      <li>チャットログの適切な保管・管理・削除対応</li>
    </ul>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">6. オペレーターの責任</h3>
    <p>本ソフトウェアを設置・運用するオペレーターは、以下に対して単独で責任を負います。</p>
    <ul class="list-disc list-inside space-y-1 mt-2 ml-4">
      <li>エンドユーザーに対する利用規約・プライバシーポリシーの整備と周知</li>
      <li>特定商取引法・景品表示法・不正競争防止法等の適用法令の遵守</li>
      <li>Anthropic API の利用料金（従量課金）の負担</li>
      <li>セキュリティインシデント（不正アクセス・情報漏洩等）への対応</li>
      <li>ウィジェットに表示するコンテンツの適法性・著作権侵害の不存在の確保</li>
      <li>未成年者保護等の措置</li>
    </ul>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">7. 禁止事項</h3>
    <p>本ソフトウェアを以下の目的または用途に使用することを厳に禁じます。</p>
    <ul class="list-disc list-inside space-y-1 mt-2 ml-4">
      <li>違法なコンテンツの生成・配布・助長</li>
      <li>詐欺・なりすまし・フィッシング・マルウェア配布</li>
      <li>差別・ヘイトスピーチ・ハラスメントを助長するコンテンツの生成</li>
      <li>他者の知的財産権・プライバシー権・名誉を侵害する行為</li>
      <li>Anthropic 利用ポリシーが禁止するあらゆる行為</li>
      <li>日本法またはオペレーターが所在する国・地域の法令に違反する行為</li>
    </ul>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">8. 商標・帰属表示</h3>
    <p>「Claude」および関連ロゴは Anthropic, Inc. の商標または登録商標です。「NENE2」は本ソフトウェアが依存する内部フレームワークの名称です。本ソフトウェアは Anthropic とは独立したプロジェクトであり、Anthropic による推薦・保証・承認を受けていません。</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">9. 本規約の変更</h3>
    <p>本免責事項および利用規約は、予告なく変更される場合があります。最新版は常に本ソフトウェアの <a href="${GH_URL}" target="_blank" rel="noopener" class="text-violet-700 underline">GitHub リポジトリ</a> でご確認ください。継続的な利用をもって最新版の規約への同意とみなします。</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">10. 準拠法・管轄</h3>
    <p>本規約の解釈および適用は、日本法に準拠します。本ソフトウェアの利用に起因する紛争については、当事者間で誠実に協議するものとし、協議によって解決しない場合は適切な管轄裁判所に持ち込むものとします。なお、本ソフトウェアは MIT ライセンスで配布されるため、利用者は個別の法域の強行法規の適用を受ける場合があります。</p>
  </section>
</div>`,

  en: `
<div class="space-y-6 text-sm text-gray-700 leading-relaxed">
  <p class="text-base font-medium text-gray-900">Please read this Disclaimer and Terms of Use ("Terms") before using the software. By using NeNe Corpus, you agree to be bound by these Terms.</p>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">1. No Warranty (MIT License)</h3>
    <p>NeNe Corpus ("the Software") is open source software provided under the <strong>MIT License</strong>. THE SOFTWARE IS PROVIDED <strong>"AS IS"</strong>, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">2. Limitation of Liability</h3>
    <p>To the maximum extent permitted by applicable law, in no event shall the copyright holders or contributors be liable for any direct, indirect, incidental, special, exemplary, or consequential damages (including, but not limited to, procurement of substitute goods or services; loss of use, data, or profits; or business interruption) however caused and on any theory of liability, whether in contract, strict liability, or tort (including negligence or otherwise) arising in any way out of the use of this software, even if advised of the possibility of such damage.</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">3. Accuracy of AI-Generated Responses</h3>
    <p>The chat feature of this Software returns responses generated automatically by a large language model (LLM). AI-generated responses may contain factual errors, incomplete information, or outdated content (commonly referred to as "hallucinations"). <strong>Do not rely solely on the Software's responses for medical, legal, financial, investment, safety, or other professional decisions.</strong> Always verify critical information against primary sources or qualified professionals.</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">4. Third-Party Service Dependency (Anthropic Claude API)</h3>
    <p>This Software relies on the Claude API provided by Anthropic, Inc. ("Anthropic"). The copyright holders of this Software are not responsible for:</p>
    <ul class="list-disc list-inside space-y-1 mt-2 ml-4">
      <li>Availability, performance, or interruption of Anthropic services</li>
      <li>Changes to Anthropic API pricing</li>
      <li>Changes in Claude model response quality or content</li>
      <li>Restrictions resulting from changes to Anthropic's usage policies</li>
    </ul>
    <p class="mt-2">Use of the Claude API is separately subject to Anthropic's <a href="https://www.anthropic.com/legal/usage-policy" target="_blank" rel="noopener" class="text-violet-700 underline">Usage Policy</a> and <a href="https://www.anthropic.com/legal/consumer-terms" target="_blank" rel="noopener" class="text-violet-700 underline">Terms of Service</a>.</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">5. Data Handling and Privacy</h3>
    <p>This Software is self-hosted. Corpus data and chat history are stored in a <strong>MySQL database on the Operator's own server</strong>. However, chat query content is transmitted to Anthropic's API servers for AI inference.</p>
    <p class="mt-2">Operators are solely responsible for:</p>
    <ul class="list-disc list-inside space-y-1 mt-2 ml-4">
      <li>Compliance with applicable data protection laws (including GDPR, CCPA, etc.)</li>
      <li>Providing a Privacy Policy to end users and obtaining consent where required</li>
      <li>Appropriate retention, management, and deletion of chat logs</li>
      <li>Notifying users that their queries may be transmitted to third-party AI services</li>
    </ul>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">6. Operator Responsibilities</h3>
    <p>The Operator (the person or entity installing and running the Software) is solely responsible for:</p>
    <ul class="list-disc list-inside space-y-1 mt-2 ml-4">
      <li>Establishing and communicating Terms of Use and Privacy Policy to end users</li>
      <li>Compliance with all applicable laws and regulations in the Operator's jurisdiction</li>
      <li>Payment of Anthropic API usage fees (pay-per-use)</li>
      <li>Responding to security incidents (unauthorized access, data breaches, etc.)</li>
      <li>Ensuring the legality of content displayed via the widget and non-infringement of third-party rights</li>
      <li>Any required age verification or child protection measures</li>
    </ul>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">7. Prohibited Uses</h3>
    <p>Use of this Software for the following purposes is strictly prohibited:</p>
    <ul class="list-disc list-inside space-y-1 mt-2 ml-4">
      <li>Generating, distributing, or facilitating illegal content</li>
      <li>Fraud, impersonation, phishing, or malware distribution</li>
      <li>Generating content that promotes discrimination, hate speech, or harassment</li>
      <li>Infringing intellectual property rights, privacy rights, or reputational rights of others</li>
      <li>Any activity prohibited by Anthropic's Usage Policy</li>
      <li>Any activity in violation of applicable laws in the Operator's jurisdiction</li>
    </ul>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">8. Trademarks and Attribution</h3>
    <p>"Claude" and related logos are trademarks or registered trademarks of Anthropic, Inc. "NENE2" refers to the internal framework upon which this Software depends. This Software is an independent project and is not endorsed, sponsored, or affiliated with Anthropic.</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">9. Changes to These Terms</h3>
    <p>These Terms may be updated without prior notice. The latest version is always available in the <a href="${GH_URL}" target="_blank" rel="noopener" class="text-violet-700 underline">GitHub repository</a>. Continued use of the Software constitutes acceptance of the updated Terms.</p>
  </section>
</div>`,

  de: `
<div class="space-y-6 text-sm text-gray-700 leading-relaxed">
  <p class="text-base font-medium text-gray-900">Bitte lesen Sie diesen Haftungsausschluss und diese Nutzungsbedingungen ("Bedingungen"), bevor Sie die Software verwenden. Durch die Nutzung von NeNe Corpus stimmen Sie diesen Bedingungen zu.</p>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">1. Keine Gewährleistung (MIT-Lizenz)</h3>
    <p>NeNe Corpus wird unter der <strong>MIT-Lizenz</strong> als Open-Source-Software bereitgestellt. DIE SOFTWARE WIRD <strong>„WIE BESEHEN"</strong> OHNE JEGLICHE AUSDRÜCKLICHE ODER STILLSCHWEIGENDE GEWÄHRLEISTUNG BEREITGESTELLT, EINSCHLIESSLICH, ABER NICHT BESCHRÄNKT AUF DIE GEWÄHRLEISTUNG DER MARKTGÄNGIGKEIT, DER EIGNUNG FÜR EINEN BESTIMMTEN ZWECK UND DER NICHTVERLETZUNG VON RECHTEN DRITTER.</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">2. Haftungsbeschränkung</h3>
    <p>In keinem Fall haften die Urheberrechtsinhaber oder Mitwirkenden für direkte, indirekte, zufällige, besondere, exemplarische oder Folgeschäden (einschließlich Datenverlust, Geschäftsunterbrechung oder entgangene Gewinne), die sich aus der Nutzung oder Unmöglichkeit der Nutzung dieser Software ergeben, selbst wenn auf die Möglichkeit solcher Schäden hingewiesen wurde.</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">3. Genauigkeit KI-generierter Antworten</h3>
    <p>Die Chat-Funktion gibt automatisch von einem LLM generierte Antworten zurück. Diese können sachliche Fehler oder veraltete Informationen enthalten. <strong>Verwenden Sie die Antworten der Software nicht als alleinige Grundlage für medizinische, rechtliche, finanzielle oder sicherheitsrelevante Entscheidungen.</strong></p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">4. Abhängigkeit von Drittanbieterdiensten (Anthropic Claude API)</h3>
    <p>Diese Software nutzt die Claude API von Anthropic, Inc. Die Urheberrechtsinhaber haften nicht für Verfügbarkeit, Preisänderungen oder Qualitätsveränderungen des Anthropic-Dienstes. Die Nutzung der Claude API unterliegt separat Anthropics <a href="https://www.anthropic.com/legal/usage-policy" target="_blank" rel="noopener" class="text-violet-700 underline">Nutzungsrichtlinie</a>.</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">5. Datenverarbeitung und Datenschutz</h3>
    <p>Diese Software ist selbstgehostet. Corpus-Daten und Chat-Verlauf werden in der MySQL-Datenbank des Betreibers gespeichert. Chat-Anfragen werden jedoch für die KI-Inferenz an Anthropic-Server übertragen. Der Betreiber ist allein verantwortlich für die Einhaltung der DSGVO und anderer anwendbarer Datenschutzgesetze.</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">6. Verantwortlichkeiten des Betreibers</h3>
    <p>Der Betreiber ist allein verantwortlich für die Einhaltung aller anwendbaren Gesetze, die Zahlung von Anthropic-API-Nutzungsgebühren, die Reaktion auf Sicherheitsvorfälle sowie die Gewährleistung der Rechtmäßigkeit der über das Widget angezeigten Inhalte.</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">7. Verbotene Nutzung</h3>
    <p>Die Nutzung für illegale Inhalte, Betrug, Hassrede, Verletzung von Rechten Dritter oder für Aktivitäten, die gegen Anthropics Nutzungsrichtlinie oder anwendbares Recht verstoßen, ist strengstens untersagt.</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">8. Änderungen dieser Bedingungen</h3>
    <p>Diese Bedingungen können ohne Vorankündigung aktualisiert werden. Die neueste Version ist stets im <a href="${GH_URL}" target="_blank" rel="noopener" class="text-violet-700 underline">GitHub-Repository</a> verfügbar.</p>
  </section>
</div>`,

  fr: `
<div class="space-y-6 text-sm text-gray-700 leading-relaxed">
  <p class="text-base font-medium text-gray-900">Veuillez lire cet avertissement et ces conditions d'utilisation avant d'utiliser le logiciel. En utilisant NeNe Corpus, vous acceptez d'être lié(e) par ces conditions.</p>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">1. Absence de garantie (Licence MIT)</h3>
    <p>NeNe Corpus est un logiciel open source fourni sous <strong>licence MIT</strong>. LE LOGICIEL EST FOURNI <strong>« EN L'ÉTAT »</strong>, SANS GARANTIE D'AUCUNE SORTE, EXPRESSE OU IMPLICITE, NOTAMMENT SANS GARANTIE DE QUALITÉ MARCHANDE, D'ADÉQUATION À UN USAGE PARTICULIER ET D'ABSENCE DE CONTREFAÇON.</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">2. Limitation de responsabilité</h3>
    <p>En aucun cas, les auteurs ou titulaires du droit d'auteur ne pourront être tenus responsables de tout dommage direct, indirect, accidentel, spécial ou consécutif résultant de l'utilisation ou de l'impossibilité d'utiliser ce logiciel, même si avertis de la possibilité de tels dommages.</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">3. Exactitude des réponses générées par l'IA</h3>
    <p>La fonction de chat génère des réponses automatiques via un LLM pouvant contenir des erreurs factuelles ou des informations obsolètes. <strong>Ne vous fiez pas uniquement aux réponses du logiciel pour des décisions médicales, juridiques, financières ou de sécurité.</strong></p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">4. Dépendance aux services tiers (API Claude d'Anthropic)</h3>
    <p>Ce logiciel utilise l'API Claude d'Anthropic, Inc. L'utilisation de l'API Claude est soumise séparément à la <a href="https://www.anthropic.com/legal/usage-policy" target="_blank" rel="noopener" class="text-violet-700 underline">politique d'utilisation</a> d'Anthropic. Les titulaires du droit d'auteur déclinent toute responsabilité pour la disponibilité, les changements de prix ou la qualité du service Anthropic.</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">5. Traitement des données et protection de la vie privée</h3>
    <p>Ce logiciel est auto-hébergé. Les données du corpus et l'historique des chats sont stockés dans la base de données MySQL de l'opérateur. Les requêtes de chat sont transmises aux serveurs Anthropic pour l'inférence IA. L'opérateur est seul responsable de la conformité au RGPD et aux autres lois applicables sur la protection des données.</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">6. Responsabilités de l'opérateur</h3>
    <p>L'opérateur est seul responsable du respect de toutes les lois applicables, du paiement des frais d'utilisation de l'API Anthropic, de la réponse aux incidents de sécurité et de la légalité des contenus affichés via le widget.</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">7. Utilisations interdites</h3>
    <p>L'utilisation à des fins de contenus illégaux, de fraude, de discours haineux, de violation de droits de tiers, ou d'activités interdites par la politique d'utilisation d'Anthropic ou la loi applicable est strictement prohibée.</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">8. Modifications des présentes conditions</h3>
    <p>Ces conditions peuvent être mises à jour sans préavis. La dernière version est disponible dans le <a href="${GH_URL}" target="_blank" rel="noopener" class="text-violet-700 underline">dépôt GitHub</a>.</p>
  </section>
</div>`,

  'zh-hans': `
<div class="space-y-6 text-sm text-gray-700 leading-relaxed">
  <p class="text-base font-medium text-gray-900">在使用本软件之前，请阅读本免责声明和使用条款（"条款"）。使用 NeNe Corpus 即表示您同意受本条款约束。</p>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">1. 无保证声明（MIT 许可证）</h3>
    <p>NeNe Corpus 是根据 <strong>MIT 许可证</strong>提供的开源软件。本软件<strong>按"原样"</strong>提供，不提供任何明示或暗示的保证，包括但不限于适销性、特定用途适用性和不侵权的保证。</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">2. 责任限制</h3>
    <p>在任何情况下，版权持有人或贡献者均不对因使用或无法使用本软件而产生的任何直接、间接、偶然、特殊、惩罚性或后果性损害承担责任，即使已被告知此类损害的可能性。</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">3. AI 生成回答的准确性</h3>
    <p>本软件的聊天功能通过大型语言模型自动生成回答，可能包含事实错误或过时信息（即"幻觉"）。<strong>请勿将本软件的回答单独用作医疗、法律、财务、投资或安全等专业决策的依据。</strong></p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">4. 对第三方服务的依赖（Anthropic Claude API）</h3>
    <p>本软件使用 Anthropic, Inc. 提供的 Claude API。版权持有人不对 Anthropic 服务的可用性、价格变化或质量变化负责。Claude API 的使用须单独遵守 Anthropic 的<a href="https://www.anthropic.com/legal/usage-policy" target="_blank" rel="noopener" class="text-violet-700 underline">使用政策</a>。</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">5. 数据处理与隐私保护</h3>
    <p>本软件为自托管型。语料库数据和聊天历史存储在运营者自己的 MySQL 数据库中。聊天查询内容将发送至 Anthropic API 服务器进行 AI 推理。运营者单独负责遵守适用的数据保护法律（包括 GDPR、个人信息保护相关法律等）。</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">6. 运营者责任</h3>
    <p>运营者单独负责遵守所有适用法律、支付 Anthropic API 使用费用、应对安全事件以及确保通过 Widget 显示的内容的合法性。</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">7. 禁止用途</h3>
    <p>严禁将本软件用于非法内容、欺诈、仇恨言论、侵犯他人权利或违反 Anthropic 使用政策或适用法律的活动。</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">8. 条款变更</h3>
    <p>本条款可能在不事先通知的情况下更新。最新版本始终可在 <a href="${GH_URL}" target="_blank" rel="noopener" class="text-violet-700 underline">GitHub 仓库</a>中查阅。</p>
  </section>
</div>`,

  'pt-br': `
<div class="space-y-6 text-sm text-gray-700 leading-relaxed">
  <p class="text-base font-medium text-gray-900">Leia este Aviso Legal e Termos de Uso ("Termos") antes de usar o software. Ao usar o NeNe Corpus, você concorda em estar vinculado(a) por estes Termos.</p>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">1. Sem Garantia (Licença MIT)</h3>
    <p>NeNe Corpus é software de código aberto fornecido sob a <strong>Licença MIT</strong>. O SOFTWARE É FORNECIDO <strong>"NO ESTADO EM QUE SE ENCONTRA"</strong>, SEM GARANTIA DE QUALQUER TIPO, EXPRESSA OU IMPLÍCITA, INCLUINDO MAS NÃO SE LIMITANDO ÀS GARANTIAS DE COMERCIALIZAÇÃO, ADEQUAÇÃO A UM PROPÓSITO ESPECÍFICO E NÃO VIOLAÇÃO.</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">2. Limitação de Responsabilidade</h3>
    <p>Em nenhuma hipótese os detentores dos direitos autorais ou contribuidores serão responsáveis por danos diretos, indiretos, incidentais, especiais, exemplares ou consequenciais resultantes do uso ou incapacidade de uso deste software, mesmo se avisados da possibilidade de tais danos.</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">3. Precisão das Respostas Geradas por IA</h3>
    <p>A função de chat retorna respostas geradas automaticamente por um LLM que podem conter erros factuais ou informações desatualizadas. <strong>Não confie nas respostas do Software como base única para decisões médicas, jurídicas, financeiras ou de segurança.</strong></p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">4. Dependência de Serviços de Terceiros (API Claude da Anthropic)</h3>
    <p>Este Software usa a API Claude da Anthropic, Inc. O uso da API Claude está sujeito separadamente à <a href="https://www.anthropic.com/legal/usage-policy" target="_blank" rel="noopener" class="text-violet-700 underline">Política de Uso</a> da Anthropic. Os detentores dos direitos autorais não se responsabilizam pela disponibilidade, mudanças de preço ou qualidade do serviço Anthropic.</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">5. Tratamento de Dados e Privacidade</h3>
    <p>Este Software é auto-hospedado. Dados do corpus e histórico de chat são armazenados no banco de dados MySQL do Operador. As consultas de chat são transmitidas aos servidores da Anthropic para inferência de IA. O Operador é exclusivamente responsável pela conformidade com a LGPD e outras leis de proteção de dados aplicáveis.</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">6. Responsabilidades do Operador</h3>
    <p>O Operador é exclusivamente responsável pelo cumprimento de todas as leis aplicáveis, pagamento das taxas de uso da API Anthropic, resposta a incidentes de segurança e garantia da legalidade do conteúdo exibido via widget.</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">7. Usos Proibidos</h3>
    <p>É estritamente proibido usar este Software para conteúdo ilegal, fraude, discurso de ódio, violação de direitos de terceiros ou atividades proibidas pela Política de Uso da Anthropic ou pela legislação aplicável.</p>
  </section>

  <section>
    <h3 class="font-semibold text-gray-900 mb-2">8. Alterações nestes Termos</h3>
    <p>Estes Termos podem ser atualizados sem aviso prévio. A versão mais recente está sempre disponível no <a href="${GH_URL}" target="_blank" rel="noopener" class="text-violet-700 underline">repositório GitHub</a>.</p>
  </section>
</div>`,
};

// ── HTML ページ生成 ──────────────────────────────────────────────────────────

function buildPage(locale, msgs, allLocales) {
  const t = (key) => msgs[key] ?? key;

  const langLinks = allLocales
    .map(({ id, label }) =>
      id === locale.id
        ? `<span class="font-semibold text-violet-200">${label}</span>`
        : `<a href="../${id}/" class="hover:text-white transition-colors text-violet-300">${label}</a>`
    )
    .join('<span class="text-violet-600 mx-1 text-xs">|</span>');

  const stepItems = (prefix, count) =>
    Array.from({ length: count }, (_, i) => {
      const n = i + 1;
      const isLast = n === count;
      return `
        <div class="relative flex gap-5${isLast ? '' : ' pb-8'}">
          ${isLast ? '' : `<div class="absolute left-5 top-10 bottom-0 w-0.5 bg-violet-100" aria-hidden="true"></div>`}
          <div class="flex-none w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md">${n}</div>
          <div class="pt-1.5 min-w-0">
            <h3 class="font-semibold text-gray-900 mb-1 text-base">${t(`${prefix}.step${n}.title`)}</h3>
            <p class="text-gray-600 text-sm leading-relaxed">${t(`${prefix}.step${n}.desc`)}</p>
            ${(prefix === 'forAdmin' && n === 4) ? `
            <div class="mt-4">
              <p class="text-xs text-gray-500 mb-2 font-medium">${t('forAdmin.embedCaption')}</p>
              <pre class="rounded-xl bg-gray-900 text-violet-300 text-xs p-4 overflow-x-auto leading-relaxed font-mono shadow-inner"><code>&lt;script
  src="https://your-domain.com/widget.js"
  data-nene-corpus
&gt;&lt;/script&gt;</code></pre>
            </div>` : ''}
          </div>
        </div>`;
    }).join('');

  const howItWorksSteps = Array.from({ length: 5 }, (_, i) => {
    const n = i + 1;
    const icons = ['📄', '⚙️', '💬', '🔍', '✅'];
    const colors = ['bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-green-100 text-green-700'];
    return `
      <div class="flex flex-col items-center text-center px-2">
        <div class="w-14 h-14 rounded-2xl ${colors[i]} flex items-center justify-center text-2xl mb-3 shadow-sm">${icons[i]}</div>
        <div class="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold mb-2 shadow">${n}</div>
        <h3 class="font-semibold text-gray-900 text-sm mb-1">${t(`howItWorks.step${n}.title`)}</h3>
        <p class="text-gray-500 text-xs leading-relaxed">${t(`howItWorks.step${n}.desc`)}</p>
      </div>`;
  });

  const arrowSvg = `<svg class="w-5 h-5 text-gray-300 self-center hidden sm:block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>`;

  const howItWorksRow = howItWorksSteps.flatMap((step, i) =>
    i < howItWorksSteps.length - 1 ? [step, arrowSvg] : [step]
  ).join('');

  const faqItems = Array.from({ length: 6 }, (_, i) => {
    const n = i + 1;
    return `
      <details class="group border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow transition-shadow">
        <summary class="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer font-medium text-gray-900 select-none list-none hover:bg-gray-50 transition-colors">
          <span class="text-sm">${t(`faq.${n}.q`)}</span>
          <span class="text-gray-400 text-2xl leading-none font-light transition-transform duration-200 group-open:rotate-45 shrink-0">+</span>
        </summary>
        <div class="px-6 pb-5 pt-2 text-sm text-gray-600 leading-relaxed border-t border-gray-100">
          ${t(`faq.${n}.a`)}
        </div>
      </details>`;
  }).join('');

  const trustItems = [1,2,3,4].map(n => `
    <div class="flex items-center gap-2">
      <svg class="w-4 h-4 text-violet-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
      <span>${t(`trust.${n}`)}</span>
    </div>`).join('');

  return `<!doctype html>
<html lang="${locale.lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${t('meta.title')}</title>
  <meta name="description" content="${t('meta.description')}" />
  <meta property="og:title" content="${t('meta.title')}" />
  <meta property="og:description" content="${t('meta.description')}" />
  <meta property="og:type" content="website" />
  <link rel="preconnect" href="https://cdn.tailwindcss.com" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { sans: ['system-ui','-apple-system','BlinkMacSystemFont','Segoe UI','sans-serif'] },
          animation: { 'fade-up': 'fadeUp 0.6s ease-out forwards' },
          keyframes: { fadeUp: { '0%':{ opacity:'0', transform:'translateY(20px)' }, '100%':{ opacity:'1', transform:'translateY(0)' } } },
        },
      },
    };
  </script>
  <style>
    html { scroll-behavior: smooth; }
    .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
    .reveal.visible { opacity: 1; transform: translateY(0); }
    .reveal-delay-1 { transition-delay: 0.1s; }
    .reveal-delay-2 { transition-delay: 0.2s; }
    .reveal-delay-3 { transition-delay: 0.3s; }
    details summary::-webkit-details-marker { display: none; }
    pre code { font-family: 'Menlo','Monaco','Consolas','Courier New',monospace; }
  </style>
</head>
<body class="bg-white text-gray-900 antialiased">

  <!-- ── ヘッダー ── -->
  <header class="sticky top-0 z-50 bg-violet-950/95 backdrop-blur-md border-b border-violet-800/50">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
      <a href="#" class="font-bold text-white text-lg tracking-tight flex items-center gap-2">
        <span class="text-violet-400">◆</span>${t('nav.home')}
      </a>
      <nav class="hidden sm:flex items-center gap-5 text-sm text-violet-300">
        <a href="#for-admin" class="hover:text-white transition-colors">${t('nav.forAdmin')}</a>
        <a href="#for-user"  class="hover:text-white transition-colors">${t('nav.forUser')}</a>
        <a href="#faq"       class="hover:text-white transition-colors">${t('nav.faq')}</a>
        <a href="#disclaimer" class="hover:text-white transition-colors">${t('nav.disclaimer')}</a>
      </nav>
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs justify-end">
        ${langLinks}
      </div>
    </div>
  </header>

  <main>

    <!-- ── Hero ── -->
    <section class="relative overflow-hidden bg-gradient-to-br from-violet-950 via-violet-900 to-indigo-900 text-white">
      <div class="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div class="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl"></div>
        <div class="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/5 blur-3xl"></div>
      </div>
      <div class="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-36">
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span class="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-violet-400/20 border border-violet-400/30 text-violet-200 text-sm font-medium">
              <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              ${t('hero.badge')}
            </span>
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-6 tracking-tight">
              ${t('hero.title')}
            </h1>
            <p class="text-base sm:text-lg text-violet-200 mb-8 leading-relaxed max-w-lg">
              ${t('hero.subtitle')}
            </p>
            <div class="flex flex-col sm:flex-row gap-3 mb-10">
              <a href="#for-admin"
                 class="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-violet-700 font-semibold hover:bg-violet-50 transition-all shadow-lg hover:shadow-xl text-sm">
                ${t('hero.cta')}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </a>
              <a href="../../admin/"
                 class="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-violet-800/50 text-white font-semibold hover:bg-violet-700/50 transition-all border border-violet-600/40 text-sm">
                ${t('hero.ctaAdmin')}
              </a>
            </div>
            <div class="flex flex-wrap gap-x-5 gap-y-2 text-sm text-violet-300">
              ${trustItems}
            </div>
          </div>
          <div class="hidden lg:flex justify-center lg:justify-end">
            <div class="w-72 drop-shadow-2xl">${SVG.widgetPreview}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Features ── -->
    <section id="features" class="py-20 sm:py-24 bg-gray-50">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-12 reveal">
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">${t('features.title')}</h2>
          <p class="text-gray-500 max-w-xl mx-auto">${t('features.subtitle')}</p>
        </div>
        <div class="grid sm:grid-cols-3 gap-6 lg:gap-8">
          ${[
            { n:1, svg: SVG.corpus },
            { n:2, svg: SVG.chat },
            { n:3, svg: SVG.embed },
          ].map(({ n, svg }, i) => `
          <div class="reveal reveal-delay-${i+1} bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 duration-300">
            <div class="w-28 h-28 mx-auto mb-5">${svg}</div>
            <h3 class="font-bold text-gray-900 text-lg mb-3 text-center">${t(`features.${n}.title`)}</h3>
            <p class="text-gray-500 text-sm leading-relaxed text-center">${t(`features.${n}.desc`)}</p>
          </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- ── How It Works ── -->
    <section id="how-it-works" class="py-20 sm:py-24 bg-white">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-12 reveal">
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">${t('howItWorks.title')}</h2>
          <p class="text-gray-500 max-w-xl mx-auto">${t('howItWorks.subtitle')}</p>
        </div>
        <div class="relative">
          <div class="hidden sm:flex items-start justify-between gap-2">
            ${howItWorksRow}
          </div>
          <div class="sm:hidden space-y-6">
            ${Array.from({length:5},(_,i)=>{
              const n=i+1;
              const icons=['📄','⚙️','💬','🔍','✅'];
              return `<div class="flex gap-4 items-start">
                <div class="flex flex-col items-center shrink-0">
                  <div class="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-xl">${icons[i]}</div>
                  ${i<4?'<div class="w-0.5 h-6 bg-violet-100 mt-2"></div>':''}
                </div>
                <div class="pt-2">
                  <div class="text-xs font-bold text-violet-600 mb-0.5">STEP ${n}</div>
                  <h3 class="font-semibold text-gray-900 text-sm mb-1">${t(`howItWorks.step${n}.title`)}</h3>
                  <p class="text-gray-500 text-xs leading-relaxed">${t(`howItWorks.step${n}.desc`)}</p>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    </section>

    <!-- ── For Admin ── -->
    <section id="for-admin" class="py-20 sm:py-24 bg-gradient-to-b from-violet-50 to-white">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div class="reveal">
            <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">${t('forAdmin.title')}</h2>
            <p class="text-gray-500 mb-8">${t('forAdmin.subtitle')}</p>
            <div>${stepItems('forAdmin', 4)}</div>
          </div>
          <div class="reveal reveal-delay-1 hidden lg:block">
            <div class="sticky top-24 bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
              <div class="text-center text-gray-400 text-5xl mb-4">🗂️</div>
              <div class="space-y-3">
                ${['🔑 Anthropic API Key', '📁 sources/', '🤖 claude-3-5-haiku', '🌐 widget.js'].map((item, i) => `
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm">
                  <span class="text-base">${item.split(' ')[0]}</span>
                  <span class="text-gray-700 font-mono text-xs">${item.split(' ').slice(1).join(' ')}</span>
                  <svg class="w-4 h-4 text-green-500 ml-auto shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                </div>`).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── For Users ── -->
    <section id="for-user" class="py-20 sm:py-24 bg-white">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div class="order-2 lg:order-1 flex justify-center">
            <div class="w-64 sm:w-72 drop-shadow-xl reveal">${SVG.widgetPreview}</div>
          </div>
          <div class="order-1 lg:order-2 reveal reveal-delay-1">
            <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">${t('forUser.title')}</h2>
            <p class="text-gray-500 mb-8">${t('forUser.subtitle')}</p>
            <div>${stepItems('forUser', 3)}</div>
            <div class="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
              ${t('forUser.note')}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── FAQ ── -->
    <section id="faq" class="py-20 sm:py-24 bg-gray-50">
      <div class="max-w-3xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-10 reveal">
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">${t('faq.title')}</h2>
        </div>
        <div class="space-y-3 reveal">
          ${faqItems}
        </div>
      </div>
    </section>

    <!-- ── Disclaimer ── -->
    <section id="disclaimer" class="py-20 sm:py-24 bg-white border-t border-gray-200">
      <div class="max-w-3xl mx-auto px-4 sm:px-6">
        <div class="mb-8 reveal">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <h2 class="text-xl sm:text-2xl font-bold text-gray-900">${t('disclaimer.title')}</h2>
          </div>
        </div>
        <div class="reveal bg-gray-50 rounded-2xl border border-gray-200 p-6 sm:p-8">
          ${DISCLAIMER[locale.id]}
        </div>
      </div>
    </section>

  </main>

  <!-- ── Footer ── -->
  <footer class="bg-violet-950 text-violet-300 py-12">
    <div class="max-w-6xl mx-auto px-4 sm:px-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="text-violet-400">◆</span>
            <span class="text-white font-bold">NeNe Corpus</span>
          </div>
          <p class="text-sm text-violet-400">${t('footer.poweredBy')} · ${t('footer.copyright')} ${t('footer.rights')}</p>
        </div>
        <div class="flex flex-wrap items-center gap-4 text-sm">
          <a href="${GH_URL}" target="_blank" rel="noopener"
             class="flex items-center gap-1.5 hover:text-white transition-colors">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            ${t('footer.github')}
          </a>
          <span class="text-violet-700">·</span>
          <span>${t('footer.license')}</span>
          <span class="text-violet-700">·</span>
          <a href="#" class="hover:text-white transition-colors">${t('footer.backToTop')} ↑</a>
        </div>
      </div>
    </div>
  </footer>

  <script>
    // スクロールアニメーション
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  </script>
</body>
</html>`;
}

// ── language detection index.html ────────────────────────────────────────────

function buildIndex() {
  return `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>NeNe Corpus — Guide</title>
  <script>
    (function () {
      var l = (navigator.language || 'en').toLowerCase();
      var locale = 'en';
      if (l.startsWith('ja')) locale = 'ja';
      else if (l.startsWith('de')) locale = 'de';
      else if (l.startsWith('fr')) locale = 'fr';
      else if (l.startsWith('zh')) locale = 'zh-hans';
      else if (l.startsWith('pt')) locale = 'pt-br';
      window.location.replace(locale + '/');
    })();
  </script>
</head>
<body></body>
</html>`;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  fs.writeFileSync(path.join(OUT, 'index.html'), buildIndex(), 'utf8');
  console.log('✓ guide/index.html');

  for (const locale of LOCALES) {
    const mod  = await import(`./guide-locales/${locale.id}.mjs`);
    const msgs = mod.default;
    const dir  = path.join(OUT, locale.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), buildPage(locale, msgs, LOCALES), 'utf8');
    console.log(`✓ guide/${locale.id}/index.html`);
  }

  console.log('\n✅ guide pages generated →', OUT);
}

main().catch((err) => { console.error(err); process.exit(1); });
