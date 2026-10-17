import { Children, isValidElement, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { t } from './i18n';
import { useFarm } from './state';
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6f7f0' },
  body: { padding: 20, paddingBottom: 100, gap: 20 },
  title: {
    fontFamily: 'NotoSansDevanagari_600SemiBold',
    fontSize: 27,
    color: '#31583e',
    lineHeight: 42,
  },
  text: {
    fontFamily: 'NotoSansDevanagari_400Regular',
    fontSize: 18,
    color: '#5c7050',
    lineHeight: 30,
  },
  card: {
    backgroundColor: '#fffef8',
    borderColor: '#dfe7d5',
    borderWidth: 1,
    padding: 22,
    borderRadius: 15,
    gap: 15,
  },
  button: {
    backgroundColor: '#31583e',
    minHeight: 66,
    padding: 17,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'NotoSansDevanagari_600SemiBold',
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
  },
  input: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: '#c9d6bb',
    borderRadius: 8,
    padding: 15,
    fontSize: 22,
    color: '#31583e',
    backgroundColor: 'white',
  },
  notice: { fontSize: 13, color: '#7b8d6b', lineHeight: 23 },
  mic: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#31583e',
    height: 66,
    width: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: '#e2ecd5',
  },
  overlay: { flex: 1, justifyContent: 'center', padding: 25, backgroundColor: '#18312299' },
});
export function Button({ children, onPress }: { children: ReactNode; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.button}>
      <Text style={styles.buttonText}>→ {children}</Text>
    </Pressable>
  );
}
export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}
function collectText(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) =>
      typeof child === 'string' || typeof child === 'number'
        ? String(child)
        : isValidElement<{ children?: ReactNode }>(child)
          ? collectText(child.props.children)
          : '',
    )
    .join('. ');
}
const visited = new Set<string>();
export function Screen({ title, children }: { title: string; children: ReactNode }) {
  const [voice, setVoice] = useState(false);
  const router = useRouter();
  const { language, autoRead } = useFarm();
  function read() {
    Speech.stop();
    Speech.speak(`${title}. ${collectText(children)}`, {
      language: language === 'en' ? 'en-IN' : `${language}-IN`,
      rate: 0.85,
    });
  }
  useEffect(() => {
    if (autoRead && !visited.has(title)) {
      visited.add(title);
      read();
    }
  }, [title, autoRead]);
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 15 }}>
          <Pressable
            style={{ minHeight: 56, minWidth: 95, justifyContent: 'center' }}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          >
            <Text style={styles.text}>← {t('back')}</Text>
          </Pressable>
          <Pressable
            style={{ minHeight: 56, minWidth: 110, justifyContent: 'center' }}
            onPress={read}
          >
            <Text style={styles.text}>🔊 {t('repeat')}</Text>
          </Pressable>
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {children}
        <Text style={styles.notice}>
          {t('demo')} · {t('suggestion')}
        </Text>
      </ScrollView>
      <Pressable
        style={styles.mic}
        accessibilityRole="button"
        accessibilityLabel={t('speak')}
        onPress={() => setVoice(true)}
      >
        <Text style={{ fontSize: 28 }}>🎙</Text>
      </Pressable>
      <Modal visible={voice} transparent onRequestClose={() => setVoice(false)}>
        <View style={styles.overlay}>
          <Card>
            <Text style={styles.title}>{t('voiceFailed')}</Text>
            {[
              ['doctor', '🌿'],
              ['neighbours', '🌾'],
              ['land', '📍'],
            ].map(([id, icon]) => (
              <Button
                key={id}
                onPress={() => {
                  setVoice(false);
                  if (id === 'doctor') router.push('/crops');
                  else
                    router.push({
                      pathname: '/module/[id]',
                      params: { id: id === 'neighbours' ? 'benchmark' : id! },
                    });
                }}
              >
                {icon} {t(id!)}
              </Button>
            ))}
            <Button onPress={() => setVoice(false)}>{t('back')}</Button>
          </Card>
        </View>
      </Modal>
    </View>
  );
}
