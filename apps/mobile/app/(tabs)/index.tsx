import { useState } from 'react';
import { ImageBackground, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { t } from '../../src/i18n';
import { useFarm } from '../../src/state';
const cards = [
  { id: 'doctor', icon: '🌿', image: 'photo-1416879595882-3373a0480b5b' },
  { id: 'neighbours', icon: '🌾', image: 'photo-1500382017468-9049fed747ef' },
  { id: 'land', icon: '📍', image: 'photo-1500937386664-56d1dfef3854' },
];
export default function Home() {
  const router = useRouter(),
    insets = useSafeAreaInsets(),
    [voice, setVoice] = useState(false);
  const language = useFarm((s) => s.language);
  function open(id: string) {
    setVoice(false);
    if (id === 'doctor') router.push('/crops');
    else
      router.push({
        pathname: '/module/[id]',
        params: { id: id === 'neighbours' ? 'benchmark' : id },
      });
  }
  return (
    <View style={[css.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 10 }]}>
      <View style={css.header}>
        <Text style={css.brand}>🌱 खेत Doctor</Text>
        <Pressable
          accessibilityLabel={t('listen')}
          style={css.speaker}
          onPress={() =>
            Speech.speak(cards.map((c) => t(c.id)).join('. '), { language: language + '-IN' })
          }
        >
          <Text style={{ fontSize: 24 }}>🔊</Text>
        </Pressable>
      </View>
      <View style={css.cards}>
        {cards.map((card) => (
          <Pressable
            key={card.id}
            accessibilityRole="button"
            accessibilityLabel={t(card.id)}
            style={css.tile}
            onPress={() => open(card.id)}
          >
            <ImageBackground
              source={{
                uri: `https://images.unsplash.com/${card.image}?auto=format&fit=crop&w=600&q=70`,
              }}
              style={css.image}
            >
              <View style={css.tint}>
                <Text style={css.icon}>{card.icon}</Text>
                <Text style={css.title}>{t(card.id)}</Text>
                <Text style={css.arrow}>↗</Text>
              </View>
            </ImageBackground>
          </Pressable>
        ))}
      </View>
      <Pressable accessibilityLabel={t('speak')} style={css.mic} onPress={() => setVoice(true)}>
        <Text style={{ fontSize: 30, color: 'white' }}>🎙</Text>
      </Pressable>
      <Text style={css.caption}>{t('speak')}</Text>
      <Pressable
        style={css.more}
        accessibilityRole="button"
        onPress={() => router.push('/(tabs)/more')}
      >
        <Text style={css.moreText}>••• {t('more')}</Text>
      </Pressable>
      <Modal visible={voice} transparent onRequestClose={() => setVoice(false)}>
        <View style={css.overlay}>
          <View style={css.sheet}>
            <Text style={css.sheetTitle}>{t('voiceFailed')}</Text>
            {cards.map((card) => (
              <Pressable key={card.id} style={css.choice} onPress={() => open(card.id)}>
                <Text style={css.choiceText}>
                  {card.icon} {t(card.id)}
                </Text>
              </Pressable>
            ))}
            <Pressable style={css.choice} onPress={() => setVoice(false)}>
              <Text style={css.choiceText}>← {t('back')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const css = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6f7f0', paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  brand: { fontSize: 25, fontFamily: 'NotoSansDevanagari_600SemiBold', color: '#31583e' },
  speaker: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e8efdd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cards: { flex: 1, gap: 13, maxHeight: 550 },
  tile: {
    flex: 1,
    minHeight: 100,
    overflow: 'hidden',
    borderRadius: 15,
    backgroundColor: '#31583e',
  },
  image: { flex: 1 },
  tint: {
    flex: 1,
    backgroundColor: '#25452eb5',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 18,
  },
  icon: { fontSize: 31 },
  title: {
    flex: 1,
    color: '#fffef0',
    fontFamily: 'NotoSansDevanagari_600SemiBold',
    fontSize: 23,
    lineHeight: 38,
  },
  arrow: { fontSize: 28, color: 'white' },
  mic: {
    height: 76,
    width: 76,
    borderRadius: 38,
    borderWidth: 7,
    borderColor: '#e1ebd5',
    backgroundColor: '#31583e',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 20,
  },
  caption: { textAlign: 'center', fontSize: 14, color: '#7c9368', marginTop: 5 },
  more: {
    alignSelf: 'center',
    minHeight: 48,
    minWidth: 110,
    justifyContent: 'center',
    marginTop: 5,
  },
  moreText: { fontSize: 15, color: '#80966c', textAlign: 'center' },
  overlay: { flex: 1, justifyContent: 'center', padding: 25, backgroundColor: '#193a2788' },
  sheet: { backgroundColor: '#fffef7', padding: 24, borderRadius: 18, gap: 14 },
  sheetTitle: { fontSize: 23, color: '#31583e', textAlign: 'center', marginBottom: 15 },
  choice: {
    minHeight: 64,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#eaf0df',
    justifyContent: 'center',
  },
  choiceText: { fontSize: 19, color: '#31583e', textAlign: 'center' },
});
