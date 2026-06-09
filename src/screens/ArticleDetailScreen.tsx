import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Image,
  useColorScheme,
  ActivityIndicator,
  Animated,
  Share,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, GeminiStatus, DownloadEvent } from '../types';
import {
  checkAvailability,
  downloadModel,
  summarizeText,
  subscribeToDownloadEvents,
} from '../GeminiNano';
import { formatDate } from '../newsApi';
import { Colors, DarkColors, Typography, Spacing, Radius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleDetail'>;

export default function ArticleDetailScreen({ route, navigation }: Props) {
  const { article, sourceName } = route.params;
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? DarkColors : Colors;

  const [geminiStatus, setGeminiStatus] = useState<GeminiStatus>('CHECKING');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [_isDownloading, setIsDownloading] = useState(false); // updated via download event callback
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);

  const summaryAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    navigation.setOptions({ title: sourceName });
    let mounted = true;

    checkAvailability().then(status => {
      if (mounted) setGeminiStatus(status);
    });

    const sub = subscribeToDownloadEvents((event: DownloadEvent) => {
      if (!mounted) return;
      if (event.status === 'onDownloadStarted') {
        setIsDownloading(true);
        setDownloadProgress(0);
      } else if (event.status === 'onDownloadProgress' && event.bytesToDownload > 0) {
        setDownloadProgress(event.bytesDownloaded / event.bytesToDownload);
      } else if (event.status === 'onDownloadCompleted') {
        setIsDownloading(false);
        setGeminiStatus('AVAILABLE');
        setDownloadProgress(1);
      } else if (event.status === 'onDownloadFailed') {
        setIsDownloading(false);
        setAiError('模型下載失敗，請重試。');
      }
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, [navigation, sourceName]);

  const handleDownload = useCallback(async () => {
    setAiError(null);
    setGeminiStatus('DOWNLOADING');
    try {
      await downloadModel();
    } catch {
      setAiError('下載失敗，請重試。');
      setGeminiStatus('DOWNLOADABLE');
    }
  }, []);

  const handleSummarize = useCallback(async () => {
    setIsSummarizing(true);
    setAiError(null);
    try {
      const textToSummarize = `${article.title}\n\n${article.content}`;
      const result = await summarizeText(textToSummarize);
      setAiSummary(result);
      Animated.timing(summaryAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } catch {
      setAiError('AI 摘要失敗，請重試。');
    } finally {
      setIsSummarizing(false);
    }
  }, [article, summaryAnim]);

  const handleOpenURL = useCallback(() => {
    Linking.openURL(article.url).catch(() => {});
  }, [article.url]);

  const handleShare = useCallback(async () => {
    await Share.share({ title: article.title, message: article.url });
  }, [article]);

  const catColor = C.categoryColors[article.categoryId] ?? C.primary;

  const renderAISection = () => {
    if (geminiStatus === 'CHECKING') {
      return (
        <View style={[aiStyles.aiCard, { backgroundColor: isDark ? '#1E2A2C' : C.tertiaryContainer }]}>
          <ActivityIndicator size="small" color={C.tertiary} />
          <Text style={[Typography.bodySmall, { color: C.onTertiaryContainer, marginTop: Spacing.xs }]}>
            正在檢查 AI 功能…
          </Text>
        </View>
      );
    }

    if (geminiStatus === 'UNAVAILABLE' || geminiStatus === 'ERROR') {
      return (
        <View style={[aiStyles.aiCard, { backgroundColor: C.errorContainer }]}>
          <Text style={[Typography.labelMedium, { color: C.onErrorContainer }]}>
            ⚠️ 此裝置不支援 Gemini Nano
          </Text>
          <Text style={[Typography.bodySmall, { color: C.onErrorContainer, marginTop: Spacing.xs }]}>
            需要搭載 Gemini Nano 的 Pixel 8+ 裝置。
          </Text>
        </View>
      );
    }

    if (geminiStatus === 'DOWNLOADABLE') {
      return (
        <View style={[aiStyles.aiCard, { backgroundColor: isDark ? '#1E2A2C' : C.tertiaryContainer }]}>
          <Text style={[Typography.titleSmall, { color: C.onTertiaryContainer }]}>
            ✨ Gemini Nano AI 摘要
          </Text>
          <Text style={[Typography.bodySmall, { color: C.onTertiaryContainer, marginTop: Spacing.xs, marginBottom: Spacing.md }]}>
            下載 Gemini Nano 模型（約 600MB）以啟用本地 AI 摘要功能。
          </Text>
          <TouchableOpacity
            testID="download-model-button"
            onPress={handleDownload}
            style={[aiStyles.aiBtn, { backgroundColor: C.tertiary }]}
            activeOpacity={0.8}
          >
            <Text style={[Typography.labelLarge, { color: C.onTertiary }]}>
              下載 AI 模型
            </Text>
          </TouchableOpacity>
          {aiError && (
            <Text style={[Typography.bodySmall, { color: C.error, marginTop: Spacing.sm }]}>
              {aiError}
            </Text>
          )}
        </View>
      );
    }

    if (geminiStatus === 'DOWNLOADING') {
      return (
        <View style={[aiStyles.aiCard, { backgroundColor: isDark ? '#1E2A2C' : C.tertiaryContainer }]}>
          <Text style={[Typography.titleSmall, { color: C.onTertiaryContainer }]}>
            正在下載 Gemini Nano…
          </Text>
          <View style={[aiStyles.progressTrack, { backgroundColor: C.outlineVariant }]}>
            <Animated.View
              style={[
                aiStyles.progressFill,
                {
                  backgroundColor: C.tertiary,
                  width: `${Math.round(downloadProgress * 100)}%`,
                },
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
      <View style={[aiStyles.aiCard, { backgroundColor: isDark ? '#1E2A2C' : C.tertiaryContainer }]}>
        <View style={aiStyles.aiHeader}>
          <Text style={[Typography.titleSmall, { color: C.onTertiaryContainer }]}>
            ✨ Gemini Nano AI 摘要
          </Text>
          {!aiSummary && (
            <TouchableOpacity
              testID="generate-ai-summary-button"
              onPress={handleSummarize}
              disabled={isSummarizing}
              style={[aiStyles.aiBtn, { backgroundColor: C.tertiary, opacity: isSummarizing ? 0.6 : 1 }]}
              activeOpacity={0.8}
            >
              {isSummarizing ? (
                <ActivityIndicator size="small" color={C.onTertiary} />
              ) : (
                <Text style={[Typography.labelLarge, { color: C.onTertiary }]}>
                  生成摘要
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {aiSummary && (
          <Animated.View style={{ opacity: summaryAnim, marginTop: Spacing.sm }}>
            <Text style={[Typography.bodyMedium, { color: C.onTertiaryContainer, lineHeight: 22 }]}>
              {aiSummary}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setAiSummary(null);
                summaryAnim.setValue(0);
              }}
              style={{ marginTop: Spacing.sm }}
            >
              <Text style={[Typography.labelSmall, { color: C.tertiary }]}>重新生成</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        {aiError && (
          <Text style={[Typography.bodySmall, { color: C.error, marginTop: Spacing.sm }]}>
            {aiError}
          </Text>
        )}
      </View>
    );
  };

  return (
    <ScrollView
      testID="article-detail-screen"
      style={{ flex: 1, backgroundColor: C.background }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Image */}
      {article.imageUrl ? (
        <Image
          source={{ uri: article.imageUrl }}
          style={detailStyles.hero}
          resizeMode="cover"
        />
      ) : (
        <View style={[detailStyles.hero, { backgroundColor: catColor + '33', alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={[Typography.displayMedium, { color: catColor }]}>
            {sourceName.charAt(0)}
          </Text>
        </View>
      )}

      <View style={{ padding: Spacing.md }}>
        {/* Meta row */}
        <View style={[detailStyles.metaRow]}>
          <View style={[detailStyles.sourceTag, { backgroundColor: catColor + '22' }]}>
            <Text style={[Typography.labelSmall, { color: catColor }]}>{sourceName}</Text>
          </View>
          <Text style={[Typography.bodySmall, { color: C.onSurfaceVariant }]}>
            {formatDate(article.publishedAt)}
          </Text>
        </View>

        {/* Title */}
        <Text style={[Typography.headlineSmall, { color: C.onSurface, marginTop: Spacing.sm, fontWeight: '700' }]}>
          {article.title}
        </Text>

        {/* Summary */}
        <Text style={[Typography.bodyMedium, { color: C.onSurfaceVariant, marginTop: Spacing.md, lineHeight: 24 }]}>
          {article.summary}
        </Text>

        {/* Content */}
        {article.content !== article.summary && (
          <Text style={[Typography.bodyMedium, { color: C.onSurface, marginTop: Spacing.md, lineHeight: 24 }]}>
            {article.content}
          </Text>
        )}

        {/* Tags */}
        {article.tags.length > 0 && (
          <View style={detailStyles.tagRow}>
            {article.tags.map(tag => (
              <View key={tag} style={[detailStyles.tag, { backgroundColor: C.surfaceVariant }]}>
                <Text style={[Typography.labelSmall, { color: C.onSurfaceVariant }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* AI Section */}
        <View style={{ marginTop: Spacing.lg }}>
          {renderAISection()}
        </View>

        {/* Action buttons */}
        <View style={[detailStyles.actionRow, { marginTop: Spacing.lg }]}>
          <TouchableOpacity
            testID="open-article-button"
            onPress={handleOpenURL}
            style={[detailStyles.primaryBtn, { backgroundColor: C.primary }]}
            activeOpacity={0.8}
          >
            <Text style={[Typography.labelLarge, { color: C.onPrimary }]}>
              閱讀原文
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            style={[detailStyles.secondaryBtn, { borderColor: C.outline }]}
            activeOpacity={0.8}
          >
            <Text style={[Typography.labelLarge, { color: C.primary }]}>
              分享
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const detailStyles = StyleSheet.create({
  hero: {
    width: '100%',
    height: 220,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    alignItems: 'center',
    borderWidth: 1,
  },
});

const aiStyles = StyleSheet.create({
  aiCard: {
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    minWidth: 100,
    alignItems: 'center',
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
