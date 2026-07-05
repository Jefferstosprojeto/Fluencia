"""
Gera content/es/negocios.json com 7 módulos via Anthropic API.

Uso:
    pip install anthropic
    set ANTHROPIC_API_KEY=sk-ant-...
    python scripts/gerar_negocios.py

Nota: o ficheiro content/es/negocios.json já existe com conteúdo de
produção escrito manualmente. Este script serve como referência para
regenerar ou expandir o conteúdo via API no futuro.
"""

import json
import os
import time

import anthropic

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

CONTRATO = '''Responda SOMENTE com JSON válido (sem markdown, sem comentários):
{
  "id": "slug-sem-acento",
  "modulo": "Nome do módulo",
  "objetivo": "1 frase de objetivo",
  "frases_chave": [
    {
      "es": "Frase em espanhol",
      "pt": "Tradução em português",
      "pronuncia": "VOGAL MAIÚSCULA = tônica. ex: BUÊ-nos DÍ-as",
      "variacoes": ["variação 1", "variação 2"]
    }
  ],
  "palavras_essenciais": ["palavra1", "palavra2"],
  "padrao_gramatical": {
    "tema": "Nome do padrão gramatical",
    "exemplos": ["exemplo1", "exemplo2", "exemplo3"]
  },
  "exercicios": {
    "flashcards": [
      { "frente": "PT", "verso": "ES" }
    ],
    "ditado": ["frase completa em espanhol", "..."],
    "lacunas": [
      { "frase": "____ frase com lacuna", "resposta": "palavra" }
    ],
    "role_play": {
      "cenario": "Descrição do cenário",
      "personagens": ["Profissional (aluno)", "Contraparte (você)"],
      "roteiro": ["passo 1", "passo 2", "passo 3", "passo 4"],
      "avaliacao_regra": "Após cada resposta: 1 linha (clareza/formalidade), reescreva nativo, 1 dica pronúncia."
    }
  },
  "revisao": {
    "em_4h": ["tarefa 1", "tarefa 2"],
    "em_24h": ["tarefa 1", "tarefa 2"]
  }
}'''

REGRAS = """Regras de qualidade:
- Espanhol neutro (serve Espanha e América Latina); notas onde diferem significativamente.
- Registo formal/profissional; usar "usted" como padrão no role-play.
- 5-7 frases-chave, 6-10 palavras essenciais, 1 padrão gramatical de cortesia.
- Cada frase-chave: pronúncia aproximada (VOGAL MAIÚSCULA = tônica), tradução PT,
  EXACTAMENTE 2 variações naturais e diversas (não só sinónimos).
- Padrão gramatical: condicional de cortesia (quisiera/podría/podrían) ou subjuntivo básico.
- Role-play com tensão real — negociação, desacordo cortês, pressão de tempo, obstáculo.
- Mínimo: 6 flashcards, 4 ditados (frases completas), 4 lacunas."""

MODULOS = [
    (
        "presentaciones",
        "Apresentações Profissionais",
        "Feira de negócios internacional — apresentar-se, empresa, cargo, trocar cartão de visita, propor reunião",
    ),
    (
        "reuniones",
        "Reuniões e Conferências",
        "Reunião de equipa — abrir, concordar, discordar com elegância, pedir esclarecimento, agendar seguimento",
    ),
    (
        "negociacion",
        "Negociação e Propostas",
        "Fechar contrato de serviços — propor preço, condições, responder a contraproposta, fechar ou gerir impasse",
    ),
    (
        "comunicacion-escrita",
        "Comunicação Escrita",
        "Ditar email formal de resposta a cliente e mensagem WhatsApp profissional com pedido de reunião",
    ),
    (
        "telefono",
        "Telefone e Videochamada",
        "Chamada de negócios — atender, transferir, deixar recado, gerir ruído na linha, videochamada com problemas",
    ),
    (
        "almuerzo-negocios",
        "Almoço de Negócios",
        "Hospitalidade corporativa — convite, brinde, restrições alimentares, pagar a conta, retomar negócios",
    ),
    (
        "viaje-corporativo",
        "Viagem Corporativa",
        "Check-in hotel corporativo, pedir fatura com IVA, táxi para aeroporto, guardar bagagem, nota de despesas",
    ),
]


def gerar_modulo(slug: str, nome: str, cenario: str) -> dict:
    """Gera um módulo de negócios via Anthropic API."""
    prompt = f"""És um professor experiente de espanhol de negócios a nível B1.
Gera o módulo "{nome}" para profissionais que precisam de sobrevivência corporativa em espanhol.

Contexto do cenário principal de role-play:
{cenario}

{REGRAS}

{CONTRATO}"""

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=2500,
        messages=[{"role": "user", "content": prompt}],
    )

    texto = response.content[0].text.strip()
    # Remover possíveis blocos de markdown se o modelo os incluir
    if texto.startswith("```"):
        linhas = texto.splitlines()
        texto = "\n".join(linhas[1:-1])

    modulo = json.loads(texto)
    modulo["id"] = slug  # garantir slug correcto
    return modulo


def main() -> None:
    modulos = []
    for slug, nome, cenario in MODULOS:
        print(f"A gerar: {nome}...")
        try:
            modulo = gerar_modulo(slug, nome, cenario)
            frases = len(modulo.get("frases_chave", []))
            cards = len(modulo.get("exercicios", {}).get("flashcards", []))
            print(f"  OK — {frases} frases, {cards} flashcards")
            modulos.append(modulo)
        except json.JSONDecodeError as exc:
            print(f"  ERRO — JSON inválido: {exc}")
            raise
        except Exception as exc:
            print(f"  ERRO — {exc}")
            raise
        time.sleep(1)  # respeitar rate limit da API

    output = {"modulos": modulos}
    path = "content/es/negocios.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"\nGuardado em {path} — {len(modulos)} módulos")

    # Validar estrutura mínima
    print("\nValidação:")
    assert len(output["modulos"]) == 7, "Faltam módulos"
    for m in output["modulos"]:
        assert len(m["frases_chave"]) >= 5, f'{m["id"]}: frases insuficientes'
        ex = m["exercicios"]
        assert len(ex["flashcards"]) >= 6, f'{m["id"]}: flashcards insuficientes'
        assert len(ex["ditado"]) >= 4, f'{m["id"]}: ditados insuficientes'
        assert len(ex["lacunas"]) >= 4, f'{m["id"]}: lacunas insuficientes'
        assert len(ex["role_play"]["roteiro"]) >= 4, f'{m["id"]}: roteiro curto'
    print(f"OK — {len(output['modulos'])} módulos válidos")


if __name__ == "__main__":
    main()
