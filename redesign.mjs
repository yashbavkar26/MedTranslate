import fs from 'fs';

const indexPath = './frontend/src/index.css';
let indexCss = fs.readFileSync(indexPath, 'utf8');
indexCss = indexCss.replace('from-blue-500 to-purple-600', 'from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/60 transition-all hover:scale-105');
indexCss = indexCss.replace('ring-blue-500', 'ring-cyan-400');
fs.writeFileSync(indexPath, indexCss, 'utf8');

const appPath = './frontend/src/App.tsx';
let appCode = fs.readFileSync(appPath, 'utf8');

// 1. Update themeColors
appCode = appCode.replace(/const themeColors = {[\s\S]*?};/, 
`const themeColors = {
    bg: isDark ? '#050b14' : '#f4fbff',
    card: isDark ? '#0a1628' : '#ffffff',
    border: isDark ? '#1a2c47' : '#dcfce7',
    text: isDark ? '#e0f2fe' : '#0f172a',
  };`);

// 2. Button and Text class replacements
appCode = appCode.replace(/text-blue-500/g, 'text-teal-500 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]');
appCode = appCode.replace(/text-blue-600/g, 'text-teal-600');
appCode = appCode.replace(/bg-blue-600/g, 'bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30');
appCode = appCode.replace(/hover:bg-blue-700/g, 'hover:from-teal-400 hover:to-cyan-500 hover:shadow-cyan-500/50 hover:scale-105 active:scale-95 transition-all');
appCode = appCode.replace(/bg-blue-50/g, 'bg-emerald-50');
appCode = appCode.replace(/border-blue-200/g, 'border-emerald-200');

// 3. Make Landing Title POP
appCode = appCode.replace(/className="text-5xl font-black mb-4" style={{ color: themeColors.text }}/g, 
'className="text-6xl font-black mb-6 bg-gradient-to-r from-teal-400 to-cyan-500 text-transparent bg-clip-text tracking-tight drop-shadow-sm"');

// 4. Update the BodyMap outer glows or Dashboard UI touches
appCode = appCode.replace(/className="w-full max-w-lg p-8 rounded-3xl border shadow-2xl relative"/g, 
'className="w-full max-w-lg p-8 rounded-[2rem] border shadow-2xl shadow-cyan-900/20 relative backdrop-blur-xl"');

fs.writeFileSync(appPath, appCode, 'utf8');

console.log("UI Redesign script complete!");
