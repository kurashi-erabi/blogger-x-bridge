# Blogger新着記事 → X自動投稿ブリッジ

Bloggerに新しい記事が投稿されたら、自動でその記事を紹介するツイートを生成し、
Xに投稿するスクリプトです。GitHub Actionsで定期実行し、完全自動化します。

## 必要なもの

### 1. Blogger API（記事取得用）
1. https://console.cloud.google.com/ で新規プロジェクト作成
2. 「APIとサービス」→「ライブラリ」→ "Blogger API v3" を有効化
3. 「認証情報」→ APIキーを作成（読み取り専用なのでAPIキーだけでOK、OAuth不要）
4. ブログID を確認する方法：
   - Blogger管理画面 → 設定 → 「ブログID」または、
   - `https://www.googleapis.com/books/v1/volumes?q=blogger` は無関係。
     正しくは以下のURLをブラウザで開いて確認：
     `https://www.googleapis.com/blogger/v3/blogs/byurl?url=https://kurashi-erabi-note.blogspot.com&key=あなたのAPIキー`
   - 返ってきたJSONの `id` がブログIDです

### 2. X API（投稿用）
1. https://developer.x.com/ でDeveloperアカウント登録
2. プロジェクト作成 → アプリ作成 → 「Read and Write」権限に設定
3. 以下を取得：
   - API Key / API Key Secret
   - Access Token / Access Token Secret
   （画面の指示通りに進めれば発行されます）

※ X APIは無料枠（Freeプラン）だと投稿本数に上限があります。最新の上限は
  https://docs.x.com/x-api/getting-started/about-x-api で確認してください。

### 3. Anthropic API（ツイート文生成用）
- Claude APIキーを発行（Anthropic Consoleから）

## GitHub Secretsに登録するもの
- `BLOGGER_API_KEY`
- `BLOGGER_BLOG_ID`
- `X_API_KEY`
- `X_API_KEY_SECRET`
- `X_ACCESS_TOKEN`
- `X_ACCESS_TOKEN_SECRET`
- `ANTHROPIC_API_KEY`

## 動作の流れ
1. `data/posted-articles.json` に「すでにXへ紹介済みの記事URL一覧」を保持
2. スクリプトがBloggerの最新記事一覧を取得
3. まだ紹介してない記事があれば、Claude APIで紹介ツイート文を生成
4. X APIで投稿
5. `posted-articles.json` を更新してcommit

GitHub Actionsで1日に数回（例: 4時間おき）チェックする設定にしてあります。
新しい記事が無ければ何もせず終了するので、無駄な投稿は発生しません。
