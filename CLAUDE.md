# Espanhol de Sobrevivência — instruções para o Claude Code

PWA estático (HTML/CSS/JS puro, sem build) de espanhol de viagem A0→A1.
Dono: Jefferson (conta GitHub: jefferstosprojeto).

## Tarefa principal: publicar no GitHub Pages

1. Confirme que o git está autenticado (`gh auth status` ou remoto via SSH/HTTPS já logado).
2. Nesta pasta, execute:
   ```bash
   git init
   git add .
   git commit -m "Espanhol de Sobrevivência — PWA A0→A1 com cores por módulo"
   gh repo create jefferstosprojeto/espanhol-sobrevivencia --public --source=. --push
   ```
   Se o `gh` não estiver instalado, crie o repo manualmente no site e use:
   ```bash
   git remote add origin https://github.com/jefferstosprojeto/espanhol-sobrevivencia.git
   git branch -M main
   git push -u origin main
   ```
3. Ative o GitHub Pages: branch `main`, pasta raiz (`/`).
   Com gh CLI: `gh api repos/jefferstosprojeto/espanhol-sobrevivencia/pages -X POST -f "source[branch]=main" -f "source[path]=/"`
4. Verifique: https://jefferstosprojeto.github.io/espanhol-sobrevivencia/ deve carregar (pode levar 1–2 min).

## Estrutura (não alterar sem pedir)

```
index.html            Shell do app: ARIA, roteador por hash, dark/light
styles.css            Design tokens em CSS vars + cores de sinalização por módulo
app.js                Componentes (Flashcard/Ditado/Lacunas/RolePlay), progresso, toaster
prompts.js            Prompts p/ gerar conteúdo com modelos (contrato JSON único)
conteudo.json         6 módulos (frases, 40 flashcards, ditados, lacunas, role-play)
design-tokens.json    Fonte de verdade do design system (documentação dos tokens)
material-extra.json   +600 flashcards e +120 ditados em lotes (AINDA NÃO plugado no app)
manifest.json         PWA instalável
service-worker.js     Offline-first (precache + stale-while-revalidate)
icons/                Ícones 192/512/maskable
silabas-tonicas.md    Apoio de pronúncia (não referenciado pelo app)
scripts/              Geradores Python usados na produção (não publicados no app)
index-artifact.html   Versão single-file para uso no chat do Claude (não precisa publicar)
```

## Regras do projeto

- Sem framework e sem build: editar os arquivos diretamente.
- Ao alterar qualquer arquivo do shell, subir a versão do cache em `service-worker.js` (const VERSAO).
- `conteudo.json` segue contrato estrito — validar com:
  `python3 -c "import json; json.load(open('conteudo.json'))"`
  e manter: 6 módulos, 2 variações por frase-chave, flashcards sem duplicatas.
- Contraste AA obrigatório para qualquer cor nova (texto ≥ 4.5:1 sobre a superfície).
- O marca-texto açafrão da frase-chave é o elemento-assinatura: não trocar.

## Tarefas futuras já combinadas (fazer só se o Jefferson pedir)

- Fundir `material-extra.json` no app (loader em runtime ou merge para um conteudo v2).
- Plugar motor real no simulador (ver README.md, Bloco 8 — proxy com ANTHROPIC_API_KEY).
- Módulo 7 (Farmácia/Saúde) usando `PROMPTS.gerarModulo` de prompts.js.
