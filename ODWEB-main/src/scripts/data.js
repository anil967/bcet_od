// Detailed historical & mythic lore data aligned with Journey to Innovation

export const SYMBOLS_DATA = {
  voyage: {
    id: "voyage",
    name: "The Voyage",
    greekName: "Ὁ Πλοῦς καὶ ἡ Καινοτομία",
    icon: "🧭",
    tagline: "Journey to Innovation — Navigating Uncharted Waters",
    coords: "37°58'N 23°43'E — Island of Circe & Open Sea",
    mapPos: { x: 18, y: 43 },
    heroImg: "/images/voyage_hero.jpg",
    quote: "“Every innovator must conquer the journey before their vision finds its home.”",
    quoteAuthor: "Journey to Innovation — Chapter I",
    overview: "The Voyage represents the courageous first step into uncharted territories. Like Odysseus navigating tempestuous waters and mythical sea gods, true innovation requires bold leadership, adaptive steering, and the resilience to conquer unknown challenges.",
    stats: [
      { label: "Voyage Milestone", value: "Phase I: Discovery" },
      { label: "Navigational Guide", value: "Celestial Astrolabe" },
      { label: "Primary Objective", value: "Chart New Horizons" },
      { label: "Core Competency", value: "Strategic Resilience" }
    ],
    artifacts: [
      {
        name: "The Golden Astrolabe",
        origin: "Phoenician & Achaean Navigators",
        desc: "An ancient celestial instrument used to measure star elevation and navigate uncharted sea routes.",
        power: "Visionary Sight +95",
        badge: "Navigation Emblem"
      },
      {
        name: "The Leather Bag of Winds",
        origin: "Gift of Aeolus, Lord of the Winds",
        desc: "A silver-tied ox-hide bag containing gale winds to accelerate progress during stagnant calms.",
        power: "Momentum Boost +92",
        badge: "Mythic Relic"
      },
      {
        name: "Flagship Helm of Courage",
        origin: "Shipyards of Mycenae",
        desc: "Carved oak rudder that steers through storms, whirlpools, and hostile crags without flinching.",
        power: "Steering Mastery +90",
        badge: "Ship Artifact"
      }
    ],
    loreChapters: [
      {
        title: "Pioneering Unmapped Frontiers",
        content: "Every legendary journey begins when visionaries leave comfortable shores. Pushing off into wine-dark waters, the expedition embraces risk and uncertainty as necessary catalysts for groundbreaking breakthroughs."
      },
      {
        title: "Navigating Storms & Resistance",
        content: "Just as Poseidon summoned violent tempests to stall Odysseus, innovative ventures face skepticism and turbulent headwinds. Success belongs to those who adjust their sails while keeping their gaze fixed on the goal."
      },
      {
        title: "The Astrolabe of Continuous Direction",
        content: "By aligning with enduring principles rather than temporary storms, pioneers maintain steady velocity across open ocean expanses."
      }
    ],
    challenge: {
      question: "Your expedition faces an unmapped sea current pulling toward dangerous reefs. How do you lead your crew forward?",
      options: [
        { text: "Use the Golden Astrolabe to calculate celestial coordinates and steer into open deep water.", correct: true, feedback: "A master navigator's decision! You bypass the reef and discover a faster trade current." },
        { text: "Drop anchor immediately and wait for the weather to clear.", correct: false, feedback: "The current drags your ship into stagnant waters, delaying the voyage." },
        { text: "Abandon course and return to the safety of the starting harbor.", correct: false, feedback: "You miss the opportunity for groundbreaking discovery!" }
      ]
    }
  },

  realms: {
    id: "realms",
    name: "The Realms",
    greekName: "Τὰ Βασίλεια καὶ αἱ Νῆσοι",
    icon: "🏛️",
    tagline: "Architectural Pillars of Knowledge & Domain Sanctuaries",
    coords: "36°25'N 25°26'E — Land of the Cyclopes",
    mapPos: { x: 45, y: 30 },
    heroImg: "/images/realms_hero.jpg",
    quote: "“Build upon granite pillars of wisdom, for great domains are constructed stone by stone upon solid foundations...”",
    quoteAuthor: "Journey to Innovation — Chapter II",
    overview: "The Realms represent the foundational pillars, domains, and architectural frameworks of progress. From sacred marble sanctuaries to island archipelagos, each domain fosters unique capabilities, specialized talents, and enduring structures.",
    stats: [
      { label: "Sovereign Domains", value: "5 Core Realms" },
      { label: "Pillar Style", value: "Classical Doric & Ionic" },
      { label: "Sanctuary Guardian", value: "Athena Polias" },
      { label: "Core Attribute", value: "Structural Integrity" }
    ],
    artifacts: [
      {
        name: "Parthenon Keystone Seal",
        origin: "Architects of Athens",
        desc: "A carved marble seal symbolizing perfect proportion, balance, and structural permanence.",
        power: "Framework Stability +98",
        badge: "Architectural Relic"
      },
      {
        name: "The Holy Moly Herb",
        origin: "Hermes' Gift on Island Aeaea",
        desc: "A rare divine flower with black roots and white petals that renders the bearer immune to illusions and magic.",
        power: "Clarity & Immunity +96",
        badge: "Sacred Flora"
      },
      {
        name: "Amphora of Divine Knowledge",
        origin: "Oracle Sanctuary of Delphi",
        desc: "A golden vessel containing liquid wisdom to enlighten leaders during complex decision-making.",
        power: "Insight +90",
        badge: "Sacred Vessel"
      }
    ],
    loreChapters: [
      {
        title: "Establishing Structural Foundations",
        content: "No innovation survives without robust architecture. Like the grand marble temples of Hellas, sustainable systems require deep foundations, clear principles, and harmonious design."
      },
      {
        title: "The Diversity of Domain Talents",
        content: "Across the archipelagos of the Mediterranean, each island contributed distinct crafts—metalworking from Lemnos, navigation from Scheria, and strategy from Athens. Innovation thrives when diverse expertise unites."
      },
      {
        title: "Guardian Sanctuaries",
        content: "Protecting core values ensures that expansion does not dilute identity or compromise standards of excellence."
      }
    ],
    challenge: {
      question: "You are tasked with expanding a domain sanctuary into new territory. What is your architectural priority?",
      options: [
        { text: "Lay deep granite foundations and erect marble pillars before raising the roof structure.", correct: true, feedback: "Excellent structural foresight! The sanctuary withstands both earthquakes and century storms." },
        { text: "Build decorative facades quickly to impress neighboring city-states.", correct: false, feedback: "Without solid foundations, the first seasonal storm cracks the outer walls." },
        { text: "Copy an old wooden design from a century ago without modification.", correct: false, feedback: "The design fails to meet modern scale demands." }
      ]
    }
  },

  protocols: {
    id: "protocols",
    name: "Realm Protocols",
    greekName: "Ὁ Κανὼν καὶ αἱ Θεσμοί",
    icon: "📜",
    tagline: "Sacred Codes of Governance, Trust & Operational Decrees",
    coords: "38°29'N 22°30'E — Aeolus Wind Island",
    mapPos: { x: 72, y: 38 },
    heroImg: "/images/protocols_hero.jpg",
    quote: "“Trust is the unwritten law of civilized realms, where sacred codes protect the guest and honor the covenant...”",
    quoteAuthor: "Journey to Innovation — Chapter III",
    overview: "Realm Protocols dictate the unwritten divine laws governing collaboration, ethics, and mutual trust. Foremost among them is Xenia—the sacred code of hospitality and integrity—ensuring seamless operational harmony across all teams.",
    stats: [
      { label: "Core Protocol", value: "Sacred Trust (Xenia)" },
      { label: "Governance Body", value: "Olympian Decree Council" },
      { label: "Compliance Rate", value: "100% Integrity" },
      { label: "Enforcement Shield", value: "Aegis of Athena" }
    ],
    artifacts: [
      {
        name: "The Golden Scroll of Xenia",
        origin: "Temple of Zeus at Olympia",
        desc: "An inscribed bronze scroll outlining sacred codes of mutual respect, hospitality, and ethical conduct.",
        power: "Trust Integration +97",
        badge: "Governance Relic"
      },
      {
        name: "Oracle's Signet Ring",
        origin: "Pythian Temple of Delphi",
        desc: "A laurel-engraved ring guaranteeing safe passage and authentic diplomatic representation across all city-states.",
        power: "Authenticity Seal +94",
        badge: "Diplomatic Token"
      },
      {
        name: "Libation Bowl of Covenant",
        origin: "Mycenaean Royal Court",
        desc: "A silver phiale used to consecrate solemn pacts and long-term strategic alliances.",
        power: "Alliance Honor +91",
        badge: "Treaty Vessel"
      }
    ],
    loreChapters: [
      {
        title: "The Law of Mutual Hospitality (Xenia)",
        content: "In ancient times, travelers were welcomed with shelter, nourishment, and honor before asking their business. In modern innovation, open collaboration and mutual respect form the bedrock of high-performing teams."
      },
      {
        title: "Governance & Operational Clarity",
        content: "Clear protocols prevent friction. When standards of engagement are transparent, execution moves with speed and confidence."
      },
      {
        title: "Consequences of Protocol Breach",
        content: "Those who break sacred covenants lose trust and invite ruin. Integrity is non-negotiable."
      }
    ],
    challenge: {
      question: "A new partner arrives requesting access to your realm's core knowledge base. How do you apply Protocol Xenia?",
      options: [
        { text: "Establish a clear onboarding protocol: offer genuine collaboration while verifying alignment with core values.", correct: true, feedback: "A masterclass in governance! The partner becomes a trusted long-term ally." },
        { text: "Grant unrestricted root access without verifying credentials or alignment.", correct: false, feedback: "Protocol violation! Unverified changes compromise system security." },
        { text: "Refuse to communicate or share any information.", correct: false, feedback: "Silo mentality stifles joint innovation and creates isolation." }
      ]
    }
  },

  legions: {
    id: "legions",
    name: "The Legions",
    greekName: "Αἱ Λεγεῶνες καὶ ἡ Ἰσχύς",
    icon: "🛡️",
    tagline: "Unified Execution, Hoplite Shield Wall & Strategic Vanguard",
    coords: "37°04'N 22°25'E — Scylla & Land of the Dead",
    mapPos: { x: 38, y: 70 },
    heroImg: "/images/legions_hero.jpg",
    quote: "“Stand shield to shield in unbroken alignment, for unity transforms individual strength into invincible force...”",
    quoteAuthor: "Journey to Innovation — Chapter IV",
    overview: "The Legions represent unified execution, tactical discipline, and collective strength. Operating like an unbroken Achaean hoplite phalanx, aligned teams overcome monumental obstacles through synchronized focus and unwavering defense.",
    stats: [
      { label: "Phalanx Formation", value: "Overlap Shield Wall" },
      { label: "Execution Speed", value: "Synchronized Pulse" },
      { label: "Tactical Mastermind", value: "Odysseus Strategy" },
      { label: "Defense Rating", value: "Impenetrable +99" }
    ],
    artifacts: [
      {
        name: "Spartan Bronze Aspis Shield",
        origin: "Spartan & Salamis Guard",
        desc: "A massive bronze-faced ox-hide shield that overlaps with comrades to form an impenetrable phalanx wall.",
        power: "Collective Defense +99",
        badge: "Hoplite Relic"
      },
      {
        name: "The Trojan Horse Blueprint",
        origin: "Conceived by Odysseus",
        desc: "The legendary tactical diagram demonstrating how creative strategy breaches unyielding obstacles.",
        power: "Strategic Subterfuge +98",
        badge: "Mastermind Relic"
      },
      {
        name: "Corinthian Crested Helmet",
        origin: "Vanguard Officers",
        desc: "A heavy cast-bronze helmet providing clear line-of-sight command during intense campaign maneuvers.",
        power: "Tactical Focus +92",
        badge: "Armor Relic"
      }
    ],
    loreChapters: [
      {
        title: "The Power of the Phalanx Shield Wall",
        content: "A hoplite shield protected not only the warrior carrying it, but also the comrade standing to his left. Alignment means looking out for one another and executing as one cohesive unit."
      },
      {
        title: "Out-Thinking Brute Force",
        content: "When nine years of direct siege failed to breach the walls of Troy, Odysseus applied creative strategic thinking. The wooden horse proved that genius strategy succeeds where brute force stalls."
      },
      {
        title: "Resilience in the Face of Setbacks",
        content: "Even when facing perilous trials, aligned legions absorb blows, adapt tactics, and press forward to victory."
      }
    ],
    challenge: {
      question: "Your team encounters a formidable technical roadblock that brute force cannot solve. How do you deploy your legion?",
      options: [
        { text: "Convene a strategic workshop, pivot approach with creative problem-solving (Trojan Horse tactic), and execute in unison.", correct: true, feedback: "Tactical brilliance! The creative workaround solves the bottleneck effortlessly." },
        { text: "Order everyone to double down on the exact same failing brute-force method.", correct: false, feedback: "Resource exhaustion! The team burns out without making progress." },
        { text: "Disband the team and abandon the initiative.", correct: false, feedback: "Surrender forfeits all gains achieved so far." }
      ]
    }
  },

  odyssey: {
    id: "odyssey",
    name: "The Odyssey",
    greekName: "Ἡ Ὀδύσσεια καὶ ἡ Τελείωσις",
    icon: "👑",
    tagline: "The Pinnacle of Triumph, Golden Mastery & Return Home",
    coords: "38°22'N 20°43'E — Kingdom of Ithaca",
    mapPos: { x: 76, y: 71 },
    heroImg: "/images/odyssey_hero.jpg",
    quote: "“Rejoice in the golden hall of achievement! The bow is strung, the journey fulfilled, and victory crown'd!”",
    quoteAuthor: "Journey to Innovation — Chapter V",
    overview: "The Odyssey is the grand culmination of endurance, wisdom, and triumphant achievement (Nostos). It celebrates the ultimate realization of vision, reclaiming sovereign mastery, and inspiring future generations of innovators.",
    stats: [
      { label: "Journey Duration", value: "Completed Cycle" },
      { label: "Ultimate Relic", value: "Great Bow of Odysseus" },
      { label: "Achievement Tier", value: "Golden Mastery" },
      { label: "Legacy Status", value: "Eternal Inspiration" }
    ],
    artifacts: [
      {
        name: "The Great Bow of Odysseus",
        origin: "Gift from Iphitus",
        desc: "A composite bow that only the rightful king possessed the strength and mastery to string and shoot through 12 axe heads.",
        power: "Pinnacle Precision +100",
        badge: "Royal Relic"
      },
      {
        name: "Golden Olive-Tree Bed",
        origin: "Handcrafted by Odysseus",
        desc: "The immovable foundation carved into the living olive tree—symbolizing deep roots and permanent legacy.",
        power: "Unshakable Legacy +99",
        badge: "Dynastic Emblem"
      },
      {
        name: "Laurel Crown of Nostos",
        origin: "Sanctuary of Athena Ithaka",
        desc: "Woven golden laurel wreath awarded to champions upon completing their epic journey to innovation.",
        power: "Sovereign Glory +96",
        badge: "Crown Relic"
      }
    ],
    loreChapters: [
      {
        title: "The Trial of Mastery (Bending the Bow)",
        content: "Many attempted to string the great bow, but only the one with true mastery could bend it effortlessly and send the arrow true. Mastery is earned through years of practice, trials, and resilience."
      },
      {
        title: "Triumphant Reclaim & Realization",
        content: "Upon returning to Ithaca, Odysseus restored order, peace, and prosperity to his golden realm. True innovation concludes not just in ideas, but in fully delivered, transformative impact."
      },
      {
        title: "Inspiring the Next Generation",
        content: "The completion of an epic journey becomes the foundation for new horizons. The legacy of innovation continues forever."
      }
    ],
    challenge: {
      question: "You stand before the final trial: stringing the Great Bow of Odysseus to seal your Journey to Innovation. What is your mind state?",
      options: [
        { text: "Breathe with calm focus, draw upon years of hard-won experience, string the bow smoothly, and shoot true.", correct: true, feedback: "GOLDEN TRIUMPH! The arrow glides cleanly through all 12 axe sockets! Your Journey to Innovation is fulfilled in glory!" },
        { text: "Try to force the bow back with violent jerky motions.", correct: false, feedback: "Without composure, the heavy horn bow resists your grip." },
        { text: "Hesitate and hand the bow to someone else.", correct: false, feedback: "Leadership requires stepping up to complete the vision yourself." }
      ]
    }
  }
};
