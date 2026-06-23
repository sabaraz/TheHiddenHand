**EventCard** — the tarot-proportioned (1 : 1.414) card at the center of the table. Closed, it shows a kind kicker, a heavy display title, summary body, and a "toque para abrir" hint, with a gilt edge. Open, the edge turns threat-red and classification `Tag`s appear; pair it with a vertical list of `ChoiceCard`s.

```jsx
<EventCard
  kind="mandatory"
  title="Empty Shelves"
  body="The cabinets are bare. Those sharing the space look at one another with calculating eyes."
  tags={["food", "apocalyptic"]}
  open
/>
```

Titles are terse and declarative; body copy is third-person, present tense, ominous. Keep the aspect ratio — it reads as a drawn card.
