# Cloudflare Web Analytics (PoC)

Cookie を使わず、個人情報を収集しない Cloudflare Web Analytics を `asuforce.com` に導入するための PoC。
既存の Google Analytics (UA-150930189-1) は Universal Analytics が 2023 年に終了しているため、データは取得できていない。
置き換え or 併用の判断材料として、まず Cloudflare 側の計測を並行して動かす。

## 方式の選択肢

`asuforce.com` は Cloudflare のゾーンで管理されており、Workers (static assets) で配信している。
Workers のカスタムドメイン/ルート経由の配信はプロキシされるため、**方式 A が使える前提**とし、これを第一候補にする。

| 方式 | 変更箇所 | 備考 |
| --- | --- | --- |
| **A. 自動セットアップ (推奨)** | なし (ダッシュボードのみ) | エッジで HTML に beacon を注入。ゾーン内の全ページ/サブドメインが対象。データは自ドメインの `/cdn-cgi/rum` に送信される |
| B. 手動セットアップ (フォールバック) | `vite.config.ts` (実装済み) | ビルド時に `<script>` を注入。`CF_BEACON_TOKEN` 未設定なら何もしない。ブロッカー対策や、ページ単位で制御したい場合に使う |

A と B を同じページに重複させないこと (1ページにつきスニペットは1つのみ有効)。
A を採用する間は `CF_BEACON_TOKEN` を設定しない (= B は no-op のまま)。A で十分なら `vite.config.ts` のプラグインは削除してよい。

## 手順 (方式 A)

1. Cloudflare ダッシュボード → **Analytics & Logs → Web Analytics** で `asuforce.com` のサイトを追加し、自動セットアップ (automatic setup) を有効にする。
2. しばらく待って、`curl -s https://asuforce.com | grep -o 'beacon.min.js[^>]*'` で beacon が注入されていることを確認する。
   - 注入されない場合: Workers static assets が返す HTML にも注入されるかは、このPoCでは未検証。注入されなければ方式 B に切り替える。
3. Web Analytics のダッシュボードでページビュー・Core Web Vitals が出ることを確認する。

## 手順 (方式 B: フォールバック)

1. Cloudflare ダッシュボード → **Analytics & Logs → Web Analytics** でホスト名 `asuforce.com` を登録し、**JS snippet をコピーする (手動) 方式**を選ぶ。
   ゾーンが同一アカウントにあるため、登録フローで自動注入 (方式 A) が有効になる可能性がある。
   B を使うなら自動注入はオフのままにする。デプロイ後に `curl -s https://asuforce.com | grep -c 'beacon.min.js'` が **1** であることを確認する。
2. 発行された snippet の `token` を控える (`data-cf-beacon='{"token": "..."}'`)。
3. ビルド環境に `CF_BEACON_TOKEN` を設定する。
   - Workers Builds: Worker の **Settings → Build → Build Variables and Secrets** に追加
   - ローカル確認: `.env.local` に `CF_BEACON_TOKEN=<token>` (`*.local` は `.gitignore` 済み)
4. デプロイ後、ダッシュボードの Web Analytics でページビュー・Core Web Vitals が出ることを確認する。

> **注意: 「ビルド」変数であって「ランタイム」変数ではない。**
> Worker の **Settings → Variables & Secrets** や `wrangler.jsonc` の `vars` に入れても、ビルド時には見えないため
> beacon は注入されない (エラーも出ず、ただ計測されない)。「token を設定したのに何も計測されない」場合はまずここを疑う。
> 設定後は再ビルド・再デプロイが必要。

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

- [ ] A で注入・計測できたら、`vite.config.ts` のプラグインは不要なので削除する
- [ ] 数週間 Cloudflare 側の数値を観測し、GA (`index.html` の gtag スニペット) を削除してよいか判断する
- [ ] CSP を導入する場合は `script-src https://static.cloudflareinsights.com`、`connect-src https://cloudflareinsights.com` を許可する

## 参考

- https://developers.cloudflare.com/web-analytics/get-started/
- https://developers.cloudflare.com/web-analytics/faq/
