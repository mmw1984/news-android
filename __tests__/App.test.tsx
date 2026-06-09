/**
 * Core component render tests for the HK News App
 * These verify that all screens mount correctly without crashing.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

// Mock navigation before any imports
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: unknown }) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  }),
  useRoute: () => ({
    params: {
      article: {
        id: 'test-1',
        sourceId: 'bbc-news',
        categoryId: 'international-mainstream',
        title: 'Test Article',
        summary: 'Test summary',
        content: 'Test content body',
        url: 'https://bbc.com/test',
        imageUrl: null,
        language: 'en',
        tags: ['test'],
        publishedAt: '2026-06-09T00:00:00Z',
        updatedAt: '2026-06-09T00:00:00Z',
      },
      sourceName: 'BBC News',
    },
  }),
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: { children: unknown }) => children,
    Screen: ({ name, component: Component }: { name?: string; component?: React.ComponentType<any> }) =>
      name === 'Main' && Component ? <Component /> : null,
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: { children: unknown }) => children,
    Screen: ({ component: Component }: { component?: React.ComponentType<any> }) =>
      Component ? <Component navigation={{ navigate: jest.fn(), setOptions: jest.fn() }} /> : null,
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ categories: [], sources: [], articles: [] }),
  }),
) as jest.Mock;

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  rn.NativeModules.GeminiNano = {
    checkAvailability: jest.fn(() => Promise.resolve('UNAVAILABLE')),
    downloadModel: jest.fn(() => Promise.resolve()),
    summarizeText: jest.fn(() => Promise.resolve('• P1\n• P2\n• P3')),
  };
  return rn;
});

import App from '../App';
import NewsFeedScreen from '../src/screens/NewsFeedScreen';
import AIPlaygroundScreen from '../src/screens/AIPlaygroundScreen';

describe('App renders', () => {
  it('renders without crashing', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<App />);
    });
    expect(renderer!.toJSON()).not.toBeNull();
  });
});

describe('NewsFeedScreen', () => {
  const mockNav: any = { navigate: jest.fn(), setOptions: jest.fn() };

  it('renders loading state without crashing', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NewsFeedScreen navigation={mockNav} />,
      );
    });
    expect(renderer!.toJSON()).toBeTruthy();
  });
});

describe('AIPlaygroundScreen', () => {
  it('renders without crashing', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<AIPlaygroundScreen />);
    });
    expect(renderer!.toJSON()).toBeTruthy();
  });
});
