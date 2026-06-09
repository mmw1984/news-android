// ─── News API Types ────────────────────────────────────────────────────────────

export interface SourceCategory {
  id: string;
  name: string;
  description: string;
}

export interface NewsSource {
  id: string;
  name: string;
  categoryId: string;
  homeUrl: string;
  language: string[];
  active: boolean;
}

export interface Article {
  id: string;
  sourceId: string;
  categoryId: string;
  title: string;
  summary: string;
  content: string;
  url: string;
  imageUrl: string | null;
  language: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  editor?: string;
}

export interface SourcesResponse {
  schemaVersion: string;
  updatedAt: string;
  defaultLocale: string;
  categories: SourceCategory[];
  sources: NewsSource[];
}

export interface ArticlesResponse {
  schemaVersion: string;
  updatedAt: string;
  defaultLocale: string;
  articles: Article[];
}

// ─── Gemini Nano Types ─────────────────────────────────────────────────────────

export type GeminiStatus =
  | 'AVAILABLE'
  | 'DOWNLOADABLE'
  | 'DOWNLOADING'
  | 'UNAVAILABLE'
  | 'UNKNOWN'
  | 'CHECKING'
  | 'ERROR';

export interface DownloadEvent {
  status:
    | 'onDownloadStarted'
    | 'onDownloadProgress'
    | 'onDownloadCompleted'
    | 'onDownloadFailed';
  bytesToDownload: number;
  bytesDownloaded: number;
}

// ─── Navigation Types ──────────────────────────────────────────────────────────

export type RootStackParamList = {
  Main: undefined;
  ArticleDetail: { article: Article; sourceName: string };
};

export type MainTabParamList = {
  NewsFeed: undefined;
  AIPlayground: undefined;
};
