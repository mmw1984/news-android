import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  checkAvailability,
  downloadModel,
  summarizeText,
  subscribeToDownloadEvents,
} from '../GeminiNano';
import type { GeminiStatus, DownloadEvent } from '../types';
import { Colors, DarkColors, Typography, Spacing, Radius, Elevation } from '../theme';

const SAMPLE_TEXTS = [
  'Hong Kong authorities announced a new infrastructure project worth billions of dollars that aims to connect the city to the Greater Bay Area with high-speed rail and advanced logistics networks.',
  '科技巨頭蘋果公司發布最新款 iPhone，搭載全新 A 系列晶片，性能提升超過 40%，相機系統亦有重大升級，售價由港幣 7,999 元起。',
  'The Federal Reserve signaled potential interest rate cuts later this year as inflation data showed continued cooling, sending global markets higher in anticipation of looser monetary policy.',
];

export default function AIPlaygroundScreen() {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? DarkColors : Colors;

  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [geminiStatus, setGeminiStatus] = useState<GeminiStatus>('UNKNOWN');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [_isDownloading, setIsDownloading] = useState(false); // updated by download events
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [_hasChecked, setHasChecked] = useState(false); // tracks initial check

  const summaryAnim = useRef(new Animated.Value(0)).current;
  const downloadSubRef = useRef<ReturnType<typeof subscribeToDownloadEvents> | null>(null);

  const handleCheckStatus = useCallback(async () => {
    setError(null);
    setGeminiStatus('CHECKING');
    const status = await checkAvailability();
    setGeminiStatus(status);
    setHasChecked(true);
  }, []);

  const handleDownload = useCallback(async () => {
    setError(null);
    setGeminiStatus('DOWNLOADING');
    setDownloadProgress(0);

    downloadSubRef.current = subscribeToDownloadEvents((event: DownloadEvent) => {
      if (event.status === 'onDownloadStarted') {
        setIsDownloading(true);
      } else if (event.status === 'onDownloadProgress' && event.bytesToDownload > 0) {
        setDownloadProgress(event.bytesDownloaded / event.bytesToDownload);
      } else if (event.status === 'onDownloadCompleted') {
        setIsDownloading(false);
        setGeminiStatus('AVAILABLE');
        downloadSubRef.current?.remove();
      } else if (event.status === 'onDownloadFailed') {
        setIsDownloading(false);
        setError('模型下載失敗。');
        setGeminiStatus('DOWNLOADABLE');
        downloadSubRef.current?.remove();
      }
    });

    try {
      await downloadModel();
    } catch {
      setError('下載失敗，請重試。');
      setGeminiStatus('DOWNLOADABLE');
      downloadSubRef.current?.remove();
    }
  }, []);

  const handleSummarize = useCallback(async () => {
    const text = inputText.trim();
    if (!text) {
      setError('請輸入要摘要的文字。');
      return;
    }
    if (text.length < 50) {
      setError('文字太短，請輸入較長的段落（最少 50 字符）。');
      return;
    }

    setIsSummarizing(true);
    setError(null);
    setSummary(null);
    summaryAnim.setValue(0);

    try {
      const result = await summarizeText(text);
      setSummary(result);
      Animated.timing(summaryAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }).start();
    } catch {
      setError('摘要失敗，請重試。');
    } finally {
      setIsSummarizing(false);
    }
  }, [inputText, summaryAnim]);

  const handleUseSample = (text: string) => {
    setInputText(text);
    setSummary(null);
    setError(null);
    summaryAnim.setValue(0);
  };

  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = inputText.trim().length;

  const renderModelStatus = () => {
    if (geminiStatus === 'UNKNOWN') {
      return (
        <TouchableOpacity
          testID="check-status-button"
          onPress={handleCheckStatus}
          style={[statusStyles.statusCard, { backgroundColor: isDark ? '#2A2F30' : C.surfaceVariant }]}
          activeOpacity={0.8}
        >
          <Text style={[Typography.titleSmall, { color: C.onSurfaceVariant }]}>
            ✨ 檢查 Gemini Nano 狀態
          </Text>
          <Text style={[Typography.bodySmall, { color: C.onSurfaceVariant, marginTop: Spacing.xs }]}>
            點擊以檢查裝置是否支援 Gemini Nano
          </Text>
        </TouchableOpacity>
      );
    }

    if (geminiStatus === 'CHECKING') {
      return (
        <View style={[statusStyles.statusCard, { backgroundColor: isDark ? '#2A2F30' : C.surfaceVariant }]}>
          <ActivityIndicator color={C.primary} />
          <Text style={[Typography.bodySmall, { color: C.onSurfaceVariant, marginTop: Spacing.xs }]}>
            正在檢查…
          </Text>
        </View>
      );
    }

    if (geminiStatus === 'UNAVAILABLE' || geminiStatus === 'ERROR') {
      return (
        <View style={[statusStyles.statusCard, { backgroundColor: C.errorContainer }]}>
          <Text style={[Typography.labelMedium, { color: C.onErrorContainer }]}>
            ⚠️ 此裝置不支援 Gemini Nano
          </Text>
          <Text style={[Typography.bodySmall, { color: C.onErrorContainer, marginTop: Spacing.xs }]}>
            需要搭載 Gemini Nano 的裝置（如 Pixel 8 或以上）。
          </Text>
        </View>
      );
    }

    if (geminiStatus === 'DOWNLOADABLE') {
      return (
        <View style={[statusStyles.statusCard, { backgroundColor: isDark ? '#1E2A2C' : C.tertiaryContainer }]}>
          <Text style={[Typography.titleSmall, { color: C.onTertiaryContainer }]}>
            Gemini Nano 可供下載
          </Text>
          <Text style={[Typography.bodySmall, { color: C.onTertiaryContainer, marginTop: Spacing.xs, marginBottom: Spacing.md }]}>
            下載模型後（約 600MB）即可在裝置上本地執行 AI 摘要。
          </Text>
          <TouchableOpacity
            testID="playground-download-button"
            onPress={handleDownload}
            style={[statusStyles.downloadBtn, { backgroundColor: C.tertiary }]}
            activeOpacity={0.8}
          >
            <Text style={[Typography.labelLarge, { color: C.onTertiary }]}>
              下載 AI 模型
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (geminiStatus === 'DOWNLOADING') {
      return (
        <View style={[statusStyles.statusCard, { backgroundColor: isDark ? '#1E2A2C' : C.tertiaryContainer }]}>
          <Text style={[Typography.titleSmall, { color: C.onTertiaryContainer }]}>
            正在下載 Gemini Nano…
          </Text>
          <View style={[statusStyles.progressTrack, { backgroundColor: C.outlineVariant }]}>
            <View
              style={[
                statusStyles.progressFill,
                { backgroundColor: C.tertiary, width: `${Math.round(downloadProgress * 100)}%` },
              ]}
            />
          </View>
          <Text style={[Typography.bodySmall, { color: C.onTertiaryContainer }]}>
            {Math.round(downloadProgress * 100)}%
          </Text>
        </View>
      );
    }

    // AVAILABLE
    return (
      <View style={[statusStyles.statusCard, { backgroundColor: isDark ? '#1A2E1E' : '#E8F5E9' }]}>
        <Text style={[Typography.labelMedium, { color: '#2E7D32' }]}>
          ✅ Gemini Nano 已就緒
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        testID="ai-playground-screen"
        style={{ flex: 1, backgroundColor: C.background }}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: Spacing.xxl }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ marginBottom: Spacing.md }}>
          <Text style={[Typography.headlineMedium, { color: C.onSurface, fontWeight: '700' }]}>
            AI Playground
          </Text>
          <Text style={[Typography.bodyMedium, { color: C.onSurfaceVariant, marginTop: Spacing.xs }]}>
            使用 Gemini Nano 對任何文字進行本地 AI 摘要
          </Text>
        </View>

        {/* Model Status */}
        {renderModelStatus()}

        {/* Sample texts */}
        <View style={{ marginTop: Spacing.md, marginBottom: Spacing.sm }}>
          <Text style={[Typography.labelMedium, { color: C.onSurfaceVariant, marginBottom: Spacing.sm }]}>
            試用範例
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {SAMPLE_TEXTS.map((text, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleUseSample(text)}
                style={[
                  sampleStyles.sampleCard,
                  Elevation.level1,
                  { backgroundColor: C.surface },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[Typography.bodySmall, { color: C.onSurface }]} numberOfLines={3}>
                  {text}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Text input */}
        <View style={{ marginTop: Spacing.md }}>
          <TextInput
            testID="playground-text-input"
            style={[
              inputStyles.textArea,
              {
                backgroundColor: isDark ? '#2C3537' : C.surfaceVariant,
                color: C.onSurface,
                borderColor: inputText.length > 0 ? C.primary : 'transparent',
              },
            ]}
            placeholder="在此貼上要摘要的文章或段落…"
            placeholderTextColor={C.onSurfaceVariant}
            multiline
            textAlignVertical="top"
            value={inputText}
            onChangeText={text => {
              setInputText(text);
              setSummary(null);
              setError(null);
            }}
          />
          <View style={inputStyles.countRow}>
            <Text style={[Typography.labelSmall, { color: C.onSurfaceVariant }]}>
              {charCount} 字符 · {wordCount} 詞
            </Text>
            {inputText.length > 0 && (
              <TouchableOpacity onPress={() => { setInputText(''); setSummary(null); setError(null); }}>
                <Text style={[Typography.labelSmall, { color: C.primary }]}>清除</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Error */}
        {error && (
          <Text style={[Typography.bodySmall, { color: C.error, marginTop: Spacing.sm }]}>
            {error}
          </Text>
        )}

        {/* Summarize button */}
        <TouchableOpacity
          testID="playground-summarize-button"
          onPress={handleSummarize}
          disabled={isSummarizing || geminiStatus !== 'AVAILABLE' || inputText.trim().length === 0}
          style={[
            playgroundStyles.summarizeBtn,
            {
              backgroundColor: C.primary,
              opacity:
                isSummarizing || geminiStatus !== 'AVAILABLE' || inputText.trim().length === 0
                  ? 0.4
                  : 1,
            },
          ]}
          activeOpacity={0.8}
        >
          {isSummarizing ? (
            <ActivityIndicator color={C.onPrimary} />
          ) : (
            <Text style={[Typography.labelLarge, { color: C.onPrimary }]}>
              ✨ 生成 AI 摘要
            </Text>
          )}
        </TouchableOpacity>

        {/* Summary output */}
        {summary && (
          <Animated.View
            testID="ai-summary-result"
            style={[
              summaryStyles.card,
              { backgroundColor: isDark ? '#1E2A2C' : C.tertiaryContainer, opacity: summaryAnim },
            ]}
          >
            <Text style={[Typography.titleSmall, { color: C.onTertiaryContainer, marginBottom: Spacing.sm }]}>
              AI 摘要結果
            </Text>
            <Text style={[Typography.bodyMedium, { color: C.onTertiaryContainer, lineHeight: 24 }]}>
              {summary}
            </Text>
            <TouchableOpacity
              onPress={() => { setSummary(null); summaryAnim.setValue(0); }}
              style={{ marginTop: Spacing.md }}
            >
              <Text style={[Typography.labelSmall, { color: C.tertiary }]}>清除結果</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const statusStyles = StyleSheet.create({
  statusCard: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  downloadBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  progressTrack: {
    height: 6,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
});

const sampleStyles = StyleSheet.create({
  sampleCard: {
    width: 220,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginRight: Spacing.sm,
  },
});

const inputStyles = StyleSheet.create({
  textArea: {
    minHeight: 180,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    ...Typography.bodyMedium,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
});

const playgroundStyles = StyleSheet.create({
  summarizeBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
});

const summaryStyles = StyleSheet.create({
  card: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
});
