# Beast Forge

モンスターを育成・交配（ブリーディング）するiOS/Android向けゲームです。React Native (Expo) + TypeScript で構築しています。

## 遊べること (MVP)

- **育成**: モンスターにエサをあげたりトレーニングしたりして経験値・なつき度を伸ばす
- **性別**: モンスターにはオス（♂）・メスの区別があり、最初の相棒を選ぶときに性別を選択する
- **交配（ブリーディング）**: レベル5以上、オスとメスのペアのみ交配可能。掛け合わせてタマゴを生み、孵化させて新しい子モンスターを迎える
  - 基本5属性（炎・水・草・電・岩）の全ての組み合わせ（10通り）に専用の希少種（ハイブリッド種）が用意されている
- **バトル**: 自分が育てたモンスター同士を1対1で戦わせる。HP/ATK/DEF/SPDから毎ターンのダメージを計算するシンプルなターン制バトルで、勝者・敗者ともにEXP・なつき度を獲得する
- **通知**: エサやり・トレーニングのクールダウンが終わったタイミングや、タマゴが孵化できるタイミングでローカル通知が届く（アプリ起動時に通知の許可を確認）
- **クラウド同期（任意）**: 設定タブで「同期コード」とパスワードを発行すると、モンスター・タマゴのデータがクラウドに保存され、別の端末で同じコードとパスワードを入力すれば引き継げる（Firebaseプロジェクトの設定が必要。詳しくは下記）
- **モンスタータブ**: 「コレクション」（所持モンスター・タマゴの一覧）・「交配」・「図鑑」の3つをページ上部の切り替えボタンでまとめて行き来できる
  - **図鑑**: 一度でも入手した種族が記録される。未発見の種族は「？？？」のシルエット表示になり、発見済みの種族はタップすると説明・種族値を確認できる
- **ガチャ**: 1時間に1回、タマゴが1つ手に入る抽選を引ける。基本5属性は出やすく、ハイブリッド種（本来は交配でのみ入手可能）は低確率で出る
- **ダンジョン探索**: モンスターを5つのダンジョン（火山・海底洞窟・大森林・雷鳴の遺跡・岩山、各基本属性1つずつ）のいずれかに送り出すと、EXPと属性に応じた進化石（50%の確率）が手に入る。1匹あたり30分に1回まで
- **進化**: 基本5属性のモンスターは、Lv.10以上・対応する進化石3個を消費して進化できる（エンバーパップ→エンバーウルフ、アクアフィン→アクアシャーク、リーフリング→リーフモス、スパーキット→サンダーフォックス、ボルダラム→ロックタイタン）。進化するとレベル・なつき度などはそのまま、種族値だけがより強力なものに変わる
- **効果音**: エサやり・トレーニング・こうはい・孵化・進化・バトル結果・ガチャ（通常/レア）・ダンジョン探索結果・ボタンタップに短い効果音が付いている。設定タブの「効果音」トグルでON/OFFを切り替えられる（デフォルトON）。すべて `scripts/generate-sfx.js` で合成した自作の音源で、外部の素材は使用していない

## セットアップ

```bash
npm install
npm start
```

Expo Go アプリ（iOS/Android）でQRコードを読み取るか、`npm run ios` / `npm run android` でシミュレータ・エミュレータ上で起動できます。

## テスト

```bash
npm run typecheck   # 型チェック
npm test             # ユニットテスト（Jest）
```

`src/game/logic.ts`（育成・交配のロジック）、`src/game/battle.ts`（バトルロジック）、`src/game/gacha.ts`（ガチャの抽選ロジック）、`src/game/dungeon.ts`（ダンジョン探索のロジック）、`src/game/evolution.ts`（進化条件の判定）、`src/data/species.ts`（種族・進化データ）、`src/data/items.ts`（アイテムデータ）、`src/data/dungeons.ts`（ダンジョンデータ）、`src/store/gameStore.ts`（ゲーム状態のストア）、`src/notifications/index.ts`（通知スケジューリング。`expo-notifications` をモック）、`src/cloud/sync.ts`（同期コードの発行・アップロード・ダウンロード。`firebase/auth`・`firebase/firestore` をモック）、`src/audio/sfx.ts`（効果音の再生。`expo-audio` をモック）に対するユニットテストが `src/**/*.test.ts` にあります。プッシュ・プルリクエスト時には `.github/workflows/ci.yml` により型チェック・テスト・Androidバンドルのビルド確認・APKのビルドが自動実行されます。

CIの `build-apk` ジョブは `expo prebuild` でネイティブAndroidプロジェクトを生成し、`./gradlew assembleRelease` で実際に `.apk` をビルドします。成功すると `beast-forge-apk` という名前でワークフロー実行のArtifactsからダウンロードできます（GitHubの Actions タブ → 該当のワークフロー実行 → Artifacts）。JSバンドルがAPKに埋め込まれているため、Metro（開発サーバー）を起動していなくても実機単体でインストール・起動できます。ただし署名は開発用の自動生成キーのため、そのままではPlayストアには提出できません（提出用の正式なリリースビルドは下記の方法をお使いください）。

> **debugビルドとの違い**: 以前のCIは `assembleDebug` を使っていましたが、debugビルドはJSをMetro開発サーバーから読み込む前提のスタブしか含んでおらず、単体でAPKをインストールしても「Unable to load script」エラーになります。実機に単体でインストールして遊べるようにするには、JSバンドルを埋め込む `assembleRelease`（本リポジトリのCIが生成するもの）が必要です。

## APKファイルを作る（Android実機/エミュレータへの配布）

このプロジェクトではAndroidの実行ファイル（`.apk`）はリポジトリにコミットせず、必要になったタイミングでビルドします。動作確認用のAPKはCIが自動生成しますが（上記）、Playストア提出用の正式なリリースビルドを作る場合は以下の方法を使ってください。

### 方法A: EAS Build（推奨・クラウドビルド）

Android SDKやGradleをローカルに用意しなくても、Expoのクラウド上でビルドできます。Expoアカウント（無料）が必要です。

```bash
npm install -g eas-cli   # 初回のみ
eas login                 # Expoアカウントでログイン
eas build:configure       # 初回のみ。app.json に eas.projectId が追記されます
eas build --platform android --profile preview
```

ビルドが終わるとダウンロードリンクが表示されるので、そこから `.apk` を取得できます（`preview` プロファイルは `eas.json` で `buildType: "apk"` を指定済みなので、Playストア提出用の `.aab` ではなく直接インストール可能な `.apk` が出力されます）。

### 方法B: ローカルビルド（Android SDK/JDKが必要）

自分のPCにAndroid Studio（Android SDK）とJDKがセットアップ済みなら、ローカルだけで完結できます。

```bash
npx expo prebuild -p android   # android/ ディレクトリをネイティブプロジェクトとして生成
cd android
./gradlew assembleRelease       # または assembleDebug（署名なしですぐ試したい場合）
```

成功すると `android/app/build/outputs/apk/release/app-release.apk` が生成されます。

> 現状 `android/` はリポジトリに含めていません（`.gitignore` で除外）。`expo prebuild` はいつでも再生成できるので、通常はコミットしないままで問題ありません。

## クラウド同期（Firebase）を設定する

デフォルトではクラウド同期は無効で、アプリは完全にオフラインで動作します（今まで通り端末内の`AsyncStorage`のみ）。有効にしたい場合は、あなた自身のFirebaseプロジェクトを用意してください。

### 1. Firebaseプロジェクトを作成する

1. [Firebase console](https://console.firebase.google.com/) で新しいプロジェクトを作成
2. 「Authentication」→「Sign-in method」で **匿名（Anonymous）** を有効化
3. 「Firestore Database」でデータベースを作成（本番モードでOK。ルールは次の手順で設定）
4. 「プロジェクトの設定」→「アプリを追加」→ウェブアプリ（`</>`）を追加し、表示された `firebaseConfig` の値を控える

### 2. Firestoreのセキュリティルールを設定する

このリポジトリの [`firestore.rules`](./firestore.rules) の内容を、Firebase console の「Firestore Database」→「ルール」にそのまま貼り付けて公開してください。ログイン不要の匿名認証だけで使えるようにするため、「同期コードとパスワードを組み合わせたハッシュ値が実質的な鍵になる」というシンプルなモデルを採用しています（詳しくはファイル内のコメント参照）。8文字の同期コードだけでは他人に推測・総当たりされて意図せず自分のデータを上書きされたり覗かれたりする懸念があるため、コード発行・引き継ぎ時に入力するパスワードと組み合わせたSHA-256ハッシュをドキュメントIDとして使うことで、コードだけを知っていてもデータにはたどり着けないようにしています。パスワードはどこにも保存されません（サーバー側はもちろん、端末内にも平文では残りません）。忘れると同じ端末以外からは引き継げなくなるのでご注意ください。カジュアルなゲームデータ向けの割り切りであり、機密性の高い用途には使わないでください。

### 3. 環境変数を設定する

`.env.example` を `.env` にコピーし、手順1で控えた値を入力してください。

```bash
cp .env.example .env
```

```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

`npm start` を再起動すると設定タブに「クラウド同期」の操作画面が表示されます。パスワード（4文字以上）を入力して「同期コードを発行する」を押すとこの端末のデータをアップロードし、他の端末で同じコードとパスワードの両方を入力すると、そのデータを引き継げます（後から発行・上書きした方が勝つシンプルな「最終書き込み優先」方式で、複数端末を同時に操作した場合の自動マージは行いません）。

EAS Buildで配布する場合は、`eas build` 実行時にも同じ環境変数が必要です（[EAS環境変数](https://docs.expo.dev/eas/environment-variables/)としてEASプロジェクトに登録してください）。

CIの `build-apk` ジョブでクラウド同期を有効にしてビルドしたい場合は、GitHubリポジトリの `Settings → Secrets and variables → Actions` で上記6つの環境変数と同名のシークレットを登録してください。登録すると `.github/workflows/ci.yml` の `build-apk` ジョブがそれらを読み込み、`beast-forge-apk` アーティファクトにクラウド同期が組み込まれた状態でビルドされます。未登録の場合はこれまで通りクラウド同期が無効な状態でビルドされます（それ以外の機能はすべて動作します）。

## 技術構成

- **Expo (SDK 57) + React Native + TypeScript**
- **expo-router**: ファイルベースのナビゲーション（`app/` ディレクトリ）
- **Zustand**: 状態管理。`@react-native-async-storage/async-storage` で端末内に永続化
- **Firebase (Firestore + Anonymous Auth)**: 任意のクラウド同期機能。未設定でも他の機能はすべて動作する
- **expo-audio**: 効果音の再生。音源は `scripts/generate-sfx.js` で合成した自作のWAVファイル（`assets/sfx/`）で、外部素材・ライセンスへの依存はない
- モンスターのステータスは種族ごとの基礎値・成長率・個体値（IV）から算出し、交配時は両親のIVを継承（突然変異あり）

## ディレクトリ構成

```
app/                  画面（expo-router）
  (tabs)/index.tsx     モンスタータブ（コレクション/交配/図鑑をページ内の切り替えボタンで表示）
  (tabs)/gacha.tsx     ガチャ画面
  (tabs)/dungeon.tsx   ダンジョン画面（探索先・モンスター選択）
  (tabs)/battle.tsx    バトル画面（対戦相手選択）
  (tabs)/settings.tsx  設定画面（クラウド同期）
  monster/[id].tsx     モンスター詳細画面（進化もここから）
  egg/[id].tsx         タマゴ詳細画面
  dex/[speciesId].tsx  図鑑の種族詳細画面
  battle/result.tsx    バトル結果画面
src/
  types.ts             型定義
  screens/CollectionSection.tsx  コレクション表示（モンスタータブに埋め込み）
  screens/BreedingSection.tsx    交配UI（モンスタータブに埋め込み）
  screens/DexSection.tsx         図鑑グリッド（モンスタータブに埋め込み）
  data/species.ts       モンスターの種族データ・進化テーブル
  data/items.ts          アイテムデータ（進化石）
  data/dungeons.ts        ダンジョンデータ
  game/logic.ts          育成・交配のゲームロジック
  game/battle.ts          バトルのシミュレーションロジック
  game/gacha.ts           ガチャの抽選ロジック（重み付き種族プール）
  game/dungeon.ts          ダンジョン探索のクールダウン・ドロップ判定
  game/evolution.ts        進化条件（レベル・所持アイテム）の判定
  store/gameStore.ts      Zustandストア（永続化含む）
  notifications/index.ts   ローカル通知（エサ・トレーニング・孵化リマインダー）
  cloud/firebase.ts        Firebase初期化（未設定なら常にnullを返す）
  cloud/sync.ts             同期コードの発行・アップロード・ダウンロード
  cloud/autoSync.ts         ストアの変更を検知して自動アップロード
  components/            UIコンポーネント
  hooks/useNow.ts        クールダウン表示用のタイマーフック
  audio/sfx.ts            効果音の再生（設定のON/OFFを反映）
firestore.rules         Firestoreセキュリティルール（Firebase consoleに貼り付ける）
scripts/generate-sfx.js  効果音（WAV）を合成して assets/sfx/ に書き出すスクリプト
```

効果音を差し替えたい場合は `assets/sfx/*.wav` を好きな音源（利用規約を確認したフリー素材や自作音源）で上書きするか、`node scripts/generate-sfx.js` を編集・再実行して合成し直してください。

## 今後の拡張候補

現時点でMVPとして一通りの機能（育成・交配・バトル・ガチャ・ダンジョン探索・進化・通知・クラウド同期・図鑑）は実装済みです。次に着手しうる方向性を、実装難易度・規模感の目安とあわせて挙げておきます（実際に着手する際は都度スコープを相談してください）。

- **コンテンツ拡張**（難易度: 低〜中 / 規模: 小〜中）
  新しい属性・種族・ハイブリッド種、新ダンジョン、新アイテムなど、既存の仕組み（`src/data/species.ts` などのデータ定義＋対応するロジック）に沿ってコンテンツを追加していく方向。既存システムを変更しないため個々の追加自体は小さいが、種族・進化・ガチャ排出率・図鑑表示などバランス調整の手間は種族数に比例して増える。

- **バトルの深化**（難易度: 中〜高 / 規模: 大）
  現状はHP/ATK/DEF/SPDのみで計算する単純なターン制（`src/game/battle.ts`）。技・属性相性・スキル/特性などを足すには、データモデル（`Monster`/`Species`の型）・バトルロジック・UI（技選択など）を横断して変更する必要があり、既存のセーブデータとの互換性やテストの作り直しも発生するため最も大掛かりになる。

- **UX/リテンション施策**（難易度: 中 / 規模: 中）
  デイリーログインボーナス、実績・称号、図鑑コンプリート率の表示など。既存のストア（`src/store/gameStore.ts`）に状態を追加し、通知（`src/notifications`）と絡める程度で、新規画面が1〜2個増える規模感。既存機能への影響は限定的。

- **既存機能のポリッシュ**（難易度: 低〜中 / 規模: 小〜中）
  アニメーション・サウンド・一覧表示のパフォーマンス改善など。1機能ずつは小さく独立して着手できるが、対象箇所（画面・コンポーネント）が多いため積み重ねると中規模になる。

- **技術的な負債/整理**（難易度: 低 / 規模: 小〜中）
  テストカバレッジの底上げ、型の見直し、CI高速化など。ユーザー体験には影響しないが、継続的な開発速度を保つための投資。個々のタスクは小さく切り出しやすい。
