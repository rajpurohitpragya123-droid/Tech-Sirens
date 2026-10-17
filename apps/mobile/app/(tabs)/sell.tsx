import { Redirect } from 'expo-router';
export default function LegacySell() {
  return <Redirect href={{ pathname: '/module/[id]', params: { id: 'mandi' } }} />;
}
