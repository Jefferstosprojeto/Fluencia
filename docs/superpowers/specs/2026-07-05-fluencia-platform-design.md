# Fluência — Design da Plataforma Multi-língua

**Data:** 2026-07-05
**Status:** Aprovado para implementação
**Autor:** Jefferson Santos + Claude

---

## Visão

Plataforma PWA estática de aprendizagem de línguas por sobrevivência — do zero ao funcional em situações reais (viagem, negócios). Começa com Espanhol, expande para Inglês, Alemão e Francês. Monetização via Google AdSense. Sem login obrigatório.

**Tagline:** *"Sobrevive em qualquer língua"*

---

## Decisões de arquitetura

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Hosting | GitHub Pages (estático) | Zero custo, deploy automático |
| Backend | Supabase (projeto separado) | Só para proxy da Anthropic API |
| Auth | Sem login | Máximo alcance, máximo tráfego para ads |
| AI | Híbrido: proxy Supabase (padrão) + chave do utilizador (fallback) | Sem barreira de entrada |
| Conteúdo | JSON por língua/track | Simples agora, migra para DB quando crescer |
| Monetização | Google AdSense | Aprovado para sites estáticos, niche educação |

---

## Estrutura de ficheiros

```
Fluencia/
├── index.html                  ← Homepage: seletor de língua + track
├── app.html                    ← Shell do app (atual index.html)
├── app.js                      ← Motor, componentes, roteador
├── styles.css                  ← Design system (tokens CSS)
├── prompts.js                  ← Prompts Anthropic
├── service-worker.js           ← Offline-first (precache)
├── manifest.json               ← PWA
├── privacy.html                ← Política de privacidade (AdSense)
│
├── content/
│   ├── es/
│   │   ├── viagem.json         ← 6 módulos A0→A1 (existente)
│   │   └── negocios.json       ← 7 módulos (novo)
│   ├── en/                     ← Fase 2
│   ├── de/                     ← Fase 3
│   └── fr/                     ← Fase 3
│
├── icons/                      ← PWA icons
└── supabase/
    └── functions/
        └── ai-proxy/
            └── index.ts        ← Edge Function proxy Anthropic
```

---

## Homepage (`index.html`)

Landing page que substitui a welcome screen atual.

**Componentes:**
- Hero: logo Fluência + tagline
- Seletor de língua (cards): 🇪🇸 Espanhol · 🇬🇧 Inglês *(em breve)* · 🇩🇪 Alemão *(em breve)* · 🇫🇷 Francês *(em breve)*
- Seletor de track (tabs): Viagem | Negócios
- CTA: "Começar agora →" → `app.html?lang=es&track=viagem`
- Banner AdSense 728×90 (rodapé desktop) / 320×50 (mobile)
- Link para `privacy.html`

**Routing do app:**
```
app.html?lang=es&track=viagem    → carrega content/es/viagem.json
app.html?lang=es&track=negocios  → carrega content/es/negocios.json
```

---

## Módulos — Espanhol para Negócios

7 módulos de sobrevivência corporativa, mesmo contrato JSON que viagem.json.

| # | ID | Módulo | Cenário role-play |
|---|-----|--------|-------------------|
| 1 | `presentaciones` | Apresentações Profissionais | Feira de negócios — apresentar-se e a empresa |
| 2 | `reuniones` | Reuniões e Conferências | Reunião de equipa — concordar, discordar, agendar |
| 3 | `negociacion` | Negociação e Propostas | Fechar um contrato — preço, condições, fecho |
| 4 | `comunicacion-escrita` | Comunicação Escrita | Ditar email formal e mensagem WhatsApp profissional |
| 5 | `telefono` | Telefone e Videochamada | Atender chamada, transferir, deixar recado |
| 6 | `almuerzo` | Almoço de Negócios | Hospitalidade, brindes, pagar conta, restrições alimentares |
| 7 | `viaje-corporativo` | Viagem Corporativa | Check-in hotel, táxi, aeroporto, nota de despesa |

**Diferenças face ao módulo Viagem:**
- Role-play com tensão negocial real (não só cortesias)
- Vocabulário formal/neutro (serve Espanha + América Latina)
- Padrões gramaticais: condicional de cortesia (`quisiera`, `podría`), subjuntivo básico (`espero que`)

---

## Supabase AI Proxy

**Edge Function:** `POST /functions/v1/ai-proxy`

```typescript
// Input
{ falaAluno: string, roteiroPasso: string, cenario: string, lang: string }

// Output (contrato existente do Motor)
{ avaliacao: string, reescrita: string, dica: string, proximaFala: string }
```

**Rate limiting:** 30 requests/IP/hora via cabeçalho `x-forwarded-for`
**Modelo:** `claude-sonnet-5` (custo/performance ideal)
**Prioridade no Motor:**
1. Supabase proxy (URL configurada em `Motor.endpoint`) — padrão para todos
2. Chave do utilizador em localStorage — fallback se proxy falhar
3. `avaliarLocal()` — fallback final, nunca quebra a lição

**Variável de ambiente no Supabase:** `ANTHROPIC_API_KEY`

---

## Monetização — Google AdSense

**Pré-requisitos:**
1. Política de privacidade em `privacy.html`
2. Domínio próprio (recomendado antes da candidatura)
3. Conteúdo suficiente (já satisfeito com 6+ módulos)

**Posicionamento dos anúncios:**
| Placement | Formato | Onde |
|-----------|---------|------|
| Homepage topo | 728×90 (leaderboard) | Acima do hero (desktop) |
| Homepage rodapé | 320×50 (mobile banner) | Após CTA |
| App — entre módulos | 300×250 (retângulo) | Só na transição de módulo, nunca durante exercício |
| App — sidebar | 160×600 (skyscraper) | Desktop, coluna direita |

**Regra de ouro:** nunca interromper um exercício ativo.

---

## Roadmap

```
Fase 1 — Agora (Julho 2026)
  ✓ PWA ES Viagem (existente)
  → Homepage multi-track
  → ES Negócios (7 módulos)
  → Supabase AI proxy
  → privacy.html
  → Candidatura AdSense

Fase 2 — Agosto/Setembro 2026
  → Domínio próprio + DNS
  → Google Analytics / Plausible
  → OG tags + sitemap.xml
  → EN Viagem (6 módulos)

Fase 3 — Out/Nov 2026
  → EN Negócios
  → DE Viagem
  → FR Viagem

Fase 4 — 2027
  → Módulos sectoriais (tech, saúde, logística)
  → Freemium opcional (módulos avançados)
```

---

## Critérios de sucesso da Fase 1

- [ ] Homepage carrega em < 2s em mobile 3G
- [ ] Transição Viagem ↔ Negócios sem reload de página
- [ ] Supabase proxy responde em < 3s (p95)
- [ ] AdSense aprovado dentro de 30 dias do lançamento
- [ ] Todos os 7 módulos de Negócios passam validação JSON
- [ ] PWA instalável (manifest + service worker v5+)
