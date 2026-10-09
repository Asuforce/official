# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- 同業のエンジニア。技術選定や実装に興味があり、Skills や Works を読む。
- 採用担当、エンジニアリングマネージャー。経歴と実績を短時間で確認する。

案件や登壇の依頼者は、主な閲覧者として確認していない。

## Product Purpose

Shun Nishitsuji (@asuforce) の個人サイト (asuforce.com)。Software Engineer としての経歴、スキル、実績を載せる。

成功の基準は、デザインや実装の趣味を表現する場になること。サイト自体が作り手の仕事ぶりを示す。問い合わせ件数は主目標にしていない。

## Positioning

未決定。

## Operating Context

- Vite と TypeScript で構築し、`dist/` を Cloudflare で配信している (wrangler の assets 設定、SPA 扱い)。
- 計測は Cloudflare Web Analytics の自動セットアップ。Cookie は使わず、個人情報を収集しない。方針は `docs/cloudflare-analytics.md`。

## Capabilities and Constraints

- 掲載内容は About、Skills、Works (2 件: ArgoCD Platform、Distributed Load Testing Tool)、Career、Contact。リニューアルでも文面と事実は変えない。
- ライト / ダークのテーマ切り替えは維持する。保存した設定、なければ OS 設定に従う。ライト側の配色は DESIGN.md に定義済み (月面とフッターは両テーマで暗いまま)。
- 表記は英語のまま。日本語は追加しない。
- 肩書きは「Software Engineer」に揃える。`index.html` の `description` と `og:description` は、まだ「DevOps / SRE Engineer」のまま。

## Brand Commitments

- 名前は Asuforce.com。ドメインは asuforce.com。

## Evidence on Hand

- Works 2 件の本文。
- 画像資産: `public/img/` に `obake.jpg` (ゴーストの元絵)、`og.png` (共有カード用)、`moon.jpg` (月面。`scripts/generate-moon.mjs` で生成)、`favicon.ico`。過去のサイトのスクリーンショットと `background.jpg` は削除した。
- 推薦文、顧客名、数値の実績は確認していない。作らない。

## Product Principles

- 掲載内容は事実として固定し、変えるのは見せ方だけにする。
- サイト自体を、作り手の仕事ぶりの一部として扱う。
- 短時間で読む人と、深く読む人の両方を想定する。
- 計測で個人を追跡しない。
