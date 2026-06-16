# Offline Tool Spec — Field Playbook ↔ SunRootTool Mapping

This document maps the Dubréka Sunlight Pump field playbook to **SunRootTool** wizard steps and the new **Step 8: Field Ops** module for logbooks and commissioning calculators.

---

## Screen map

| Playbook section | SunRootTool location | Storage path |
|------------------|---------------------|--------------|
| A1 Quick Start | Step 8 → Playbook tab (embedded summary) + markdown file | — |
| Mission 1 PV selection | Step 8 → PV Calculator | `step8_fieldOps.pvPanel`, `pvTotals` |
| Mission 2–3 PV install | Step 8 → Playbook missions 2–3 | `step3_field.siteSolar.*` |
| Mission 4 Mechanical | Step 3 Field Data | `step3_field.hydraulics.*`, `waterSource.*` |
| Mission 5 First run | Step 8 → Commissioning | `step8_fieldOps.commissioning` |
| Mission 6 Protection | Step 8 → Playbook + Step 3 ops notes | `step3_field.operations.*` |
| A3 Commissioning test | Step 8 → Commissioning calculator | `step8_fieldOps.commissioning` |
| B1–B5 Calculations | Step 8 → Calculators (auto) + Step 5 Design | `step5_design.*`, calc engine |
| C1 O&M schedule | Step 8 → O&M checklist | `step8_fieldOps.omChecklist` |
| C2 Troubleshooting | Step 8 → Playbook (static tree) | — |
| C3 Logbooks | Step 8 → Logs tabs | `step8_fieldOps.dailyLogs`, `maintenanceLogs`, `incidentLogs` |
| Site measurements | Steps 1, 3, 5 | `step1_setup`, `step3_field`, `step5_design` |

---

## Step 8 data schema (`step8_fieldOps`)

```json
{
  "pvPanel": {
    "pmax_W": "",
    "voc_V": "",
    "vmp_V": "",
    "isc_A": "",
    "imp_A": ""
  },
  "pvTotals": {
    "vocTotal_V": "",
    "vmpTotal_V": "",
    "pArray_W": "",
    "passVoc": null
  },
  "commissioning": {
    "date": "",
    "weather": "",
    "startTime": "",
    "endTime": "",
    "runtime_min": "",
    "method": "tank_rise",
    "volumeDelivered_m3": "",
    "flow_m3h": "",
    "dailyEstimate_m3": "",
    "result": ""
  },
  "omChecklist": {
    "daily": [],
    "weekly": [],
    "monthly": [],
    "quarterly": []
  },
  "dailyLogs": [],
  "maintenanceLogs": [],
  "incidentLogs": []
}
```

### Log entry shapes

**dailyLogs[]:** `{ date, startTime, endTime, runtime_min, volume_m3, weather, notes }`

**maintenanceLogs[]:** `{ date, task, parts, observations, nextDue }`

**incidentLogs[]:** `{ date, issueType, symptoms, rootCause, fix, downtime_h }`

---

## Calculator formulas (Step 8)

| Calc | Formula | Inputs |
|------|---------|--------|
| PV Voc total | `3 × voc_V` | Panel nameplate |
| PV pass | `vocTotal < 160` | Computed |
| E_day | `1100 × t_run_h / 1000` kWh | Runtime |
| t_fill optimistic | `20 / Q_m3h × 60` min | Q default 31.2 or measured |
| t_fill catalogue | `20 / 8.82 × 60` min | 1.5 HP catalogue max |
| P_pv power match | `1100 / 0.75` W | Fixed |
| P_pv energy | `E_day / (PSH × 0.75)` kW | PSH from step3 solar notes or input |
| Commissioning Q | `volume / (runtime_min/60)` | Measured |
| Commissioning pass | `volume ≥ 20` or conditional ≥ 16 | Project target from step1 |

---

## Cross-references to existing wizard fields

| Playbook need | Existing field |
|---------------|----------------|
| Target 20 m³/day | `step1_setup.volume_m3_day` |
| Static head 50 m | `step3_field.hydraulics.staticHead_m` |
| Tank 20 m³ | `step3_field.storage.volume_m3` |
| PSH 3.8 worst month | `step5_design.designParams.psh` |
| Pipe length 80 m | `step3_field.hydraulics.totalLength_m` |
| Commissioning clause | `step7_report.commissioningClause` (auto-generated) |
| Latitude ~10° | Manual / Step 3 `siteSolar.tiltNotes` |

---

## Export integration

ZIP export should include (future enhancement):

- `assets/playbook/dubreka-sunlight-pump.md` (copy or reference)
- `field-ops-log.json` (step8_fieldOps snapshot)
- Existing `project.json` already contains step8 when present

---

## UI structure (Step 8 tabs)

1. **Playbook** — Collapsible missions A1–A3, C2 tree; link to full markdown
2. **PV Check** — Panel inputs → Voc/Vmp totals → pass/fail badge
3. **Commissioning** — Test worksheet + auto Q and pass tier
4. **Calculators** — E_day, t_fill, P_pv (reads PSH from design params)
5. **Logs** — Add/remove rows for daily, maintenance, incident tables

All data autosaves to `localStorage` via existing `scheduleAutosave()`.

---

## Files

| File | Role |
|------|------|
| `assets/playbook/dubreka-sunlight-pump.md` | Full Notion-ready playbook |
| `assets/playbook/offline-tool-spec.md` | This mapping document |
| `js/wizard-field-ops.js` | Step 8 render + calculators |
| `js/data.js` | WIZARD_STEPS[8], schema |
| `js/wizard-render.js` | `case 8: renderStep8` |
