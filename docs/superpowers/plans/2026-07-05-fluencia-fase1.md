# Fluência Fase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o app de espanhol de viagem numa plataforma multi-track (Viagem + Negócios) com homepage própria, conteúdo de negócios, Supabase AI proxy e página de privacidade pronta para AdSense.

**Architecture:** PWA estático (HTML/CSS/JS puro, sem build). Conteúdo em JSON por língua/track (`content/{lang}/{track}.json`). Supabase Edge Function como proxy da Anthropic API — utilizadores não precisam de chave própria. Motor com fallback em 3 níveis: proxy → chave localStorage → avaliador local.

**Tech Stack:** HTML5, CSS3 com custom properties, JavaScript ES2022 (módulos não usados, tudo global), Supabase CLI + Deno (Edge Functions), GitHub Pages.

## Global Constraints

- Sem framework, sem build step — editar ficheiros directamente
- Ao alterar qualquer ficheiro do shell, incrementar `VERSAO` em `service-worker.js`
- Contraste AA obrigatório (texto ≥ 4.5:1)
- O marca-texto açafrão (`--marker: #FFC400`) é o elemento-assinatura — não trocar
- JSON de conteúdo segue contrato estrito (validar com `python3 -c "import json; json.load(open('...'))"`)
- Repositório GitHub: `https://github.com/Jefferstosprojeto/fluencia`
- GitHub Pages serve a partir da raiz da branch `main`

---

## Mapa de ficheiros

| Ficheiro | Estado | Responsabilidade |
|----------|--------|-----------------|
| `index.html` | CRIAR (novo) | Homepage: seletor de língua + track + CTA |
| `app.html` | CRIAR (renomear de index.html) | Shell do app: abas, progresso, roteador hash |
| `app.js` | MODIFICAR | Motor, componentes — ler lang/track de query params |
| `service-worker.js` | MODIFICAR | v5→v6, novos caminhos no SHELL |
| `manifest.json` | MODIFICAR | start_url: `./index.html` |
| `content/es/viagem.json` | CRIAR (mover conteudo.json) | 6 módulos existentes |
| `content/es/negocios.json` | CRIAR | 7 módulos de negócios gerados via API |
| `supabase/functions/ai-proxy/index.ts` | CRIAR | Edge Function proxy Anthropic com rate limit |
| `privacy.html` | CRIAR | Política de privacidade (GDPR + AdSense) |
| `CLAUDE.md` | MODIFICAR | Actualizar estrutura e regras |

---

## Task 1: Reorganizar ficheiros e actualizar caminhos

**Files:**
- Rename: `index.html` → `app.html`
- Create: `content/es/viagem.json` (mover conteudo.json)
- Modify: `app.js` (linha de fetch)
- Modify: `manifest.json` (start_url)

**Interfaces:**
- Produz: `app.html` acessível em `app.html?lang=es&track=viagem`
- Produz: `content/es/viagem.json` com os 6 módulos existentes

- [ ] **Step 1: Copiar index.html para app.html**

No terminal do Claude Code (prefixo `!`):
```powershell
Copy-Item "C:\Users\jssantos\Documents\CLAUDE CODE\Primeiro Projeto\Fluencia\index.html" `
          "C:\Users\jssantos\Documents\CLAUDE CODE\Primeiro Projeto\Fluencia\app.html"
```

- [ ] **Step 2: Criar pasta content/es e mover conteudo.json**

```powershell
New-Item -ItemType Directory -Force "C:\Users\jssantos\Documents\CLAUDE CODE\Primeiro Projeto\Fluencia\content\es"
Copy-Item "C:\Users\jssantos\Documents\CLAUDE CODE\Primeiro Projeto\Fluencia\conteudo.json" `
          "C:\Users\jssantos\Documents\CLAUDE CODE\Primeiro Projeto\Fluencia\content\es\viagem.json"
```

- [ ] **Step 3: Actualizar fetch em app.js**

Em `app.js`, no `boot()`, substituir:
```js
// ANTES
CONTEUDO = await (await fetch('conteudo.json')).json();
```
por:
```js
// DEPOIS
const { lang, track } = getParams();
CONTEUDO = await (await fetch(`content/${lang}/${track}.json`)).json();
```

Adicionar a função `getParams` logo antes de `boot()`:
```js
function getParams() {
  const p = new URLSearchParams(location.search);
  return { lang: p.get('lang') || 'es', track: p.get('track') || 'viagem' };
}
```

- [ ] **Step 4: Adicionar link "← Início" no app.html**

Em `app.html`, dentro de `.topbar__inner`, antes do `.brand`:
```html
<a class="home-back" href="index.html" aria-label="Voltar à página inicial">←</a>
```

Adicionar CSS no final de `styles.css`:
```css
/* ===== BACK LINK ===== */
.home-back {
  display: flex; align-items: center; justify-content: center;
  width: 2.25rem; height: 2.25rem; border-radius: var(--r-sm);
  color: var(--text-muted); text-decoration: none; font-size: var(--fs-lg);
  transition: color var(--t-fast) var(--ease), background var(--t-fast) var(--ease);
  flex-shrink: 0;
}
.home-back:hover { color: var(--text); background: var(--surface-2); }
```

- [ ] **Step 5: Actualizar manifest.json**

Em `manifest.json`, mudar:
```json
"start_url": "./"
```
para:
```json
"start_url": "./index.html"
```

- [ ] **Step 6: Verificar no browser**

Abrir servidor local:
```powershell
cd "C:\Users\jssantos\Documents\CLAUDE CODE\Primeiro Projeto\Fluencia"
python -m http.server 8080
```
Abrir `http://localhost:8080/app.html?lang=es&track=viagem` — deve carregar os 6 módulos normalmente. Verificar que o botão ← aparece no header.

- [ ] **Step 7: Commit**

```powershell
cd "C:\Users\jssantos\Documents\CLAUDE CODE\Primeiro Projeto\Fluencia"
git add app.html content/ app.js styles.css manifest.json
git commit -m "refactor: reorganizar estrutura — app.html, content/es/viagem.json, query params"
```

---

## Task 2: Mostrar track label no header do app

**Files:**
- Modify: `app.js` (função `navegar`)
- Modify: `app.html` (brand text)

**Interfaces:**
- Consome: `getParams()` da Task 1
- Produz: header mostra "Viagem" ou "Negócios" conforme o track activo

- [ ] **Step 1: Actualizar brand text em app.html**

Substituir o bloco `.brand__text` em `app.html`:
```html
<!-- ANTES -->
<span class="brand__text">
  <b>Espanhol de Sobrevivência</b>
  <small>A0 → A1 · viagem na Espanha</small>
</span>

<!-- DEPOIS -->
<span class="brand__text">
  <b>Fluência</b>
  <small id="brand-sub">A0 → A1 · Espanhol</small>
</span>
```

- [ ] **Step 2: Actualizar brand-sub em boot()**

Em `app.js`, no `boot()`, após `const { lang, track } = getParams();`:
```js
const TRACK_LABELS = { viagem: 'Viagem', negocios: 'Negócios' };
const LANG_LABELS  = { es: 'Espanhol', en: 'Inglês', de: 'Alemão', fr: 'Francês' };
const sub = document.getElementById('brand-sub');
if (sub) sub.textContent = `A0 → A1 · ${LANG_LABELS[lang] || lang} · ${TRACK_LABELS[track] || track}`;
```

- [ ] **Step 3: Verificar**

`http://localhost:8080/app.html?lang=es&track=negocios` — header deve mostrar "Fluência / A0 → A1 · Espanhol · Negócios" (mesmo sem o ficheiro negocios.json ainda, mostra o erro esperado de fetch).

- [ ] **Step 4: Commit**

```powershell
git add app.html app.js
git commit -m "feat: mostrar lingua e track no header do app"
```

---

## Task 3: Gerar content/es/negocios.json

**Files:**
- Create: `scripts/gerar_negocios.py`
- Create: `content/es/negocios.json`

**Interfaces:**
- Produz: `content/es/negocios.json` com 7 módulos no mesmo contrato de `viagem.json`

O contrato JSON esperado (mesmo que viagem.json):
```json
{
  "modulos": [
    {
      "id": "presentaciones",
      "modulo": "Apresentações Profissionais",
      "objetivo": "...",
      "frases_chave": [
        { "es": "...", "pt": "...", "pronuncia": "...", "variacoes": ["...", "..."] }
      ],
      "palavras_essenciais": ["..."],
      "padrao_gramatical": { "tema": "...", "exemplos": ["..."] },
      "exercicios": {
        "flashcards": [{ "frente": "pt", "verso": "es" }],
        "ditado": ["frase es"],
        "lacunas": [{ "frase": "___ ...", "resposta": "..." }],
        "role_play": {
          "cenario": "...",
          "personagens": ["Cliente (aluno)", "Papel (você)"],
          "roteiro": ["...", "..."],
          "avaliacao_regra": "..."
        }
      },
      "revisao": { "em_4h": ["..."], "em_24h": ["..."] }
    }
  ]
}
```

- [ ] **Step 1: Criar script de geração**

Criar `scripts/gerar_negocios.py`:
```python
"""
Gera content/es/negocios.json com 7 módulos via Anthropic API.
Uso: python scripts/gerar_negocios.py
Requer: pip install anthropic
        export ANTHROPIC_API_KEY=sk-ant-...
"""
import json, os, time
import anthropic

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

CONTRATO = '''Responda SOMENTE com JSON válido (sem markdown, sem comentários):
{
  "id": "slug-sem-acento",
  "modulo": "Nome",
  "objetivo": "1 frase",
  "frases_chave": [ { "es": "...", "pt": "...", "pronuncia": "VOgal MAIúscula=tônica", "variacoes": ["...","..."] } ],
  "palavras_essenciais": ["..."],
  "padrao_gramatical": { "tema": "...", "exemplos": ["...","...","..."] },
  "exercicios": {
    "flashcards": [ { "frente": "PT", "verso": "ES" } ],
    "ditado": ["frase completa es", "..."],
    "lacunas": [ { "frase": "___ frase", "resposta": "palavra" } ],
    "role_play": { "cenario": "...", "personagens": ["Profissional (aluno)","Contraparte"],
      "roteiro": ["passo1","passo2","passo3","passo4"],
      "avaliacao_regra": "Após cada resposta: 1 linha (clareza/formalidade), reescreva nativo, 1 dica pronúncia." }
  },
  "revisao": { "em_4h": ["...","..."], "em_24h": ["...","..."] }
}'''

REGRAS = '''Regras:
- Espanhol neutro (serve Espanha e América Latina) com notas onde diferem muito.
- Registo formal/profissional; use "usted" como padrão em role-play.
- 5-7 frases-chave, 6-10 palavras essenciais, 1 padrão gramatical (condicional de cortesia: quisiera/podría).
- Cada frase-chave: pronúncia aproximada (VOGAL=tônica), tradução, EXACTAMENTE 2 variações naturais.
- Role-play com tensão real — negociação, desacordo cortês, pressão de tempo.
- 6 flashcards mínimo, 4 ditados, 4 lacunas.'''

MODULOS = [
    ("presentaciones",       "Apresentações Profissionais",  "Feira de negócios — apresentar-se, empresa, cargo, troca de cartão"),
    ("reuniones",            "Reuniões e Conferências",       "Reunião de equipa — concordar, discordar, pedir esclarecimento, agendar"),
    ("negociacion",          "Negociação e Propostas",        "Fechar contrato — propor preço, condições, contraproposta, fecho"),
    ("comunicacion-escrita", "Comunicação Escrita",           "Ditar email formal e mensagem WhatsApp profissional"),
    ("telefono",             "Telefone e Videochamada",       "Atender chamada, transferir, deixar recado, problemas técnicos"),
    ("almuerzo-negocios",    "Almoço de Negócios",            "Hospitalidade, brindes, pagar conta, restrições alimentares"),
    ("viaje-corporativo",    "Viagem Corporativa",            "Check-in hotel, táxi, aeroporto, nota de despesa"),
]

modulos = []
for slug, nome, cenario in MODULOS:
    print(f"Gerando: {nome}...")
    prompt = f'''És professor de espanhol de negócios. Gera o módulo "{nome}" (nível B1, negócios, sobrevivência corporativa).
Contexto do cenário role-play: {cenario}
{REGRAS}
{CONTRATO}'''
    r = client.messages.create(
        model="claude-sonnet-5",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )
    texto = r.content[0].text.strip()
    modulo = json.loads(texto)
    modulo["id"] = slug  # garantir slug correcto
    modulos.append(modulo)
    print(f"  ✓ {len(modulo['frases_chave'])} frases, {len(modulo['exercicios']['flashcards'])} flashcards")
    time.sleep(1)  # respeitar rate limit

output = {"modulos": modulos}
path = "content/es/negocios.json"
with open(path, "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)
print(f"\n✓ Guardado em {path} — {len(modulos)} módulos")
```

- [ ] **Step 2: Executar o script**

```powershell
cd "C:\Users\jssantos\Documents\CLAUDE CODE\Primeiro Projeto\Fluencia"
$env:ANTHROPIC_API_KEY = "sk-ant-..."   # substituir pela chave real
pip install anthropic -q
python scripts/gerar_negocios.py
```

Esperado: 7 linhas `✓ ...` e mensagem final `✓ Guardado em content/es/negocios.json`.

- [ ] **Step 3: Validar JSON**

```powershell
python -c "
import json
d = json.load(open('content/es/negocios.json', encoding='utf-8'))
assert len(d['modulos']) == 7, 'Faltam módulos'
for m in d['modulos']:
    assert 'frases_chave' in m and len(m['frases_chave']) >= 5, f'{m[\"id\"]}: frases_chave insuficientes'
    assert 'exercicios' in m
    rp = m['exercicios']['role_play']
    assert 'roteiro' in rp and len(rp['roteiro']) >= 3, f'{m[\"id\"]}: roteiro curto'
print('✓ JSON válido —', len(d[\"modulos\"]), 'módulos')
"
```

- [ ] **Step 4: Testar no browser**

`http://localhost:8080/app.html?lang=es&track=negocios` — deve carregar os 7 módulos de negócios. Navegar para Simulador e fazer 1 turno para confirmar role-play funcional.

- [ ] **Step 5: Commit**

```powershell
git add content/es/negocios.json scripts/gerar_negocios.py
git commit -m "feat: content/es/negocios.json — 7 modulos de espanhol para negocios"
```

---

## Task 4: Supabase Edge Function ai-proxy

**Files:**
- Create: `supabase/functions/ai-proxy/index.ts`
- Create: `supabase/config.toml` (gerado pelo CLI)

**Interfaces:**
- Consome: `ANTHROPIC_API_KEY` (env var no Supabase)
- Produz: `POST https://<PROJECT_REF>.supabase.co/functions/v1/ai-proxy` → `{ avaliacao, reescrita, dica, proximaFala }`

- [ ] **Step 1: Instalar Supabase CLI**

```powershell
# Se não tiver o Supabase CLI:
npm install -g supabase
# ou via scoop:
scoop install supabase
```

Verificar: `supabase --version` → deve mostrar `1.x.x` ou superior.

- [ ] **Step 2: Criar projecto Supabase**

No browser: `https://supabase.com/dashboard` → New Project → nome "fluencia" → guardar a password.
Após criação: copiar o **Project Reference ID** (aparece em Settings → General, formato `abcdefghijklmnop`).

- [ ] **Step 3: Inicializar Supabase na pasta local**

```powershell
cd "C:\Users\jssantos\Documents\CLAUDE CODE\Primeiro Projeto\Fluencia"
supabase init
supabase login
supabase link --project-ref <PROJECT_REF>
```

- [ ] **Step 4: Criar Edge Function**

```powershell
supabase functions new ai-proxy
```

Substituir o conteúdo de `supabase/functions/ai-proxy/index.ts` por:

```typescript
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
```

- [ ] **Step 5: Configurar a chave Anthropic no Supabase**

```powershell
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

- [ ] **Step 6: Deploy da função**

```powershell
supabase functions deploy ai-proxy --no-verify-jwt
```

Esperado: URL no output, formato `https://<PROJECT_REF>.supabase.co/functions/v1/ai-proxy`.

- [ ] **Step 7: Testar a função com curl**

```powershell
$url = "https://<PROJECT_REF>.supabase.co/functions/v1/ai-proxy"
$body = '{"falaAluno":"Hola, me llamo Jefferson","roteiroPasso":"Apresenta-te","cenario":"Feira de negocios"}'
Invoke-RestMethod -Uri $url -Method POST -ContentType "application/json" -Body $body
```

Esperado: objeto JSON com `avaliacao`, `reescrita`, `dica`, `proximaFala`.

- [ ] **Step 8: Commit**

```powershell
git add supabase/
git commit -m "feat: supabase edge function ai-proxy com rate limiting"
```

---

## Task 5: Actualizar Motor — fallback em 3 níveis

**Files:**
- Modify: `app.js` (objecto `Motor`)

**Interfaces:**
- Consome: URL da Edge Function da Task 4
- Produz: `Motor.avaliarTurno()` com prioridade proxy → localStorage key → local

- [ ] **Step 1: Substituir o objecto Motor em app.js**

Localizar o bloco `const Motor = { ... };` e substituir por:

```js
/* ---------- 3) motor — fallback em 3 níveis ----------------------------- */
/* 1) Supabase proxy (padrão, sem chave visível ao utilizador)
   2) Chave Anthropic do utilizador em localStorage
   3) Avaliador local heurístico (offline, nunca quebra a lição)            */
const Motor = {
  proxyUrl: 'https://<PROJECT_REF>.supabase.co/functions/v1/ai-proxy', // ← substituir após deploy
  modelos: { opus: 'claude-opus-4-8', sonnet: 'claude-sonnet-5', fable: 'claude-fable-5' },

  getKey() { return localStorage.getItem('es:api-key') || ''; },

  async avaliarTurno({ cenario, roteiroPasso, falaAluno }) {
    // Nível 1: proxy Supabase
    if (this.proxyUrl) {
      try {
        const r = await fetch(this.proxyUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ falaAluno, roteiroPasso, cenario, lang: 'es' })
        });
        if (r.ok) return await r.json();
      } catch (_) { /* continua para nível 2 */ }
    }
    // Nível 2: chave do utilizador em localStorage
    const key = this.getKey();
    if (key) {
      try {
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: this.modelos.sonnet,
            max_tokens: 300,
            system: PROMPTS.simulador(cenario),
            messages: [{ role: 'user', content: JSON.stringify({ roteiroPasso, falaAluno }) }]
          })
        });
        if (r.ok) {
          const j = await r.json();
          const texto = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
          return JSON.parse(texto);
        }
      } catch (_) { /* continua para nível 3 */ }
    }
    // Nível 3: avaliador local
    return avaliarLocal({ roteiroPasso, falaAluno });
  }
};
```

**Nota:** substituir `<PROJECT_REF>` pelo valor real obtido no Step 6 da Task 4.

- [ ] **Step 2: Actualizar initConfig para mostrar estado do proxy**

Na função `initConfig()`, na função `atualizarBtn`, alterar para:
```js
const atualizarBtn = () => {
  const temProxy = !!Motor.proxyUrl;
  const temChave = !!Motor.getKey();
  const ativa = temProxy || temChave;
  btn.title = temProxy
    ? '🟢 IA activa via Fluência'
    : temChave ? '🔑 IA activa via chave pessoal — configurar'
    : 'Configurar chave API pessoal';
  btn.querySelector('.icon-btn__glyph').textContent = temProxy ? '🟢' : temChave ? '🔑' : '⚙';
  btn.setAttribute('aria-label', btn.title);
};
```

Na função `initConfig()`, actualizar o texto do dialog para reflectir que o proxy já cobre todos:
```js
// substituir o parágrafo desc no dlg-config em app.html:
```
Em `app.html`, no dialog `#dlg-config`, substituir o parágrafo `.config-dlg__desc`:
```html
<p class="config-dlg__desc">
  O simulador já usa IA via Fluência — gratuito para todos.
  Podes adicionar a tua chave pessoal Anthropic como fallback extra.
</p>
```

- [ ] **Step 3: Verificar fallback**

1. Abrir `http://localhost:8080/app.html?lang=es&track=viagem`
2. Ir ao Simulador → escrever qualquer frase → clicar Enviar
3. Com `Motor.proxyUrl` preenchido: avaliação deve vir do Claude (rica, personalizada)
4. Temporariamente colocar `proxyUrl: ''` e sem chave localStorage: deve usar avaliação local (sem quebrar)

- [ ] **Step 4: Commit**

```powershell
git add app.js app.html
git commit -m "feat: motor com fallback 3 niveis — proxy supabase > chave user > local"
```

---

## Task 6: Nova homepage index.html

**Files:**
- Create: `index.html` (landing page)

**Interfaces:**
- Produz: `index.html` com routing para `app.html?lang=es&track=viagem` e `app.html?lang=es&track=negocios`

- [ ] **Step 1: Criar index.html**

Criar `index.html` com o seguinte conteúdo:

```html
<!doctype html>
<html lang="pt-BR" data-tema="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Fluência — Sobrevive em qualquer língua</title>
  <meta name="description" content="Aprende espanhol para viagem e negócios em módulos práticos. PWA offline, sem registo." />

  <!-- OG / Social -->
  <meta property="og:title" content="Fluência — Sobrevive em qualquer língua" />
  <meta property="og:description" content="Espanhol de sobrevivência para viagem e negócios. Grátis, offline, sem registo." />
  <meta property="og:type" content="website" />

  <!-- PWA -->
  <link rel="manifest" href="manifest.json" />
  <meta name="theme-color" content="#C60B1E" media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content="#0F0500" media="(prefers-color-scheme: dark)" />
  <link rel="apple-touch-icon" href="icons/icon-192.png" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #FFFBF0; --surface: #FFFFFF; --surface-2: #FFF7E0;
      --text: #1A0800; --text-muted: #7A5C3A; --border: #EAD9A8;
      --brand: #C60B1E; --brand-hover: #9A0818;
      --marker: #FFC400; --marker-soft: #FFF3C4;
      --success: #166534; --success-bg: #DCFCE7;
      --font-display: "Bricolage Grotesque", system-ui, sans-serif;
      --font-body: "Inter", system-ui, sans-serif;
      --r-md: 10px; --r-lg: 16px; --r-pill: 999px;
      --sh-md: 0 4px 14px rgba(198,11,30,.10);
      --t-base: 220ms; --ease: cubic-bezier(.22,1,.36,1);
    }
    [data-tema="dark"] {
      --bg: #0F0500; --surface: #1A0A00; --surface-2: #2A1500;
      --text: #F5F0E8; --text-muted: #C8A882; --border: #3D2000;
      --brand: #FFC400; --brand-hover: #FFD740;
      --marker: #FFC400; --marker-soft: #3D2A00;
    }

    body {
      font-family: var(--font-body); background: var(--bg); color: var(--text);
      min-height: 100dvh; display: flex; flex-direction: column;
    }

    /* ---- HEADER ---- */
    .site-header {
      display: flex; justify-content: flex-end; padding: 1rem 1.5rem;
    }
    .btn-tema {
      background: none; border: 1px solid var(--border); border-radius: var(--r-pill);
      color: var(--text-muted); padding: .4rem .9rem; cursor: pointer; font-size: .85rem;
      transition: border-color var(--t-base) var(--ease);
    }
    .btn-tema:hover { border-color: var(--brand); color: var(--brand); }

    /* ---- HERO ---- */
    .hero {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 2rem 1.5rem 3rem; text-align: center; gap: 2rem;
    }
    .logo {
      width: 4.5rem; height: 4.5rem; border-radius: 1.25rem;
      background: var(--brand); display: flex; align-items: center; justify-content: center;
      font-family: var(--font-display); font-size: 1.75rem; font-weight: 700; color: #fff;
      box-shadow: var(--sh-md);
    }
    [data-tema="dark"] .logo { background: var(--marker); color: #1A0800; }
    .hero__title {
      font-family: var(--font-display); font-size: clamp(2rem, 6vw, 3.5rem);
      font-weight: 700; line-height: 1.1; letter-spacing: -.02em;
    }
    .hero__title mark {
      background: var(--marker-soft); color: var(--brand);
      border-radius: 4px; padding: 0 .15em;
    }
    [data-tema="dark"] .hero__title mark { color: var(--marker); }
    .hero__sub { color: var(--text-muted); font-size: 1.05rem; max-width: 26rem; }

    /* ---- SELETOR DE LÍNGUA ---- */
    .lang-section { width: 100%; max-width: 36rem; }
    .lang-section h2 {
      font-family: var(--font-display); font-size: .8rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: .08em; color: var(--text-muted);
      margin-bottom: .75rem; text-align: left;
    }
    .lang-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: .75rem;
    }
    @media (min-width: 480px) { .lang-grid { grid-template-columns: repeat(4, 1fr); } }
    .lang-card {
      display: flex; flex-direction: column; align-items: center; gap: .4rem;
      padding: .9rem .5rem; border-radius: var(--r-lg); border: 2px solid var(--border);
      background: var(--surface); cursor: pointer; font-family: var(--font-body);
      font-size: .9rem; font-weight: 500; color: var(--text-muted);
      transition: border-color var(--t-base) var(--ease), box-shadow var(--t-base) var(--ease);
      position: relative;
    }
    .lang-card .flag { font-size: 1.6rem; }
    .lang-card.is-active { border-color: var(--brand); color: var(--text); background: var(--surface); box-shadow: var(--sh-md); }
    [data-tema="dark"] .lang-card.is-active { border-color: var(--marker); }
    .lang-card:disabled { opacity: .45; cursor: not-allowed; }
    .lang-card .badge {
      position: absolute; top: .4rem; right: .4rem;
      font-size: .6rem; font-weight: 600; padding: .1rem .4rem;
      background: var(--marker-soft); color: var(--brand); border-radius: var(--r-pill);
    }
    [data-tema="dark"] .lang-card .badge { color: var(--marker); }

    /* ---- SELETOR DE TRACK ---- */
    .track-section { width: 100%; max-width: 36rem; }
    .track-section h2 {
      font-family: var(--font-display); font-size: .8rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: .08em; color: var(--text-muted);
      margin-bottom: .75rem; text-align: left;
    }
    .track-tabs { display: flex; gap: .5rem; }
    .track-btn {
      flex: 1; padding: .75rem 1rem; border-radius: var(--r-md);
      border: 2px solid var(--border); background: var(--surface);
      font-family: var(--font-display); font-size: 1rem; font-weight: 600; color: var(--text-muted);
      cursor: pointer; transition: border-color var(--t-base) var(--ease), color var(--t-base) var(--ease);
    }
    .track-btn.is-active { border-color: var(--brand); color: var(--brand); }
    [data-tema="dark"] .track-btn.is-active { border-color: var(--marker); color: var(--marker); }

    /* ---- CTA ---- */
    .cta-wrap { width: 100%; max-width: 36rem; }
    .btn-cta {
      display: block; width: 100%; padding: 1rem; border-radius: var(--r-lg);
      background: var(--brand); color: #fff; font-family: var(--font-display);
      font-size: 1.1rem; font-weight: 700; text-decoration: none; text-align: center;
      transition: background var(--t-base) var(--ease), transform var(--t-base) var(--ease);
    }
    .btn-cta:hover { background: var(--brand-hover); transform: translateY(-1px); }
    [data-tema="dark"] .btn-cta { background: var(--marker); color: #1A0800; }
    [data-tema="dark"] .btn-cta:hover { background: var(--brand-hover); }

    /* ---- FOOTER ---- */
    footer {
      padding: 1.5rem; text-align: center; font-size: .8rem; color: var(--text-muted);
      border-top: 1px solid var(--border); display: flex; justify-content: center;
      align-items: center; gap: 1.5rem; flex-wrap: wrap;
    }
    footer a { color: inherit; text-decoration: none; }
    footer a:hover { color: var(--brand); }

    /* ---- AdSense placeholder (substituir pelo snippet real) ---- */
    .ad-slot {
      width: 100%; max-width: 36rem; min-height: 60px;
      border: 1px dashed var(--border); border-radius: var(--r-md);
      display: flex; align-items: center; justify-content: center;
      color: var(--text-muted); font-size: .75rem; background: var(--surface-2);
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { transition-duration: 1ms !important; }
    }
  </style>
</head>
<body>
  <header class="site-header">
    <button class="btn-tema" id="btn-tema" aria-pressed="false" aria-label="Alternar tema">◐ Tema</button>
  </header>

  <main class="hero">
    <div class="logo" aria-hidden="true">FL</div>

    <div>
      <h1 class="hero__title">Sobrevive em<br><mark>qualquer língua</mark></h1>
      <p class="hero__sub">Frases essenciais, simulador com IA e revisão espaçada — do zero ao funcional em dias.</p>
    </div>

    <!-- AdSense slot topo (substituir pelo código real após aprovação) -->
    <div class="ad-slot" aria-hidden="true">Anúncio</div>

    <section class="lang-section" aria-labelledby="lang-title">
      <h2 id="lang-title">Língua</h2>
      <div class="lang-grid" role="group" aria-labelledby="lang-title">
        <button class="lang-card is-active" data-lang="es" aria-pressed="true">
          <span class="flag" aria-hidden="true">🇪🇸</span>Espanhol
        </button>
        <button class="lang-card" data-lang="en" disabled aria-pressed="false" aria-disabled="true">
          <span class="flag" aria-hidden="true">🇬🇧</span>Inglês
          <span class="badge" aria-hidden="true">em breve</span>
        </button>
        <button class="lang-card" data-lang="de" disabled aria-pressed="false" aria-disabled="true">
          <span class="flag" aria-hidden="true">🇩🇪</span>Alemão
          <span class="badge" aria-hidden="true">em breve</span>
        </button>
        <button class="lang-card" data-lang="fr" disabled aria-pressed="false" aria-disabled="true">
          <span class="flag" aria-hidden="true">🇫🇷</span>Francês
          <span class="badge" aria-hidden="true">em breve</span>
        </button>
      </div>
    </section>

    <section class="track-section" aria-labelledby="track-title">
      <h2 id="track-title">Área</h2>
      <div class="track-tabs" role="group" aria-labelledby="track-title">
        <button class="track-btn is-active" data-track="viagem" aria-pressed="true">✈️ Viagem</button>
        <button class="track-btn" data-track="negocios" aria-pressed="false">💼 Negócios</button>
      </div>
    </section>

    <div class="cta-wrap">
      <a id="btn-start" class="btn-cta" href="app.html?lang=es&track=viagem">Começar agora →</a>
    </div>
  </main>

  <footer>
    <span>© 2026 Fluência</span>
    <a href="privacy.html">Política de privacidade</a>
    <a href="app.html?lang=es&track=viagem">Espanhol Viagem</a>
    <a href="app.html?lang=es&track=negocios">Espanhol Negócios</a>
  </footer>

  <script>
    // Tema
    const tema = localStorage.getItem('fl:tema');
    const escuro = tema ? tema === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    if (escuro) document.documentElement.dataset.tema = 'dark';

    document.getElementById('btn-tema').addEventListener('click', () => {
      const dark = document.documentElement.dataset.tema !== 'dark';
      document.documentElement.dataset.tema = dark ? 'dark' : 'light';
      localStorage.setItem('fl:tema', dark ? 'dark' : 'light');
    });

    // Seletor de língua
    let lang = 'es', track = 'viagem';

    document.querySelectorAll('[data-lang]').forEach(btn => {
      if (btn.disabled) return;
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-lang]').forEach(b => {
          b.classList.remove('is-active'); b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-active'); btn.setAttribute('aria-pressed', 'true');
        lang = btn.dataset.lang;
        actualizarCTA();
      });
    });

    // Seletor de track
    document.querySelectorAll('[data-track]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-track]').forEach(b => {
          b.classList.remove('is-active'); b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-active'); btn.setAttribute('aria-pressed', 'true');
        track = btn.dataset.track;
        actualizarCTA();
      });
    });

    function actualizarCTA() {
      const a = document.getElementById('btn-start');
      a.href = `app.html?lang=${lang}&track=${track}`;
    }
  </script>
</body>
</html>
```

- [ ] **Step 2: Verificar no browser**

`http://localhost:8080/` — homepage deve carregar. Testar:
- Clicar "Começar agora" → abre `app.html?lang=es&track=viagem`
- Mudar para "Negócios" → botão CTA muda para `app.html?lang=es&track=negocios`
- Alternar tema → persiste no reload
- Verificar em mobile (DevTools → toggle device)

- [ ] **Step 3: Commit**

```powershell
git add index.html
git commit -m "feat: homepage fluencia com seletor de lingua e track"
```

---

## Task 7: privacy.html + service-worker v6 + commit final

**Files:**
- Create: `privacy.html`
- Modify: `service-worker.js` (VERSAO + SHELL)
- Modify: `CLAUDE.md` (actualizar estrutura)

- [ ] **Step 1: Criar privacy.html**

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Política de Privacidade — Fluência</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 42rem; margin: 2rem auto; padding: 0 1.5rem; line-height: 1.7; color: #1a0800; }
    h1 { font-size: 1.75rem; margin-bottom: .5rem; }
    h2 { font-size: 1.1rem; margin-top: 2rem; margin-bottom: .5rem; }
    p, li { margin-bottom: .75rem; }
    a { color: #c60b1e; }
    @media (prefers-color-scheme: dark) {
      body { background: #0f0500; color: #f5f0e8; }
      a { color: #ffc400; }
    }
  </style>
</head>
<body>
  <a href="index.html">← Fluência</a>
  <h1>Política de Privacidade</h1>
  <p><strong>Última actualização:</strong> Julho 2026</p>

  <h2>1. Identificação</h2>
  <p>Este site é operado por Jefferson Santos, Montijo, Portugal. Contacto: jefferstosprojeto@gmail.com</p>

  <h2>2. Dados que recolhemos</h2>
  <p>A Fluência <strong>não recolhe dados pessoais identificáveis</strong>. O teu progresso é guardado exclusivamente no teu dispositivo (localStorage do browser) e nunca é enviado para os nossos servidores.</p>

  <h2>3. Chave API Anthropic (opcional)</h2>
  <p>Se introduzires uma chave API pessoal na configuração ⚙, essa chave é guardada apenas no localStorage do teu browser. Nunca é enviada a terceiros além da Anthropic (api.anthropic.com) quando usas o Simulador.</p>

  <h2>4. Serviço de IA (Simulador)</h2>
  <p>O Simulador envia as tuas respostas (texto transcrito) para um servidor intermediário Supabase que chama a API da Anthropic para avaliação. Não são guardados registos permanentes dessas interacções além do que a Anthropic mantém de acordo com a sua própria política.</p>

  <h2>5. Publicidade (Google AdSense)</h2>
  <p>Este site pode exibir anúncios do Google AdSense. O Google usa cookies para exibir anúncios baseados nas tuas visitas anteriores a este e a outros sites. Podes desactivar a publicidade personalizada em <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">google.com/settings/ads</a>.</p>

  <h2>6. Cookies</h2>
  <p>Usamos apenas cookies técnicos essenciais (preferência de tema, progresso de aprendizagem) guardados localmente. O Google AdSense pode usar cookies de terceiros para fins publicitários.</p>

  <h2>7. Os teus direitos (RGPD)</h2>
  <p>Como não recolhemos dados pessoais identificáveis, a maior parte dos direitos RGPD é satisfeita por omissão. Para eliminar todos os dados locais, usa a opção "Limpar dados do site" nas definições do teu browser.</p>

  <h2>8. Alterações a esta política</h2>
  <p>Eventuais alterações serão publicadas nesta página com nova data de actualização.</p>
</body>
</html>
```

- [ ] **Step 2: Actualizar service-worker.js para v6**

Em `service-worker.js`:
```js
// ANTES
const VERSAO = 'es-sobrevivencia-v5';
const SHELL = [
  './',
  './index.html',
  ...
];

// DEPOIS
const VERSAO = 'fluencia-v6';
const SHELL = [
  './',
  './index.html',
  './app.html',
  './styles.css',
  './app.js',
  './prompts.js',
  './content/es/viagem.json',
  './content/es/negocios.json',
  './manifest.json',
  './privacy.html',
];
```

- [ ] **Step 3: Actualizar CLAUDE.md**

Substituir o conteúdo de `CLAUDE.md` por:
```markdown
# Fluência — instruções para o Claude Code

PWA estático (HTML/CSS/JS puro, sem build) de aprendizagem de línguas por sobrevivência.
Dono: Jefferson Santos (GitHub: jefferstosprojeto). Repo: Jefferstosprojeto/fluencia.
GitHub Pages: https://jefferstosprojeto.github.io/fluencia/

## Estrutura actual

index.html          Homepage: seletor de língua + track → app.html?lang=&track=
app.html            Shell do app: abas, progresso, roteador hash
app.js              Motor (3 níveis: Supabase proxy > chave user > local), componentes, roteador
styles.css          Design system (tokens CSS, dark/light, paleta Bandeira Espanha)
prompts.js          Prompts para gerar/avaliar conteúdo com Claude
service-worker.js   Offline-first (precache + stale-while-revalidate) — ver VERSAO
manifest.json       PWA instalável (start_url: ./index.html)
privacy.html        Política de privacidade (obrigatório para AdSense)

content/
  es/viagem.json    6 módulos A0→A1 espanhol viagem
  es/negocios.json  7 módulos B1 espanhol negócios

supabase/
  functions/ai-proxy/index.ts   Edge Function proxy Anthropic (rate limit 30 req/IP/hora)

## Regras

- Sem framework, sem build: editar ficheiros directamente.
- Ao alterar qualquer ficheiro do shell: incrementar VERSAO em service-worker.js.
- JSON de conteúdo: validar com python3 -c "import json; json.load(open('content/es/viagem.json'))"
- Contraste AA obrigatório (≥ 4.5:1).
- Marca-texto açafrão (--marker: #FFC400) é o elemento-assinatura: não trocar.

## Motor — prioridade de avaliação

1. Supabase proxy (Motor.proxyUrl) — padrão, cobre todos os utilizadores
2. Chave Anthropic do utilizador (localStorage 'es:api-key') — fallback
3. avaliarLocal() — fallback final, nunca quebra

## Roadmap (fazer só se Jefferson pedir)

Fase 2: domínio próprio, Google Analytics, OG tags, sitemap, EN Viagem
Fase 3: EN Negócios, DE Viagem, FR Viagem
Fase 4: módulos sectoriais, freemium
```

- [ ] **Step 4: Verificar tudo no browser**

```
http://localhost:8080/           → homepage com seletor
http://localhost:8080/app.html?lang=es&track=viagem    → 6 módulos viagem
http://localhost:8080/app.html?lang=es&track=negocios  → 7 módulos negócios
http://localhost:8080/privacy.html                     → política de privacidade
```

Verificar em DevTools → Application → Service Workers que o novo SW v6 está registado.

- [ ] **Step 5: Commit e push final**

```powershell
cd "C:\Users\jssantos\Documents\CLAUDE CODE\Primeiro Projeto\Fluencia"
git add index.html app.html app.js service-worker.js manifest.json privacy.html CLAUDE.md content/
git status  # confirmar que não há ficheiros sensíveis
git commit -m "feat: Fluencia Fase 1 — homepage, negocios, proxy supabase, privacy"
git push origin main
```

---

## Self-review

**Cobertura do spec:**
- ✅ Homepage com seletor língua + track (Task 6)
- ✅ `app.html` com query params lang + track (Task 1 + 2)
- ✅ `content/es/viagem.json` + `content/es/negocios.json` (Task 1 + 3)
- ✅ Supabase Edge Function com rate limit (Task 4)
- ✅ Motor com 3 níveis de fallback (Task 5)
- ✅ `privacy.html` (Task 7)
- ✅ service-worker v6 com novos caminhos (Task 7)
- ✅ `manifest.json` start_url actualizado (Task 1)
- ✅ `CLAUDE.md` actualizado (Task 7)

**Gaps identificados e resolvidos:**
- OG tags adicionadas na homepage (Task 6) — necessárias antes do AdSense
- Link "← Início" no app.html (Task 1) — UX essencial na nova arquitectura
- Validação JSON do negocios.json (Task 3 Step 3) — regra do projecto

**Candidatura AdSense** (manual, após deploy):
1. Ir a `adsense.google.com` → criar conta
2. Adicionar o domínio (GitHub Pages ou domínio próprio)
3. Colocar o snippet de verificação antes de `</head>` em `index.html` e `app.html`
4. Aguardar aprovação (1–14 dias)
5. Substituir `.ad-slot` pelo código de anúncio real
