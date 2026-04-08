// PinyinOverlay — content script
// Runs in the context of every matching webpage.

(function () {
  'use strict';

  const CJK_RE = /[\u4E00-\u9FFF]/;

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

  const chineseNodes = findChineseTextNodes();
  console.log(`PinyinOverlay: found ${chineseNodes.length} Chinese text nodes`);
})();
