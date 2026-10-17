import { Text, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, styles } from '../src/ui';
import { t } from '../src/i18n';
import { useFarm } from '../src/state';
export default function Crops() {
  const router = useRouter(),
    farm = useFarm();
  return (
    <Screen title={t('chooseCrop')}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {[
          ['tomato', '🍅'],
          ['wheat', '🌾'],
          ['rice', '🍚'],
        ].map(([id, icon]) => (
          <Pressable
            style={[
              styles.card,
              { flex: 1, minHeight: 165, alignItems: 'center', justifyContent: 'center' },
            ]}
            key={id}
            accessibilityRole="button"
            onPress={() => {
              farm.setProfile({ crop: id });
              router.push('/(tabs)/diagnose');
            }}
          >
            <Text style={{ fontSize: 45 }}>{icon}</Text>
            <Text style={styles.text}>{t(id!)}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
