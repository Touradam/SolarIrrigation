/* wizard-render.js — step UI builders */

function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) {
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'className') node.className = v;
      else if (k === 'htmlFor') node.htmlFor = v;
      else if (k.startsWith('data-')) node.setAttribute(k, v);
      else if (k === 'text') node.textContent = v;
      else node.setAttribute(k, v);
    });
  }
  if (children) {
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c == null) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
  }
  return node;
}

function s3autonomyDays(s) {
  const v = project.step3_field.storage.autonomyDays;
  return v != null && v !== '' ? String(v) : '1';
}

function fieldHint(text) {
  return el('p', { className: 'form-hint field-guide', text: text });
}

function inputField(label, path, value, type, opts) {
  const frozen = isFrozen() && (path.startsWith('step1_') || path.startsWith('step3_'));
  const wrap = el('div', { className: 'form-group' + (frozen ? ' field--frozen' : '') });
  wrap.appendChild(el('label', { className: 'form-label', text: label }));
  const input = el('input', {
    className: 'form-input',
    type: type || 'text',
    value: value ?? '',
    'data-path': path,
  });
  if (opts && opts.step) input.step = opts.step;
  if (opts && opts.placeholder) input.placeholder = opts.placeholder;
  wrap.appendChild(input);
  if (opts && opts.hint) wrap.appendChild(el('p', { className: 'form-hint', text: opts.hint }));
  return wrap;
}

function selectField(label, path, value, options) {
  const wrap = el('div', { className: 'form-group' });
  wrap.appendChild(el('label', { className: 'form-label', text: label }));
  const sel = el('select', { className: 'form-select', 'data-path': path });
  options.forEach((o) => {
    const opt = el('option', { value: o.value, text: o.label });
    if (String(o.value) === String(value)) opt.selected = true;
    sel.appendChild(opt);
  });
  wrap.appendChild(sel);
  return wrap;
}

function textareaField(label, path, value, tall) {
  const wrap = el('div', { className: 'form-group' });
  wrap.appendChild(el('label', { className: 'form-label', text: label }));
  const ta = el('textarea', { className: 'form-textarea' + (tall ? ' form-textarea--tall' : ''), 'data-path': path });
  ta.value = value || '';
  wrap.appendChild(ta);
  return wrap;
}

function bindFormInputs(container) {
  container.querySelectorAll('[data-path]').forEach((input) => {
    const handler = () => {
      const path = input.dataset.path;
      let val = input.type === 'checkbox' ? input.checked : input.value;
      if (input.type === 'number' && val !== '') val = parseFloat(val);
      updateField(path, val);
      if (path.includes('hydraulics.segments') || path.includes('totalLength_m')) {
        recalcPipeTotal();
      }
    };
    input.addEventListener('input', handler);
    input.addEventListener('change', handler);
  });
}

function recalcPipeTotal() {
  const segs = project.step3_field.hydraulics.segments;
  const total = segs.reduce((sum, s) => sum + (parseFloat(s.length_m) || 0), 0);
  if (total > 0) {
    updateField('step3_field.hydraulics.totalLength_m', total);
    const inp = document.querySelector('[data-path="step3_field.hydraulics.totalLength_m"]');
    if (inp) inp.value = total;
  }
}

function renderStepper() {
  const mount = document.getElementById('wizard-stepper');
  if (!mount) return;
  mount.innerHTML = '';
  WIZARD_STEPS.forEach((step) => {
    const pct = getStepCompletion(step.id);
    const complete = pct >= 80;
    const item = el('div', {
      className: 'wizard-step' + (step.id === currentStep ? ' wizard-step--active' : '') + (complete ? ' wizard-step--complete' : ''),
      'data-step': String(step.id),
    });
    item.appendChild(el('span', { className: 'wizard-step__num', text: complete ? '✓' : String(step.id) }));
    item.appendChild(el('span', { className: 'wizard-step__label', text: step.label }));
    item.addEventListener('click', () => {
      setCurrentStep(step.id);
      renderWizard(currentStep);
    });
    mount.appendChild(item);
  });
}

function renderDashboard() {
  const mount = document.getElementById('wizard-dashboard');
  if (!mount) return;
  mount.innerHTML = '';
  const grid = el('div', { className: 'stats-grid' });
  WIZARD_STEPS.forEach((step) => {
    const pct = getStepCompletion(step.id);
    const card = el('div', {
      className: 'stat-card' + (pct >= 80 ? ' stat-card--complete' : pct < 40 ? ' stat-card--warn' : ''),
    });
    card.appendChild(el('div', { className: 'stat-value', text: pct + '%' }));
    card.appendChild(el('div', { className: 'stat-label', text: step.label }));
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      setCurrentStep(step.id);
      renderWizard(step.id);
      document.getElementById('wizard-content')?.scrollIntoView({ behavior: 'smooth' });
    });
    grid.appendChild(card);
  });
  mount.appendChild(grid);
  const overall = el('p', { className: 'text-center', text: 'Overall completion: ' + getOverallCompletion() + '%' });
  mount.appendChild(overall);

  const ctaRow = el('div', { className: 'dashboard-cta text-center' });
  const playbookBtn = el('button', {
    type: 'button',
    className: 'btn btn-primary btn-shine',
    text: 'Open Field Playbook (Step 8) →',
  });
  playbookBtn.addEventListener('click', () => openFieldOps('playbook'));
  ctaRow.appendChild(playbookBtn);
  mount.appendChild(ctaRow);
}

function renderWizard(stepId) {
  currentStep = stepId;
  renderStepper();
  renderDashboard();
  updateActiveStepNav(stepId);

  const mount = document.getElementById('wizard-content');
  if (!mount) return;

  const step = WIZARD_STEPS.find((s) => s.id === stepId);
  mount.innerHTML = '';

  const header = el('div', { className: 'section-header reveal-on-scroll' });
  header.appendChild(el('span', { className: 'section-eyebrow', text: step.eyebrow }));
  header.appendChild(el('h2', { className: 'section-title', text: step.label }));
  mount.appendChild(header);

  const panel = el('div', { className: 'wizard-main-panel' });
  switch (stepId) {
    case 1: renderStep1(panel); break;
    case 2: renderStep2(panel); break;
    case 3: renderStep3(panel); break;
    case 4: renderStep4(panel); break;
    case 5: renderStep5(panel); break;
    case 6: renderStep6(panel); break;
    case 7: renderStep7(panel); break;
    case 8: renderStep8(panel); break;
  }
  mount.appendChild(panel);

  const nav = el('div', { className: 'wizard-nav' });
  if (stepId > 1) {
    const prev = el('button', { type: 'button', className: 'btn btn-secondary', text: '← Previous' });
    prev.addEventListener('click', () => renderWizard(stepId - 1));
    nav.appendChild(prev);
  } else {
    nav.appendChild(el('span'));
  }
  if (stepId < 8) {
    const next = el('button', { type: 'button', className: 'btn btn-primary btn-shine', text: 'Next →' });
    next.addEventListener('click', () => renderWizard(stepId + 1));
    nav.appendChild(next);
  }
  mount.appendChild(nav);

  bindFormInputs(mount);
  initScrollReveal();
}

function renderStep1(container) {
  const s = project.step1_setup;
  const card = el('div', { className: 'card reveal-on-scroll' });
  card.appendChild(el('h3', { text: 'Project identity' }));

  const row1 = el('div', { className: 'form-row form-row--2' });
  row1.appendChild(inputField('Project name', 'step1_setup.name', s.name));
  row1.appendChild(inputField('Country', 'step1_setup.country', s.country));
  card.appendChild(row1);
  card.appendChild(inputField('Region / locality', 'step1_setup.region', s.region));

  card.appendChild(inputField('Client / community', 'step1_setup.client', s.client));
  card.appendChild(el('h3', { text: 'GPS coordinates' }));
  const gpsRow = el('div', { className: 'form-row form-row--2' });
  gpsRow.appendChild(inputField('Site', 'step1_setup.gps.site', s.gps.site, 'text', { placeholder: 'lat, lon' }));
  gpsRow.appendChild(inputField('Water source', 'step1_setup.gps.waterSource', s.gps.waterSource, 'text', { placeholder: 'lat, lon' }));
  card.appendChild(gpsRow);
  const gpsRow2 = el('div', { className: 'form-row form-row--2' });
  gpsRow2.appendChild(inputField('PV area', 'step1_setup.gps.pvArea', s.gps.pvArea));
  gpsRow2.appendChild(inputField('Tank area', 'step1_setup.gps.tankArea', s.gps.tankArea));
  card.appendChild(gpsRow2);

  const row2 = el('div', { className: 'form-row form-row--3' });
  row2.appendChild(inputField('Target area (ha)', 'step1_setup.area_ha', s.area_ha, 'number', { step: '0.1' }));
  row2.appendChild(inputField('Crops', 'step1_setup.crops', s.crops));
  row2.appendChild(
    selectField('Irrigation method', 'step1_setup.irrigationMethod', s.irrigationMethod, [
      { value: 'drip', label: 'Drip' },
      { value: 'sprinkler', label: 'Sprinkler' },
      { value: 'flood', label: 'Flood' },
      { value: 'basin', label: 'Basin / gravity' },
    ])
  );
  card.appendChild(row2);

  card.appendChild(inputField('Required volume (m³/day)', 'step1_setup.volume_m3_day', s.volume_m3_day, 'number', {
    step: '0.1',
    hint: 'What to measure: daily irrigation need. Why: drives pump flow and PV size. Typical: 10–20 m³/day for pilot, up to 100+ for full farm.',
  }));
  card.appendChild(
    selectField('Autonomy days (N_aut)', 'step3_field.storage.autonomyDays', s3autonomyDays(s), [
      { value: '0.5', label: '0.5 days' },
      { value: '1', label: '1 day (default)' },
      { value: '2', label: '2 days' },
      { value: '3', label: '3 days' },
    ])
  );
  card.appendChild(textareaField('Success criteria', 'step1_setup.successCriteria', s.successCriteria));

  card.appendChild(el('h3', { text: 'Stakeholders' }));
  const table = el('table', { className: 'data-table' });
  table.innerHTML = '<thead><tr><th>Role</th><th>Name</th><th>Organization</th></tr></thead>';
  const tbody = el('tbody');
  s.stakeholders.forEach((st, i) => {
    const tr = el('tr');
    ['role', 'name', 'org'].forEach((f) => {
      const td = el('td');
      const inp = el('input', { value: st[f] || '', 'data-path': `step1_setup.stakeholders.${i}.${f}` });
      td.appendChild(inp);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  card.appendChild(table);

  const btnRow = el('div', { className: 'btn-group' });
  const loadBtn = el('button', { type: 'button', className: 'btn btn-primary btn-shine', text: 'Load Dubréka baseline' });
  loadBtn.addEventListener('click', () => loadDubrekaBaseline());
  btnRow.appendChild(loadBtn);
  card.appendChild(btnRow);
  container.appendChild(card);
}

function renderStep2(container) {
  const s = project.step2_planning;

  const card1 = el('div', { className: 'card reveal-on-scroll' });
  card1.appendChild(el('h3', { text: 'Schedule milestones' }));
  const mTable = el('table', { className: 'data-table' });
  mTable.innerHTML = '<thead><tr><th>Milestone</th><th>Target date</th><th>Status</th></tr></thead>';
  const mtbody = el('tbody');
  s.milestones.forEach((m, i) => {
    const tr = el('tr');
    const td0 = el('td');
    td0.appendChild(el('input', { value: m.name, 'data-path': `step2_planning.milestones.${i}.name` }));
    tr.appendChild(td0);
    const td1 = el('td');
    td1.appendChild(el('input', { type: 'date', value: m.date, 'data-path': `step2_planning.milestones.${i}.date` }));
    tr.appendChild(td1);
    const td2 = el('td');
    const sel = el('select', { 'data-path': `step2_planning.milestones.${i}.status` });
    ['pending', 'in_progress', 'done'].forEach((st) => {
      const o = el('option', { value: st, text: st });
      if (m.status === st) o.selected = true;
      sel.appendChild(o);
    });
    td2.appendChild(sel);
    tr.appendChild(td2);
    mtbody.appendChild(tr);
  });
  mTable.appendChild(mtbody);
  card1.appendChild(mTable);
  container.appendChild(card1);

  ['assumptions', 'decisions'].forEach((key) => {
    const card = el('div', { className: 'card reveal-on-scroll' });
    card.appendChild(el('h3', { text: key.charAt(0).toUpperCase() + key.slice(1) + ' log' }));
    const list = el('ul', { className: 'check-list', id: key + '-list' });
    (s[key] || []).forEach((item, i) => {
      const li = el('li');
      const inp = el('input', { className: 'form-input', value: item, 'data-path': `step2_planning.${key}.${i}` });
      li.appendChild(inp);
      list.appendChild(li);
    });
    card.appendChild(list);
    const addBtn = el('button', { type: 'button', className: 'btn btn-secondary btn-sm', text: '+ Add' });
    addBtn.addEventListener('click', () => {
      project.step2_planning[key].push('');
      scheduleAutosave();
      renderWizard(2);
    });
    card.appendChild(addBtn);
    container.appendChild(card);
  });

  const riskCard = el('div', { className: 'card reveal-on-scroll' });
  riskCard.appendChild(el('h3', { text: 'Risks register' }));
  const rTable = el('table', { className: 'data-table' });
  rTable.innerHTML = '<thead><tr><th>Risk</th><th>Mitigation</th><th>Severity</th></tr></thead>';
  const rtbody = el('tbody');
  s.risks.forEach((r, i) => {
    const tr = el('tr');
    ['risk', 'mitigation'].forEach((f) => {
      const td = el('td');
      td.appendChild(el('input', { value: r[f] || '', 'data-path': `step2_planning.risks.${i}.${f}` }));
      tr.appendChild(td);
    });
    const tdS = el('td');
    const sel = el('select', { 'data-path': `step2_planning.risks.${i}.severity` });
    ['low', 'medium', 'high'].forEach((st) => {
      const o = el('option', { value: st, text: st });
      if (r.severity === st) o.selected = true;
      sel.appendChild(o);
    });
    tdS.appendChild(sel);
    tr.appendChild(tdS);
    rtbody.appendChild(tr);
  });
  rTable.appendChild(rtbody);
  riskCard.appendChild(rTable);
  const loadRisks = el('button', { type: 'button', className: 'btn btn-secondary btn-sm', text: 'Load default risks' });
  loadRisks.addEventListener('click', () => {
    project.step2_planning.risks = DEFAULT_RISKS.map((r) => ({ ...r }));
    scheduleAutosave();
    renderWizard(2);
  });
  riskCard.appendChild(loadRisks);
  container.appendChild(riskCard);
}

function renderStep3(container) {
  const s = project.step3_field;

  const callout = el('div', { className: 'hands-on-callout reveal-on-scroll' });
  callout.innerHTML = '<strong>Photo files:</strong> Enter filenames only. Place images in <code>assets/photos/</code> beside this app. They are listed in exports but not embedded in JSON.';
  container.appendChild(callout);

  const categories = [
    {
      title: 'Site / Solar',
      render: (body) => {
        s.siteSolar.photos.forEach((p, i) => {
          body.appendChild(inputField('Photo: ' + p.label, `step3_field.siteSolar.photos.${i}.filename`, p.filename, 'text', { placeholder: 'e.g. pv-site.jpg' }));
          body.appendChild(inputField('Notes', `step3_field.siteSolar.photos.${i}.notes`, p.notes));
        });
        body.appendChild(inputField('PV install area (m²)', 'step3_field.siteSolar.pvArea_m2', s.siteSolar.pvArea_m2, 'number'));
        body.appendChild(textareaField('Tilt / shading notes', 'step3_field.siteSolar.tiltNotes', s.siteSolar.tiltNotes));
        body.appendChild(textareaField('Solar resource notes', 'step3_field.siteSolar.solarNotes', s.siteSolar.solarNotes));
        body.appendChild(inputField('Solar screenshot filename', 'step3_field.siteSolar.solarScreenshot', s.siteSolar.solarScreenshot));
      },
    },
    {
      title: 'Water source (basin / stream)',
      render: (body) => {
        const row = el('div', { className: 'form-row form-row--4' });
        row.appendChild(inputField('Length (m)', 'step3_field.waterSource.basin.L', s.waterSource.basin.L, 'number'));
        row.appendChild(inputField('Width (m)', 'step3_field.waterSource.basin.W', s.waterSource.basin.W, 'number'));
        row.appendChild(inputField('Depth (m)', 'step3_field.waterSource.basin.depth', s.waterSource.basin.depth, 'number'));
        row.appendChild(inputField('Fallback depth (m)', 'step3_field.waterSource.basin.depthFallback', s.waterSource.basin.depthFallback, 'number'));
        body.appendChild(row);
        body.appendChild(inputField('Min. operating depth (m)', 'step3_field.waterSource.minOpDepth', s.waterSource.minOpDepth, 'number'));
        body.appendChild(textareaField('Silt / sediment notes', 'step3_field.waterSource.siltNotes', s.waterSource.siltNotes));
        body.appendChild(textareaField('Intake protection plan', 'step3_field.waterSource.intakePlan', s.waterSource.intakePlan));
      },
    },
    {
      title: 'Hydraulics',
      render: (body) => {
        body.appendChild(el('p', { className: 'form-hint', text: 'Static head from minimum basin water level to tank inlet — this drives TDH.' }));
        const segTable = el('table', { className: 'data-table' });
        segTable.innerHTML = '<thead><tr><th>Segment</th><th>Length (m)</th></tr></thead>';
        const stbody = el('tbody');
        s.hydraulics.segments.forEach((seg, i) => {
          const tr = el('tr');
          const td0 = el('td');
          td0.appendChild(el('input', { value: seg.label, 'data-path': `step3_field.hydraulics.segments.${i}.label` }));
          tr.appendChild(td0);
          const td1 = el('td');
          td1.appendChild(el('input', { type: 'number', value: seg.length_m, 'data-path': `step3_field.hydraulics.segments.${i}.length_m` }));
          tr.appendChild(td1);
          stbody.appendChild(tr);
        });
        segTable.appendChild(stbody);
        body.appendChild(segTable);
        body.appendChild(inputField('Total pipe length (m)', 'step3_field.hydraulics.totalLength_m', s.hydraulics.totalLength_m, 'number'));
        const pipeOpts = PIPE_OPTIONS.map((p) => ({ value: p.mm, label: p.label }));
        body.appendChild(selectField('Pipe diameter', 'step3_field.hydraulics.pipeDiameter_mm', s.hydraulics.pipeDiameter_mm, pipeOpts));
        body.appendChild(
          selectField('Fittings complexity', 'step3_field.hydraulics.fittingsLevel', s.hydraulics.fittingsLevel || 'low', [
            { value: 'low', label: 'Low (+5% length)' },
            { value: 'med', label: 'Medium (+15% length)' },
            { value: 'high', label: 'High (+30% length)' },
          ])
        );
        body.appendChild(inputField('Hazen–Williams C (optional)', 'step3_field.hydraulics.hazenC', s.hydraulics.hazenC, 'number', {
          placeholder: '140 for new PE/PVC',
        }));
        body.appendChild(inputField('Static elevation gain (m)', 'step3_field.hydraulics.staticHead_m', s.hydraulics.staticHead_m, 'number', {
          step: '0.1',
          hint: 'GPS/survey from minimum water level to tank inlet. This is the #1 driver of pump power.',
        }));
        const fitRow = el('div', { className: 'form-row form-row--2' });
        fitRow.appendChild(inputField('Elbows (est.)', 'step3_field.hydraulics.fittings.elbows', s.hydraulics.fittings.elbows, 'number'));
        fitRow.appendChild(inputField('Valves (est.)', 'step3_field.hydraulics.fittings.valves', s.hydraulics.fittings.valves, 'number'));
        body.appendChild(fitRow);
        const lossRow = el('div', { className: 'form-row form-row--2' });
        lossRow.appendChild(inputField('Drawdown margin (m)', 'step3_field.hydraulics.drawdown_m', s.hydraulics.drawdown_m, 'number'));
        lossRow.appendChild(inputField('Minor losses equiv. (m)', 'step3_field.hydraulics.minorLoss_m', s.hydraulics.minorLoss_m, 'number'));
        body.appendChild(lossRow);
      },
    },
    {
      title: 'Storage',
      render: (body) => {
        body.appendChild(inputField('Tank type', 'step3_field.storage.tankType', s.storage.tankType));
        body.appendChild(inputField('Volume target (m³)', 'step3_field.storage.volume_m3', s.storage.volume_m3, 'number'));
        body.appendChild(
          selectField('Days of autonomy', 'step3_field.storage.autonomyDays', s.storage.autonomyDays, [
            { value: '0.5', label: '0.5 days' },
            { value: '1', label: '1 day' },
            { value: '2', label: '2 days' },
          ])
        );
        body.appendChild(inputField('Tank elevation (m)', 'step3_field.storage.elevation_m', s.storage.elevation_m, 'number'));
        body.appendChild(inputField('Outlet pressure (bar)', 'step3_field.storage.outletPressure_bar', s.storage.outletPressure_bar, 'number', { step: '0.1' }));
      },
    },
    {
      title: 'Operations & solar window',
      render: (body) => {
        body.appendChild(
          inputField('Effective pumping sun hours (t_sun)', 'step3_field.operations.t_sun', s.operations.t_sun, 'number', {
            step: '0.5',
            hint: 'Typical dry season: 4–8 h. Default 5 h. Shorter window = higher required flow.',
          })
        );
        body.appendChild(textareaField('Operator skill level', 'step3_field.operations.operatorSkill', s.operations.operatorSkill));
        body.appendChild(textareaField('Maintenance plan', 'step3_field.operations.maintenancePlan', s.operations.maintenancePlan));
        body.appendChild(textareaField('Spare parts plan', 'step3_field.operations.spareParts', s.operations.spareParts));
        body.appendChild(textareaField('Training requirements', 'step3_field.operations.training', s.operations.training));
      },
    },
  ];

  categories.forEach((cat) => {
    const details = el('details', { className: 'faq-item reveal-on-scroll' });
    const summary = el('summary', { text: cat.title });
    details.appendChild(summary);
    const body = el('div', { className: 'faq-item__body' });
    cat.render(body);
    details.appendChild(body);
    container.appendChild(details);
  });

  const summaryCard = el('div', { className: 'card reveal-on-scroll' });
  summaryCard.appendChild(el('h3', { text: 'Field Data Summary' }));
  const ul = el('ul', { className: 'check-list' });
  ul.appendChild(el('li', { text: `Static head: ${s.hydraulics.staticHead_m || '—'} m` }));
  ul.appendChild(el('li', { text: `Pipe route: ${s.hydraulics.totalLength_m || '—'} m, DN${s.hydraulics.pipeDiameter_mm || '—'}` }));
  ul.appendChild(el('li', { text: `Tank: ${s.storage.volume_m3 || '—'} m³ @ ${s.storage.elevation_m || '—'} m` }));
  ul.appendChild(el('li', { text: `Basin: ${s.waterSource.basin.L || '?'}×${s.waterSource.basin.W || '?'}×${s.waterSource.basin.depth || '?'} m` }));
  summaryCard.appendChild(ul);
  const valBtn = el('button', { type: 'button', className: 'btn btn-secondary btn-sm', text: 'Go to validation →' });
  valBtn.addEventListener('click', () => renderWizard(4));
  summaryCard.appendChild(valBtn);
  container.appendChild(summaryCard);
}

function renderStep4(container) {
  const checks = runValidation();

  const card = el('div', { className: 'card reveal-on-scroll' });
  card.appendChild(el('h3', { text: 'Validation results' }));
  checks.forEach((c) => {
    const cls = c.level === 'error' ? 'alert--error' : c.level === 'warn' ? 'alert--warn' : c.level === 'info' ? 'alert--info' : 'alert--ok';
    const idTag = c.id ? `[${c.id}] ` : '';
    card.appendChild(el('div', { className: 'alert ' + cls, text: idTag + c.field + ': ' + c.msg }));
  });

  const runBtn = el('button', { type: 'button', className: 'btn btn-secondary btn-sm', text: 'Re-run validation' });
  runBtn.addEventListener('click', () => renderWizard(4));
  card.appendChild(runBtn);
  container.appendChild(card);

  const freezeCard = el('div', { className: 'card reveal-on-scroll' });
  freezeCard.appendChild(el('h3', { text: 'Design freeze' }));
  if (project.meta.designFreeze) {
    freezeCard.appendChild(el('div', { className: 'alert alert--ok', text: 'Design Freeze v1 locked at ' + project.step4_validation.lockedAt }));
  } else {
    freezeCard.appendChild(el('p', { text: 'Lock assumptions and field data before procurement. Steps 1–3 become read-only.' }));
    const lockBtn = el('button', { type: 'button', className: 'btn btn-primary btn-shine', text: 'Lock Design Freeze v1' });
    lockBtn.addEventListener('click', () => {
      if (lockDesignFreeze()) renderWizard(4);
    });
    if (!canLockDesignFreeze()) {
      freezeCard.appendChild(el('p', { className: 'form-hint', text: 'Fix all error-level validation items before locking.' }));
    }
    freezeCard.appendChild(lockBtn);
  }
  container.appendChild(freezeCard);

  const missingCard = el('div', { className: 'card reveal-on-scroll' });
  missingCard.appendChild(el('h3', { text: 'Missing data' }));
  const errors = checks.filter((c) => c.level === 'error');
  if (errors.length) {
    const ul = el('ul', { className: 'check-list' });
    errors.forEach((e) => ul.appendChild(el('li', { text: e.msg })));
    missingCard.appendChild(ul);
  } else {
    missingCard.appendChild(el('p', { text: 'No critical missing fields detected.' }));
  }
  container.appendChild(missingCard);
}

function renderMathAccordion(mathSteps, scenarioLabel) {
  const wrap = el('details', { className: 'math-accordion' });
  wrap.appendChild(el('summary', { text: `Show the math — ${scenarioLabel}` }));
  const body = el('div', { className: 'math-accordion__body' });
  (mathSteps || []).forEach((step) => {
    const block = el('div', { className: 'math-step' });
    block.appendChild(el('h4', { text: step.label }));
    block.appendChild(el('code', { className: 'math-formula', text: step.formula }));
    block.appendChild(el('code', { className: 'math-sub', text: step.substitution }));
    block.appendChild(el('p', { className: 'math-result', text: '= ' + step.result }));
    block.appendChild(el('p', { className: 'form-hint', text: step.explain }));
    body.appendChild(block);
  });
  wrap.appendChild(body);
  return wrap;
}

function renderTdhBar(breakdown) {
  if (!breakdown || !breakdown.TDH) return el('span');
  const total = breakdown.TDH;
  const parts = [
    { label: 'Static', val: breakdown.staticHead, cls: 'tdh-bar__static' },
    { label: 'Drawdown', val: breakdown.drawdown, cls: 'tdh-bar__dd' },
    { label: 'Friction', val: breakdown.hf, cls: 'tdh-bar__fric' },
    { label: 'Minor', val: breakdown.minorLoss, cls: 'tdh-bar__minor' },
    { label: 'Pressure', val: breakdown.dischargeHead, cls: 'tdh-bar__press' },
  ];
  const bar = el('div', { className: 'tdh-bar' });
  parts.forEach((p) => {
    if (p.val > 0) {
      const seg = el('div', {
        className: 'tdh-bar__seg ' + p.cls,
        title: `${p.label}: ${fmt(p.val, 1)} m`,
      });
      seg.style.flexGrow = p.val;
      bar.appendChild(seg);
    }
  });
  const legend = el('div', { className: 'tdh-legend' });
  parts.forEach((p) => {
    if (p.val > 0) legend.appendChild(el('span', { text: `${p.label} ${fmt(p.val, 1)} m · ` }));
  });
  const wrap = el('div');
  wrap.appendChild(bar);
  wrap.appendChild(legend);
  return wrap;
}

function renderScenarioComparison(scenarios) {
  const table = el('table', { className: 'data-table comparison-table' });
  table.innerHTML =
    '<thead><tr><th>Metric</th>' + scenarios.map((s) => `<th>${s.label}</th>`).join('') + '</tr></thead>';
  const tbody = el('tbody');
  const metrics = [
    { label: 'V_day (m³/day)', key: 'volume', fn: (sc) => sc.volume_m3_day },
    { label: 'Q_req (m³/h)', fn: (sc) => fmt(sc.results?.Q, 2) },
    { label: 'TDH (m)', fn: (sc) => fmt(sc.results?.TDH, 1) },
    { label: 'H_friction (m)', fn: (sc) => fmt(sc.results?.tdhBreakdown?.hf, 2) },
    { label: 'Velocity (m/s)', fn: (sc) => fmt(sc.results?.velocity, 2) },
    { label: 'P_elec (W)', fn: (sc) => fmt(sc.results?.P_elec, 0) },
    { label: 'PV (kWp)', fn: (sc) => fmt(sc.results?.kWp, 1) },
    { label: 'Tank min (m³)', fn: (sc) => fmt(sc.results?.V_tank_min, 0) },
    {
      label: 'Pump check',
      fn: (sc) => {
        const st = sc.results?.pumpCheck?.status || '—';
        return st;
      },
    },
  ];
  metrics.forEach((m) => {
    const tr = el('tr');
    tr.appendChild(el('td', { text: m.label }));
    scenarios.forEach((sc) => tr.appendChild(el('td', { text: String(m.fn(sc)) })));
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}

function renderWarningsPanel() {
  const checks = project.step4_validation.checks.length ? project.step4_validation.checks : runValidation();
  const panel = el('div', { className: 'card warnings-panel reveal-on-scroll' });
  panel.appendChild(el('h3', { text: 'Warnings & validation flags' }));
  const flagged = checks.filter((c) => c.level !== 'ok');
  if (!flagged.length) {
    panel.appendChild(el('p', { text: 'No warnings — design inputs look consistent.' }));
  } else {
    flagged.forEach((c) => {
      const cls = c.level === 'error' ? 'alert--error' : c.level === 'warn' ? 'alert--warn' : 'alert--info';
      panel.appendChild(el('div', { className: 'alert ' + cls, text: (c.id ? c.id + ': ' : '') + c.msg }));
    });
  }
  return panel;
}

let pumpChartInstance = null;

function renderPumpChart(s5, primaryResults) {
  const card = el('div', { className: 'card reveal-on-scroll' });
  card.appendChild(el('h3', { text: 'Pump curve & operating point' }));
  const canvas = el('canvas', { id: 'pump-curve-chart' });
  canvas.height = 280;
  card.appendChild(canvas);

  if (typeof Chart === 'undefined') {
    card.appendChild(el('p', { className: 'form-hint', text: 'Chart.js not loaded — connect once for chart view.' }));
    return card;
  }

  const curve = (s5.pump.curvePoints || [])
    .map((p) => ({ x: parseFloat(p.Q), y: parseFloat(p.H) }))
    .filter((p) => !isNaN(p.x) && !isNaN(p.y))
    .sort((a, b) => a.x - b.x);

  const r = primaryResults || {};
  const opQ = r.Q || 0;
  const opTDH = r.TDH || 0;
  const headAtQ = r.pumpCheck?.headAtQ;

  setTimeout(() => {
    const ctx = document.getElementById('pump-curve-chart');
    if (!ctx) return;
    if (pumpChartInstance) pumpChartInstance.destroy();
    pumpChartInstance = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Pump curve',
            data: curve,
            showLine: true,
            borderColor: '#c4a35a',
            backgroundColor: '#c4a35a',
            tension: 0.1,
          },
          {
            label: 'Required TDH @ Q',
            data: [{ x: opQ, y: opTDH }],
            backgroundColor: '#e85d5d',
            pointRadius: 8,
          },
          {
            label: 'Pump head @ Q',
            data: headAtQ != null ? [{ x: opQ, y: headAtQ }] : [],
            backgroundColor: '#5d9ee8',
            pointRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: 'Flow (m³/h)' } },
          y: { title: { display: true, text: 'Head (m)' } },
        },
        plugins: { legend: { labels: { color: '#eceae4' } } },
      },
    });
  }, 50);

  return card;
}

function renderStep5(container) {
  runAllCalculations(project);
  const s5 = project.step5_design;
  const primary = s5.scenarios[s5.scenarios.length - 1] || s5.scenarios[0];
  const pumpCheck = primary?.results?.pumpCheck || checkPumpAtOperatingPoint(project);

  const syncCard = el('div', { className: 'card reveal-on-scroll' });
  syncCard.appendChild(el('h3', { text: 'Scenario volumes' }));
  const autoSync = s5.scenarioSync?.autoSync !== false;
  const syncLabel = el('label', { className: 'checkbox-row' });
  const syncCb = el('input', { type: 'checkbox' });
  syncCb.checked = autoSync;
  syncCb.addEventListener('change', () => {
    if (!project.step5_design.scenarioSync) project.step5_design.scenarioSync = {};
    project.step5_design.scenarioSync.autoSync = syncCb.checked;
    if (syncCb.checked) syncScenariosFromVolume(project);
    scheduleAutosave();
    renderWizard(5);
  });
  syncLabel.appendChild(syncCb);
  syncLabel.appendChild(document.createTextNode(' Auto-sync A = 50% and B = 100% of target V_day (editable below)'));
  syncCard.appendChild(syncLabel);
  container.appendChild(syncCard);

  const paramsCard = el('div', { className: 'card reveal-on-scroll' });
  paramsCard.appendChild(el('h3', { text: 'Design parameters' }));
  const pRow = el('div', { className: 'form-row form-row--4' });
  pRow.appendChild(
    inputField('Pump+ctrl η_total', 'step5_design.designParams.pumpCtrl', s5.designParams.pumpCtrl, 'number', { step: '0.01' })
  );
  pRow.appendChild(
    inputField('PV derate f_derate', 'step5_design.designParams.array', s5.designParams.array, 'number', { step: '0.01' })
  );
  pRow.appendChild(inputField('PSH (kWh/m²/day)', 'step5_design.designParams.psh', s5.designParams.psh, 'number', { step: '0.1' }));
  paramsCard.appendChild(pRow);
  const calcBtn = el('button', { type: 'button', className: 'btn btn-primary btn-shine', text: 'Recalculate' });
  calcBtn.addEventListener('click', () => {
    runAllCalculations(project);
    renderWizard(5);
  });
  paramsCard.appendChild(calcBtn);
  container.appendChild(paramsCard);

  container.appendChild(renderWarningsPanel());

  const scenGrid = el('div', { className: 'stats-grid reveal-on-scroll' });
  s5.scenarios.forEach((sc, i) => {
    const r = sc.results || {};
    const card = el('div', { className: 'stat-card summary-card' });
    card.appendChild(el('div', { className: 'stat-label', text: sc.label }));
    card.appendChild(el('div', { className: 'stat-value', text: fmt(sc.volume_m3_day, 0) + ' m³/day' }));
    card.appendChild(el('p', { className: 'summary-line', text: `Q ${fmt(r.Q, 2)} m³/h · TDH ${fmt(r.TDH, 1)} m` }));
    card.appendChild(el('p', { className: 'summary-line', text: `PV ${fmt(r.kWp, 1)} kWp · Pump ≥ ${fmt(r.P_class_kW, 1)} kW` }));
    const badgeCls =
      r.pumpCheck?.status === 'PASS'
        ? 'badge--ok'
        : r.pumpCheck?.status === 'BORDERLINE'
          ? 'badge--warn'
          : r.pumpCheck?.status === 'FAIL'
            ? 'badge--fail'
            : 'badge--neutral';
    card.appendChild(el('span', { className: 'badge ' + badgeCls, text: r.pumpCheck?.status || 'N/A' }));
    card.appendChild(inputField('Volume m³/day', `step5_design.scenarios.${i}.volume_m3_day`, sc.volume_m3_day, 'number'));
    card.appendChild(inputField('Sun hours', `step5_design.scenarios.${i}.t_sun_h`, sc.t_sun_h, 'number'));
    if (r.tdhBreakdown) card.appendChild(renderTdhBar(r.tdhBreakdown));
    scenGrid.appendChild(card);
  });
  container.appendChild(scenGrid);

  const compCard = el('div', { className: 'card reveal-on-scroll' });
  compCard.appendChild(el('h3', { text: 'Scenario comparison' }));
  compCard.appendChild(renderScenarioComparison(s5.scenarios));
  const narrative = el('div', { className: 'scenario-narrative' });
  narrative.innerHTML =
    '<p><strong>Scenario A</strong> (conservative): lower PV kWp, easier commissioning proof, lower flow stress on pipe and pump.</p>' +
    '<p><strong>Scenario B</strong> (target): full daily objective; higher kWp and flow — verify pump PASS and pipe velocity.</p>';
  compCard.appendChild(narrative);
  container.appendChild(compCard);

  s5.scenarios.forEach((sc) => {
    if (sc.results?.math) container.appendChild(renderMathAccordion(sc.results.math, sc.label));
  });

  const tdhCard = el('div', { className: 'card reveal-on-scroll' });
  tdhCard.appendChild(el('h3', { text: 'TDH breakdown (target scenario)' }));
  if (primary?.results?.tdhBreakdown) {
    const b = primary.results.tdhBreakdown;
    const ul = el('ul', { className: 'check-list' });
    ul.appendChild(el('li', { text: `Static: ${fmt(b.staticHead, 1)} m` }));
    ul.appendChild(el('li', { text: `Drawdown: ${fmt(b.drawdown, 1)} m` }));
    ul.appendChild(el('li', { text: `Friction (Hazen–Williams): ${fmt(b.hf, 2)} m (L_eff=${fmt(b.L_eff, 0)} m)` }));
    ul.appendChild(el('li', { text: `Minor: ${fmt(b.minorLoss, 1)} m` }));
    ul.appendChild(el('li', { text: `Discharge pressure: ${fmt(b.dischargeHead, 1)} m` }));
    ul.appendChild(el('li', { text: `TDH total: ${fmt(b.TDH, 1)} m` }));
    ul.appendChild(el('li', { text: `Velocity: ${fmt(b.velocity, 2)} m/s (DN${b.D_mm})` }));
    tdhCard.appendChild(ul);
    tdhCard.appendChild(renderTdhBar(b));
  }
  container.appendChild(tdhCard);

  const pumpCard = el('div', { className: 'card reveal-on-scroll' });
  pumpCard.appendChild(el('h3', { text: 'Pump selection' }));
  const pRow2 = el('div', { className: 'form-row form-row--3' });
  pRow2.appendChild(
    selectField('Type', 'step5_design.pump.type', s5.pump.type, [
      { value: 'submersible', label: 'Submersible' },
      { value: 'surface', label: 'Surface' },
    ])
  );
  pRow2.appendChild(inputField('Max head (m)', 'step5_design.pump.maxHead', s5.pump.maxHead, 'number'));
  pRow2.appendChild(inputField('Rated power (kW)', 'step5_design.pump.ratedPower', s5.pump.ratedPower, 'number'));
  pumpCard.appendChild(pRow2);
  pumpCard.appendChild(inputField('Nominal flow (m³/h)', 'step5_design.pump.nominalFlow', s5.pump.nominalFlow, 'number'));

  pumpCard.appendChild(el('h3', { text: 'Pump curve — at least 3 points (Head m, Flow m³/h)' }));
  const curveTable = el('table', { className: 'data-table' });
  curveTable.innerHTML = '<thead><tr><th>Q (m³/h)</th><th>H (m)</th></tr></thead>';
  const cbody = el('tbody');
  s5.pump.curvePoints.forEach((pt, i) => {
    const tr = el('tr');
    ['Q', 'H'].forEach((f) => {
      const td = el('td');
      td.appendChild(el('input', { type: 'number', value: pt[f], 'data-path': `step5_design.pump.curvePoints.${i}.${f}` }));
      tr.appendChild(td);
    });
    cbody.appendChild(tr);
  });
  curveTable.appendChild(cbody);
  pumpCard.appendChild(curveTable);
  const addPt = el('button', { type: 'button', className: 'btn btn-secondary btn-sm', text: '+ Add point' });
  addPt.addEventListener('click', () => {
    s5.pump.curvePoints.push({ Q: '', H: '' });
    scheduleAutosave();
    renderWizard(5);
  });
  pumpCard.appendChild(addPt);

  const badgeCls =
    pumpCheck.status === 'PASS' ? 'badge--ok' : pumpCheck.status === 'BORDERLINE' ? 'badge--warn' : 'badge--fail';
  pumpCard.appendChild(el('span', { className: 'badge ' + badgeCls, text: pumpCheck.status || 'UNKNOWN' }));
  pumpCard.appendChild(el('p', { text: pumpCheck.msg }));
  container.appendChild(pumpCard);

  container.appendChild(renderPumpChart(s5, primary?.results));

  const bomCard = el('div', { className: 'card reveal-on-scroll' });
  bomCard.appendChild(el('h3', { text: 'Bill of Materials (starter)' }));
  const bomTable = el('table', { className: 'data-table' });
  bomTable.innerHTML = '<thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Spec hint</th></tr></thead>';
  const bbody = el('tbody');
  s5.bom.forEach((row, i) => {
    const tr = el('tr');
    ['item', 'qty', 'unit', 'notes'].forEach((f) => {
      const td = el('td');
      td.appendChild(el('input', { value: row[f] ?? '', 'data-path': `step5_design.bom.${i}.${f}` }));
      tr.appendChild(td);
    });
    bbody.appendChild(tr);
  });
  bomTable.appendChild(bbody);
  bomCard.appendChild(bomTable);
  container.appendChild(bomCard);
}

function renderStep6(container) {
  mergeRfqFromTemplates();
  const s6 = project.step6_rfq;

  const card = el('div', { className: 'card reveal-on-scroll' });
  card.appendChild(el('h3', { text: 'Procurement approach' }));
  card.appendChild(
    selectField('Approach', 'step6_rfq.approach', s6.approach, [
      { value: 'single_vendor', label: 'Single vendor A-to-Z' },
      { value: 'component_based', label: 'Component-based + local installer' },
    ])
  );
  const regenBtn = el('button', { type: 'button', className: 'btn btn-secondary btn-sm', text: 'Regenerate from template' });
  regenBtn.addEventListener('click', () => {
    project.step6_rfq.rfqEn_md = fillTemplate(RFQ_TEMPLATE_EN);
    project.step6_rfq.rfqFr_md = fillTemplate(RFQ_TEMPLATE_FR);
    scheduleAutosave();
    renderWizard(6);
  });
  card.appendChild(regenBtn);
  container.appendChild(card);

  container.appendChild(el('div', { className: 'card reveal-on-scroll' }));
  const enCard = container.lastChild;
  enCard.appendChild(el('h3', { text: 'RFQ — English' }));
  enCard.appendChild(textareaField('', 'step6_rfq.rfqEn_md', s6.rfqEn_md, true));

  const frCard = el('div', { className: 'card reveal-on-scroll' });
  frCard.appendChild(el('h3', { text: 'RFQ — Français' }));
  frCard.appendChild(textareaField('', 'step6_rfq.rfqFr_md', s6.rfqFr_md, true));
  container.appendChild(frCard);

  const btnRow = el('div', { className: 'btn-group' });
  ['en', 'fr'].forEach((lang) => {
    const mdBtn = el('button', { type: 'button', className: 'btn btn-secondary', text: `Download RFQ ${lang.toUpperCase()} .md` });
    mdBtn.addEventListener('click', () => exportRfqMd(lang));
    btnRow.appendChild(mdBtn);
    const pdfBtn = el('button', { type: 'button', className: 'btn btn-primary btn-shine', text: `Export RFQ ${lang.toUpperCase()} PDF` });
    pdfBtn.addEventListener('click', () => exportRfqPdf(lang));
    btnRow.appendChild(pdfBtn);
  });
  container.appendChild(btnRow);
}

function renderStep7(container) {
  const s7 = project.step7_report;
  runAllCalculations(project);

  const card = el('div', { className: 'card reveal-on-scroll' });
  card.appendChild(el('h3', { text: 'Commissioning verification' }));
  const regenBtn = el('button', { type: 'button', className: 'btn btn-secondary btn-sm', text: 'Regenerate from calculations' });
  regenBtn.addEventListener('click', () => {
    runAllCalculations(project);
    updateField('step7_report.commissioningClause', project.step7_report.commissioningClause);
    renderWizard(7);
  });
  card.appendChild(regenBtn);
  card.appendChild(textareaField('Commissioning clause', 'step7_report.commissioningClause', s7.commissioningClause));
  card.appendChild(textareaField('Additional notes', 'step7_report.notes', s7.notes));
  container.appendChild(card);

  const preview = el('div', { className: 'card reveal-on-scroll' });
  preview.appendChild(el('h3', { text: 'Report preview' }));
  const ul = el('ul', { className: 'check-list' });
  ul.appendChild(el('li', { text: 'Executive summary + objectives' }));
  ul.appendChild(el('li', { text: 'Site description + photo file list' }));
  ul.appendChild(el('li', { text: 'Calculations & design results (all scenarios)' }));
  ul.appendChild(el('li', { text: 'BOM + procurement plan + risks' }));
  ul.appendChild(el('li', { text: 'Commissioning checklist + appendices' }));
  preview.appendChild(ul);
  container.appendChild(preview);

  const btnRow = el('div', { className: 'btn-group' });
  const reportBtn = el('button', { type: 'button', className: 'btn btn-primary btn-shine', text: 'Export Final Report PDF' });
  reportBtn.addEventListener('click', () => exportReportPdf());
  btnRow.appendChild(reportBtn);
  const zipBtn = el('button', { type: 'button', className: 'btn btn-primary btn-shine', text: 'Export project ZIP package' });
  zipBtn.addEventListener('click', () => exportZipPackage());
  btnRow.appendChild(zipBtn);
  container.appendChild(btnRow);
}
