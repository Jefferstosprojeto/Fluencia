import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Rate limiting em memória (reset quando a função cold-starts)
const ipLog = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 30; // requests/IP/hora

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipLog.get(ip) ?? { count: 0, reset: now + 3_600_000 };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + 3_600_000; }
  entry.count++;
  ipLog.set(ip, entry);
  return entry.count <= RATE_LIMIT;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: 'rate limit exceeded' }), {
      status: 429, headers: { ...CORS, 'content-type': 'application/json' }
    });
  }

  let body: { falaAluno: string; roteiroPasso: string; cenario: string; lang?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid JSON' }), {
      status: 400, headers: { ...CORS, 'content-type': 'application/json' }
    });
  }

  const { falaAluno, roteiroPasso, cenario } = body;
  const key = Deno.env.get('ANTHROPIC_API_KEY');
  if (!key) {
    return new Response(JSON.stringify({ error: 'server misconfigured' }), {
      status: 500, headers: { ...CORS, 'content-type': 'application/json' }
    });
  }

  const system = `És um falante nativo no cenário: "${cenario}".
Após CADA fala do utilizador, responde SOMENTE com JSON válido:
{ "avaliacao": "1 linha sobre clareza/naturalidade/formalidade",
  "reescrita": "a frase reescrita 100% nativa",
  "dica": "1 dica curta de pronúncia (tônica ou som específico)",
  "proximaFala": "tua próxima fala como personagem, curta e natural" }`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 350,
        system,
        messages: [{ role: 'user', content: JSON.stringify({ roteiroPasso, falaAluno }) }],
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      throw new Error(`Anthropic ${r.status}: ${err}`);
    }

    const j = await r.json();
    const texto = (j.content as Array<{ type: string; text: string }>)
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    // Validar que é JSON com os campos esperados
    const parsed = JSON.parse(texto);
    const required = ['avaliacao', 'reescrita', 'dica', 'proximaFala'];
    for (const k of required) {
      if (!(k in parsed)) throw new Error(`campo '${k}' em falta na resposta`);
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...CORS, 'content-type': 'application/json' }
    });
  } catch (e) {
    console.error('ai-proxy error:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 502, headers: { ...CORS, 'content-type': 'application/json' }
    });
  }
});
