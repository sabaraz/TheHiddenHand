/* The Hidden Hand — sample event deck + initial state for the UI kit.
   Lifted from the real eventPools.json so the recreation plays true.
   Each choice declares `cost` (paid), `effects` (resource/pressure deltas),
   and a `tone`. humanPower spends a Prisoner first, else a Cultist. */
(function () {
  window.HH_INITIAL = {
    Money: 3, Food: 3, Cultists: 2, Prisoners: 0, Relics: 0, Suspicion: 0,
  };

  window.HH_EVENTS = [
    {
      id: "begging-bowl", kind: "common", title: "Day Work",
      tags: ["money", "food"],
      body: "Keeping a low profile means blending in. There is always work for someone willing not to ask questions.",
      choices: [
        { id: "stay", label: "Stay out of sight today", tone: "info", effects: { Pressure: 1 } },
        { id: "send", label: "Send the most forgettable faces", tone: "success", cost: { humanPower: 1 }, effects: { Money: 2, Food: 1 } },
        { id: "long", label: "Work the longer route, risk the extra hours", tone: "danger", cost: { humanPower: 1 }, effects: { Money: 3, Food: 1, Suspicion: 1 } },
      ],
    },
    {
      id: "cellar-door", kind: "common", title: "The Back Room",
      tags: ["cult", "food"],
      body: "Someone below the floor promises anything to see daylight again.",
      choices: [
        { id: "ignore", label: "Leave them — let the noise be their problem", tone: "danger", effects: { Suspicion: 1 } },
        { id: "keep", label: "Feed and maintain the arrangement", tone: "info", cost: { Food: 1 }, effects: { Prisoners: 1 } },
        { id: "convert", label: "Let their desperation become allegiance", tone: "success", cost: { Food: 1, humanPower: 1 }, effects: { Cultists: 1, Suspicion: 1 } },
      ],
    },
    {
      id: "street-sermon", kind: "common", title: "Coded Words",
      tags: ["cult", "suspicion"],
      body: "The right sentence, spoken in the right place, lodges itself in a stranger's thoughts for days.",
      choices: [
        { id: "watch", label: "Say nothing today, watch instead", tone: "info", effects: { Pressure: 1 } },
        { id: "preach", label: "Speak obliquely at the edge of a crowd", tone: "info", effects: { Cultists: 1, Suspicion: 1 } },
        { id: "coded", label: "Leave coded notes with the right people", tone: "success", cost: { Money: 1 }, effects: { Cultists: 1 } },
      ],
    },
    {
      id: "mandatory-starvation", kind: "mandatory", title: "Empty Shelves",
      tags: ["food", "apocalyptic"],
      body: "The cabinets are bare. Those sharing the space look at one another with calculating eyes.",
      choices: [
        { id: "cache", label: "Break open the emergency reserve", tone: "success", cost: { Money: 1 }, effects: { Food: 2 } },
        { id: "thin", label: "Ensure survival at one person's expense", tone: "danger", cost: { humanPower: 1 }, effects: { Food: 3, Suspicion: 1 } },
        { id: "starve", label: "Let the shortage run its course", tone: "danger", effects: { Cultists: -1, Suspicion: 2 } },
      ],
    },
    {
      id: "relic-in-the-wall", kind: "opportunity", title: "Something Old",
      tags: ["relic", "money"],
      body: "Behind old plaster, a hand of blackened silver waits with fingers curled inward.",
      choices: [
        { id: "mark", label: "Mark the spot and come back later", tone: "info", effects: { Pressure: 1 } },
        { id: "claim", label: "Retrieve it carefully before dawn", tone: "success", cost: { Money: 2 }, effects: { Relics: 1 } },
        { id: "grab", label: "Take it now without preparation", tone: "danger", cost: { humanPower: 1 }, effects: { Relics: 1, Suspicion: 1 } },
      ],
    },
    {
      id: "mandatory-police-raid", kind: "mandatory", title: "Door Knock",
      tags: ["suspicion", "apocalyptic"],
      body: "Boots cross the threshold before anyone remembers to lock the door.",
      choices: [
        { id: "bribe", label: "Handle it with money", tone: "success", cost: { Money: 3 }, effects: { Suspicion: -3 } },
        { id: "frame", label: "Hand them a convenient culprit", tone: "success", cost: { Prisoners: 1 }, effects: { Suspicion: -4 } },
        { id: "scatter", label: "Scatter into the alleys", tone: "danger", effects: { Cultists: -1, Suspicion: -2 } },
      ],
    },
    {
      id: "ledger-smoke", kind: "common", title: "Paper Trail",
      tags: ["money", "suspicion"],
      body: "The accounts have begun to read like a confession. Numbers that should not line up are lining up.",
      choices: [
        { id: "burn", label: "Destroy everything and work from memory", tone: "danger", effects: { Money: -1, Pressure: 1 } },
        { id: "cook", label: "Rewrite the records cleanly", tone: "success", cost: { Money: 1 }, effects: { Suspicion: -1 } },
        { id: "outsource", label: "Pay someone to make it disappear entirely", tone: "success", cost: { Money: 2, humanPower: 1 }, effects: { Suspicion: -2 } },
      ],
    },
  ];
})();
