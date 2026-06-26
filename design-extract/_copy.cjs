const fs = require('fs');
const path = require('path');
const dir = 'C:\\Users\\weixi\\.trae-cn\\worktrees\\Html Write\\feat-build-project-from-design-noWCTD\\design-extract\\pages';
const files = fs.readdirSync(dir);
const src = files.find(f => f.endsWith('.html') && !f.startsWith('editor-'));
const data = fs.readFileSync(path.join(dir, src));
const dst = path.join(dir, 'editor-workbench.html');
fs.writeFileSync(dst, data);
console.log('copied', src, '->', dst, data.length, 'bytes');
