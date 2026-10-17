export type SupportedLanguage = 'hi' | 'en' | 'pa' | 'mr';
export interface LanguageService {
  speechToText(
    audio: string,
    language: SupportedLanguage,
  ): Promise<{ text: string; mock?: boolean }>;
  translate(
    text: string,
    from: SupportedLanguage,
    to: SupportedLanguage,
  ): Promise<{ text: string; needsReview?: boolean }>;
  textToSpeech(
    text: string,
    language: SupportedLanguage,
  ): Promise<{ audioUrl: string | null; mock?: boolean }>;
}
export interface LLMProvider {
  routeIntent(text: string): Promise<{ intent: string; prefill?: Record<string, string> }>;
  phraseGap(gap: { kind: string; canonicalText: string }): Promise<{ text: string }>;
}
export interface DiagnosisProvider {
  predict(input: {
    crop: string;
    imagePath: string;
    lat?: number;
    lon?: number;
    date: string;
  }): Promise<{
    predictions: { label: string; confidence: number }[];
    model_version: string;
    mock: boolean;
  }>;
}
export interface NotificationEvent {
  kind:
    | 'diagnosis'
    | 'expert'
    | 'season-tip'
    | 'land-match'
    | 'land-interest'
    | 'land-accepted'
    | 'water'
    | 'buyer-alert';
  canonicalText: string;
  deepLink: string;
  urgent: boolean;
  templateName?: string;
}
export interface NotificationService {
  notify(
    farmerId: string,
    event: NotificationEvent,
  ): Promise<{
    status: 'queued' | 'sent' | 'deferred' | 'blocked' | 'failed';
    channel?: 'whatsapp' | 'sms' | 'push';
  }>;
}
