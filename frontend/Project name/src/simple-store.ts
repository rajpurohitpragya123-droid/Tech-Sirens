import { laplacianVarianceRGBA } from '../../../packages/shared/vision.mjs';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export type SimpleMessage = {
  id: string;
  kind: string;
  text: string;
  route: string;
  status: string;
  channel: string;
  sentAt: string;
  urgent: boolean;
};
export type SimpleEntry = {
  id: string;
  kind: string;
  date: string;
  amount?: number;
  unit?: string;
};
interface SimpleState {
  autoRead: boolean;
  whatsapp: boolean;
  consentAt: string | null;
  waterUpdates: boolean;
  benchmarkConsent: boolean;
  crop: string;
  photoId: string | null;
  resultMode: string;
  diary: SimpleEntry[];
  messages: SimpleMessage[];
  interests: Record<string, string>;
  chats: Record<string, string[]>;
  queue: { id: string; kind: string; data: unknown }[];
  minPrice: number;
  area: number;
  labelDose: number | null;
  listing: {
    area: number;
    rent: number;
    water: string;
    soil: string;
    village: string;
    photoId: string | null;
  };
  set: (state: Partial<Omit<SimpleState, 'set' | 'enqueue' | 'log'>>) => void;
  enqueue: (kind: string, data: unknown) => void;
  log: (kind: string, amount?: number, unit?: string) => void;
}
export const useSimple = create<SimpleState>()(
  persist(
    (set) => ({
      autoRead: true,
      whatsapp: false,
      consentAt: null,
      waterUpdates: false,
      benchmarkConsent: false,
      crop: 'tomato',
      photoId: null,
      resultMode: 'pakka',
      diary: [],
      messages: [],
      interests: {},
      chats: {},
      queue: [],
      minPrice: 2500,
      area: 2.5,
      labelDose: null,
      listing: {
        area: 3,
        rent: 18000,
        water: 'canal',
        soil: 'alluvial',
        village: 'rampur',
        photoId: null,
      },
      set: (value) => set(value),
      enqueue: (kind, data) =>
        set((state) => ({ queue: [...state.queue, { id: crypto.randomUUID(), kind, data }] })),
      log: (kind, amount, unit) =>
        set((state) => {
          const entry = {
            id: crypto.randomUUID(),
            kind,
            date: new Date().toISOString(),
            amount,
            unit,
          };
          return {
            diary: [entry, ...state.diary],
            queue: [...state.queue, { id: entry.id, kind: 'diary', data: entry }],
          };
        }),
    }),
    { name: 'khet-simple-v2' },
  ),
);
export async function photoDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open('khet-photos-v2', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('photos');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
export async function savePhoto(blob: Blob) {
  const db = await photoDatabase(),
    id = crypto.randomUUID();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('photos', 'readwrite');
    tx.objectStore('photos').put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return id;
}
export async function getPhoto(id: string) {
  const db = await photoDatabase();
  const result = await new Promise<Blob | undefined>((resolve, reject) => {
    const req = db.transaction('photos').objectStore('photos').get(id);
    req.onsuccess = () => resolve(req.result as Blob | undefined);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return result;
}
export async function prepareLeaf(file: File) {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
  canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Image processing unavailable');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const sample = document.createElement('canvas');
  sample.width = 128;
  sample.height = 128;
  const sc = sample.getContext('2d', { willReadFrequently: true })!;
  sc.drawImage(canvas, 0, 0, 128, 128);
  const variance = laplacianVarianceRGBA(sc.getImageData(0, 0, 128, 128).data, 128, 128);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Compression failed'))),
      'image/jpeg',
      0.8,
    ),
  );
  return { blob, variance };
}
