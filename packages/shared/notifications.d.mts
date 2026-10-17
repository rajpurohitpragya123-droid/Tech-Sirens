export interface History {
  status: string;
  urgent: boolean;
  sentAt: string;
}
export function indiaClock(now: string | number | Date): { day: string; hour: number };
export function planNotification(input: {
  consent: { whatsapp: boolean; push?: boolean; sms?: boolean };
  now: string | number | Date;
  history?: History[];
  urgent?: boolean;
  lastInboundAt?: string;
  approvedTemplate?: boolean;
}): { status: string; reason?: string; channel: string | null; format?: string };
export function confidenceWord(
  predictions: { label: string; confidence: number }[],
): 'expert' | 'healthy' | 'pakka' | 'shayad';
export interface Plot {
  id: string;
  verified: boolean;
  distance: number;
  rent: number;
  area: number;
  waterKey: string;
}
export function filterLand<T extends Plot>(
  plots: T[],
  filters: { radius?: number; size?: string; water?: string; maxRent?: number },
): T[];
export function compareLand<T extends Plot>(
  plots: T[],
): (T & { cheapest: boolean; nearest: boolean })[];
