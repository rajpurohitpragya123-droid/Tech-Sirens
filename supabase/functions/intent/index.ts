import { z } from 'npm:zod@3';
import { createClient } from 'npm:@supabase/supabase-js@2';
const Input = z.object({
  text: z.string().min(1).max(1000),
  language: z.enum(['hi', 'en', 'pa', 'mr']),
});
Deno.serve(async (req: Request) => {
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  if (req.method !== 'POST') return json(405, { error: 'POST required' });
  const authorization = req.headers.get('Authorization');
  if (!authorization) return json(401, { error: 'Authentication required' });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
  });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return json(401, { error: 'Invalid session' });
  try {
    const result = Input.safeParse(await req.json());
    if (!result.success) return json(400, { error: 'Invalid input' });
    const text = result.data.text.toLowerCase();
    const rules: [RegExp, string][] = [
      [/पराली|stubble|parali/, 'parali'],
      [/सिंचाई|water|irrigation/, 'irrigation'],
      [/बेच|sell|price/, 'sell'],
      [/खाद|seed|buy/, 'bazaar'],
      [/रोग|diagnose|leaf/, 'diagnose'],
    ];
    return json(200, {
      intent: rules.find(([r]) => r.test(text))?.[1] || 'help',
      source: 'keyword',
      mock: true,
    });
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }
});
