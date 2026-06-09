import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  useColorScheme,
  TextInput,
  Animated,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, Article, NewsSource, SourceCategory } from '../types';
import { fetchSources, fetchArticles, sortArticles, filterArticles, getSourceById, formatDate } from '../newsApi';
import { Colors, DarkColors, Typography, Spacing, Radius, Elevation } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>;
};

export default function NewsFeedScreen({ navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? DarkColors : Colors;

  const [articles, setArticles] = useState<Article[]>([]);
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [categories, setCategories] = useState<SourceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [sourcesData, articlesData] = await Promise.all([
        fetchSources(),
        fetchArticles(),
      ]);
      setSources(sourcesData.sources);
      setCategories(sourcesData.categories);
      setArticles(sortArticles(articlesData.articles));
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } catch {
      setError('無法載入新聞，請檢查網絡連接。');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fadeAnim]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const filteredArticles = filterArticles(
    articles,
    sources,
    selectedCategory,
    selectedSource,
  ).filter(a =>
    searchQuery.trim() === '' ||
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.summary.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderCategoryChip = (cat: SourceCategory) => {
    const isSelected = selectedCategory === cat.id;
    const catColor = C.categoryColors[cat.id] ?? C.primary;
    return (
      <TouchableOpacity
        key={cat.id}
        onPress={() => {
          setSelectedCategory(isSelected ? null : cat.id);
          setSelectedSource(null);
        }}
        style={[
          styles.chip,
          {
            backgroundColor: isSelected ? catColor : isDark ? '#2C3537' : C.surfaceVariant,
            borderColor: catColor,
            borderWidth: isSelected ? 0 : 1,
          },
        ]}
        activeOpacity={0.7}
      >
        <Text
          style={[
            Typography.labelMedium,
            { color: isSelected ? '#FFFFFF' : catColor },
          ]}
        >
          {cat.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSourceChip = () => {
    const catSources = selectedCategory
      ? sources.filter(s => s.categoryId === selectedCategory && s.active)
      : [];
    if (catSources.length === 0) return null;
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sourceRow}>
        {catSources.map(source => {
          const isSelected = selectedSource === source.id;
          return (
            <TouchableOpacity
              key={source.id}
              onPress={() => setSelectedSource(isSelected ? null : source.id)}
              style={[
                styles.chip,
                styles.sourceChip,
                {
                  backgroundColor: isSelected ? C.secondaryContainer : 'transparent',
                  borderColor: C.outline,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  Typography.labelSmall,
                  { color: isSelected ? C.onSecondaryContainer : C.onSurfaceVariant },
                ]}
              >
                {source.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderArticle = ({ item }: { item: Article }) => {
    const source = getSourceById(sources, item.sourceId);
    const catColor = C.categoryColors[item.categoryId] ?? C.primary;
    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity
          testID={`article-card-${item.id}`}
          onPress={() => navigation.navigate('ArticleDetail', { article: item, sourceName: source?.name ?? item.sourceId })}
          style={[
            styles.card,
            Elevation.level1,
            { backgroundColor: C.surface, borderRadius: Radius.md },
          ]}
          activeOpacity={0.8}
        >
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.cardImagePlaceholder, { backgroundColor: catColor + '22' }]}>
              <Text style={[Typography.titleLarge, { color: catColor }]}>
                {source?.name.charAt(0) ?? '?'}
              </Text>
            </View>
          )}
          <View style={styles.cardBody}>
            <View style={styles.cardMeta}>
              <View style={[styles.sourceTag, { backgroundColor: catColor + '22' }]}>
                <Text style={[Typography.labelSmall, { color: catColor }]}>
                  {source?.name ?? item.sourceId}
                </Text>
              </View>
              <Text style={[Typography.bodySmall, { color: C.onSurfaceVariant }]}>
                {formatDate(item.publishedAt)}
              </Text>
            </View>
            <Text
              style={[Typography.titleMedium, styles.cardTitle, { color: C.onSurface }]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            <Text
              style={[Typography.bodySmall, { color: C.onSurfaceVariant, marginTop: Spacing.xs }]}
              numberOfLines={2}
            >
              {item.summary}
            </Text>
            {item.tags.length > 0 && (
              <View style={styles.tagRow}>
                {item.tags.slice(0, 3).map(tag => (
                  <View key={tag} style={[styles.tag, { backgroundColor: C.surfaceVariant }]}>
                    <Text style={[Typography.labelSmall, { color: C.onSurfaceVariant }]}>
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const styles2 = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
      backgroundColor: C.surface,
    },
    headerTitle: {
      ...Typography.headlineMedium,
      color: C.onSurface,
      fontWeight: '700',
    },
    headerSubtitle: {
      ...Typography.bodySmall,
      color: C.onSurfaceVariant,
      marginTop: 2,
    },
    searchBar: {
      marginHorizontal: Spacing.md,
      marginVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: C.surfaceVariant,
      borderRadius: Radius.full,
      ...Typography.bodyMedium,
      color: C.onSurface,
    },
    filterSection: {
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.sm,
      backgroundColor: C.surface,
    },
    categoryScroll: { flexDirection: 'row', gap: Spacing.xs },
    emptyText: {
      ...Typography.bodyMedium,
      color: C.onSurfaceVariant,
      textAlign: 'center',
      marginTop: Spacing.xxl,
      paddingHorizontal: Spacing.xl,
    },
    errorBtn: {
      marginTop: Spacing.md,
      alignSelf: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      backgroundColor: C.primaryContainer,
      borderRadius: Radius.full,
    },
    errorBtnText: {
      ...Typography.labelLarge,
      color: C.onPrimaryContainer,
    },
    listContent: { padding: Spacing.md, gap: Spacing.sm },
    countText: {
      ...Typography.labelSmall,
      color: C.onSurfaceVariant,
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.xs,
    },
  });

  if (loading) {
    return (
      <View style={[styles2.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={[Typography.bodyMedium, { color: C.onSurfaceVariant, marginTop: Spacing.md }]}>
          載入新聞中…
        </Text>
      </View>
    );
  }

  if (error && articles.length === 0) {
    return (
      <View style={[styles2.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[Typography.bodyMedium, { color: C.error }]}>{error}</Text>
        <TouchableOpacity style={styles2.errorBtn} onPress={loadData}>
          <Text style={styles2.errorBtnText}>重試</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View testID="news-feed-screen" style={styles2.container}>
      <View style={styles2.header}>
        <Text style={styles2.headerTitle}>HK News</Text>
        <Text style={styles2.headerSubtitle}>
          {filteredArticles.length} 篇文章
        </Text>
      </View>

      <TextInput
        testID="search-input"
        style={styles2.searchBar}
        placeholder="搜尋新聞…"
        placeholderTextColor={C.onSurfaceVariant}
        value={searchQuery}
        onChangeText={setSearchQuery}
        returnKeyType="search"
      />

      <View style={styles2.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles2.categoryScroll}>
            <TouchableOpacity
              onPress={() => { setSelectedCategory(null); setSelectedSource(null); }}
              style={[
                styles.chip,
                {
                  backgroundColor: !selectedCategory ? C.primary : isDark ? '#2C3537' : C.surfaceVariant,
                  borderColor: C.primary,
                  borderWidth: !selectedCategory ? 0 : 1,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[Typography.labelMedium, { color: !selectedCategory ? '#FFFFFF' : C.primary }]}>
                全部
              </Text>
            </TouchableOpacity>
            {categories.map(renderCategoryChip)}
          </View>
        </ScrollView>
        {renderSourceChip()}
      </View>

      <FlatList
        data={filteredArticles}
        keyExtractor={item => item.id}
        renderItem={renderArticle}
        contentContainerStyle={styles2.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
        ListEmptyComponent={
          <Text style={styles2.emptyText}>
            找不到相關新聞，請嘗試其他篩選條件。
          </Text>
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    marginRight: Spacing.xs,
  },
  sourceChip: {
    borderWidth: 1,
  },
  sourceRow: {
    marginTop: Spacing.xs,
  },
  card: {
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: Spacing.md,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  sourceTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  cardTitle: {
    marginTop: Spacing.xs,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
});
