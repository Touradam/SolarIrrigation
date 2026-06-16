/* Headless calc acceptance tests — run: node test-calc.js */
const fs = require('fs');
const vm = require('vm');

const dataJs = fs.readFileSync('./js/data.js', 'utf8');
const calcJs = fs.readFileSync('./js/wizard-calc.js', 'utf8');

const sandbox = { console, Math, PIPE_OPTIONS: null, ETA_DEFAULTS: null, DEFAULT_PSH: null };
vm.createContext(sandbox);
vm.runInContext(dataJs, sandbox);
vm.runInContext(calcJs, sandbox);

const { crossCheckDubreka, calcScenario, runAllCalculations, pumpStatus } = sandbox;

const cc = crossCheckDubreka();
const okPv = Math.abs(cc.kWp - 12.7) < 0.2;
console.log('PV cross-check (expect ~12.7 kWp):', cc.kWp.toFixed(1), okPv ? 'PASS' : 'FAIL');

const project = {
  step1_setup: { volume_m3_day: 20, irrigationMethod: 'drip' },
  step3_field: {
    hydraulics: {
      staticHead_m: 50,
      totalLength_m: 80,
      pipeDiameter_mm: 50,
      fittingsLevel: 'med',
      drawdown_m: 2,
      minorLoss_m: 0,
    },
    storage: { autonomyDays: 1, volume_m3: 20, outletPressure_bar: '' },
    operations: { t_sun: 5 },
  },
  step5_design: {
    scenarioSync: { autoSync: true },
    scenarios: [
      { label: 'A', volume_m3_day: 10, t_sun_h: 5, results: {} },
      { label: 'B', volume_m3_day: 20, t_sun_h: 5, results: {} },
    ],
    pump: {
      curvePoints: [
        { Q: 5, H: 22 },
        { Q: 12, H: 20 },
        { Q: 18, H: 15 },
      ],
    },
    designParams: { pumpCtrl: 0.45, array: 0.75, psh: 3.8 },
    bom: [],
  },
  step7_report: { commissioningClause: '' },
};
runAllCalculations(project);

const scenB = project.step5_design.scenarios.find((s) => s.volume_m3_day === 20);
console.log('Scenario B (20 m³/day):', {
  Q: scenB?.results?.Q?.toFixed(2),
  TDH: scenB?.results?.TDH?.toFixed(1),
  kWp: scenB?.results?.kWp?.toFixed(1),
  pump: scenB?.results?.pumpCheck?.status,
});

const scenA = project.step5_design.scenarios.find((s) => s.volume_m3_day === 10);
console.log('Scenario A (10 m³/day):', {
  Q: scenA?.results?.Q?.toFixed(2),
  kWp: scenA?.results?.kWp?.toFixed(1),
});

const ps = pumpStatus(66, 60);
console.log('Pump margin test (66m @ TDH 60):', ps.status, ps.status === 'PASS' ? 'PASS' : 'FAIL');

const psFail = pumpStatus(55, 60);
console.log('Pump fail test (55m @ TDH 60):', psFail.status, psFail.status === 'FAIL' ? 'PASS' : 'FAIL');

const allPass = okPv && ps.status === 'PASS' && psFail.status === 'FAIL';
process.exit(allPass ? 0 : 1);
