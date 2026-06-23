**ResourceCard** — one 80×112 sigil card per unit of a resource the player holds. Six fixed types, each with its own band color and letter-mark. Suspicion is the only animated one (alarm pulse) — it signals danger, never collect it on purpose.

```jsx
<div style={{ display: "flex", gap: 13 }}>
  <ResourceCard resource="money" />
  <ResourceCard resource="food" />
  <ResourceCard resource="cultists" />
  <ResourceCard resource="suspicion" />
</div>
```

Resources: `money` (gold) · `food` (green) · `cultists` (violet) · `prisoners` (iron blue) · `relics` (bronze) · `suspicion` (alarm red). Lay them in a horizontal scrolling hand.
