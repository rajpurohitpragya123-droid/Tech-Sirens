import { useState } from 'react';
import { Text, Pressable, View } from 'react-native';
import { Redirect } from 'expo-router';
import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import { Button, Card, Screen, styles } from '../src/ui';
import { useFarm } from '../src/state';
import i18n, { t } from '../src/i18n';
import { supabase } from '../src/supabase';
export default function Onboarding() {
  const farm = useFarm();
  const [step, setStep] = useState(0),
    [digits, setDigits] = useState(''),
    [sent, setSent] = useState(false),
    [error, setError] = useState('');
  if (farm.onboarded) return <Redirect href="/(tabs)" />;
  async function auth() {
    if (!supabase) {
      setError(t('demo'));
      return;
    }
    if (!sent) {
      const r = await supabase.auth.signInWithOtp({ phone: `+91${digits}` });
      if (r.error) setError(r.error.message);
      else {
        setSent(true);
        setDigits('');
      }
    } else {
      const r = await supabase.auth.verifyOtp({
        phone: `+91${farm.name}`,
        token: digits,
        type: 'sms',
      });
      if (r.error) setError(r.error.message);
      else setStep(2);
    }
  }
  function finish(consent: boolean) {
    farm.setProfile({
      onboarded: true,
      name: '',
      whatsappOptIn: consent,
      whatsappOptInAt: new Date().toISOString(),
    });
    farm.queue('whatsapp-consent', { value: consent, at: new Date().toISOString() });
  }
  return (
    <Screen
      title={
        step === 0
          ? t('language')
          : step === 1
            ? t('phone')
            : step === 2
              ? t('location')
              : step === 3
                ? t('plotArea')
                : step === 4
                  ? t('chooseCrop')
                  : t('optInTitle')
      }
    >
      {step === 0 ? (
        <Card>
          {[
            ['hi', 'हिन्दी'],
            ['en', 'English'],
            ['pa', 'ਪੰਜਾਬੀ'],
            ['mr', 'मराठी'],
          ].map(([code, native]) => (
            <Button
              key={code}
              onPress={() => {
                farm.setProfile({ language: code });
                void i18n.changeLanguage(code);
                Speech.speak(native!, { language: `${code}-IN` });
                setStep(1);
              }}
            >
              {native} 🔊
            </Button>
          ))}
        </Card>
      ) : step === 1 ? (
        <>
          <Text style={[styles.title, { textAlign: 'center' }]}>
            {sent ? '•'.repeat(digits.length) : `+91 ${digits}`}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].map((digit) => (
              <Pressable
                key={digit}
                style={[
                  styles.card,
                  {
                    width: '30%',
                    minHeight: 64,
                    padding: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}
                onPress={() => {
                  if (digit === '✓') {
                    if (!sent) farm.setProfile({ name: digits });
                    void auth();
                  } else if (digit === '⌫') setDigits((v) => v.slice(0, -1));
                  else setDigits((v) => (v.length < (sent ? 6 : 10) ? v + digit : v));
                }}
              >
                <Text style={styles.title}>{digit}</Text>
              </Pressable>
            ))}
          </View>
          {error && <Text style={styles.notice}>{error}</Text>}
          <Button onPress={() => setStep(2)}>▶ {t('tryDemo')}</Button>
        </>
      ) : step === 2 ? (
        <Card>
          <Button
            onPress={() =>
              void (async () => {
                const permission = await Location.requestForegroundPermissionsAsync();
                if (permission.granted) {
                  const position = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                  });
                  farm.queue('onboarding-location', {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                  });
                  setStep(3);
                } else setError(t('gpsFailed'));
              })().catch(() => setError(t('gpsFailed')))
            }
          >
            📍 {t('gps')}
          </Button>
          {['rampur', 'mawana', 'kithore'].map((v) => (
            <Button
              key={v}
              onPress={() => {
                farm.setProfile({ village: v });
                setStep(3);
              }}
            >
              🏡 {t(v)}
            </Button>
          ))}
          {error && <Text style={styles.notice}>{error}</Text>}
        </Card>
      ) : step === 3 ? (
        <Card>
          {['1', '2.5', '5'].map((area) => (
            <Button
              key={area}
              onPress={() => {
                farm.setProfile({ area });
                setStep(4);
              }}
            >
              🌾 {area} {t('acre')}
            </Button>
          ))}
          <Button onPress={() => setStep(4)}>{t('notNow')}</Button>
        </Card>
      ) : step === 4 ? (
        <Card>
          {[
            ['tomato', '🍅'],
            ['wheat', '🌾'],
            ['rice', '🍚'],
          ].map(([crop, emoji]) => (
            <Button
              key={crop}
              onPress={() => {
                farm.setProfile({ crop });
                setStep(5);
              }}
            >
              {emoji} {t(crop!)}
            </Button>
          ))}
        </Card>
      ) : (
        <Card>
          <Text style={{ fontSize: 70, textAlign: 'center' }}>💬</Text>
          <Text style={styles.text}>{t('optInHint')}</Text>
          <Button onPress={() => finish(true)}>✓ {t('optIn')}</Button>
          <Button onPress={() => finish(false)}>← {t('notNow')}</Button>
        </Card>
      )}
    </Screen>
  );
}
