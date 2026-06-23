# The Hidden Hand — UI Kit

An interactive recreation of the full game, built entirely from this design
system's component library (`EventCard`, `ChoiceCard`, `ResourceCard`,
`PressureBar`, `StatPill`, `Button`).

## Run it
Open `index.html`. It loads the compiled bundle (`_ds_bundle.js`) and renders
the playable flow:

1. **Start screen** — a face-down card backdrop with *New run* / *Load*.
2. **Game table** — draw an event (tap the card to open it), weigh the
   choices by their gain/cost ledger, and commit. Resources update in the
   hand, the log records each decision, Suspicion creeps toward collapse.
3. **Menu** — the ☰ popup mirrors the real game (Salvar / New run / Load /
   Pânico) and shows the running log.
4. **Game over** — reach the Suspicion limit and the door opens wrong.

## Files
- `index.html` — entry; mounts `window.HHApp`.
- `screens.jsx` — `App`, `StartScreen`, `AppHeader`, `MenuPopup`, `GameView`,
  `Hand`, `GameOver`, plus the choice-resolution logic.
- `data.js` — a sample event deck + initial resources, lifted from the real
  `data/eventPools.json`.

## Notes
This is a faithful cosmetic + interaction recreation, not the production
engine — ritual stages, escalation/brutalize upgrades, and deck reshuffling
are simplified. The visual language and component usage are exact.
