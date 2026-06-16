# SunRoots Solar Irrigation Tool

Offline 8-step wizard and field playbook for the **SUNROOTS Dubréka** solar irrigation pilot — sized for the **1.5 HP (1.1 kW) ennos Sunlight Pump** with **3 PV modules in series**.

## Quick start

Open [`index.html`](index.html) in any modern browser. No build step, no account, no server required.

Data saves automatically to browser `localStorage`. Use **Export JSON** or **Export ZIP** for backups.

## Wizard steps

1. **Project Setup** — site, volume target, stakeholders  
2. **Planning** — milestones, risks, assumptions  
3. **Field Data** — hydraulics, basin, photos, tank  
4. **Validation** — engineering checks, design freeze  
5. **Design** — TDH, pump curve, PV sizing, BOM  
6. **RFQ** — EN/FR procurement documents  
7. **Report** — final package and commissioning clause  
8. **Field Ops** — install playbook, PV check, commissioning, O&M logs  

## Field playbook

Full mission guide: [`assets/playbook/dubreka-sunlight-pump.md`](assets/playbook/dubreka-sunlight-pump.md)

Reference PDFs (ennos install guide, pump catalog, PV sizing notes) are included in the repo root.

## Tests

```bash
node test-calc.js
```

## License

SUNROOTS · Tourdam AI Lab
