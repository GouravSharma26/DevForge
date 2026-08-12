const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../apps/frontend');

const replacements = {
  'rgb(var(--bg-base))': 'var(--bg-base)',
  'rgb(var(--bg-surface))': 'var(--bg-surface)',
  'rgb(var(--text-primary))': 'var(--text-primary)',
  'rgb(var(--text-secondary))': 'var(--text-secondary)',
  'rgb(var(--text-muted))': 'var(--text-muted)',
  'rgb(var(--accent-primary))': 'var(--accent-primary)',
  'rgb(var(--accent-light))': 'var(--accent-light)'
};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(dir);
let totalChanges = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  for (const [oldStr, newStr] of Object.entries(replacements)) {
    const regexSafeOld = oldStr.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(regexSafeOld, 'g');
    content = content.replace(regex, newStr);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${path.basename(file)}`);
    totalChanges++;
  }
});

console.log(`Updated ${totalChanges} files.`);
