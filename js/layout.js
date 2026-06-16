/* layout.js — header/footer injection */

const TOOL_ACTIONS = [
  { id: 'save', label: 'Save' },
  { id: 'export-json', label: 'Export JSON' },
  { id: 'import-json', label: 'Import JSON' },
  { id: 'export-rfq', label: 'Export RFQ' },
  { id: 'export-report', label: 'Export Report' },
  { id: 'export-zip', label: 'Export ZIP' },
  { id: 'duplicate', label: 'Duplicate Project' },
];

function renderHeader() {
  const mount = document.getElementById('header-mount');
  if (!mount) return;

  const actionsHtml = TOOL_ACTIONS.map(
    (a) => `<button type="button" class="tool-action" data-action="${a.id}">${a.label}</button>`
  ).join('');

  const stepLinks = WIZARD_STEPS.map(
    (s) => `<a href="#" data-step="${s.id}" class="nav-step-link">${s.id}. ${s.label}</a>`
  ).join('');

  mount.innerHTML = `
    <header class="site-header">
      <div class="site-header__inner">
        <a href="#" class="site-brand" id="brand-home">
          <img src="${LOGO_SRC}" alt="" width="28" height="28" />
          <span>${SITE_NAME}</span>
        </a>
        <nav class="nav-desktop" aria-label="Tool actions">
          ${stepLinks}
          <span style="width:1px;height:1.2rem;background:var(--border);margin:0 0.25rem"></span>
          ${actionsHtml}
        </nav>
        <button type="button" class="nav-toggle" id="nav-toggle" aria-label="Open menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
      <nav class="nav-mobile" id="nav-mobile" aria-label="Mobile menu">
        ${stepLinks}
        ${actionsHtml}
      </nav>
    </header>
  `;
}

function renderFooter() {
  const mount = document.getElementById('footer-mount');
  if (!mount) return;

  mount.innerHTML = `
    <footer class="site-footer section-gray">
      <div class="container">
        <p>${COPYRIGHT_HOLDER} · Works offline · Open <code>index.html</code> directly</p>
        <p><a href="#readme">Data storage &amp; export guide</a> · <a href="assets/playbook/dubreka-sunlight-pump.md">Field playbook</a> · <a href="https://github.com/Touradam/SolarIrrigation" target="_blank" rel="noopener">GitHub</a></p>
      </div>
    </footer>
  `;
}

function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const mobile = document.getElementById('nav-mobile');
  if (!toggle || !mobile) return;

  toggle.addEventListener('click', () => {
    const open = mobile.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  mobile.querySelectorAll('a, .tool-action').forEach((el) => {
    el.addEventListener('click', () => {
      mobile.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function updateActiveStepNav(stepId) {
  document.querySelectorAll('.nav-step-link').forEach((link) => {
    link.classList.toggle('active', parseInt(link.dataset.step, 10) === stepId);
  });
  document.querySelectorAll('.wizard-step').forEach((el) => {
    const id = parseInt(el.dataset.step, 10);
    el.classList.toggle('wizard-step--active', id === stepId);
  });
}
