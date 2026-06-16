/* wizard-docs.js — RFQ, report, ZIP export */

function markdownToHtml(md) {
  let html = md
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])/gim, (m) => (m.trim() ? m : ''));
  return '<div class="print-body"><p>' + html + '</p></div>';
}

function getPrintContainer(title, bodyHtml) {
  let container = document.getElementById('print-document');
  if (!container) {
    container = document.createElement('div');
    container.id = 'print-document';
    container.className = 'print-document';
    document.body.appendChild(container);
  }
  container.innerHTML = '<h1>' + title + '</h1>' + bodyHtml;
  return container;
}

async function renderToPdf(element, filename) {
  if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
    showToast('PDF libraries not loaded — check internet for first load');
    return;
  }
  const { jsPDF } = window.jspdf;
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const imgH = (canvas.height * pdfW) / canvas.width;
  let heightLeft = imgH;
  let position = 0;
  pdf.addImage(imgData, 'PNG', 0, position, pdfW, imgH);
  heightLeft -= pdfH;
  while (heightLeft > 0) {
    position = heightLeft - imgH;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, pdfW, imgH);
    heightLeft -= pdfH;
  }
  pdf.save(filename);
  showToast('PDF saved: ' + filename);
}

function exportRfqMd(lang) {
  const md = lang === 'fr' ? project.step6_rfq.rfqFr_md : project.step6_rfq.rfqEn_md;
  const blob = new Blob([md], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = slugify(project.step1_setup.name) + '-rfq-' + lang + '.md';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function exportRfqPdf(lang) {
  const md = lang === 'fr' ? project.step6_rfq.rfqFr_md : project.step6_rfq.rfqEn_md;
  const title = 'RFQ — ' + (project.step1_setup.name || 'Project') + (lang === 'fr' ? ' (FR)' : ' (EN)');
  const el = getPrintContainer(title, markdownToHtml(md));
  await renderToPdf(el, slugify(project.step1_setup.name) + '-rfq-' + lang + '.pdf');
}

function buildReportHtml() {
  const s1 = project.step1_setup;
  const s2 = project.step2_planning;
  const s3 = project.step3_field;
  const s5 = project.step5_design;
  const s7 = project.step7_report;

  let scenariosHtml = '<table><tr><th>Scenario</th><th>V m³/d</th><th>Q m³/h</th><th>TDH m</th><th>P_elec W</th><th>kWp</th><th>kWh/d</th><th>Pump</th></tr>';
  s5.scenarios.forEach((sc) => {
    const r = sc.results || {};
    scenariosHtml += `<tr><td>${sc.label}</td><td>${sc.volume_m3_day}</td><td>${fmt(r.Q, 2)}</td><td>${fmt(r.TDH, 1)}</td><td>${fmt(r.P_elec, 0)}</td><td>${fmt(r.kWp, 1)}</td><td>${fmt(r.E_elec, 2)}</td><td>${r.pumpCheck?.status || '—'}</td></tr>`;
  });
  scenariosHtml += '</table>';

  let mathHtml = '<h2>Calculation appendix</h2>';
  s5.scenarios.forEach((sc) => {
    if (!sc.results?.math) return;
    mathHtml += `<h3>${sc.label}</h3>`;
    sc.results.math.forEach((m) => {
      mathHtml += `<p><strong>${m.label}</strong><br>${m.formula}<br>${m.substitution}<br>= ${m.result}</p>`;
    });
  });

  let bomHtml = '<table><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Notes</th></tr>';
  s5.bom.forEach((b) => {
    bomHtml += `<tr><td>${b.item}</td><td>${b.qty}</td><td>${b.unit}</td><td>${b.notes || ''}</td></tr>`;
  });
  bomHtml += '</table>';

  let risksHtml = '<ul>';
  s2.risks.forEach((r) => {
    risksHtml += `<li><strong>${r.risk}</strong> — ${r.mitigation} (${r.severity})</li>`;
  });
  risksHtml += '</ul>';

  const photos = s3.siteSolar.photos.filter((p) => p.filename).map((p) => p.filename).join(', ') || 'None referenced';

  return `
    <h2>Executive summary</h2>
    <p>Solar irrigation project <strong>${s1.name}</strong> in ${s1.country}. Target ${s1.volume_m3_day} m³/day to serve ${s1.area_ha} ha (${s1.crops}) via ${s1.irrigationMethod}.</p>
    <h2>Objectives & success criteria</h2>
    <p>${s1.successCriteria}</p>
    <h2>Site description</h2>
    <p>Surface retention basin on stream. Static head ${s3.hydraulics.staticHead_m} m. Pipeline ${s3.hydraulics.totalLength_m} m, DN${s3.hydraulics.pipeDiameter_mm}. Tank ${s3.storage.volume_m3} m³ at ${s3.storage.elevation_m} m.</p>
    <p>Photo files (in assets/photos/): ${photos}</p>
    <h2>Assumptions</h2>
    <ul>${s2.assumptions.map((a) => '<li>' + a + '</li>').join('')}</ul>
    <h2>Design calculations</h2>
    ${scenariosHtml}
    ${mathHtml}
    <h2>Validation flags</h2>
    <ul>${(project.step4_validation.checks || []).map((c) => '<li>[' + (c.id || c.level) + '] ' + c.msg + '</li>').join('')}</ul>
    <h2>Bill of materials</h2>
    ${bomHtml}
    <h2>Risks & mitigations</h2>
    ${risksHtml}
    <h2>Commissioning plan</h2>
    <p>${s7.commissioningClause}</p>
    <h2>Next steps</h2>
    <p>Issue RFQ, procure components, install, commission with flow verification, train operators.</p>
  `;
}

async function exportReportPdf() {
  runAllCalculations(project);
  const title = 'Final Report — ' + (project.step1_setup.name || 'Project');
  const el = getPrintContainer(title, buildReportHtml());
  await renderToPdf(el, slugify(project.step1_setup.name) + '-final-report.pdf');
}

async function exportZipPackage() {
  if (typeof JSZip === 'undefined') {
    showToast('JSZip not loaded — check internet for first load');
    return;
  }
  runAllCalculations(project);
  mergeRfqFromTemplates();

  const zip = new JSZip();
  const slug = slugify(project.step1_setup.name);

  zip.file('project.json', JSON.stringify(project, null, 2));
  if (project.step8_fieldOps) {
    zip.file('field-ops-log.json', JSON.stringify(project.step8_fieldOps, null, 2));
  }
  zip.file('RFQ-en.md', project.step6_rfq.rfqEn_md);
  zip.file('RFQ-fr.md', project.step6_rfq.rfqFr_md);

  const photos = project.step3_field.siteSolar.photos
    .filter((p) => p.filename)
    .map((p) => `- ${p.label}: ${p.filename} — ${p.notes || ''}`)
    .join('\n');
  zip.file(
    'photos-manifest.txt',
    'Place these files in assets/photos/:\n\n' + (photos || '(no photos referenced)') + '\n'
  );

  const reportHtml = buildReportHtml();
  zip.file('FinalReport.html', '<html><body>' + reportHtml + '</body></html>');

  try {
    const title = 'Final Report — ' + (project.step1_setup.name || 'Project');
    const el = getPrintContainer(title, reportHtml);
    if (typeof html2canvas !== 'undefined' && typeof window.jspdf !== 'undefined') {
      const { jsPDF } = window.jspdf;
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const imgH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, imgH);
      zip.file('FinalReport.pdf', pdf.output('blob'));
    }
  } catch (e) {
    /* PDF optional in ZIP if libs fail */
  }

  try {
    const pbRes = await fetch('assets/playbook/dubreka-sunlight-pump.md');
    if (pbRes.ok) zip.file('playbook/dubreka-sunlight-pump.md', await pbRes.text());
  } catch (e) {
    /* playbook optional if fetch blocked */
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = slug + '-package.zip';
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('ZIP package exported');
}

function exportRfqBoth() {
  exportRfqMd('en');
  setTimeout(() => exportRfqMd('fr'), 300);
}
