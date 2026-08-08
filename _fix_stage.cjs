const { readFileSync, writeFileSync } = require('fs');
let c = readFileSync('src/routes/[lang]/(pages)/download/+page.svelte', 'utf8');

// Remove all remaining corrupted stage lines
const garbled = '确定取消好隐藏';
c = c.replace(/^[ \t]*\| 'fetching-ip'[\u4e00-\u9fff'\u786e\u5b9a\u53d6\u6d88\u597d\u9690\u85cf']+\r?\n/gm, '');
c = c.replace(/^[ \t]*\| 'checking-cache'[\u4e00-\u9fff'\u786e\u5b9a\u53d6\u6d88\u597d\u9690\u85cf']+\r?\n/gm, '');
c = c.replace(/^[ \t]*\| 'testing'[\u4e00-\u9fff'\u786e\u5b9a\u53d6\u6d88\u597d\u9690\u85cf']+\r?\n/gm, '');
c = c.replace(/^[ \t]*\| 'success'[\u4e00-\u9fff'\u786e\u5b9a\u53d6\u6d88\u597d\u9690\u85cf']+\r?\n/gm, '');
c = c.replace(/^\t*\| 'fallback'\u786e\u5b9a'\u53d6\u6d88'\u597d'\u9690\u85cf'/m, "\t\t| 'checking-cache'\n\t\t| 'testing'\n\t\t| 'success'\n\t\t| 'fallback'");

writeFileSync('src/routes/[lang]/(pages)/download/+page.svelte', c, 'utf8');
console.log('All stage lines fixed');
