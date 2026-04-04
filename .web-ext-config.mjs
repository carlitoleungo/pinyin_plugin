// web-ext configuration for PinyinOverlay
// Docs: https://extensionworkshop.com/documentation/develop/web-ext-command-reference/

export default {
  sourceDir: '.',
  run: {
    firefox: '/Applications/Firefox.app/Contents/MacOS/firefox',
    startUrl: ['about:newtab'],
  },
  lint: {
    selfHosted: false,
  },
};
