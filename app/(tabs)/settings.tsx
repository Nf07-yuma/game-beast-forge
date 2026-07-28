import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useGameStore } from '@/store/gameStore';
import { isFirebaseConfigured } from '@/cloud/firebase';
import {
  MIN_SYNC_PASSWORD_LENGTH,
  deriveSyncKey,
  generateSyncCode,
  isValidSyncPassword,
  normalizeSyncCode,
  pullFromCloud,
  pushToCloud,
} from '@/cloud/sync';
import { PrimaryButton } from '@/components/PrimaryButton';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { theme } from '@/theme';
import { BackgroundStyle } from '@/types';

const BACKGROUND_OPTIONS: { key: BackgroundStyle; label: string; description: string; colors: string[] }[] = [
  {
    key: 'orbs',
    label: 'ドリフティング・オーブ',
    description: '光の塊がゆっくり漂う、静かな演出',
    colors: [theme.colors.primary, theme.colors.neonCyan, theme.colors.neonPink],
  },
  {
    key: 'circuit',
    label: 'サーキット・パルス',
    description: '配線を光が走る、硬派な演出',
    colors: [theme.colors.neonCyan, theme.colors.border, theme.colors.neonPink],
  },
  {
    key: 'aurora',
    label: 'オーロラ・リボン',
    description: '色の帯がうねる、幻想的な演出',
    colors: [theme.colors.primary, theme.colors.neonCyan, theme.colors.neonPink],
  },
  {
    key: 'ember',
    label: 'エンバー・ドリフト',
    description: '光の粒が立ち上る、生き物っぽい演出',
    colors: [theme.colors.accent, theme.colors.neonPink, theme.colors.neonCyan],
  },
];

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 10) return 'たった今';
  if (totalSeconds < 60) return `${totalSeconds}秒前`;
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

export default function SettingsScreen() {
  const syncCode = useGameStore((s) => s.syncCode);
  const lastSyncedAt = useGameStore((s) => s.lastSyncedAt);
  const setSyncCode = useGameStore((s) => s.setSyncCode);
  const applyCloudData = useGameStore((s) => s.applyCloudData);
  const backgroundStyle = useGameStore((s) => s.backgroundStyle);
  const setBackgroundStyle = useGameStore((s) => s.setBackgroundStyle);
  const [syncing, setSyncing] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [restorePassword, setRestorePassword] = useState('');

  async function handleCreateCode() {
    if (!isValidSyncPassword(createPassword)) return;
    setSyncing(true);
    const code = generateSyncCode();
    const key = await deriveSyncKey(code, createPassword);
    const { monsters, eggs, items, hasStarter } = useGameStore.getState();
    const result = await pushToCloud(key, { monsters, eggs, items, hasStarter });
    setSyncing(false);
    if (!result.ok) {
      Alert.alert('発行できませんでした', result.message ?? '');
      return;
    }
    setSyncCode(code, key);
    useGameStore.setState({ lastSyncedAt: Date.now() });
    setCreatePassword('');
    Alert.alert(
      '同期コードを発行しました',
      `他の端末で「${code}」と今設定したパスワードの両方を入力すると引き継げます。パスワードは保存されないので、忘れずに控えてください。`
    );
  }

  async function handleCopyCode() {
    if (!syncCode) return;
    await Clipboard.setStringAsync(syncCode);
    Alert.alert('コピーしました', syncCode);
  }

  function handleRestore() {
    const code = normalizeSyncCode(codeInput);
    if (!code || !isValidSyncPassword(restorePassword)) return;
    Alert.alert(
      'このコードのデータを引き継ぎますか?',
      `コード「${code}」のデータで、この端末のモンスター・タマゴを上書きします。この操作は元に戻せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '引き継ぐ',
          style: 'destructive',
          onPress: async () => {
            setSyncing(true);
            const key = await deriveSyncKey(code, restorePassword);
            const result = await pullFromCloud(key);
            setSyncing(false);
            if (!result.ok || !result.data) {
              Alert.alert('引き継げませんでした', result.message ?? '');
              return;
            }
            applyCloudData(
              {
                monsters: result.data.monsters,
                eggs: result.data.eggs,
                items: result.data.items,
                hasStarter: result.data.hasStarter,
              },
              result.data.updatedAt
            );
            setSyncCode(code, key);
            setCodeInput('');
            setRestorePassword('');
            Alert.alert('引き継ぎました', 'この端末のデータを復元しました。');
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>設定</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>背景スタイル</Text>
          <View style={styles.bgGrid}>
            {BACKGROUND_OPTIONS.map((opt) => {
              const active = backgroundStyle === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  style={[styles.bgOption, active && [styles.bgOptionActive, theme.glow(theme.colors.primary, 0.4, 8)]]}
                  onPress={() => setBackgroundStyle(opt.key)}
                >
                  <View style={styles.bgSwatch}>
                    {opt.colors.map((c, i) => (
                      <View key={i} style={[styles.bgDot, { backgroundColor: c }]} />
                    ))}
                  </View>
                  <Text style={[styles.bgLabel, active && styles.bgLabelActive]}>{opt.label}</Text>
                  <Text style={styles.bgDesc}>{opt.description}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={styles.groupTitle}>クラウド同期</Text>

        {!isFirebaseConfigured ? (
          <View style={styles.section}>
            <Text style={styles.notConfigured}>
              クラウド同期は設定されていません。開発者向けにFirebaseプロジェクトの環境変数
              (EXPO_PUBLIC_FIREBASE_*) を設定すると利用できます。詳しくはREADMEをご覧ください。
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>この端末の同期コード</Text>
              {syncCode ? (
                <>
                  <Text style={styles.code}>{syncCode}</Text>
                  <Text style={styles.helpText}>
                    別の端末で下の「コードを入力して引き継ぐ」に、このコードと発行時に設定したパスワードの両方を入力すると、この端末のデータを引き継げます。パスワードはこの画面には表示されません（保存されていないため）。
                  </Text>
                  <PrimaryButton
                    label="コードをコピー"
                    onPress={handleCopyCode}
                    variant="secondary"
                    style={styles.button}
                  />
                  {lastSyncedAt ? (
                    <Text style={styles.syncedAt}>最終同期: {formatElapsed(Date.now() - lastSyncedAt)}</Text>
                  ) : null}
                </>
              ) : (
                <>
                  <Text style={styles.helpText}>
                    同期コードを発行すると、この端末のデータがクラウドに保存され、他の端末に引き継げるようになります。
                    コードだけでなくパスワードも必要にすることで、他の人がコードを推測しても勝手に引き継げないようにしています。パスワードは保存されないので、忘れずに控えてください。
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={createPassword}
                    onChangeText={setCreatePassword}
                    placeholder={`パスワード (${MIN_SYNC_PASSWORD_LENGTH}文字以上)`}
                    placeholderTextColor={theme.colors.textMuted}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                  <PrimaryButton
                    label="同期コードを発行する"
                    onPress={handleCreateCode}
                    disabled={syncing || !isValidSyncPassword(createPassword)}
                    style={styles.button}
                  />
                </>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>コードを入力して引き継ぐ</Text>
              <Text style={styles.helpText}>
                別の端末で発行した同期コードとパスワードを入力すると、この端末のデータをそのデータで上書きします。
              </Text>
              <TextInput
                style={styles.input}
                value={codeInput}
                onChangeText={setCodeInput}
                placeholder="例: AB3DEFGH"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="characters"
                maxLength={12}
              />
              <TextInput
                style={styles.input}
                value={restorePassword}
                onChangeText={setRestorePassword}
                placeholder="パスワード"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
              />
              <PrimaryButton
                label="引き継ぐ"
                onPress={handleRestore}
                disabled={syncing || !codeInput.trim() || !isValidSyncPassword(restorePassword)}
                variant="danger"
                style={styles.button}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  groupTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  bgGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  bgOption: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    padding: 12,
  },
  bgOptionActive: {
    borderColor: theme.colors.primary,
  },
  bgSwatch: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  bgDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  bgLabel: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  bgLabelActive: {
    color: theme.colors.primary,
  },
  bgDesc: {
    color: theme.colors.textMuted,
    ...theme.textShadow(),
    fontSize: 11,
    lineHeight: 15,
  },
  notConfigured: {
    color: theme.colors.textMuted,
    ...theme.textShadow(),
    fontSize: 13,
    lineHeight: 19,
  },
  helpText: {
    color: theme.colors.textMuted,
    ...theme.textShadow(),
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  code: {
    color: theme.colors.accent,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 12,
  },
  syncedAt: {
    color: theme.colors.textMuted,
    ...theme.textShadow(),
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    color: theme.colors.text,
    fontSize: 16,
    padding: 12,
    marginBottom: 12,
    letterSpacing: 2,
  },
  button: {
    marginTop: 4,
  },
});
