# ADR 0007: 検索バックエンドを NeNe Recall に差し替え可能にする（設定で切替・未設定なら従来の LIKE 検索）

## Status

Accepted（2026-09-03）— 施主判断で PR #393 が main にマージされた（`ba3343a`・2026-09-03）。

## Context

`ChunkSearchRepositoryInterface::search()` の唯一の実装 `PdoChunkSearchRepository` は、空白区切りの語の `LIKE` 一致数を
スコアにする検索である。意味の近い言い換えは拾えず、Claude ツール `search_corpus` の根拠の質を制限している。

[NeNe Recall](https://github.com/hideyukiMORI/nene-recall)（Go・自己ホスト・費用0円）は、ベクトル類似度と語彙一致の
ハイブリッド検索を HTTP API で提供する。日本語の評価セット（259 チャンク・58 クエリ）で `recall@10` は LIKE 相当の語彙のみ 0.62 に対し
ハイブリッド 0.72（Recall 側 ADR 0015）。Recall 側の契約は Recall ADR 0020 で確定した（`external_id`・文書単位の削除・Bearer・同期書き込み）。

Corpus 側の制約:
- 依存方向は「Corpus → 上流 API」（ADR 0002）。Recall は Corpus を呼ばない
- 設定は `.env`（ADR 0004）。`NeneRecordsConfig` / `AnthropicConfig` と同じ `fromEnvironment()` / `isConfigured()` の型
- 層規約: UseCase から生 HTTP を呼ばない。SQL は `Pdo*Repository` の中だけ。**Repository の禁止事項に HTTP がある**
- 全 Repository は org scoped。`RequestScopedOrgIdHolder::getId()` から取る
- 用語: chunk を "embedding row" と呼ばない

## Decision

### 1. `src/Recall/` に上流クライアント層を置く（`src/Upstream/` と同じ位置づけ）

- `RecallConfig`（`NENE_RECALL_BASE_URL` / `NENE_RECALL_BEARER_TOKEN` / `NENE_RECALL_TIMEOUT_SECONDS`（既定 10）/ `NENE_RECALL_SEARCH_ALPHA`（任意）/
  `NENE_RECALL_STRICT`（既定 0））。`isConfigured()` は base URL の有無。
- `RecallClientInterface`（`search(int $orgId, string $query, int $limit): list<RecallSearchHit>`、`putChunks(int $orgId, list<RecallChunkInput>): void`、
  `deleteByDocument(int $orgId, int $documentId): void`、`deleteBySource(int $orgId, int $sourceId): void`）。
- `HttpRecallClient`（curl・タイムアウト・Bearer・非 2xx と接続失敗は `RecallUnavailableException`）と `NullRecallClient`（未設定時）。
  🔴 HTTP の実行だけを `RecallHttpTransportInterface`（`post/delete(url, headers, body): RecallHttpResponse`）に分離し、テストで差し替える
  （`HttpNeneRecordsClient` にテストが無い原因が「差し替え点が無いこと」だった）。

### 2. 検索は `RecallChunkSearchRepository implements ChunkSearchRepositoryInterface`

**層規約との整合**: この Repository は SQL を持たず、`RecallClientInterface`（上流層）と `PdoChunkSearchGuard`（`Pdo*` 層・生存フィルタ）を
合成する。「Repository が HTTP を直接叩く」のではなく「上流クライアントを呼ぶ」。表の禁止事項（Repository の HTTP 直叩き）には触れない。
CLAUDE.md の層の表に「Repository は上流クライアント interface を呼んでよい」を1行足す（本 ADR が根拠）。

- org は `RequestScopedOrgIdHolder::getId()`。未解決は既存と同じ `LogicException`。
- Recall の結果（`external_id` = Corpus の `chunks.id`）を `PdoChunkSearchGuard::filterAlive(list<int> $chunkIds): array<int, Chunk>` に通す。
  1本の SQL: `chunks c JOIN sources s ON … AND s.is_deleted = 0 AND s.status = 'ready' JOIN documents d ON … AND d.is_deleted = 0 WHERE c.id IN (…) AND c.organization_id = ?`。
  🔴 **二段フィルタは soft delete に加えて取り込み状態も見る**（#394 で追加）。取り込みは chunk を書いてから
  status を Ready に上げるので、失敗した source は半端な chunk 行を持ったまま `failed` で残る。
  条件の実体は `SourceStatus::SEARCHABLE_SOURCE_SQL` の1箇所で、`PdoChunkSearchRepository` と
  `PdoRecallReindexReader::listAliveChunks` も同じ定数を使う。
  返る `Chunk` は DB 行（`createdAt`/`updatedAt`/`tokenCount` が埋まる）。id をキーにした配列で返し、Recall の順位は呼び出し側が
  `ChunkSearchResult(chunk, score)` の並びとして復元する。
  🔴 **org を引数で受け取らず、ガード自身が `RequestScopedOrgIdHolder` から引く。** CLAUDE.md の絶対禁止パターンに
  「`Pdo*Repository` で `RequestScopedOrgIdHolder` を経由しない SQL」があり、org を引数にすると
  「どこかで正しい org が渡されている」という前提が SQL の外に出てしまう。同一リクエスト内で holder は1つなので、
  検索要求に使う org とフィルタの org がずれることはない。
- **`external_id` が無い結果（Recall 単体で投入された行）は捨てる**（Corpus の chunk ではない）。
- 失敗時: `RecallUnavailableException` を捕まえ、`NENE_RECALL_STRICT=0` なら `PdoChunkSearchRepository` に**フォールバックして warning ログ**、
  `=1` なら例外をそのまま投げる。

### 3. 同期は `IndexedChunkRepository implements ChunkRepositoryInterface`（デコレータ）

`PdoChunkRepository` を包み、`save()` 後に `putChunks`（`external_id` = 採番された id）、`deleteByDocumentId` / `deleteBySourceId` 後に対応する DELETE。
Recall の失敗は **fail-loud**（`RecallUnavailableException` をそのまま投げる。取り込みは管理操作）。
`CreatePdfSourceUseCase` の `Closure` ファクトリにもデコレータを掛ける（配線点で包む）。

### 4. 再索引コマンド `bin/console recall:reindex [--org=<id>]`

全 chunks（生きている source/document のもの）を Recall へ `putChunks`（1,000 件バッチ・keyset ページング）。Corpus に無い
`external_id` の掃除は Recall 側に一覧 API が無いので **`deleteBySource` を全 source について先に打ってから投入する**
（source 単位で作り直す）。`--org` 省略時は `OrganizationRepositoryInterface::listAll()` の全 org。進捗と件数を stdout。

🔴 **`bin/console` はこの ADR で新設する。** 本リポには CLI の入口が1つも無かった（`tools/*.php` は composer script
から呼ぶ開発者向けの検査で、運用コマンドの置き場ではない）。実体は薄い配線だけにし、引数解釈と処理は
`src/Recall/RecallReindexCommand.php` / `RecallReindexer.php` に置く。あわせて **`bin/console` を
PHPStan と CS-Fixer の対象に追加した**——ゲートの外に置いた入口は、いずれ検査されていないことを忘れられる。

読み取りの SQL は `src/Recall/PdoRecallReindexReader.php`（`Pdo` 接頭辞・holder 経由の org スコープ）。
🔴 **2つのメソッドの絞り込みは意図的に非対称である**（#394）。`listAliveChunks`（投入する側）は `ready` 以外を落とすが、
`listAliveSourceIds`（先に `deleteBySource` を打つ掃除の側）は落とさない。掃除の側を絞ると、
取り込みに失敗した source の chunk が **Recall に残ったまま二度と消えなくなる。**
`ChunkRepositoryInterface` に全走査を足さなかったのは、そこに足すと**全実装（PDO・デコレータ）に、
運用コマンドのためだけのメソッドが増える**からである。再索引は保守作業であって chunk の永続化の契約ではない。

### 5. DI は `SearchServiceProvider` / `ChunkServiceProvider` の設定分岐

`RecallConfig::isConfigured()` なら `RecallChunkSearchRepository` と `IndexedChunkRepository`、でなければ従来どおり。
`UpstreamServiceProvider` / `LlmServiceProvider` と同じ形。Recall 自体の束は `src/Recall/RecallServiceProvider.php`。

🔴 **配線点は2つある。** コンテナの `ChunkRepositoryInterface` 束縛だけでは足りず、
`IngestionServiceProvider::chunkRepositoryFactory()` の `Closure`（トランザクションの executor を受けて
その場で組む経路）にも同じデコレータを掛ける。片方だけ包むと **PDF 取り込みの chunk だけが索引に載らない**——
検索が静かに欠けるだけなので、症状が出るまで気づけない。

## Consequences

- 未設定なら**振る舞いは 1 ミリも変わらない**（従来の LIKE 検索・同期なし）。
- 設定すると `search_corpus` の根拠がハイブリッド検索になり、取り込み時に Recall への往復が増える（取り込み 1 件あたり数十 ms）。
- Recall が落ちていると取り込みは失敗する（fail-loud）。検索はフォールバックする（strict でなければ）。
- `/health` に Recall の到達性を足す（任意・別 Issue でもよい）。
- テスト: `RecallHttpTransportInterface` の fake で HTTP を、SQLite `:memory:` で `PdoChunkSearchGuard` を、`createMock` で UseCase を。
  **org 分離のテスト**（別 org の `external_id` を Recall が返してもガードで落ちる）を必ず含める。

## 却下した選択肢

| 選択肢 | 却下の理由 |
| --- | --- |
| Recall の結果をそのまま `Chunk` に組み立てる（DB を見ない） | soft delete の保険が消える。`createdAt` 等が埋まらない |
| 検索失敗で空を返す（Records クライアントの先例） | Claude が根拠なしで答える。フォールバックの方が正直 |
| Webhook / ポーリング | 依存方向の逆流（ADR 0002）。Recall ADR 0020 の却下表と同じ |
| `PdoChunkRepository` の中に HTTP を書く | 層規約違反。デコレータなら PDO 側は無傷 |
| Guzzle / PSR-18 を導入 | 依存追加。curl で足り、既存2クライアントも標準関数 |

## Related

- Recall ADR 0020（契約の正本）・Recall OpenAPI `docs/openapi/openapi.yaml`
- 本リポ ADR 0002（依存方向）・ADR 0004（設定は `.env`）
- `src/Upstream/HttpNeneRecordsClient.php`・`NeneRecordsConfig.php`（先例）
