# CLAUDE.md

@DESIGN.md

## ルール

- ページを 1 つ仕上げるたびに、`npm run build` を通し、`docs/preflight.md` の判断項目を確認する。
- そのあと `/impeccable polish` を実行する。
- どちらも通してから次のページに進む。
- `design-taste-frontend` の全文は、新しいセクションや部品を足すときだけ読む。

## リニューアル前のアーカイブ

- リニューアルを本番に出す (push、マージ、デプロイ) 前に、本番 (asuforce.com) のスクリーンショットを撮り、`public/img/` に残す。
- ダークとライトの両方を撮る (テーマ切り替えがあるとき)。ライトを撮るために切り替えたら、撮影後に元のテーマへ戻す。
- ページ全体 (フルページ) を撮る。画面に見える範囲だけでは不足。スクロールで現れる要素があるため、先に下までスクロールして表示させ、スクロールを即時 (`scroll-behavior: auto`) にして先頭に戻ったことを確かめてから撮る。ダークとライトは `prefers-color-scheme` で切り替えられる。
- ファイル名は `asuforce.com_YYMMDD_dark` と `asuforce.com_YYMMDD_light` (撮影日。例: 2026-10-09 なら `asuforce.com_261009_dark.jpg`)。
- すでにあるものは `public/img/asuforce.com_261009_dark.jpg` と `public/img/asuforce.com_261009_light.jpg` (旧デザイン、幅 1280px のフルページ)。
