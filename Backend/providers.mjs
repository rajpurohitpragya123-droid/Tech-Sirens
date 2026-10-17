import { createHash } from 'node:crypto';
export class MockLanguageService {
  async speechToText(_audio, lang) {
    return {
      text: lang === 'hi' ? 'पत्ते पीले हो रहे हैं' : 'diagnose this leaf',
      language: lang,
      mock: true,
    };
  }
  async translate(text, from, to) {
    return { text, from, to, mock: true, needsReview: from !== to };
  }
  async textToSpeech(text, lang) {
    return { text, language: lang, audioUrl: null, mock: true };
  }
}
export class BhashiniLanguageService {
  constructor({ url, key }) {
    if (!url || !key) throw new Error('Bhashini pipeline URL and backend key are required');
    this.url = url;
    this.key = key;
  }
  async call(taskType, input, sourceLanguage, targetLanguage) {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: this.key },
      body: JSON.stringify({
        pipelineTasks: [
          {
            taskType,
            config: { language: { sourceLanguage, ...(targetLanguage ? { targetLanguage } : {}) } },
          },
        ],
        inputData: input,
      }),
      signal: AbortSignal.timeout(4500),
    });
    if (!response.ok) throw new Error('Language provider temporarily unavailable');
    return response.json();
  }
  async speechToText(audio, lang) {
    return this.call('asr', { audio: [{ audioContent: audio }] }, lang);
  }
  async translate(text, from, to) {
    return this.call('translation', { input: [{ source: text }] }, from, to);
  }
  async textToSpeech(text, lang) {
    return this.call('tts', { input: [{ source: text }] }, lang);
  }
}
export class CachedLanguageService {
  #cache = new Map();
  constructor(provider) {
    this.provider = provider;
  }
  async translate(text, from, to) {
    const key = createHash('sha256').update(`${from}\0${to}\0${text}`).digest('hex');
    if (this.#cache.has(key)) return this.#cache.get(key);
    const result = await this.provider.translate(text, from, to);
    this.#cache.set(key, result);
    if (this.#cache.size > 1000) this.#cache.delete(this.#cache.keys().next().value);
    return result;
  }
  speechToText(audio, lang) {
    return this.provider.speechToText(audio, lang);
  }
  textToSpeech(text, lang) {
    return this.provider.textToSpeech(text, lang);
  }
}
export class MockLLMProvider {
  async routeIntent() {
    return { intent: 'help', mock: true };
  }
  async phraseGap(gap) {
    return {
      text: `Nearby higher-yield farms showed a different ${gap.key} pattern. This is an association, not a guarantee.`,
      mock: true,
    };
  }
}
export class MockPaymentProvider {
  async createOrder({ amount, currency = 'INR' }) {
    if (!Number.isInteger(amount) || amount <= 0)
      throw new Error('Positive amount in paise required');
    return {
      id: `test_${crypto.randomUUID()}`,
      amount,
      currency,
      mode: 'test',
      status: 'simulated',
      paid: false,
    };
  }
}
export class MockPartnerProvider {
  async order(productId) {
    return { id: crypto.randomUUID(), productId, status: 'placed', mode: 'mock' };
  }
}
export class MockDiagnosisProvider {
  async predict({ crop }) {
    const labels = {
      wheat: 'leaf_rust',
      rice: 'bacterial_leaf_blight',
      maize: 'common_rust',
      tomato: 'early_blight',
      potato: 'late_blight',
      onion: 'purple_blotch',
      cotton: 'bacterial_blight',
      sugarcane: 'red_rot',
      mustard: 'alternaria_blight',
      chilli: 'anthracnose',
    };
    if (!labels[crop])
      return {
        predictions: [{ label: 'unknown', confidence: 1 }],
        model_version: 'mock-v1',
        mock: true,
      };
    return {
      predictions: [
        { label: labels[crop], confidence: 0.78 },
        { label: 'healthy', confidence: 0.14 },
        { label: 'unknown', confidence: 0.08 },
      ],
      model_version: 'mock-v1',
      mock: true,
      disclaimer: 'Fixed demo output; no image inference was performed.',
    };
  }
}
export async function routeIntent(text, llm = new MockLLMProvider()) {
  const rules = [
    [/neighbour|benchmark|mere jaise|पड़ोस|किसान/, 'benchmark'],
    [/zameen|जमीन|ज़मीन|किराय/, 'land'],
    [/patte|yellow|पत्त|पीले/, 'diagnose'],
    [/parali|stubble|पराली/, 'parali'],
    [/irrigat|water|पानी|सिंचाई/, 'irrigation'],
    [/sell|price|बेच|भाव/, 'sell'],
    [/buy|seed|खाद|बीज/, 'bazaar'],
    [/disease|leaf|रोग/, 'diagnose'],
    [/truck|transport|गाड़ी/, 'transport'],
    [/land|rent|किराया/, 'land'],
  ];
  const match = rules.find(([r]) => r.test(text.toLowerCase()));
  return match ? { intent: match[1], source: 'keyword' } : llm.routeIntent(text);
}
