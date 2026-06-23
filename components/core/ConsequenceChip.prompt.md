**ConsequenceChip** — the colored outcome preview shown on every choice. Four kinds map to fixed meanings: `gain` (sage, resources won), `cost` (muted, resources spent), `threat` (red, Suspicion/Pressure rising), `ritual` (violet, ritual progress). You sign the text.

```jsx
<ConsequenceChip kind="gain">+2 Food</ConsequenceChip>
<ConsequenceChip kind="cost">−1 Money</ConsequenceChip>
<ConsequenceChip kind="threat">+1 Suspicion</ConsequenceChip>
<ConsequenceChip kind="ritual">Ritual +1</ConsequenceChip>
```

Group gains and costs into two rows inside a `ChoiceCard`. Use an em-dash chip (`—`) when a side is empty.
