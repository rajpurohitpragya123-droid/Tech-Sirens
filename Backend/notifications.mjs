import { planNotification } from '../packages/shared/notifications.mjs';
import { MockDiagnosisProvider, routeIntent } from './providers.mjs';
export class MockNotificationProvider {
  sent = [];
  async send(message) {
    const receipt = { ...message, id: crypto.randomUUID(), mock: true };
    this.sent.push(receipt);
    return receipt;
  }
}
export class WhatsAppCloudProvider {
  constructor({ token, phoneNumberId, graphVersion }) {
    if (!token || !phoneNumberId || !/^v\d+\.\d+$/.test(graphVersion || ''))
      throw new Error(
        'Configure WhatsApp token, phone number ID and Graph API version on the server',
      );
    this.token = token;
    this.phoneNumberId = phoneNumberId;
    this.graphVersion = graphVersion;
  }
  async send(message) {
    if (!message.consentChecked) throw new Error('Notification policy must enforce consent first');
    const payload =
      message.format === 'template_audio_link'
        ? {
            type: 'template',
            template: {
              name: message.templateName,
              language: { code: message.language },
              components: message.components || [],
            },
          }
        : { type: 'text', text: { body: message.text, preview_url: false } };
    if (payload.type === 'template' && !message.approvedTemplate)
      throw new Error('Approved template required');
    const response = await fetch(
      `https://graph.facebook.com/${this.graphVersion}/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: message.recipient,
          ...payload,
        }),
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!response.ok) throw new Error('WhatsApp delivery failed');
    const receipt = await response.json();
    if (message.format === 'text_audio' && message.audioUrl) {
      const audioResponse = await fetch(
        `https://graph.facebook.com/${this.graphVersion}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: message.recipient,
            type: 'audio',
            audio: { link: message.audioUrl },
          }),
          signal: AbortSignal.timeout(8000),
        },
      );
      if (!audioResponse.ok) return { ...receipt, audioStatus: 'failed' };
    }
    return receipt;
  }
}
export class NotificationService {
  history = [];
  locks = new Map();
  // Production calls must run under a per-profile DB lock. This local mock has only in-memory history.
  constructor({
    whatsapp = new MockNotificationProvider(),
    push = new MockNotificationProvider(),
    sms = new MockNotificationProvider(),
    clock = () => new Date(),
    languageService,
  }) {
    this.providers = { whatsapp, push, sms };
    this.clock = clock;
    this.languageService = languageService;
  }
  async notify(profile, event) {
    const previous = this.locks.get(profile.id) || Promise.resolve();
    const next = previous.catch(() => {}).then(() => this.#deliver(profile, event));
    this.locks.set(profile.id, next);
    try {
      return await next;
    } finally {
      if (this.locks.get(profile.id) === next) this.locks.delete(profile.id);
    }
  }
  async #deliver(profile, event) {
    if (event.kind === 'water' && !profile.waterUpdates)
      return { status: 'blocked', reason: 'water_disabled' };
    const now = this.clock(),
      history = this.history.filter((h) => h.profileId === profile.id);
    let plan = planNotification({
      consent: { whatsapp: profile.whatsappOptIn, push: profile.pushOptIn, sms: profile.smsOptIn },
      now,
      history,
      urgent: event.urgent || false,
      lastInboundAt: profile.lastInboundAt,
      approvedTemplate: event.approvedTemplate || false,
    });
    if (plan.status !== 'ready') return plan;
    let audio = { audioUrl: null };
    try {
      if (this.languageService)
        audio = await this.languageService.textToSpeech(event.text, profile.language);
    } catch {
      /* Text delivery remains available when speech is unavailable. */
    }
    // A STOP may arrive while TTS is running. Re-check at the final delivery boundary.
    if (event.kind === 'water' && !profile.waterUpdates)
      return { status: 'blocked', reason: 'water_disabled' };
    plan = planNotification({
      consent: { whatsapp: profile.whatsappOptIn, push: profile.pushOptIn, sms: profile.smsOptIn },
      now: this.clock(),
      history: this.history.filter((h) => h.profileId === profile.id),
      urgent: event.urgent || false,
      lastInboundAt: profile.lastInboundAt,
      approvedTemplate: event.approvedTemplate || false,
    });
    if (plan.status !== 'ready') return plan;
    const message = {
      ...event,
      recipient: profile.phone,
      language: profile.language,
      format: plan.format,
      audioUrl: audio.audioUrl || null,
      consentChecked: true,
    };
    let channel = plan.channel,
      receipt;
    try {
      receipt = await this.providers[channel].send(message);
    } catch {
      channel = profile.pushOptIn ? 'push' : profile.smsOptIn ? 'sms' : null;
      if (!channel) return { status: 'failed', reason: 'no_fallback' };
      receipt = await this.providers[channel].send({ ...message, format: 'text' });
    }
    const log = {
      id: receipt.id || crypto.randomUUID(),
      profileId: profile.id,
      channel,
      status: 'sent',
      sentAt: now.toISOString(),
      urgent: event.urgent || false,
      kind: event.kind,
    };
    this.history.push(log);
    return { ...log, mock: receipt.mock || false, audioPending: !audio.audioUrl };
  }
  async inbound(profile, message) {
    if (message.type === 'text' && /^stop$/i.test(message.text.trim())) {
      profile.whatsappOptIn = false;
      profile.whatsappOptOutAt = this.clock().toISOString();
      return { status: 'opted_out', processFurther: false };
    }
    profile.lastInboundAt = this.clock().toISOString();
    if (message.type === 'image') {
      const diagnosis = await new MockDiagnosisProvider().predict({
        crop: message.crop || 'tomato',
      });
      const response = await this.notify(profile, {
        kind: 'diagnosis',
        text: 'Your sample crop result is ready. Open खेत Doctor for care options.',
        route: 'khetdoctor://result',
        approvedTemplate: false,
      });
      return { diagnosis, response, mock: true };
    }
    if (message.type === 'audio') {
      if (!this.languageService) return { status: 'needs_language_service' };
      const transcript = await this.languageService.speechToText(message.audio, profile.language);
      return { intent: await routeIntent(transcript.text), mock: transcript.mock || false };
    }
    return { intent: await routeIntent(message.text || '') };
  }
}
