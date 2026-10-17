import { Redirect } from 'expo-router';
export default function LegacyBazaar() {
  return <Redirect href={{ pathname: '/module/[id]', params: { id: 'prices' } }} />;
}
