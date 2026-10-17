import { useRouter } from 'expo-router';
import { Button, Screen } from '../../src/ui';
import { t } from '../../src/i18n';
export default function More() {
  const router = useRouter();
  return (
    <Screen title={t('more')}>
      {[
        ['prices', '🛍'],
        ['paani', '💧'],
        ['mandi', '🌾'],
        ['gaadi', '🚜'],
        ['settings', '⚙'],
        ['inbox', '💬'],
      ].map(([id, icon]) => (
        <Button key={id} onPress={() => router.push({ pathname: '/module/[id]', params: { id } })}>
          {icon} {t(id!)}
        </Button>
      ))}
    </Screen>
  );
}
