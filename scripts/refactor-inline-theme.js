const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../apps/frontend');

const replacements = {
  // text
  '"#fdf6f0"': '"rgb(var(--text-primary))"',
  '"#8a7a6a"': '"rgb(var(--text-muted))"',
  '"#d4a373"': '"rgb(var(--text-secondary))"',
  
  // surface / base
  '"#1c1712"': '"rgb(var(--bg-surface))"',
  '"var(--bg-base)"': '"rgb(var(--bg-base))"',
  
  // glass
  '"rgba(255,237,213,0.05)"': '"var(--glass-bg)"',
  '"rgba(255,237,213,0.02)"': '"rgba(var(--glass-bg-rgb),0.02)"',
  '"rgba(255,237,213,0.1)"': '"rgba(var(--glass-bg-rgb),0.1)"',
  
  // borders
  '"rgba(255,180,120,0.14)"': '"var(--border-subtle)"',
  '"rgba(255,180,120,0.08)"': '"rgba(var(--border-subtle-rgb),0.08)"',
  '"rgba(255,180,120,0.18)"': '"rgba(var(--border-subtle-rgb),0.18)"',
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
    // Escape string for regex, doing a global replace
    // We only replace exact strings in the code
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
