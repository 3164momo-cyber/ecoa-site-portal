# ecoa Site Portal

Version 9.5

`ecoa Portal` は、ANDPADから出力した最新ExcelまたはCSVを読み込み、案件検索、地図表示、ANDPAD、工程表へすばやく移動するための社内用ポータルです。

## Ver9.5の運用方針

- ANDPADから出力した最新データを唯一のマスターデータとして使用します。
- GitHub Pages上では `data/sites.csv` を標準データとして自動読み込みします。
- 現場座標マスターCSVとの照合や緯度経度補完は行いません。
- `物件緯度` と `物件経度` をそのまま地図ピンに使用します。
- 全社共有する場合は、管理者が `data/sites.csv` を更新します。
- 手動読込したExcel/CSVは、その端末の表示だけを一時的に上書きします。
- 工事担当フィルターは、読み込んだCSV内の工事担当だけをゼロから集計して表示します。固定担当者一覧は使用しません。
- 通常利用者は閲覧専用に近い画面です。`?admin=1` を付けた管理者モードだけ、ANDPAD最新データ読込、共有用CSV作成、CSV出力、デバッグ情報を表示します。
- 同梱の `data/sites.csv` は本番差し替え用です。サンプルデータは入れていません。
- Ver9.5ではGitHubトークンを使いません。管理者が作成した `sites.csv` をGitHubの `data/sites.csv` へ上書きアップロードする半自動更新方式です。

## 起動方法

ZIPファイルを必ず展開してから `index.html` をブラウザで開いてください。

GitHub Pagesで公開して使う場合は、リポジトリ直下に `index.html`、`manifest.json`、`service-worker.js`、`app.js`、`style.css`、`assets`、`icons`、`vendor` を配置してください。

## GitHub Pages公開手順

1. GitHubで新しいリポジトリを作成します。
2. ZIPを展開します。
3. 展開した中身をリポジトリ直下へアップロードします。
4. GitHubへコミットします。
5. リポジトリの `Settings` を開きます。
6. `Pages` を開きます。
7. `Build and deployment` の `Source` を `Deploy from a branch` にします。
8. `Branch` を `main`、フォルダを `/root` にして保存します。
9. 表示された公開URLを開き、`ecoa Portal` が表示されることを確認します。

相対パスで構成しているため、GitHub Pagesのサブパス公開でもCSS、JavaScript、manifest、Service Worker、アイコンを読み込めます。

## 全社共有データの更新手順

1. ANDPADから最新データを出力します。
2. 必要に応じてCSV形式にします。
3. 管理者URLで `ecoa Portal` を開きます。
4. `ANDPAD最新データ読込` で最新データを読み込みます。
5. `共有用CSVを作成` を押します。
6. `sites.csv` がダウンロードされます。
7. GitHubリポジトリ内の `data/sites.csv` を、ダウンロードした `sites.csv` で上書きします。
8. GitHubへコミットします。
9. 1〜2分後にGitHub Pagesへ反映され、全員が同じ最新データを自動読込します。

全社共有する場合は、各端末で手動読込するのではなく `data/sites.csv` を更新してください。

管理者モードでANDPADデータを読み込んでも、GitHub上の `data/sites.csv` として自動保存されるわけではありません。GitHubリポジトリの `data/sites.csv` を更新しない限り、他の人の画面には反映されません。

## 管理者向け: 共有用CSV作成

管理者URLで表示される `共有用CSVを作成` ボタンは、読み込んだANDPAD最新データを `data/sites.csv` と同じ列順へ標準化し、ファイル名 `sites.csv` でダウンロードします。

この `sites.csv` を GitHub の `data/sites.csv` に上書きアップロードすると、全社員の画面に反映されます。

GitHub更新手順:

1. GitHubの `data/sites.csv` を開きます。
2. 右上の鉛筆マーク、または `Upload files` から `sites.csv` を上書きします。
3. `Commit changes` を押します。
4. 1〜2分後に全社員へ反映されます。

Ver10ではGitHub APIを使って管理者ボタン1つで `data/sites.csv` を直接更新する構想です。Ver9.5では安全性を優先し、GitHubトークンを使わない方式にしています。

## 手動データ読込手順

1. ANDPADから最新データを出力します。
2. 管理者URLで `ecoa Portal` を開きます。
3. `ANDPAD最新データ読込` ボタンを押します。
4. Excel（`.xlsx`）またはCSV（`.csv`）を選択します。
5. 案件一覧、地図ピン、件数表示が一時的に上書きされることを確認します。

手動読込はその端末の表示だけに反映されます。GitHub Pages上の標準データは変更されません。

## 通常URLと管理者URL

通常利用者:

```text
https://3164momo-cyber.github.io/ecoa-site-portal/
```

管理者:

```text
https://3164momo-cyber.github.io/ecoa-site-portal/?admin=1
```

通常URLでは `ANDPAD最新データ読込`、`共有用CSVを作成`、`表示CSV出力`、デバッグ情報を表示しません。管理者URLだけ、更新操作系ボタンとデバッグ情報を表示します。

管理者画面にも「この sites.csv を GitHub の data/sites.csv に上書きアップロードすると、全社員の画面に反映されます。」と表示します。

## 使用列

以下の列を標準フォーマットとして読み込みます。

```csv
物件都道府県,物件住所,物件緯度,物件経度,システムID,案件管理ID,案件名,案件フロー,役割:営業,役割:工事,役割:設計
```

変換ルール:

- `物件都道府県` + `物件住所` -> 住所
- `物件緯度` / `物件経度` -> 地図ピン
- `システムID` -> ANDPADリンク用ID
- `案件管理ID` -> 案件番号
- `案件名` -> 案件名
- `案件フロー` -> 案件ステータス
- `役割:工事` -> 工事担当
- `役割:営業` -> 営業担当
- `役割:設計` -> 内部データとして保持

ヘッダーがある場合は列名ゆれにも対応します。ヘッダーがない場合は、上記の列順を基準に読み込みます。

## 担当者名の整形

`307924:髙橋 光` のような表記は、ID部分を除去して `髙橋 光` と表示します。

工事担当が空欄、`未定`、`未設定`、`なし`、`-` の場合は `担当者未設定` として扱い、担当者フィルターにも表示します。

工事担当フィルターはCSV内の工事担当を氏名全体で1人1件にまとめ、件数付きで表示します。`307924:田村 和宣` は `田村 和宣` として扱います。`担当者未設定` は最後に表示します。

## 緯度経度

- `物件緯度` と `物件経度` がある場合は、その座標でピン表示します。
- 緯度経度が空欄または不正な場合、一覧には残り、地図には表示されません。
- 住所検索、座標マスター照合、緯度経度補完は行いません。

## 詳細画面

案件一覧または地図ピンを選択すると、以下を表示します。

- 案件名
- 案件番号
- 住所
- 工事担当
- 営業担当
- 案件ステータス
- ANDPADを開く
- 工程表を開く

## ANDPADリンク

`システムID` から以下のURLを自動生成します。

- ANDPAD: `https://andpad.jp/my/orders/{システムID}`
- 工程表: `https://andpad.jp/my/orders/{システムID}/workload/chart`

工程表が未作成の案件はANDPAD側でエラー画面になる場合があるため、工程表を開く前に確認メッセージを表示します。

`システムID` が空欄の案件は `システムID未設定` と表示し、ANDPAD・工程表ボタンを無効化します。

## 検索とフィルター

以下で検索できます。

- 案件番号
- 案件名
- 住所
- 工事担当
- 営業担当
- 案件ステータス

担当者フィルターとステータスフィルターは、読み込んだANDPADデータから自動生成されます。

## PWA

- アプリ名: `ecoa Portal`
- 正式名称: `ecoa Site Portal`
- manifest: `manifest.json`
- Service Worker: `service-worker.js`
- アイコン: `icons/icon-192.png`、`icons/icon-512.png`、`icons/apple-touch-icon.png`、`icons/favicon.ico`
- スプラッシュ画面: `ecoa Portal / Version 9.5`

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

スマホ表示では左側に検索、工事担当フィルター、ステータスフィルター、エリア情報、表示件数をまとめ、右側に地図を大きく表示します。案件詳細は地図上の下部にコンパクト表示します。

## 主な機能

- ANDPAD最新Excel/CSV読込（管理者モードのみ）
- `data/sites.csv` の自動読込
- OpenStreetMap + Leafletによる地図表示
- 物件緯度・物件経度によるピン表示
- ANDPADを開くボタン
- 工程表を開くボタン
- 工事担当ごとのピン色分け
- 担当者フィルター
- ステータスフィルター
- 担当者別件数、ステータス別件数
- 市町村別件数集計
- 案件一覧から選択して地図上の該当案件を選択
- 表示中の案件だけCSV出力（管理者モードのみ）
- PWA対応

## ブランドデザイン

添付の `ecoa Portal ブランドガイド` を正式デザイン基準としています。

![ecoa Portal ブランドガイド](./assets/ecoa-brand-guide.png)
