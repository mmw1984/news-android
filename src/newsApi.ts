import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SourcesResponse, ArticlesResponse, FeedResponse, Article, NewsSource } from './types';

const BASE_URL = 'https://mmw1984.com/news-api';
const FEED_KEY = 'cached_feed';
const SOURCES_KEY = 'cached_sources';
const ARTICLES_KEY = 'cached_articles';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const CACHE_TIME_KEY = 'cache_time';

function resolveApiUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) {
    return pathOrUrl;
  }
  return new URL(pathOrUrl.replace(/^\/+/, ''), `${BASE_URL}/`).toString();
}

async function fetchWithCache<T>(url: string, cacheKey: string): Promise<T> {
  const timeKey = `${cacheKey}_${CACHE_TIME_KEY}`;
  try {
    const [cachedData, cachedTime] = await Promise.all([
      AsyncStorage.getItem(cacheKey),
      AsyncStorage.getItem(timeKey),
    ]);

    const now = Date.now();
    const isFresh =
      cachedTime && now - parseInt(cachedTime, 10) < CACHE_TTL_MS;

    if (cachedData && isFresh) {
      return JSON.parse(cachedData) as T;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as T;

    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    await AsyncStorage.setItem(timeKey, String(now));
    return data;
  } catch (error) {
    // On network error, try to return stale cache
    const cachedData = await AsyncStorage.getItem(cacheKey);
    if (cachedData) return JSON.parse(cachedData) as T;
    throw error;
  }
}

export async function fetchFeed(): Promise<FeedResponse> {
  return fetchWithCache<FeedResponse>(
    `${BASE_URL}/data/feed.json`,
    FEED_KEY,
  );
}

export async function fetchSources(): Promise<SourcesResponse> {
  const feed = await fetchFeed();
  return fetchWithCache<SourcesResponse>(
    resolveApiUrl(feed.endpoints?.sources ?? feed.sourcesUrl ?? 'data/sources.json'),
    SOURCES_KEY,
  );
}

export async function fetchArticles(): Promise<ArticlesResponse> {
  const feed = await fetchFeed();
  return fetchWithCache<ArticlesResponse>(
    resolveApiUrl(feed.endpoints?.articles ?? feed.articlesUrl ?? 'data/articles.json'),
    ARTICLES_KEY,
  );
}

export function sortArticles(articles: Article[]): Article[] {
  return [...articles].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function filterArticles(
  articles: Article[],
  sources: NewsSource[],
  selectedCategory: string | null,
  selectedSourceId: string | null,
): Article[] {
  return articles.filter(article => {
    if (selectedCategory && article.categoryId !== selectedCategory) return false;
    if (selectedSourceId && article.sourceId !== selectedSourceId) return false;
    return true;
  });
}

export function getSourceById(sources: NewsSource[], sourceId: string): NewsSource | undefined {
  return sources.find(s => s.id === sourceId);
}

export function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString('zh-Hant-HK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}
