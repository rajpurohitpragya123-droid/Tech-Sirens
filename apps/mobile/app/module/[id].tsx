import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Screen, styles } from '../../src/ui';
import { t } from '../../src/i18n';
import { useFarm } from '../../src/state';
export default function Module() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    farm = useFarm(),
    router = useRouter();
  const [selected, setSelected] = useState('sowing'),
    [accepted, setAccepted] = useState(false),
    [notice, setNotice] = useState(false),
    [minimum, setMinimum] = useState(2500);
  const title = id === 'benchmark' ? t('neighbours') : t(id);
  function saved(kind: string, data: Record<string, unknown> = {}) {
    farm.queue(kind, data);
    Alert.alert(t('sync'));
  }
  return (
    <Screen title={title}>
      {id === 'benchmark' ? (
        farm.benchmarkOptIn ? (
          <>
            <Card>
              {[
                ['yourFarm', 18, 60],
                ['villageAverage', 21.4, 72],
                ['topFarmers', 25, 90],
              ].map(([key, value, width]) => (
                <View key={key} style={{ gap: 8 }}>
                  <Text style={styles.text}>
                    {t(String(key))} · {value}
                  </Text>
                  <View
                    style={{
                      height: 34,
                      width: `${width}%` as `${number}%`,
                      backgroundColor: '#91ab73',
                      borderRadius: 5,
                    }}
                  />
                </View>
              ))}
              <Text style={styles.notice}>{t('benchmarkNotice')}</Text>
            </Card>
            {['tip1', 'tip2', 'tip3'].map((tip, i) => (
              <Card key={tip}>
                <Text style={styles.text}>
                  {['🌱', '🌿', '💧'][i]} {t(tip)}
                </Text>
              </Card>
            ))}
            <Button
              onPress={() => router.push({ pathname: '/module/[id]', params: { id: 'diary' } })}
            >
              ＋ {t('diary')}
            </Button>
          </>
        ) : (
          <Card>
            <Text style={{ fontSize: 60, textAlign: 'center' }}>🌾</Text>
            <Text style={styles.text}>{t('consentHint')}</Text>
            <Text style={styles.notice}>{t('privacy')}</Text>
            <Button
              onPress={() => {
                farm.setProfile({ benchmarkOptIn: true });
                farm.queue('benchmark-consent', { at: new Date().toISOString() });
              }}
            >
              ✓ {t('agree')}
            </Button>
          </Card>
        )
      ) : id === 'diary' ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {[
              ['sowing', '🌱'],
              ['khaad', '🌿'],
              ['spray', '🍃'],
              ['water', '💧'],
              ['harvest', '🌾'],
            ].map(([kind, icon]) => (
              <Pressable
                key={kind}
                onPress={() => setSelected(kind!)}
                style={[
                  styles.card,
                  {
                    width: '46%',
                    minHeight: 140,
                    alignItems: 'center',
                    backgroundColor: selected === kind ? '#e4eed7' : '#fffef8',
                  },
                ]}
              >
                <Text style={{ fontSize: 39 }}>{icon}</Text>
                <Text style={styles.text}>{t(kind!)}</Text>
              </Pressable>
            ))}
          </View>
          <Button
            onPress={() => saved('diary', { kind: selected, date: new Date().toISOString() })}
          >
            ＋ {t('logToday')}
          </Button>
        </>
      ) : id === 'land' ? (
        <>
          {[1, 2, 3].map((n) => (
            <Card key={n}>
              <Text style={{ fontSize: 50 }}>🌾</Text>
              <Text style={styles.title}>
                {n + 1}.5 {t('acre')}
              </Text>
              <Text style={styles.text}>
                ₹{15000 + n * 1000} {t('rentUnit')}
              </Text>
              <Text style={styles.text}>
                💧 {t('waterCanal')} · 📍 {n * 2} km
              </Text>
              <Button
                onPress={() =>
                  router.push({ pathname: '/module/[id]', params: { id: 'interest' } })
                }
              >
                ↗ {t('sendInterest')}
              </Button>
            </Card>
          ))}
        </>
      ) : id === 'interest' ? (
        <Card>
          <Text style={{ fontSize: 55, textAlign: 'center' }}>{accepted ? '💬' : '🤝'}</Text>
          <Text style={styles.text}>
            {t(!notice ? 'notice' : accepted ? 'accepted' : 'waiting')}
          </Text>
          <Text style={styles.notice}>{t(!notice ? 'notice2' : 'whatsappMock')}</Text>
          <Button
            onPress={() => {
              if (!notice) {
                setNotice(true);
                saved('land-interest', { noticeVersion: 'UP-demo-v1' });
              } else if (!accepted) {
                setAccepted(true);
                saved('owner-accept-demo');
              } else saved('land-message', { text: t('hello') });
            }}
          >
            {t(!notice ? 'understand' : !accepted ? 'acceptDemo' : 'message')}
          </Button>
        </Card>
      ) : id === 'settings' ? (
        <Card>
          {[
            ['autoRead', farm.autoRead],
            ['whatsapp', farm.whatsappOptIn],
          ].map(([key, value]) => (
            <Button
              key={String(key)}
              onPress={() => {
                if (key === 'autoRead') farm.setProfile({ autoRead: !farm.autoRead });
                else {
                  farm.setProfile({
                    whatsappOptIn: !farm.whatsappOptIn,
                    whatsappOptInAt: new Date().toISOString(),
                  });
                  saved('whatsapp-consent', { value: !farm.whatsappOptIn });
                }
              }}
            >
              {value ? '✓' : '○'} {t(String(key))}
            </Button>
          ))}
          <Text style={styles.notice}>{t('whatsappMock')}</Text>
        </Card>
      ) : id === 'paani' ? (
        <Card>
          <Text style={{ fontSize: 90, textAlign: 'center' }}>🌤️</Text>
          <Text style={styles.title}>{t('paaniHint')}</Text>
          <Text style={styles.text}>{t('suggestion')}</Text>
          <Button onPress={() => saved('water-alert-opt-in')}>🔔 {t('morning')}</Button>
        </Card>
      ) : id === 'prices' ? (
        <>
          {[
            ['Vermicompost', 320],
            ['Neem oil', 380],
            ['Urea', 290],
          ].map(([name, price]) => (
            <Card key={name}>
              <Text style={styles.text}>🌿 {name}</Text>
              <Text style={styles.title}>₹{price}</Text>
              <Text style={styles.notice}>
                {t('verified')} · {t('priceDemo')}
              </Text>
              <Button onPress={() => Alert.alert(t('demoCall'))}>☎ {t('call')}</Button>
            </Card>
          ))}
        </>
      ) : id === 'mandi' ? (
        <>
          <Card>
            <Text style={styles.text}>{t('minPrice')}</Text>
            <Text style={styles.title}>₹{minimum}</Text>
            <View style={{ flexDirection: 'row', gap: 15 }}>
              <Button onPress={() => setMinimum((v) => Math.max(0, v - 100))}>− ₹100</Button>
              <Button onPress={() => setMinimum((v) => v + 100)}>＋ ₹100</Button>
            </View>
          </Card>
          {[2550, 2625, 2700]
            .filter((price) => price >= minimum)
            .map((price) => (
              <Card key={price}>
                <Text style={styles.text}>
                  {t('verified')} · {t('demo')}
                </Text>
                <Text style={styles.title}>
                  ₹{price} {t('pricePerQ')}
                </Text>
              </Card>
            ))}
          <Button onPress={() => saved('price-alert', { minimum })}>🔔 {t('buyerAlert')}</Button>
        </>
      ) : id === 'gaadi' ? (
        <>
          {[1, 2, 3].map((n) => (
            <Card key={n}>
              <Text style={{ fontSize: 50 }}>🚜</Text>
              <Text style={styles.text}>
                {t('verified')} · {n * 1000} kg
              </Text>
              <Text style={styles.title}>₹{500 + n * 150}</Text>
              <Button onPress={() => Alert.alert(t('demoCall'))}>☎ {t('call')}</Button>
            </Card>
          ))}
        </>
      ) : (
        <Card>
          <Text style={{ fontSize: 70, textAlign: 'center' }}>💬</Text>
          <Text style={styles.text}>{t('noMessages')}</Text>
          <Text style={styles.notice}>{t('whatsappMock')}</Text>
        </Card>
      )}
    </Screen>
  );
}
