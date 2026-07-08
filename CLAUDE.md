# Fluência — instruções para o Claude Code

PWA estático (HTML/CSS/JS puro, sem build) de aprendizagem de línguas por sobrevivência.
Dono: Jefferson Santos (GitHub: jefferstosprojeto). Repo: Jefferstosprojeto/fluencia.
GitHub Pages: https://jefferstosprojeto.github.io/fluencia/

## Estrutura actual

```
index.html          Homepage: seletor de língua + track → app.html?lang=&track=
app.html            Shell do app: abas, progresso, roteador hash
app.js              Motor (3 níveis: Supabase proxy > chave user > local), componentes, roteador
styles.css          Design system (tokens CSS, dark-only, paleta glassmorphism índigo/âmbar)
prompts.js          Prompts para gerar/avaliar conteúdo com Claude
service-worker.js   Offline-first (precache + stale-while-revalidate) — ver VERSAO
manifest.json       PWA instalável (start_url: ./index.html)
privacy.html        Política de privacidade (obrigatório para AdSense)

content/
  es/viagem.json    6 módulos A0→A1 espanhol viagem
  es/negocios.json  7 módulos B1 espanhol negócios

supabase/
  functions/ai-proxy/index.ts   Edge Function proxy Anthropic (rate limit 30 req/IP/hora)
```

## Regras

- Sem framework, sem build: editar ficheiros directamente.
- Ao alterar qualquer ficheiro do shell: incrementar VERSAO em service-worker.js.
- JSON de conteúdo: validar com python3 -c "import json; json.load(open('content/es/viagem.json'))"
- Contraste AA obrigatório (≥ 4.5:1).
- Marca-texto âmbar (--marker: #F4B430) é o elemento-assinatura: não trocar.

## Motor — prioridade de avaliação

1. Supabase proxy (Motor.proxyUrl) — padrão, cobre todos os utilizadores
2. Chave Anthropic do utilizador (localStorage 'es:api-key') — fallback
3. avaliarLocal() — fallback final, nunca quebra

## Roadmap (fazer só se Jefferson pedir)

Fase 2: domínio próprio, Google Analytics, OG tags, sitemap, EN Viagem
Fase 3: EN Negócios, DE Viagem, FR Viagem
Fase 4: módulos sectoriais, freemium
