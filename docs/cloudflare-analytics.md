# Cloudflare Web Analytics (PoC)

Cookie を使わず、個人情報を収集しない Cloudflare Web Analytics を `asuforce.com` に導入するための PoC。
既存の Google Analytics (UA-150930189-1) は Universal Analytics が 2023 年に終了しているため、データは取得できていない。
置き換え or 併用の判断材料として、まず Cloudflare 側の計測を並行して動かす。

## 方式の選択肢

| 方式 | 条件 | 変更箇所 | 備考 |
| --- | --- | --- | --- |
| A. 自動セットアップ (one-click) | `asuforce.com` が Cloudflare でプロキシ (オレンジ雲) されている | なし (ダッシュボードのみ) | エッジで HTML にビーコンを注入。コード変更不要 |
| B. 手動セットアップ (このPoCで実装) | プロキシ有無を問わない | `vite.config.ts` | ビルド時に `<script>` を注入。トークンはビルド環境変数で渡す |

B は `index.html` にトークンを直書きせず、`CF_BEACON_TOKEN` が設定されたビルドのみ有効になる。
A と B を同じページに重複させないこと (1ページにつきスニペットは1つのみ有効)。

## 手順 (方式 B)

1. Cloudflare ダッシュボード → **Analytics & Logs → Web Analytics → Add a site** で `asuforce.com` を登録する。
2. 発行された snippet の `token` を控える (`data-cf-beacon='{"token": "..."}'`)。
3. ビルド環境に `CF_BEACON_TOKEN` を設定する。
   - Workers Builds: プロジェクトの **Settings → Build → Variables and secrets** に追加
   - ローカル確認: `.env.local` に `CF_BEACON_TOKEN=<token>` (`.gitignore` 済み)
4. デプロイ後、ダッシュボードの Web Analytics でページビュー・Core Web Vitals が出ることを確認する。

> token は公開 HTML に埋め込まれる値で秘密情報ではないが、リポジトリには置かず環境ごとに切り替えられるようにしている。

## ローカル確認

```sh
npm ci

# 無効 (トークンなし): beacon は含まれない
npm run build && grep -c cloudflareinsights dist/index.html   # -> 0

# 有効
CF_BEACON_TOKEN=dummy npm run build && grep cloudflareinsights dist/index.html
```

期待される出力:

```html
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon="{&quot;token&quot;:&quot;dummy&quot;}"></script>
```

`npm run dev` では注入されない (`apply: 'build'`)。

## 計測できるもの / できないもの

- できる: PV、ユニーク訪問者 (cookie なし)、参照元、国、デバイス/ブラウザ、Core Web Vitals (LCP/INP/CLS)
- できない: クリックなどのカスタムイベント、ユーザー単位のファネル。必要になれば別途検討する
- 本サイトは単一ページ (アンカー遷移のみ) なので、PV はほぼ訪問数と等しくなる

## 判断ポイント / 次のステップ

- [ ] プロキシ済みであれば A (コード変更なし) の方が運用が軽い。その場合は `vite.config.ts` のプラグインを外す
- [ ] 数週間 Cloudflare 側の数値を観測し、GA (`index.html` の gtag スニペット) を削除してよいか判断する
- [ ] CSP を導入する場合は `script-src https://static.cloudflareinsights.com`、`connect-src https://cloudflareinsights.com` を許可する

## 参考

- https://developers.cloudflare.com/web-analytics/get-started/
- https://developers.cloudflare.com/web-analytics/faq/
