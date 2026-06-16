# Dubréka Sunlight Pump — Field Mission Guide

**Project:** Dubréka, Guinea  
**System:** PV array → MPPT controller → 1.5 HP Sunlight Pump → 20 m³ reservoir → irrigation  
**Pump class:** DC, ~1100 W (1.1 kW) · 3 PV modules in series  
**Sources:** ennos install guide 2026 · ennos catalog 2026 · SUNROOTS Dubréka baseline

---

## A1 — Quick Start Overview

### What success looks like

> **On a clear dry-season day, the system delivers ≥ 20 m³ of water to the storage tank** (measured by tank rise or timed fill of a known volume), with stable flow, no air leaks, no controller faults, and PV `Voc_total < 160 V`.

### The 3 biggest causes of failure

| Red Flag | Why it kills performance |
|----------|--------------------------|
| **Shaded or dirty PV modules** | Controller never reaches full power; pump runs slow or stops mid-day |
| **Air leaks on suction side** | Progressive cavity pump loses prime; bubbles, noise, low or zero flow |
| **Wrong PV voltage (`Voc_total ≥ 160 V`)** | Controller damage risk; or under-voltage if panels too weak |

### Before you start — safety checklist

- [ ] **Checkpoint** — Confirm no live PV strings before touching MC4 connectors (cover modules or work early morning)
- [ ] **Checkpoint** — DC breaker (18–35 A) installed and **OFF** during wiring
- [ ] **Checkpoint** — Suction depth within limit (≤ 7 m at sea level; less at altitude)
- [ ] **Checkpoint** — Foot valve clear of mud/sand (≥ 10 cm above bottom)
- [ ] **Checkpoint** — Team has: multimeter, hose clamps, silicone sealant, MC4 spanner, clean water for priming
- [ ] **Checkpoint** — Someone knows where the basin minimum level and tank overflow are

---

## A2 — Installation Missions

---

### Mission 1 — PV selection (panel specs)

**Goal:** Choose three modules that stay under 160 V open-circuit and match pump power needs.

**What you need:** Panel nameplate (on back of module) or datasheet; calculator or this tool.

**How to do it**

1. Read nameplate values for **each identical panel**:
   - **Pmax** (W) — rated power
   - **Voc** (V) — open-circuit voltage (cold morning = highest)
   - **Vmp** (V) — voltage at max power
   - **Isc** (A) — short-circuit current
   - **Imp** (A) — current at max power

2. Compute series totals (3 panels, + to −):

   ```
   Voc_total = Voc₁ + Voc₂ + Voc₃
   Vmp_total = Vmp₁ + Vmp₂ + Vmp₃
   I_string  ≈ Imp (same as one panel in series)
   P_array   ≈ Pmax₁ + Pmax₂ + Pmax₃
   ```

3. **Hard rule:** `Voc_total < 160 V` (controller damage above this)

4. **Preferred panel band:** 500–600 W each, **Voc < 53 V** per panel

**Worked example (borderline “high performance” case per ennos guide)**

| Parameter | One panel | × 3 series |
|-----------|-----------|------------|
| Pmax | 550 W | 1650 W |
| Voc | 49.5 V | **148.5 V** ✓ |
| Vmp | 41.0 V | 123.0 V |
| Isc | 13.8 A | 13.8 A |
| Imp | 13.4 A | 13.4 A |

**Pro Tip:** Closer to 160 V (e.g. 148–155 V) can yield more water because the controller has more voltage headroom — but **measure cold-morning Voc**; winter/cold days push Voc up.

**Red Flag:** Using Voc from datasheet only without temperature correction on a cold dawn — real Voc can exceed datasheet STC value.

**Pass / Fail checklist**

| Check | Pass | Fail |
|-------|------|------|
| Voc_total < 160 V (measured or calculated at coldest expected) | ☐ | ☐ |
| Each panel Voc < 53 V | ☐ | ☐ |
| P_array ≥ ~1500 W (≈ 1100 W pump / 0.75 derate) | ☐ | ☐ |
| Isc × 1.25 ≤ breaker rating | ☐ | ☐ |

---

### Mission 2 — PV wiring & protection

**Goal:** Safe series string with breaker at the array.

**What you need:** 3 modules, MC4 connectors, 18–35 A DC breaker (MCB), PV cable, MC4 spanner.

**How to do it**

1. Wire **3 modules in series:** (+) of panel 1 → (−) of panel 2 → (+) of panel 2 → (−) of panel 3.
2. Mount **DC breaker 18–35 A** as close to the PV array as practical.
3. Run PV cable from breaker to pump controller input.
4. **If Voc_total is 150–160 V:** keep PV-to-breaker cable **≤ 15 m** (ennos guidance).

**“No sparks” connection procedure**

1. Breaker **OFF**; cover modules or wait for low light.
2. Connect controller-side cables first (if disconnected).
3. Connect string to breaker input last.
4. Verify polarity with multimeter before closing breaker.
5. Open breaker only when ready for first run; stand clear of terminals.

**Common mistakes**

- Parallel wiring by mistake (adds current, not enough voltage to start pump)
- Breaker at pump end only — long live PV cable during install
- Stepping on MC4 connectors (crushed pins → hot spots)

**Pass / Fail**

| Check | Pass | Fail |
|-------|------|------|
| Series polarity verified | ☐ | ☐ |
| Breaker rated 18–35 A, at array | ☐ | ☐ |
| Cable length OK for voltage tier | ☐ | ☐ |

---

### Mission 3 — PV placement (azimuth + tilt)

**Goal:** Maximum sun hours without shade.

**What you need:** Compass, inclinometer (or phone app), shade survey at 9:00 / 12:00 / 15:00.

**How to do it**

- **Azimuth (Dubréka ~9.8°N, Northern hemisphere):** face **south**
- **Tilt — year-round rule:** `tilt ≈ latitude` → **~10°** for Dubréka
- **Dry-season optimization:** tilt **12–15°** slightly favors higher sun path in Apr–Oct; accept small winter penalty

**Shading avoidance checklist**

- [ ] No tree/building shade on **any** module 09:00–16:00
- [ ] Move array or extend cables away from vegetation if needed
- [ ] Plan cleaning access (modules reachable with brush + water)
- [ ] Take panorama photo for project records

**Pass / Fail**

| Check | Pass | Fail |
|-------|------|------|
| South-facing (±15°) | ☐ | ☐ |
| Tilt 8–15° documented | ☐ | ☐ |
| No critical shade 9–16 h | ☐ | ☐ |

---

### Mission 4 — Pump mechanical installation (suction + pressure)

**Goal:** Airtight suction, safe depth, reliable delivery to tank.

**What you need:** 1½" (40 mm) **reinforced** suction hose, foot valve, hose clamps, silicone sealant, hot oil (not flame) to soften hose, HDPE for discharge.

**Suction side**

- Use **one continuous** reinforced suction hose — **no multiple segments**
- Seal every joint with silicone + **multiple clamps**
- **Suction depth limits (ennos):**
  - 7 m @ sea level
  - 6 m @ 1000 m altitude
  - 5 m @ 2000 m altitude
- Foot valve **≥ 10 cm above** bottom; tie to stick/branch
- **Pre-filter options:** suction pit beside muddy source; foot valve in bucket with mosquito net wrap

**Pressure side**

- 1½" outlet; flexible short hose then HDPE upsized for long runs
- For runs **> 500 m**, consider 2" HDPE
- **If static head > 15 m:** install **check (non-return) valve** at outlet (Dubréka ~50 m → **required**)

**Common mistakes**

- Cheap non-reinforced hose → collapse → air ingestion
- Foot valve on mud → clog within days
- Missing check valve on high-head sites → back-pressure on shutdown

**Pass / Fail**

| Check | Pass | Fail |
|-------|------|------|
| Single suction line, airtight | ☐ | ☐ |
| Suction depth within limit | ☐ | ☐ |
| Foot valve elevated off bottom | ☐ | ☐ |
| Check valve installed (head > 15 m) | ☐ | ☐ |

---

### Mission 5 — First run (priming + verification)

**Goal:** Wet system, stable flow, no dry run.

**What you need:** Clean water, time, observer at outlet and controller.

**Priming procedure**

1. Breaker **OFF**
2. Fill **suction line and pump** with water (pour at highest point; remove air pockets)
3. Fill **discharge** until water exits outlet
4. Confirm foot valve submerged, gate valves open
5. Breaker **ON** during full sun; watch controller display

**First-run health checks**

| Checkpoint | Good sign | Bad sign |
|------------|-----------|----------|
| Sound | Steady hum | Cavitation rattle, gurgling |
| Flow | Continuous at outlet | Surging / stops |
| Hoses | Dry outside | Bubbles at suction fittings |
| Controller | Running, no fault | Error / shutdown |

**Pass / Fail**

| Check | Pass | Fail |
|-------|------|------|
| Primed before start | ☐ | ☐ |
| Stable flow ≥ 15 min | ☐ | ☐ |
| No suction-side leaks | ☐ | ☐ |

---

### Mission 6 — Protection & durability

**Goal:** Long service life in muddy tropical field conditions.

- **Mud/silt:** suction pit or bucket pre-filter; weekly screen check in dry season
- **Cables:** MC4 connectors **never on ground**; strain-relief and UV-safe routing
- **Security:** lock controller box; community watch for panels
- **Cleaning:** modules brushed when dust visible or after harmattan

---

## A3 — Commissioning Acceptance Test

**Purpose:** Prove the system meets **≥ 20 m³/day** project target (Dubréka replication pilot).

### Method A — Tank rise (preferred when tank geometry known)

```
Volume (m³) = π × r² × Δh   (cylindrical tank)
           or A_floor × Δh   (if floor area A known)
```

1. Mark starting water level in 20 m³ tank
2. Run pump during peak sun (typically 10:00–14:00)
3. Record **start time, end time, runtime (min)**
4. Measure **Δh** (m) after run
5. Compute volume delivered

### Method B — Timed bucket / container

```
Q (m³/h) = Volume_filled (m³) / Time (h)
Volume_day ≈ Q × t_run_total (h) over the solar window
```

Use ≥ 200 L drum or known basin section; time fill with stopwatch.

### Commissioning worksheet

| Field | Value |
|-------|-------|
| Date | |
| Weather (clear / partly cloudy / overcast) | |
| Start time | |
| End time | |
| Runtime (min) | |
| Method (tank rise / container) | |
| Volume delivered (m³) | |
| **Estimated Q (m³/h)** = Vol / (runtime/60) | |
| **Estimated daily (m³/day)** = Vol × (usable sun hours / runtime fraction) | |

**Pass criteria (Dubréka pilot)**

| Tier | Criterion |
|------|-----------|
| **PASS** | ≥ **20 m³** delivered in one clear dry-season day **OR** ≥ **16 m³** measured with ≥ 30 min cumulative runtime and documented partial cloud |
| **CONDITIONAL** | 12–19 m³ — investigate: shading, air leak, TDH higher than assumed, dirty modules |
| **FAIL** | < 12 m³ on a clear day — stop; run troubleshooting tree |

**Red Flag — catalogue vs site:** ennos lists **147 L/min (8.82 m³/h)** max for the **1.5 HP** pump. The value **31.2 m³/h** equals the **2 HP** catalogue figure (520 L/min). At Dubréka **~50 m static head + friction**, actual flow will be **far below catalogue max** — always commission with **field measurement**, not datasheet alone.

---

## B — Calculations

### B1 — DC electrical load

```
P_load = 1100 W   (design reference for 1.5 HP / 1.1 kW class)

E_day (Wh) = P_load (W) × t_run (h)
E_day (kWh) = E_day (Wh) / 1000
```

| t_run | E_day (Wh) | E_day (kWh) |
|-------|------------|-------------|
| 0.64 h (38 min) | 705 | 0.71 |
| 1.0 h | 1100 | 1.10 |
| 2.0 h | 2200 | 2.20 |
| 5.0 h (full sun window) | 5500 | 5.50 |

*Note: MPPT varies pump speed; 1100 W is sizing reference, not constant draw.*

---

### B2 — Reservoir fill scheduling

Given: **V_res = 20 m³**, **Q_pump = 31.2 m³/h** (optimistic upper bound from brief — see Red Flag above)

```
t_fill = V_res / Q_pump = 20 / 31.2 = 0.641 h ≈ 38.5 min
```

**Catalogue-realistic upper bound (1.5 HP):** Q = 8.82 m³/h → t_fill = 20 / 8.82 = **2.27 h (~136 min)** if that flow were sustained (it will not be at 50 m TDH).

| Schedule | Pattern | When to use |
|----------|---------|-------------|
| **Top-up mode** | 4 × ~10 min runs through day | Tank already partly full; avoid overflow |
| **Daily fill mode** | 1 continuous run ~40–150 min | Empty tank each morning; simplest ops |
| **Irrigation window** | Run 07:00–11:00 | Align fill before afternoon drip |

**Warning:** Actual Q depends on **TDH + suction + voltage**. Calibrate Q from commissioning test before trusting schedules.

---

### B3 — PV sizing

**Method 1 — Power match**

```
P_pv_required = P_load / f_derate
f_derate = 0.75   (dust, heat, wiring, MPPT margin)

P_pv_required = 1100 / 0.75 = 1467 W ≈ 1.47 kWp
```

Three × 550 W = **1650 W** ✓

**Method 2 — Energy balance**

```
E_pv_day ≈ P_pv_kW × PSH × f_derate
P_pv_kW = E_day_kWh / (PSH × f_derate)
```

Using **PSH = 5 h** (mid estimate; Dubréka worst month **3.8 h** per baseline):

| t_run | E_day (kWh) | P_pv (kW) @ PSH=5, f=0.75 |
|-------|-------------|---------------------------|
| 0.64 h | 0.71 | 0.19 |
| 1.0 h | 1.10 | 0.29 |
| 2.0 h | 2.20 | 0.59 |
| 5.0 h | 5.50 | **1.47** |

For **worst month PSH = 3.8**:

```
P_pv = 5.50 / (3.8 × 0.75) = 1.93 kWp  → consider 3 × 650 W or 4 × 550 W if 5 h/day pumping required
```

---

### B4 — Tilt angle

```
tilt ≈ latitude ≈ 10° (Dubréka)
```

| Strategy | Tilt | Tradeoff |
|----------|------|----------|
| Year-round | ~10° | Balanced |
| Dry-season boost | 12–15° | Better Apr–Oct; slightly less in Dec–Feb |

**Final checks trump formula:** no shade 9–16 h; easy cleaning access.

---

### B5 — Wire sizing (field-safe)

**Inputs:** one-way length **L** (m), current **I** (A), drop fraction **δ**, system voltage **V** (use Vmp_total)

```
V_drop_max = δ × V
R_total = V_drop_max / I
R_total = 2 × L × ρ / A     (round trip)

ρ_copper ≈ 1.68 × 10⁻⁸ Ω·m
A (m²) = 2 × L × ρ / R_total
A (mm²) = A (m²) × 10⁶
```

**Example:** L = 15 m, I = 17 A, δ = 3%, V = 123 V (Vmp_total)

```
V_drop_max = 0.03 × 123 = 3.69 V
R_total = 3.69 / 17 = 0.217 Ω
A = 2 × 15 × 1.68×10⁻⁸ / 0.217 = 2.32 mm²  → use **4 mm² minimum** (field practice)
```

**Example (long run, high Voc tier):** L = 25 m, I = 17 A, δ = 2%, V = 123 V

```
V_drop_max = 2.46 V → A ≈ 2.0 mm² → use **6 mm²**
```

**Field rules**

- If near **160 V Voc** limit → **short cable** (≤ 15 m) **and** upsize conductor
- Breaker always **at PV**, not only at pump
- When in doubt, go **one size larger** on cable

---

## C — Operations & Maintenance

### C1 — Maintenance schedule

| Interval | Tasks |
|----------|-------|
| **Daily** | Visual flow check; note runtime; listen for cavitation |
| **Weekly** | Check foot valve / screen for debris; scan for suction leaks; verify tank level trend |
| **Monthly** | Clean PV (dust season); tighten hose clamps; inspect MC4 for corrosion/mud |
| **Quarterly** | Full shading walk-through; measure fill time vs baseline; grease/ replace foot valve gasket if leaking |

**Performance drift signal:** tank fill time **> 20% longer** than commissioning → run troubleshooting tree.

---

### C2 — Troubleshooting tree

```
NO WATER?
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
├─ TDH too high for conditions → verify head, pipe size
└─ Low voltage string → measure Voc/Vmp at controller

CONTROLLER FAULT?
├─ Voc_total ≥ 160 V? → wrong panels / cold Voc → fix string
├─ Loose MC4 / mud in connector
├─ Breaker undersized or failing
└─ Damaged cable (animal, UV, crush)
```

---

### C3 — Logbook templates

#### Daily operations log

| Date | Start | End | Runtime (min) | Est. volume (m³) | Weather | Notes |
|------|-------|-----|---------------|------------------|---------|-------|
| | | | | | | |
| | | | | | | |

#### Maintenance log

| Date | Task | Parts used | Observations | Next due |
|------|------|------------|--------------|----------|
| | | | | |
| | | | | |

#### Incident log

| Date | Issue type | Symptoms | Root cause | Fix | Downtime (h) |
|------|------------|----------|------------|-----|--------------|
| | | | | | |
| | | | | | |

---

## What we still need to measure on-site

| Measurement | Why it matters |
|-------------|----------------|
| **TDH / static elevation gain** | Converts catalogue flow to real Q; sizes check valve need |
| **Pipe diameter + full routing** | Friction losses; velocity checks |
| **Actual flow @ typical sun** | Calibrates schedules and pass/fail |
| **Cold-morning Voc_total** | Confirms < 160 V safety margin |
| **Shading photos + PV GPS** | Documents array quality |
| **Basin min depth (dry season)** | Suction depth and availability |
| **PSH from PVGIS** | Refines PV energy balance (baseline uses 3.8 h worst month) |

---

*SUNROOTS · Tourdam AI Lab · Works offline · See SunRootTool Step 8 for logbook & calculators*
