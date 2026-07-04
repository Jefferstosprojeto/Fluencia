/* =========================================================================
   Espanhol de Sobrevivência · app.js  (sem framework)
   Organização: 1) util  2) estado  3) motor  4) componentes
                 5) views  6) roteador  7) revisão/toaster  8) boot
   ========================================================================= */

/* ---------- 1) util ---------------------------------------------------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const live = (msg) => { $('#live').textContent = ''; requestAnimationFrame(() => $('#live').textContent = msg); };

// Normaliza para comparar respostas: minúsculas, sem acento, sem pontuação, espaços colapsados.
const norm = (s) => (s || '')
  .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[¿¡?!.,;:]/g, '').replace(/\s+/g, ' ').trim();

// Fala em espanhol da Espanha via Web Speech API (offline, sem custo).
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'es-ES';
  const v = speechSynthesis.getVoices().find(v => v.lang.startsWith('es'));
  if (v) u.voice = v;
  u.rate = 0.95;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

// Microfone — Web Speech API (es-ES). Retorna a instância para parar manualmente.
function usarMicrofone(lang, onResult, onError, onEnd) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { onError('Microfone não suportado. Use Chrome ou Edge.'); return null; }
  const rec = new SR();
  rec.lang = lang || 'es-ES';
  rec.interimResults = false;
  rec.maxAlternatives = 3;
  rec.onresult = (e) => {
    const r = e.results[0][0];
    onResult(r.transcript, r.confidence);
  };
  rec.onerror = (e) => onError(
    e.error === 'not-allowed' ? 'Permissão de microfone negada. Autorize nas configurações do browser.' :
    e.error === 'no-speech'   ? 'Nenhuma fala detectada. Tenta de novo.' : `Erro: ${e.error}`
  );
  rec.onend = () => onEnd && onEnd();
  rec.start();
  return rec;
}

// Avalia fluência word-by-word comparando transcrição com esperado.
function avaliarFluencia(falado, esperado) {
  const wordsExp = norm(esperado).split(' ').filter(Boolean);
  const wordsFal = new Set(norm(falado).split(' ').filter(Boolean));
  const corretas = wordsExp.filter(w => wordsFal.has(w));
  const erradas  = wordsExp.filter(w => !wordsFal.has(w));
  const score = wordsExp.length ? Math.round((corretas.length / wordsExp.length) * 100) : 0;
  return { score, corretas, erradas, wordsExp };
}

/* ---------- 2) estado (localStorage) ----------------------------------- */
const DB_KEY = 'es-sobrevivencia:v1';
const estado = {
  moduloAtual: 0,
  progresso: {},          // { moduloId: { estudou, praticou, simulou } }
  revisoes: [],           // agendamentos { moduloId, tipo:'4h'|'24h', quando:ts, itens:[] }
  carregar() { Object.assign(this, JSON.parse(localStorage.getItem(DB_KEY) || '{}')); },
  salvar()   { localStorage.setItem(DB_KEY, JSON.stringify({
                 moduloAtual: this.moduloAtual, progresso: this.progresso, revisoes: this.revisoes })); },
  marcar(moduloId, chave) {
    this.progresso[moduloId] = this.progresso[moduloId] || {};
    this.progresso[moduloId][chave] = true;
    this.salvar(); renderProgresso();
  }
};

let CONTEUDO = { modulos: [] };
const modulo = () => CONTEUDO.modulos[estado.moduloAtual];

/* ---------- 3) motor (hook de modelo, contrato JSON único) ------------- */
/* Troque o "engine" sem mudar o resto do app. Detalhes no README / Bloco 8. */
const Motor = {
  engine: 'local',                 // 'local' | 'opus' | 'sonnet' | 'fable'
  endpoint: '/api/motor',          // proxy que injeta a chave e chama a Anthropic API
  modelos: { opus: 'claude-opus-4-8', sonnet: 'claude-sonnet-5', fable: 'claude-fable-5' },

  // Contrato de avaliação de turno — TODO engine devolve exatamente estes campos.
  async avaliarTurno({ cenario, roteiroPasso, falaAluno }) {
    if (this.engine === 'local') return avaliarLocal({ roteiroPasso, falaAluno });
    try {
      const r = await fetch(this.endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelos[this.engine],
          system: PROMPTS.simulador(cenario),
          input: { cenario, roteiroPasso, falaAluno }
        })
      });
      if (!r.ok) throw new Error('motor indisponível');
      const j = await r.json();           // espera { avaliacao, reescrita, dica, proximaFala }
      return j;
    } catch (e) {
      return avaliarLocal({ roteiroPasso, falaAluno, aviso: 'Motor offline — avaliação local.' });
    }
  }
};

// Avaliador local (heurístico) — mantém o app 100% funcional offline no github.io.
function avaliarLocal({ roteiroPasso, falaAluno, aviso }) {
  const n = norm(falaAluno);
  const temCortesia = /por favor|gracias|perdon|buenas|hola/.test(n);
  const curto = n.split(' ').length < 2;
  let avaliacao;
  if (!n) avaliacao = 'Sem resposta. Diga ao menos uma frase curta em espanhol.';
  else if (curto) avaliacao = 'Entendível, mas muito curto — monte uma frase completa.';
  else if (temCortesia) avaliacao = 'Claro e natural: boa cortesia.';
  else avaliacao = 'Claro. Fica ainda mais natural com “por favor”.';
  const reescrita = falaAluno && !temCortesia && !curto ? `${falaAluno.replace(/[.?!]?$/, '')}, por favor.` : (falaAluno || '—');
  return {
    avaliacao: (aviso ? aviso + ' ' : '') + avaliacao,
    reescrita,
    dica: 'Marque a sílaba tônica e o “th” do castelhano (gra-THIAS).',
    proximaFala: '', // preenchida pelo componente a partir do roteiro
  };
}

/* ---------- 4) componentes -------------------------------------------- */

// 4.1 Flashcard — inverte frente/verso, teclado, progresso.
function Flashcard(cards, onDone) {
  let i = 0, virado = false;
  const box = document.createElement('div');
  const render = () => {
    const c = cards[i];
    box.innerHTML = `
      <div class="flash">
        <div class="flash__card ${virado ? 'is-flipped' : ''}" id="fc" tabindex="0" role="button"
             aria-label="Cartão ${i + 1} de ${cards.length}. Frente: ${c.frente}. Espaço para virar.">
          <div class="flash__face"><div><small>PT</small><p>${c.frente}</p></div></div>
          <div class="flash__face flash__back"><div><small>ES</small><p>${c.verso}</p></div></div>
        </div>
        <p class="flash__hint">${i + 1} / ${cards.length} &nbsp;·&nbsp; <kbd>Espaço</kbd> vira &nbsp;·&nbsp; <kbd>←</kbd><kbd>→</kbd> navega</p>
        <p class="flash__swipe-hint">← desliza para navegar · toca para virar →</p>
      </div>
      <div class="btn-row">
        <button class="btn btn--ghost" data-prev>← Anterior</button>
        <button class="btn" data-next>${i === cards.length - 1 ? 'Concluir ✓' : 'Próximo →'}</button>
      </div>`;
    const card = $('#fc', box);
    card.addEventListener('click', flip);
    card.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); flip(); }
      if (e.code === 'ArrowRight') next();
      if (e.code === 'ArrowLeft') prev();
    });
    // Swipe touch
    let _tx = 0, _ty = 0;
    card.addEventListener('touchstart', (e) => { _tx = e.touches[0].clientX; _ty = e.touches[0].clientY; }, { passive: true });
    card.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - _tx;
      const dy = e.changedTouches[0].clientY - _ty;
      if (Math.abs(dx) > 50 && Math.abs(dy) < 80) { dx < 0 ? next() : prev(); }
    }, { passive: true });
    $('[data-next]', box).addEventListener('click', next);
    $('[data-prev]', box).addEventListener('click', prev);
    $('#fc', box).focus();
  };
  const flip = () => { virado = !virado; if (virado) speak(cards[i].verso); render(); };
  const next = () => { if (i < cards.length - 1) { i++; virado = false; render(); } else onDone && onDone(); };
  const prev = () => { if (i > 0) { i--; virado = false; render(); } };
  render();
  return box;
}

// 4.2 Ditado — tocar/mostrar, campo, correção imediata.
function Ditado(frases) {
  let i = 0;
  const box = document.createElement('div');
  const render = () => {
    const alvo = frases[i];
    box.innerHTML = `
      <p class="eyebrow">Ditado ${i + 1}/${frases.length}</p>
      <p>Ouça, depois escreva ou fale.</p>
      <div class="btn-row">
        <button class="btn" data-play>🔊 Tocar</button>
        <button class="mic-btn" data-mic-dit><span class="mic-dot"></span> 🎤 Falar</button>
        <button class="btn btn--ghost" data-show aria-expanded="false">Ver resposta</button>
      </div>
      <p id="alvo" class="frase__mark" hidden style="font-size:var(--fs-md);margin-top:var(--s3)">${alvo}</p>
      <label class="sr-only" for="dit-in">Sua resposta do ditado</label>
      <input id="dit-in" class="input" style="margin-top:var(--s4)" autocomplete="off" placeholder="Escreva ou fale o que ouviu…" />
      <div class="btn-row">
        <button class="btn" data-check>Verificar</button>
        <button class="btn btn--ghost" data-next hidden>Próximo →</button>
      </div>
      <div id="fb" class="feedback" hidden></div>`;
    const inp = $('#dit-in', box), fb = $('#fb', box);
    $('[data-play]', box).addEventListener('click', () => speak(alvo));
    $('[data-show]', box).addEventListener('click', (e) => {
      const p = $('#alvo', box); const open = p.hidden;
      p.hidden = !open; e.target.setAttribute('aria-expanded', String(open));
    });
    let _recDit = null;
    const micDit = $('[data-mic-dit]', box);
    micDit.addEventListener('click', () => {
      if (_recDit) { _recDit.stop(); _recDit = null; return; }
      micDit.classList.add('is-recording'); micDit.innerHTML = '<span class="mic-dot"></span> A ouvir…';
      _recDit = usarMicrofone('es-ES',
        (t) => { inp.value = t; },
        (err) => { live(err); },
        () => {
          micDit.classList.remove('is-recording'); micDit.innerHTML = '<span class="mic-dot"></span> 🎤 Falar';
          _recDit = null;
          if (inp.value.trim()) $('[data-check]', box).click();
        }
      );
    });
    $('[data-check]', box).addEventListener('click', () => {
      const ok = norm(inp.value) === norm(alvo);
      fb.hidden = false; inp.classList.toggle('is-error', !ok);
      fb.className = 'feedback ' + (ok ? 'is-correct' : 'is-error');
      fb.innerHTML = ok ? '✓ Certo!' : `✗ Quase. Resposta: <b>${alvo}</b>`;
      live(ok ? 'Correto' : 'Incorreto. ' + alvo);
      $('[data-next]', box).hidden = false;
    });
    $('[data-next]', box).addEventListener('click', () => {
      if (i < frases.length - 1) { i++; render(); } else { live('Ditado concluído'); estado.marcar(modulo().id, 'praticou'); }
    });
    inp.focus();
  };
  render();
  return box;
}

// 4.3 Lacunas — validação instantânea.
function Lacunas(itens) {
  const box = document.createElement('div');
  itens.forEach((it, idx) => {
    const row = document.createElement('div');
    row.style.marginBottom = 'var(--s5)';
    row.innerHTML = `
      <p style="font-size:var(--fs-md)">${it.frase.replace('____', '<b>____</b>')}</p>
      <label class="sr-only" for="lac-${idx}">Complete a lacuna ${idx + 1}</label>
      <input id="lac-${idx}" class="input" autocomplete="off" placeholder="Complete…" />
      <div class="feedback" hidden></div>`;
    const inp = $('input', row), fb = $('.feedback', row);
    const check = () => {
      if (!inp.value.trim()) return;
      const ok = norm(inp.value) === norm(it.resposta);
      fb.hidden = false; inp.classList.toggle('is-error', !ok);
      fb.className = 'feedback ' + (ok ? 'is-correct' : 'is-error');
      fb.innerHTML = ok ? '✓ Certo' : `✗ Resposta: <b>${it.resposta}</b>`;
      live(ok ? 'Correto' : 'Incorreto');
    };
    inp.addEventListener('input', () => { if (norm(inp.value) === norm(it.resposta)) check(); });
    inp.addEventListener('blur', check);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
    box.appendChild(row);
  });
  return box;
}

// 4.4 RolePlay — chat simulador com avaliação por turno.
function RolePlay(rp) {
  let passo = 0;
  const m = modulo();
  const vocabItems = (m.frases_chave || []).slice(0, 5).map(f =>
    `<li><span class="vocab-es">${f.es}</span> <span class="vocab-pt">— ${f.pt}</span></li>`
  ).join('');
  const box = document.createElement('div');
  box.innerHTML = `
    <p class="eyebrow">Simulador</p>
    <h2 style="font-size:var(--fs-lg)">${rp.cenario}</h2>
    <p style="color:var(--text-muted)">${rp.personagens.join(' · ')}</p>
    <details class="acc acc--vocab" style="margin:var(--s4) 0">
      <summary>📖 Vocabulário útil para este cenário</summary>
      <div class="acc__body"><ul class="vocab-list">${vocabItems}</ul></div>
    </details>
    <div class="chat" id="chat" aria-live="polite"></div>
    <label class="sr-only" for="rp-in">Sua fala em espanhol</label>
    <input id="rp-in" class="input" autocomplete="off" placeholder="Responda em espanhol…" />
    <div class="btn-row">
      <button class="btn" data-send>Enviar</button>
      <button class="mic-btn" data-mic-rp><span class="mic-dot"></span> 🎤 Falar</button>
      <button class="btn btn--ghost" data-restart>↺ Recomeçar</button>
    </div>`;
  const chat = $('#chat', box), inp = $('#rp-in', box), send = $('[data-send]', box);

  const add = (cls, html) => { const d = document.createElement('div'); d.className = 'msg ' + cls; d.innerHTML = html; chat.appendChild(d); d.scrollIntoView({ block: 'nearest' }); };
  const pedirPasso = () => add('msg--sys', `<b>${rp.roteiro[passo] || 'Cierre'}</b> — sua vez.`);

  async function enviar() {
    const fala = inp.value.trim(); if (!fala) return;
    add('msg--user', fala); inp.value = ''; send.classList.add('is-loading'); send.setAttribute('aria-disabled', 'true');
    const r = await Motor.avaliarTurno({ cenario: rp.cenario, roteiroPasso: rp.roteiro[passo], falaAluno: fala });
    send.classList.remove('is-loading'); send.removeAttribute('aria-disabled');
    add('msg--eval', `
      <div>${r.avaliacao}</div>
      <div class="rewrite">Nativo: “${r.reescrita}”</div>
      <div class="tip">Pronúncia: ${r.dica}</div>`);
    live('Avaliação recebida');
    passo++;
    if (passo < rp.roteiro.length) pedirPasso();
    else { add('msg--fim', '🇪🇸 ¡Muy bien! Simulação concluída com sucesso.<br><small>Boa viagem pela Espanha!</small>'); estado.marcar(modulo().id, 'simulou'); agendarRevisoes(modulo()); }
    inp.focus();
  }
  send.addEventListener('click', enviar);
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') enviar(); });
  $('[data-restart]', box).addEventListener('click', () => { passo = 0; chat.innerHTML = ''; pedirPasso(); });
  // Mic no simulador
  let _recRp = null;
  const micRp = $('[data-mic-rp]', box);
  micRp.addEventListener('click', () => {
    if (_recRp) { _recRp.stop(); _recRp = null; return; }
    micRp.classList.add('is-recording'); micRp.innerHTML = '<span class="mic-dot"></span> A ouvir…';
    _recRp = usarMicrofone('es-ES',
      (t) => { inp.value = t; },
      (err) => { live(err); },
      () => {
        micRp.classList.remove('is-recording'); micRp.innerHTML = '<span class="mic-dot"></span> 🎤 Falar';
        _recRp = null;
        if (inp.value.trim()) enviar();
      }
    );
  });
  pedirPasso();
  return box;
}

// 4.5 Fluência — microfone + avaliação palavra a palavra.
function Fluencia(frases) {
  let idx = 0, rec = null;
  const box = document.createElement('div');

  const render = () => {
    const f = frases[idx];
    box.innerHTML = `
      <div class="flu-frase">
        <p class="flu-frase__es">${f.es}</p>
        <p class="flu-frase__pt">${f.pt}</p>
        <p class="flu-frase__pron">${f.pronuncia}</p>
      </div>
      <div class="btn-row">
        <button class="btn btn--ghost" data-speak>🔊 Ouvir modelo</button>
        <button class="mic-btn" data-mic><span class="mic-dot"></span> 🎤 Falar agora</button>
      </div>
      <div id="flu-res" hidden></div>
      <div class="flu-nav">
        <button class="btn btn--ghost" data-prev ${idx === 0 ? 'disabled' : ''}>← Anterior</button>
        <span class="flu-nav__count">${idx + 1} / ${frases.length}</span>
        <button class="btn btn--ghost" data-next ${idx === frases.length - 1 ? 'disabled' : ''}>Próxima →</button>
      </div>`;

    $('[data-speak]', box).addEventListener('click', () => speak(f.es));
    $('[data-prev]', box).addEventListener('click', () => { if (idx > 0) { idx--; rec = null; render(); } });
    $('[data-next]', box).addEventListener('click', () => { if (idx < frases.length - 1) { idx++; rec = null; render(); } });

    const micBtn = $('[data-mic]', box);
    const resDiv = $('#flu-res', box);

    micBtn.addEventListener('click', () => {
      if (rec) { rec.stop(); rec = null; return; }
      micBtn.classList.add('is-recording');
      micBtn.innerHTML = '<span class="mic-dot"></span> A ouvir… (fale agora)';
      rec = usarMicrofone('es-ES',
        (transcrito, confianca) => {
          const r = avaliarFluencia(transcrito, f.es);
          const emoji = r.score >= 85 ? '🟢' : r.score >= 55 ? '🟡' : '🔴';
          const msg   = r.score >= 85 ? '¡Muy bien! Excelente pronúncia.' :
                        r.score >= 55 ? 'Bom esforço — algumas palavras a melhorar.' :
                        'Tenta de novo, devagar, sílaba a sílaba.';
          resDiv.hidden = false;
          resDiv.innerHTML = `
            <div class="flu-result">
              <div class="flu-score">${emoji} ${r.score}%</div>
              <p style="font-size:var(--fs-sm);margin-bottom:var(--s2)">${msg}</p>
              <div class="flu-words">
                ${r.wordsExp.map(w =>
                  `<span class="flu-word ${r.corretas.includes(w) ? 'flu-word--ok' : 'flu-word--err'}">${w}</span>`
                ).join('')}
              </div>
              ${r.erradas.length ? `<p class="flu-dica">💡 Pratica: <b>${r.erradas.join(' · ')}</b></p>` : ''}
              <p class="flu-transcrito">Reconhecido: "${transcrito}"${confianca ? ` · confiança ${Math.round(confianca * 100)}%` : ''}</p>
            </div>`;
          live(r.score >= 85 ? 'Excelente pronúncia' : r.score >= 55 ? 'Bom, continua a praticar' : 'Tenta de novo');
        },
        (err) => {
          resDiv.hidden = false;
          resDiv.innerHTML = `<div class="feedback is-error" style="margin-top:var(--s3)">${err}</div>`;
        },
        () => {
          micBtn.classList.remove('is-recording');
          micBtn.innerHTML = '<span class="mic-dot"></span> 🎤 Falar de novo';
          rec = null;
        }
      );
    });
  };

  render();
  return box;
}

/* ---------- 5) views --------------------------------------------------- */
function frasesFragment(m) {
  const tpl = $('#tpl-frase'), frag = document.createDocumentFragment();
  m.frases_chave.forEach(f => {
    const el = tpl.content.cloneNode(true);
    $('[data-es]', el).textContent = f.es;
    $('[data-pron]', el).textContent = f.pronuncia;
    $('[data-pt]', el).textContent = f.pt;
    f.variacoes.forEach(v => { const li = document.createElement('li'); li.textContent = v; $('[data-var]', el).appendChild(li); });
    $('[data-speak]', el).addEventListener('click', () => speak(f.es));
    frag.appendChild(el);
  });
  return frag;
}

const Views = {
  estudar() {
    const m = modulo(); estado.marcar(m.id, 'estudou');
    const v = document.createElement('div');
    v.innerHTML = `
      <div class="view-head">
        <p class="eyebrow">Módulo ${String(estado.moduloAtual + 1).padStart(2, '0')}</p>
        <h1>${m.modulo}</h1><p>${m.objetivo}</p>
      </div>
      <h2 class="sec-title">Frases-chave</h2>
      <div id="frases"></div>
      <details class="acc"><summary>Palavras essenciais</summary>
        <div class="acc__body"><ul class="chips">${m.palavras_essenciais.map(p => `<li class="chip">${p}</li>`).join('')}</ul></div>
      </details>
      <details class="acc" open><summary>Padrão gramatical: ${m.padrao_gramatical.tema}</summary>
        <div class="acc__body"><ul>${m.padrao_gramatical.exemplos.map(e => `<li><code>${e}</code></li>`).join('')}</ul></div>
      </details>
      <div class="btn-row"><a class="btn" href="#/praticar">Praticar agora</a></div>`;
    v.querySelector('#frases').appendChild(frasesFragment(m));
    return v;
  },

  praticar() {
    const m = modulo();
    const v = document.createElement('div');
    v.innerHTML = `<div class="view-head"><p class="eyebrow">${m.modulo}</p><h1>Praticar</h1>
      <p>Flashcards, ditado e lacunas com correção na hora.</p></div>`;
    v.appendChild(sec('Flashcards', Flashcard(m.exercicios.flashcards, () => live('Flashcards concluídos'))));
    v.appendChild(sec('Ditado', Ditado(m.exercicios.ditado)));
    v.appendChild(sec('Lacunas', Lacunas(m.exercicios.lacunas)));
    return v;
  },

  simulador() {
    const v = document.createElement('div');
    v.appendChild(RolePlay(modulo().exercicios.role_play));
    return v;
  },

  fluencia() {
    const m = modulo();
    const v = document.createElement('div');
    v.innerHTML = `
      <div class="view-head">
        <p class="eyebrow">${m.modulo}</p>
        <h1>Fluência</h1>
        <p>Fala cada frase — o app reconhece e avalia palavra a palavra.</p>
      </div>`;
    v.appendChild(Fluencia(m.frases_chave));
    return v;
  },

  revisao() {
    const m = modulo();
    const v = document.createElement('div');
    v.innerHTML = `
      <div class="view-head"><p class="eyebrow">${m.modulo}</p><h1>Revisão espaçada</h1>
        <p>Mini-resumo e o que repetir em 4h e em 24h.</p></div>
      <details class="acc" open><summary>Em 4 horas</summary>
        <div class="acc__body"><ul>${m.revisao.em_4h.map(x => `<li>${x}</li>`).join('')}</ul></div></details>
      <details class="acc" open><summary>Em 24 horas</summary>
        <div class="acc__body"><ul>${m.revisao.em_24h.map(x => `<li>${x}</li>`).join('')}</ul></div></details>
      <div class="btn-row">
        <button class="btn" id="ag">Agendar lembretes</button>
        <button class="btn btn--ghost" id="prox">Próximo módulo</button>
      </div>`;
    $('#ag', v).addEventListener('click', async () => { await pedirNotificacao(); agendarRevisoes(m); live('Lembretes agendados'); });
    $('#prox', v).addEventListener('click', () => {
      estado.moduloAtual = (estado.moduloAtual + 1) % CONTEUDO.modulos.length;
      $('#seletor-modulo').value = String(estado.moduloAtual); estado.salvar();
      location.hash = '#/estudar';
    });
    return v;
  }
};

function sec(titulo, node) {
  const d = document.createElement('section'); d.style.margin = 'var(--s8) 0';
  const h = document.createElement('h2'); h.className = 'sec-title'; h.textContent = titulo;
  h.style.marginBottom = 'var(--s3)';
  d.append(h, node); return d;
}

/* ---------- 6) roteador ------------------------------------------------ */
const ROTAS = ['estudar', 'praticar', 'fluencia', 'simulador', 'revisao'];
function rotaAtual() { const r = location.hash.replace('#/', ''); return ROTAS.includes(r) ? r : 'estudar'; }
function navegar() {
  const rota = rotaAtual();
  document.documentElement.dataset.modulo = modulo().id; // cor de sinalização do módulo
  $$('.tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.rota === rota)));
  const view = $('#view'); view.innerHTML = '';
  view.appendChild(Views[rota]());
  $('#principal').focus();
}
window.addEventListener('hashchange', navegar);

/* ---------- 7) revisão / toaster / notificações ------------------------ */
function agendarRevisoes(m) {
  const base = Date.now();
  const nova = [
    { moduloId: m.id, tipo: '4h', quando: base + 4 * 3600e3, itens: m.revisao.em_4h },
    { moduloId: m.id, tipo: '24h', quando: base + 24 * 3600e3, itens: m.revisao.em_24h }
  ];
  estado.revisoes = estado.revisoes.filter(r => r.moduloId !== m.id).concat(nova);
  estado.salvar();
}
async function pedirNotificacao() {
  if ('Notification' in window && Notification.permission === 'default') {
    try { await Notification.requestPermission(); } catch {}
  }
}
function checarRevisoes() {
  const agora = Date.now();
  const devidas = estado.revisoes.filter(r => r.quando <= agora);
  if (!devidas.length) return;
  const r = devidas[0];
  const m = CONTEUDO.modulos.find(x => x.id === r.moduloId);
  mostrarToaster(m ? m.modulo : 'Revisão', r);
  estado.revisoes = estado.revisoes.filter(x => x !== r); estado.salvar();
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Hora de revisar · ' + (m ? m.modulo : ''), { body: r.itens[0] || 'Revise as frases-chave.' });
  }
}
function mostrarToaster(titulo, r) {
  const t = $('#toaster');
  t.hidden = false;
  t.innerHTML = `
    <h3>Revisão (${r.tipo}) · ${titulo}</h3>
    <ul>${r.itens.map(x => `<li>${x}</li>`).join('')}</ul>
    <div class="toaster__actions">
      <button class="btn" data-go>Revisar</button>
      <button class="btn btn--ghost" data-close>Depois</button>
    </div>`;
  $('[data-go]', t).addEventListener('click', () => { t.hidden = true; location.hash = '#/revisao'; });
  $('[data-close]', t).addEventListener('click', () => { t.hidden = true; });
}

/* ---------- progresso -------------------------------------------------- */
function renderProgresso() {
  const total = CONTEUDO.modulos.length * 3;
  let feitos = 0;
  CONTEUDO.modulos.forEach(m => { const p = estado.progresso[m.id] || {}; feitos += ['estudou', 'praticou', 'simulou'].filter(k => p[k]).length; });
  const pct = total ? Math.round(feitos / total * 100) : 0;
  $('#progress-fill').style.width = pct + '%';
  $('#progress-value').textContent = pct + '%';
  $('#progress-bar').setAttribute('aria-valuenow', String(pct));
  renderSelector();
}

function renderSelector() {
  const sel = $('#seletor-modulo');
  if (!sel || !CONTEUDO.modulos.length) return;
  const val = sel.value;
  sel.innerHTML = CONTEUDO.modulos.map((m, i) => {
    const p = estado.progresso[m.id] || {};
    const feitos = ['estudou', 'praticou', 'simulou'].filter(k => p[k]).length;
    const sufixo = feitos === 3 ? ' ✓' : feitos > 0 ? ` (${feitos}/3)` : '';
    return `<option value="${i}">${String(i + 1).padStart(2, '0')} · ${m.modulo}${sufixo}</option>`;
  }).join('');
  sel.value = val;
}

/* ---------- ecrã de boas-vindas ---------------------------------------- */
function telaBoasVindas(onStart) {
  const EMOJIS = ['🤝', '🗺️', '🍽️', '🏨', '🛍️', '🚨'];
  const v = document.createElement('div');
  v.className = 'welcome';
  const modItems = CONTEUDO.modulos.map((m, i) =>
    `<li>${EMOJIS[i] || '📌'} ${m.modulo}</li>`
  ).join('');
  v.innerHTML = `
    <div class="welcome__flag" role="img" aria-label="Bandeira da Espanha"></div>
    <div class="welcome__body">
      <p class="eyebrow">A0 → A1 · Viagem na Espanha</p>
      <h1 class="welcome__title">Espanhol de<br>Sobrevivência</h1>
      <p class="welcome__sub">6 módulos para passar bem na Espanha — do primeiro "hola" até pedir ajuda numa emergência.</p>
      <ul class="welcome__modules">${modItems}</ul>
      <button class="btn welcome__cta" id="btn-comecar">Começar agora →</button>
    </div>`;
  $('#btn-comecar', v).addEventListener('click', onStart);
  return v;
}

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

/* ---------- 8) boot ---------------------------------------------------- */
async function boot() {
  estado.carregar(); initTema();
  try {
    CONTEUDO = await (await fetch('conteudo.json')).json();
  } catch (e) {
    $('#view').innerHTML = '<div class="feedback is-error" style="margin-top:var(--s8);padding:var(--s5)">Não foi possível carregar o conteúdo.<br>Abra o app via servidor local ou acesse a versão publicada online.</div>';
    return;
  }

  // Seletor de módulos
  const sel = $('#seletor-modulo');
  sel.addEventListener('change', () => { estado.moduloAtual = +sel.value; estado.salvar(); navegar(); });

  renderProgresso(); // também chama renderSelector, que popula o sel
  sel.value = String(estado.moduloAtual);

  // Primeira visita: mostrar boas-vindas antes de navegar
  const primeiraVisita = !localStorage.getItem(DB_KEY);
  if (primeiraVisita) {
    const view = $('#view');
    view.innerHTML = '';
    view.appendChild(telaBoasVindas(() => {
      view.innerHTML = '';
      navegar();
    }));
  } else {
    navegar();
  }

  checarRevisoes();
  setInterval(checarRevisoes, 60e3);

  // PWA
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(() => {});
  // Carrega vozes de TTS (alguns navegadores populam de forma assíncrona)
  if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {};
}
document.addEventListener('DOMContentLoaded', boot);
