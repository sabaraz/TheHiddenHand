# Tutorial de Criacao de Cartas Evento - The Hidden Hand

Guia para times de lore e conteudo trabalharem fora da IDE, alinhado ao estado atual do projeto.

Este documento transforma uma ideia narrativa em um bloco JSON compativel com o motor atual. Ele tambem marca os pontos que exigem suporte de desenvolvimento, como novos gatilhos de cartas obrigatorias.

## Como Usar

1. Preencha o questionario da carta.
2. Cole as respostas no Prompt Gerador ao final deste documento.
3. A IA deve devolver apenas um objeto JSON valido.
4. Entregue esse JSON para ser inserido em `data/eventPools.json`.
5. Se a carta for `mandatory`, tambem entregue a condicao de disparo para implementacao em `rules/mandatoryRules.js`.

## Glossario do Motor Atual

### Tipos de Carta (`kind`)

| Valor | Uso atual |
| --- | --- |
| `common` | Evento comum do ciclo. |
| `mandatory` | Evento disparado por uma regra em `rules/mandatoryRules.js`. |
| `ritual` | Evento ligado a inicio, avanco, falha ou manutencao do ritual. |
| `opportunity` | Evento unico, controlado por `opportunityUsed` e `removed`. |
| `apocalyptic` | Evento de escalacao; entra quando `apocalypseNear` esta ativo ou quando foi chamado por upgrade/brutalize. |

### Comportamento no Deck (`cycleBehavior`)

| Valor | Uso atual |
| --- | --- |
| `persistent` | Pode voltar em ciclos futuros enquanto nao estiver em `removed`. |
| `discardable` | Entra como carta descartavel do ciclo; pode reaparecer em ciclos futuros se nao for removida. |
| `scalable` | Carta persistente com prioridade de escalacao; normalmente tem escolha com `upgrade` ou `brutalize`. |
| `unique` | Usada principalmente com `kind: "opportunity"`. Para unicidade real, inclua efeito `opportunityUsed`. |
| `apocalyptic` | Permanente, mas filtrada ate `apocalypseNear` ou upgrade/brutalize liberar. |

### Recursos

| Recurso | Papel |
| --- | --- |
| `Money` | Custo universal, compra, suborno, logistica. |
| `Food` | Sobrevivencia do grupo. Se `Food <= 0`, dispara starvation. |
| `Cultists` | Seguidores. No estado atual, `Cultists == 0` nao encerra automaticamente a partida. |
| `Prisoners` | Capturados, usados em custos diretos ou como pagamento de `humanPower`. |
| `Relics` | Objetos antigos. Com 2 ou mais, podem ativar risco apocaliptico no inicio de ciclo. |
| `Suspicion` | Alerta externo. Se `Suspicion >= 5`, dispara police raid. |

### Custo Virtual: `humanPower`

`humanPower` nao e um recurso salvo no estado. Ele representa "um corpo disponivel".

No fluxo atual de UI, o jogador escolhe cards concretos no footer. Um custo `{ "humanPower": 1 }` pode ser pago com `Cultists` ou `Prisoners`, e a engine debita exatamente o que o jogador selecionou.

Nao escreva no JSON qual dos dois sera gasto. Isso e decisao do jogador durante a partida.

### Pick de Recursos no Footer

O projeto atual usa um fluxo de "card pick" no footer:

- Ao abrir uma carta, os cards de recurso ficam selecionaveis.
- Escolhas pagas ficam em estado visual `needs-resources` ate que a selecao pague exatamente o custo.
- Escolhas sem custo ficam bloqueadas se houver recurso selecionado.
- Ao clicar numa escolha `ready`, a engine valida a selecao e debita exatamente os recursos escolhidos.
- CSS apenas estiliza estados; regra e debito ficam em JavaScript (`selectionModel`, `app`, `gameEngine`).

## Destinos (`destination`)

| Valor | Comportamento atual |
| --- | --- |
| `discard` | Para cartas nao-mandatory, e o comportamento padrao ao final da resolucao. A carta vai para o descarte do ciclo. |
| `remove` | Adiciona o `id` da carta em `removed`; ela nao deve voltar em ciclos futuros. |
| `defer` | Adia a carta. Non-mandatory entra em `deferredEvents`; mandatory entra em `deferredMandatoryEvents`. |
| `return` | Hoje tem tratamento especial apenas para `mandatory`: a carta voltara se o gatilho continuar ativo. Em non-mandatory, cai no descarte. Nao use para loop imediato em carta comum sem alterar o motor. |
| `upgrade` | Mapeia esta carta para `upgradeTo`; ciclos futuros usam a versao upgraded. |
| `brutalize` | Como `upgrade`, mas respeita o limite de brutalizacao do perfil de ciclo e incrementa `brutalizedEvents`. |
| `stabilize` | Reduz `pressure` em 1. Em non-mandatory, depois cai no descarte; nao remove permanentemente. |

Regra pratica:

- Para carta comum reaparecer depois, use `defer` ou deixe como `persistent` sem `remove`.
- Para carta comum sair de vez, use `remove`.
- Para carta comum virar versao pior, use `upgrade` ou `brutalize` com `upgradeTo`.
- Nao trate `return` como loop imediato para carta comum no estado atual do projeto.

## Efeitos (`effects`)

| Tipo | Campos | Comportamento atual |
| --- | --- | --- |
| `resource` | `resource`, `amount` | Soma ou subtrai recurso. |
| `pressure` | `amount` | Soma/subtrai `pressure`. Se `pressure >= 3`, em resolucao posterior vira `Suspicion` pela intensidade do perfil. |
| `flag` | `flag`, `value` | Marca um valor booleano no estado. |
| `opportunityUsed` | `eventId` | Marca uma oportunidade como usada. Necessario para oportunidades realmente unicas. |
| `deferEvent` | `eventId` | Adiciona outro evento em `deferredEvents`. |
| `startRitual` | `ritualId` | Inicia um ritual especifico. |
| `startSelectedRitual` | nenhum | Inicia o ritual escolhido no estado da partida. |
| `advanceRitual` | `unsafe` opcional | Avanca o ritual. `unsafe: true` avanca 2 passos; nao rola chance de falha automaticamente. |
| `advanceRitualChance` | `successChance` | Tenta avancar ritual por probabilidade. Se falhar, chama falha ritual. Nao serve para chance generica de ganhar recurso. |
| `ritualFailure` | nenhum | Adiciona falha ritual e aplica penalidade da etapa. |
| `ritualStabilize` | nenhum | Reduz uma falha ritual e tambem reduz `pressure` em 1. |
| `stabilizeCycle` | `amount` | Reduz `pressure` e `Suspicion` pelo mesmo valor. |

Se voce precisa de um efeito probabilistico fora do ritual, ele nao existe genericamente hoje. Modele de forma deterministica ou solicite implementacao no motor.

## Tom e Linguagem

### Titulo (`title`)

- 2 a 4 palavras.
- Evocativo, nao explicativo.
- Prefira substantivos e imagens concretas.
- Bons exemplos: `Gray Market`, `Door Knock`, `Long Tongue`, `Something Old`.
- Evite: `The Police Arrives`, `You Need Food`, `Cultist Recruitment Event`.

### Corpo (`body`)

- 1 a 2 frases.
- Terceira pessoa, presente.
- Frio, clinico ou dissociado.
- Implicacao acima de explicacao.
- Pode ter detalhe sensorial concreto.
- Evite julgamento moral explicito e urgencia melodramatica.

Bons exemplos:

- `Boots cross the threshold before anyone remembers to lock the door.`
- `The cabinets are bare. Those sharing the space look at one another with calculating eyes.`
- `A neighbor has been saying things. Not accusations yet - just observations with a particular shape.`

### Labels das Escolhas (`label`)

- Frase de acao narrativa.
- 4 a 12 palavras como regra geral.
- Evite mencionar recursos diretamente, salvo quando isso for a acao narrativa natural.
- Nao escreva `Pay 2 Money`, `Use humanPower`, `Choose this option`.

Bons exemplos:

- `Send the most forgettable faces`
- `Apply quiet pressure after dark`
- `Spread it thin before envy organizes`

## Questionario de Criacao

Preencha um questionario por carta.

### A. Identidade

1. Titulo:
2. Body:
3. Tipo (`kind`): `common`, `mandatory`, `ritual`, `opportunity`, `apocalyptic`
4. Comportamento (`cycleBehavior`): `persistent`, `discardable`, `scalable`, `unique`, `apocalyptic`
5. Tags:
6. A carta exige ritual ativo? Se sim, `requiresActiveRitual: true`.
7. Se for escalavel, qual e o `id` da versao pior?

Tags usadas no projeto atual incluem:

`money`, `food`, `cult`, `suspicion`, `ritual`, `escalation`, `relic`, `apocalyptic`, `loyalty`.

Voce pode propor novas tags, mas elas devem ser consistentes e em lowercase.

### B. Escolhas

Repita para cada escolha. Recomenda-se 2 ou 3 escolhas por carta.

1. Label:
2. Custo:
   - Sem custo, ou
   - `Money`, `Food`, `Cultists`, `Prisoners`, `Relics`, `Suspicion`, `humanPower`
3. Relics podem substituir deficit de recursos comuns? (`allowRelicSubstitution: true`)
4. Esta escolha usa custo atual da etapa ritual? (`usesRitualCost: true`)
5. Efeitos em linguagem livre:
6. Destino:
   - `discard`, `remove`, `defer`, `return`, `upgrade`, `brutalize`, `stabilize`
7. Se destino for `upgrade` ou `brutalize`, informe `upgradeTo`.
8. Tom (`tone`): `success`, `info`, `danger`

### C. Mandatory

Preencha apenas se `kind: "mandatory"`.

1. Qual condicao dispara a carta?
   - Exemplo: `Food <= 0`
   - Exemplo: `Suspicion >= 5`
   - Exemplo: soma de recursos nao-Suspicion >= 15
2. Essa condicao ja existe em `rules/mandatoryRules.js`?
3. Se nao existe, descreva claramente a regra para o dev implementar.

Importante: o gatilho de mandatory nao vive no JSON da carta. Ele precisa ser implementado em codigo.

### D. Analise de Repeticao

Preencha se alguma escolha usa `defer`, `return`, `upgrade` ou `brutalize`.

1. O que impede o jogador de repetir essa escolha sem custo?
2. Que recurso, estado ou risco cresce com a repeticao?
3. A carta tem pelo menos uma saida real (`remove`, `discard`, ou uma escolha que resolva o gatilho mandatory)?
4. Se usa `return` em carta comum, confirme: voce quer alterar o motor? No estado atual, `return` nao cria loop imediato para non-mandatory.

## Checklist Antes de Gerar JSON

- O titulo tem 2 a 4 palavras e nao explica literalmente o evento.
- O body tem 1 a 2 frases no tom do jogo.
- Labels sao acoes narrativas, nao instrucoes mecanicas.
- A carta tem 2 ou 3 escolhas.
- A carta tem pelo menos uma saida real.
- `opportunity` usa `cycleBehavior: "unique"` e inclui `opportunityUsed` em escolhas que coletam/resolvem a oportunidade.
- `requiresActiveRitual` aparece apenas quando a carta realmente depende de ritual ativo.
- `usesRitualCost` aparece apenas em escolha de avanco ritual.
- `upgrade` e `brutalize` incluem `upgradeTo`.
- `return` nao e usado como loop imediato em carta comum.
- Mandatory tem gatilho descrito para `mandatoryRules.js`.
- Nenhum efeito probabilistico generico foi inventado fora dos tipos existentes.

## Schema de Saida

A IA deve retornar um objeto JSON com esta forma. Campos opcionais devem ser omitidos quando nao usados.

```json
{
  "id": "kebab-case-unico",
  "title": "Short Title",
  "kind": "common",
  "cycleBehavior": "persistent",
  "tags": ["tag"],
  "body": "Narrative text.",
  "requiresActiveRitual": true,
  "choices": [
    {
      "id": "choice-id",
      "label": "Narrative action label",
      "cost": {
        "Money": 1,
        "humanPower": 1
      },
      "allowRelicSubstitution": true,
      "usesRitualCost": true,
      "effects": [
        {
          "type": "resource",
          "resource": "Money",
          "amount": 1
        }
      ],
      "destination": "discard",
      "upgradeTo": "worse-event-id",
      "tone": "info"
    }
  ]
}
```

Nao copie esse exemplo literalmente: ele mostra todos os campos possiveis juntos. Na carta real, omita o que nao se aplica.

## Valores Permitidos

```text
kind:
common, mandatory, ritual, opportunity, apocalyptic

cycleBehavior:
persistent, discardable, scalable, unique, apocalyptic

destination:
discard, remove, defer, return, upgrade, brutalize, stabilize

tone:
success, info, danger

resources:
Money, Food, Cultists, Prisoners, Relics, Suspicion

virtual cost:
humanPower

effect.type:
resource, pressure, flag, opportunityUsed, deferEvent,
startRitual, startSelectedRitual, advanceRitual,
advanceRitualChance, ritualFailure, ritualStabilize,
stabilizeCycle
```

## Prompt Gerador

Cole o bloco abaixo em uma IA, substituindo os campos entre colchetes.

```text
Voce e um assistente tecnico do jogo The Hidden Hand.
Gere uma carta evento em JSON valido para o estado atual do projeto.

Retorne apenas o objeto JSON. Nao use markdown. Nao use comentarios. Nao use null.

Regras obrigatorias:
1. IDs em kebab-case, unicos, sem espacos e sem maiusculas.
2. kind deve ser um destes: common, mandatory, ritual, opportunity, apocalyptic.
3. cycleBehavior deve ser um destes: persistent, discardable, scalable, unique, apocalyptic.
4. destination deve ser um destes: discard, remove, defer, return, upgrade, brutalize, stabilize.
5. Se destination for upgrade ou brutalize, incluir upgradeTo.
6. Se a carta for opportunity, usar cycleBehavior unique e incluir opportunityUsed nas escolhas que resolvem/coletam a oportunidade.
7. Se requiresActiveRitual for falso, omitir o campo.
8. Se allowRelicSubstitution for falso, omitir o campo.
9. Se usesRitualCost for falso, omitir o campo.
10. Nao inventar effect.type fora da lista permitida.
11. Nao usar return como loop imediato para carta comum. Se a intencao for reaparecer no proximo ciclo, usar defer.
12. advanceRitualChance e apenas para ritual; nao usar como chance generica de ganhar recurso.

Contexto do motor atual:
- humanPower pode ser pago com Cultists ou Prisoners; o jogador escolhe cards concretos no footer.
- pressure >= 3 vira Suspicion conforme intensidade do ciclo.
- Food <= 0 dispara mandatory-starvation.
- Suspicion >= 5 dispara mandatory-police-raid.
- soma de recursos nao-Suspicion >= 15 dispara mandatory-greed.
- Mandatory precisa de trigger em codigo; se for nova mandatory, inclua uma nota separada depois do JSON? Nao. Retorne apenas o JSON e deixe o trigger no briefing de entrada.

Briefing da carta:
Titulo: [PREENCHER]
Body: [PREENCHER]
kind: [PREENCHER]
cycleBehavior: [PREENCHER]
tags: [PREENCHER]
requiresActiveRitual: [sim/nao]
versao upgraded/brutal, se houver: [PREENCHER ou nao aplicavel]

Escolha 1:
Label: [PREENCHER]
Custo: [PREENCHER ou sem custo]
allowRelicSubstitution: [sim/nao]
usesRitualCost: [sim/nao]
Efeitos: [PREENCHER]
Destino: [PREENCHER]
upgradeTo, se aplicavel: [PREENCHER]
Tom: [PREENCHER]

Escolha 2:
Label: [PREENCHER]
Custo: [PREENCHER ou sem custo]
allowRelicSubstitution: [sim/nao]
usesRitualCost: [sim/nao]
Efeitos: [PREENCHER]
Destino: [PREENCHER]
upgradeTo, se aplicavel: [PREENCHER]
Tom: [PREENCHER]

Escolha 3, se houver:
Label: [PREENCHER]
Custo: [PREENCHER ou sem custo]
allowRelicSubstitution: [sim/nao]
usesRitualCost: [sim/nao]
Efeitos: [PREENCHER]
Destino: [PREENCHER]
upgradeTo, se aplicavel: [PREENCHER]
Tom: [PREENCHER]
```

## Exemplo Compativel

Briefing:

- Titulo: Familiar Face
- Body: A man who left two months ago is back. He waits where the hall light cannot reach his eyes.
- kind: common
- cycleBehavior: persistent
- tags: cult, loyalty, suspicion
- requiresActiveRitual: nao

JSON:

```json
{
  "id": "familiar-face",
  "title": "Familiar Face",
  "kind": "common",
  "cycleBehavior": "persistent",
  "tags": ["cult", "loyalty", "suspicion"],
  "body": "A man who left two months ago is back. He waits where the hall light cannot reach his eyes.",
  "choices": [
    {
      "id": "familiar-return",
      "label": "Let him return without ceremony",
      "cost": {
        "Food": 1
      },
      "effects": [
        {
          "type": "resource",
          "resource": "Cultists",
          "amount": 1
        }
      ],
      "destination": "discard",
      "tone": "success"
    },
    {
      "id": "familiar-question",
      "label": "Question him privately before deciding",
      "effects": [
        {
          "type": "resource",
          "resource": "Suspicion",
          "amount": -1
        },
        {
          "type": "pressure",
          "amount": 1
        }
      ],
      "destination": "discard",
      "tone": "info"
    },
    {
      "id": "familiar-turn-away",
      "label": "Turn him away at the door",
      "effects": [
        {
          "type": "pressure",
          "amount": 1
        }
      ],
      "destination": "defer",
      "tone": "danger"
    }
  ]
}
```

## Onde o JSON Entra

Para `common`, `ritual`, `opportunity` e `apocalyptic`:

- Inserir no array `events` de `data/eventPools.json`.

Para `mandatory`:

- Inserir no array `mandatory` de `data/eventPools.json`.
- Tambem implementar o gatilho em `rules/mandatoryRules.js`.

Exemplo de briefing para dev:

```text
Adicionar mandatory:
id: mandatory-water-leak
shouldFire: state.flags.waterLeak === true
```

## Resumo de Cuidado

Se a carta depende de uma regra que nao existe no motor, nao esconda isso no texto. Marque como "precisa de implementacao".

O JSON pode ser valido e ainda assim nao fazer o que o time imaginou. Os casos mais comuns:

- usar `return` esperando loop imediato em carta comum;
- usar `advanceRitualChance` para chance de recurso;
- esquecer `opportunityUsed` em oportunidade;
- criar mandatory sem gatilho em `mandatoryRules.js`;
- presumir derrota automatica por `Cultists == 0`;
- presumir que `tone` controla a UI principal.
