/* main.js — bootstrap */

function initWizardNav() {
  document.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]');
    if (action) {
      e.preventDefault();
      handleToolAction(action.dataset.action);
      return;
    }
    const stepLink = e.target.closest('[data-step]');
    if (stepLink && stepLink.classList.contains('nav-step-link')) {
      e.preventDefault();
      setCurrentStep(parseInt(stepLink.dataset.step, 10));
      renderWizard(currentStep);
    }
    if (e.target.id === 'brand-home') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  const importInput = document.getElementById('import-file-input');
  if (importInput) {
    importInput.addEventListener('change', (e) => {
      if (e.target.files[0]) importJson(e.target.files[0]);
      e.target.value = '';
    });
  }
}

function handleToolAction(action) {
  switch (action) {
    case 'save':
      saveProject();
      break;
    case 'export-json':
      exportJson();
      break;
    case 'import-json':
      document.getElementById('import-file-input').click();
      break;
    case 'export-rfq':
      exportRfqBoth();
      break;
    case 'export-report':
      exportReportPdf();
      break;
    case 'export-zip':
      exportZipPackage();
      break;
    case 'duplicate':
      duplicateProject();
      renderWizard(currentStep);
      break;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  initMobileNav();
  loadProject();
  mergeRfqFromTemplates();
  runAllCalculations(project);
  renderWizard(currentStep);
  initWizardNav();
  initScrollReveal();
  initButtonRipples();
});
