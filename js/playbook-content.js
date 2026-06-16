/* playbook-content.js — embedded Dubréka Sunlight Pump field playbook (offline) */

const PLAYBOOK_META = {
  title: 'Dubréka Sunlight Pump — Field Mission Guide',
  project: 'Dubréka, Guinea',
  system: 'PV array → MPPT controller → 1.5 HP Sunlight Pump → 20 m³ reservoir → irrigation',
  pump: 'DC ~1100 W (1.1 kW) · 3 PV modules in series',
};

const PLAYBOOK_QUICK_START = {
  success:
    'On a clear dry-season day, deliver ≥ TARGET m³ to the storage tank (tank rise or timed container), with stable flow, no air leaks, no controller faults, and Voc_total < 160 V.',
  redFlags: [
    { title: 'Shaded or dirty PV', why: 'Controller never reaches full power; pump runs slow or stops mid-day' },
    { title: 'Air leaks on suction', why: 'Progressive cavity pump loses prime; bubbles, noise, low or zero flow' },
    { title: 'Wrong PV voltage (Voc ≥ 160 V)', why: 'Controller damage risk; or under-voltage if panels too weak' },
  ],
  safetyChecklist: [
    'Confirm no live PV strings before touching MC4 (cover modules or work early morning)',
    'DC breaker 18–35 A installed and OFF during wiring',
    'Suction depth within limit (≤ 7 m at sea level; less at altitude)',
    'Foot valve clear of mud/sand (≥ 10 cm above bottom)',
    'Team has: multimeter, hose clamps, silicone sealant, MC4 spanner, clean water for priming',
    'Someone knows basin minimum level and tank overflow',
  ],
};

const PLAYBOOK_MISSIONS = [
  {
    id: 'm1',
    title: 'Mission 1 — PV selection (panel specs)',
    goal: 'Choose three modules that stay under 160 V open-circuit and match pump power needs.',
    need: 'Panel nameplate or datasheet; PV Check tab in this tool.',
    steps: [
      'Read Pmax, Voc, Vmp, Isc, Imp from each identical panel nameplate.',
      'Compute: Voc_total = 3×Voc, Vmp_total = 3×Vmp, P_array ≈ 3×Pmax.',
      'Hard rule: Voc_total < 160 V. Prefer 500–600 W panels with Voc < 53 V each.',
      'Example (borderline): 550 W, Voc 49.5 V → Voc_total 148.5 V ✓, P_array 1650 W.',
    ],
    proTips: ['Closer to 160 V (148–155 V) can yield more water — but measure cold-morning Voc.'],
    redFlags: ['Datasheet Voc without cold-temperature correction can exceed STC on a cold dawn.'],
    passFail: [
      'Voc_total < 160 V (measured or calculated at coldest expected)',
      'Each panel Voc < 53 V',
      'P_array ≥ ~1500 W (1100 W pump / 0.75 derate)',
      'Isc × 1.25 ≤ breaker rating',
    ],
    tabLink: 'pv',
  },
  {
    id: 'm2',
    title: 'Mission 2 — PV wiring & protection',
    goal: 'Safe series string with breaker at the array.',
    need: '3 modules, MC4 connectors, 18–35 A DC breaker, PV cable, MC4 spanner.',
    steps: [
      'Wire 3 modules in series: (+) panel 1 → (−) panel 2 → (+) panel 2 → (−) panel 3.',
      'Mount DC breaker 18–35 A as close to the array as practical.',
      'If Voc_total is 150–160 V: keep PV-to-breaker cable ≤ 15 m.',
      'No-sparks procedure: breaker OFF → connect controller side → string to breaker last → verify polarity → then energize.',
    ],
    mistakes: ['Parallel wiring by mistake', 'Breaker only at pump end', 'Stepping on MC4 connectors'],
    passFail: ['Series polarity verified', 'Breaker 18–35 A at array', 'Cable length OK for voltage tier'],
    tabLink: 'pv',
  },
  {
    id: 'm3',
    title: 'Mission 3 — PV placement (azimuth + tilt)',
    goal: 'Maximum sun hours without shade.',
    need: 'Compass, inclinometer, shade survey at 9:00 / 12:00 / 15:00.',
    steps: [
      'Azimuth (Dubréka ~9.8°N): face south (Northern hemisphere).',
      'Tilt year-round: tilt ≈ latitude → ~10° for Dubréka.',
      'Dry-season option: 12–15° tilt favors Apr–Oct sun.',
      'No shade on any module 09:00–16:00; plan cleaning access; take panorama photo.',
    ],
    passFail: ['South-facing (±15°)', 'Tilt 8–15° documented', 'No critical shade 9–16 h'],
  },
  {
    id: 'm4',
    title: 'Mission 4 — Pump mechanical installation',
    goal: 'Airtight suction, safe depth, reliable delivery to tank.',
    need: '1½" (40 mm) reinforced suction hose, foot valve, clamps, silicone, HDPE discharge.',
    steps: [
      'One continuous reinforced suction hose — no multiple segments.',
      'Seal every joint: silicone + multiple clamps.',
      'Suction depth: 7 m @ sea level, 6 m @ 1000 m altitude, 5 m @ 2000 m.',
      'Foot valve ≥ 10 cm above bottom; tie to stick/branch.',
      'Pre-filter: suction pit or bucket + mosquito net for muddy sources.',
      'If static head > 15 m: check valve at outlet (Dubréka ~50 m → required).',
    ],
    mistakes: ['Cheap non-reinforced hose', 'Foot valve on mud', 'Missing check valve on high-head sites'],
    passFail: [
      'Single suction line, airtight',
      'Suction depth within limit',
      'Foot valve elevated off bottom',
      'Check valve installed (head > 15 m)',
    ],
  },
  {
    id: 'm5',
    title: 'Mission 5 — First run (priming + verification)',
    goal: 'Wet system, stable flow, no dry run.',
    need: 'Clean water, observer at outlet and controller.',
    steps: [
      'Breaker OFF. Fill suction line and pump with water; fill discharge until water exits.',
      'Confirm foot valve submerged, valves open. Breaker ON during full sun.',
      'Good signs: steady hum, continuous flow, dry hoses outside, controller running.',
      'Bad signs: cavitation rattle, surging flow, bubbles at suction, controller fault.',
    ],
    passFail: ['Primed before start', 'Stable flow ≥ 15 min', 'No suction-side leaks'],
    tabLink: 'commission',
  },
  {
    id: 'm6',
    title: 'Mission 6 — Protection & durability',
    goal: 'Long service life in muddy tropical field conditions.',
    steps: [
      'Mud/silt: suction pit or bucket pre-filter; weekly screen check in dry season.',
      'Cables: MC4 never on ground; UV-safe routing and strain relief.',
      'Security: lock controller box; community watch for panels.',
      'Cleaning: brush modules when dust visible or after harmattan.',
    ],
    tabLink: 'om',
  },
];

const PLAYBOOK_COMMISSIONING = {
  methods: [
    { id: 'tank_rise', label: 'Tank rise', formula: 'Volume = π × r² × Δh or A_floor × Δh' },
    { id: 'container', label: 'Timed container', formula: 'Q (m³/h) = Volume (m³) / Time (h)' },
  ],
  tiers: [
    { id: 'PASS', label: 'PASS', desc: '≥ target m³ in one clear dry-season day' },
    { id: 'CONDITIONAL', label: 'CONDITIONAL', desc: '80–99% of target — investigate shading, air leak, TDH, dirty modules' },
    { id: 'FAIL', label: 'FAIL', desc: '< 80% of target on clear day — run troubleshooting tree' },
  ],
  catalogNote:
    'ennos 1.5 HP catalogue max ≈ 147 L/min (8.82 m³/h). Value 31.2 m³/h is the 2 HP class (520 L/min). At ~50 m static head, measure flow on site — do not trust catalogue max.',
};

const PLAYBOOK_OM_TASKS = {
  daily: [
    'Visual flow check; note runtime; listen for cavitation',
  ],
  weekly: [
    'Check foot valve / screen for debris',
    'Scan for suction leaks',
    'Verify tank level trend vs commissioning baseline',
  ],
  monthly: [
    'Clean PV modules (dust season)',
    'Tighten hose clamps',
    'Inspect MC4 connectors for corrosion or mud',
  ],
  quarterly: [
    'Full shading walk-through (9–16 h)',
    'Measure fill time vs commissioning — > 20% drift triggers troubleshooting',
    'Grease or replace foot valve gasket if leaking',
  ],
};

const PLAYBOOK_TROUBLESHOOTING = `NO WATER?
├─ PV shaded or dirty? → clean / trim / relocate
├─ Breaker tripped? → reset after fixing fault
├─ Pump not primed? → re-prime suction + discharge
├─ Air leak on suction? → silicone + clamps; single hose only
├─ Suction depth exceeded? → raise foot valve / shorten lift
└─ Foot valve clogged? → clean; add pre-filter

LOW FLOW?
├─ Air leak (most common)
├─ Partial shading / dirty modules
├─ Clogged intake or foot valve
├─ TDH too high → verify head, pipe size
└─ Low voltage string → measure Voc/Vmp at controller

CONTROLLER FAULT?
├─ Voc_total ≥ 160 V? → fix string / cold Voc issue
├─ Loose MC4 / mud in connector
├─ Breaker undersized or failing
└─ Damaged cable (animal, UV, crush)`;

const PLAYBOOK_SITE_MEASUREMENTS = [
  { measure: 'TDH / static elevation gain', why: 'Converts catalogue flow to real Q; check valve sizing' },
  { measure: 'Pipe diameter + full routing', why: 'Friction losses; velocity checks' },
  { measure: 'Actual flow @ typical sun', why: 'Calibrates schedules and pass/fail' },
  { measure: 'Cold-morning Voc_total', why: 'Confirms < 160 V safety margin' },
  { measure: 'Shading photos + PV GPS', why: 'Documents array quality' },
  { measure: 'Basin min depth (dry season)', why: 'Suction depth and water availability' },
  { measure: 'PSH from PVGIS', why: 'Refines PV energy balance (baseline 3.8 h worst month)' },
];

const PLAYBOOK_EXAMPLE_PANEL = {
  pmax_W: 550,
  voc_V: 49.5,
  vmp_V: 41,
  isc_A: 13.8,
  imp_A: 13.4,
};

const WIRE_SIZES_MM2 = [2.5, 4, 6, 10, 16];
