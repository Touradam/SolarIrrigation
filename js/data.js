/* SunRoots Project Tool — content & constants (AdamaWebsiteStyle data.js) */

const SITE_NAME = 'SunRoots Project Tool';
const COPYRIGHT_HOLDER = 'SunRoots · Tourdam AI Lab';
const LOGO_SRC = 'assets/logo.svg';
const STORAGE_KEY = 'sunroots_active_project';
const SCHEMA_VERSION = 1;

const WIZARD_STEPS = [
  { id: 1, slug: 'setup', label: 'Project Setup', eyebrow: 'Objectives' },
  { id: 2, slug: 'planning', label: 'Planning', eyebrow: 'Schedule & risks' },
  { id: 3, slug: 'field', label: 'Field Data', eyebrow: 'Site checklist' },
  { id: 4, slug: 'validation', label: 'Validation', eyebrow: 'Data quality' },
  { id: 5, slug: 'design', label: 'Design', eyebrow: 'Engineering' },
  { id: 6, slug: 'rfq', label: 'RFQ', eyebrow: 'Procurement' },
  { id: 7, slug: 'report', label: 'Report', eyebrow: 'Final package' },
  { id: 8, slug: 'field-ops', label: 'Field Ops', eyebrow: 'Playbook & logs' },
];

const DEFAULT_STEP8_FIELD_OPS = {
  pvPanel: { pmax_W: '', voc_V: '', vmp_V: '', isc_A: '', imp_A: '' },
  pvTotals: { vocTotal_V: '', vmpTotal_V: '', pArray_W: '', passVoc: null },
  wireCalc: { cableLength_m: 15, current_A: 17, dropPct: 3, systemVoltage_V: '', area_mm2: '', recommended_mm2: '' },
  commissioning: {
    date: '',
    weather: '',
    startTime: '',
    endTime: '',
    runtime_min: '',
    method: 'tank_rise',
    volumeDelivered_m3: '',
    flow_m3h: '',
    dailyEstimate_m3: '',
    result: '',
  },
  omChecklist: { daily: {}, weekly: {}, monthly: {}, quarterly: {} },
  dailyLogs: [],
  maintenanceLogs: [],
  incidentLogs: [],
};

const DEFAULT_SUCCESS_CRITERION =
  'Delivered volume ≥ {{volume}} m³/day under typical dry-season solar conditions without batteries during commissioning.';

const DEFAULT_MILESTONES = [
  { name: 'Site visit', date: '', status: 'pending' },
  { name: 'Field data collection', date: '', status: 'pending' },
  { name: 'Design freeze', date: '', status: 'pending' },
  { name: 'RFQ issued', date: '', status: 'pending' },
  { name: 'Procurement', date: '', status: 'pending' },
  { name: 'Installation', date: '', status: 'pending' },
  { name: 'Commissioning', date: '', status: 'pending' },
];

const DEFAULT_STAKEHOLDERS = [
  { role: 'SUNROOTS HQ', name: '', org: 'SUNROOTS' },
  { role: 'SUNROOTS Guinea team', name: '', org: 'SUNROOTS Guinea' },
  { role: 'Local installer', name: '', org: '' },
  { role: 'Donor / partner', name: '', org: '' },
];

const DEFAULT_RISKS = [
  { risk: 'Water availability fluctuation (dry season)', mitigation: 'Measure minimum basin depth; size intake for low flow', severity: 'high' },
  { risk: 'Silt and sediment at intake', mitigation: 'Settling zone, gravel bed, screen maintenance schedule', severity: 'high' },
  { risk: 'PV shading (trees, structures)', mitigation: 'Panorama photos; relocate array or trim vegetation', severity: 'medium' },
  { risk: 'Theft (panels, pump, cables)', mitigation: 'Secure mounting, community watch, controller lockbox', severity: 'medium' },
  { risk: 'Operator maintenance gaps', mitigation: 'Training plan, spare parts kit, simple O&M checklist', severity: 'medium' },
];

const DEFAULT_PHOTO_SLOTS = [
  { label: 'PV location', filename: '', notes: '' },
  { label: 'Shading panorama', filename: '', notes: '' },
  { label: 'Access roads', filename: '', notes: '' },
];

const DEFAULT_PIPE_SEGMENTS = [
  { label: 'Source to hill base', length_m: '' },
  { label: 'Slope section', length_m: '' },
  { label: 'Top to tank', length_m: '' },
];

const PIPE_OPTIONS = [
  { mm: 25, label: 'DN25 (1")', c: 140 },
  { mm: 32, label: 'DN32 (1.25")', c: 140 },
  { mm: 40, label: 'DN40 (1.5")', c: 140 },
  { mm: 50, label: 'DN50 (2")', c: 140 },
  { mm: 63, label: 'DN63 (2.5")', c: 140 },
  { mm: 75, label: 'DN75 (3")', c: 140 },
  { mm: 90, label: 'DN90 (3")', c: 140 },
];

const ETA_DEFAULTS = { pumpCtrl: 0.45, array: 0.75, psh: 3.8, drawdown: 2, minorLoss: 0 };
const DEFAULT_PSH = 5;

const DEFAULT_BOM = [
  { item: 'Solar submersible / surface pump', qty: 1, unit: 'set', notes: 'Sized for TDH @ design flow', editable: true },
  { item: 'Solar pump controller (MPPT / VFD)', qty: 1, unit: 'set', notes: 'Dry-run protection included', editable: true },
  { item: 'PV modules', qty: '', unit: 'kWp', notes: 'Ground-mount array', editable: true },
  { item: 'Mounting structure', qty: 1, unit: 'set', notes: 'Wind-rated for site', editable: true },
  { item: 'HDPE rising main', qty: '', unit: 'm', notes: 'PN10/12.5 per static head', editable: true },
  { item: 'Storage tank (prefab)', qty: 1, unit: 'm³', notes: 'Rubber or steel tank', editable: true },
  { item: 'Intake screen / strainer', qty: 1, unit: 'set', notes: 'Surface water sediment handling', editable: true },
  { item: 'Submersible / power cable', qty: '', unit: 'm', notes: 'Size for voltage drop', editable: true },
  { item: 'Tank float switch', qty: 1, unit: 'pc', notes: 'Auto fill control', editable: true },
  { item: 'Dry-run probe', qty: 1, unit: 'pc', notes: 'Low water protection', editable: true },
];

const DEFAULT_SCENARIOS = [
  { label: 'Scenario A (conservative)', volume_m3_day: 10, t_sun_h: 5, results: {} },
  { label: 'Scenario B (target)', volume_m3_day: 20, t_sun_h: 5, results: {} },
];

const DEFAULT_PUMP_CURVE = [
  { Q: 5, H: 22 },
  { Q: 12, H: 20 },
  { Q: 18, H: 15 },
];

const RFQ_TEMPLATE_EN = `# Request for Quotation — {{projectName}}

## 1. Project overview

{{client}} requires a solar-powered irrigation system in **{{country}}**, modeled on the SUNROOTS Dubréka pilot: surface-water retention basin on a permanent stream, pump to hilltop storage tank, and PV array without batteries (unless noted).

**Procurement approach:** {{procurementApproach}}

## 2. Site profile

- **Water source:** Surface retention basin on stream (planned dimensions: {{basinDimensions}})
- **Pipeline:** Segmented route from source → hill base → slope → tank (total ~{{pipeLength}} m)
- **Static elevation gain:** {{staticHead}} m (minimum basin water level to tank inlet)
- **Target irrigated area:** {{areaHa}} ha — {{crops}} via {{irrigationMethod}}
- **Tank:** {{tankVolume}} m³ at ~{{tankElevation}} m elevation

## 3. Performance requirements

The system shall deliver **≥ {{volume}} m³/day** at **TDH ≈ {{TDH}} m** under typical dry-season solar conditions.

**Commissioning verification:** {{commissioningClause}}

## 4. Scope of supply

Vendor shall provide (as applicable):

- Pump complete with curve data (Head vs Flow at operating point)
- Solar pump controller with MPPT / VFD
- PV modules and mounting structure
- Rising main pipe and fittings (HDPE, rated for static head)
- Storage tank and level controls (float)
- Intake screen/strainer and sediment handling plan
- Installation, commissioning, operator training
- Warranty, datasheets, and spare parts list

## 5. Surface-water requirements

- Intake must include screen/strainer suitable for silt load
- Sediment settling and maintenance access documented
- Dry-run / low-water protection required

## 6. Submittals required with quote

1. Pump performance curve at quoted operating point
2. PV sizing calculation (kWp, PSH assumptions)
3. Bill of materials with lead times
4. Installation and training plan
5. Warranty terms (min. 2 years equipment)

---
*Issued by SUNROOTS — {{date}}*
`;

const RFQ_TEMPLATE_FR = `# Demande de devis — {{projectName}}

## 1. Aperçu du projet

{{client}} demande un système d'irrigation solaire en **{{country}}**, calqué sur le pilote SUNROOTS Dubréka : bassin de rétention sur cours d'eau permanent, pompe vers réservoir en hauteur, et champ PV sans batteries (sauf indication contraire).

**Approche d'approvisionnement :** {{procurementApproach}}

## 2. Profil du site

- **Source d'eau :** Bassin de rétention sur cours d'eau (dimensions prévues : {{basinDimensions}})
- **Canalisation :** Tracé segmenté source → pied de colline → pente → réservoir (~{{pipeLength}} m au total)
- **Dénivelé statique :** {{staticHead}} m (niveau d'eau minimum du bassin à l'entrée du réservoir)
- **Surface irriguée cible :** {{areaHa}} ha — {{crops}} par {{irrigationMethod}}
- **Réservoir :** {{tankVolume}} m³ à ~{{tankElevation}} m d'altitude

## 3. Exigences de performance

Le système doit fournir **≥ {{volume}} m³/jour** à **HMT ≈ {{TDH}} m** en conditions solaires typiques de saison sèche.

**Vérification à la mise en service :** {{commissioningClause}}

## 4. Périmètre de fourniture

Le fournisseur fournira (selon le cas) :

- Pompe avec courbe de performance (Hauteur vs Débit au point de fonctionnement)
- Contrôleur de pompe solaire avec MPPT / variateur
- Modules PV et structure de montage
- Conduite force et accessoires (PEHD, classée pour la hauteur statique)
- Réservoir et contrôle de niveau (flotteur)
- Crépine / filtre d'aspiration et plan de gestion des sédiments
- Installation, mise en service, formation des opérateurs
- Garantie, fiches techniques et liste de pièces de rechange

## 5. Exigences eau de surface

- Aspiration avec crépine adaptée à la charge en limon
- Zone de décantation et accès maintenance documentés
- Protection contre la marche à sec / bas niveau d'eau obligatoire

## 6. Documents à joindre au devis

1. Courbe de performance de la pompe au point de fonctionnement
2. Calcul dimensionnement PV (kWc, hypothèses PSH)
3. Nomenclature avec délais
4. Plan d'installation et de formation
5. Conditions de garantie (min. 2 ans équipement)

---
*Émis par SUNROOTS — {{date}}*
`;

const DUBREKA_BASELINE = {
  meta: { name: 'Dubréka Pilot (template)', designFreeze: null },
  step1_setup: {
    name: 'Dubréka Solar Irrigation Pilot',
    country: 'Guinea',
    region: 'Dubréka',
    client: 'Local farming community',
    gps: { site: '9.787, -13.523', waterSource: '9.788, -13.524', pvArea: '', tankArea: '' },
    area_ha: 2,
    crops: 'Vegetables, rice basins',
    irrigationMethod: 'drip',
    volume_m3_day: 20,
    successCriteria:
      'Deliver ≥ 20 m³/day under typical dry-season solar conditions, without batteries (unless optional).',
    stakeholders: DEFAULT_STAKEHOLDERS.map((s) => ({ ...s })),
  },
  step2_planning: {
    milestones: DEFAULT_MILESTONES.map((m) => ({ ...m })),
    assumptions: [
      'Surface retention basin on permanent stream',
      'Worst-month PSH ≈ 3.8 h/day (verify PVGIS)',
      'Static lift 50 m from minimum basin level to tank inlet',
      'Replication pilot target 20 m³/day; full design 100 m³/day',
      'No batteries — pump runs during sun hours only',
    ],
    decisions: [
      'Component-based procurement: pump + PV + local installer',
      'DN50 HDPE rising main for replication pilot route',
    ],
    risks: DEFAULT_RISKS.map((r) => ({ ...r })),
  },
  step3_field: {
    siteSolar: {
      photos: DEFAULT_PHOTO_SLOTS.map((p) => ({ ...p })),
      pvArea_m2: 80,
      tiltNotes: 'Ground mount; verify shading with panorama',
      solarNotes: 'PSH ~3.8 h/day worst month (verify PVGIS)',
      solarScreenshot: '',
    },
    waterSource: {
      basin: { L: 15, W: 8, depth: 3, depthFallback: 5 },
      minOpDepth: 1.5,
      siltNotes: 'Seasonal silt load; plan gravel bed and screen cleaning',
      intakePlan: 'Coarse screen + settling zone before pump intake',
    },
    hydraulics: {
      segments: DEFAULT_PIPE_SEGMENTS.map((s) => ({ ...s, length_m: s.label === 'Source to hill base' ? 30 : s.label === 'Slope section' ? 35 : 15 })),
      totalLength_m: 80,
      pipeDiameter_mm: 50,
      pipeMaterial: 'PE',
      hazenC: 140,
      fittingsLevel: 'med',
      staticHead_m: 50,
      fittings: { elbows: 8, valves: 3 },
      drawdown_m: 2,
      minorLoss_m: 0,
    },
    storage: {
      tankType: 'Prefab rubber tank',
      volume_m3: 20,
      autonomyDays: 1,
      elevation_m: 20,
      outletPressure_bar: '',
    },
    operations: {
      t_sun: 5,
      operatorSkill: 'Community operator — basic mechanical skills',
      maintenancePlan: 'Weekly screen check; monthly valve exercise; seasonal silt removal',
      spareParts: 'Float switch, fuses, gland seals, spare screen mesh',
      training: 'Fill/stop pump, read levels, basic troubleshooting, report to SUNROOTS',
    },
  },
  step4_validation: { lockedAt: null, checks: [], hasErrors: false },
  step5_design: {
    scenarioSync: { autoSync: true },
    scenarios: [
      { label: 'Scenario A (10 m³/day)', volume_m3_day: 10, t_sun_h: 5, results: {} },
      { label: 'Scenario B (20 m³/day)', volume_m3_day: 20, t_sun_h: 5, results: {} },
    ],
    pump: {
      type: 'submersible',
      maxHead: 70,
      ratedPower: 5.5,
      nominalFlow: 12,
      dryRun: true,
      curvePoints: DEFAULT_PUMP_CURVE.map((p) => ({ ...p })),
    },
    designParams: { pumpCtrl: 0.45, array: 0.75, psh: 3.8, drawdown: 2, minorLoss: 0 },
    bom: DEFAULT_BOM.map((b) => ({ ...b })),
  },
  step6_rfq: { approach: 'component_based', rfqEn_md: '', rfqFr_md: '' },
  step7_report: {
    commissioningClause: '',
    notes: 'Replication pilot based on Dubréka surface-water → hilltop tank concept.',
  },
  step8_fieldOps: {
    pvPanel: { pmax_W: 550, voc_V: 49.5, vmp_V: 41, isc_A: 13.8, imp_A: 13.4 },
    pvTotals: { vocTotal_V: '148.5', vmpTotal_V: '123.0', pArray_W: '1650', passVoc: true },
    wireCalc: { cableLength_m: 15, current_A: 17, dropPct: 3, systemVoltage_V: 123, area_mm2: '2.32', recommended_mm2: '4' },
    commissioning: { date: '', weather: '', startTime: '', endTime: '', runtime_min: '', method: 'tank_rise', volumeDelivered_m3: '', flow_m3h: '', dailyEstimate_m3: '', result: '' },
    omChecklist: { daily: {}, weekly: {}, monthly: {}, quarterly: {} },
    dailyLogs: [],
    maintenanceLogs: [],
    incidentLogs: [],
  },
};

function createEmptyProject() {
  const now = new Date().toISOString();
  return {
    meta: {
      id: 'proj_' + Date.now(),
      name: 'New Project',
      version: SCHEMA_VERSION,
      createdAt: now,
      updatedAt: now,
      designFreeze: null,
    },
    step1_setup: {
      name: '',
      country: '',
      region: '',
      client: '',
      gps: { site: '', waterSource: '', pvArea: '', tankArea: '' },
      area_ha: '',
      crops: '',
      irrigationMethod: 'drip',
      volume_m3_day: '',
      successCriteria: DEFAULT_SUCCESS_CRITERION.replace('{{volume}}', '20'),
      stakeholders: DEFAULT_STAKEHOLDERS.map((s) => ({ ...s })),
    },
    step2_planning: {
      milestones: DEFAULT_MILESTONES.map((m) => ({ ...m })),
      assumptions: [],
      decisions: [],
      risks: [],
    },
    step3_field: {
      siteSolar: {
        photos: DEFAULT_PHOTO_SLOTS.map((p) => ({ ...p })),
        pvArea_m2: '',
        tiltNotes: '',
        solarNotes: '',
        solarScreenshot: '',
      },
      waterSource: {
        basin: { L: '', W: '', depth: '', depthFallback: 5 },
        minOpDepth: '',
        siltNotes: '',
        intakePlan: '',
      },
      hydraulics: {
        segments: DEFAULT_PIPE_SEGMENTS.map((s) => ({ ...s })),
        totalLength_m: '',
        pipeDiameter_mm: 40,
        pipeMaterial: 'PE',
        hazenC: '',
        fittingsLevel: 'low',
        staticHead_m: '',
        fittings: { elbows: '', valves: '' },
        drawdown_m: ETA_DEFAULTS.drawdown,
        minorLoss_m: ETA_DEFAULTS.minorLoss,
      },
      storage: {
        tankType: '',
        volume_m3: '',
        autonomyDays: 1,
        elevation_m: '',
        outletPressure_bar: '',
      },
      operations: {
        t_sun: 5,
        operatorSkill: '',
        maintenancePlan: '',
        spareParts: '',
        training: '',
      },
    },
    step4_validation: { lockedAt: null, checks: [], hasErrors: false },
    step5_design: {
      scenarioSync: { autoSync: true },
      scenarios: DEFAULT_SCENARIOS.map((s) => ({ ...s, results: {} })),
      pump: {
        type: 'submersible',
        maxHead: '',
        ratedPower: '',
        nominalFlow: '',
        dryRun: true,
        curvePoints: DEFAULT_PUMP_CURVE.map((p) => ({ ...p })),
      },
      designParams: { ...ETA_DEFAULTS },
      bom: DEFAULT_BOM.map((b) => ({ ...b })),
    },
    step6_rfq: { approach: 'component_based', rfqEn_md: '', rfqFr_md: '' },
    step7_report: { commissioningClause: '', notes: '' },
    step8_fieldOps: JSON.parse(JSON.stringify(DEFAULT_STEP8_FIELD_OPS)),
  };
}
