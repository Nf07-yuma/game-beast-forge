# Beast Forge

モンスターを育成・交配（ブリーディング）するiOS/Android向けゲームです。React Native (Expo) + TypeScript で構築しています。

## 遊べること (MVP)

- **育成**: モンスターにエサをあげたりトレーニングしたりして経験値・なつき度を伸ばす
- **性別**: モンスターにはオス（♂）・メスの区別があり、最初の相棒を選ぶときに性別を選択する
- **交配（ブリーディング）**: レベル5以上、オスとメスのペアのみ交配可能。掛け合わせてタマゴを生み、孵化させて新しい子モンスターを迎える
  - 基本5属性（炎・水・草・電・岩）の全ての組み合わせ（10通り）に専用の希少種（ハイブリッド種）が用意されている
- **バトル**: 自分が育てたモンスター同士を1対1で戦わせる。HP/ATK/DEF/SPDから毎ターンのダメージを計算するシンプルなターン制バトルで、勝者・敗者ともにEXP・なつき度を獲得する
- **通知**: エサやり・トレーニングのクールダウンが終わったタイミングや、タマゴが孵化できるタイミングでローカル通知が届く（アプリ起動時に通知の許可を確認）
- 図鑑（コレクション）でこれまでに育てたモンスター・タマゴを一覧で確認

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

`src/game/logic.ts`（育成・交配のロジック）、`src/game/battle.ts`（バトルロジック）、`src/data/species.ts`（種族データ）、`src/store/gameStore.ts`（ゲーム状態のストア）、`src/notifications/index.ts`（通知スケジューリング。`expo-notifications` をモック）に対するユニットテストが `src/**/*.test.ts` にあります。プッシュ・プルリクエスト時には `.github/workflows/ci.yml` により型チェック・テスト・Androidバンドルのビルド確認・APKのビルドが自動実行されます。

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

## 技術構成

- **Expo (SDK 57) + React Native + TypeScript**
- **expo-router**: ファイルベースのナビゲーション（`app/` ディレクトリ）
- **Zustand**: 状態管理。`@react-native-async-storage/async-storage` で端末内に永続化
- モンスターのステータスは種族ごとの基礎値・成長率・個体値（IV）から算出し、交配時は両親のIVを継承（突然変異あり）

## ディレクトリ構成

```
app/                  画面（expo-router）
  (tabs)/index.tsx     コレクション（図鑑）画面
  (tabs)/breeding.tsx  交配画面
  (tabs)/battle.tsx    バトル画面（対戦相手選択）
  monster/[id].tsx     モンスター詳細画面
  egg/[id].tsx         タマゴ詳細画面
  battle/result.tsx    バトル結果画面
src/
  types.ts             型定義
  data/species.ts       モンスターの種族データ
  game/logic.ts          育成・交配のゲームロジック
  game/battle.ts          バトルのシミュレーションロジック
  store/gameStore.ts      Zustandストア（永続化含む）
  notifications/index.ts   ローカル通知（エサ・トレーニング・孵化リマインダー）
  components/            UIコンポーネント
  hooks/useNow.ts        クールダウン表示用のタイマーフック
```

## 今後の拡張候補

- クラウド同期・複数端末対応
