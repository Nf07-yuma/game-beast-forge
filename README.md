# Beast Forge

モンスターを育成・交配（ブリーディング）するiOS/Android向けゲームです。React Native (Expo) + TypeScript で構築しています。

## 遊べること (MVP)

- **育成**: モンスターにエサをあげたりトレーニングしたりして経験値・なつき度を伸ばす
- **交配（ブリーディング）**: レベル5以上のモンスター2匹を掛け合わせてタマゴを生み、孵化させて新しい子モンスターを迎える
  - 特定の属性の組み合わせ（例: 炎×水）でのみ生まれる希少種（ハイブリッド種）が存在する
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

`src/game/logic.ts`（育成・交配のロジック）、`src/data/species.ts`（種族データ）、`src/store/gameStore.ts`（ゲーム状態のストア）に対するユニットテストが `src/**/*.test.ts` にあります。プッシュ・プルリクエスト時には `.github/workflows/ci.yml` により型チェック・テスト・Androidバンドルのビルド確認・デバッグAPKのビルドが自動実行されます。

CIの `build-apk` ジョブは `expo prebuild` でネイティブAndroidプロジェクトを生成し、`./gradlew assembleDebug` で実際に `.apk` をビルドします。成功すると `beast-forge-debug-apk` という名前でワークフロー実行のArtifactsからデバッグ用APKをダウンロードできます（GitHubの Actions タブ → 該当のワークフロー実行 → Artifacts）。署名は開発用の自動生成キーのため、そのままではPlayストアに提出できません（配布用のリリースビルドは下記の方法をお使いください）。

## APKファイルを作る（Android実機/エミュレータへの配布）

このプロジェクトではAndroidの実行ファイル（`.apk`）はリポジトリにコミットせず、必要になったタイミングでビルドします。動作確認用のデバッグAPKはCIが自動生成しますが（上記）、配布用のリリースビルドを作る場合は以下の方法を使ってください。

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
  monster/[id].tsx     モンスター詳細画面
  egg/[id].tsx         タマゴ詳細画面
src/
  types.ts             型定義
  data/species.ts       モンスターの種族データ
  game/logic.ts          育成・交配のゲームロジック
  store/gameStore.ts      Zustandストア（永続化含む）
  components/            UIコンポーネント
  hooks/useNow.ts        クールダウン表示用のタイマーフック
```

## 今後の拡張候補

- バトルシステム（育てたモンスター同士の対戦）
- モンスターの種類・希少種の組み合わせ追加
- プッシュ通知（エサやり・孵化タイミングの通知）
- クラウド同期・複数端末対応
