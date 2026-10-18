import { create } from 'zustand';
import { persist } from 'zustand/middleware';
type Entry = { id: string; type: string; note: string; date: string };
type Pledge = { id: string; date: string; access: string; quintals: number };
type Order = { id: string; name: string; price: number; status: string };
interface State {
  entries: Entry[];
  pledges: Pledge[];
  orders: Order[];
  outbox: { id: string; kind: string; payload: unknown }[];
  optIn: boolean;
  addEntry: (type: string, note: string) => void;
  addPledge: (date: string, access: string, quintals: number) => void;
  addOrder: (name: string, price: number) => void;
  enqueue: (kind: string, payload: unknown) => void;
  setOptIn: (value: boolean) => void;
}
export const useFarm = create<State>()(
  persist(
    (set) => ({
      entries: [],
      pledges: [],
      orders: [],
      outbox: [],
      optIn: true,
      addEntry: (type, note) =>
        set((s) => {
          const e = { id: crypto.randomUUID(), type, note, date: new Date().toISOString() };
          return {
            entries: [e, ...s.entries],
            outbox: [...s.outbox, { id: e.id, kind: 'diary', payload: e }],
          };
        }),
      addPledge: (date, access, quintals) =>
        set((s) => {
          const p = { id: crypto.randomUUID(), date, access, quintals };
          return {
            pledges: [p, ...s.pledges],
            outbox: [...s.outbox, { id: p.id, kind: 'pledge', payload: p }],
          };
        }),
      addOrder: (name, price) =>
        set((s) => {
          const o = { id: crypto.randomUUID(), name, price, status: 'placed' };
          return {
            orders: [o, ...s.orders],
            outbox: [...s.outbox, { id: o.id, kind: 'order', payload: o }],
          };
        }),
      enqueue: (kind, payload) =>
        set((s) => ({ outbox: [...s.outbox, { id: crypto.randomUUID(), kind, payload }] })),
      setOptIn: (optIn) => set({ optIn }),
    }),
    { name: 'khet-doctor-demo-v1' },
  ),
);
