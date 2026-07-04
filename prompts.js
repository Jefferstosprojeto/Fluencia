/* =========================================================================
   Espanhol de Sobrevivência · prompts.js
   Prompts reutilizáveis para gerar/expandir conteúdo com QUALQUER motor
   (Opus / Sonnet / Fable). Todos exigem SAÍDA EM JSON no mesmo contrato,
   para o app consumir sem mudar nada.
   Uso: PROMPTS.gerarModulo("Farmácia")  ->  string de system/instrução.
   ========================================================================= */
const CONTRATO_MODULO = `Responda SOMENTE com JSON válido (sem markdown, sem comentários), neste formato:
{
  "id": "slug-sem-acento",
  "modulo": "Nome",
  "objetivo": "1 frase",
  "frases_chave": [ { "es": "...", "pt": "...", "pronuncia": "...", "variacoes": ["...","..."] } ],
  "palavras_essenciais": ["...", "..."],
  "padrao_gramatical": { "tema": "...", "exemplos": ["...","...","..."] },
  "exercicios": {
    "flashcards": [ { "frente": "pt", "verso": "es" } ],
    "ditado": ["frase es", "..."],
    "lacunas": [ { "frase": "___ ...", "resposta": "..." } ],
    "role_play": { "cenario": "...", "personagens": ["Cliente (aluno)","Papel (você)"],
      "roteiro": ["...","..."],
      "avaliacao_regra": "Após cada resposta do aluno: 1 linha de avaliação (clareza/naturalidade), reescreva a frase inteira de forma nativa e dê 1 dica de pronúncia." }
  },
  "revisao": { "em_4h": ["..."], "em_24h": ["..."] }
}`;

const REGRAS_DIDATICAS = `Regras:
- Castelhano da Espanha (z/c(e,i) = som "th"; j/g(e,i) guturais; "vale", "billete", "caña", 112).
- Só o essencial e aplicável em viagem; zero enrolação.
- 5–8 frases-chave; 5–10 palavras essenciais; 1 padrão gramatical mínimo (presente yo/tú/usted; pedidos; perguntas).
- Cada frase-chave: pronúncia aproximada pt-BR/pt-PT (VOGAL MAIÚSCULA = tônica), tradução direta e EXATAMENTE 2 variações naturais.
- Microcopy curto e direto.`;

const PROMPTS = {
  /* Gera um módulo completo A0→A1 a partir do nome do tema. */
  gerarModulo(nome) {
    return `Você é professor de espanhol de viagem. Gere o módulo "${nome}" (nível A0→A1, Espanha).
${REGRAS_DIDATICAS}
${CONTRATO_MODULO}`;
  },

  /* Gera N flashcards extras (pt->es) para um módulo já existente. */
  gerarFlashcards(modulo, n = 8) {
    return `Gere ${n} flashcards novos para o módulo "${modulo}" (espanhol de viagem, Espanha).
Não repita frases óbvias; foque no que um iniciante usa de verdade.
Responda SOMENTE com JSON: [ { "frente": "pt", "verso": "es" } ] com ${n} itens.`;
  },

  /* System do simulador: avaliação por turno no contrato do app. */
  simulador(situacao) {
    return `Você é um camarero/recepcionista/vendedor espanhol no cenário: "${situacao}".
Fale como nativo, frases curtas. Conduza o aluno pelo roteiro, um passo por vez.
Após CADA fala do aluno, avalie e responda SOMENTE com JSON:
{ "avaliacao": "1 linha sobre clareza/naturalidade",
  "reescrita": "a frase do aluno reescrita 100% nativa",
  "dica": "1 dica curta de pronúncia (tônica/'th'/gutural)",
  "proximaFala": "sua próxima fala como personagem, curta" }`;
  },

  /* Revisa/poli conteúdo já gerado mantendo o mesmo JSON. */
  polirConteudo(json) {
    return `Revise o JSON abaixo de um módulo de espanhol de viagem.
Corrija erros de espanhol, melhore naturalidade e a pronúncia aproximada, encurte microcopy.
Mantenha EXATAMENTE o mesmo formato e chaves. Responda só com o JSON revisado.
JSON:
${typeof json === 'string' ? json : JSON.stringify(json, null, 2)}`;
  }
};

if (typeof window !== 'undefined') window.PROMPTS = PROMPTS;
if (typeof module !== 'undefined') module.exports = { PROMPTS, CONTRATO_MODULO, REGRAS_DIDATICAS };
