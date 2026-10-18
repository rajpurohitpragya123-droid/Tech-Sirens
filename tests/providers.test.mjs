import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CachedLanguageService,
  MockLanguageService,
  MockPaymentProvider,
  routeIntent,
} from '../Backend/providers.mjs';
import { createServer } from '../Backend/server.mjs';
test('keyword intent routing precedes LLM fallback', async () => {
  assert.equal((await routeIntent('पराली बदलो')).intent, 'parali');
  assert.equal((await routeIntent('sell wheat')).intent, 'sell');
  assert.equal((await routeIntent('hello')).intent, 'help');
});
test('translation cache separates source and target languages', async () => {
  let calls = 0;
  const service = new CachedLanguageService({
    translate: async (text, from, to) => {
      calls++;
      return { text, from, to };
    },
  });
  await service.translate('seed', 'en', 'hi');
  await service.translate('seed', 'en', 'hi');
  await service.translate('seed', 'en', 'pa');
  assert.equal(calls, 2);
});
test('mock language never claims translation or real audio', async () => {
  const s = new MockLanguageService();
  assert.equal((await s.translate('seed', 'en', 'hi')).needsReview, true);
  assert.equal((await s.textToSpeech('seed', 'hi')).audioUrl, null);
});
test('payment mock never reports a paid transaction', async () => {
  const order = await new MockPaymentProvider().createOrder({ amount: 100 });
  assert.equal(order.mode, 'test');
  assert.equal(order.paid, false);
});
test('local API validates and identifies all model results as mock', async (t) => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}`;
  const bad = await fetch(`${url}/translate`, {
    method: 'POST',
    body: JSON.stringify({ text: 'seed', from: 'en', to: 'invalid' }),
  });
  assert.equal(bad.status, 400);
  const good = await fetch(`${url}/diagnose`, {
    method: 'POST',
    body: JSON.stringify({ crop: 'wheat' }),
  });
  const body = await good.json();
  assert.equal(body.mock, true);
  assert.equal(body.predictions[0].label, 'leaf_rust');
});
