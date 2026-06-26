# ecoa Site Portal

Version 1.0 Release Candidate

`ecoa Portal` は、ANDPADから抽出したCSVを読み込み、現場検索、地図表示、ANDPAD現場、工程表へすばやく移動するための社内用ポータルです。

## Release Candidate確認項目

- PWA名: `ecoa Site Portal`
- ホーム画面表示名: `ecoa Portal`
- バージョン表示: `Version 1.0 / Build 2026.06`
- PWAアイコン: ブランドガイド版の `icon-192.png`、`icon-512.png`、`apple-touch-icon.png`、`favicon.ico`
- Service Worker: `service-worker.js` を登録

## ブランドデザイン

- 添付の `ecoa Portal ブランドガイド` をVersion 1.0の正式デザイン基準としています。
- ブランドカラーは `#4CAF50` を基準にしたUIです。
- アプリ表示名は `ecoa Portal` です。
- ヘッダーロゴは横組みの `ecoa PORTAL / エコアポータル` です。
- PWAアイコンは、緑基調の角丸スクエア、白い位置ピン、シンプルな家、下部 `ecoa` 表記で統一しています。
- 起動時にブランドガイドに合わせた `ecoa Portal / Version 1.0` のスプラッシュ画面を約1秒表示します。

![ecoa Portal ブランドガイド](./assets/ecoa-brand-guide.png)

## 起動方法

ZIPファイルを必ず展開してから `index.html` をブラウザで開いてください。

`vendor/leaflet/leaflet.css` と `vendor/leaflet/leaflet.js` をローカル読み込みするため、ZIPを展開せずに直接開くと地図表示が崩れる場合があります。

## GitHub Pages公開手順

1. GitHubで新しいリポジトリを作成します。
2. このZIPを展開します。
3. 展開した中身をリポジトリ直下へアップロードします。
   `index.html`、`manifest.json`、`service-worker.js`、`app.js`、`style.css`、`assets`、`icons`、`vendor` がリポジトリ直下にある状態にします。
4. GitHubへコミットします。
5. GitHubのリポジトリ画面で `Settings` を開きます。
6. `Pages` を開きます。
7. `Build and deployment` の `Source` を `Deploy from a branch` にします。
8. `Branch` を `main`、フォルダを `/root` にして保存します。
9. 表示された公開URLを開き、`ecoa Portal` が表示されることを確認します。

GitHub Pages用に相対パスで構成しています。`https://ユーザー名.github.io/リポジトリ名/` のようなサブパス公開でも、CSS、JavaScript、manifest、Service Worker、アイコンを参照できる構成です。

`.nojekyll` を同梱しているため、GitHub PagesのJekyll処理を使わず静的ファイルとして公開できます。

## 更新手順

1. ANDPADから最新の抽出データをダウンロードします。
2. Excel形式の場合は、Excelで開いて `CSV UTF-8` または `CSV` 形式で保存します。
3. `index.html` を開きます。
4. `ANDPAD抽出CSV` ボタンから、CSVファイルを読み込みます。

Version 1.0は安定運用のためCSV読込専用です。Excel（.xlsx）は直接読み込めません。

担当者変更、営業担当変更、ステータス変更、住所変更、新規案件追加、緯度経度更新は、ANDPAD抽出CSVを再読込するだけで反映されます。

## スマホ実機テスト手順

1. GitHub Pagesへ公開します。
2. スマホのブラウザでGitHub Pagesの公開URLを開きます。
3. 起動時にブランドグリーン背景のスプラッシュ画面が約1秒表示されることを確認します。
4. 画面上に `Version 1.0`、`Build 2026.06`、最終更新が表示されることを確認します。
5. `ANDPAD抽出CSV` からCSVを読み込みます。
6. 現場一覧、地図ピン、検索、担当者フィルター、ステータス表示が動くことを確認します。

## CSV読込手順

1. ANDPADから抽出データをダウンロードします。
2. Excel形式の場合は、Excelで開いて `CSV UTF-8` または `CSV` 形式で保存します。
3. `ANDPAD抽出CSV` ボタンを押します。
4. CSVファイルを選択します。
5. 現場一覧と地図ピンが表示されることを確認します。

## ANDPADボタン確認

1. 現場一覧または地図ピンから現場を選択します。
2. 詳細パネルで `ANDPAD現場` ボタンを押します。
3. `https://andpad.jp/my/orders/{システムID}` が別タブで開くことを確認します。

## 工程表ボタン確認

1. 現場一覧または地図ピンから現場を選択します。
2. 詳細パネルで `工程表` ボタンを押します。
3. 確認メッセージが表示されることを確認します。
4. OK後、`https://andpad.jp/my/orders/{システムID}/workload/chart` が別タブで開くことを確認します。

## 使用列

以下の列を読み込みます。

```csv
物件都道府県,物件住所,物件緯度,物件経度,システムID,案件管理ID,案件名,案件フロー,役割:営業,役割:工事
```

変換ルール:

- `物件都道府県` + `物件住所` -> 住所
- `物件緯度` / `物件経度` -> 地図ピン
- `システムID` -> ANDPADリンク用ID
- `案件管理ID` -> 現場コード
- `案件名` -> 現場名
- `案件フロー` -> ステータス
- `役割:工事` -> 現場担当
- `役割:営業` -> 営業担当

ヘッダーがない場合は、上記の列順で自動判定します。ヘッダーがある場合は列名ゆれにも対応します。

## 担当者名

`307924:髙橋 光` のような表記は、ID部分を除去して `髙橋 光` と表示します。

空欄、`未定`、`未設定`、`なし`、`-` は `担当者未設定` として扱います。

## 緯度経度

- `物件緯度` と `物件経度` がある場合は、その座標でピン表示します。
- 緯度経度が空欄または不正な場合、一覧には残り、地図には `緯度経度未設定` として表示されません。
- 住所検索や緯度経度補完は行いません。

## ANDPADリンク

`システムID` から以下のURLを自動生成します。

- ANDPAD現場: `https://andpad.jp/my/orders/{システムID}`
- 工程表: `https://andpad.jp/my/orders/{システムID}/workload/chart`

工程表が未作成の案件はANDPAD側でエラー画面になる場合があるため、工程表を開く前に確認メッセージを表示します。

`システムID` が空欄の現場は `システムID未設定` と表示し、ANDPAD現場・工程表ボタンを無効化します。

## スマホでの使い方

Android:

1. ChromeでGitHub Pagesの公開URLを開きます。
2. メニューから `ホーム画面に追加` を選びます。
3. 追加された `ecoa Portal` アイコンから起動します。

iPhone:

1. SafariでGitHub Pagesの公開URLを開きます。
2. 共有ボタンを押します。
3. `ホーム画面に追加` を選びます。
4. 追加された `ecoa Portal` アイコンから起動します。

PWAとしてホーム画面に追加する場合は、GitHub PagesなどHTTPSで公開されたURLから開いてください。

## 検索

以下で検索できます。

- 現場コード
- 現場名
- 住所
- 現場担当
- 営業担当
- ステータス

## 主な機能

- ANDPAD抽出CSV読込
- OpenStreetMap + Leafletによる地図表示
- 物件緯度・物件経度によるピン表示
- ANDPAD現場ボタン
- 工程表ボタン
- 現場担当ごとのピン色分け
- 現場担当・ステータスフィルター
- 現場担当別件数、ステータス別件数
- 市町村別件数集計
- 現場一覧から選択して地図上の該当案件を選択
- 表示中の現場だけCSV出力
- PWA対応（manifest / service worker / ホーム画面追加）
