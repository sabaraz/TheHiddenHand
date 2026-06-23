# Checklist de revisão — Seleção interativa de recursos

> **Princípio inviolável:** o CSS **não contém regra de jogo**. A *lógica* é a única
> fonte da verdade e diz "esta opção está pronta porque o jogador escolheu os
> recursos necessários". O CSS apenas **reflete** esse estado (habilita/desabilita,
> muda aparência). O sistema **nunca** escolhe o recurso pelo jogador, e a interface
> permanece honesta: a opção só *parece* clicável quando a escolha de consumo já foi
> feita corretamente.

---

## 1. Modelo de estado (lógica)
- [ ] Existe um estado de **seleção em curso** separado do estado do jogo, ex.:
      `selection = { choiceId, picks: { Money: 0, Food: 0, Cultists: 0, Prisoners: 0, Relics: 0, Suspicion: 0 } }`.
- [ ] `picks` representa **o que o jogador apontou na mão**, não o que o sistema decidiu.
- [ ] Abrir uma opção (ou outro evento) **reseta** `selection` — nada vaza entre escolhas.
- [ ] O estado do jogo (`resources`) só muda no **commit**, nunca durante a seleção.

## 2. Requisito do custo (lógica, declarativo)
- [ ] Cada `choice.cost` é traduzido para um **requisito normalizado** que conhece
      as substituições permitidas, ex.:
      `requirement = [{ need: 1, payableWith: ["Cultists","Prisoners"] }, { need: 2, payableWith: ["Money","Relics"] }]`.
- [ ] `humanPower` vira `payableWith: ["Cultists","Prisoners"]`.
- [ ] `allowRelicSubstitution` **adiciona** `"Relics"` aos `payableWith` daquele item.
- [ ] Custos que **consomem Suspicion** (eventos futuros) entram como item próprio
      com `payableWith: ["Suspicion"]` — modelado, mesmo que ainda não usado.

## 3. Prontidão / validação (lógica — "a opção está pronta")
- [ ] Função pura `isSelectionComplete(requirement, picks, resources)` que retorna
      `true` **somente** quando cada item do requisito está coberto pelos `picks`.
- [ ] `picks` nunca pode exceder o que existe na mão (`picks[r] <= resources[r]`).
- [ ] Um mesmo sigilo **não é contado duas vezes** para dois itens diferentes.
- [ ] **Sobra/insuficiência** são distinguidas: "ainda falta 1" ≠ "selecionou demais".
- [ ] `canEverAfford(requirement, resources)` (independente dos `picks`) decide se a
      opção é **impossível** — esse é o **único** motivo legítimo de `disabled`.

## 4. Separação CSS × regra (o coração do pedido)
- [ ] O CSS **não** lê `resources`, `cost`, nem faz contas. Ele só recebe **flags**
      já calculadas pela lógica: `data-state="locked | ready | impossible"`.
- [ ] Não há `:disabled` decidindo regra — o atributo/flag vem da lógica; o CSS
      apenas estiliza `[data-state="impossible"]`, `[data-state="ready"]`, etc.
- [ ] Nenhuma cor/borda do CSS **revela o efeito** da escolha (tom danger/success
      foi removido) — aparência reflete **prontidão**, não consequência.
- [ ] Trocar o tema/CSS **não muda** quem pode pagar o quê (prova da separação).

## 5. Confirmação (commit — lógica)
- [ ] O botão **Confirmar** só dispara quando `isSelectionComplete` é `true`.
- [ ] O commit debita **exatamente os `picks`** (o que o jogador apontou), aplica
      `effects`, registra no log **qual recurso foi consumido**, e avança o turno.
- [ ] Após o commit, `selection` é limpo e a carta segue seu `destination`.
- [ ] **Não existe** caminho que debite recurso sem passar pela seleção do jogador.

## 6. Honestidade da interface (invariantes)
- [ ] Opção possível mas **ainda não selecionada** → aparência "locked", **não**
      clicável para confirmar (mas clicável para *iniciar* a seleção).
- [ ] Opção **impossível** → aparência "impossible" + desabilitada, com motivo legível.
- [ ] O jogador **sempre** vê o que vai gastar **antes** de confirmar (sem surpresa).
- [ ] Nunca o sistema "completa" a seleção sozinho para destravar o botão.

## 7. Acessibilidade
- [ ] Sigilos selecionáveis são focáveis (teclado) e têm `aria-pressed`/`aria-selected`.
- [ ] O botão Confirmar usa `aria-disabled` coerente com o estado da lógica.
- [ ] Estado "falta N de X" é anunciado (`aria-live`) ao mudar a seleção.

## 8. Casos de borda
- [ ] Custo zero → opção já "ready" sem seleção.
- [ ] Custo com substituição quando há **apenas uma** forma de pagar → ainda exige
      o clique do jogador (honestidade), mas pode pré-destacar a única opção.
- [ ] Mão muda no meio (efeito que remove recurso) → `selection` é revalidada.
- [ ] Deselecionar volta o estado para "locked" corretamente.

## 9. Testes (lógica pura, sem DOM)
- [ ] `isSelectionComplete` coberto: incompleto, exato, excedente.
- [ ] `canEverAfford` coberto: possível por substituição vs impossível.
- [ ] humanPower pago por Cultist, por Prisoner, e misto.
- [ ] Relic substituindo Money; Suspicion como custo.
- [ ] Commit debita exatamente os `picks` e nada além.

---

### Resumo da arquitetura-alvo
```
lógica  ──►  estado derivado: data-state = locked | ready | impossible
                     │
CSS    ──────────────┘  (só estiliza o estado; não calcula nada)
```
A lógica **decide**; o CSS **mostra**. Se um dia o CSS sumir, as regras continuam
intactas — esse é o teste final da separação.
