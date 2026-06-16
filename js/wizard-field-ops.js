/* wizard-field-ops.js — Step 8: Field playbook, calculators, logbooks */

let fieldOpsActiveTab = 'playbook';

const P_LOAD_W = 1100;
const VOC_LIMIT_V = 160;
const V_RES_M3 = 20;
const Q_CATALOG_15HP = 8.82;
const Q_BRIEF_OPTIMISTIC = 31.2;
const F_DERATE = 0.75;
const RHO_CU = 1.68e-8;

function ensureFieldOps() {
  if (!project.step8_fieldOps) {
    project.step8_fieldOps = JSON.parse(JSON.stringify(DEFAULT_STEP8_FIELD_OPS));
  }
  if (!project.step8_fieldOps.wireCalc) {
    project.step8_fieldOps.wireCalc = JSON.parse(JSON.stringify(DEFAULT_STEP8_FIELD_OPS.wireCalc));
  }
  if (!project.step8_fieldOps.omChecklist) {
    project.step8_fieldOps.omChecklist = { daily: {}, weekly: {}, monthly: {}, quarterly: {} };
  }
  return project.step8_fieldOps;
}

function projectVolumeTarget() {
  return parseFloat(project.step1_setup.volume_m3_day) || 20;
}

function badge(label, level) {
  const cls =
    level === 'pass' ? 'badge-pass' : level === 'fail' ? 'badge-fail' : level === 'warn' ? 'badge-warn' : 'badge-info';
  return el('span', { className: 'playbook-badge ' + cls, text: label });
}

function labelTag(text, type) {
  const map = { mission: 'tag-mission', checkpoint: 'tag-checkpoint', tip: 'tag-tip', flag: 'tag-flag' };
  return el('span', { className: 'playbook-tag ' + (map[type] || 'tag-mission'), text: text });
}

function calcPvTotals(fo) {
  const voc = parseFloat(fo.pvPanel.voc_V);
  const vmp = parseFloat(fo.pvPanel.vmp_V);
  const pmax = parseFloat(fo.pvPanel.pmax_W);
  if (!voc) {
    fo.pvTotals.passVoc = null;
    return;
  }
  fo.pvTotals.vocTotal_V = (voc * 3).toFixed(1);
  fo.pvTotals.vmpTotal_V = vmp ? (vmp * 3).toFixed(1) : '';
  fo.pvTotals.pArray_W = pmax ? (pmax * 3).toFixed(0) : '';
  fo.pvTotals.passVoc = voc * 3 < VOC_LIMIT_V;
  if (vmp && !fo.wireCalc.systemVoltage_V) {
    fo.wireCalc.systemVoltage_V = vmp * 3;
  }
}

function calcWireSize(fo) {
  const w = fo.wireCalc;
  const L = parseFloat(w.cableLength_m) || 0;
  const I = parseFloat(w.current_A) || 17;
  const delta = (parseFloat(w.dropPct) || 3) / 100;
  const V = parseFloat(w.systemVoltage_V) || parseFloat(fo.pvTotals.vmpTotal_V) || 123;
  if (!L || !I || !V) return;
  const vDropMax = delta * V;
  const rTotal = vDropMax / I;
  const areaM2 = (2 * L * RHO_CU) / rTotal;
  const areaMm2 = areaM2 * 1e6;
  w.area_mm2 = areaMm2.toFixed(2);
  w.recommended_mm2 = String(WIRE_SIZES_MM2.find((s) => s >= Math.max(areaMm2, 4)) || 16);
}

function calcCommissioning(fo) {
  const c = fo.commissioning;
  if (c.startTime && c.endTime && !c.runtime_min) {
    const [sh, sm] = c.startTime.split(':').map(Number);
    const [eh, em] = c.endTime.split(':').map(Number);
    if (!isNaN(sh) && !isNaN(eh)) {
      const mins = eh * 60 + em - (sh * 60 + sm);
      if (mins > 0) c.runtime_min = mins;
    }
  }
  const vol = parseFloat(c.volumeDelivered_m3);
  const rt = parseFloat(c.runtime_min);
  if (vol > 0 && rt > 0) {
    c.flow_m3h = (vol / (rt / 60)).toFixed(2);
    const psh = parseFloat(project.step5_design?.designParams?.psh) || 5;
    c.dailyEstimate_m3 = (vol * (psh / (rt / 60))).toFixed(1);
  }
  const target = projectVolumeTarget();
  if (vol > 0) {
    if (vol >= target) c.result = 'PASS';
    else if (vol >= target * 0.8) c.result = 'CONDITIONAL';
    else c.result = 'FAIL';
  }
}

function renderMissionCard(mission, targetVol) {
  const details = el('details', { className: 'playbook-mission card' });
  details.open = mission.id === 'm1';
  const summary = el('summary');
  summary.appendChild(labelTag('Mission', 'mission'));
  summary.appendChild(el('span', { className: 'playbook-mission__title', text: mission.title.replace(/^Mission \d+ — /, '') }));
  if (mission.tabLink) {
    const link = el('button', { type: 'button', className: 'btn btn-ghost btn-sm playbook-mission__goto', text: 'Open tool →' });
    link.dataset.fieldOpsTab = mission.tabLink;
    summary.appendChild(link);
  }
  details.appendChild(summary);

  const body = el('div', { className: 'playbook-mission__body' });
  const goalP = el('p');
  goalP.innerHTML = '<strong>Goal:</strong> ' + mission.goal;
  body.appendChild(goalP);
  if (mission.need) {
    const needP = el('p');
    needP.innerHTML = '<strong>What you need:</strong> ' + mission.need;
    body.appendChild(needP);
  }

  if (mission.steps) {
    const ol = el('ol');
    mission.steps.forEach((s) => ol.appendChild(el('li', { text: s })));
    body.appendChild(el('p', { text: 'How to do it:' }));
    body.appendChild(ol);
  }
  if (mission.proTips) {
    mission.proTips.forEach((t) => {
      const p = el('p');
      p.appendChild(labelTag('Pro Tip', 'tip'));
      p.appendChild(document.createTextNode(' ' + t));
      body.appendChild(p);
    });
  }
  if (mission.redFlags) {
    mission.redFlags.forEach((t) => {
      const p = el('p');
      p.appendChild(labelTag('Red Flag', 'flag'));
      p.appendChild(document.createTextNode(' ' + t));
      body.appendChild(p);
    });
  }
  if (mission.mistakes) {
    body.appendChild(el('p', { text: 'Common mistakes: ' + mission.mistakes.join(' · ') }));
  }
  if (mission.passFail) {
    const ul = el('ul', { className: 'passfail-list' });
    mission.passFail.forEach((item) => {
      const li = el('li');
      li.appendChild(labelTag('Checkpoint', 'checkpoint'));
      li.appendChild(document.createTextNode(' ' + item));
      ul.appendChild(li);
    });
    body.appendChild(el('p', { text: 'Pass / Fail checks:' }));
    body.appendChild(ul);
  }
  details.appendChild(body);
  return details;
}

function renderPlaybookTab(container) {
  const target = projectVolumeTarget();
  const intro = el('div', { className: 'playbook-intro card' });
  intro.innerHTML = `
    <h3>${PLAYBOOK_META.title}</h3>
    <p class="form-hint">${PLAYBOOK_META.project} · ${PLAYBOOK_META.system}</p>
    <p><strong>What success looks like:</strong> ${PLAYBOOK_QUICK_START.success.replace('TARGET', String(target))}</p>
    <p>
      <a href="assets/playbook/dubreka-sunlight-pump.md" download class="btn btn-secondary btn-sm">Download full playbook</a>
      <button type="button" class="btn btn-secondary btn-sm" id="load-example-panel">Load example panel (550 W)</button>
    </p>
  `;
  container.appendChild(intro);

  const flags = el('div', { className: 'card playbook-redflags' });
  flags.appendChild(el('h4', { text: 'Top 3 causes of failure' }));
  const table = el('table', { className: 'data-table' });
  PLAYBOOK_QUICK_START.redFlags.forEach((r) => {
    const tr = el('tr');
    const td1 = el('td');
    td1.appendChild(labelTag('Red Flag', 'flag'));
    td1.appendChild(document.createTextNode(' '));
    const strong = el('strong', { text: r.title });
    td1.appendChild(strong);
    tr.appendChild(td1);
    tr.appendChild(el('td', { text: r.why }));
    table.appendChild(tr);
  });
  flags.appendChild(table);
  container.appendChild(flags);

  const safety = el('div', { className: 'card' });
  safety.appendChild(el('h4', { text: 'Before you start — safety checklist' }));
  const ul = el('ul', { className: 'checklist' });
  PLAYBOOK_QUICK_START.safetyChecklist.forEach((item) => {
    const li = el('li');
    li.appendChild(labelTag('Checkpoint', 'checkpoint'));
    li.appendChild(document.createTextNode(' ' + item));
    ul.appendChild(li);
  });
  safety.appendChild(ul);
  container.appendChild(safety);

  PLAYBOOK_MISSIONS.forEach((m) => container.appendChild(renderMissionCard(m, target)));

  const comm = el('div', { className: 'card' });
  comm.appendChild(el('h4', { text: 'A3 — Commissioning acceptance' }));
  comm.appendChild(el('p', { text: PLAYBOOK_COMMISSIONING.catalogNote }));
  const tierList = el('ul');
  PLAYBOOK_COMMISSIONING.tiers.forEach((t) => {
    const li = el('li');
    li.innerHTML = `<strong>${t.label}:</strong> ${t.desc.replace('target', String(target))}`;
    tierList.appendChild(li);
  });
  comm.appendChild(tierList);
  const commBtn = el('button', { type: 'button', className: 'btn btn-primary btn-sm', text: 'Open commissioning worksheet →' });
  commBtn.dataset.fieldOpsTab = 'commission';
  comm.appendChild(commBtn);
  container.appendChild(comm);

  const tree = el('div', { className: 'playbook-tree card' });
  tree.appendChild(el('h4', { text: 'C2 — Troubleshooting tree' }));
  const pre = el('pre', { className: 'playbook-tree__pre', text: PLAYBOOK_TROUBLESHOOTING });
  tree.appendChild(pre);
  container.appendChild(tree);

  const site = el('div', { className: 'card' });
  site.appendChild(el('h4', { text: 'What we still need to measure on-site' }));
  const siteTable = el('table', { className: 'data-table' });
  PLAYBOOK_SITE_MEASUREMENTS.forEach((row) => {
    const tr = el('tr');
    tr.appendChild(el('td', { text: row.measure }));
    tr.appendChild(el('td', { text: row.why }));
    siteTable.appendChild(tr);
  });
  site.appendChild(siteTable);
  container.appendChild(site);
}

function renderPvCheckTab(container) {
  const fo = ensureFieldOps();
  calcPvTotals(fo);

  container.appendChild(fieldHint('Mission 1 — Enter one panel nameplate; totals computed for 3 in series.'));

  const grid = el('div', { className: 'form-grid form-grid--2' });
  [
    ['Pmax (W)', 'step8_fieldOps.pvPanel.pmax_W', fo.pvPanel.pmax_W],
    ['Voc (V)', 'step8_fieldOps.pvPanel.voc_V', fo.pvPanel.voc_V],
    ['Vmp (V)', 'step8_fieldOps.pvPanel.vmp_V', fo.pvPanel.vmp_V],
    ['Isc (A)', 'step8_fieldOps.pvPanel.isc_A', fo.pvPanel.isc_A],
    ['Imp (A)', 'step8_fieldOps.pvPanel.imp_A', fo.pvPanel.imp_A],
  ].forEach(([label, path, val]) => grid.appendChild(inputField(label, path, val, 'number', { step: 'any' })));
  container.appendChild(grid);

  const pass = fo.pvTotals.passVoc;
  const pReq = (P_LOAD_W / F_DERATE).toFixed(0);
  const pArr = parseFloat(fo.pvTotals.pArray_W) || 0;
  const pPass = pArr >= parseFloat(pReq);

  const results = el('div', { className: 'calc-results card' });
  results.innerHTML = `
    <h4>Series totals (3 panels)</h4>
    <table class="data-table">
      <tr><td>Voc_total</td><td><strong>${fo.pvTotals.vocTotal_V || '—'} V</strong> (limit &lt; ${VOC_LIMIT_V} V)</td></tr>
      <tr><td>Vmp_total</td><td>${fo.pvTotals.vmpTotal_V || '—'} V</td></tr>
      <tr><td>P_array</td><td>${fo.pvTotals.pArray_W || '—'} W (need ≥ ${pReq} W)</td></tr>
      <tr><td>I_string ≈ Imp</td><td>${fo.pvPanel.imp_A || '—'} A (controller limit ~17 A)</td></tr>
    </table>
    <div class="badge-row">
      ${pass === true ? badge('PASS — Voc < 160 V', 'pass').outerHTML : pass === false ? badge('FAIL — Voc ≥ 160 V', 'fail').outerHTML : badge('Enter Voc', 'info').outerHTML}
      ${pArr ? (pPass ? badge('PASS — P_array OK', 'pass').outerHTML : badge('WARN — P_array low', 'warn').outerHTML) : ''}
    </div>
    <p class="form-hint">Pro Tip: 148–155 V Voc_total can boost output — measure cold-morning Voc on site.</p>
  `;
  container.appendChild(results);
}

function renderCommissioningTab(container) {
  const fo = ensureFieldOps();
  calcCommissioning(fo);
  const c = fo.commissioning;
  const target = projectVolumeTarget();

  container.appendChild(fieldHint('A3 — Record a clear-day test. Volume + runtime required for pass/fail.'));

  const grid = el('div', { className: 'form-grid form-grid--2' });
  [
    ['Date', 'step8_fieldOps.commissioning.date', c.date, 'date'],
    ['Weather', 'step8_fieldOps.commissioning.weather', c.weather, 'text'],
    ['Start time', 'step8_fieldOps.commissioning.startTime', c.startTime, 'time'],
    ['End time', 'step8_fieldOps.commissioning.endTime', c.endTime, 'time'],
    ['Runtime (min)', 'step8_fieldOps.commissioning.runtime_min', c.runtime_min, 'number'],
    ['Volume delivered (m³)', 'step8_fieldOps.commissioning.volumeDelivered_m3', c.volumeDelivered_m3, 'number'],
  ].forEach(([label, path, val, type]) => grid.appendChild(inputField(label, path, val, type, { step: 'any' })));
  container.appendChild(grid);

  container.appendChild(
    selectField('Method', 'step8_fieldOps.commissioning.method', c.method, [
      { value: 'tank_rise', label: 'Tank rise (πr²Δh or A×Δh)' },
      { value: 'container', label: 'Timed container' },
    ])
  );

  let resultBadge = badge('Enter volume + runtime', 'info');
  if (c.result === 'PASS') resultBadge = badge(`PASS — ≥ ${target} m³`, 'pass');
  else if (c.result === 'CONDITIONAL') resultBadge = badge(`CONDITIONAL — ${(target * 0.8).toFixed(0)}–${target} m³`, 'warn');
  else if (c.result === 'FAIL') resultBadge = badge(`FAIL — < ${(target * 0.8).toFixed(0)} m³`, 'fail');

  const out = el('div', { className: 'calc-results card' });
  out.innerHTML = `
    <h4>Commissioning results</h4>
    <table class="data-table">
      <tr><td>Estimated Q</td><td><strong>${c.flow_m3h || '—'} m³/h</strong></td></tr>
      <tr><td>Daily estimate (scaled to PSH)</td><td>${c.dailyEstimate_m3 || '—'} m³/day</td></tr>
      <tr><td>Project target</td><td>${target} m³/day</td></tr>
      <tr><td>Tank capacity</td><td>${project.step3_field?.storage?.volume_m3 || V_RES_M3} m³</td></tr>
    </table>
    <div class="badge-row">${resultBadge.outerHTML}</div>
    <p class="form-hint">${PLAYBOOK_COMMISSIONING.catalogNote}</p>
  `;
  container.appendChild(out);
}

function renderCalculatorsTab(container) {
  const fo = ensureFieldOps();
  calcPvTotals(fo);
  calcWireSize(fo);
  const w = fo.wireCalc;
  const psh = parseFloat(project.step5_design?.designParams?.psh) || 3.8;
  const staticHead = project.step3_field?.hydraulics?.staticHead_m || '—';
  const vmpTotal = fo.pvTotals.vmpTotal_V || '123';

  container.appendChild(el('h4', { text: 'B1–B4 — Energy & fill time' }));
  const energyCard = el('div', { className: 'calc-results card' });
  const energyRows = [
    ['P_load', `${P_LOAD_W} W`],
    ['E_day @ 38 min', `${((P_LOAD_W * 0.641) / 1000).toFixed(2)} kWh`],
    ['E_day @ 1 h', `${(P_LOAD_W / 1000).toFixed(2)} kWh`],
    ['E_day @ 2 h', `${((P_LOAD_W * 2) / 1000).toFixed(2)} kWh`],
    ['t_fill @ 31.2 m³/h (optimistic)', `${((V_RES_M3 / Q_BRIEF_OPTIMISTIC) * 60).toFixed(0)} min`],
    ['t_fill @ 8.82 m³/h (1.5 HP catalogue)', `${((V_RES_M3 / Q_CATALOG_15HP) * 60).toFixed(0)} min`],
    ['P_pv power match', `${(P_LOAD_W / F_DERATE).toFixed(0)} W`],
    ['P_pv energy @ 5 h run', `${(((P_LOAD_W * 5) / 1000) / (psh * F_DERATE)).toFixed(2)} kW needed`],
    ['Tilt (Dubréka ~9.8°N)', '~10° year-round · 12–15° dry season'],
    ['Static head (from Step 3)', `${staticHead} m`],
  ];
  const t1 = el('table', { className: 'data-table' });
  energyRows.forEach(([k, v]) => {
    const tr = el('tr');
    tr.appendChild(el('td', { text: k }));
    tr.appendChild(el('td', { text: v }));
    t1.appendChild(tr);
  });
  energyCard.appendChild(t1);
  container.appendChild(energyCard);

  container.appendChild(el('h4', { text: 'B5 — Wire sizing' }));
  const wireGrid = el('div', { className: 'form-grid form-grid--2' });
  wireGrid.appendChild(inputField('Cable length L (m, one-way)', 'step8_fieldOps.wireCalc.cableLength_m', w.cableLength_m, 'number', { step: 'any' }));
  wireGrid.appendChild(inputField('Current I (A)', 'step8_fieldOps.wireCalc.current_A', w.current_A, 'number', { step: 'any' }));
  wireGrid.appendChild(inputField('Drop fraction δ (%)', 'step8_fieldOps.wireCalc.dropPct', w.dropPct, 'number', { step: 'any' }));
  wireGrid.appendChild(inputField('System voltage V (Vmp_total)', 'step8_fieldOps.wireCalc.systemVoltage_V', w.systemVoltage_V || vmpTotal, 'number', { step: 'any' }));
  container.appendChild(wireGrid);

  const wireOut = el('div', { className: 'calc-results card' });
  wireOut.innerHTML = `
    <table class="data-table">
      <tr><td>Calculated area A</td><td>${w.area_mm2 || '—'} mm²</td></tr>
      <tr><td>Recommended (field min 4 mm²)</td><td><strong>${w.recommended_mm2 || '—'} mm²</strong></td></tr>
    </table>
    <p class="form-hint">If Voc 150–160 V: cable ≤ 15 m AND upsize conductor. Breaker at PV, not only at pump.</p>
  `;
  container.appendChild(wireOut);
}

function renderOmTab(container) {
  const fo = ensureFieldOps();
  const chk = fo.omChecklist;

  container.appendChild(fieldHint('C1 — Check off tasks when done. Drift signal: fill time > 20% longer than commissioning.'));

  Object.entries(PLAYBOOK_OM_TASKS).forEach(([interval, tasks]) => {
    const section = el('div', { className: 'card om-section' });
    section.appendChild(el('h4', { text: interval.charAt(0).toUpperCase() + interval.slice(1) }));
    tasks.forEach((task, i) => {
      const id = interval + '_' + i;
      const row = el('label', { className: 'checkbox-row om-row' });
      const box = el('input', { type: 'checkbox' });
      box.checked = !!chk[interval][id];
      box.dataset.omInterval = interval;
      box.dataset.omId = id;
      row.appendChild(box);
      row.appendChild(document.createTextNode(task));
      section.appendChild(row);
    });
    container.appendChild(section);
  });

  const tree = el('div', { className: 'playbook-tree card' });
  tree.appendChild(el('h4', { text: 'C2 — Troubleshooting' }));
  tree.appendChild(el('pre', { className: 'playbook-tree__pre', text: PLAYBOOK_TROUBLESHOOTING }));
  container.appendChild(tree);
}

function renderLogTable(container, logKey, columns) {
  const fo = ensureFieldOps();
  const logs = fo[logKey] || [];

  const wrap = el('div', { className: 'log-table-wrap' });
  const table = el('table', { className: 'data-table log-table' });
  const thead = el('thead');
  const hr = el('tr');
  columns.forEach((col) => hr.appendChild(el('th', { text: col.label })));
  hr.appendChild(el('th', { text: '' }));
  thead.appendChild(hr);
  table.appendChild(thead);

  const tbody = el('tbody');
  logs.forEach((row, i) => {
    const tr = el('tr');
    columns.forEach((col) => {
      const td = el('td');
      const inp = el('input', {
        className: 'form-input form-input--compact',
        type: col.type || 'text',
        value: row[col.key] ?? '',
        'data-log': logKey,
        'data-log-index': String(i),
        'data-log-key': col.key,
      });
      td.appendChild(inp);
      tr.appendChild(td);
    });
    const delTd = el('td');
    const delBtn = el('button', { type: 'button', className: 'btn btn-ghost btn-sm', text: 'Remove' });
    delBtn.dataset.logRemove = logKey;
    delBtn.dataset.logIndex = String(i);
    delTd.appendChild(delBtn);
    tr.appendChild(delTd);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);

  const addBtn = el('button', { type: 'button', className: 'btn btn-secondary btn-sm', text: '+ Add row' });
  addBtn.dataset.logAdd = logKey;
  wrap.appendChild(addBtn);
  container.appendChild(wrap);
}

function renderLogsTab(container) {
  container.appendChild(el('h4', { text: 'C3 — Daily operations log' }));
  renderLogTable(container, 'dailyLogs', [
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'startTime', label: 'Start', type: 'time' },
    { key: 'endTime', label: 'End', type: 'time' },
    { key: 'runtime_min', label: 'Runtime (min)', type: 'number' },
    { key: 'volume_m3', label: 'Volume (m³)', type: 'number' },
    { key: 'weather', label: 'Weather' },
    { key: 'notes', label: 'Notes' },
  ]);

  container.appendChild(el('h4', { text: 'Maintenance log' }));
  renderLogTable(container, 'maintenanceLogs', [
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'task', label: 'Task' },
    { key: 'parts', label: 'Parts' },
    { key: 'observations', label: 'Observations' },
    { key: 'nextDue', label: 'Next due', type: 'date' },
  ]);

  container.appendChild(el('h4', { text: 'Incident log' }));
  renderLogTable(container, 'incidentLogs', [
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'issueType', label: 'Issue type' },
    { key: 'symptoms', label: 'Symptoms' },
    { key: 'rootCause', label: 'Root cause' },
    { key: 'fix', label: 'Fix' },
    { key: 'downtime_h', label: 'Downtime (h)', type: 'number' },
  ]);
}

function loadExamplePanel() {
  const fo = ensureFieldOps();
  Object.assign(fo.pvPanel, PLAYBOOK_EXAMPLE_PANEL);
  fo.wireCalc.systemVoltage_V = PLAYBOOK_EXAMPLE_PANEL.vmp_V * 3;
  calcPvTotals(fo);
  calcWireSize(fo);
  scheduleAutosave();
  fieldOpsActiveTab = 'pv';
  showToast('Example 550 W panel loaded');
  renderWizard(8);
}

function bindFieldOpsEvents(container) {
  container.querySelectorAll('[data-log]').forEach((input) => {
    input.addEventListener('input', () => {
      const fo = ensureFieldOps();
      const idx = parseInt(input.dataset.logIndex, 10);
      const key = input.dataset.logKey;
      const logKey = input.dataset.log;
      if (fo[logKey] && fo[logKey][idx]) {
        fo[logKey][idx][key] = input.value;
        scheduleAutosave();
      }
    });
  });

  container.querySelectorAll('[data-log-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const fo = ensureFieldOps();
      const logKey = btn.dataset.logAdd;
      if (!fo[logKey]) fo[logKey] = [];
      fo[logKey].push({});
      scheduleAutosave();
      fieldOpsActiveTab = 'logs';
      renderWizard(8);
    });
  });

  container.querySelectorAll('[data-log-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const fo = ensureFieldOps();
      const logKey = btn.dataset.logRemove;
      const idx = parseInt(btn.dataset.logIndex, 10);
      fo[logKey].splice(idx, 1);
      scheduleAutosave();
      fieldOpsActiveTab = 'logs';
      renderWizard(8);
    });
  });

  container.querySelectorAll('[data-om-interval]').forEach((box) => {
    box.addEventListener('change', () => {
      const fo = ensureFieldOps();
      fo.omChecklist[box.dataset.omInterval][box.dataset.omId] = box.checked;
      scheduleAutosave();
    });
  });

  const exampleBtn = container.querySelector('#load-example-panel');
  if (exampleBtn) exampleBtn.addEventListener('click', loadExamplePanel);
}

function renderStep8(container) {
  ensureFieldOps();
  calcPvTotals(project.step8_fieldOps);
  calcWireSize(project.step8_fieldOps);
  calcCommissioning(project.step8_fieldOps);
  container.innerHTML = '';

  const tabs = el('div', { className: 'field-ops-tabs' });
  [
    { id: 'playbook', label: 'Playbook' },
    { id: 'pv', label: 'PV Check' },
    { id: 'commission', label: 'Commissioning' },
    { id: 'calc', label: 'Calculators' },
    { id: 'om', label: 'O&M' },
    { id: 'logs', label: 'Logs' },
  ].forEach((t) => {
    const btn = el('button', {
      type: 'button',
      className: 'field-ops-tab' + (t.id === fieldOpsActiveTab ? ' field-ops-tab--active' : ''),
      text: t.label,
    });
    btn.dataset.fieldOpsTab = t.id;
    tabs.appendChild(btn);
  });
  container.appendChild(tabs);

  const panel = el('div', { className: 'field-ops-panel' });
  switch (fieldOpsActiveTab) {
    case 'pv':
      renderPvCheckTab(panel);
      break;
    case 'commission':
      renderCommissioningTab(panel);
      break;
    case 'calc':
      renderCalculatorsTab(panel);
      break;
    case 'om':
      renderOmTab(panel);
      break;
    case 'logs':
      renderLogsTab(panel);
      break;
    default:
      renderPlaybookTab(panel);
  }
  container.appendChild(panel);

  bindFormInputs(container);
  bindFieldOpsEvents(container);

  container.querySelectorAll('[data-field-ops-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      fieldOpsActiveTab = btn.dataset.fieldOpsTab;
      renderWizard(8);
    });
  });

  container.querySelectorAll('[data-path^="step8_fieldOps.pvPanel"]').forEach((input) => {
    input.addEventListener('input', () => {
      calcPvTotals(ensureFieldOps());
      fieldOpsActiveTab = 'pv';
      renderWizard(8);
    });
  });
  container.querySelectorAll('[data-path^="step8_fieldOps.commissioning"]').forEach((input) => {
    input.addEventListener('input', () => {
      calcCommissioning(ensureFieldOps());
      fieldOpsActiveTab = 'commission';
      renderWizard(8);
    });
  });
  container.querySelectorAll('[data-path^="step8_fieldOps.wireCalc"]').forEach((input) => {
    input.addEventListener('input', () => {
      calcWireSize(ensureFieldOps());
      fieldOpsActiveTab = 'calc';
      renderWizard(8);
    });
  });
}

function openFieldOps(tab) {
  if (tab) fieldOpsActiveTab = tab;
  setCurrentStep(8);
  renderWizard(8);
  document.getElementById('readme')?.scrollIntoView({ behavior: 'smooth' });
}
