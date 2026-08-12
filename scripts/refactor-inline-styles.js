const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../apps/frontend');

const replacements = [
  { regex: /"#fdf6f0"/g, replacement: '"rgb(var(--text-primary))"' },
  { regex: /"#8a7a6a"/g, replacement: '"rgb(var(--text-muted))"' },
  { regex: /"#d4a373"/g, replacement: '"rgb(var(--text-secondary))"' },
  { regex: /"#1c1712"/g, replacement: '"rgb(var(--bg-surface))"' },
  { regex: /"rgba\(255,237,213,0\.05\)"/g, replacement: '"var(--glass-bg)"' },
  { regex: /"rgba\(255,237,213,0\.1\)"/g, replacement: '"rgba(var(--glass-bg-rgb),0.1)"' },
  { regex: /"rgba\(255,237,213,0\.02\)"/g, replacement: '"rgba(var(--glass-bg-rgb),0.02)"' },
  { regex: /rgba\(255,180,120,0\.14\)/g, replacement: 'var(--border-subtle)' },
  { regex: /rgba\(255,180,120,0\.08\)/g, replacement: 'rgba(var(--border-subtle-rgb),0.08)' },
  { regex: /rgba\(255,180,120,0\.18\)/g, replacement: 'rgba(var(--border-subtle-rgb),0.18)' },
];

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
  
  replacements.forEach(({ regex, replacement }) => {
    content = content.replace(regex, replacement);
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${path.basename(file)}`);
    totalChanges++;
  }
});

console.log(`Updated ${totalChanges} files.`);
