const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../apps/frontend');

const colorMap = {
  // Backgrounds
  "bg-[#171210]": "bg-base",
  "bg-[#1c1712]": "bg-surface-theme",
  "bg-[#1c1614]": "bg-surface-theme",
  "bg-[#1f1a18]": "bg-surface-theme",
  "bg-[#12122b]": "bg-surface-theme", 
  "bg-[#0d0d1a]": "bg-base", 
  "bg-[#171210]/95": "bg-base/95",
  "bg-[#1c1614]/30": "bg-surface-theme/30",
  "bg-[#1c1614]/50": "bg-surface-theme/50",
  "bg-[#1c1614]/60": "bg-surface-theme/60",
  
  // Text colors
  "text-[#fdf6f0]": "text-primary",
  "text-[#d4a373]": "text-secondary",
  "text-[#8a7a6a]": "text-muted",
  "text-[#a39486]": "text-muted", 
  
  // Accents
  "text-[#ea580c]": "text-accent",
  "bg-[#ea580c]": "bg-accent",
  "border-[#ea580c]": "border-accent",
  "from-[#ea580c]": "from-accent",
  "to-[#ea580c]": "to-accent",
  
  "text-[#f59e0b]": "text-highlight",
  "bg-[#f59e0b]": "bg-highlight",
  "border-[#f59e0b]": "border-highlight",
  "to-[#f59e0b]": "to-highlight",
  "from-[#f59e0b]": "from-highlight",
  
  // Borders
  "border-white/5": "border-border",
  "border-white/10": "border-border",
  "border-white/20": "border-border",
  "border-[#ea580c]/30": "border-accent/30",
  "border-[#f59e0b]/30": "border-highlight/30",
  "border-[rgba(255,180,120,0.14)]": "border-border",
  "border-[rgba(234,88,12,0.2)]": "border-accent/20",
  
  // Glass backgrounds
  "bg-[rgba(255,237,213,0.05)]": "bg-glass",
  "bg-[rgba(255,237,213,0.05)]/50": "bg-glass/50",
  "bg-white/5": "bg-card", 
  "bg-white/10": "bg-card", 
  "bg-[rgba(234,88,12,0.08)]": "bg-accent/10",
  "bg-[rgba(255,255,255,0.03)]": "bg-card",
  "bg-[rgba(255,255,255,0.08)]": "bg-card",
  
  // Specific tweaks
  "bg-[#ea580c]/10": "bg-accent/10",
  "bg-[#ea580c]/5": "bg-accent/5",
  "border-[#ea580c]/50": "border-accent/50",
  "hover:border-[#ea580c]/30": "hover:border-accent/30",
  "hover:text-[#ea580c]": "hover:text-accent",
  "hover:bg-[#ea580c]/10": "hover:bg-accent/10",
  
  "bg-[#f59e0b]/10": "bg-highlight/10",
  "hover:border-[#f59e0b]/30": "hover:border-highlight/30",
  
  "hover:text-[#fdf6f0]": "hover:text-primary",
  "text-white/70": "text-muted",
  "text-white/50": "text-muted",
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
  
  for (const [oldClass, newClass] of Object.entries(colorMap)) {
    // Safe replace for classes
    const regexSafeOld = oldClass.replace(/\[/g, '\\[').replace(/\]/g, '\\]').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    // Match class boundaries (quotes, spaces, backticks, or colon for modifiers)
    const regex = new RegExp(`(?<=[\"'\\\`\\s:])${regexSafeOld}(?=[\\s\"'\\\`])`, 'g');
    content = content.replace(regex, newClass);
  }
  
  // Fix inline styles in Arena/Problems
  content = content.replace(/style=\{\{\s*background:\s*["']#171210["'][^}]*\}\}/g, 'className="bg-base"');
  content = content.replace(/background:\s*["']#171210["']/g, 'background: "var(--bg-base)"');
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${path.basename(file)}`);
    totalChanges++;
  }
});

console.log(`Updated ${totalChanges} files.`);
