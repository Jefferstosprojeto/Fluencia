# Tema Glassmorphism (dark-only) — Fluência

## Contexto

O `styles.css` (fonte real do visual actual — é o que `index.html`/`app.html`/`privacy.html`
carregam) implementa hoje a paleta "Bandeira Espanha": vermelho `#C60B1E` (`--brand`) + dourado
`#FFC400` (`--marker`), com suporte dark/light via `[data-tema="dark"]`.

`design-tokens.json` descreve um sistema diferente ("Señal", cobalto `#1B54B8` + açafrão `#F2A413`)
que **não está ligado a nenhum ficheiro** (nenhum `.html`/`.js` faz `fetch`/`import` dele) — é
documentação desactualizada, não a fonte de verdade. Este plano actualiza os dois para a mesma
paleta glass, eliminando a divergência.

Este documento especifica um redesenho visual completo (incluindo cores) para um tema **glassmorphism
dark-only**, substituindo directamente o tema actual (não é um tema experimental à parte).

## Motivação

Testar uma direcção visual mais moderna ("glass"/tech), usando o 21st.dev como referência de
componentes glass reais (frosted surface, blur, glow, orbs de gradiente) e mantendo as regras
estruturais do projecto (`CLAUDE.md`): sem framework, sem build, contraste AA obrigatório.

## Decisões

- **Substituição directa** dos ficheiros existentes — não é uma variante alternável.
- **Só dark mode** — remove-se o toggle claro/escuro (`#btn-tema`) e a lógica associada em `app.js`.
- **21st.dev usado só como referência visual** — nenhum componente React/Tailwind é importado
  directamente; tudo é traduzido à mão para CSS/HTML/JS vanilla, preservando a regra "sem build".
- **Tipografia mantida** (Bricolage Grotesque / Inter / Space Mono) — já serve bem a um visual
  moderno; o redesenho é sobre cor e superfície, não sobre tipo.
- **Estrutura HTML/JS existente preservada** — nenhuma classe usada pelo `app.js` (roteador de
  abas, flashcards, accordions) é renomeada ou removida. Adições são puramente aditivas
  (elementos decorativos `aria-hidden`).

## Sistema visual

### Paleta
- Fundo: gradiente escuro `#0A0E1A → #12172A`.
- Orbs decorativos: 2–3 blobs de gradiente desfocados (violeta, ciano, âmbar), `position: fixed`,
  `aria-hidden="true"`, `pointer-events: none`, atrás do conteúdo — dão a profundidade
  característica do glassmorphism (confirmado por referências no catálogo do 21st.dev: "Glass
  Shine Card", "Glass Card" — frosted surface + blur + glow).
- Superfícies (cards, topbar, accordions, flashcards, chips): `rgba(255,255,255,.07)` +
  `backdrop-filter: blur(20px)` + borda `rgba(255,255,255,.12)` + destaque interior subtil no topo
  (`inset 0 1px 0 rgba(255,255,255,.15)`).
- Marca/interactivo: índigo-violeta vibrante `#7C6FFF` (substitui cobalto).
- Marcador (substitui açafrão): âmbar quente `#FFB020` em glow — mantém a função de "elemento de
  destaque único" do sistema anterior, mas na nova paleta.
- Acentos por módulo (saudações/direcções/restaurante/hotel/compras/emergências): 6 cores em glow
  recodificadas para a paleta glass (deixam de ser inspiradas em sinalização de estrada).
- Texto: quase-branco `#F1F2F8` sobre a base composta.

### Acessibilidade
- Contraste AA (≥4.5:1 texto normal, ≥3:1 texto grande/UI) mantido como regra obrigatória
  (`CLAUDE.md`), verificado nos novos pares texto/superfície antes de finalizar.
- A opacidade das superfícies (`.07`–`.10` branco) é calibrada para que o texto assente sempre
  sobre uma base efectivamente escura, independentemente da cor do orb por trás — evita que o glow
  reduza o contraste.
- `prefers-reduced-motion` continua respeitado (qualquer animação nos orbs/glow é desactivada).

## Ficheiros afectados

| Ficheiro | Alteração |
|---|---|
| `design-tokens.json` | Nova paleta (cores), schema/estrutura inalterados |
| `styles.css` | Novas variáveis `:root`; nova classe `.glass-orb`; `backdrop-filter` e translucidez nos componentes existentes (`.surface`, `.acc`, `.flash__card`, `.topbar`, `.chip`, `.btn`, etc.) |
| `index.html` | + 2–3 `<div class="glass-orb">` decorativos no início do `<body>` |
| `app.html` | + orbs decorativos; remoção do botão `#btn-tema` |
| `privacy.html` | + orbs decorativos |
| `app.js` | Remoção/simplificação de `aplicarTema` e do listener de `#btn-tema` (~linhas 635-642); força `data-tema="dark"` |
| `service-worker.js` | Incrementar `VERSAO` (regra do CLAUDE.md ao alterar ficheiros do shell) |

## Fora de âmbito

- Conteúdo (`content/*.json`, `conteudo.json`, `material-extra.json`).
- Lógica de exercícios e motor de avaliação (`Motor`, `avaliarTurno`, `avaliarLocal`).
- Estrutura de rotas/abas do `app.js` (roteador hash).
- `supabase/functions/ai-proxy`.

## Verificação

1. `python3 -c "import json; json.load(open('design-tokens.json'))"` — validar JSON.
2. Servir localmente: `python -m http.server 8080`.
3. Percorrer manualmente: `index.html` (landing + selecção de língua/track) → `app.html` (abas,
   flashcard, ditado, lacunas, role-play, accordions, barra de progresso) → `privacy.html`.
4. Confirmar que a remoção do toggle não quebra o `localStorage` (`es:tema`) nem o roteador hash.
5. Checar contraste AA dos novos pares texto/superfície (ferramenta de contraste, ex. WebAIM).
6. Confirmar PWA continua a instalar/funcionar offline após bump de `VERSAO`.
