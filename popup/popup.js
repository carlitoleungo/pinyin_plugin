(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('toggle');

    browser.storage.local.get('enabled').then(({ enabled = true }) => {
      toggle.checked = enabled;
    });

    toggle.addEventListener('change', () => {
      browser.storage.local.set({ enabled: toggle.checked });
      browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        browser.tabs.sendMessage(tab.id, { type: 'SET_ENABLED', enabled: toggle.checked });
      }).catch(() => {}); // silently ignore if no content script on active tab (e.g. about: pages)
    });
  });
})();
