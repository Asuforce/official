# Cloudflare Web Analytics

Cookie を使わず、個人情報を収集しない Cloudflare Web Analytics で `asuforce.com` を計測している。
Google Analytics (Universal Analytics は 2023 年に終了) は削除し、これに置き換えた。

## 方式

**自動セットアップ (automatic setup)** を採用している。コードの変更はなく、Cloudflare のエッジが配信時に HTML へ beacon を注入する。
データは自ドメインの `/cdn-cgi/rum` に送信される。

- 設定場所: https://dash.cloudflare.com/?to=/:account/web-analytics/sites → `asuforce.com` の **Manage Site**
  (メニュー構成は変わることがあるため直リンクを使う)
- 公開ページのソースに、`integrity` 属性付きの `beacon.min.js` の `<script>` が入っていることを確認済み
  (`integrity` は自動注入のときだけ付く)。

### 確認方法

ブラウザで https://asuforce.com を開き、View Source / DevTools で `beacon.min.js` を探す。1 つだけ入っていればよい。

> `curl` では注入された HTML が返らないことがある。確認はブラウザで行う。

### 注意

- 1 ページにつき有効なスニペットは 1 つだけ。**手動で beacon を追加しない**こと (二重になる)。
- CSP を導入する場合は、beacon 取得と送信先 (`static.cloudflareinsights.com` など) を許可する。
  https://developers.cloudflare.com/web-analytics/faq/ を参照。

## 計測できるもの / できないもの

- できる: PV、ユニーク訪問者 (cookie なし)、参照元、国、デバイス/ブラウザ、Core Web Vitals (LCP/INP/CLS)
- できない: クリックなどのカスタムイベント、ユーザー単位のファネル
- 本サイトは単一ページ (アンカー遷移のみ) なので、PV はほぼ訪問数と等しくなる

## 自動注入が使えなくなった場合のフォールバック

自動注入が効かない場合は、`index.html` の `<head>` に手動でスニペットを入れる。
その際は**ダッシュボードの自動セットアップをオフ**にして二重注入を避けること。

```html
<script defer src="https://static.cloudflareinsights.com/beacon.min.js"
        data-cf-beacon='{"token": "<site tag>"}'></script>
```

token (site tag) は Web Analytics のサイトに紐づく公開値で、秘密情報ではない。

## 参考

- https://developers.cloudflare.com/web-analytics/get-started/
- https://developers.cloudflare.com/web-analytics/faq/
