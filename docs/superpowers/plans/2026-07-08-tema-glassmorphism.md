# Tema Glassmorphism (dark-only) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Fluência's current "Bandeira Espanha" (red/gold) light+dark theme with a single dark-only glassmorphism theme (deep gradient background, blurred glass surfaces, indigo-violet + amber palette), across `index.html`, `app.html`, and `privacy.html`, without changing any content, exercise logic, or routing.

**Architecture:** Token-level CSS custom property swap (`styles.css`, `design-tokens.json`) plus purely decorative `.glass-orb` elements for depth, applied consistently across the three static HTML entry points. `app.js`'s theme-toggle code is removed since the app becomes dark-only (no more `[data-tema]` branching anywhere). No build step, no new dependencies, no HTML structure changes to anything `app.js` queries (tabs, forms, dialog, templates).

**Tech Stack:** Plain HTML/CSS/JS (no framework, no build — per `Fluencia/CLAUDE.md`). Validation via Python (`json`) and Node (already on PATH) as ad-hoc checks; there is no test runner in this project, so "tests" below are static validation + a manual browser walkthrough, matching this project's existing verification practice (see `Fluencia/README.md`).

## Global Constraints

- No framework, no build — edit files directly (`Fluencia/CLAUDE.md`).
- Contrast AA required: ≥4.5:1 normal text, ≥3:1 large text/UI (`Fluencia/CLAUDE.md`).
- When any shell file changes (`index.html`, `app.html`, `styles.css`, `app.js`, `service-worker.js`), bump `VERSAO` in `service-worker.js` (`Fluencia/CLAUDE.md`).
- Any content JSON change must validate with `python3 -c "import json; json.load(open('<file>'))"` (`Fluencia/CLAUDE.md`) — applies here to `design-tokens.json`.
- 21st.dev components are reference-only inspiration (frosted surface + blur + border highlight + glow) — no React/Tailwind code is imported; everything is hand-translated to vanilla CSS (per approved spec).
- Dark-only: no `prefers-color-scheme`/`[data-tema]` branching remains anywhere after this plan.
- `prefers-reduced-motion: reduce` must still be respected (already handled in `styles.css`; nothing in this plan adds new motion that needs gating — orbs are static).

---

### Task 1: Rewrite `design-tokens.json` with the glass palette

**Files:**
- Modify: `Fluencia/design-tokens.json` (full replacement of the `meta` and `color` sections; `typography`, `spacing`, `radius`, `z`, `motion` sections keep their existing values except `shadow`, which changes)

**Interfaces:**
- Consumes: nothing (this file is not `fetch`/`import`ed by any `.html`/`.js` in the project — confirmed via `grep -rn "design-tokens" *.html *.js` returning no matches). It is documentation of the palette that `styles.css` hand-codes.
- Produces: the canonical hex/rgba values that Task 2 (`styles.css`) must match exactly, so the two files stay in sync.

- [ ] **Step 1: Replace the file content**

Replace the entire contents of `Fluencia/design-tokens.json` with:

```json
{
  "$schema": "https://espanhol-sobrevivencia/tokens.schema.json",
  "meta": {
    "nombre": "Vidro — Sistema de diseño Fluência (glassmorphism dark-only)",
    "version": "2.0.0",
    "concepto": "Superficies de vidrio esmerilado (blur + translucidez) sobre fondo profundo con orbes de gradiente. Índigo-violeta = interactivo, ámbar = marcador de atención. Solo modo oscuro.",
    "contraste": "Todos los pares texto/fondo cumplen WCAG AA (>=4.5:1 texto normal, >=3:1 texto grande e UI). Índigo #6C5CE7 + texto blanco = 4.86:1. Texto muted #A7ADC4 sobre bg-1 #0A0E1A = 8.6:1. El ámbar #F4B430 nunca se usa como fondo sólido con texto claro encima (falla AA); solo como fondo translúcido, borde, ícono, o relleno de gradiente decorativo sin texto."
  },

  "color": {
    "brand": {
      "indigo":       { "value": "#6C5CE7", "uso": "Color de marca e acciones primarias (botones, tabs activos, foco). AA con texto blanco (4.86:1)." },
      "indigo-hover": { "value": "#8477EE", "uso": "Hover/active de botones e enlaces primarios." },
      "indigo-suave": { "value": "rgba(108,92,231,.16)", "uso": "Fondo tenue de chips, selección, mensajes del usuario." },
      "ambar":        { "value": "#F4B430", "uso": "Marcador/highlight — elemento-assinatura. Solo como fondo translúcido, borde o ícono, nunca como texto ni como fondo sólido con texto claro encima." },
      "ambar-suave":  { "value": "rgba(244,180,48,.16)", "uso": "Swipe de marca-texto detrás de la frase-clave." }
    },

    "accent_por_modulo": {
      "_conceito": "Cor de acento por módulo, em glow sobre vidro escuro. Aplicada em só 3 pontos (rótulo do módulo, barra de progresso, ícone do acordeão) — o resto do app permanece em 'indigo' para manter o cromo da interface consistente. O marca-texto âmbar da frase-clave NÃO muda: é o elemento-assinatura único do site.",
      "saudacoes":   { "value": "#F4B430", "inspiracao": "Âmbar — sol/boas-vindas, mesma família do marcador." },
      "direcoes":    { "value": "#4FC1CE", "inspiracao": "Ciano — direção/movimento." },
      "restaurante": { "value": "#E8794B", "inspiracao": "Coral — comida quente." },
      "hotel":       { "value": "#A79BD9", "inspiracao": "Violeta claro — descanso, próximo da marca." },
      "compras":     { "value": "#E85D8A", "inspiracao": "Magenta — etiqueta de saldo/promoção." },
      "emergencias": { "value": "#FF6B5E", "inspiracao": "Vermelho — alerta universal." }
    },

    "dark": {
      "bg-1":       { "value": "#0A0E1A", "uso": "Fundo de página (topo do gradiente radial)." },
      "bg-2":       { "value": "#12172A", "uso": "Fundo de página (base do gradiente radial)." },
      "surface":    { "value": "rgba(24,30,50,.55)", "uso": "Vidro: cartões, painéis, acordeões, flashcards, diálogo (com backdrop-filter blur)." },
      "surface-2":  { "value": "rgba(24,30,50,.35)", "uso": "Vidro secundário: chips, campos, selects." },
      "text":       { "value": "#F1F2F8", "uso": "Texto principal (>14:1 sobre bg-1)." },
      "text-muted": { "value": "#A7ADC4", "uso": "Texto secundário, ajudas (8.6:1 sobre bg-1)." },
      "border":     { "value": "rgba(255,255,255,.14)", "uso": "Bordas, divisores em vidro." },
      "focus-ring": { "value": "#8477EE", "uso": "Anel de foco visível :focus-visible." },
      "success":    { "value": "#4ADE80", "uso": "Resposta correta." },
      "success-bg": { "value": "rgba(74,222,128,.14)", "uso": "Fundo de feedback correto." },
      "error":      { "value": "#FF6B6B", "uso": "Resposta incorreta." },
      "error-bg":   { "value": "rgba(255,107,107,.14)", "uso": "Fundo de feedback incorreto." },
      "info":       { "value": "#8477EE", "uso": "Toaster de revisão, avisos." },
      "blur":       { "value": "blur(20px) saturate(1.3)", "uso": "backdrop-filter padrão das superfícies de vidro." }
    }
  },

  "typography": {
    "family": {
      "display": { "value": "\"Bricolage Grotesque\", \"Space Grotesk\", system-ui, sans-serif", "uso": "Títulos, número de módulo, la frase-clave en español." },
      "body":    { "value": "\"Inter\", system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif", "uso": "Cuerpo, botones, traducciones, UI." },
      "mono":    { "value": "\"Space Mono\", \"JetBrains Mono\", ui-monospace, monospace", "uso": "Pronunciación aproximada (anotación de caderno)." }
    },
    "size": {
      "xs":   { "value": "0.75rem",  "uso": "Captions, etiquetas de progreso." },
      "sm":   { "value": "0.875rem", "uso": "Texto secundario, ayudas." },
      "base": { "value": "1rem",     "uso": "Cuerpo por defecto." },
      "md":   { "value": "1.125rem", "uso": "Traducción PT de la frase-clave." },
      "lg":   { "value": "1.375rem", "uso": "Subtítulos de sección." },
      "xl":   { "value": "1.75rem",  "uso": "Frase-clave en español (flashcard)." },
      "2xl":  { "value": "2.25rem",  "uso": "Título de módulo." },
      "3xl":  { "value": "clamp(2.5rem, 6vw, 3.5rem)", "uso": "Hero." }
    },
    "weight": {
      "regular":  { "value": "400" },
      "medium":   { "value": "500" },
      "semibold": { "value": "600" },
      "bold":     { "value": "700" }
    },
    "leading": {
      "tight":  { "value": "1.15", "uso": "Títulos display." },
      "normal": { "value": "1.5",  "uso": "Cuerpo." },
      "loose":  { "value": "1.7",  "uso": "Texto largo de lección." }
    },
    "tracking": {
      "eyebrow": { "value": "0.08em", "uso": "Etiquetas en mayúsculas (MÓDULO 03)." }
    }
  },

  "spacing": {
    "_base": "4px. Escala: multiplos de 4 para ritmo vertical consistente.",
    "0":  { "value": "0" },
    "1":  { "value": "0.25rem" },
    "2":  { "value": "0.5rem" },
    "3":  { "value": "0.75rem" },
    "4":  { "value": "1rem" },
    "5":  { "value": "1.25rem" },
    "6":  { "value": "1.5rem" },
    "8":  { "value": "2rem" },
    "10": { "value": "2.5rem" },
    "12": { "value": "3rem" },
    "16": { "value": "4rem" }
  },

  "radius": {
    "sm":   { "value": "6px",   "uso": "Chips, inputs pequeños." },
    "md":   { "value": "10px",  "uso": "Botones, campos." },
    "lg":   { "value": "16px",  "uso": "Tarjetas, acordeones, flashcard." },
    "pill": { "value": "999px", "uso": "Tabs, badges, barra de progreso." }
  },

  "shadow": {
    "sm": { "value": "0 1px 4px rgba(0,0,0,.35)", "uso": "Elevación mínima (chips)." },
    "md": { "value": "0 8px 24px rgba(0,0,0,.45)", "uso": "Tarjetas, flashcard." },
    "lg": { "value": "0 16px 48px rgba(0,0,0,.55)", "uso": "Toaster, modal, popover." }
  },

  "z": {
    "base":     { "value": "0" },
    "dropdown": { "value": "100" },
    "sticky":   { "value": "200", "uso": "Barra de navegación superior." },
    "toast":    { "value": "900", "uso": "Toaster de revisión." },
    "modal":    { "value": "1000" }
  },

  "motion": {
    "fast":   { "value": "120ms", "uso": "Hover, foco." },
    "base":   { "value": "220ms", "uso": "Flip de flashcard, tabs." },
    "easing": { "value": "cubic-bezier(0.22, 1, 0.36, 1)", "uso": "Salida suave estándar." },
    "_nota": "Todo bajo @media (prefers-reduced-motion: reduce) se reduce a 1ms."
  }
}
```

- [ ] **Step 2: Validate JSON**

Run: `python3 -c "import json; json.load(open('Fluencia/design-tokens.json'))"`
Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
cd Fluencia
git add design-tokens.json
git commit -m "Update design-tokens.json to glassmorphism dark-only palette"
```

---

### Task 2: Rewrite `styles.css` with glass tokens, surfaces, and orbs

**Files:**
- Modify: `Fluencia/styles.css` (full file replacement)

**Interfaces:**
- Consumes: hex/rgba values from Task 1 (`design-tokens.json`) — must match exactly.
- Produces: CSS custom properties (`--bg-1`, `--bg-2`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-muted`, `--brand`, `--brand-hover`, `--brand-soft`, `--marker`, `--marker-soft`, `--success`, `--success-bg`, `--error`, `--error-bg`, `--focus`, `--blur`, `--accent-*`, `--accent`, `--accent-soft`) and the `.glass-orb`/`.glass-orb--1/2/3` classes that Task 3 and Task 4 rely on when adding orb markup to `index.html` and `app.html`. All existing class names used by `app.js` (`.tab`, `.acc`, `.flash__card`, `.is-flipped`, `.is-loading`, `.is-error`, `.is-correct`, `.msg--*`, etc.) are preserved unchanged — only their declarations' color/backdrop values change, so `app.js` requires no selector changes.
- Removes: every `[data-tema="dark"]` selector (folded into the base rule, since dark is now the only theme) and every `[data-tema="dark"]` attribute dependency.

- [ ] **Step 1: Replace the file content**

Replace the entire contents of `Fluencia/styles.css` with:

```css
/* =========================================================================
   Fluência · styles.css
   Tema Glassmorphism dark-only: índigo-violeta (#6C5CE7) + âmbar (#F4B430)
   sobre fundo profundo com orbs de gradiente desfocados.
   Tokens -> CSS custom properties.
   ========================================================================= */

:root {
  /* Cor — glass dark (única) */
  --bg-1: #0A0E1A;
  --bg-2: #12172A;
  --surface: rgba(24, 30, 50, .55);
  --surface-2: rgba(24, 30, 50, .35);
  --text: #F1F2F8;
  --text-muted: #A7ADC4;
  --border: rgba(255, 255, 255, .14);
  --brand: #6C5CE7;
  --brand-hover: #8477EE;
  --brand-soft: rgba(108, 92, 231, .16);
  --marker: #F4B430;
  --marker-soft: rgba(244, 180, 48, .16);
  --success: #4ADE80;
  --success-bg: rgba(74, 222, 128, .14);
  --error: #FF6B6B;
  --error-bg: rgba(255, 107, 107, .14);
  --focus: #8477EE;
  --blur: blur(20px) saturate(1.3);

  /* Cores de acento por módulo — glow sobre vidro escuro */
  --accent-saudacoes:   #F4B430; --accent-saudacoes-soft:   rgba(244,180,48,.16);
  --accent-direcoes:    #4FC1CE; --accent-direcoes-soft:    rgba(79,193,206,.16);
  --accent-restaurante: #E8794B; --accent-restaurante-soft: rgba(232,121,75,.16);
  --accent-hotel:       #A79BD9; --accent-hotel-soft:       rgba(167,155,217,.16);
  --accent-compras:     #E85D8A; --accent-compras-soft:     rgba(232,93,138,.16);
  --accent-emergencias: #FF6B5E; --accent-emergencias-soft: rgba(255,107,94,.16);
  --accent: var(--brand); --accent-soft: var(--brand-soft);

  /* Tipografia */
  --font-display: "Bricolage Grotesque", "Space Grotesk", system-ui, sans-serif;
  --font-body: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: "Space Mono", "JetBrains Mono", ui-monospace, monospace;
  --fs-xs: .75rem; --fs-sm: .875rem; --fs-base: 1rem; --fs-md: 1.125rem;
  --fs-lg: 1.375rem; --fs-xl: 1.75rem; --fs-2xl: 2.25rem;
  --lh-tight: 1.15; --lh-normal: 1.5; --lh-loose: 1.7;

  /* Espaçamento (base 4) */
  --s1: .25rem; --s2: .5rem; --s3: .75rem; --s4: 1rem; --s5: 1.25rem;
  --s6: 1.5rem; --s8: 2rem; --s10: 2.5rem; --s12: 3rem; --s16: 4rem;

  /* Raio, sombra, z, movimento */
  --r-sm: 6px; --r-md: 10px; --r-lg: 16px; --r-pill: 999px;
  --sh-sm: 0 1px 4px rgba(0,0,0,.35);
  --sh-md: 0 8px 24px rgba(0,0,0,.45);
  --sh-lg: 0 16px 48px rgba(0,0,0,.55);
  --z-sticky: 200; --z-toast: 900; --z-modal: 1000;
  --t-fast: 120ms; --t-base: 220ms; --ease: cubic-bezier(.22,1,.36,1);

  --wrap: 46rem;
}

[data-modulo="saudacoes"]   { --accent: var(--accent-saudacoes);   --accent-soft: var(--accent-saudacoes-soft); }
[data-modulo="direcoes"]    { --accent: var(--accent-direcoes);    --accent-soft: var(--accent-direcoes-soft); }
[data-modulo="restaurante"] { --accent: var(--accent-restaurante); --accent-soft: var(--accent-restaurante-soft); }
[data-modulo="hotel"]       { --accent: var(--accent-hotel);       --accent-soft: var(--accent-hotel-soft); }
[data-modulo="compras"]     { --accent: var(--accent-compras);     --accent-soft: var(--accent-compras-soft); }
[data-modulo="emergencias"] { --accent: var(--accent-emergencias); --accent-soft: var(--accent-emergencias-soft); }

/* ---------- glass orbs (decorativos, aria-hidden no HTML) ---------- */
.glass-orb {
  position: fixed; border-radius: 50%; filter: blur(90px);
  pointer-events: none; z-index: -1;
}
.glass-orb--1 { width: 26rem; height: 26rem; top: -8rem; left: -6rem; background: var(--brand); opacity: .30; }
.glass-orb--2 { width: 22rem; height: 22rem; bottom: -6rem; right: -4rem; background: var(--accent-direcoes); opacity: .22; }
.glass-orb--3 { width: 18rem; height: 18rem; top: 40%; right: 15%; background: var(--marker); opacity: .16; }

/* ---------- base ---------- */
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  background: radial-gradient(ellipse 120% 80% at 50% -10%, var(--bg-2), var(--bg-1));
  color: var(--text);
  font-family: var(--font-body);
  font-size: var(--fs-base);
  line-height: var(--lh-normal);
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}
h1, h2, h3 { font-family: var(--font-display); line-height: var(--lh-tight); margin: 0; }
a { color: var(--brand); }
:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 2px;
  border-radius: var(--r-sm);
}
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
.skip-link {
  position: absolute; left: var(--s3); top: -3rem; z-index: var(--z-modal);
  background: var(--brand); color: #fff; padding: var(--s2) var(--s4);
  border-radius: var(--r-md); text-decoration: none; transition: top var(--t-fast);
}
.skip-link:focus { top: var(--s3); }

/* ---------- siteheader + topbar ---------- */
.siteheader {
  position: sticky; top: 0; z-index: var(--z-sticky);
}
.topbar {
  background: var(--surface);
  backdrop-filter: var(--blur);
  border-bottom: 1px solid var(--border);
}
/* Linha de destaque no topo, em gradiente de marca */
.topbar::before {
  content: '';
  display: block;
  height: 3px;
  background: linear-gradient(90deg, var(--brand), var(--marker));
  opacity: .8;
}
.topbar__inner {
  max-width: var(--wrap); margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between; gap: var(--s4);
  padding: var(--s3) var(--s4);
}
.brand { display: flex; align-items: center; gap: var(--s3); text-decoration: none; color: var(--text); }
.brand__mark {
  font-family: var(--font-display); font-weight: 700; font-size: var(--fs-sm);
  color: #fff; background: var(--brand);
  padding: var(--s2) var(--s3); border-radius: var(--r-md); letter-spacing: .02em;
  box-shadow: 0 2px 10px rgba(108,92,231,.45);
}
.brand__text b { display: block; font-family: var(--font-display); font-size: var(--fs-base); }
.brand__text small { color: var(--text-muted); font-size: var(--fs-xs); }
.topbar__tools { display: flex; align-items: center; gap: var(--s2); }

.select {
  font: inherit; color: var(--text); background: var(--surface-2);
  border: 1px solid var(--border); border-radius: var(--r-md);
  padding: var(--s2) var(--s3); max-width: 12rem;
  backdrop-filter: var(--blur);
}
.icon-btn {
  display: grid; place-items: center; width: 2.5rem; height: 2.5rem;
  background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--r-md); color: var(--text); cursor: pointer;
  backdrop-filter: var(--blur);
  transition: background var(--t-fast);
}
.icon-btn:hover { background: var(--surface); }
.icon-btn__glyph { font-size: 1.1rem; }

/* ---------- progresso ---------- */
.progress { max-width: var(--wrap); margin: 0 auto; padding: 0 var(--s4) var(--s2); }
.progress__meta { display: flex; justify-content: space-between; font-size: var(--fs-xs); color: var(--text-muted); margin-bottom: var(--s1); }
.progress__track { height: 8px; background: var(--surface-2); border-radius: var(--r-pill); overflow: hidden; border: 1px solid var(--border); }
.progress__fill { height: 100%; width: 0%; background: linear-gradient(90deg, var(--brand), var(--marker)); border-radius: var(--r-pill); transition: width var(--t-base) var(--ease); }

/* ---------- abas ---------- */
.tabs {
  max-width: var(--wrap); margin: 0 auto; display: flex; gap: var(--s1);
  padding: var(--s2) var(--s4) var(--s3); overflow-x: auto;
}
.tab {
  flex: 1 0 auto; text-align: center; text-decoration: none; white-space: nowrap;
  color: var(--text-muted); font-weight: 500; font-size: var(--fs-sm);
  padding: var(--s2) var(--s4); border-radius: var(--r-pill);
  border: 1px solid transparent; transition: background var(--t-fast), color var(--t-fast);
}
.tab:hover { background: var(--surface-2); color: var(--text); }
.tab[aria-selected="true"] { background: var(--brand); color: #fff; box-shadow: 0 2px 10px rgba(108,92,231,.35); }

/* ---------- página ---------- */
.page { max-width: var(--wrap); margin: 0 auto; padding: var(--s6) var(--s4) var(--s16); }
.view:focus { outline: none; }
.view-head {
  margin-bottom: var(--s6);
  padding: var(--s5) var(--s5) var(--s5) var(--s6);
  border-left: 4px solid var(--accent);
  background: var(--accent-soft);
  border-radius: 0 var(--r-lg) var(--r-lg) 0;
  backdrop-filter: var(--blur);
  transition: border-color var(--t-base) var(--ease), background var(--t-base) var(--ease);
}
.eyebrow {
  font-size: var(--fs-xs); letter-spacing: .08em; text-transform: uppercase;
  color: var(--accent); font-weight: 700;
  transition: color var(--t-base) var(--ease);
}
.view-head h1 { font-size: var(--fs-2xl); margin-top: var(--s1); }
.view-head p { color: var(--text-muted); margin: var(--s2) 0 0; }

/* ---------- section headers in views ---------- */
.sec-title {
  font-family: var(--font-display); font-size: var(--fs-lg);
  margin-bottom: var(--s3); display: flex; align-items: center; gap: var(--s2);
}
.sec-title::before {
  content: ''; display: inline-block; width: 4px; height: 1.1em;
  background: var(--accent); border-radius: var(--r-pill);
  transition: background var(--t-base) var(--ease);
}

/* ---------- frase-clave (elemento-assinatura) ---------- */
.frase {
  background: var(--surface); border: 1px solid var(--border);
  border-left: 4px solid var(--accent);
  border-radius: var(--r-lg); padding: var(--s5);
  backdrop-filter: var(--blur);
  box-shadow: var(--sh-sm), inset 0 1px 0 rgba(255,255,255,.08);
  margin-bottom: var(--s4);
  transition: border-color var(--t-base) var(--ease);
}
.frase__es { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--s3); }
.frase__mark {
  font-family: var(--font-display); font-weight: 700; font-size: var(--fs-xl);
  color: var(--text); background: transparent; line-height: 1.25;
  background-image: linear-gradient(transparent 62%, var(--marker-soft) 62%);
  padding: 0 .1em;
}
.frase__pron { font-family: var(--font-mono); font-size: var(--fs-sm); color: var(--accent); margin: var(--s3) 0 0; transition: color var(--t-base) var(--ease); }
.frase__pt { font-size: var(--fs-md); margin: var(--s2) 0 0; }
.frase__var { margin-top: var(--s3); }
.frase__var summary { cursor: pointer; color: var(--text-muted); font-size: var(--fs-sm); }
.frase__var ul { margin: var(--s2) 0 0; padding-left: var(--s5); color: var(--text); }
.frase__var li { margin: var(--s1) 0; }

.speak {
  flex: 0 0 auto; background: var(--accent-soft); color: var(--accent);
  border: none; border-radius: var(--r-md); width: 2.25rem; height: 2.25rem;
  cursor: pointer; font-size: 1rem;
  transition: background var(--t-fast), color var(--t-fast);
}
.speak:hover { background: color-mix(in srgb, var(--accent-soft) 60%, var(--accent) 15%); }

/* ---------- listas de palavras ---------- */
.chips { display: flex; flex-wrap: wrap; gap: var(--s2); margin: var(--s3) 0 0; padding: 0; list-style: none; }
.chip {
  background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--r-pill); padding: var(--s1) var(--s3); font-size: var(--fs-sm);
  backdrop-filter: var(--blur);
}

/* ---------- acordeão ---------- */
.acc { border: 1px solid var(--border); border-radius: var(--r-lg); background: var(--surface); backdrop-filter: var(--blur); overflow: hidden; margin-bottom: var(--s3); }
.acc > summary {
  cursor: pointer; padding: var(--s4) var(--s5); font-weight: 600; font-family: var(--font-display);
  list-style: none; display: flex; justify-content: space-between; align-items: center;
}
.acc > summary::-webkit-details-marker { display: none; }
.acc > summary::after { content: "+"; color: var(--accent); font-size: 1.3rem; transition: color var(--t-base) var(--ease); }
.acc[open] > summary::after { content: "–"; }
.acc__body { padding: 0 var(--s5) var(--s5); }
.acc__body code { font-family: var(--font-mono); background: var(--surface-2); padding: .1em .35em; border-radius: var(--r-sm); }

/* Acordeão de vocabulário no simulador */
.acc--vocab { border-color: var(--accent); border-left-width: 3px; }
.acc--vocab > summary { color: var(--accent); }
.vocab-list { margin: 0; padding-left: var(--s5); }
.vocab-list li { margin: var(--s2) 0; }
.vocab-es { font-family: var(--font-display); font-weight: 600; color: var(--accent); }
.vocab-pt { color: var(--text-muted); font-size: var(--fs-sm); }

/* ---------- botões ---------- */
.btn {
  font: inherit; font-weight: 600; cursor: pointer;
  background: var(--brand); color: #fff; border: 1px solid var(--brand);
  border-radius: var(--r-md); padding: var(--s3) var(--s5);
  transition: background var(--t-fast), transform var(--t-fast), box-shadow var(--t-fast);
}
.btn:hover { background: var(--brand-hover); border-color: var(--brand-hover); box-shadow: var(--sh-sm); }
.btn:active { transform: translateY(1px); }
.btn--ghost { background: transparent; color: var(--brand); }
.btn--ghost:hover { background: var(--brand-soft); }
.btn:disabled, .btn[aria-disabled="true"] { opacity: .5; cursor: not-allowed; }
.btn-row { display: flex; flex-wrap: wrap; gap: var(--s3); margin-top: var(--s4); }

/* ---------- campos ---------- */
.input {
  font: inherit; color: var(--text); background: var(--surface-2);
  border: 1px solid var(--border); border-radius: var(--r-md);
  padding: var(--s3) var(--s4); width: 100%;
}
.input:focus-visible { border-color: var(--brand); }
.input.is-error { border-color: var(--error); background: var(--error-bg); }

/* ---------- flashcard ---------- */
.flash {
  perspective: 1200px; margin: 0 auto var(--s5); max-width: 34rem;
}
.flash__card {
  position: relative; width: 100%; min-height: 12rem; cursor: pointer;
  transform-style: preserve-3d; transition: transform var(--t-base) var(--ease);
}
.flash__card.is-flipped { transform: rotateY(180deg); }
.flash__face {
  position: absolute; inset: 0; backface-visibility: hidden;
  display: grid; place-items: center; text-align: center; padding: var(--s6);
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--r-lg); backdrop-filter: var(--blur);
  box-shadow: var(--sh-md), inset 0 1px 0 rgba(255,255,255,.08);
}
.flash__face small { display: block; font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: .08em; color: var(--text-muted); margin-bottom: var(--s2); }
.flash__face p { font-family: var(--font-display); font-size: var(--fs-xl); margin: 0; }

/* Verso do flashcard: destaque âmbar */
.flash__back {
  transform: rotateY(180deg);
  background: linear-gradient(135deg, var(--marker-soft) 0%, var(--surface) 60%);
  border-color: var(--marker);
}
.flash__back p { color: var(--accent); }
.flash__hint { text-align: center; color: var(--text-muted); font-size: var(--fs-xs); margin-top: var(--s2); }
.flash__nav { display: flex; justify-content: center; gap: var(--s3); margin-top: var(--s2); }

/* ---------- feedback (ditado / lacunas) ---------- */
.feedback { margin-top: var(--s3); padding: var(--s3) var(--s4); border-radius: var(--r-md); font-size: var(--fs-sm); }
.feedback.is-correct { background: var(--success-bg); color: var(--success); border-left: 3px solid var(--success); }
.feedback.is-error { background: var(--error-bg); color: var(--error); border-left: 3px solid var(--error); }
.feedback b { font-weight: 700; }

/* ---------- role-play ---------- */
.chat { display: flex; flex-direction: column; gap: var(--s3); margin: var(--s4) 0; }
.msg { max-width: 85%; padding: var(--s3) var(--s4); border-radius: var(--r-lg); line-height: var(--lh-loose); }
.msg--sys { align-self: flex-start; background: var(--surface-2); border: 1px solid var(--border); backdrop-filter: var(--blur); }
.msg--user { align-self: flex-end; background: var(--brand-soft); color: var(--text); border: 1px solid color-mix(in srgb, var(--brand) 30%, transparent); }
.msg--eval { align-self: stretch; background: var(--surface); border: 1px dashed var(--accent); font-size: var(--fs-sm); border-radius: var(--r-md); backdrop-filter: var(--blur); }
.msg--eval .rewrite { font-family: var(--font-display); font-weight: 600; margin-top: var(--s2); color: var(--accent); }
.msg--eval .tip { color: var(--text-muted); font-family: var(--font-mono); font-size: var(--fs-xs); margin-top: var(--s1); }
.msg--fim { align-self: center; background: linear-gradient(135deg, var(--brand-soft), var(--marker-soft)); border: 2px solid var(--marker); text-align: center; font-family: var(--font-display); font-weight: 700; font-size: var(--fs-lg); max-width: 100%; }

/* ---------- estados globais ---------- */
.is-loading { position: relative; color: transparent !important; pointer-events: none; }
.is-loading::after {
  content: ""; position: absolute; inset: 0; margin: auto;
  width: 1.2rem; height: 1.2rem; border-radius: 50%;
  border: 2px solid var(--border); border-top-color: var(--brand);
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ---------- toaster de revisão ---------- */
.toaster {
  position: fixed; left: 50%; bottom: var(--s6); transform: translateX(-50%);
  z-index: var(--z-toast); max-width: min(28rem, 92vw);
  background: var(--surface); color: var(--text);
  border: 1px solid var(--border); border-left: 4px solid var(--marker);
  border-radius: var(--r-lg); backdrop-filter: var(--blur);
  box-shadow: var(--sh-lg); padding: var(--s4) var(--s5);
}
.toaster h3 { font-size: var(--fs-base); margin-bottom: var(--s1); }
.toaster ul { margin: var(--s2) 0 0; padding-left: var(--s5); font-size: var(--fs-sm); color: var(--text-muted); }
.toaster__actions { display: flex; gap: var(--s2); margin-top: var(--s3); }

/* ---------- ecrã de boas-vindas ---------- */
.welcome {
  min-height: calc(100vh - 12rem);
  display: flex; flex-direction: column; align-items: center;
  padding: var(--s10) var(--s4);
}
.welcome__flag {
  width: 100%; max-width: 22rem; height: 12rem;
  background: linear-gradient(135deg, var(--brand) 0%, var(--marker) 100%);
  border-radius: var(--r-lg); box-shadow: var(--sh-lg);
  margin-bottom: var(--s8);
  position: relative; overflow: hidden;
}
.welcome__flag::after {
  content: '🇪🇸';
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 4rem;
}
.welcome__body { max-width: 28rem; text-align: center; }
.welcome__title {
  font-family: var(--font-display); font-size: clamp(2rem, 6vw, 3rem);
  font-weight: 700; line-height: var(--lh-tight);
  background: linear-gradient(135deg, var(--brand), var(--marker));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: var(--s2) 0 var(--s4);
}
.welcome__sub { color: var(--text-muted); font-size: var(--fs-md); margin-bottom: var(--s6); line-height: var(--lh-loose); }
.welcome__modules {
  display: grid; grid-template-columns: 1fr 1fr; gap: var(--s2);
  list-style: none; padding: 0; margin: 0 0 var(--s8);
  text-align: left;
}
.welcome__modules li {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--r-md); padding: var(--s2) var(--s3);
  font-size: var(--fs-sm); font-weight: 500;
  backdrop-filter: var(--blur);
}
.welcome__cta {
  width: 100%; max-width: 18rem; font-size: var(--fs-md);
  padding: var(--s4) var(--s6); border-radius: var(--r-pill);
  box-shadow: var(--sh-md); letter-spacing: .01em;
}

/* ---------- indicador de conclusão no seletor ---------- */
.mod-badge {
  display: inline-flex; align-items: center; gap: var(--s1);
  font-size: var(--fs-xs); font-weight: 600;
  color: var(--success); background: var(--success-bg);
  border-radius: var(--r-pill); padding: 0 var(--s2);
  margin-left: var(--s2);
}

/* ---------- rodapé ---------- */
.footer { max-width: var(--wrap); margin: 0 auto; padding: var(--s8) var(--s4); color: var(--text-muted); font-size: var(--fs-sm); border-top: 1px solid var(--border); }

/* ---------- responsivo ---------- */
@media (max-width: 34rem) {
  .brand__text small { display: none; }
  .view-head h1 { font-size: var(--fs-xl); }
  .msg { max-width: 92%; }
  .welcome__modules { grid-template-columns: 1fr; }
}

/* ===== MOBILE — bottom nav, touch targets, safe areas ===== */

/* Input font 16px evita zoom automático no iOS */
@media (pointer: coarse) {
  .input { font-size: 16px; padding: var(--s4); }
  .btn, .icon-btn, .speak, .mic-btn { min-height: 44px; }
}

/* Bottom nav no mobile */
@media (max-width: 48rem) {
  /* siteheader vira static → tabs (fixed) não herdam stacking context */
  .siteheader { position: static; }
  /* topbar fica sticky por conta própria */
  .topbar { position: sticky; top: 0; z-index: var(--z-sticky); }

  .tabs {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: var(--z-sticky);
    padding: var(--s2) var(--s3) calc(var(--s2) + env(safe-area-inset-bottom, 0px));
    background: var(--surface);
    backdrop-filter: var(--blur);
    border-top: 1px solid var(--border);
    display: grid; grid-auto-columns: 1fr; grid-auto-flow: column; gap: 0;
    overflow: visible;
  }
  .tab {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    gap: 2px; font-size: .65rem; padding: var(--s2) var(--s1);
    border-radius: var(--r-md); border: none; white-space: nowrap;
  }
  .tab::before { content: attr(data-icon); font-size: 1.3rem; line-height: 1; display: block; }
  .tab[aria-selected="true"] { box-shadow: none; }
  .page { padding-bottom: calc(5.5rem + env(safe-area-inset-bottom, 0px)); }
  .welcome { padding-top: var(--s6); }
  .welcome__flag { height: 8rem; margin-bottom: var(--s5); }
}

/* ===== MIC BUTTON ===== */
.mic-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--s2);
  font: inherit; font-weight: 600; cursor: pointer;
  background: var(--surface-2); color: var(--text);
  border: 2px solid var(--border); border-radius: var(--r-md);
  padding: var(--s3) var(--s4); backdrop-filter: var(--blur);
  transition: border-color var(--t-fast), color var(--t-fast);
}
.mic-btn:hover { border-color: var(--brand); color: var(--brand); }
.mic-btn.is-recording {
  background: var(--error-bg); color: var(--error); border-color: var(--error);
  animation: pulse-rec 1.2s ease-in-out infinite;
}
@keyframes pulse-rec {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--error) 40%, transparent); }
  50%       { box-shadow: 0 0 0 10px color-mix(in srgb, var(--error) 0%, transparent); }
}
.mic-dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: currentColor; flex-shrink: 0;
}
.mic-btn.is-recording .mic-dot { animation: blink .8s step-end infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

/* ===== FLUÊNCIA VIEW ===== */
.flu-frase {
  background: var(--surface); border: 1px solid var(--border);
  border-left: 4px solid var(--accent); border-radius: var(--r-lg);
  padding: var(--s5); margin-bottom: var(--s4);
  backdrop-filter: var(--blur);
  transition: border-color var(--t-base) var(--ease);
}
.flu-frase__es {
  font-family: var(--font-display); font-weight: 700; font-size: var(--fs-xl);
  background-image: linear-gradient(transparent 62%, var(--marker-soft) 62%);
  padding: 0 .1em; line-height: 1.35; display: inline;
}
.flu-frase__pt { color: var(--text-muted); margin-top: var(--s3); font-size: var(--fs-md); }
.flu-frase__pron { font-family: var(--font-mono); font-size: var(--fs-xs); color: var(--accent); margin-top: var(--s2); }

.flu-result {
  margin-top: var(--s4); padding: var(--s5); border-radius: var(--r-lg);
  background: var(--surface); border: 1px solid var(--border); backdrop-filter: var(--blur);
  box-shadow: var(--sh-sm);
}
.flu-score {
  font-family: var(--font-display); font-size: var(--fs-2xl); font-weight: 700;
  color: var(--accent); margin-bottom: var(--s3);
}
.flu-words { display: flex; flex-wrap: wrap; gap: var(--s2); margin: var(--s2) 0; }
.flu-word {
  padding: var(--s1) var(--s3); border-radius: var(--r-pill);
  font-size: var(--fs-sm); font-weight: 600; font-family: var(--font-display);
}
.flu-word--ok  { background: var(--success-bg); color: var(--success); }
.flu-word--err { background: var(--error-bg); color: var(--error); text-decoration: line-through; }
.flu-transcrito {
  font-family: var(--font-mono); font-size: var(--fs-xs); color: var(--text-muted);
  margin-top: var(--s3); padding-top: var(--s3); border-top: 1px solid var(--border);
}
.flu-dica { margin-top: var(--s3); font-size: var(--fs-sm); color: var(--text-muted); }
.flu-nav {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: var(--s6); gap: var(--s3);
}
.flu-nav__count { color: var(--text-muted); font-size: var(--fs-sm); }

/* ===== SWIPE HINT no flashcard ===== */
.flash__swipe-hint {
  text-align: center; color: var(--text-muted); font-size: var(--fs-xs);
  margin-top: var(--s1); display: none;
}
@media (pointer: coarse) { .flash__swipe-hint { display: block; } }

/* ===== DIALOG de configuração da API ===================================== */
.config-dlg {
  border: 1px solid var(--border); border-radius: var(--r-lg);
  background: var(--surface); color: var(--text);
  backdrop-filter: var(--blur);
  padding: var(--s8); max-width: 28rem; width: calc(100% - var(--s8));
  box-shadow: var(--sh-lg); z-index: var(--z-modal);
}
.config-dlg::backdrop { background: rgba(5,7,15,.65); backdrop-filter: blur(4px); }
.config-dlg__title {
  font-family: var(--font-display); font-size: var(--fs-lg); font-weight: 700; margin-bottom: var(--s3);
}
.config-dlg__desc {
  font-size: var(--fs-sm); color: var(--text-muted); margin-bottom: var(--s5); line-height: var(--lh-loose);
}
.config-dlg__label { display: block; font-size: var(--fs-sm); font-weight: 600; margin-bottom: var(--s2); }
.config-dlg__form .input { margin-bottom: var(--s4); }
.config-dlg__status {
  font-size: var(--fs-sm); padding: var(--s2) var(--s3); border-radius: var(--r-sm); margin-bottom: var(--s3);
}
.config-dlg__status.is-ok    { background: var(--success-bg); color: var(--success); }
.config-dlg__status.is-error { background: var(--error-bg);   color: var(--error);   }

/* ---------- movimento reduzido ---------- */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: 1ms !important; animation-duration: 1ms !important; }
  .flash__card { transition: none; }
}

/* ===== BACK LINK ===== */
.home-back {
  display: flex; align-items: center; justify-content: center;
  width: 2.25rem; height: 2.25rem; border-radius: var(--r-sm);
  color: var(--text-muted); text-decoration: none; font-size: var(--fs-lg);
  transition: color var(--t-fast) var(--ease), background var(--t-fast) var(--ease);
  flex-shrink: 0;
}
.home-back:hover { color: var(--text); background: var(--surface-2); }

/* ===== VARIAÇÕES COM ÁUDIO ===== */
.var-row { display: flex; align-items: center; justify-content: space-between; gap: .5rem; }
.var-row span { flex: 1; }
.btn-var-speak {
  background: none; border: none; cursor: pointer; font-size: var(--fs-base);
  padding: .2rem .4rem; border-radius: var(--r-sm); color: var(--text-muted);
  transition: color var(--t-fast) var(--ease), background var(--t-fast) var(--ease);
  flex-shrink: 0;
}
.btn-var-speak:hover { color: var(--brand); background: var(--surface-2); }
```

- [ ] **Step 2: Balanced-braces sanity check** (stand-in for a CSS test suite — this project has none)

Run:
```bash
node -e "const css=require('fs').readFileSync('Fluencia/styles.css','utf8'); const o=(css.match(/{/g)||[]).length; const c=(css.match(/}/g)||[]).length; if(o!==c) throw new Error('unbalanced braces: '+o+' vs '+c); console.log('OK', o, c);"
```
Expected: `OK <N> <N>` (equal counts), exit code 0.

- [ ] **Step 3: Grep-verify no `[data-tema` selectors remain**

Run: `grep -c "data-tema" Fluencia/styles.css`
Expected: `0` (grep exits 1 with no match, which is correct here).

- [ ] **Step 4: Commit**

```bash
cd Fluencia
git add styles.css
git commit -m "Rewrite styles.css as glassmorphism dark-only theme"
```

---

### Task 3: Rewrite `index.html` (landing) for the glass theme

**Files:**
- Modify: `Fluencia/index.html` (full file replacement — inline `<style>` block, body markup, and inline `<script>` all change)

**Interfaces:**
- Consumes: `.glass-orb` class names from Task 2 (only used as inline reference — `index.html` does not load `styles.css`, it has its own `<style>` block, so `.glass-orb` and the color tokens are redefined locally here with the same values as Task 1/2 for visual consistency).
- Produces: nothing consumed by other tasks (this page has no shared DOM with `app.html`/`app.js`).
- Removes: `#btn-tema` button, its click listener, `localStorage['fl:tema']` usage, the `[data-tema="dark"]` block and all `[data-tema="dark"] .selector` overrides, and the two `media="(prefers-color-scheme: ...)"` theme-color meta tags (replaced by one static value).

- [ ] **Step 1: Replace the file content**

Replace the entire contents of `Fluencia/index.html` with:

```html
<!doctype html>
<html lang="pt-BR">
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
  <meta name="theme-color" content="#0A0E1A" />
  <link rel="apple-touch-icon" href="icons/icon-192.png" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg-1: #0A0E1A; --bg-2: #12172A;
      --surface: rgba(24,30,50,.55); --surface-2: rgba(24,30,50,.35);
      --text: #F1F2F8; --text-muted: #A7ADC4; --border: rgba(255,255,255,.14);
      --brand: #6C5CE7; --brand-hover: #8477EE;
      --marker: #F4B430; --marker-soft: rgba(244,180,48,.16);
      --font-display: "Bricolage Grotesque", system-ui, sans-serif;
      --font-body: "Inter", system-ui, sans-serif;
      --r-md: 10px; --r-lg: 16px; --r-pill: 999px;
      --sh-md: 0 8px 24px rgba(0,0,0,.45);
      --blur: blur(20px) saturate(1.3);
      --t-base: 220ms; --ease: cubic-bezier(.22,1,.36,1);
    }

    body {
      font-family: var(--font-body);
      background: radial-gradient(ellipse 120% 80% at 50% -10%, var(--bg-2), var(--bg-1));
      color: var(--text);
      min-height: 100dvh; display: flex; flex-direction: column;
    }

    /* ---- glass orbs (decorativos) ---- */
    .glass-orb { position: fixed; border-radius: 50%; filter: blur(90px); pointer-events: none; z-index: -1; }
    .glass-orb--1 { width: 26rem; height: 26rem; top: -8rem; left: -6rem; background: var(--brand); opacity: .30; }
    .glass-orb--2 { width: 22rem; height: 22rem; bottom: -6rem; right: -4rem; background: #4FC1CE; opacity: .22; }
    .glass-orb--3 { width: 18rem; height: 18rem; top: 40%; right: 15%; background: var(--marker); opacity: .16; }

    /* ---- HEADER ---- */
    .site-header {
      display: flex; justify-content: flex-end; padding: 1rem 1.5rem;
    }

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
    .hero__title {
      font-family: var(--font-display); font-size: clamp(2rem, 6vw, 3.5rem);
      font-weight: 700; line-height: 1.1; letter-spacing: -.02em;
    }
    .hero__title mark {
      background: var(--marker-soft); color: var(--marker);
      border-radius: 4px; padding: 0 .15em;
    }
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
      background: var(--surface); backdrop-filter: var(--blur); cursor: pointer; font-family: var(--font-body);
      font-size: .9rem; font-weight: 500; color: var(--text-muted);
      transition: border-color var(--t-base) var(--ease), box-shadow var(--t-base) var(--ease);
      position: relative;
    }
    .lang-card .flag { font-size: 1.6rem; }
    .lang-card.is-active { border-color: var(--brand); color: var(--text); box-shadow: var(--sh-md); }
    .lang-card:disabled { opacity: .45; cursor: not-allowed; }
    .lang-card .badge {
      position: absolute; top: .4rem; right: .4rem;
      font-size: .6rem; font-weight: 600; padding: .1rem .4rem;
      background: var(--marker-soft); color: var(--marker); border-radius: var(--r-pill);
    }

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
      border: 2px solid var(--border); background: var(--surface); backdrop-filter: var(--blur);
      font-family: var(--font-display); font-size: 1rem; font-weight: 600; color: var(--text-muted);
      cursor: pointer; transition: border-color var(--t-base) var(--ease), color var(--t-base) var(--ease);
    }
    .track-btn.is-active { border-color: var(--brand); color: var(--brand); }

    /* ---- CTA ---- */
    .cta-wrap { width: 100%; max-width: 36rem; }
    .btn-cta {
      display: block; width: 100%; padding: 1rem; border-radius: var(--r-lg);
      background: var(--brand); color: #fff; font-family: var(--font-display);
      font-size: 1.1rem; font-weight: 700; text-decoration: none; text-align: center;
      transition: background var(--t-base) var(--ease), transform var(--t-base) var(--ease);
    }
    .btn-cta:hover { background: var(--brand-hover); transform: translateY(-1px); }

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
  <div class="glass-orb glass-orb--1" aria-hidden="true"></div>
  <div class="glass-orb glass-orb--2" aria-hidden="true"></div>
  <div class="glass-orb glass-orb--3" aria-hidden="true"></div>

  <header class="site-header" role="banner"></header>

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

  <footer role="contentinfo">
    <span>© 2026 Fluência</span>
    <a href="privacy.html">Política de privacidade</a>
    <a href="app.html?lang=es&track=viagem">Espanhol Viagem</a>
    <a href="app.html?lang=es&track=negocios">Espanhol Negócios</a>
  </footer>

  <script>
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

- [ ] **Step 2: Balanced-tags sanity check**

Run:
```bash
node -e "const h=require('fs').readFileSync('Fluencia/index.html','utf8'); const o=(h.match(/<style>/g)||[]).length; const c=(h.match(/<\/style>/g)||[]).length; if(o!==c) throw new Error('style tag mismatch'); if(h.includes('btn-tema')) throw new Error('btn-tema still present'); if(h.includes('data-tema')) throw new Error('data-tema still present'); console.log('OK');"
```
Expected: `OK`, exit code 0.

- [ ] **Step 3: Commit**

```bash
cd Fluencia
git add index.html
git commit -m "Rewrite index.html for glassmorphism dark-only theme, drop theme toggle"
```

---

### Task 4: Update `app.html` — glass meta/orbs, remove theme toggle button

**Files:**
- Modify: `Fluencia/app.html`

**Interfaces:**
- Consumes: `.glass-orb` classes from Task 2's `styles.css` (already loaded via `<link rel="stylesheet" href="styles.css" />`, no new `<link>` needed).
- Produces: nothing new consumed elsewhere; removing `#btn-tema` is what makes Task 5's `app.js` change safe (no listener attaches to a missing element only if we also delete the JS that reference it — done together for correctness, see Task 5).

- [ ] **Step 1: Replace `<html>` tag and theme-color meta**

In `Fluencia/app.html`, find:
```html
<html lang="pt-BR" data-tema="light">
```
Replace with:
```html
<html lang="pt-BR">
```

Find:
```html
  <meta name="theme-color" content="#C60B1E" media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content="#0F0500" media="(prefers-color-scheme: dark)" />
```
Replace with:
```html
  <meta name="theme-color" content="#0A0E1A" />
```

- [ ] **Step 2: Add glass orbs right after `<body>`**

Find:
```html
<body>
  <a class="skip-link" href="#principal">Ir ao conteúdo</a>
```
Replace with:
```html
<body>
  <div class="glass-orb glass-orb--1" aria-hidden="true"></div>
  <div class="glass-orb glass-orb--2" aria-hidden="true"></div>
  <div class="glass-orb glass-orb--3" aria-hidden="true"></div>

  <a class="skip-link" href="#principal">Ir ao conteúdo</a>
```

- [ ] **Step 3: Remove the theme-toggle button**

Find:
```html
          <button id="btn-tema" class="icon-btn" type="button" aria-pressed="false" aria-label="Alternar tema claro e escuro">
            <span class="icon-btn__glyph" aria-hidden="true">◐</span>
          </button>
          <button id="btn-config" class="icon-btn" type="button" aria-label="Configurar API Anthropic" title="Configurar API Anthropic">
```
Replace with:
```html
          <button id="btn-config" class="icon-btn" type="button" aria-label="Configurar API Anthropic" title="Configurar API Anthropic">
```

- [ ] **Step 4: Verify no remaining references**

Run:
```bash
grep -c "btn-tema\|data-tema" Fluencia/app.html
```
Expected: `0` (grep exits 1 with no matches — correct here).

- [ ] **Step 5: Commit**

```bash
cd Fluencia
git add app.html
git commit -m "app.html: glass orbs, single theme-color, remove theme toggle button"
```

---

### Task 5: Update `app.js` — remove theme-toggle logic

**Files:**
- Modify: `Fluencia/app.js:632-643` (the `/* ---------- tema ------------------------------------------------------- */` block) and `Fluencia/app.js:702` (the `init()` call site)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new. This removes the only code in the project that reads/writes `localStorage['es:tema']` and toggles `document.documentElement.dataset.tema` — after this task, no `.js` file references `data-tema` or `#btn-tema` (already removed from `app.html` in Task 4).

- [ ] **Step 1: Remove the `initTema`/`aplicarTema` functions**

Find in `Fluencia/app.js`:
```js
/* ---------- tema ------------------------------------------------------- */
function initTema() {
  const salvo = localStorage.getItem('es:tema');
  const escuro = salvo ? salvo === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  aplicarTema(escuro);
  $('#btn-tema').addEventListener('click', () => aplicarTema(document.documentElement.dataset.tema !== 'dark'));
}
function aplicarTema(escuro) {
  document.documentElement.dataset.tema = escuro ? 'dark' : 'light';
  $('#btn-tema').setAttribute('aria-pressed', String(escuro));
  localStorage.setItem('es:tema', escuro ? 'dark' : 'light');
}

/* ---------- config API ------------------------------------------------- */
```
Replace with:
```js
/* ---------- config API ------------------------------------------------- */
```

- [ ] **Step 2: Remove the `initTema()` call**

Find in `Fluencia/app.js` (around line 702):
```js
  estado.carregar(); initTema(); initConfig();
```
Replace with:
```js
  estado.carregar(); initConfig();
```

- [ ] **Step 3: Verify removal and balanced braces**

Run:
```bash
node -e "
const js = require('fs').readFileSync('Fluencia/app.js', 'utf8');
if (js.includes('initTema') || js.includes('aplicarTema') || js.includes('btn-tema') || js.includes('es:tema')) {
  throw new Error('theme toggle code still present');
}
const o = (js.match(/{/g) || []).length;
const c = (js.match(/}/g) || []).length;
if (o !== c) throw new Error('unbalanced braces: ' + o + ' vs ' + c);
console.log('OK', o, c);
"
```
Expected: `OK <N> <N>`, exit code 0.

- [ ] **Step 4: Commit**

```bash
cd Fluencia
git add app.js
git commit -m "app.js: remove theme-toggle logic (app is now dark-only)"
```

---

### Task 6: Rewrite `privacy.html` for the glass palette

**Files:**
- Modify: `Fluencia/privacy.html` (inline `<style>` block gets new tokens + `.glass-orb` rules; two decorative `<div>`s are added right after `<body>`; the rest of the body content is untouched)

**Interfaces:**
- Consumes: the same hex values as Task 1/2 (hand-copied, since this page has no `<link>` to `styles.css`).
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Replace the `<style>` block**

Find in `Fluencia/privacy.html`:
```html
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
```
Replace with:
```html
  <style>
    body {
      font-family: system-ui, sans-serif; max-width: 42rem; margin: 2rem auto; padding: 0 1.5rem;
      line-height: 1.7; color: #F1F2F8;
      background: radial-gradient(ellipse 120% 80% at 50% -10%, #12172A, #0A0E1A);
    }
    h1 { font-size: 1.75rem; margin-bottom: .5rem; }
    h2 { font-size: 1.1rem; margin-top: 2rem; margin-bottom: .5rem; }
    p, li { margin-bottom: .75rem; }
    a { color: #8477EE; }
    .glass-orb { position: fixed; border-radius: 50%; filter: blur(90px); pointer-events: none; z-index: -1; }
    .glass-orb--1 { width: 20rem; height: 20rem; top: -6rem; left: -6rem; background: #6C5CE7; opacity: .25; }
    .glass-orb--2 { width: 16rem; height: 16rem; bottom: -6rem; right: -4rem; background: #4FC1CE; opacity: .18; }
  </style>
```

*(Nota: `#8477EE` — a variante hover do índigo — é usada aqui em vez do `#6C5CE7` base porque é ligeiramente mais clara, o que aumenta a margem de contraste para hiperligações sublinhadas de tamanho normal sobre o fundo `#0A0E1A`. Esta página usa só 2 orbs, mais discretos que os das outras páginas, por ser uma página de texto legal onde a legibilidade prolongada importa mais que o impacto visual.)*

- [ ] **Step 2: Add glass orbs right after `<body>`**

Find in `Fluencia/privacy.html`:
```html
<body>
  <a href="index.html">← Fluência</a>
```
Replace with:
```html
<body>
  <div class="glass-orb glass-orb--1" aria-hidden="true"></div>
  <div class="glass-orb glass-orb--2" aria-hidden="true"></div>

  <a href="index.html">← Fluência</a>
```

- [ ] **Step 3: Verify no leftover light-mode hex codes and orbs present**

Run: `grep -c "#1a0800\|#c60b1e\|prefers-color-scheme" Fluencia/privacy.html`
Expected: `0` (grep exits 1 with no matches — correct here).

Run: `grep -q "glass-orb--2" Fluencia/privacy.html && echo FOUND`
Expected: `FOUND`.

- [ ] **Step 4: Commit**

```bash
cd Fluencia
git add privacy.html
git commit -m "privacy.html: apply glassmorphism dark palette"
```

---

### Task 7: Bump service worker cache version

**Files:**
- Modify: `Fluencia/service-worker.js:4`

**Interfaces:**
- Consumes: nothing.
- Produces: forces every client to fetch the new `index.html`/`app.html`/`styles.css`/`app.js`/`privacy.html` instead of serving stale cached copies (per `Fluencia/CLAUDE.md`: "Ao alterar qualquer ficheiro do shell: incrementar VERSAO").

- [ ] **Step 1: Bump the version**

Find in `Fluencia/service-worker.js`:
```js
const VERSAO = 'fluencia-v7';
```
Replace with:
```js
const VERSAO = 'fluencia-v8';
```

- [ ] **Step 2: Verify**

Run: `grep "const VERSAO" Fluencia/service-worker.js`
Expected: `const VERSAO = 'fluencia-v8';`

- [ ] **Step 3: Commit**

```bash
cd Fluencia
git add service-worker.js
git commit -m "Bump service worker cache version to v8 for glass theme rollout"
```

---

### Task 8: Manual verification walkthrough

**Files:** none (verification only)

**Interfaces:** none.

- [ ] **Step 1: Validate `design-tokens.json` one more time (final state)**

Run: `python3 -c "import json; json.load(open('Fluencia/design-tokens.json'))"`
Expected: no output, exit code 0.

- [ ] **Step 2: Serve locally**

Run (from the `Fluencia` directory, in the background or a separate terminal):
```bash
cd Fluencia
python -m http.server 8080
```

- [ ] **Step 3: Walk through `index.html`**

Open `http://localhost:8080/index.html`. Confirm:
- Dark gradient background with visible soft blurred color orbs behind the content.
- No theme-toggle button is present anywhere in the header.
- Logo, hero title, language cards, track buttons, and the "Começar agora →" CTA all render with the new indigo/amber palette, are legible, and hover/active states visibly change color.
- Clicking a language/track card updates its active state; the CTA link updates its `href` (inspect via devtools or just click it).

- [ ] **Step 4: Walk through `app.html`**

Click "Começar agora →" (or open `http://localhost:8080/app.html?lang=es&track=viagem`). Confirm:
- Topbar, tabs, and progress bar render with frosted/blurred glass surfaces.
- No `#btn-tema` icon is present; `#btn-config` (⚙) still works and opens the dialog.
- Navigate all 5 tabs (Estudar, Praticar, Fluência, Simulador, Revisão) — each view renders without console errors (open devtools console and confirm no red errors after each tab click).
- On "Estudar": the frase-clave card shows the amber underline marker behind the Spanish phrase, the 🔊 speak button, and the vocabulary accordion opens/closes.
- On "Praticar": flip a flashcard (click or press Space) — front/back both render legibly, back shows the amber-tinted gradient.
- Resize the viewport to <48rem (or use devtools device mode) — confirm the bottom tab bar appears and remains usable (glass background, safe-area padding).

- [ ] **Step 5: Walk through `privacy.html`**

Open `http://localhost:8080/privacy.html`. Confirm dark glass-palette background, legible text, and that the "← Fluência" link and body links are visibly indigo and legible.

- [ ] **Step 6: Confirm `localStorage` is clean of dead theme keys going forward**

In devtools console on any page: `localStorage.getItem('es:tema')` / `localStorage.getItem('fl:tema')` may still return a stale value from before this change (harmless — nothing reads it anymore). Confirm no JS error is thrown by their presence by reloading the page with devtools console open.

- [ ] **Step 7: Confirm PWA still installs**

In devtools → Application → Service Workers, confirm the new service worker (`fluencia-v8`) activates and the manifest still resolves. In Application → Manifest, confirm no errors.

- [ ] **Step 8: Spot-check contrast**

Using the browser devtools color picker/contrast checker (or webaim.org/resources/contrastchecker), verify:
- Body text (`#F1F2F8`) on the page background — expect ≫4.5:1.
- Primary button text (white) on `.btn` background (`#6C5CE7`) — expect ≥4.5:1 (calculated 4.86:1).
- Muted text (`#A7ADC4`) on a `.frase`/`.acc` surface — expect ≥4.5:1.

If any pair fails, darken/lighten the offending token in both `design-tokens.json` and `styles.css` together, then redo Steps 2–8.

No commit for this task — it is verification only. If Step 8 requires a fix, that fix is a follow-up amendment to Task 1/2's files (new commit, not an amend).
