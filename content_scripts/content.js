// PinyinOverlay — content script
// Runs in the context of every matching webpage.

(function () {
  'use strict';

  const CJK_RE = /[\u4E00-\u9FFF]/;
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'NOSCRIPT', 'RT', 'RUBY']);

  function findChineseTextNodes() {
    if (!document.body) return [];

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (CJK_RE.test(node.nodeValue)) {
        nodes.push(node);
      }
    }
    return nodes;
  }

  function annotateTextNode(node) {
    const parent = node.parentNode;
    if (!parent) return;
    if (SKIP_TAGS.has(parent.nodeName)) return;

    const text = node.nodeValue;
    const fragment = document.createDocumentFragment();
    let buffer = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (CJK_RE.test(char)) {
        if (buffer) {
          fragment.appendChild(document.createTextNode(buffer));
          buffer = '';
        }
        const ruby = document.createElement('ruby');
        ruby.appendChild(document.createTextNode(char));
        const rt = document.createElement('rt');
        rt.textContent = pinyinPro.pinyin(char, { toneType: 'symbol' });
        ruby.appendChild(rt);
        fragment.appendChild(ruby);
      } else {
        buffer += char;
      }
    }

    if (buffer) {
      fragment.appendChild(document.createTextNode(buffer));
    }

    parent.replaceChild(fragment, node);
  }

  const chineseNodes = findChineseTextNodes();
  chineseNodes.forEach(annotateTextNode);
})();
