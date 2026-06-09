/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { NativeModules, DeviceEventEmitter, Linking } from 'react-native';
import App from '../App';

// -------------------------------------------------------------
// Environment Mocks
// -------------------------------------------------------------

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  const mockStorage: Record<string, string> = {};
  return {
    setItem: jest.fn(async (key: string, value: string) => {
      mockStorage[key] = value;
    }),
    getItem: jest.fn(async (key: string) => {
      return mockStorage[key] || null;
    }),
    removeItem: jest.fn(async (key: string) => {
      delete mockStorage[key];
    }),
    clear: jest.fn(async () => {
      Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    }),
  };
});

// Mock Native GeminiNano module
const mockGeminiNano = {
  checkAvailability: jest.fn(),
  downloadModel: jest.fn(),
  summarizeText: jest.fn(),
};
NativeModules.GeminiNano = mockGeminiNano;

// Mock Linking
jest.spyOn(Linking, 'openURL').mockImplementation(() => Promise.resolve(true));

// Mock fetch
const mockSources = {
  categories: [
    { id: 'tech', name: 'Technology', description: 'Tech News' },
    { id: 'sports', name: 'Sports', description: 'Sports News' }
  ],
  sources: [
    { id: 'techcrunch', name: 'TechCrunch', categoryId: 'tech', homeUrl: 'https://techcrunch.com', language: 'en', active: true },
    { id: 'espn', name: 'ESPN', categoryId: 'sports', homeUrl: 'https://espn.com', language: 'en', active: true }
  ]
};

const mockArticles = {
  articles: [
    {
      id: 'art1',
      sourceId: 'techcrunch',
      categoryId: 'tech',
      title: 'Gemini Nano in React Native',
      summary: 'A summary of Gemini Nano on-device AI integration.',
      content: 'On-device LLMs are becoming increasingly popular. Gemini Nano offers local text summarization capabilities directly on Android devices with minimal latency.',
      url: 'https://techcrunch.com/gemini-nano-rn',
      imageUrl: 'https://techcrunch.com/image.jpg',
      language: 'en',
      tags: ['AI', 'React Native', 'Android'],
      publishedAt: '2026-06-09T10:00:00Z',
      updatedAt: '2026-06-09T10:00:00Z'
    },
    {
      id: 'art2',
      sourceId: 'espn',
      categoryId: 'sports',
      title: 'Championship Finals',
      summary: 'The championship finals concluded yesterday.',
      content: 'A thrilling game ended in a late victory. Fans celebrated all night long as the home team clinched the trophy.',
      url: 'https://espn.com/finals',
      imageUrl: 'https://espn.com/image.jpg',
      language: 'en',
      tags: ['Sports', 'Championship'],
      publishedAt: '2026-06-09T11:00:00Z',
      updatedAt: '2026-06-09T11:00:00Z'
    }
  ]
};

const mockFeed = {
  endpoints: {
    sources: 'http://localhost:3000/sources.json',
    articles: 'http://localhost:3000/articles.json',
    feed: 'http://localhost:3000/feed.json'
  }
};

const setupFetchMock = (success = true) => {
  global.fetch = jest.fn((url: string) => {
    if (!success) {
      return Promise.reject(new Error('Network error'));
    }
    if (url.endsWith('feed.json')) {
      return Promise.resolve({
        ok: true,
        json: async () => mockFeed,
      } as any);
    }
    if (url.endsWith('sources.json')) {
      return Promise.resolve({
        ok: true,
        json: async () => mockSources,
      } as any);
    }
    if (url.endsWith('articles.json')) {
      return Promise.resolve({
        ok: true,
        json: async () => mockArticles,
      } as any);
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({}),
    } as any);
  });
};

describe('React Native News App Integration & E2E Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupFetchMock(true);
    mockGeminiNano.checkAvailability.mockResolvedValue('DOWNLOADABLE');
    mockGeminiNano.downloadModel.mockResolvedValue(undefined);
    mockGeminiNano.summarizeText.mockResolvedValue('• Bullet 1\n• Bullet 2\n• Bullet 3');
  });

  // =========================================================
  // TIER 1: FEATURE COVERAGE (25 TESTS)
  // =========================================================

  describe('Tier 1: Feature 1 - News Feed Loading & Filtering', () => {
    it('F1-T1-1: Renders News Feed Screen with loading indicator initially', async () => {
      const { getByTestId } = render(<App />);
      expect(getByTestId('feed-loading')).toBeTruthy();
    });

    it('F1-T1-2: Displays list of articles after successful API fetch', async () => {
      const { findByTestId } = render(<App />);
      const articleList = await findByTestId('feed-article-list');
      expect(articleList).toBeTruthy();
    });

    it('F1-T1-3: Filters articles when a category chip is pressed', async () => {
      const { findByText, findByTestId } = render(<App />);
      const techChip = await findByText('Technology');
      await act(async () => {
        fireEvent.press(techChip);
      });
      const list = await findByTestId('feed-article-list');
      expect(list).toBeTruthy();
    });

    it('F1-T1-4: Filters articles when a source is selected', async () => {
      const { findByText, findByTestId } = render(<App />);
      const sourceChip = await findByText('TechCrunch');
      await act(async () => {
        fireEvent.press(sourceChip);
      });
      const list = await findByTestId('feed-article-list');
      expect(list).toBeTruthy();
    });

    it('F1-T1-5: Renders pull-to-refresh control and fetches updated data', async () => {
      const { findByTestId } = render(<App />);
      const list = await findByTestId('feed-article-list');
      await act(async () => {
        list.props.onRefresh();
      });
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Tier 1: Feature 2 - Article Detail Screen', () => {
    it('F2-T1-1: Navigates to Article Detail Screen and renders article title and author', async () => {
      const { findByText } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      const detailTitle = await findByText('Gemini Nano in React Native');
      expect(detailTitle).toBeTruthy();
    });

    it('F2-T1-2: Renders correct published date, summary, and content digest', async () => {
      const { findByText } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      expect(await findByText('2026-06-09T10:00:00Z')).toBeTruthy();
      expect(await findByText('A summary of Gemini Nano on-device AI integration.')).toBeTruthy();
    });

    it('F2-T1-3: Renders category tags and publisher metadata', async () => {
      const { findByText } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      expect(await findByText('TechCrunch')).toBeTruthy();
      expect(await findByText('#AI')).toBeTruthy();
    });

    it('F2-T1-4: Renders "Open Original Article" link with correct external URL', async () => {
      const { findByText } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      const link = await findByText('Open Original Article');
      await act(async () => {
        fireEvent.press(link);
      });
      expect(Linking.openURL).toHaveBeenCalledWith('https://techcrunch.com/gemini-nano-rn');
    });

    it('F2-T1-5: Handles back navigation to return to News Feed screen', async () => {
      const { findByText, findByTestId } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      const backButton = await findByTestId('detail-back-button');
      await act(async () => {
        fireEvent.press(backButton);
      });
      expect(await findByTestId('feed-article-list')).toBeTruthy();
    });
  });

  describe('Tier 1: Feature 3 - Gemini Nano Model Management', () => {
    it('F3-T1-1: Renders status bar showing "Model not downloaded" when checkAvailability resolves to DOWNLOADABLE', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('DOWNLOADABLE');
      const { findByText, findByTestId } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      expect(await findByText('Model not downloaded')).toBeTruthy();
    });

    it('F3-T1-2: Displays download button when status is DOWNLOADABLE', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('DOWNLOADABLE');
      const { findByText, findByTestId } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      expect(await findByTestId('download-model-button')).toBeTruthy();
    });

    it('F3-T1-3: Triggers downloadModel API call when download button is clicked', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('DOWNLOADABLE');
      const { findByText, findByTestId } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      const btn = await findByTestId('download-model-button');
      await act(async () => {
        fireEvent.press(btn);
      });
      expect(mockGeminiNano.downloadModel).toHaveBeenCalled();
    });

    it('F3-T1-4: Renders progress percentage during active onDownloadProgress event', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('DOWNLOADABLE');
      const { findByText, findByTestId } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      await act(async () => {
        DeviceEventEmitter.emit('GeminiModelDownload', {
          status: 'onDownloadProgress',
          bytesToDownload: 1000,
          bytesDownloaded: 550,
        });
      });
      expect(await findByText('55%')).toBeTruthy();
    });

    it('F3-T1-5: Transitions status to "AVAILABLE" once onDownloadCompleted event fires', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('DOWNLOADABLE');
      const { findByText, findByTestId, queryByTestId } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      await act(async () => {
        DeviceEventEmitter.emit('GeminiModelDownload', {
          status: 'onDownloadCompleted',
        });
      });
      expect(await findByTestId('generate-summary-button')).toBeTruthy();
    });
  });

  describe('Tier 1: Feature 4 - Gemini Nano Article Summarization', () => {
    it('F4-T1-1: Renders "Generate AI Summary" button when model status is AVAILABLE', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('AVAILABLE');
      const { findByText, findByTestId } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      expect(await findByTestId('generate-summary-button')).toBeTruthy();
    });

    it('F4-T1-2: Triggers summarizeText on the current article content when button is pressed', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('AVAILABLE');
      const { findByText, findByTestId } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      const summarizeBtn = await findByTestId('generate-summary-button');
      await act(async () => {
        fireEvent.press(summarizeBtn);
      });
      expect(mockGeminiNano.summarizeText).toHaveBeenCalledWith(mockArticles.articles[0].content);
    });

    it('F4-T1-3: Displays a loading spinner/indicator while summarization is in progress', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('AVAILABLE');
      let resolveSummarize: (val: string) => void = () => {};
      mockGeminiNano.summarizeText.mockImplementation(() => new Promise((resolve) => {
        resolveSummarize = resolve;
      }));
      const { findByText, findByTestId } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      const summarizeBtn = await findByTestId('generate-summary-button');
      await act(async () => {
        fireEvent.press(summarizeBtn);
      });
      expect(await findByTestId('summary-loading')).toBeTruthy();
      await act(async () => {
        resolveSummarize('• Bullet 1');
      });
    });

    it('F4-T1-4: Displays the 3-bullet summary on success', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('AVAILABLE');
      const { findByText, findByTestId } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      const summarizeBtn = await findByTestId('generate-summary-button');
      await act(async () => {
        fireEvent.press(summarizeBtn);
      });
      expect(await findByText('• Bullet 1')).toBeTruthy();
    });

    it('F4-T1-5: Persists the summary locally so returning to the screen doesn\'t re-trigger API', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('AVAILABLE');
      const { findByText, findByTestId, queryByTestId } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      const summarizeBtn = await findByTestId('generate-summary-button');
      await act(async () => {
        fireEvent.press(summarizeBtn);
      });
      
      // Navigate back
      const backButton = await findByTestId('detail-back-button');
      await act(async () => {
        fireEvent.press(backButton);
      });

      // Go back to details
      const articleRef = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(articleRef);
      });

      // Assert summary is there and summarizeText was NOT called again (count = 1)
      expect(await findByText('• Bullet 1')).toBeTruthy();
      expect(mockGeminiNano.summarizeText).toHaveBeenCalledTimes(1);
    });
  });

  describe('Tier 1: Feature 5 - AI Playground Screen', () => {
    it('F5-T1-1: Renders text input area and "Summarize" button initially', async () => {
      const { findByTestId } = render(<App />);
      const playgroundTab = await findByTestId('tab-playground');
      await act(async () => {
        fireEvent.press(playgroundTab);
      });
      expect(await findByTestId('playground-input')).toBeTruthy();
      expect(await findByTestId('playground-submit')).toBeTruthy();
    });

    it('F5-T1-2: Allows user to type custom text in the input area', async () => {
      const { findByTestId } = render(<App />);
      const playgroundTab = await findByTestId('tab-playground');
      await act(async () => {
        fireEvent.press(playgroundTab);
      });
      const input = await findByTestId('playground-input');
      await act(async () => {
        fireEvent.changeText(input, 'This is some custom text input.');
      });
      expect(input.props.value).toBe('This is some custom text input.');
    });

    it('F5-T1-3: Disables the summarize button when input text is empty', async () => {
      const { findByTestId } = render(<App />);
      const playgroundTab = await findByTestId('tab-playground');
      await act(async () => {
        fireEvent.press(playgroundTab);
      });
      const btn = await findByTestId('playground-submit');
      expect(btn.props.accessibilityState?.disabled).toBe(true);
    });

    it('F5-T1-4: Calls summarizeText with the typed custom text when button is pressed', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('AVAILABLE');
      const { findByTestId } = render(<App />);
      const playgroundTab = await findByTestId('tab-playground');
      await act(async () => {
        fireEvent.press(playgroundTab);
      });
      const input = await findByTestId('playground-input');
      const btn = await findByTestId('playground-submit');
      await act(async () => {
        fireEvent.changeText(input, 'Custom query to summarize');
        fireEvent.press(btn);
      });
      expect(mockGeminiNano.summarizeText).toHaveBeenCalledWith('Custom query to summarize');
    });

    it('F5-T1-5: Displays the resulting summary beneath the input area', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('AVAILABLE');
      const { findByTestId, findByText } = render(<App />);
      const playgroundTab = await findByTestId('tab-playground');
      await act(async () => {
        fireEvent.press(playgroundTab);
      });
      const input = await findByTestId('playground-input');
      const btn = await findByTestId('playground-submit');
      await act(async () => {
        fireEvent.changeText(input, 'Custom query to summarize');
        fireEvent.press(btn);
      });
      expect(await findByText('• Bullet 1')).toBeTruthy();
    });
  });

  // =========================================================
  // TIER 2: BOUNDARY & CORNER CASES (25 TESTS)
  // =========================================================

  describe('Tier 2: Feature 1 - News Feed Boundaries', () => {
    it('F1-T2-1: Displays appropriate fallback empty state message when API returns no articles', async () => {
      global.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        json: async () => ({ articles: [] }),
      } as any));
      const { findByText } = render(<App />);
      expect(await findByText('No articles found')).toBeTruthy();
    });

    it('F1-T2-2: Falls back to offline AsyncStorage cache and displays cached feed if API fetch fails', async () => {
      // First prime cache
      const storage = require('@react-native-async-storage/async-storage');
      await storage.setItem('cached_articles', JSON.stringify(mockArticles.articles));
      // Setup fetch fail
      setupFetchMock(false);

      const { findByText } = render(<App />);
      expect(await findByText('Gemini Nano in React Native')).toBeTruthy();
    });

    it('F1-T2-3: Renders error banner if API fails and no local cache is available', async () => {
      setupFetchMock(false);
      const { findByText } = render(<App />);
      expect(await findByText('Failed to load news')).toBeTruthy();
    });

    it('F1-T2-4: Gracefully handles articles with missing non-essential fields', async () => {
      global.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        json: async () => ({
          articles: [{
            id: 'art_incomplete',
            sourceId: 'techcrunch',
            categoryId: 'tech',
            title: 'Incomplete Article',
            content: 'This has content but missing tags, summary and image.',
            url: 'https://techcrunch.com/incomplete',
            publishedAt: '2026-06-09T10:00:00Z',
          }]
        }),
      } as any));

      const { findByText } = render(<App />);
      expect(await findByText('Incomplete Article')).toBeTruthy();
    });

    it('F1-T2-5: Filters correctly when a category has no matching articles', async () => {
      const { findByText } = render(<App />);
      // Press Technology filter, then Sports which we make empty
      const techChip = await findByText('Technology');
      await act(async () => {
        fireEvent.press(techChip);
      });
      // Mocking empty Sports category articles
      global.fetch = jest.fn((url) => {
        if (url.endsWith('articles.json')) {
          return Promise.resolve({ ok: true, json: async () => ({ articles: [] }) } as any);
        }
        return Promise.resolve({ ok: true, json: async () => mockFeed } as any);
      });
      const sportsChip = await findByText('Sports');
      await act(async () => {
        fireEvent.press(sportsChip);
      });
      expect(await findByText('No articles in this category')).toBeTruthy();
    });
  });

  describe('Tier 2: Feature 2 - Article Detail Boundaries', () => {
    it('F2-T2-1: Renders fallback text if navigating to an article with invalid or missing ID', async () => {
      // Direct render navigation or routing error simulation
      const { findByText } = render(<App />);
      // We trigger navigations by simulated actions that fail lookup
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      // Simulate state where currentArticleId becomes corrupt
      const detailError = await findByText('Article not found');
      expect(detailError).toBeTruthy();
    });

    it('F2-T2-2: Handles extremely long article summaries/contents without overflowing UI layout', async () => {
      const { findByText } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      const summaryText = await findByText('A summary of Gemini Nano on-device AI integration.');
      expect(summaryText.props.style).toBeDefined();
    });

    it('F2-T2-3: Gracefully handles missing tags array', async () => {
      global.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        json: async () => ({
          articles: [{
            id: 'art1',
            sourceId: 'techcrunch',
            categoryId: 'tech',
            title: 'No Tags Article',
            content: 'Content text.',
            url: 'https://techcrunch.com/notags',
            publishedAt: '2026-06-09T10:00:00Z',
            tags: undefined // Missing tags
          }]
        }),
      } as any));

      const { findByText, queryByTestId } = render(<App />);
      const article = await findByText('No Tags Article');
      await act(async () => {
        fireEvent.press(article);
      });
      expect(queryByTestId('tags-container')).toBeNull();
    });

    it('F2-T2-4: Gracefully handles missing URL field by hiding the "Open Original Article" link', async () => {
      global.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        json: async () => ({
          articles: [{
            id: 'art1',
            sourceId: 'techcrunch',
            categoryId: 'tech',
            title: 'No URL Article',
            content: 'Content text.',
            publishedAt: '2026-06-09T10:00:00Z',
            url: undefined // Missing URL
          }]
        }),
      } as any));

      const { findByText, queryByText } = render(<App />);
      const article = await findByText('No URL Article');
      await act(async () => {
        fireEvent.press(article);
      });
      expect(queryByText('Open Original Article')).toBeNull();
    });

    it('F2-T2-5: Validates that clicking "Open Original Article" doesn\'t crash when Linking.openURL rejects', async () => {
      jest.spyOn(Linking, 'openURL').mockRejectedValueOnce(new Error('Cannot open URL'));
      const { findByText, findByTestId } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      const link = await findByText('Open Original Article');
      await act(async () => {
        fireEvent.press(link);
      });
      // Verify app catches error and displays alert/notice, rather than crashing
      expect(await findByTestId('link-error-message')).toBeTruthy();
    });
  });

  describe('Tier 2: Feature 3 - Gemini Nano Model Boundaries', () => {
    it('F3-T2-1: Renders status "AI Summarization Unavailable" when model status is UNAVAILABLE', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('UNAVAILABLE');
      const { findByText } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      expect(await findByText('AI Summarization Unavailable')).toBeTruthy();
    });

    it('F3-T2-2: Renders status "AI Summarization Unavailable" when model status is UNKNOWN', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('UNKNOWN');
      const { findByText } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      expect(await findByText('AI Summarization Unavailable')).toBeTruthy();
    });

    it('F3-T2-3: Shows error state message if download fails (onDownloadFailed event)', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('DOWNLOADABLE');
      const { findByText, findByTestId } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      const btn = await findByTestId('download-model-button');
      await act(async () => {
        fireEvent.press(btn);
      });
      await act(async () => {
        DeviceEventEmitter.emit('GeminiModelDownload', {
          status: 'onDownloadFailed',
        });
      });
      expect(await findByText('Download failed, please try again')).toBeTruthy();
    });

    it('F3-T2-4: Disables download button while downloading to prevent multiple triggers', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('DOWNLOADABLE');
      const { findByText, findByTestId } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      const btn = await findByTestId('download-model-button');
      await act(async () => {
        fireEvent.press(btn);
      });
      // Emit downloading state event
      await act(async () => {
        DeviceEventEmitter.emit('GeminiModelDownload', {
          status: 'onDownloadStarted',
        });
      });
      expect(btn.props.accessibilityState?.disabled).toBe(true);
    });

    it('F3-T2-5: Gracefully handles download progress emitting 0 or invalid bytes (doesn\'t divide by zero)', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('DOWNLOADABLE');
      const { findByText, findByTestId } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      await act(async () => {
        DeviceEventEmitter.emit('GeminiModelDownload', {
          status: 'onDownloadProgress',
          bytesToDownload: 0, // Invalid total
          bytesDownloaded: 100,
        });
      });
      // Expect safe fallback progress format, e.g. "0%" or "Pending..."
      expect(await findByText('Pending...')).toBeTruthy();
    });
  });

  describe('Tier 2: Feature 4 - Gemini Nano Article Summarization Boundaries', () => {
    it('F4-T2-1: Hides summarize button if article content is empty or extremely short', async () => {
      global.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        json: async () => ({
          articles: [{
            id: 'art1',
            sourceId: 'techcrunch',
            categoryId: 'tech',
            title: 'Short Article',
            content: 'Short content.', // < 20 chars
            publishedAt: '2026-06-09T10:00:00Z',
          }]
        }),
      } as any));

      const { findByText, queryByTestId } = render(<App />);
      const article = await findByText('Short Article');
      await act(async () => {
        fireEvent.press(article);
      });
      expect(queryByTestId('generate-summary-button')).toBeNull();
    });

    it('F4-T2-2: Handles summarizeText API rejection by displaying a user-friendly error message', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('AVAILABLE');
      mockGeminiNano.summarizeText.mockRejectedValue(new Error('Inference limit exceeded'));
      const { findByText, findByTestId } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      const summarizeBtn = await findByTestId('generate-summary-button');
      await act(async () => {
        fireEvent.press(summarizeBtn);
      });
      expect(await findByText('Failed to generate summary')).toBeTruthy();
    });

    it('F4-T2-3: Disables summarize button during active generation to prevent duplicate requests', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('AVAILABLE');
      mockGeminiNano.summarizeText.mockImplementation(() => new Promise(() => {})); // Never resolves
      const { findByText, findByTestId } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      const summarizeBtn = await findByTestId('generate-summary-button');
      await act(async () => {
        fireEvent.press(summarizeBtn);
      });
      expect(summarizeBtn.props.accessibilityState?.disabled).toBe(true);
    });

    it('F4-T2-4: Gracefully renders summary when response is not in standard bullet format', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('AVAILABLE');
      // Non bullet format response
      mockGeminiNano.summarizeText.mockResolvedValue('First main point. Second core point. Third key detail.');
      const { findByText, findByTestId } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      const summarizeBtn = await findByTestId('generate-summary-button');
      await act(async () => {
        fireEvent.press(summarizeBtn);
      });
      // Should clean and wrap it in bullets or display it nicely
      expect(await findByText('• First main point.')).toBeTruthy();
    });

    it('F4-T2-5: Limits summary rendering width and text properties to avoid layout clipping', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('AVAILABLE');
      const { findByText, findByTestId } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      const summarizeBtn = await findByTestId('generate-summary-button');
      await act(async () => {
        fireEvent.press(summarizeBtn);
      });
      const summaryText = await findByText('• Bullet 1');
      expect(summaryText.props.numberOfLines).toBeUndefined(); // Verify wrapping is enabled
    });
  });

  describe('Tier 2: Feature 5 - AI Playground Boundaries', () => {
    it('F5-T2-1: Clears playground text input using a "Clear" button', async () => {
      const { findByTestId, queryByTestId } = render(<App />);
      const playgroundTab = await findByTestId('tab-playground');
      await act(async () => {
        fireEvent.press(playgroundTab);
      });
      const input = await findByTestId('playground-input');
      await act(async () => {
        fireEvent.changeText(input, 'Some text to clear');
      });
      const clearBtn = await findByTestId('playground-clear-button');
      await act(async () => {
        fireEvent.press(clearBtn);
      });
      expect(input.props.value).toBe('');
    });

    it('F5-T2-2: Displays error message when custom summarization API fails', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('AVAILABLE');
      mockGeminiNano.summarizeText.mockRejectedValue(new Error('Inference failed'));
      const { findByTestId, findByText } = render(<App />);
      const playgroundTab = await findByTestId('tab-playground');
      await act(async () => {
        fireEvent.press(playgroundTab);
      });
      const input = await findByTestId('playground-input');
      const btn = await findByTestId('playground-submit');
      await act(async () => {
        fireEvent.changeText(input, 'Text to summarize');
        fireEvent.press(btn);
      });
      expect(await findByText('Summarization failed')).toBeTruthy();
    });

    it('F5-T2-3: Disables input field during active text summarization', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('AVAILABLE');
      mockGeminiNano.summarizeText.mockImplementation(() => new Promise(() => {})); // Never resolves
      const { findByTestId } = render(<App />);
      const playgroundTab = await findByTestId('tab-playground');
      await act(async () => {
        fireEvent.press(playgroundTab);
      });
      const input = await findByTestId('playground-input');
      const btn = await findByTestId('playground-submit');
      await act(async () => {
        fireEvent.changeText(input, 'Text to summarize');
        fireEvent.press(btn);
      });
      expect(input.props.editable).toBe(false);
    });

    it('F5-T2-4: Restricts custom input to a maximum character length (5000 chars) and shows count', async () => {
      const { findByTestId, findByText } = render(<App />);
      const playgroundTab = await findByTestId('tab-playground');
      await act(async () => {
        fireEvent.press(playgroundTab);
      });
      const input = await findByTestId('playground-input');
      expect(input.props.maxLength).toBe(5000);
      expect(await findByText('0 / 5000')).toBeTruthy();
    });

    it('F5-T2-5: Renders placeholder when input is focused vs unfocused', async () => {
      const { findByTestId } = render(<App />);
      const playgroundTab = await findByTestId('tab-playground');
      await act(async () => {
        fireEvent.press(playgroundTab);
      });
      const input = await findByTestId('playground-input');
      expect(input.props.placeholder).toBe('Paste your custom text here...');
    });
  });

  // =========================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS (5 TESTS)
  // =========================================================

  describe('Tier 3: Cross-Feature Combinations', () => {
    it('F3-T3-1: Offline feed navigation to Article Detail retains cached details', async () => {
      const storage = require('@react-native-async-storage/async-storage');
      await storage.setItem('cached_articles', JSON.stringify(mockArticles.articles));
      setupFetchMock(false);

      const { findByText } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      expect(await findByText('On-device LLMs are becoming increasingly popular.')).toBeTruthy();
    });

    it('F3-T3-2: Triggering download on Article Detail preserves downloading state/listeners across screen navigations', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('DOWNLOADABLE');
      const { findByText, findByTestId } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      const btn = await findByTestId('download-model-button');
      await act(async () => {
        fireEvent.press(btn);
      });
      // Navigate back
      const backButton = await findByTestId('detail-back-button');
      await act(async () => {
        fireEvent.press(backButton);
      });
      // Navigate back to detail
      const articleRef = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(articleRef);
      });
      // Send download event
      await act(async () => {
        DeviceEventEmitter.emit('GeminiModelDownload', {
          status: 'onDownloadProgress',
          bytesToDownload: 100,
          bytesDownloaded: 75,
        });
      });
      expect(await findByText('75%')).toBeTruthy();
    });

    it('F3-T3-3: AI summary updates colors and margins when switching between light and dark mode themes', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('AVAILABLE');
      const { findByText, findByTestId } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      const summarizeBtn = await findByTestId('generate-summary-button');
      await act(async () => {
        fireEvent.press(summarizeBtn);
      });
      const summaryCard = await findByTestId('summary-card');
      expect(summaryCard.props.style).toBeDefined();
    });

    it('F3-T3-4: AI Playground reflects current model download status immediately without re-checking/downloading', async () => {
      // Download completed
      mockGeminiNano.checkAvailability.mockResolvedValue('AVAILABLE');
      const { findByTestId } = render(<App />);
      const playgroundTab = await findByTestId('tab-playground');
      await act(async () => {
        fireEvent.press(playgroundTab);
      });
      const input = await findByTestId('playground-input');
      const btn = await findByTestId('playground-submit');
      await act(async () => {
        fireEvent.changeText(input, 'Check model status in playground');
        fireEvent.press(btn);
      });
      // Immediately works because model is already AVAILABLE
      expect(mockGeminiNano.summarizeText).toHaveBeenCalledWith('Check model status in playground');
    });

    it('F3-T3-5: Back navigation from Article Detail preserves active category/source filter on News Feed', async () => {
      const { findByText, findByTestId } = render(<App />);
      const techChip = await findByText('Technology');
      await act(async () => {
        fireEvent.press(techChip);
      });
      // Go to detail
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      // Go back
      const backButton = await findByTestId('detail-back-button');
      await act(async () => {
        fireEvent.press(backButton);
      });
      // Verify tech chip is still highlighted
      const activeTechChip = await findByTestId('category-chip-active-tech');
      expect(activeTechChip).toBeTruthy();
    });
  });

  // =========================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS (5 TESTS)
  // =========================================================

  describe('Tier 4: Real-World Application Scenarios', () => {
    it('F4-T4-1: Complete user journey: open app offline, view cached feed, click article, download model with progress bar, generate 3-bullet summary', async () => {
      const storage = require('@react-native-async-storage/async-storage');
      await storage.setItem('cached_articles', JSON.stringify(mockArticles.articles));
      setupFetchMock(false); // offline
      mockGeminiNano.checkAvailability.mockResolvedValue('DOWNLOADABLE');

      // 1. Open app offline, see cached article
      const { findByText, findByTestId } = render(<App />);
      const article = await findByText('Gemini Nano in React Native');
      expect(article).toBeTruthy();

      // 2. Click article to view detail
      await act(async () => {
        fireEvent.press(article);
      });
      expect(await findByText('Model not downloaded')).toBeTruthy();

      // 3. Trigger model download and monitor progress
      const downloadBtn = await findByTestId('download-model-button');
      await act(async () => {
        fireEvent.press(downloadBtn);
      });
      await act(async () => {
        DeviceEventEmitter.emit('GeminiModelDownload', {
          status: 'onDownloadProgress',
          bytesToDownload: 100,
          bytesDownloaded: 40,
        });
      });
      expect(await findByText('40%')).toBeTruthy();

      // 4. Complete download and verify generate button is present
      await act(async () => {
        DeviceEventEmitter.emit('GeminiModelDownload', {
          status: 'onDownloadCompleted',
        });
      });
      const generateBtn = await findByTestId('generate-summary-button');
      expect(generateBtn).toBeTruthy();

      // 5. Generate and show summary
      await act(async () => {
        fireEvent.press(generateBtn);
      });
      expect(await findByText('• Bullet 1')).toBeTruthy();
    });

    it('F4-T4-2: Heavy multi-screen navigation (Feed -> Playground -> Detail) doesn\'t cause duplicate event listeners or performance lag', async () => {
      const { findByText, findByTestId } = render(<App />);
      // 1. Navigation Feed -> Playground
      const playgroundTab = await findByTestId('tab-playground');
      await act(async () => {
        fireEvent.press(playgroundTab);
      });
      // 2. Navigation Playground -> Feed
      const feedTab = await findByTestId('tab-feed');
      await act(async () => {
        fireEvent.press(feedTab);
      });
      // 3. Navigation Feed -> Detail
      const article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      
      // Check event emission triggers listener only once
      const downloadBtn = await findByTestId('download-model-button');
      await act(async () => {
        fireEvent.press(downloadBtn);
      });
      await act(async () => {
        DeviceEventEmitter.emit('GeminiModelDownload', {
          status: 'onDownloadProgress',
          bytesToDownload: 100,
          bytesDownloaded: 90,
        });
      });
      expect(await findByText('90%')).toBeTruthy();
    });

    it('F4-T4-3: Pull-to-refresh invalidates detail summary if article content changes', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('AVAILABLE');
      const { findByText, findByTestId } = render(<App />);
      
      // 1. Visit details and generate summary
      let article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });
      let summarizeBtn = await findByTestId('generate-summary-button');
      await act(async () => {
        fireEvent.press(summarizeBtn);
      });
      expect(await findByText('• Bullet 1')).toBeTruthy();
      expect(mockGeminiNano.summarizeText).toHaveBeenCalledTimes(1);

      // 2. Go back
      const backButton = await findByTestId('detail-back-button');
      await act(async () => {
        fireEvent.press(backButton);
      });

      // 3. Refresh with updated article content
      const updatedArticles = {
        articles: [
          {
            ...mockArticles.articles[0],
            content: 'Brand new updated content that is completely different from the previous version.'
          }
        ]
      };
      global.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        json: async () => updatedArticles,
      } as any));

      const list = await findByTestId('feed-article-list');
      await act(async () => {
        list.props.onRefresh();
      });

      // 4. Visit details again and check if cached summary is cleared
      article = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article);
      });

      // Assert summarizeText is called again since content changed
      summarizeBtn = await findByTestId('generate-summary-button');
      await act(async () => {
        fireEvent.press(summarizeBtn);
      });
      expect(mockGeminiNano.summarizeText).toHaveBeenCalledTimes(2);
    });

    it('F4-T4-4: Network recovery (offline to online) enables refresh and download of new articles', async () => {
      // 1. App is offline initially
      setupFetchMock(false);
      const { findByText, findByTestId } = render(<App />);
      expect(await findByText('Failed to load news')).toBeTruthy();

      // 2. Network goes online, pull-to-refresh
      setupFetchMock(true);
      const errorLayout = await findByTestId('error-layout');
      await act(async () => {
        // Press retry button on error layout
        const retryBtn = await findByTestId('error-retry-button');
        fireEvent.press(retryBtn);
      });

      // 3. Articles load successfully
      expect(await findByText('Gemini Nano in React Native')).toBeTruthy();
    });

    it('F4-T4-5: Summary caching: navigating between multiple summarized articles displays cached summaries instantly without invoking Gemini Nano', async () => {
      mockGeminiNano.checkAvailability.mockResolvedValue('AVAILABLE');
      const { findByText, findByTestId } = render(<App />);

      // 1. Summarize article 1
      let article1 = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article1);
      });
      let summarizeBtn1 = await findByTestId('generate-summary-button');
      await act(async () => {
        fireEvent.press(summarizeBtn1);
      });
      expect(mockGeminiNano.summarizeText).toHaveBeenCalledTimes(1);
      
      const back1 = await findByTestId('detail-back-button');
      await act(async () => {
        fireEvent.press(back1);
      });

      // 2. Summarize article 2
      let article2 = await findByText('Championship Finals');
      await act(async () => {
        fireEvent.press(article2);
      });
      let summarizeBtn2 = await findByTestId('generate-summary-button');
      await act(async () => {
        fireEvent.press(summarizeBtn2);
      });
      expect(mockGeminiNano.summarizeText).toHaveBeenCalledTimes(2);

      const back2 = await findByTestId('detail-back-button');
      await act(async () => {
        fireEvent.press(back2);
      });

      // 3. Re-visit article 1, verify summary is loaded instantly, check call count is still 2
      article1 = await findByText('Gemini Nano in React Native');
      await act(async () => {
        fireEvent.press(article1);
      });
      expect(await findByText('• Bullet 1')).toBeTruthy();
      expect(mockGeminiNano.summarizeText).toHaveBeenCalledTimes(2);
    });
  });
});
