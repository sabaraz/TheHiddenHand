**ChoiceCard** — a selectable option on an opened event. The label is the decision in the player's voice; below it, a ledger splits gains (top) from costs (bottom) as `ConsequenceChip`s. Tone tints the label and hover border but every card hovers to red.

```jsx
<ChoiceCard
  label="Ensure survival at one person's expense"
  tone="danger"
  gains={[{ kind: "gain", text: "+3 Food" }]}
  costs={[{ kind: "cost", text: "−1 Cultists/Prisoners" }, { kind: "threat", text: "+1 Suspicion" }]}
/>
```

Tones: `neutral` | `danger` | `success` | `info`. Mark unaffordable choices `disabled`. Stack choices in a vertical list with generous gaps.
