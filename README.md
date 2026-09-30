# 客室清掃指示書 WEB版

スマホの縦画面向けのカード式清掃指示書です。1号館（青）23室、2号館（緑）27室、計50室の部屋番号・タイプ・定数と、二つの大きな号館ボタンを維持しています。号館を選ぶと全室を縦に表示します。上部の「1階〜4階」ボタンを押すと、その階の最初の部屋へスクロールします。階は4桁の部屋番号の左から2番目で判定し、固定ヘッダーの実際の高さを差し引いて部屋が隠れない位置に移動します。カードの表示順は変えません。

**このGitリポジトリとGitHub Pagesには架空のテストデータだけを保存します。実際の清掃には使用しないでください。** 日付は `2099/1/1（テスト）`、人数・イン・集計・清掃指示は生成した架空の値です。

## ファイル構成

- `src/template.html`：元のカード式HTML/CSSと表示処理。データはプレースホルダー。
- `data/rooms.json`：全50室の部屋番号・タイプ・定数のみ。宿泊情報は保存しない。
- `scripts/build-demo.js`：実データを一切読まず、公開用の架空データを生成。
- `index.html`：ローカル表示用の生成済みテスト版。単体で開けます。
- `docs/index.html` / `docs/.nojekyll`：Pages公開用ファイル。
- `tests/`：全室・数値計算・構文・画面切替・公開データの検証。
- `.github/workflows/pages.yml`：検証に成功した場合だけ `docs` をPagesに公開。
- `private/original/`：ローカル限定の元ファイル一式。Gitから除外。初期コピーのHTML・README・テストは変更していません。このフォルダはGitHubにアップロードしないでください。

元の制作ファイルはローカルで保持しています。このリポジトリには公開用の開発ファイルだけを登録します。

## 開発と確認

Node.js 22以上で、追加パッケージのインストールは不要です。

```sh
npm run build
npm test
python3 -m http.server 8000 --directory docs --bind 127.0.0.1
```

`http://localhost:8000/` を開き、320 / 375 / 390 / 430pxの縦画面で両号館と戻る操作を確認します。実データ確認は `private/original/index.html` を直接開いてください。ローカルサーバーでは `docs` だけを配信します。

表示変更は `src/template.html` に行い、`npm run build` の後に `npm test` を実行します。生成したHTMLに直接実データを書き込まないでください。公開用テストはHTMLが生成内容と完全一致することも検証します。

## GitHubへの初回登録

1. GitHubで空の公開リポジトリ `cleaning-web-project` を作成します。README、ライセンス、gitignoreの自動追加は不要です。
2. この開発用コピーのフォルダで、GitHubの認証済みGit環境から実行します。

```sh
git remote add origin https://github.com/YOUR_ACCOUNT/cleaning-web-project.git
git push -u origin main
```

パスワードやトークンはチャットやリポジトリに保存しないでください。GitHub Desktopの場合はこの既存ローカルリポジトリを追加してPublish repositoryを使えます。

## GitHub Pages

リポジトリの Settings → Pages → Build and deployment → Source を **GitHub Actions** に設定します。その後 Actions の `Test and deploy demo to Pages` で `Run workflow` を実行します。以後 `main` へのpushで自動検証・公開します。公開URLは通常 `https://YOUR_ACCOUNT.github.io/cleaning-web-project/` です。

ワークフローは `docs` だけを公開し、元ファイルはアップロードしません。フォルダごとの手動アップロードや `git add -f private` は行わないでください。Gitignoreは誤操作の防止であり、実データのアクセス制限ではありません。

[GitHub公式：Pagesの公開元の設定](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 維持する仕様

1. スマホ縦画面で横スクロールを起こさない。
2. トップの「1号館」「2号館」の大きなボタン、青／緑、カード式を維持する。
3. 全50室の部屋構成と元の実データをローカルで保存する。
4. 不要と指定された上部注意文・スタッフ宛て文言を復活させない。公開版のテストデータ表示は識別のため追加。
5. お口：イン○なら大＋中＋小、インなしなら定数。スリッパ：イン○なら大＋中＋小＋幼、インなしなら定数。子供セット：中＋小＋幼。歯ブラシ・サムエ・タオルセット：定数。
6. 実運用前に、元写真からの読み取り値を現場の原票と照合する。
