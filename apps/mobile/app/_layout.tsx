import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider, hydrate, dehydrate } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useFonts,
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_600SemiBold,
} from '@expo-google-fonts/noto-sans-devanagari';
import { Text } from 'react-native';
import i18n from '../src/i18n';
import { useFarm } from '../src/state';
const client = new QueryClient({ defaultOptions: { queries: { staleTime: 300000, retry: 1 } } });
export default function Layout() {
  const language = useFarm((s) => s.language);
  const [locale, setLocale] = useState('hi');
  const [cacheReady, setCacheReady] = useState(false);
  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    void AsyncStorage.getItem('khet-query-v2')
      .then((cache) => {
        if (cache) hydrate(client, JSON.parse(cache));
      })
      .catch(() => {})
      .finally(() => {
        if (!active) return;
        setCacheReady(true);
        unsubscribe = client.getQueryCache().subscribe(() => {
          void AsyncStorage.setItem('khet-query-v2', JSON.stringify(dehydrate(client))).catch(
            () => {},
          );
        });
      });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    void i18n.changeLanguage(language).then(() => setLocale(language));
  }, [language]);
  const [loaded, error] = useFonts({
    NotoSansDevanagari_400Regular,
    NotoSansDevanagari_600SemiBold,
  });
  if ((!loaded && !error) || locale !== language || !cacheReady) return <Text>खेत Doctor…</Text>;
  return (
    <QueryClientProvider client={client}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#f8f9f3' },
          headerTintColor: '#31583e',
          headerTitle: 'खेत Doctor',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
