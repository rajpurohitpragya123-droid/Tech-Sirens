import { useRef, useState } from 'react';
import { Alert, Text, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { Button, Card, Screen, styles } from '../../src/ui';
import { t } from '../../src/i18n';
import { useFarm } from '../../src/state';
export default function Diagnose() {
  const [permission, requestPermission] = useCameraPermissions(),
    [uri, setUri] = useState(''),
    [screen, setScreen] = useState('camera'),
    [error, setError] = useState('');
  const camera = useRef<CameraView>(null),
    farm = useFarm();
  async function capture() {
    try {
      const shot = await camera.current?.takePictureAsync();
      if (!shot) return;
      const image = await ImageManipulator.manipulateAsync(
        shot.uri,
        [{ resize: shot.width >= shot.height ? { width: 1024 } : { height: 1024 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );
      setUri(image.uri);
      farm.queue('diagnosis', { crop: farm.crop, imageUri: image.uri, mock: true });
      setScreen('result');
    } catch {
      setError(t('retake'));
    }
  }
  return (
    <Screen
      title={t(
        screen === 'camera'
          ? 'cameraTitle'
          : screen === 'result'
            ? 'doctor'
            : screen === 'care'
              ? 'treatment'
              : 'feedback',
      )}
    >
      {screen === 'camera' ? (
        <>
          <Text style={styles.text}>
            {t(farm.crop)} · {t('cameraHint')}
          </Text>
          {permission?.granted ? (
            <CameraView
              ref={camera}
              facing="back"
              style={{ height: 350, borderRadius: 15, overflow: 'hidden' }}
            >
              <Text style={{ color: 'white', fontSize: 100, textAlign: 'center', marginTop: 110 }}>
                ♧
              </Text>
            </CameraView>
          ) : (
            <Card>
              <Text style={{ fontSize: 80, textAlign: 'center' }}>📷</Text>
            </Card>
          )}
          <Button
            onPress={() => {
              if (permission?.granted) void capture();
              else void requestPermission();
            }}
          >
            📷 {t('takePhoto')}
          </Button>
          <Button onPress={() => setScreen('result')}>▶ {t('tryDemo')}</Button>
        </>
      ) : screen === 'result' ? (
        <Card>
          <Text style={styles.title}>✓ {t('pakka')}</Text>
          {uri ? (
            <Image source={{ uri }} style={{ height: 240, borderRadius: 12 }} />
          ) : (
            <Text style={{ fontSize: 90, textAlign: 'center' }}>🌿</Text>
          )}
          <Text style={styles.text}>{t('disease')}</Text>
          <Text style={styles.notice}>{t('sample')}</Text>
          <Button onPress={() => setScreen('care')}>🌿 {t('treatment')}</Button>
        </Card>
      ) : screen === 'care' ? (
        <>
          <Card>
            <Text style={styles.title}>🌿 {t('organic')}</Text>
            <Text style={styles.text}>{t('organicAdvice')}</Text>
          </Card>
          <Card>
            <Text style={styles.title}>🛍 {t('chemical')}</Text>
            <Text style={styles.text}>{t('chemicalAdvice')}</Text>
            <Text style={styles.notice}>{t('noDose')}</Text>
            <Text style={styles.notice}>{t('wait')}</Text>
          </Card>
          <Button
            onPress={() => {
              farm.queue('diary', { kind: 'treatment', date: new Date().toISOString() });
              setScreen('feedback');
            }}
          >
            ✓ {t('startCare')}
          </Button>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 80, textAlign: 'center' }}>🤝</Text>
          {[
            ['yes', '👍'],
            ['no', '👎'],
          ].map(([value, emoji]) => (
            <Button
              key={value}
              onPress={() => {
                farm.queue('diagnosis-feedback', { photoUri: uri, helpful: value === 'yes' });
                Alert.alert(t('thanks'));
              }}
            >
              {emoji} {t(value!)}
            </Button>
          ))}
        </>
      )}
      {error && <Text style={styles.notice}>{error}</Text>}
    </Screen>
  );
}
