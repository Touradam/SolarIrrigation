/* wizard-state.js — project state, storage, validation */

let project = null;
let currentStep = 1;
let saveTimer = null;

function getProject() {
  return project;
}

function setProject(p) {
  project = p;
}

function getCurrentStep() {
  return currentStep;
}

function setCurrentStep(n) {
  currentStep = Math.max(1, Math.min(8, n));
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      project = JSON.parse(raw);
      if (!project.meta) project = createEmptyProject();
      if (!project.step8_fieldOps) {
        project.step8_fieldOps = JSON.parse(JSON.stringify(DEFAULT_STEP8_FIELD_OPS));
      } else {
        if (!project.step8_fieldOps.wireCalc) {
          project.step8_fieldOps.wireCalc = JSON.parse(JSON.stringify(DEFAULT_STEP8_FIELD_OPS.wireCalc));
        }
        if (!project.step8_fieldOps.omChecklist) {
          project.step8_fieldOps.omChecklist = { daily: {}, weekly: {}, monthly: {}, quarterly: {} };
        }
      }
    } else {
      project = createEmptyProject();
    }
  } catch (e) {
    project = createEmptyProject();
  }
  return project;
}

function saveProject() {
  if (!project) return;
  project.meta.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  showToast('Project saved');
}

function scheduleAutosave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (project) {
      project.meta.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    }
  }, 500);
}

function updateField(path, value) {
  const parts = path.split('.');
  let obj = project;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = /^\d+$/.test(parts[i]) ? parseInt(parts[i], 10) : parts[i];
    if (obj[key] === undefined || obj[key] === null) {
      obj[key] = /^\d+$/.test(parts[i + 1]) ? [] : {};
    }
    obj = obj[key];
  }
  const last = parts[parts.length - 1];
  const lastKey = /^\d+$/.test(last) ? parseInt(last, 10) : last;
  obj[lastKey] = value;
  if (path === 'step1_setup.volume_m3_day' && project.step5_design?.scenarioSync?.autoSync) {
    syncScenariosFromVolume(project);
  }
  scheduleAutosave();
}

function isFrozen() {
  return !!(project && project.meta.designFreeze);
}

function loadDubrekaBaseline() {
  function applyBaseline(data) {
    project = deepClone(data);
    project.meta = {
      id: 'proj_' + Date.now(),
      name: project.step1_setup.name,
      version: SCHEMA_VERSION,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      designFreeze: null,
    };
    if (!project.step8_fieldOps) {
      project.step8_fieldOps = JSON.parse(JSON.stringify(DUBREKA_BASELINE.step8_fieldOps || DEFAULT_STEP8_FIELD_OPS));
    }
    mergeRfqFromTemplates();
    runAllCalculations(project);
    scheduleAutosave();
    showToast('Dubréka baseline loaded');
    renderWizard(currentStep);
  }

  fetch('assets/seed/dubreka-baseline.json')
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then(applyBaseline)
    .catch(() => applyBaseline(DUBREKA_BASELINE));
}

function duplicateProject() {
  const base = deepClone(project);
  const resetGps = { site: '', waterSource: '', pvArea: '', tankArea: '' };
  base.meta = {
    id: 'proj_' + Date.now(),
    name: (base.step1_setup.name || 'Project') + ' (copy)',
    version: SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    designFreeze: null,
  };
  base.step1_setup.gps = resetGps;
  base.step1_setup.name = base.meta.name;
  base.step3_field.siteSolar.photos = DEFAULT_PHOTO_SLOTS.map((p) => ({ ...p }));
  base.step3_field.siteSolar.solarScreenshot = '';
  base.step3_field.hydraulics.staticHead_m = '';
  base.step3_field.hydraulics.segments = DEFAULT_PIPE_SEGMENTS.map((s) => ({ ...s }));
  base.step3_field.hydraulics.totalLength_m = '';
  base.step3_field.waterSource.basin = { L: '', W: '', depth: '', depthFallback: 5 };
  base.step4_validation = { lockedAt: null, checks: [], hasErrors: false };
  if (!base.step5_design.scenarioSync) base.step5_design.scenarioSync = { autoSync: true };
  base.step5_design.pump.curvePoints = DEFAULT_PUMP_CURVE.map((p) => ({ ...p }));
  project = base;
  scheduleAutosave();
  showToast('Project duplicated — site fields reset');
}

function exportJson() {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = slugify(project.step1_setup.name || 'project') + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('JSON exported');
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.step1_setup) throw new Error('Invalid project file');
      project = data;
      if (!project.meta) project.meta = { id: 'proj_' + Date.now(), version: SCHEMA_VERSION };
      project.meta.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      setCurrentStep(1);
      renderWizard(currentStep);
      renderDashboard();
      showToast('Project imported');
    } catch (err) {
      showToast('Import failed: invalid JSON');
    }
  };
  reader.readAsText(file);
}

function slugify(s) {
  return (s || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function lockDesignFreeze() {
  runValidation();
  if (!canLockDesignFreeze()) {
    showToast('Cannot lock — fix validation errors first');
    return false;
  }
  project.meta.designFreeze = 'v1';
  project.step4_validation.lockedAt = new Date().toISOString();
  scheduleAutosave();
  showToast('Design freeze v1 locked');
  return true;
}

function runValidation() {
  runAllCalculations(project);
  const checks = [];
  const s1 = project.step1_setup;
  const s3 = project.step3_field;
  const s5 = project.step5_design;
  const params = s5.designParams || ETA_DEFAULTS;
  const primary = s5.scenarios[s5.scenarios.length - 1] || s5.scenarios[0];
  const r = primary?.results || {};
  const b = r.tdhBreakdown || {};

  // V01 — Missing static lift
  const H_static = parseFloat(s3.hydraulics.staticHead_m);
  if (!H_static || H_static <= 0) {
    checks.push({ id: 'V01', level: 'error', field: 'Static head', msg: 'Missing static elevation gain (H_static) — critical for TDH' });
  }

  // V02 — Missing pipeline length
  const L_pipe = parseFloat(s3.hydraulics.totalLength_m);
  if (!L_pipe || L_pipe <= 0) {
    checks.push({ id: 'V02', level: 'error', field: 'Pipe length', msg: 'Missing pipeline total length (L_pipe)' });
  }

  // V03 — Missing daily volume
  const V_day = parseFloat(s1.volume_m3_day);
  if (!V_day || V_day <= 0) {
    checks.push({ id: 'V03', level: 'error', field: 'Target volume', msg: 'Missing target daily delivered volume (V_day)' });
  }

  // V04 — Friction dominates
  if (b.hf > 0 && b.TDH > 0 && b.hf > 0.3 * b.TDH) {
    checks.push({
      id: 'V04',
      level: 'warn',
      field: 'Friction',
      msg: `Friction losses (${fmt(b.hf, 1)} m) exceed 30% of TDH (${fmt(b.TDH, 1)} m) — consider larger pipe`,
    });
  }

  // V05 — Velocity too high
  if (r.velocity > 2) {
    checks.push({ id: 'V05', level: 'warn', field: 'Velocity', msg: `Pipe velocity ${fmt(r.velocity, 2)} m/s > 2 m/s — noise, surge, high friction risk` });
  }

  // V06 — Velocity too low
  if (r.velocity > 0 && r.velocity < 0.5) {
    checks.push({ id: 'V06', level: 'info', field: 'Velocity', msg: `Pipe velocity ${fmt(r.velocity, 2)} m/s < 0.5 m/s — sediment settling risk` });
  }

  // V07 — Tank undersized
  const tankVol = parseFloat(s3.storage.volume_m3);
  const autonomy = parseFloat(s3.storage.autonomyDays) || 1;
  if (V_day > 0 && tankVol > 0 && tankVol < V_day * autonomy) {
    checks.push({
      id: 'V07',
      level: 'warn',
      field: 'Tank volume',
      msg: `Tank ${tankVol} m³ < ${V_day} × ${autonomy} = ${V_day * autonomy} m³ required for autonomy`,
    });
  }

  // V08/V09 — Pump check on target scenario
  const pumpCheck = r.pumpCheck;
  if (pumpCheck) {
    if (pumpCheck.status === 'FAIL') {
      checks.push({ id: 'V08', level: 'error', field: 'Pump curve', msg: pumpCheck.msg });
    } else if (pumpCheck.status === 'BORDERLINE') {
      checks.push({ id: 'V09', level: 'warn', field: 'Pump curve', msg: pumpCheck.msg });
    }
  }

  // V10 — PV unusually large
  if (r.kWp > 20 && V_day > 0 && V_day < 30) {
    checks.push({ id: 'V10', level: 'info', field: 'PV size', msg: `PV ${fmt(r.kWp, 1)} kWp is large for ${V_day} m³/day — verify PSH and TDH` });
  }

  // V11 — Sun window too short
  const t_sun = parseFloat(primary?.t_sun_h) || 5;
  if (t_sun < 4 && r.Q > 15) {
    checks.push({ id: 'V11', level: 'warn', field: 'Sun hours', msg: `Short sun window (${t_sun} h) with high flow (${fmt(r.Q, 1)} m³/h) — verify pump and PV` });
  }

  // V12 — Efficiency out of range
  const eta = parseFloat(params.pumpCtrl);
  if (eta && (eta < 0.3 || eta > 0.6)) {
    checks.push({ id: 'V12', level: 'warn', field: 'Efficiency', msg: `Pump efficiency η=${eta} outside typical range 0.30–0.60` });
  }

  // V13 — PSH default
  const psh = parseFloat(params.psh);
  if (psh === DEFAULT_PSH || psh === 5) {
    checks.push({ id: 'V13', level: 'info', field: 'PSH', msg: 'PSH still at default 5 — verify worst-month value from PVGIS for your site' });
  }

  // V14 — TDH vs static mismatch
  if (b.TDH > 0 && H_static > 0 && b.TDH < H_static) {
    checks.push({ id: 'V14', level: 'warn', field: 'TDH', msg: `TDH (${fmt(b.TDH, 1)} m) < static lift (${H_static} m) — check inputs` });
  }

  // V15 — No pump curve
  const curve = s5.pump.curvePoints || [];
  const validPts = curve.filter((p) => parseFloat(p.Q) >= 0 && parseFloat(p.H) > 0);
  if (validPts.length < 3) {
    checks.push({ id: 'V15', level: 'info', field: 'Pump curve', msg: 'Fewer than 3 pump curve points — operating point check limited' });
  }

  if (!s1.gps.site) {
    checks.push({ level: 'warn', field: 'GPS (site)', msg: 'Site GPS coordinates not recorded (recommended)' });
  }

  const hasErrors = checks.some((c) => c.level === 'error');
  if (!hasErrors && checks.filter((c) => c.level !== 'info').length === 0) {
    checks.push({ level: 'ok', field: 'All critical', msg: 'Critical fields present — review info items before design freeze' });
  }

  project.step4_validation.checks = checks;
  project.step4_validation.hasErrors = hasErrors;
  scheduleAutosave();
  return checks;
}

function canLockDesignFreeze() {
  const checks = project.step4_validation.checks.length ? project.step4_validation.checks : runValidation();
  return !checks.some((c) => c.level === 'error');
}

function getStepCompletion(stepId) {
  if (!project) return 0;
  switch (stepId) {
    case 1: {
      const s = project.step1_setup;
      let n = 0;
      if (s.name) n += 20;
      if (s.country) n += 15;
      if (s.volume_m3_day) n += 25;
      if (s.gps.site) n += 20;
      if (s.successCriteria) n += 20;
      return Math.min(100, n);
    }
    case 2: {
      const s = project.step2_planning;
      let n = 0;
      if (s.milestones.some((m) => m.date)) n += 30;
      if (s.assumptions.length) n += 25;
      if (s.risks.length) n += 25;
      if (s.decisions.length) n += 20;
      return Math.min(100, n);
    }
    case 3: {
      const s = project.step3_field;
      let n = 0;
      if (s.hydraulics.staticHead_m) n += 25;
      if (s.hydraulics.totalLength_m) n += 25;
      if (s.storage.volume_m3) n += 20;
      if (s.waterSource.intakePlan) n += 15;
      if (s.siteSolar.photos.some((p) => p.filename)) n += 15;
      return Math.min(100, n);
    }
    case 4:
      return project.step4_validation.checks.length ? (project.meta.designFreeze ? 100 : 60) : 0;
    case 5:
      return project.step5_design.scenarios.some((sc) => sc.results && sc.results.TDH) ? 100 : 30;
    case 6:
      return project.step6_rfq.rfqEn_md ? 100 : 20;
    case 7:
      return project.step7_report.commissioningClause ? 80 : 20;
    case 8: {
      const fo = project.step8_fieldOps;
      if (!fo) return 0;
      let n = 0;
      if (fo.pvPanel?.voc_V) n += 25;
      if (fo.commissioning?.volumeDelivered_m3) n += 35;
      if (fo.dailyLogs?.length) n += 20;
      const om = fo.omChecklist || {};
      const omDone = ['daily', 'weekly', 'monthly', 'quarterly'].some((k) =>
        Object.values(om[k] || {}).some(Boolean)
      );
      if (omDone) n += 20;
      return Math.min(100, n);
    }
    default:
      return 0;
  }
}

function getOverallCompletion() {
  const total = WIZARD_STEPS.reduce((sum, s) => sum + getStepCompletion(s.id), 0);
  return Math.round(total / WIZARD_STEPS.length);
}

function mergeRfqFromTemplates() {
  if (!project.step6_rfq.rfqEn_md) {
    project.step6_rfq.rfqEn_md = fillTemplate(RFQ_TEMPLATE_EN);
  }
  if (!project.step6_rfq.rfqFr_md) {
    project.step6_rfq.rfqFr_md = fillTemplate(RFQ_TEMPLATE_FR);
  }
}

function fillTemplate(template) {
  const s1 = project.step1_setup;
  const s3 = project.step3_field;
  const s5 = project.step5_design;
  const s7 = project.step7_report;
  const scenario = s5.scenarios[s5.scenarios.length - 1] || s5.scenarios[0] || {};
  const results = scenario.results || {};
  const basin = s3.waterSource.basin;
  const basinDim = [basin.L, basin.W, basin.depth].filter(Boolean).join(' × ') || 'TBD';
  const approach =
    project.step6_rfq.approach === 'single_vendor'
      ? 'Single vendor A-to-Z'
      : 'Component-based (pump + PV + local installer)';

  const vars = {
    projectName: s1.name || 'TBD',
    client: s1.client || 'TBD',
    country: s1.country || 'TBD',
    basinDimensions: basinDim + ' m',
    pipeLength: s3.hydraulics.totalLength_m || 'TBD',
    staticHead: s3.hydraulics.staticHead_m || 'TBD',
    areaHa: s1.area_ha || 'TBD',
    crops: s1.crops || 'TBD',
    irrigationMethod: s1.irrigationMethod || 'TBD',
    tankVolume: s3.storage.volume_m3 || 'TBD',
    tankElevation: s3.storage.elevation_m || 'TBD',
    volume: s1.volume_m3_day || scenario.volume_m3_day || 'TBD',
    TDH: results.TDH ? results.TDH.toFixed(1) : 'TBD',
    procurementApproach: approach,
    commissioningClause: s7.commissioningClause || 'TBD',
    date: new Date().toLocaleDateString('en-GB'),
  };

  let out = template;
  Object.keys(vars).forEach((k) => {
    out = out.replace(new RegExp('\\{\\{' + k + '\\}\\}', 'g'), vars[k]);
  });
  return out;
}
