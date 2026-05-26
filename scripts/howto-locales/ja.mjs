export default {
  'meta.title': 'セットアップガイド — NeNe Corpus HOWTO',
  'meta.description': 'カフェオーナーのさくらさんといっしょに NeNe Corpus のセットアップを体験。インストールから AI チャット公開まで 4 ステップで完了。',

  'nav.backToGuide': 'ガイドに戻る',

  'persona.name': 'さくら',
  'persona.role': 'カフェオーナー',
  'persona.shopName': 'さくらカフェ',
  'persona.avatar': 'S',

  'hero.badge': 'セットアップガイド · 所要時間 約15分',
  'hero.title': 'ペルソナで学ぶ\nNeNe Corpus セットアップ',
  'hero.subtitle': 'カフェオーナーのさくらさんといっしょに、4 つのステップでウェブサイトに AI チャットを設置してみましょう。',
  'hero.persona.intro': 'はじめまして！さくらカフェを経営しているさくらです。ホームページに AI チャットを設置してみたくて、NeNe Corpus を使ってみることにしました。いっしょにやってみましょう！',
  'hero.cta': 'セットアップをはじめる',

  'steps.title': '4 ステップで完了',
  'steps.subtitle': 'インストールからウィジェット公開まで、さくらさんに付き合いながら進めましょう。',

  'step1.title': 'インストールしよう',
  'step1.persona.speech': 'まずはファイルをサーバーにアップロードするだけ！難しそうに聞こえるけど、FTP でできるから大丈夫よ 😊',
  'step1.item1': 'GitHub の Releases から最新の ZIP をダウンロードします',
  'step1.item2': 'ZIP を展開して、中身を `public_html` にアップロードします',
  'step1.item3': 'ブラウザで `https://あなたのドメイン/install` を開きます',
  'step1.item4': 'データベース接続情報を入力して「インストール実行」をクリックします',

  'step2.title': 'API キーを設定しよう',
  'step2.persona.speech': 'Anthropic のアカウントを作って API キーを取得するだけ。これを設定すれば AI が動くようになるよ ✨',
  'step2.item1': 'Anthropic (console.anthropic.com) でアカウントを作成・ログインします',
  'step2.item2': 'API Keys ページで新しいキーを発行してコピーします',
  'step2.item3': '管理画面 → 設定アイコン → LLM タブを開きます',
  'step2.item4': 'API キーを貼り付けて「接続テスト」→「保存」をクリックします',

  'step3.title': 'コンテンツをアップロードしよう',
  'step3.persona.speech': 'メニュー PDF や FAQ テキストをアップロードするだけ！これが AI が答えてくれるコンテンツになるの 📄',
  'step3.item1': '管理画面 → 「コンテンツ追加」ボタンをクリックします',
  'step3.item2': 'PDF・CSV・テキストファイルを選択してアップロードします',
  'step3.item3': 'ステータスが「完了」になるまで待ちます（数秒〜数分）',
  'step3.item4': 'メニュー・FAQ・店舗情報などを複数まとめて追加できます',

  'step4.title': 'ウィジェットを埋め込もう',
  'step4.persona.speech': 'たった 1 行のコードをコピペするだけ！これでホームページにチャットが現れるよ 🎉',
  'step4.item1': '管理画面 → 設定 → デザインタブを開きます',
  'step4.item2': '「埋め込みコード」セクションのコードをコピーします',
  'step4.item3': 'ホームページの HTML の `</body>` 直前に貼り付けます',
  'step4.item4': 'ページをリロード → 右下にチャットアイコンが現れたら完了です！',

  'demo.title': 'こんな会話ができます',
  'demo.subtitle': 'さくらカフェに設置したらこんな感じ。訪問者の質問に出典付きで即答します。',

  'demo.1.question': '抹茶ラテって何円ですか？',
  'demo.1.answer': '抹茶ラテは税込 580 円でご提供しています。',
  'demo.1.citation': 'メニュー p.2',

  'demo.2.question': 'テラス席の予約はできますか？',
  'demo.2.answer': 'テラス席は4名様まで事前予約を承っています。お電話またはウェブフォームからどうぞ。',
  'demo.2.citation': '店舗情報 p.1',

  'demo.3.question': 'Wi-Fi はありますか？',
  'demo.3.answer': 'フリー Wi-Fi をご利用いただけます。パスワードはご来店時にスタッフまでお声がけください。',
  'demo.3.citation': 'FAQ p.3',

  'cta.title': 'あなたのサイトにも設置してみよう',
  'cta.subtitle': 'さくらさんと同じ手順で、今すぐはじめられます。無料の OSS です。',
  'cta.button': 'はじめる',

  'footer.github': 'GitHub',
  'footer.license': 'MIT ライセンス',
  'footer.backToTop': 'ページ上部へ',
};
