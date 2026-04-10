(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('toggle');

    browser.storage.local.get('enabled').then(({ enabled = true }) => {
      toggle.checked = enabled;
    });

    toggle.addEventListener('change', () => {
      browser.storage.local.set({ enabled: toggle.checked });
    });
  });
})();
