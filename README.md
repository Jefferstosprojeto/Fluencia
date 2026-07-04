# Espanhol de Sobrevivência — PWA A0 → A1

Site PWA offline-first para levar um iniciante do zero ao espanhol funcional de viagem na Espanha.
Sem framework: `index.html` + `styles.css` + `app.js`. Conteúdo em `conteudo.json`. Design em `design-tokens.json`.

## Rodar localmente
O app usa `fetch('conteudo.json')`, então precisa de um servidor (não abra por `file://`):

```bash
cd espanhol-sobrevivencia
python -m http.server 8080
# abra http://localhost:8080
```

## Publicar (GitHub Pages)
Suba a pasta para um repositório e ative o Pages na branch `main`. O `manifest.json` e o
`service-worker.js` usam caminhos relativos (`./`), então funciona em `usuario.github.io/repo/`.

## Estrutura
```
index.html            Shell, ARIA, roteador de views, dark/light
styles.css            Tokens em CSS vars, responsivo, estados :focus/.is-loading/.is-error
app.js                Flashcard, Ditado, Lacunas, RolePlay, progresso, toaster, motor
prompts.js            Prompts reutilizáveis (mesmo contrato JSON para qualquer motor)
conteudo.json         6 módulos A0→A1
design-tokens.json    Cores, tipografia, spacing, radius, sombras, z-index (light/dark)
manifest.json         PWA instalável
service-worker.js     Offline-first (precache do shell + stale-while-revalidate)
icons/                Ícones do PWA
```

## Acessibilidade (garantida)
- Navegação por teclado (flashcard: Espaço vira, ← → navega; tudo focável).
- Contraste AA em light e dark (ver `design-tokens.json`).
- `aria-live` para feedback de exercícios; `<label>` em todo campo; `role="progressbar"`.
- `prefers-reduced-motion` respeitado; foco visível (`:focus-visible`).

---

# Bloco 8 — Trocar o "motor" (Opus / Sonnet / Fable) mantendo o contrato JSON

O app funciona **100% offline** com um avaliador local (heurístico) no `RolePlay`. Para usar um
modelo real, mude **uma linha** e forneça um endpoint que injete sua chave. O contrato de
resposta é sempre o mesmo — nenhum outro arquivo muda.

### 1) Escolher o motor
Em `app.js`, objeto `Motor`:

```js
const Motor = {
  engine: 'local',          // 'local' | 'opus' | 'sonnet' | 'fable'
  endpoint: '/api/motor',   // seu proxy (injeta a API key; nunca exponha a chave no front)
  modelos: { opus: 'claude-opus-4-8', sonnet: 'claude-sonnet-5', fable: 'claude-fable-5' },
};
```

- `local` → sem rede, avaliação heurística (bom para publicar no GitHub Pages sem backend).
- `opus` / `sonnet` / `fable` → chama `endpoint` com o `model` correspondente.

### 2) Contrato único (todo motor devolve isto)
**Avaliação de turno** (`Motor.avaliarTurno`):
```json
{ "avaliacao": "1 linha", "reescrita": "frase nativa", "dica": "pronúncia", "proximaFala": "fala do personagem" }
```
**Geração de módulo** (`PROMPTS.gerarModulo`): o JSON de módulo de `conteudo.json`.

### 3) Exemplo de proxy (Node/serverless) — mantém a chave no servidor
```js
// POST /api/motor  { model, system, input }
export default async function handler(req, res) {
  const { model, system, input } = req.body;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model, max_tokens: 500,
      system,
      messages: [{ role: 'user', content: JSON.stringify(input) }]
    })
  });
  const j = await r.json();
  const texto = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  // O prompt pede JSON puro; devolvemos parseado no contrato do app.
  res.status(200).json(JSON.parse(texto));
}
```

### 4) Regra de ouro
Se o motor cair, o app volta sozinho para `local` (o `try/catch` em `avaliarTurno`), então a
lição **nunca trava**. Para escalar dificuldade: `opus` para correção rica, `sonnet` para custo
menor, `fable` quando quiser o modelo mais novo — sempre com o mesmo JSON.
