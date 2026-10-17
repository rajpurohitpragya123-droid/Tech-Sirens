import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
const Message = z.object({
  id: z.string().max(200),
  from: z.string().regex(/^\d{7,15}$/),
  type: z.string().max(40),
  text: z.object({ body: z.string().max(4000) }).optional(),
  image: z.object({ id: z.string().max(200) }).optional(),
  audio: z.object({ id: z.string().max(200) }).optional(),
});
const Envelope = z.object({
  entry: z
    .array(
      z.object({
        changes: z.array(
          z.object({ value: z.object({ messages: z.array(Message).max(100).optional() }) }),
        ),
      }),
    )
    .max(100),
});
async function signatureValid(body: string, signature: string | null, secret: string) {
  if (!signature?.startsWith('sha256=')) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)));
  const expected = [...mac].map((b) => b.toString(16).padStart(2, '0')).join('');
  const actual = signature.slice(7);
  if (actual.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++)
    mismatch |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
  return mismatch === 0;
}
Deno.serve(async (req: Request) => {
  const json = (status: number, data: unknown) =>
    new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
  const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN'),
    secret = Deno.env.get('WHATSAPP_APP_SECRET');
  if (req.method === 'GET') {
    const url = new URL(req.url);
    if (
      verifyToken &&
      url.searchParams.get('hub.verify_token') === verifyToken &&
      url.searchParams.get('hub.mode') === 'subscribe'
    )
      return new Response(url.searchParams.get('hub.challenge') || '', { status: 200 });
    return json(403, { error: 'Verification failed' });
  }
  if (req.method !== 'POST') return json(405, { error: 'POST required' });
  if (!secret) return json(503, { error: 'Webhook not configured' });
  const body = await req.text();
  if (new TextEncoder().encode(body).length > 1_000_000)
    return json(413, { error: 'Payload too large' });
  if (!(await signatureValid(body, req.headers.get('X-Hub-Signature-256'), secret)))
    return json(401, { error: 'Invalid signature' });
  let parsed;
  try {
    parsed = Envelope.safeParse(JSON.parse(body));
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }
  if (!parsed.success) return json(400, { error: 'Invalid webhook' });
  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  for (const entry of parsed.data.entry)
    for (const change of entry.changes)
      for (const message of change.value.messages || []) {
        if (!['text', 'image', 'audio'].includes(message.type)) continue;
        const { data: profile, error } = await db
          .from('profiles')
          .select('id,whatsapp_opt_in')
          .eq('phone', message.from)
          .maybeSingle();
        if (error) return json(500, { error: 'Profile lookup failed' });
        if (!profile) continue;
        if (message.type === 'text' && /^stop$/i.test(message.text?.body.trim() || '')) {
          const now = new Date().toISOString();
          const { error: stopError } = await db
            .from('profiles')
            .update({ whatsapp_opt_in: false, whatsapp_opt_out_at: now })
            .eq('id', profile.id);
          if (stopError) return json(500, { error: 'Opt-out failed' });
          await db
            .from('notification_consents')
            .insert({ farmer_id: profile.id, opted_in: false, source: 'whatsapp_stop' });
          await db
            .from('notifications')
            .update({ status: 'cancelled' })
            .eq('farmer_id', profile.id)
            .eq('channel', 'whatsapp')
            .in('status', ['queued', 'deferred']);
          continue;
        }
        await db
          .from('profiles')
          .update({ last_whatsapp_inbound_at: new Date().toISOString() })
          .eq('id', profile.id);
        const { error: queueError } = await db.from('whatsapp_inbound_jobs').upsert(
          {
            farmer_id: profile.id,
            message_id: message.id,
            type: message.type,
            text: message.text?.body || null,
            media_id: message.image?.id || message.audio?.id || null,
          },
          { onConflict: 'message_id', ignoreDuplicates: true },
        );
        if (queueError) return json(500, { error: 'Could not queue input' });
      }
  return json(200, { received: true });
});
