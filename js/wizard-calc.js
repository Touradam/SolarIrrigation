/* wizard-calc.js — engineering calculations (SUNROOTS method) */

const RHO = 1000;
const G = 9.81;
const FITTINGS_FACTOR = { low: 0.05, med: 0.15, high: 0.3 };

function hazenWilliams(Q_m3s, L_m, D_m, C) {
  if (!Q_m3s || !L_m || !D_m || !C) return 0;
  return (10.67 * L_m * Math.pow(Q_m3s, 1.852)) / (Math.pow(C, 1.852) * Math.pow(D_m, 4.871));
}

function getPipeC(project) {
  const h = project.step3_field.hydraulics;
  const customC = parseFloat(h.hazenC);
  if (customC > 0) return customC;
  const opt = PIPE_OPTIONS.find((p) => p.mm === parseFloat(h.pipeDiameter_mm));
  return opt ? opt.c : 140;
}

function getFittingsFactor(level) {
  return FITTINGS_FACTOR[level] || FITTINGS_FACTOR.low;
}

function getDischargeHeadM(project) {
  const storage = project.step3_field.storage;
  const method = project.step1_setup.irrigationMethod;
  const pressureBar = parseFloat(storage.outletPressure_bar);
  if (pressureBar > 0) return pressureBar * 10.2;
  if (method === 'drip' || method === 'sprinkler') return 10;
  if (method === 'flood' || method === 'basin') return 2;
  return 0;
}

function calcVelocity(Q_m3s, D_m) {
  if (!Q_m3s || !D_m) return 0;
  return (4 * Q_m3s) / (Math.PI * D_m * D_m);
}

function calcTDH(project, Q_m3h) {
  const h = project.step3_field.hydraulics;
  const params = project.step5_design.designParams || ETA_DEFAULTS;

  const staticHead = parseFloat(h.staticHead_m) || 0;
  const drawdown = parseFloat(h.drawdown_m) ?? parseFloat(params.drawdown) ?? 2;
  const minorLoss = parseFloat(h.minorLoss_m) ?? parseFloat(params.minorLoss) ?? 0;
  const L = parseFloat(h.totalLength_m) || 0;
  const D_mm = parseFloat(h.pipeDiameter_mm) || 40;
  const D_m = D_mm / 1000;
  const C = getPipeC(project);
  const fittingsLevel = h.fittingsLevel || 'low';
  const fFit = getFittingsFactor(fittingsLevel);
  const L_eff = L * (1 + fFit);
  const Q_m3s = Q_m3h / 3600;

  const hf = hazenWilliams(Q_m3s, L_eff, D_m, C);
  const dischargeHead = getDischargeHeadM(project);
  const TDH = staticHead + drawdown + hf + minorLoss + dischargeHead;
  const velocity = calcVelocity(Q_m3s, D_m);

  return {
    staticHead,
    drawdown,
    hf,
    minorLoss,
    dischargeHead,
    TDH,
    L_eff,
    D_mm,
    D_m,
    C,
    fittingsLevel,
    fFit,
    Q_m3s,
    Q_m3h,
    velocity,
  };
}

function calcScenario(project, scenario) {
  const V = parseFloat(scenario.volume_m3_day) || 0;
  const tSun = parseFloat(scenario.t_sun_h) || parseFloat(project.step3_field.operations?.t_sun) || 5;
  const params = project.step5_design.designParams || ETA_DEFAULTS;
  const eta = parseFloat(params.pumpCtrl) || ETA_DEFAULTS.pumpCtrl;
  const psh = parseFloat(params.psh) || ETA_DEFAULTS.psh;
  const fDerate = parseFloat(params.array) || ETA_DEFAULTS.array;
  const N_aut = parseFloat(project.step3_field.storage.autonomyDays) || 1;

  const t_sun_s = tSun * 3600;
  const Q_req = tSun > 0 ? V / tSun : 0;
  const Q_req_m3s = tSun > 0 ? V / t_sun_s : 0;

  const tdhResult = calcTDH(project, Q_req);
  const TDH = tdhResult.TDH;

  const P_hyd = Q_req_m3s > 0 ? RHO * G * Q_req_m3s * TDH : 0;
  const P_elec = eta > 0 ? P_hyd / eta : 0;
  const E_day = P_elec * tSun;
  const E_day_kWh = E_day / 1000;
  const E_hyd = (RHO * G * V * TDH) / 3.6e6;
  const E_elec = E_day_kWh;
  const kWp = psh > 0 && fDerate > 0 ? E_day_kWh / (psh * fDerate) : 0;
  const P_class_kW = P_elec > 0 ? Math.ceil((P_elec / 1000) * 1.1 * 10) / 10 : 0;
  const V_tank_min = V * N_aut;
  const tankVol = parseFloat(project.step3_field.storage.volume_m3);
  const V_tank = tankVol > 0 ? tankVol : V_tank_min;

  const pumpCheck = checkPumpAtPoint(project, Q_req, TDH);

  const math = buildMathSteps({
    V,
    tSun,
    t_sun_s,
    Q_req,
    Q_req_m3s,
    N_aut,
    V_tank_min,
    tdhResult,
    P_hyd,
    P_elec,
    eta,
    E_day,
    E_day_kWh,
    psh,
    fDerate,
    kWp,
    P_class_kW,
  });

  return {
    Q: Q_req,
    Q_req_m3s,
    TDH,
    E_hyd,
    E_elec: E_day_kWh,
    E_day,
    E_day_kWh,
    P_hyd,
    P_elec,
    kWp,
    P_class_kW,
    V_tank_min,
    V_tank,
    tdhBreakdown: tdhResult,
    velocity: tdhResult.velocity,
    pumpCheck,
    math,
  };
}

function buildMathSteps(v) {
  const b = v.tdhResult;
  return [
    {
      id: 'Q_req',
      label: 'Required flow during pumping',
      formula: 'Q_req = V_day / (t_sun × 3600)',
      substitution: `= ${v.V} / (${v.tSun} × 3600)`,
      result: `${fmt(v.Q_req_m3s, 5)} m³/s = ${fmt(v.Q, 2)} m³/h`,
      explain: 'If you only pump when the sun is strong, you must pump faster during those hours to reach the daily target.',
    },
    {
      id: 'V_tank',
      label: 'Tank minimum (autonomy)',
      formula: 'V_tank_min = V_day × N_aut',
      substitution: `= ${v.V} × ${v.N_aut}`,
      result: `${fmt(v.V_tank_min, 1)} m³`,
      explain: 'Tank autonomy means how many days you can irrigate even with low sun or downtime.',
    },
    {
      id: 'H_friction',
      label: 'Friction loss (Hazen–Williams)',
      formula: 'H_f = 10.67 × L_eff × Q^1.852 / (C^1.852 × D^4.871)',
      substitution: `L_eff=${fmt(b.L_eff, 1)} m, Q=${fmt(b.Q_m3s, 5)} m³/s, C=${b.C}, D=${b.D_mm} mm`,
      result: `${fmt(b.hf, 2)} m`,
      explain: 'Small pipes create huge friction losses. If friction dominates TDH, increase pipe diameter.',
    },
    {
      id: 'TDH',
      label: 'Total Dynamic Head',
      formula: 'TDH = H_static + H_dd + H_f + H_minor + H_pressure',
      substitution: `= ${fmt(b.staticHead, 1)} + ${fmt(b.drawdown, 1)} + ${fmt(b.hf, 2)} + ${fmt(b.minorLoss, 1)} + ${fmt(b.dischargeHead, 1)}`,
      result: `${fmt(b.TDH, 2)} m`,
      explain: "TDH is the true 'difficulty' of pumping: lifting water up + pushing it through the pipe + any pressure needed at the outlet.",
    },
    {
      id: 'P_hyd',
      label: 'Hydraulic power',
      formula: 'P_hyd = ρ × g × Q × TDH',
      substitution: `= ${RHO} × ${G} × ${fmt(v.Q_req_m3s, 5)} × ${fmt(b.TDH, 2)}`,
      result: `${fmt(v.P_hyd, 0)} W`,
      explain: 'This is the theoretical power to move the water.',
    },
    {
      id: 'P_elec',
      label: 'Electrical input power',
      formula: 'P_elec = P_hyd / η_total',
      substitution: `= ${fmt(v.P_hyd, 0)} / ${v.eta}`,
      result: `${fmt(v.P_elec, 0)} W (class ≥ ${fmt(v.P_class_kW, 1)} kW)`,
      explain: 'Real pumps waste energy in the motor and hydraulics; efficiency bundles that.',
    },
    {
      id: 'E_day',
      label: 'Daily electrical energy',
      formula: 'E_day = P_elec × t_sun',
      substitution: `= ${fmt(v.P_elec, 0)} × ${v.tSun}`,
      result: `${fmt(v.E_day_kWh, 2)} kWh/day`,
      explain: 'Energy is power × time. This is what the PV must supply per day.',
    },
    {
      id: 'PV_kWp',
      label: 'PV array size',
      formula: 'PV_kWp = E_day_kWh / (PSH × f_derate)',
      substitution: `= ${fmt(v.E_day_kWh, 2)} / (${v.psh} × ${v.fDerate})`,
      result: `${fmt(v.kWp, 1)} kWp`,
      explain: 'Derate accounts for heat, dust, wiring, non-ideal tilt, and real-world losses.',
    },
  ];
}

function syncScenariosFromVolume(project) {
  const s5 = project.step5_design;
  if (!s5.scenarioSync) s5.scenarioSync = { autoSync: true };
  if (!s5.scenarioSync.autoSync) return;

  const V = parseFloat(project.step1_setup.volume_m3_day);
  if (!(V > 0)) return;
  const tSun = parseFloat(s5.scenarios[0]?.t_sun_h) || 5;

  if (s5.scenarios.length < 2) {
    s5.scenarios = [
      { label: 'Scenario A (conservative)', volume_m3_day: V * 0.5, t_sun_h: tSun, results: {} },
      { label: 'Scenario B (target)', volume_m3_day: V, t_sun_h: tSun, results: {} },
    ];
  } else {
    s5.scenarios[0].volume_m3_day = V * 0.5;
    s5.scenarios[0].label = s5.scenarios[0].label || `Scenario A (${V * 0.5} m³/day)`;
    s5.scenarios[1].volume_m3_day = V;
    s5.scenarios[1].label = s5.scenarios[1].label || `Scenario B (${V} m³/day)`;
  }
}

function runAllCalculations(project) {
  syncScenariosFromVolume(project);
  project.step5_design.scenarios.forEach((scenario) => {
    scenario.results = calcScenario(project, scenario);
  });
  updateBomFromCalc(project);
  project.step7_report.commissioningClause = buildCommissioningClause(project);
  return project.step5_design.scenarios;
}

function updateBomFromCalc(project) {
  const s3 = project.step3_field;
  const s5 = project.step5_design;
  const primary = s5.scenarios[s5.scenarios.length - 1] || s5.scenarios[0];
  const r = primary?.results || {};
  const b = r.tdhBreakdown || {};

  s5.bom.forEach((row) => {
    const item = row.item.toLowerCase();
    if (item.includes('pump') && !item.includes('controller')) {
      row.notes = `≥ ${fmt(r.P_class_kW, 1)} kW at ${fmt(r.TDH, 1)} m TDH, ${fmt(r.Q, 1)} m³/h`;
    }
    if (item.includes('pv module')) {
      row.qty = fmt(r.kWp, 1);
    }
    if (item.includes('hdpe') || item.includes('rising main')) {
      row.qty = s3.hydraulics.totalLength_m || '';
      row.notes = `DN${b.D_mm || s3.hydraulics.pipeDiameter_mm} mm, PN ≥ ${Math.ceil((r.TDH || 0) / 10)} bar`;
    }
    if (item.includes('tank')) {
      row.qty = r.V_tank || s3.storage.volume_m3 || '';
      row.notes = `≥ ${fmt(r.V_tank_min, 0)} m³ for autonomy`;
    }
  });
}

function buildCommissioningClause(project) {
  const s5 = project.step5_design;
  const scenA = s5.scenarios[0];
  const scenB = s5.scenarios[s5.scenarios.length - 1] || scenA;
  const rB = scenB?.results || {};
  const V_A = scenA?.volume_m3_day || 0;
  const V_B = scenB?.volume_m3_day || project.step1_setup.volume_m3_day || 0;
  const TDH = rB.TDH ? rB.TDH.toFixed(1) : 'TBD';

  return (
    `During commissioning, the vendor shall demonstrate delivery of ≥ ${V_B} m³/day (target) and ≥ ${V_A} m³/day (minimum acceptable) ` +
    `by simultaneous measurement of flow rate (m³/h or L/s) and logged pump runtime (h) over at least one full solar day, ` +
    `at TDH ≤ ${TDH} m (or measured static + friction). Record: date, weather, PSH estimate, cumulative volume.`
  );
}

function interpolatePumpHead(curvePoints, Q_target) {
  if (!curvePoints || curvePoints.length < 2) return null;
  const sorted = [...curvePoints]
    .map((p) => ({ Q: parseFloat(p.Q), H: parseFloat(p.H) }))
    .filter((p) => !isNaN(p.Q) && !isNaN(p.H))
    .sort((a, b) => a.Q - b.Q);
  if (sorted.length < 2) return null;
  if (Q_target <= sorted[0].Q) return sorted[0].H;
  if (Q_target >= sorted[sorted.length - 1].Q) return sorted[sorted.length - 1].H;

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (Q_target >= a.Q && Q_target <= b.Q) {
      const t = (Q_target - a.Q) / (b.Q - a.Q);
      return a.H + t * (b.H - a.H);
    }
  }
  return null;
}

function pumpStatus(headAtQ, TDH) {
  if (headAtQ === null || !(TDH > 0)) return { status: 'UNKNOWN', pass: false };
  if (headAtQ >= TDH * 1.1) return { status: 'PASS', pass: true };
  if (headAtQ >= TDH) return { status: 'BORDERLINE', pass: false };
  return { status: 'FAIL', pass: false };
}

function checkPumpAtPoint(project, Q, TDH) {
  const pump = project.step5_design.pump;
  const headAtQ = interpolatePumpHead(pump.curvePoints, Q);
  const { status, pass } = pumpStatus(headAtQ, TDH);

  let msg;
  if (headAtQ === null) {
    msg = 'Need at least 2 valid pump curve points';
  } else if (status === 'PASS') {
    msg = `Pump delivers ~${headAtQ.toFixed(1)} m at ${Q.toFixed(1)} m³/h (TDH ${TDH.toFixed(1)} m + 10% margin) — PASS`;
  } else if (status === 'BORDERLINE') {
    msg = `Pump head ~${headAtQ.toFixed(1)} m is within 10% of TDH ${TDH.toFixed(1)} m at ${Q.toFixed(1)} m³/h — BORDERLINE`;
  } else {
    msg = `Pump head ~${headAtQ.toFixed(1)} m insufficient for TDH ${TDH.toFixed(1)} m at ${Q.toFixed(1)} m³/h — FAIL`;
  }

  return { status, pass, Q, TDH, headAtQ, msg };
}

function checkPumpAtOperatingPoint(project) {
  const scenario = project.step5_design.scenarios.find((s) => s.results?.Q) || project.step5_design.scenarios[0];
  if (!scenario?.results) return { pass: false, status: 'UNKNOWN', msg: 'Run calculations first' };
  return checkPumpAtPoint(project, scenario.results.Q, scenario.results.TDH);
}

/** Cross-check: V=100, TDH=60, η=0.45, PSH=3.8, f_derate=0.75 → PV ≈ 12.7 kWp */
function crossCheckDubreka() {
  const E_hyd = (RHO * G * 100 * 60) / 3.6e6;
  const E_elec = E_hyd / 0.45;
  const kWp = E_elec / (3.8 * 0.75);
  return { E_hyd, E_elec, kWp };
}

function fmt(n, d) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });
}
